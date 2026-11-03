import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '@/lib/rateLimit';

describe('Sliding-Window Rate Limiter (checkRateLimit)', () => {
  it('allows requests within the specified quota', () => {
    const testIp = '192.168.1.101';
    const opts = { windowMs: 5000, maxRequests: 3 };

    const first = checkRateLimit(testIp, opts);
    expect(first.isAllowed).toBe(true);
    expect(first.remaining).toBe(2);

    const second = checkRateLimit(testIp, opts);
    expect(second.isAllowed).toBe(true);
    expect(second.remaining).toBe(1);

    const third = checkRateLimit(testIp, opts);
    expect(third.isAllowed).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it('rejects requests when quota is exceeded', () => {
    const testIp = '192.168.1.102';
    const opts = { windowMs: 5000, maxRequests: 2 };

    checkRateLimit(testIp, opts);
    checkRateLimit(testIp, opts);

    const blocked = checkRateLimit(testIp, opts);
    expect(blocked.isAllowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetTime).toBeGreaterThan(Date.now());
  });

  it('isolates rate limits by IP identifier', () => {
    const ipA = '10.0.0.1';
    const ipB = '10.0.0.2';
    const opts = { windowMs: 5000, maxRequests: 1 };

    const reqA1 = checkRateLimit(ipA, opts);
    expect(reqA1.isAllowed).toBe(true);

    const reqA2 = checkRateLimit(ipA, opts);
    expect(reqA2.isAllowed).toBe(false);

    // ipB should not be affected by ipA
    const reqB1 = checkRateLimit(ipB, opts);
    expect(reqB1.isAllowed).toBe(true);
  });
});
