import test from "node:test"
import assert from "node:assert/strict"

import { MemoryAuditSink } from "../../lib/rpa/audit.ts"
import { MemoryWebhookEventRepository } from "../../lib/rpa/memory-repositories.ts"
import { makeIdempotencyKey, registerWebhookEvent, runOnce } from "../../lib/rpa/idempotency.ts"

test("registerWebhookEvent drops duplicates safely", async () => {
  const repository = new MemoryWebhookEventRepository()
  const audit = new MemoryAuditSink()

  const first = await registerWebhookEvent({
    repository,
    audit,
    provider: "shared-test",
    providerEventId: "evt_1",
    channelType: "WHATSAPP",
  })
  const second = await registerWebhookEvent({
    repository,
    audit,
    provider: "shared-test",
    providerEventId: "evt_1",
    channelType: "WHATSAPP",
  })

  assert.equal(first.duplicate, false)
  assert.equal(second.duplicate, true)
  assert.equal(repository.records.length, 1)
  assert.equal(audit.events.some((event) => event.type === "WEBHOOK_DUPLICATE"), true)
})

test("runOnce replays existing values by idempotency key", async () => {
  const seen = new Map<string, { value: number }>()
  const key = makeIdempotencyKey(["calendar", "book", "abc"])
  const first = await runOnce({
    key,
    lookup: async (lookupKey) => seen.get(lookupKey) ?? null,
    create: async () => {
      const value = { value: 1 }
      seen.set(key, value)
      return value
    },
  })
  const second = await runOnce({
    key,
    lookup: async (lookupKey) => seen.get(lookupKey) ?? null,
    create: async () => ({ value: 2 }),
  })

  assert.equal(first.replayed, false)
  assert.equal(second.replayed, true)
  assert.deepEqual(second.value, { value: 1 })
})
