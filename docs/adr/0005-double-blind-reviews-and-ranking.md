# ADR 0005: Double-Blind Review System and Deterministic Sitter Ranking

## Status
Accepted

## Context
1. **Review Honesty (Retaliation Risk)**: In open review systems, participants fear leaving honest critical feedback because the other party might retaliate with a negative review.
2. **Search Quality & Fairness**: Unregulated search results either favor incumbents with thousands of reviews (cold start problem for new sitters) or are vulnerable to manipulation.

## Decision
1. **Double-Blind Review Model**:
   - Following stay completion, both owner and sitter are invited to submit reviews.
   - Submitted reviews remain hidden (`isBlind = true`) until:
     - Both owner and sitter have submitted their respective reviews, OR
     - 14 days have elapsed from stay completion (review window closes).
   - Once revealed, reviews become public, immutable, and are factored into the sitter's rating.

2. **Deterministic, Explainable Ranking Algorithm**:
   - Ranking is calculated via a pure, deterministic scoring function:
     `score = 0.30 * relevance(distance, filters) + 0.25 * rating_bayesian + 0.15 * response_quality + 0.10 * reliability + 0.10 * profile_completeness + 0.10 * price_competitiveness`
   - Bayesian average with prior `C = 5` and baseline `m = 4.8` prevents sitters with a single 5.0 rating from eclipsing experienced sitters with dozens of 4.9 ratings:
     `bayesian = (C * m + sum_ratings) / (C + review_count)`
   - New sitters receive a time-decayed exploration boost for their first 30 days or first 3 bookings to solve the supply cold-start dilemma.

## Consequences
- Honest, uncorrupted review feedback.
- Deterministic, unit-testable search ranking with clear observability into each score component.
