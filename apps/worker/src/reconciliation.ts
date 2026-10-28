import { prisma } from '@pawstay/db';
import { reconcileLedgerEntries } from '@pawstay/shared';
import pino from 'pino';

const logger = pino({ name: 'ledger-reconciliation' });

export interface ReconciliationReport {
  timestamp: string;
  totalEntriesAudited: number;
  totalDebitsMinor: number;
  totalCreditsMinor: number;
  driftMinor: number;
  isBalanced: boolean;
  bookingsWithDrift: string[];
  accountBalances: Record<string, number>;
}

/**
 * Nightly Ledger Reconciliation Job.
 * Sweeps all double-entry ledger records and verifies financial balance across all ledger accounts.
 * Throws or alerts if drift > 0 cents.
 */
export async function runLedgerReconciliation(): Promise<ReconciliationReport> {
  logger.info('Starting nightly double-entry ledger reconciliation sweep...');

  const entries = await prisma.ledgerEntry.findMany({
    select: {
      bookingId: true,
      debitAccount: true,
      creditAccount: true,
      amountMinor: true,
    },
  });

  const recon = reconcileLedgerEntries(entries);

  // Check per-booking balance
  const bookingEntriesMap = new Map<string, typeof entries>();
  for (const e of entries) {
    if (!bookingEntriesMap.has(e.bookingId)) {
      bookingEntriesMap.set(e.bookingId, []);
    }
    bookingEntriesMap.get(e.bookingId)!.push(e);
  }

  const bookingsWithDrift: string[] = [];
  for (const [bookingId, bEntries] of bookingEntriesMap.entries()) {
    const bRecon = reconcileLedgerEntries(bEntries);
    if (!bRecon.isBalanced) {
      bookingsWithDrift.push(bookingId);
      logger.error(
        { bookingId, driftMinor: bRecon.driftMinor },
        'CRITICAL: Financial ledger drift detected on booking!'
      );
    }
  }

  const report: ReconciliationReport = {
    timestamp: new Date().toISOString(),
    totalEntriesAudited: entries.length,
    totalDebitsMinor: recon.totalDebitsMinor,
    totalCreditsMinor: recon.totalCreditsMinor,
    driftMinor: recon.driftMinor,
    isBalanced: recon.isBalanced && bookingsWithDrift.length === 0,
    bookingsWithDrift,
    accountBalances: recon.accountBalances,
  };

  // Record audit log entry
  await prisma.auditLog.create({
    data: {
      action: recon.isBalanced ? 'LEDGER_RECONCILIATION_BALANCED' : 'LEDGER_RECONCILIATION_DRIFT_ALERT',
      entityType: 'FinancialLedger',
      entityId: `recon_${Date.now()}`,
      metadata: report as any,
    },
  });

  if (!report.isBalanced) {
    logger.fatal(
      { driftMinor: recon.driftMinor, bookingsWithDrift },
      'ALERT: Ledger reconciliation failed. Immediate ops intervention required!'
    );
  } else {
    logger.info(
      {
        totalEntries: entries.length,
        totalVolumeMinor: recon.totalDebitsMinor,
      },
      'Double-entry ledger reconciliation verified: 0 drift.'
    );
  }

  return report;
}
