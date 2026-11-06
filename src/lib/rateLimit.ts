interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const buckets: Map<string, RateLimitBucket> = new Map();

/**
 * Pragmatic token bucket rate limiter for serverless route handlers.
 * @param key Identifier (e.g. client IP or player UUID)
 * @param capacity Maximum requests allowed in burst window
 * @param refillRatePerSec Tokens restored per second
 */
export function checkRateLimit(key: string, capacity: number = 30, refillRatePerSec: number = 2): boolean {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now };
    buckets.set(key, bucket);
  } else {
    const elapsedSec = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSec * refillRatePerSec);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true; // allowed
  }

  return false; // rate limited
}
