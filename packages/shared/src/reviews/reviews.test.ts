import { describe, it, expect } from 'vitest';
import { evaluateReviewBlindness, calculateUpdatedBayesianRating } from './index';

describe('Double-Blind Review Engine', () => {
  describe('evaluateReviewBlindness', () => {
    it('reveals review immediately if counterparty has already submitted theirs', () => {
      const result = evaluateReviewBlindness({
        hasCounterpartyReviewed: true,
        completedAt: new Date('2026-06-01'),
        now: new Date('2026-06-03'),
      });

      expect(result.isBlind).toBe(false);
      expect(result.reason).toBe('BOTH_SUBMITTED');
    });

    it('keeps review blind if counterparty has not submitted and <14 days have passed', () => {
      const result = evaluateReviewBlindness({
        hasCounterpartyReviewed: false,
        completedAt: new Date('2026-06-01'),
        now: new Date('2026-06-08'), // 7 days later
      });

      expect(result.isBlind).toBe(true);
      expect(result.reason).toBe('AWAITING_COUNTERPARTY');
    });

    it('reveals review automatically after 14-day window elapses', () => {
      const result = evaluateReviewBlindness({
        hasCounterpartyReviewed: false,
        completedAt: new Date('2026-06-01T00:00:00Z'),
        now: new Date('2026-06-15T00:00:01Z'), // 14 days and 1 second later
      });

      expect(result.isBlind).toBe(false);
      expect(result.reason).toBe('FOURTEEN_DAY_EXPIRY');
    });

    it('handles null completedAt by remaining blind', () => {
      const result = evaluateReviewBlindness({
        hasCounterpartyReviewed: false,
        completedAt: null,
      });

      expect(result.isBlind).toBe(true);
      expect(result.reason).toBe('AWAITING_COUNTERPARTY');
    });
  });

  describe('calculateUpdatedBayesianRating', () => {
    it('returns platform prior when no reviews exist', () => {
      const result = calculateUpdatedBayesianRating([], 5, 4.85);
      expect(result.ratingAverage).toBe(4.85);
      expect(result.reviewCount).toBe(0);
    });

    it('smooths ratings with Bayesian prior for low review counts', () => {
      // 1 five-star review
      const result = calculateUpdatedBayesianRating([5], 5, 4.85);
      // (5 * 4.85 + 5) / 6 = (24.25 + 5) / 6 = 29.25 / 6 = 4.875 -> 4.88
      expect(result.ratingAverage).toBe(4.88);
      expect(result.reviewCount).toBe(1);
    });

    it('converges to empirical mean with large review volume', () => {
      const twentyFives = Array(20).fill(5);
      const result = calculateUpdatedBayesianRating(twentyFives, 5, 4.85);
      // (5 * 4.85 + 100) / 25 = 124.25 / 25 = 4.97
      expect(result.ratingAverage).toBe(4.97);
      expect(result.reviewCount).toBe(20);
    });
  });
});
