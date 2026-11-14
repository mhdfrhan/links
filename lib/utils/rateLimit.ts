export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  maxEntries?: number;
}

interface RateRecord {
  count: number;
  resetAt: number;
}

/**
 * Extract best-effort client IP from standard proxy headers.
 */
export function getClientIp(headers: Pick<Headers, "get">): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();
  return forwarded || realIp || "unknown";
}

/**
 * Bounded in-memory fixed-window rate limiter with lazy pruning of expired keys.
 */
export function createRateLimiter({
  maxRequests,
  windowMs,
  maxEntries = 1000,
}: RateLimiterOptions) {
  const store = new Map<string, RateRecord>();

  function pruneExpired(now: number) {
    for (const [key, record] of store) {
      if (now > record.resetAt) {
        store.delete(key);
      }
    }
  }

  return function checkRateLimit(key: string, now = Date.now()): boolean {
    const record = store.get(key);

    if (!record || now > record.resetAt) {
      if (store.size >= maxEntries) {
        pruneExpired(now);
        while (store.size >= maxEntries) {
          const oldestKey = store.keys().next().value;
          if (oldestKey === undefined) break;
          store.delete(oldestKey);
        }
      }
      store.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count += 1;
    return true;
  };
}
