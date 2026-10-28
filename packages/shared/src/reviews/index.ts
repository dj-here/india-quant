/**
 * Double-Blind Review Engine
 *
 * In pet care platforms, double-blind reviews prevent retaliatory or biased feedback.
 * Reviews remain completely hidden until:
 * 1. Both the pet parent and sitter have submitted their reviews, OR
 * 2. 14 days have elapsed following stay completion.
 */

export interface BlindEvaluationInput {
  hasCounterpartyReviewed: boolean;
  completedAt: Date | string | null;
  now?: Date;
}

export interface BlindEvaluationResult {
  isBlind: boolean;
  reason: 'BOTH_SUBMITTED' | 'FOURTEEN_DAY_EXPIRY' | 'AWAITING_COUNTERPARTY';
}

export const REVIEW_EXPIRY_DAYS = 14;

/**
 * Determines whether a submitted review should be blind or revealed.
 */
export function evaluateReviewBlindness(input: BlindEvaluationInput): BlindEvaluationResult {
  const now = input.now || new Date();

  // 1. If counterparty has already submitted, both are revealed immediately
  if (input.hasCounterpartyReviewed) {
    return {
      isBlind: false,
      reason: 'BOTH_SUBMITTED',
    };
  }

  // 2. If 14 days have passed since stay completion, review is revealed automatically
  if (input.completedAt) {
    const completedDate = new Date(input.completedAt);
    const msSinceCompletion = now.getTime() - completedDate.getTime();
    const daysSinceCompletion = msSinceCompletion / (1000 * 60 * 60 * 24);

    if (daysSinceCompletion >= REVIEW_EXPIRY_DAYS) {
      return {
        isBlind: false,
        reason: 'FOURTEEN_DAY_EXPIRY',
      };
    }
  }

  // 3. Otherwise, remains blind waiting for counterparty or 14-day window
  return {
    isBlind: true,
    reason: 'AWAITING_COUNTERPARTY',
  };
}

/**
 * Computes updated Bayesian average rating for a sitter.
 * Formula: (C * m + sum(ratings)) / (C + n)
 * where C = prior weight (default 5 reviews), m = platform prior (default 4.85 stars).
 */
export function calculateUpdatedBayesianRating(
  ratings: number[],
  priorWeight: number = 5,
  platformPrior: number = 4.85
): { ratingAverage: number; reviewCount: number } {
  const n = ratings.length;
  if (n === 0) {
    return { ratingAverage: platformPrior, reviewCount: 0 };
  }

  const sumRatings = ratings.reduce((acc, r) => acc + r, 0);
  const bayesian = (priorWeight * platformPrior + sumRatings) / (priorWeight + n);
  const rounded = Math.round(bayesian * 100) / 100;

  return {
    ratingAverage: rounded,
    reviewCount: n,
  };
}
