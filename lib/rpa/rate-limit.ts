// S2-T4: in-process token-bucket rate limiter.
//
// Designed for a single-region Vercel deployment where a handful of webhook
// instances handle Meta traffic. NOT cluster-safe — a sharded deployment
// (multiple regions, multiple replicas behind a single domain) should swap the
// in-memory `buckets` map for Redis (e.g. Upstash) when that becomes the case.
//
// Two layers:
//   1. `requestBucket` — per-source-IP, applied before parsing.
//   2. `senderBucket`  — per-WhatsApp-senderId, applied after parse to stop a
//      single attacker who controls many phone numbers from exhausting via a
//      single signed POST.

export interface RateLimitConfig {
  /** Bucket capacity (max burst). */
  capacity: number
  /** Token refill per second. */
  refillPerSecond: number
}

export const DEFAULT_REQUEST_LIMIT: RateLimitConfig = { capacity: 30, refillPerSecond: 5 }
export const DEFAULT_SENDER_LIMIT: RateLimitConfig = { capacity: 10, refillPerSecond: 1 }
export const MAX_MESSAGES_PER_PAYLOAD = 50

type Bucket = { tokens: number; lastRefill: number }
const buckets = new Map<string, Bucket>()

export function consumeToken(
  key: string,
  config: RateLimitConfig = DEFAULT_REQUEST_LIMIT,
  now: number = Date.now(),
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const bucket = buckets.get(key) ?? { tokens: config.capacity, lastRefill: now }
  const elapsedSec = Math.max(0, (now - bucket.lastRefill) / 1000)
  bucket.tokens = Math.min(config.capacity, bucket.tokens + elapsedSec * config.refillPerSecond)
  bucket.lastRefill = now

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    buckets.set(key, bucket)
    return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterMs: 0 }
  }

  const tokensNeeded = 1 - bucket.tokens
  const retryAfterMs = Math.ceil((tokensNeeded / config.refillPerSecond) * 1000)
  buckets.set(key, bucket)
  return { allowed: false, remaining: 0, retryAfterMs }
}

/** Test/ops helper: forget all buckets. */
export function resetRateLimiter(): void {
  buckets.clear()
}

export function clientIpFromHeaders(headers: Headers): string {
  const xf = headers.get("x-forwarded-for")
  if (xf) return xf.split(",")[0]!.trim()
  return headers.get("x-real-ip") ?? "unknown"
}
