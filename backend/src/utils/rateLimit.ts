type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Simple in-memory fixed-window rate limiter (per process). */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (existing.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  existing.count += 1;
  return { ok: true };
}

/**
 * Multi-tier limits for public contact forms (scan / flood protection).
 * Returns the first failing bucket's retry hint.
 */
export function consumeContactSubmitLimits(opts: {
  ip: string;
  scope: string;
  email?: string;
  contentHash?: string;
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const { ip, scope } = opts;
  const checks: Array<{ key: string; limit: number; windowMs: number }> = [
    // Burst — stop rapid scanners
    { key: `contact:burst:ip:${ip}`, limit: 2, windowMs: 60_000 },
    // Per IP overall (any portfolio)
    { key: `contact:ip:${ip}`, limit: 8, windowMs: 15 * 60_000 },
    // Per form + IP
    { key: `contact:form:${scope}:ip:${ip}`, limit: 3, windowMs: 15 * 60_000 },
    // Per form across all IPs (distributed scan)
    { key: `contact:form:${scope}`, limit: 40, windowMs: 60 * 60_000 },
  ];

  if (opts.email) {
    checks.push({
      key: `contact:form:${scope}:email:${opts.email.toLowerCase()}`,
      limit: 3,
      windowMs: 60 * 60_000,
    });
  }
  if (opts.contentHash) {
    checks.push({
      key: `contact:dup:${scope}:${opts.contentHash}`,
      limit: 1,
      windowMs: 10 * 60_000,
    });
  }

  for (const check of checks) {
    const result = consumeRateLimit(check.key, check.limit, check.windowMs);
    if (!result.ok) {
      return result;
    }
  }
  return { ok: true };
}

/** Periodic cleanup to avoid unbounded growth. */
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref?.();
