import {
  RANKING_WEIGHTS,
  BAYESIAN_PRIOR_COUNT,
  BAYESIAN_PRIOR_RATING,
} from '../constants/index.js';

export interface SitterRankingInput {
  distanceMiles: number;
  maxSearchRadiusMiles: number;
  filterMatchFraction: number; // 0.0 to 1.0
  averageRating: number; // 1.0 to 5.0
  reviewCount: number;
  responseRatePercent: number; // 0 to 100
  responseTimeMinutes: number;
  reliabilityScore: number; // 0.0 to 1.0
  hasBio: boolean;
  photoCount: number;
  hasHomeDetails: boolean;
  servicesCount: number;
  sitterBaseRateMinor: number;
  metroBenchmarkRateMinor: number;
  daysSinceCreation: number;
}

export interface SitterRankingResult {
  totalScore: number; // 0.0 to 1.0 (with new sitter boost applied)
  bayesianRating: number; // 1.0 to 5.0 scale
  components: {
    relevance: number;
    ratingBayesian: number;
    responseQuality: number;
    reliability: number;
    profileCompleteness: number;
    priceCompetitiveness: number;
    newSitterBoost: number;
  };
}

/**
 * Calculates the Bayesian weighted average rating.
 * Prevents 1-review sitters from artificially dominating 50-review sitters.
 */
export function calculateBayesianRating(
  averageRating: number,
  reviewCount: number,
  priorRating = BAYESIAN_PRIOR_RATING,
  priorCount = BAYESIAN_PRIOR_COUNT
): number {
  if (reviewCount <= 0) {
    return priorRating;
  }
  const rating = Math.min(5, Math.max(1, averageRating));
  const weighted = (priorRating * priorCount + rating * reviewCount) / (priorCount + reviewCount);
  return Number(weighted.toFixed(2));
}

/**
 * Computes deterministic, explainable ranking score for sitters.
 */
export function calculateSitterRank(input: SitterRankingInput): SitterRankingResult {
  // 1. Relevance Score (30%): Distance decay + filter adherence
  const clampedRadius = Math.max(1, input.maxSearchRadiusMiles);
  const distanceDecay = Math.max(0, 1 - input.distanceMiles / clampedRadius);
  const filterMatch = Math.min(1, Math.max(0, input.filterMatchFraction));
  const relevance = 0.6 * distanceDecay + 0.4 * filterMatch;

  // 2. Rating Bayesian (25%): Normalized to 0..1 scale
  const bayesianRating = calculateBayesianRating(input.averageRating, input.reviewCount);
  const ratingBayesian = Math.min(1, Math.max(0, bayesianRating / 5.0));

  // 3. Response Quality (15%): Response rate + response latency
  const responseRateFraction = Math.min(1, Math.max(0, input.responseRatePercent / 100));
  let responseLatencyScore = 1.0;
  if (input.responseTimeMinutes > 240) {
    responseLatencyScore = 0.3;
  } else if (input.responseTimeMinutes > 60) {
    responseLatencyScore = 0.6;
  } else if (input.responseTimeMinutes > 15) {
    responseLatencyScore = 0.85;
  }
  const responseQuality = 0.7 * responseRateFraction + 0.3 * responseLatencyScore;

  // 4. Reliability (10%): Platform cancellation history
  const reliability = Math.min(1, Math.max(0, input.reliabilityScore));

  // 5. Profile Completeness (10%)
  let profileCompleteness = 0;
  if (input.hasBio) profileCompleteness += 0.25;
  if (input.photoCount >= 3) profileCompleteness += 0.35;
  else if (input.photoCount >= 1) profileCompleteness += 0.2;
  if (input.hasHomeDetails) profileCompleteness += 0.2;
  if (input.servicesCount >= 2) profileCompleteness += 0.2;
  else if (input.servicesCount === 1) profileCompleteness += 0.1;
  profileCompleteness = Math.min(1, profileCompleteness);

  // 6. Price Competitiveness (10%)
  let priceCompetitiveness = 1.0;
  if (input.metroBenchmarkRateMinor > 0 && input.sitterBaseRateMinor > 0) {
    const ratio = input.sitterBaseRateMinor / input.metroBenchmarkRateMinor;
    if (ratio <= 1.0) {
      priceCompetitiveness = 1.0;
    } else {
      // Degrades if price exceeds local benchmark
      priceCompetitiveness = Math.max(0.2, 1.0 - (ratio - 1.0) * 0.8);
    }
  }

  // 7. Time-Decayed New Sitter Boost
  // New sitters (< 3 reviews, within 30 days of onboarding) get a decaying boost to bootstrap reviews
  let newSitterBoost = 0;
  if (input.reviewCount < 3 && input.daysSinceCreation <= 30) {
    const timeDecay = Math.max(0, 1 - input.daysSinceCreation / 30);
    const reviewDecay = (3 - input.reviewCount) / 3;
    newSitterBoost = Number((0.15 * timeDecay * reviewDecay).toFixed(4));
  }

  // Weighted sum
  const baseScore =
    relevance * RANKING_WEIGHTS.RELEVANCE +
    ratingBayesian * RANKING_WEIGHTS.RATING_BAYESIAN +
    responseQuality * RANKING_WEIGHTS.RESPONSE_QUALITY +
    reliability * RANKING_WEIGHTS.RELIABILITY +
    profileCompleteness * RANKING_WEIGHTS.PROFILE_COMPLETENESS +
    priceCompetitiveness * RANKING_WEIGHTS.PRICE_COMPETITIVENESS;

  const totalScore = Number(Math.min(1.0, baseScore + newSitterBoost).toFixed(4));

  return {
    totalScore,
    bayesianRating,
    components: {
      relevance: Number(relevance.toFixed(4)),
      ratingBayesian: Number(ratingBayesian.toFixed(4)),
      responseQuality: Number(responseQuality.toFixed(4)),
      reliability: Number(reliability.toFixed(4)),
      profileCompleteness: Number(profileCompleteness.toFixed(4)),
      priceCompetitiveness: Number(priceCompetitiveness.toFixed(4)),
      newSitterBoost,
    },
  };
}
