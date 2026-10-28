import { PrismaClient } from '@pawstay/db';
import pino from 'pino';

const logger = pino({ name: 'update-nudge-worker' });

export interface UpdateNudgeResult {
  scannedBookings: number;
  nudgesSent: number;
  bookingIds: string[];
}

/**
 * Daily Update Nudge Worker
 *
 * Runs periodically (e.g. daily at 4:00 PM local time). Scans all active stays
 * in IN_PROGRESS. If no UpdatePost was posted in the last 24 hours, sends a high-priority
 * notification to the sitter with a direct link to post photos and care notes.
 */
export async function executeDailyUpdateNudge(
  prisma: Pick<PrismaClient, 'booking' | 'notification'>,
  now: Date = new Date()
): Promise<UpdateNudgeResult> {
  logger.info({ timestamp: now.toISOString() }, 'Starting Daily Update Nudge scan...');

  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 1. Fetch active bookings in progress
  const activeBookings = await prisma.booking.findMany({
    where: {
      status: 'IN_PROGRESS',
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      sitter: { include: { user: true } },
      bookingPets: { include: { pet: true } },
      updates: {
        where: {
          createdAt: { gte: twentyFourHoursAgo },
        },
      },
    },
  });

  const nudgedBookingIds: string[] = [];

  for (const booking of activeBookings) {
    // If no update post in the last 24 hours, send nudge
    if (booking.updates.length === 0) {
      const petNames = booking.bookingPets.map((p) => p.pet.name).join(' & ') || 'pet';

      await prisma.notification.create({
        data: {
          userId: booking.sitter.userId,
          title: `Daily Photo Reminder for ${petNames}`,
          message: `Pet parents love seeing daily photos and bathroom logs! Don't forget to send an update for Booking #${booking.bookingNumber} today.`,
          actionUrl: `/bookings/${booking.id}/updates`,
          type: 'UPDATE_NUDGE',
        },
      });

      nudgedBookingIds.push(booking.id);
      logger.info(
        {
          bookingId: booking.id,
          sitterUserId: booking.sitter.userId,
          petNames,
        },
        'Sent daily update nudge notification to sitter'
      );
    }
  }

  logger.info(
    {
      scannedBookings: activeBookings.length,
      nudgesSent: nudgedBookingIds.length,
    },
    'Daily Update Nudge scan completed'
  );

  return {
    scannedBookings: activeBookings.length,
    nudgesSent: nudgedBookingIds.length,
    bookingIds: nudgedBookingIds,
  };
}
