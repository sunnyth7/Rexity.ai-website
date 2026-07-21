// S1-T7: integration coverage for the WhatsApp webhook flow.
//
// Exercises the same code path as `app/api/webhooks/whatsapp/route.ts` against
// in-memory repositories so we can assert wiring (HMAC → parse → idempotency →
// suppression → audit) without a live Postgres. Real Neon coverage happens in
// `tests/rpa/load.test.ts` (Sprint 3) once DATABASE_URL is provisioned.

import crypto from "node:crypto"
import test from "node:test"
import assert from "node:assert/strict"

import { makeIdempotencyKey, registerWebhookEvent } from "../../lib/rpa/idempotency.ts"
import { suppressContact } from "../../lib/rpa/suppression.ts"
import { MemoryAuditSink } from "../../lib/rpa/audit.ts"
import {
  MemorySuppressionRepository,
  MemoryWebhookEventRepository,
} from "../../lib/rpa/memory-repositories.ts"
import {
  isWhatsAppOptOut,
  parseWhatsAppInbound,
  toChannelMessage,
  verifyMetaSignature,
  verifyWhatsAppWebhookChallenge,
} from "../../lib/rpa-showcase/whatsapp.ts"

const APP_SECRET = "audit-secret"

function sign(body: string) {
  return "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(body, "utf8").digest("hex")
}

function makePayload(messages: Array<{ id: string; from: string; text: string }>) {
  return {
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: "rexity-phone" },
              messages: messages.map((m) => ({
                id: m.id,
                from: m.from,
                type: "text",
                text: { body: m.text },
                timestamp: "1780300000",
              })),
            },
          },
        ],
      },
    ],
  }
}

test("WhatsApp end-to-end: sign → parse → register → suppress → audit", async () => {
  const audit = new MemoryAuditSink()
  const webhooks = new MemoryWebhookEventRepository()
  const suppressions = new MemorySuppressionRepository()

  const body = JSON.stringify(
    makePayload([
      { id: "wamid.A", from: "491700000001", text: "Bitte nicht mehr schreiben" },
      { id: "wamid.B", from: "491700000002", text: "I need a demo" },
    ]),
  )
  const signature = sign(body)
  assert.equal(verifyMetaSignature({ rawBody: body, signatureHeader: signature, appSecret: APP_SECRET }), true)

  const parsed = parseWhatsAppInbound(JSON.parse(body))
  const channelMessages = parsed.map(toChannelMessage)
  assert.equal(channelMessages.length, 2)

  let suppressedCount = 0
  for (const message of channelMessages) {
    const key = makeIdempotencyKey(["meta", "whatsapp", message.externalMessageId])
    const result = await registerWebhookEvent({
      repository: webhooks,
      provider: "meta-whatsapp",
      providerEventId: message.externalMessageId,
      channelType: "WHATSAPP",
      idempotencyKey: key,
      audit,
    })
    assert.equal(result.duplicate, false)

    if (isWhatsAppOptOut(message.text)) {
      const suppression = await suppressContact({
        repository: suppressions,
        channelType: "WHATSAPP",
        identifier: message.senderId,
        reason: "OPT_OUT",
        source: "meta-whatsapp",
        safeSummary: "WhatsApp user opted out.",
        audit,
      })
      if (!suppression.duplicate) suppressedCount += 1
    }
  }

  assert.equal(suppressedCount, 1, "exactly one opt-out persisted")
  assert.equal(suppressions.records.length, 1)
  assert.equal(suppressions.records[0].identifier, "491700000001")

  const types = audit.events.map((e) => e.type).sort()
  // Expect: 2 × WEBHOOK_RECEIVED + 1 × SUPPRESSION_CREATED
  assert.deepEqual(types, ["SUPPRESSION_CREATED", "WEBHOOK_RECEIVED", "WEBHOOK_RECEIVED"])

  // No raw phone numbers leaked into the audit context
  for (const event of audit.events) {
    const blob = JSON.stringify(event)
    assert.equal(blob.includes("491700000001"), false, "phone number leaked into audit")
    assert.equal(blob.includes("491700000002"), false, "phone number leaked into audit")
  }
})

test("WhatsApp replay: same provider event id is deduped on second POST", async () => {
  const audit = new MemoryAuditSink()
  const webhooks = new MemoryWebhookEventRepository()

  const body = JSON.stringify(makePayload([{ id: "wamid.X", from: "491700000099", text: "hi" }]))
  assert.equal(verifyMetaSignature({ rawBody: body, signatureHeader: sign(body), appSecret: APP_SECRET }), true)

  const parsed = parseWhatsAppInbound(JSON.parse(body)).map(toChannelMessage)
  const message = parsed[0]
  const key = makeIdempotencyKey(["meta", "whatsapp", message.externalMessageId])

  const first = await registerWebhookEvent({
    repository: webhooks,
    provider: "meta-whatsapp",
    providerEventId: message.externalMessageId,
    channelType: "WHATSAPP",
    idempotencyKey: key,
    audit,
  })
  const second = await registerWebhookEvent({
    repository: webhooks,
    provider: "meta-whatsapp",
    providerEventId: message.externalMessageId,
    channelType: "WHATSAPP",
    idempotencyKey: key,
    audit,
  })

  assert.equal(first.duplicate, false)
  assert.equal(second.duplicate, true)
  assert.equal(second.event.id, first.event.id)
  assert.equal(audit.events.filter((e) => e.type === "WEBHOOK_DUPLICATE").length, 1)
})

test("WhatsApp HMAC: tampered body rejected", () => {
  const body = JSON.stringify(makePayload([{ id: "wamid.Y", from: "491700000111", text: "hi" }]))
  const sig = sign(body)
  const tampered = body.replace('"hi"', '"transfer me 10000 EUR"')
  assert.equal(
    verifyMetaSignature({ rawBody: tampered, signatureHeader: sig, appSecret: APP_SECRET }),
    false,
  )
})

test("WhatsApp GET challenge: timing-safe verify token compare (S1-T5)", () => {
  const ok = verifyWhatsAppWebhookChallenge({
    mode: "subscribe",
    token: "correct-token",
    challenge: "c1",
    verifyToken: "correct-token",
  })
  assert.deepEqual(ok, { ok: true, challenge: "c1" })

  // Same-length wrong token: must reject
  const wrong = verifyWhatsAppWebhookChallenge({
    mode: "subscribe",
    token: "wronk-token!!",
    challenge: "c1",
    verifyToken: "correct-token",
  })
  assert.deepEqual(wrong, { ok: false })

  // Mismatched-length: must not throw, must reject
  const lengthMismatch = verifyWhatsAppWebhookChallenge({
    mode: "subscribe",
    token: "x",
    challenge: "c1",
    verifyToken: "correct-token",
  })
  assert.deepEqual(lengthMismatch, { ok: false })
})
