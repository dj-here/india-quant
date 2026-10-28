/**
 * Core constants for PawStay marketplace
 */

export const BRAND_NAME = 'PawStay';
export const DEFAULT_CURRENCY = 'USD';

// Platform fees stored in Basis Points (100 bps = 1.00%)
export const DEFAULT_OWNER_SERVICE_FEE_BPS = 700; // 7.00%
export const DEFAULT_SITTER_COMMISSION_BPS = 1200; // 12.00%

// Booking expiry in hours (if sitter does not respond to a REQUESTED booking)
export const BOOKING_EXPIRY_HOURS = 24;

// Automatic payout release delay after stay completion (hours)
export const PAYOUT_RELEASE_DELAY_HOURS = 24;

// Review window in days (double-blind until both submitted or window expires)
export const REVIEW_WINDOW_DAYS = 14;

// Sitter ranking weight distribution (must sum to 1.0)
export const RANKING_WEIGHTS = {
  RELEVANCE: 0.30,
  RATING_BAYESIAN: 0.25,
  RESPONSE_QUALITY: 0.15,
  RELIABILITY: 0.10,
  PROFILE_COMPLETENESS: 0.10,
  PRICE_COMPETITIVENESS: 0.10,
} as const;

// Bayesian prior settings for sitter ratings
export const BAYESIAN_PRIOR_COUNT = 5; // pseudo-reviews
export const BAYESIAN_PRIOR_RATING = 4.8; // platform target baseline

// Booking State Machine Transitions
export const VALID_BOOKING_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['REQUESTED'],
  REQUESTED: ['ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED_BY_OWNER'],
  ACCEPTED: ['PAID_HELD', 'CANCELLED_BY_OWNER', 'CANCELLED_BY_SITTER'],
  DECLINED: [],
  EXPIRED: [],
  PAID_HELD: ['IN_PROGRESS', 'CANCELLED_BY_OWNER', 'CANCELLED_BY_SITTER', 'DISPUTED'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
  COMPLETED: ['PAYOUT_RELEASED', 'DISPUTED'],
  PAYOUT_RELEASED: [],
  CANCELLED_BY_OWNER: ['REFUNDED'],
  CANCELLED_BY_SITTER: ['REFUNDED'],
  DISPUTED: ['REFUNDED', 'COMPLETED', 'PAYOUT_RELEASED'],
  REFUNDED: [],
} as const;

// Cancellation Policies
export const CANCELLATION_POLICIES = {
  FLEXIBLE: {
    name: 'Flexible',
    description: 'Full refund up to 1 day before booking starts; 50% refund thereafter.',
    cutoffHours: 24,
    preCutoffRefundPercent: 100,
    postCutoffRefundPercent: 50,
  },
  MODERATE: {
    name: 'Moderate',
    description: 'Full refund up to 5 days before booking starts; 50% refund thereafter.',
    cutoffHours: 120,
    preCutoffRefundPercent: 100,
    postCutoffRefundPercent: 50,
  },
  STRICT: {
    name: 'Strict',
    description: 'Full refund up to 7 days before booking starts; 50% refund up to 1 day before; 0% refund on same day.',
    cutoffHours: 168,
    preCutoffRefundPercent: 100,
    postCutoffRefundPercent: 50,
  },
} as const;
