interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale IP records every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    for (const [ip, record] of rateLimitMap.entries()) {
      record.timestamps = record.timestamps.filter(ts => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        rateLimitMap.delete(ip);
      }
    }
  }, 10 * 60 * 1000);
}

export interface RateLimitOptions {
  windowMs?: number; // default 10 minutes (600,000 ms)
  maxRequests?: number; // default 5 requests
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): { isAllowed: boolean; remaining: number; resetTime: number } {
  const windowMs = options.windowMs || 600000; // 10 minutes
  const maxRequests = options.maxRequests || 5;
  const now = Date.now();

  const record = rateLimitMap.get(identifier) || { timestamps: [] };
  // Filter out timestamps outside window
  record.timestamps = record.timestamps.filter(ts => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0] ?? now;
    const resetTime = oldest + windowMs;
    return { isAllowed: false, remaining: 0, resetTime };
  }

  record.timestamps.push(now);
  rateLimitMap.set(identifier, record);

  return {
    isAllowed: true,
    remaining: maxRequests - record.timestamps.length,
    resetTime: now + windowMs,
  };
}
