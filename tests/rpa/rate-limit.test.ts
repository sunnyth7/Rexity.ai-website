// S2-T4 unit tests for the token-bucket rate limiter.
import test from "node:test"
import assert from "node:assert/strict"

import {
  clientIpFromHeaders,
  consumeToken,
  resetRateLimiter,
} from "../../lib/rpa/rate-limit.ts"

test("S2-T4 token bucket: allows up to capacity then 429s", () => {
  resetRateLimiter()
  const cfg = { capacity: 3, refillPerSecond: 1 }
  const now = 1_000_000

  assert.equal(consumeToken("k1", cfg, now).allowed, true)
  assert.equal(consumeToken("k1", cfg, now).allowed, true)
  assert.equal(consumeToken("k1", cfg, now).allowed, true)
  const fourth = consumeToken("k1", cfg, now)
  assert.equal(fourth.allowed, false)
  assert.ok(fourth.retryAfterMs > 0)
})

test("S2-T4 token bucket: refills over time", () => {
  resetRateLimiter()
  const cfg = { capacity: 2, refillPerSecond: 1 }
  const t0 = 2_000_000

  assert.equal(consumeToken("k2", cfg, t0).allowed, true)
  assert.equal(consumeToken("k2", cfg, t0).allowed, true)
  assert.equal(consumeToken("k2", cfg, t0).allowed, false)

  // 1.5 seconds later → 1.5 tokens regenerated → one more allowed
  assert.equal(consumeToken("k2", cfg, t0 + 1500).allowed, true)
  // Immediately again → still rate-limited
  assert.equal(consumeToken("k2", cfg, t0 + 1500).allowed, false)
})

test("S2-T4 token bucket: keys are isolated", () => {
  resetRateLimiter()
  const cfg = { capacity: 1, refillPerSecond: 1 }
  const t = 3_000_000
  assert.equal(consumeToken("a", cfg, t).allowed, true)
  assert.equal(consumeToken("a", cfg, t).allowed, false)
  assert.equal(consumeToken("b", cfg, t).allowed, true)
})

test("S2-T4 clientIpFromHeaders prefers x-forwarded-for first value", () => {
  const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1", "x-real-ip": "10.0.0.2" })
  assert.equal(clientIpFromHeaders(headers), "203.0.113.5")
  assert.equal(clientIpFromHeaders(new Headers({ "x-real-ip": "203.0.113.99" })), "203.0.113.99")
  assert.equal(clientIpFromHeaders(new Headers()), "unknown")
})
