import { PrismaClient } from '@pawstay/db';
import pino from 'pino';
import { calculateUpdatedBayesianRating, REVIEW_EXPIRY_DAYS } from '@pawstay/shared';

const logger = pino({ name: 'review-reveal-worker' });

export interface ReviewRevealResult {
  revealedReviewsCount: number;
  affectedSitterUserIds: string[];
}

/**
 * Double-Blind Review Reveal Worker Job
 *
 * Runs periodically to reveal blind reviews when:
 * 1. Both the owner and sitter have submitted their reviews for the booking, OR
 * 2. 14 days have passed since stay completion.
 *
 * Automatically updates sitter Bayesian rating averages when new reviews become public.
 */
export async function executeReviewReveal(
  prisma: Pick<PrismaClient, 'review' | 'booking' | 'sitterProfile' | 'notification'>,
  now: Date = new Date()
): Promise<ReviewRevealResult> {
  logger.info({ timestamp: now.toISOString() }, 'Starting Review Reveal sweep...');

  const fourteenDaysAgo = new Date(now.getTime() - REVIEW_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // Find all unrevealed reviews
  const blindReviews = await prisma.review.findMany({
    where: { isBlind: true },
    include: {
      booking: true,
    },
  });

  const reviewsToRevealIds: string[] = [];
  const affectedSitterUserIds = new Set<string>();

  // Group blind reviews by bookingId
  const bookingMap = new Map<string, typeof blindReviews>();
  for (const review of blindReviews) {
    const existing = bookingMap.get(review.bookingId) || [];
    existing.push(review);
    bookingMap.set(review.bookingId, existing);
  }

  for (const [bookingId, reviews] of bookingMap.entries()) {
    const booking = reviews[0]?.booking;
    if (!booking) continue;

    let shouldReveal = false;

    // Condition 1: Both parties have submitted reviews
    if (reviews.length >= 2) {
      shouldReveal = true;
    }
    // Condition 2: 14 days elapsed since stay completion
    else if (booking.completedAt && booking.completedAt <= fourteenDaysAgo) {
      shouldReveal = true;
    }

    if (shouldReveal) {
      for (const rev of reviews) {
        reviewsToRevealIds.push(rev.id);
        if (rev.authorRole === 'OWNER') {
          // The review target is the sitter
          affectedSitterUserIds.add(rev.targetId);
        }
      }
    }
  }

  if (reviewsToRevealIds.length > 0) {
    // 1. Reveal reviews
    await prisma.review.updateMany({
      where: { id: { in: reviewsToRevealIds } },
      data: {
        isBlind: false,
        revealedAt: now,
      },
    });

    // 2. Recalculate sitter rating averages
    for (const sitterUserId of affectedSitterUserIds) {
      const allPublicReviews = await prisma.review.findMany({
        where: {
          targetId: sitterUserId,
          isBlind: false,
        },
        select: { rating: true },
      });

      const ratings = allPublicReviews.map((r) => r.rating);
      const { ratingAverage, reviewCount } = calculateUpdatedBayesianRating(ratings);

      const sitterProfile = await prisma.sitterProfile.findUnique({
        where: { userId: sitterUserId },
      });

      if (sitterProfile) {
        await prisma.sitterProfile.update({
          where: { id: sitterProfile.id },
          data: {
            ratingBayesian: ratingAverage,
            reviewCount,
          },
        });

        // Notify sitter of new public review
        await prisma.notification.create({
          data: {
            userId: sitterUserId,
            title: '⭐ New Public Review Available!',
            message: `A client review has been revealed and updated your profile score to ${ratingAverage} ★!`,
            actionUrl: `/sitter/${sitterProfile.id}`,
            type: 'REVIEW_REVEALED',
          },
        });
      }
    }
  }

  logger.info(
    {
      revealedReviewsCount: reviewsToRevealIds.length,
      affectedSitterUserIds: Array.from(affectedSitterUserIds),
    },
    'Review Reveal sweep completed'
  );

  return {
    revealedReviewsCount: reviewsToRevealIds.length,
    affectedSitterUserIds: Array.from(affectedSitterUserIds),
  };
}
