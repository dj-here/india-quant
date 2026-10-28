import { describe, it, expect } from 'vitest';
import { calculateBayesianRating, calculateSitterRank } from './index.js';

describe('Ranking Engine', () => {
  describe('calculateBayesianRating', () => {
    it('returns prior baseline (4.80) when sitter has 0 reviews', () => {
      const rating = calculateBayesianRating(5.0, 0);
      expect(rating).toBe(4.8);
    });

    it('smooths a single 5.0 review towards the baseline (not 5.00 flat)', () => {
      // (4.8 * 5 + 5.0 * 1) / 6 = (24 + 5) / 6 = 29 / 6 = 4.83
      const rating = calculateBayesianRating(5.0, 1);
      expect(rating).toBe(4.83);
    });

    it('gives full statistical confidence when sitter has many reviews (e.g. 50)', () => {
      // (4.8 * 5 + 4.95 * 50) / 55 = (24 + 247.5) / 55 = 271.5 / 55 = 4.94
      const rating = calculateBayesianRating(4.95, 50);
      expect(rating).toBe(4.94);
    });
  });

  describe('calculateSitterRank', () => {
    it('ranks closer sitter with high response rate higher than distant slow responder', () => {
      const sitterA = calculateSitterRank({
        distanceMiles: 1.5,
        maxSearchRadiusMiles: 20,
        filterMatchFraction: 1.0,
        averageRating: 4.9,
        reviewCount: 20,
        responseRatePercent: 100,
        responseTimeMinutes: 10,
        reliabilityScore: 1.0,
        hasBio: true,
        photoCount: 5,
        hasHomeDetails: true,
        servicesCount: 3,
        sitterBaseRateMinor: 4500,
        metroBenchmarkRateMinor: 5000,
        daysSinceCreation: 60,
      });

      const sitterB = calculateSitterRank({
        distanceMiles: 18.0,
        maxSearchRadiusMiles: 20,
        filterMatchFraction: 0.8,
        averageRating: 4.5,
        reviewCount: 5,
        responseRatePercent: 70,
        responseTimeMinutes: 180,
        reliabilityScore: 0.9,
        hasBio: true,
        photoCount: 1,
        hasHomeDetails: false,
        servicesCount: 1,
        sitterBaseRateMinor: 6500,
        metroBenchmarkRateMinor: 5000,
        daysSinceCreation: 60,
      });

      expect(sitterA.totalScore).toBeGreaterThan(sitterB.totalScore);
      expect(sitterA.components.relevance).toBeGreaterThan(sitterB.components.relevance);
      expect(sitterA.components.responseQuality).toBeGreaterThan(sitterB.components.responseQuality);
    });

    it('correctly scores response latency brackets (>15m, >60m, >240m)', () => {
      const fast = calculateSitterRank({
        distanceMiles: 5,
        maxSearchRadiusMiles: 20,
        filterMatchFraction: 1,
        averageRating: 5,
        reviewCount: 10,
        responseRatePercent: 100,
        responseTimeMinutes: 10,
        reliabilityScore: 1,
        hasBio: true,
        photoCount: 4,
        hasHomeDetails: true,
        servicesCount: 2,
        sitterBaseRateMinor: 5000,
        metroBenchmarkRateMinor: 5000,
        daysSinceCreation: 60,
      });

      const moderate = calculateSitterRank({
        distanceMiles: 5,
        maxSearchRadiusMiles: 20,
        filterMatchFraction: 1,
        averageRating: 5,
        reviewCount: 10,
        responseRatePercent: 100,
        responseTimeMinutes: 30, // > 15m
        reliabilityScore: 1,
        hasBio: true,
        photoCount: 4,
        hasHomeDetails: true,
        servicesCount: 2,
        sitterBaseRateMinor: 5000,
        metroBenchmarkRateMinor: 5000,
        daysSinceCreation: 60,
      });

      const slow = calculateSitterRank({
        distanceMiles: 5,
        maxSearchRadiusMiles: 20,
        filterMatchFraction: 1,
        averageRating: 5,
        reviewCount: 10,
        responseRatePercent: 100,
        responseTimeMinutes: 300, // > 240m
        reliabilityScore: 1,
        hasBio: true,
        photoCount: 4,
        hasHomeDetails: true,
        servicesCount: 2,
        sitterBaseRateMinor: 5000,
        metroBenchmarkRateMinor: 5000,
        daysSinceCreation: 60,
      });

      expect(fast.components.responseQuality).toBeGreaterThan(moderate.components.responseQuality);
      expect(moderate.components.responseQuality).toBeGreaterThan(slow.components.responseQuality);
    });

    it('grants a time-decayed new-sitter boost to new hosts with 0 reviews', () => {
      const brandNewSitter = calculateSitterRank({
        distanceMiles: 2.0,
        maxSearchRadiusMiles: 20,
        filterMatchFraction: 1.0,
        averageRating: 5.0,
        reviewCount: 0,
        responseRatePercent: 100,
        responseTimeMinutes: 10,
        reliabilityScore: 1.0,
        hasBio: true,
        photoCount: 4,
        hasHomeDetails: true,
        servicesCount: 2,
        sitterBaseRateMinor: 4500,
        metroBenchmarkRateMinor: 5000,
        daysSinceCreation: 2, // 2 days old
      });

      const oldSitterNoReviews = calculateSitterRank({
        distanceMiles: 2.0,
        maxSearchRadiusMiles: 20,
        filterMatchFraction: 1.0,
        averageRating: 5.0,
        reviewCount: 0,
        responseRatePercent: 100,
        responseTimeMinutes: 10,
        reliabilityScore: 1.0,
        hasBio: true,
        photoCount: 4,
        hasHomeDetails: true,
        servicesCount: 2,
        sitterBaseRateMinor: 4500,
        metroBenchmarkRateMinor: 5000,
        daysSinceCreation: 90, // 90 days old (boost expired)
      });

      expect(brandNewSitter.components.newSitterBoost).toBeGreaterThan(0.1);
      expect(oldSitterNoReviews.components.newSitterBoost).toBe(0);
      expect(brandNewSitter.totalScore).toBeGreaterThan(oldSitterNoReviews.totalScore);
    });
  });
});
