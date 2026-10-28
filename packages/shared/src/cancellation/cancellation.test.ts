import { describe, it, expect } from 'vitest';
import { calculateCancellationRefund } from './index.js';

describe('Cancellation Policy & Automatic Refund Engine', () => {
  const baseBooking = {
    bookingStartDate: '2026-11-10T12:00:00.000Z',
    subtotalMinor: 20000, // $200.00
    ownerServiceFeeMinor: 1400, // $14.00 (7%)
    ownerTotalPaidMinor: 21400, // $214.00
  };

  describe('Sitter and Admin Cancellation Rules', () => {
    it('grants 100% full refund of total paid (including service fee) when cancelled by SITTER', () => {
      const result = calculateCancellationRefund({
        ...baseBooking,
        policy: 'STRICT',
        cancelledBy: 'SITTER',
        cancellationDate: '2026-11-10T11:00:00.000Z', // 1 hour before stay
      });

      expect(result.refundAmountMinor).toBe(21400); // Full $214.00
      expect(result.sitterPayoutMinor).toBe(0);
      expect(result.platformFeeRetainedMinor).toBe(0);
      expect(result.refundPercentage).toBe(100);
    });

    it('grants 100% full refund when cancelled by ADMIN under platform guarantee', () => {
      const result = calculateCancellationRefund({
        ...baseBooking,
        policy: 'STRICT',
        cancelledBy: 'ADMIN',
        cancellationDate: '2026-11-10T11:59:00.000Z',
      });

      expect(result.refundAmountMinor).toBe(21400);
      expect(result.sitterPayoutMinor).toBe(0);
      expect(result.platformFeeRetainedMinor).toBe(0);
      expect(result.refundPercentage).toBe(100);
    });
  });

  describe('FLEXIBLE Policy (24h cutoff)', () => {
    it('refunds 100% of subtotal when cancelled >= 24h before stay', () => {
      // Exactly 24h before (2026-11-09 12:00:00)
      const result = calculateCancellationRefund({
        ...baseBooking,
        policy: 'FLEXIBLE',
        cancelledBy: 'OWNER',
        cancellationDate: '2026-11-09T12:00:00.000Z',
      });

      expect(result.isPreCutoff).toBe(true);
      expect(result.refundPercentage).toBe(100);
      expect(result.refundAmountMinor).toBe(20000); // 100% of subtotal
      expect(result.sitterPayoutMinor).toBe(0);
      expect(result.platformFeeRetainedMinor).toBe(1400); // 7% fee retained
    });

    it('refunds 50% of subtotal when cancelled < 24h before stay', () => {
      // 23 hours before (2026-11-09 13:00:00)
      const result = calculateCancellationRefund({
        ...baseBooking,
        policy: 'FLEXIBLE',
        cancelledBy: 'OWNER',
        cancellationDate: '2026-11-09T13:00:00.000Z',
      });

      expect(result.isPreCutoff).toBe(false);
      expect(result.refundPercentage).toBe(50);
      expect(result.refundAmountMinor).toBe(10000); // 50% of $200
      expect(result.sitterPayoutMinor).toBe(10000); // $100 compensation to sitter
      expect(result.platformFeeRetainedMinor).toBe(1400);
    });
  });

  describe('MODERATE Policy (120h / 5 days cutoff)', () => {
    it('refunds 100% of subtotal when cancelled >= 5 days before stay', () => {
      // 5 days before (2026-11-05 12:00:00)
      const result = calculateCancellationRefund({
        ...baseBooking,
        policy: 'MODERATE',
        cancelledBy: 'OWNER',
        cancellationDate: '2026-11-05T12:00:00.000Z',
      });

      expect(result.isPreCutoff).toBe(true);
      expect(result.refundPercentage).toBe(100);
      expect(result.refundAmountMinor).toBe(20000);
      expect(result.sitterPayoutMinor).toBe(0);
    });

    it('refunds 50% of subtotal when cancelled 4 days before stay', () => {
      // 4 days before (96h until start)
      const result = calculateCancellationRefund({
        ...baseBooking,
        policy: 'MODERATE',
        cancelledBy: 'OWNER',
        cancellationDate: '2026-11-06T12:00:00.000Z',
      });

      expect(result.isPreCutoff).toBe(false);
      expect(result.refundPercentage).toBe(50);
      expect(result.refundAmountMinor).toBe(10000);
      expect(result.sitterPayoutMinor).toBe(10000);
    });
  });

  describe('STRICT Policy (168h / 7 days & 24h cutoffs)', () => {
    it('refunds 100% of subtotal when cancelled >= 7 days before stay', () => {
      // Exactly 7 days before (168h: 2026-11-03 12:00:00)
      const result = calculateCancellationRefund({
        ...baseBooking,
        policy: 'STRICT',
        cancelledBy: 'OWNER',
        cancellationDate: '2026-11-03T12:00:00.000Z',
      });

      expect(result.isPreCutoff).toBe(true);
      expect(result.refundPercentage).toBe(100);
      expect(result.refundAmountMinor).toBe(20000);
      expect(result.sitterPayoutMinor).toBe(0);
    });

    it('refunds 50% of subtotal when cancelled between 1 day and 7 days before stay', () => {
      // 3 days before (72h: 2026-11-07 12:00:00)
      const result = calculateCancellationRefund({
        ...baseBooking,
        policy: 'STRICT',
        cancelledBy: 'OWNER',
        cancellationDate: '2026-11-07T12:00:00.000Z',
      });

      expect(result.isPreCutoff).toBe(false);
      expect(result.refundPercentage).toBe(50);
      expect(result.refundAmountMinor).toBe(10000);
      expect(result.sitterPayoutMinor).toBe(10000);
    });

    it('refunds 0% of subtotal when cancelled < 24h before stay (same-day)', () => {
      // 10 hours before start (2026-11-10 02:00:00)
      const result = calculateCancellationRefund({
        ...baseBooking,
        policy: 'STRICT',
        cancelledBy: 'OWNER',
        cancellationDate: '2026-11-10T02:00:00.000Z',
      });

      expect(result.isPreCutoff).toBe(false);
      expect(result.refundPercentage).toBe(0);
      expect(result.refundAmountMinor).toBe(0);
      expect(result.sitterPayoutMinor).toBe(20000); // 100% of subtotal paid to sitter
      expect(result.platformFeeRetainedMinor).toBe(1400);
    });
  });

  describe('Default Fallback Policy Handling', () => {
    it('falls back safely to Moderate policy if an unexpected policy key is encountered', () => {
      const resultPre = calculateCancellationRefund({
        ...baseBooking,
        policy: 'UNEXPECTED' as any,
        cancelledBy: 'OWNER',
        cancellationDate: '2026-11-01T12:00:00.000Z', // 9 days before
      });

      expect(resultPre.refundPercentage).toBe(100);
      expect(resultPre.refundAmountMinor).toBe(20000);

      const resultPost = calculateCancellationRefund({
        ...baseBooking,
        policy: 'UNEXPECTED' as any,
        cancelledBy: 'OWNER',
        cancellationDate: '2026-11-09T12:00:00.000Z', // 1 day before (< 120h)
      });

      expect(resultPost.refundPercentage).toBe(50);
      expect(resultPost.refundAmountMinor).toBe(10000);
    });

    it('defaults cancellationDate to current timestamp when omitted', () => {
      // Future booking starting next year
      const futureStart = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const result = calculateCancellationRefund({
        ...baseBooking,
        bookingStartDate: futureStart,
        policy: 'FLEXIBLE',
        cancelledBy: 'OWNER',
      });

      expect(result.isPreCutoff).toBe(true);
      expect(result.refundPercentage).toBe(100);
      expect(result.hoursUntilStart).toBeGreaterThan(600);
    });
  });
});
