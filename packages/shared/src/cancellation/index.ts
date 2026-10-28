import { CancellationPolicyType } from '../types/index.js';
import { CANCELLATION_POLICIES } from '../constants/index.js';

export interface CancellationRefundInput {
  policy: CancellationPolicyType;
  cancelledBy: 'OWNER' | 'SITTER' | 'ADMIN';
  bookingStartDate: Date | string;
  cancellationDate?: Date | string;
  subtotalMinor: number;
  ownerServiceFeeMinor: number;
  ownerTotalPaidMinor: number;
}

export interface CancellationRefundResult {
  refundAmountMinor: number;
  sitterPayoutMinor: number;
  platformFeeRetainedMinor: number;
  refundPercentage: number;
  isPreCutoff: boolean;
  hoursUntilStart: number;
  explanation: string;
}

/**
 * Pure, deterministic cancellation and refund calculation engine.
 * Tests every boundary condition for Flexible, Moderate, and Strict policies.
 */
export function calculateCancellationRefund(
  input: CancellationRefundInput
): CancellationRefundResult {
  const startMs = new Date(input.bookingStartDate).getTime();
  const cancelMs = input.cancellationDate ? new Date(input.cancellationDate).getTime() : Date.now();

  const hoursUntilStart = Number(((startMs - cancelMs) / (1000 * 60 * 60)).toFixed(2));

  // 1. Sitter cancellation rule:
  // If the sitter cancels, the pet owner ALWAYS gets a 100% complete refund including all platform fees.
  if (input.cancelledBy === 'SITTER') {
    return {
      refundAmountMinor: input.ownerTotalPaidMinor,
      sitterPayoutMinor: 0,
      platformFeeRetainedMinor: 0,
      refundPercentage: 100,
      isPreCutoff: true,
      hoursUntilStart,
      explanation: 'Sitter initiated cancellation: 100% full refund issued to owner including platform service fees.',
    };
  }

  // 2. Admin override:
  // Admin ops can grant 100% full refund under extenuating circumstances or platform guarantee.
  if (input.cancelledBy === 'ADMIN') {
    return {
      refundAmountMinor: input.ownerTotalPaidMinor,
      sitterPayoutMinor: 0,
      platformFeeRetainedMinor: 0,
      refundPercentage: 100,
      isPreCutoff: true,
      hoursUntilStart,
      explanation: 'Administrative override: Full refund authorized by Trust & Safety ops.',
    };
  }

  // 3. Owner cancellation:
  // Evaluated strictly according to host cancellation policy
  const subtotal = input.subtotalMinor;
  let refundPercentage = 0;
  let isPreCutoff = false;
  let explanation = '';

  if (input.policy === 'FLEXIBLE') {
    // Cutoff: 24 hours
    if (hoursUntilStart >= 24) {
      isPreCutoff = true;
      refundPercentage = 100;
      explanation = 'Cancelled >= 24h before stay: 100% stay subtotal refunded under Flexible policy.';
    } else {
      isPreCutoff = false;
      refundPercentage = 50;
      explanation = 'Cancelled < 24h before stay: 50% stay subtotal refunded under Flexible policy.';
    }
  } else if (input.policy === 'MODERATE') {
    // Cutoff: 120 hours (5 days)
    if (hoursUntilStart >= 120) {
      isPreCutoff = true;
      refundPercentage = 100;
      explanation = 'Cancelled >= 5 days before stay: 100% stay subtotal refunded under Moderate policy.';
    } else {
      isPreCutoff = false;
      refundPercentage = 50;
      explanation = 'Cancelled < 5 days before stay: 50% stay subtotal refunded under Moderate policy.';
    }
  } else if (input.policy === 'STRICT') {
    // Strict policy:
    // >= 168 hours (7 days): 100% refund
    // 24h to 168h: 50% refund
    // < 24h (same day): 0% refund
    if (hoursUntilStart >= 168) {
      isPreCutoff = true;
      refundPercentage = 100;
      explanation = 'Cancelled >= 7 days before stay: 100% stay subtotal refunded under Strict policy.';
    } else if (hoursUntilStart >= 24) {
      isPreCutoff = false;
      refundPercentage = 50;
      explanation = 'Cancelled between 1 and 7 days before stay: 50% stay subtotal refunded under Strict policy.';
    } else {
      isPreCutoff = false;
      refundPercentage = 0;
      explanation = 'Cancelled < 24h before stay: 0% stay refund under Strict policy.';
    }
  } else {
    // Default fallback to Moderate
    isPreCutoff = hoursUntilStart >= 120;
    refundPercentage = isPreCutoff ? 100 : 50;
    explanation = `${refundPercentage}% refund applied under default policy.`;
  }

  // Calculate minor units
  const subtotalRefundMinor = Math.round((subtotal * refundPercentage) / 100);
  const sitterCompensationMinor = subtotal - subtotalRefundMinor;

  // Platform service fee is retained on owner cancellations to cover payment processing
  const platformFeeRetainedMinor = input.ownerServiceFeeMinor;
  const refundAmountMinor = subtotalRefundMinor;

  return {
    refundAmountMinor,
    sitterPayoutMinor: sitterCompensationMinor,
    platformFeeRetainedMinor,
    refundPercentage,
    isPreCutoff,
    hoursUntilStart,
    explanation,
  };
}
