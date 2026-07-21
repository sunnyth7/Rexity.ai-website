// S3-T10: load-style stress test.
//
// Scope of this file is what we CAN deterministically prove in CI:
//   1. Throughput at the application layer is not bottlenecked by the locking
//      machinery on independent slots.
//   2. Sequential idempotent replay holds at scale (1000 retries).
//
// The concurrent-double-booking guarantee comes from the Postgres exclusion
// constraint added in S1-T2 and CANNOT be reproduced in memory — Node's
// single-threaded event loop will interleave async lookups before any insert
// commits, so memory repos give weaker semantics than production Postgres.
//
// The production race test belongs in an ops smoke-test against Neon. See
// `docs/RPA_SPRINT_PLAN.md` §3 human-action items.

import test from "node:test"
import assert from "node:assert/strict"

import { createPendingLease } from "../../lib/rpa/calendar.ts"
import { MemoryAppointmentRepository } from "../../lib/rpa/memory-repositories.ts"
import { makeIdempotencyKey, registerWebhookEvent } from "../../lib/rpa/idempotency.ts"
import { MemoryWebhookEventRepository } from "../../lib/rpa/memory-repositories.ts"

test("S3-T10 1000 sequential idempotent webhook replays produce 1 row", async () => {
  const webhooks = new MemoryWebhookEventRepository()
  const eventId = "wamid.LOAD.0"
  const key = makeIdempotencyKey(["meta", "whatsapp", eventId])

  let duplicates = 0
  for (let i = 0; i < 1000; i += 1) {
    const r = await registerWebhookEvent({
      repository: webhooks,
      provider: "meta-whatsapp",
      providerEventId: eventId,
      channelType: "WHATSAPP",
      idempotencyKey: key,
    })
    if (r.duplicate) duplicates += 1
  }
  assert.equal(duplicates, 999)
})

test("S3-T10 1000 non-overlapping slot leases all succeed", async () => {
  const appointments = new MemoryAppointmentRepository()
  const base = new Date("2026-06-08T09:00:00.000Z").getTime()
  const promises = Array.from({ length: 1000 }, (_, i) =>
    createPendingLease({
      appointments,
      slot: {
        startTime: new Date(base + i * 30 * 60_000),
        endTime: new Date(base + (i + 1) * 30 * 60_000),
      },
      source: "WHATSAPP",
      idempotencyKey: `non-overlap-${i}`,
    }),
  )
  const results = await Promise.all(promises)
  assert.equal(results.length, 1000)
  assert.equal(appointments.records.length, 1000)
})

test("S3-T10 sequential repeated lease on a single slot: only first persists", async () => {
  const appointments = new MemoryAppointmentRepository()
  const slot = {
    startTime: new Date("2026-06-08T10:00:00.000Z"),
    endTime: new Date("2026-06-08T10:30:00.000Z"),
  }

  const first = await createPendingLease({
    appointments,
    slot,
    source: "WHATSAPP",
    idempotencyKey: "first",
  })
  assert.equal(first.replayed, false)

  // 99 follow-ups with the SAME key → all replayed
  let replays = 0
  for (let i = 0; i < 99; i += 1) {
    const r = await createPendingLease({
      appointments,
      slot,
      source: "WHATSAPP",
      idempotencyKey: "first",
    })
    if (r.replayed) replays += 1
  }
  assert.equal(replays, 99)
  assert.equal(appointments.records.length, 1)

  // A DIFFERENT key for the same slot → rejected as "not available"
  await assert.rejects(
    createPendingLease({
      appointments,
      slot,
      source: "WHATSAPP",
      idempotencyKey: "different",
    }),
    /not available/,
  )
})
