import pino from 'pino';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { runLedgerReconciliation } from './reconciliation.js';
import { executeDailyUpdateNudge } from './update-nudge.js';
import { prisma } from '@pawstay/db';

const logger = pino({
  name: 'pawstay-worker',
  level: process.env.LOG_LEVEL || 'info',
});

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy(times) {
    logger.warn({ attempt: times }, 'Retrying Redis connection in background worker...');
    return Math.min(times * 1000, 15000);
  },
});

export const QUEUE_NAMES = {
  BOOKING_EXPIRY: 'pawstay:booking-expiry',
  PAYOUT_RELEASE: 'pawstay:payout-release',
  REVIEW_REVEAL: 'pawstay:review-reveal',
  LEDGER_RECONCILIATION: 'pawstay:ledger-reconciliation',
  DAILY_UPDATE_NUDGE: 'pawstay:daily-update-nudge',
  NOTIFICATIONS: 'pawstay:notifications',
} as const;

export async function startWorker() {
  logger.info({ redisUrl: redisUrl.replace(/:[^@]+@/, ':***@') }, 'Initializing PawStay background worker...');

  try {
    await connection.connect();
    logger.info('Connected to Redis successfully.');
  } catch (err) {
    logger.warn({ error: err }, 'Redis connection deferred; running in standby mode.');
  }

  // Define booking expiry worker
  const expiryWorker = new Worker(
    QUEUE_NAMES.BOOKING_EXPIRY,
    async (job: Job) => {
      logger.info({ jobId: job.id, data: job.data }, 'Processing booking expiry sweep...');
      // Logic executed in Phase 4
      return { expiredCount: 0 };
    },
    { connection, concurrency: 5 }
  );

  // Define payout release worker
  const payoutWorker = new Worker(
    QUEUE_NAMES.PAYOUT_RELEASE,
    async (job: Job) => {
      logger.info({ jobId: job.id, data: job.data }, 'Processing scheduled payout release...');
      // Logic executed in Phase 4
      return { processedPayouts: 0 };
    },
    { connection, concurrency: 5 }
  );

  // Define double-blind review reveal worker (14 days or both submitted)
  const reviewRevealWorker = new Worker(
    QUEUE_NAMES.REVIEW_REVEAL,
    async (job: Job) => {
      logger.info({ jobId: job.id, data: job.data }, 'Processing review reveal sweep...');
      // Logic executed in Phase 6
      return { revealedReviews: 0 };
    },
    { connection, concurrency: 5 }
  );

  // Define nightly ledger reconciliation worker
  const reconciliationWorker = new Worker(
    QUEUE_NAMES.LEDGER_RECONCILIATION,
    async (job: Job) => {
      logger.info({ jobId: job.id }, 'Processing nightly double-entry ledger reconciliation...');
      const report = await runLedgerReconciliation();
      return report;
    },
    { connection, concurrency: 1 }
  );

  // Define daily stay update nudge worker
  const updateNudgeWorker = new Worker(
    QUEUE_NAMES.DAILY_UPDATE_NUDGE,
    async (job: Job) => {
      logger.info({ jobId: job.id }, 'Processing daily stay update nudge sweep...');
      const report = await executeDailyUpdateNudge(prisma);
      return report;
    },
    { connection, concurrency: 1 }
  );

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Gracefully shutting down worker processes...');
    await Promise.allSettled([
      expiryWorker.close(),
      payoutWorker.close(),
      reviewRevealWorker.close(),
      reconciliationWorker.close(),
      updateNudgeWorker.close(),
      connection.quit(),
    ]);
    logger.info('All worker queues stopped. Exiting cleanly.');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  logger.info('PawStay BullMQ Worker service online and listening for jobs.');
}

if (process.env.NODE_ENV !== 'test') {
  startWorker().catch((err) => {
    logger.error({ err }, 'Worker fatal error during startup');
  });
}
