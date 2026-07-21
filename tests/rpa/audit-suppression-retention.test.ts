import test from "node:test"
import assert from "node:assert/strict"

import { makeSafeSummary, MemoryAuditSink, redactValue } from "../../lib/rpa/audit.ts"
import { MemoryAppointmentRepository, MemorySuppressionRepository } from "../../lib/rpa/memory-repositories.ts"
import { runRetentionCleanup } from "../../lib/rpa/retention.ts"
import { suppressContact } from "../../lib/rpa/suppression.ts"

test("safe summaries and redacted audit metadata remove direct contact details", () => {
  const redacted = redactValue({ email: "person@example.com", phone: "+49 30 12345678", note: "Call 123456789" })
  assert.deepEqual(redacted, { email: "[redacted-email]", phone: "[redacted-phone]", note: "Call [redacted-phone]" })
  assert.equal(makeSafeSummary("  person@example.com   asked for follow-up  "), "[redacted-email] asked for follow-up")
})

test("S2-T1 PII redactor v2: IBAN, credit card, and always-drop keys", () => {
  // IBAN gets caught even with internal spaces (DE89 3704 0044 0532 0130 00)
  assert.match(
    String(redactValue("Bitte zahlen auf DE89 3704 0044 0532 0130 00")),
    /\[redacted-iban\]/,
  )

  // Credit-card-ish 16-digit sequence
  assert.match(
    String(redactValue("My card is 4111 1111 1111 1111 ok?")),
    /\[redacted-card\]/,
  )

  // Always-drop keys: free-text fields are replaced wholesale, not merely scrubbed
  const redacted = redactValue({
    messageBody: "Hi I'm Alice Smith from 5 Marktplatz, Berlin",
    transcriptText: "long transcript with names addresses everything",
    iban: "DE89370400440532013000",
    apiKey: "sk-very-real-key-do-not-store",
    nested: {
      password: "hunter2",
      okField: "safe value",
    },
  }) as Record<string, unknown>

  assert.equal(redacted.messageBody, "[dropped-sensitive-field]")
  assert.equal(redacted.transcriptText, "[dropped-sensitive-field]")
  assert.equal(redacted.iban, "[dropped-sensitive-field]")
  assert.equal(redacted.apiKey, "[dropped-sensitive-field]")
  assert.deepEqual(redacted.nested, {
    password: "[dropped-sensitive-field]",
    okField: "safe value",
  })
})

test("S2-T1 redactor handles arrays and case-insensitive key matching", () => {
  const redacted = redactValue([
    { MessageBody: "secret 1" },
    { messagebody: "secret 2" },
    { plain: "keep this" },
  ]) as Array<Record<string, unknown>>

  assert.equal(redacted[0].MessageBody, "[dropped-sensitive-field]")
  assert.equal(redacted[1].messagebody, "[dropped-sensitive-field]")
  assert.equal(redacted[2].plain, "keep this")
})

test("suppression entries are normalized and idempotent", async () => {
  const repository = new MemorySuppressionRepository()
  const audit = new MemoryAuditSink()

  const first = await suppressContact({ repository, audit, channelType: "WHATSAPP", identifier: " +49 30 1234 ", source: "test" })
  const second = await suppressContact({ repository, audit, channelType: "WHATSAPP", identifier: "+49301234", source: "test" })

  assert.equal(first.duplicate, false)
  assert.equal(second.duplicate, true)
  assert.equal(repository.records.length, 1)
  assert.equal(audit.events[0].type, "SUPPRESSION_CREATED")
})

test("retention cleanup delegates only terminal appointment deletion", async () => {
  const appointments = new MemoryAppointmentRepository()
  appointments.records.push({
    id: "old-cancelled",
    status: "CANCELLED",
    source: "VOICE",
    startTime: new Date("2025-01-01T10:00:00.000Z"),
    endTime: new Date("2025-01-01T10:30:00.000Z"),
  })
  appointments.records.push({
    id: "active-confirmed",
    status: "CONFIRMED",
    source: "VOICE",
    startTime: new Date("2025-01-01T11:00:00.000Z"),
    endTime: new Date("2025-01-01T11:30:00.000Z"),
  })
  const repository = {
    deleteWebhookEventsOlderThan: async () => 1,
    deleteAuditEventsOlderThan: async () => 2,
    clearSessionSummariesOlderThan: async () => 3,
    deleteExpiredSuppressions: async () => 4,
    deleteUnconvertedLeadsOlderThan: async () => 5,
  }

  const result = await runRetentionCleanup({
    repository,
    appointments,
    now: new Date("2026-06-05T00:00:00.000Z"),
    policy: { webhookEventDays: 30, auditEventDays: 180, transientSessionDays: 3, appointmentDays: 30, leadDays: 547 },
  })

  assert.deepEqual(result, {
    webhookEvents: 1,
    auditEvents: 2,
    sessionSummaries: 3,
    appointments: 1,
    suppressions: 4,
    leads: 5,
  })
  assert.equal(appointments.records.some((record) => record.id === "active-confirmed"), true)
})
