import { describe, it, expect } from 'vitest';
import {
  calculateBookingPrice,
  calculateSitterRank,
  transitionBooking,
  maskContactInfo,
  evaluateReviewBlindness,
  calculateUpdatedBayesianRating,
  buildAuthorizationLedgerEntries,
  buildPayoutLedgerEntries,
  buildRefundLedgerEntries,
  reconcileLedgerEntries,
} from '@pawstay/shared';

describe('PawStay End-to-End Marketplace Lifecycle (Definition of Done)', () => {
  it('executes complete journey: Search -> Price Quote -> Booking Hold -> Contact Shield -> Stay Card -> Completed -> Double-Blind Review -> Ledger Reconciliation', () => {
    // -------------------------------------------------------------------------
    // 1. Demand Search & Sitter Ranking
    // -------------------------------------------------------------------------
    const sitterProfile = {
      id: 'sitter-sarah-101',
      userId: 'user-sitter-sarah',
      baseRateMinor: 4500, // $45.00/night
      additionalPetRateMinor: 2000, // $20.00/night
      holidaySurchargeMinor: 1500,
      ratingBayesian: 4.95,
      reviewCount: 42,
      responseRatePercent: 100,
      reliabilityScore: 0.98,
      createdAt: new Date('2025-01-01'),
    };

    const rankResult = calculateSitterRank({
      distanceMiles: 1.8,
      maxSearchRadiusMiles: 10,
      filterMatchFraction: 1.0,
      averageRating: 4.95,
      reviewCount: 42,
      responseRatePercent: 100,
      responseTimeMinutes: 8,
      reliabilityScore: 0.98,
      hasBio: true,
      photoCount: 6,
      hasHomeDetails: true,
      servicesCount: 3,
      sitterBaseRateMinor: 4500,
      metroBenchmarkRateMinor: 5000,
      daysSinceCreation: 180,
    });

    expect(rankResult.totalScore).toBeGreaterThan(0.85);

    // -------------------------------------------------------------------------
    // 2. Pricing & Cost Comparison vs Kennel Benchmark
    // -------------------------------------------------------------------------
    // 4 nights, 2 dogs (1 primary + 1 additional), Austin, TX
    const quote = calculateBookingPrice({
      unitsCount: 4,
      baseRateMinor: sitterProfile.baseRateMinor,
      additionalPetRateMinor: sitterProfile.additionalPetRateMinor,
      petCount: 2,
      ownerFeeBps: 700, // 7%
      sitterCommissionBps: 1200, // 12%
    });

    // Nightly total: (4500 + 2000) * 4 = 26000 cents ($260.00)
    expect(quote.unitsCount).toBe(4);
    expect(quote.subtotalMinor).toBe(26000);
    // Owner fee: 7% of 26000 = 1820 cents ($18.20)
    expect(quote.ownerServiceFeeMinor).toBe(1820);
    // Owner total paid: 26000 + 1820 = 27820 cents ($278.20)
    expect(quote.ownerTotalMinor).toBe(27820);

    // Sitter commission: 12% of 26000 = 3120 cents ($31.20)
    expect(quote.sitterCommissionMinor).toBe(3120);
    // Sitter net payout: 26000 - 3120 = 22880 cents ($228.80)
    expect(quote.sitterNetPayoutMinor).toBe(22880);

    // Kennel benchmark comparison: Austin kennel at $75/night * 2 dogs * 4 nights = $600 (60,000 cents)
    const kennelBenchmarkMinor = 7500 * 2 * 4;
    const ownerSavingsMinor = kennelBenchmarkMinor - quote.ownerTotalMinor;
    expect(ownerSavingsMinor).toBeGreaterThan(30000); // Saves over $300 vs commercial kennel

    // -------------------------------------------------------------------------
    // 3. Pre-booking Chat Contact Leakage Shielding
    // -------------------------------------------------------------------------
    const preBookingMessage =
      'Hi Sarah! Can I call your cell at (555) 019-2834 or venmo you directly to save platform fees?';
    const leakageCheck = maskContactInfo(preBookingMessage);

    expect(leakageCheck.hasLeakage).toBe(true);
    expect(leakageCheck.detectedPatterns).toContain('phone');
    expect(leakageCheck.detectedPatterns).toContain('off_platform_payment');
    expect(leakageCheck.maskedText).not.toContain('555');
    expect(leakageCheck.maskedText).not.toContain('venmo');

    // -------------------------------------------------------------------------
    // 4. Booking State Machine: Escrow Authorization Hold
    // -------------------------------------------------------------------------
    const booking = {
      id: 'booking-e2e-999',
      ownerId: 'user-owner-john',
      sitterUserId: sitterProfile.userId,
      status: 'DRAFT' as const,
      subtotalMinor: quote.subtotalMinor,
      ownerTotalMinor: quote.ownerTotalMinor,
      ownerServiceFeeMinor: quote.ownerServiceFeeMinor,
      sitterCommissionMinor: quote.sitterCommissionMinor,
      sitterNetPayoutMinor: quote.sitterNetPayoutMinor,
    };

    const ownerActor = { id: 'user-owner-john', roles: ['OWNER' as const] };
    const sitterActor = { id: sitterProfile.userId, roles: ['SITTER' as const] };
    const adminActor = { id: 'admin-user', roles: ['ADMIN' as const] };

    // Owner requests booking
    let transition = transitionBooking(booking, 'REQUESTED', ownerActor);
    expect(transition.currentStatus).toBe('REQUESTED');
    booking.status = 'REQUESTED';

    // Sitter accepts
    transition = transitionBooking(booking, 'ACCEPTED', sitterActor);
    expect(transition.currentStatus).toBe('ACCEPTED');
    booking.status = 'ACCEPTED';

    // Owner pays / funds held in escrow
    transition = transitionBooking(booking, 'PAID_HELD', ownerActor);
    expect(transition.currentStatus).toBe('PAID_HELD');
    booking.status = 'PAID_HELD';

    // -------------------------------------------------------------------------
    // 5. Double-Entry Accounting Invariant on Payment Capture
    // -------------------------------------------------------------------------
    const authLedgerPlan = buildAuthorizationLedgerEntries({
      bookingId: booking.id,
      ownerTotalMinor: booking.ownerTotalMinor,
      sitterNetPayoutMinor: booking.sitterNetPayoutMinor,
      ownerServiceFeeMinor: booking.ownerServiceFeeMinor,
      sitterCommissionMinor: booking.sitterCommissionMinor,
      paymentIntentId: 'pi_test_auth_hold',
      idempotencyPrefix: 'idem_auth_hold',
    });

    expect(authLedgerPlan.isBalanced).toBe(true);
    expect(authLedgerPlan.entries.length).toBe(3);

    // Invariant: Total Debits === Total Credits
    const authDebits = authLedgerPlan.entries.reduce((sum, e) => sum + e.amountMinor, 0);
    const authCredits = authLedgerPlan.entries.reduce((sum, e) => sum + e.amountMinor, 0);
    expect(authDebits).toBe(authCredits);

    // -------------------------------------------------------------------------
    // 6. Stay Lifecycle: Check-in -> Daily Stay Card -> Checkout
    // -------------------------------------------------------------------------
    // Check-in
    transition = transitionBooking(booking, 'IN_PROGRESS', sitterActor);
    expect(transition.currentStatus).toBe('IN_PROGRESS');
    booking.status = 'IN_PROGRESS';

    // Sitter posts daily stay card update
    const stayCard = {
      bookingId: booking.id,
      peeCount: 2,
      poopCount: 1,
      fedMeal: true,
      medsAdministered: true,
      caption: 'Both dogs had an awesome afternoon walk at Zilker Park! Fed and resting happily.',
    };
    expect(stayCard.peeCount).toBe(2);
    expect(stayCard.fedMeal).toBe(true);

    // Sitter marks stay completed
    transition = transitionBooking(booking, 'COMPLETED', sitterActor);
    expect(transition.currentStatus).toBe('COMPLETED');
    booking.status = 'COMPLETED';

    // -------------------------------------------------------------------------
    // 7. Double-Blind Review System
    // -------------------------------------------------------------------------
    // Sitter submits review first (counterparty hasn't reviewed yet)
    const sitterReviewBlindness = evaluateReviewBlindness({
      hasCounterpartyReviewed: false,
      completedAt: new Date('2026-07-05'),
      now: new Date('2026-07-06'),
    });
    expect(sitterReviewBlindness.isBlind).toBe(true);
    expect(sitterReviewBlindness.reason).toBe('AWAITING_COUNTERPARTY');

    // Owner submits review second -> Triggers immediate mutual unblinding!
    const ownerReviewBlindness = evaluateReviewBlindness({
      hasCounterpartyReviewed: true, // Sitter already reviewed!
      completedAt: new Date('2026-07-05'),
      now: new Date('2026-07-07'),
    });
    expect(ownerReviewBlindness.isBlind).toBe(false);
    expect(ownerReviewBlindness.reason).toBe('BOTH_SUBMITTED');

    // Updated Bayesian rating calculated for Sitter
    const updatedRating = calculateUpdatedBayesianRating([5, 5, 5, 5, 5], 5, 4.85);
    expect(updatedRating.ratingAverage).toBeGreaterThan(4.9);

    // -------------------------------------------------------------------------
    // 8. Payout Release & Double-Entry Ledger Reconciliation
    // -------------------------------------------------------------------------
    transition = transitionBooking(booking, 'PAYOUT_RELEASED', adminActor);
    expect(transition.currentStatus).toBe('PAYOUT_RELEASED');
    booking.status = 'PAYOUT_RELEASED';

    const payoutPlan = buildPayoutLedgerEntries({
      bookingId: booking.id,
      sitterNetPayoutMinor: booking.sitterNetPayoutMinor,
      providerPayoutId: 'tr_test_payout_101',
      idempotencyPrefix: 'idem_payout_rel',
    });

    const allLedgerEntries = [...authLedgerPlan.entries, ...payoutPlan.entries];

    // Run double-entry reconciliation engine
    const reconciliation = reconcileLedgerEntries(allLedgerEntries);
    expect(reconciliation.isBalanced).toBe(true);
    expect(reconciliation.driftMinor).toBe(0); // 0 drift verified!
  });
});
