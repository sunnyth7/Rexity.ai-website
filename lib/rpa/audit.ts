import type { AuditEventType, AuditSink } from "./types.ts"

// S2-T1: PII redactor v2.
// Patterns are applied in order. IBAN/card *before* phone, so a long digit run
// that is actually an IBAN doesn't get tagged as a phone first.
const IBAN_RE = /\b[A-Z]{2}\d{2}(?:[\s-]?[A-Z0-9]{4}){4,7}(?:[\s-]?[A-Z0-9]{1,4})?\b/g
const CARD_RE = /\b(?:\d[\s-]?){13,19}\b/g
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const PHONE_RE = /(\+?\d[\d\s().-]{6,}\d)/g
const LONG_NUMBER_RE = /\b\d{5,}\b/g

/**
 * Keys whose values are always sensitive free-text that we never want to
 * persist into `redactedContext`. Matching is case-insensitive on the *exact*
 * key name. Add to this list whenever a new field is identified as carrying
 * free-text user input.
 */
const ALWAYS_DROP_KEYS = new Set(
  [
    "messageBody",
    "message_body",
    "rawText",
    "raw_text",
    "transcript",
    "transcriptText",
    "transcript_text",
    "text",
    "body",
    "audioUrl",
    "audio_url",
    "recordingUrl",
    "recording_url",
    "fullName",
    "full_name",
    "address",
    "streetAddress",
    "street_address",
    "postalAddress",
    "postal_address",
    "iban",
    "bic",
    "creditCard",
    "credit_card",
    "cardNumber",
    "card_number",
    "ssn",
    "steuerId",
    "steuer_id",
    "passwort",
    "password",
    "secret",
    "token",
    "apiKey",
    "api_key",
  ].map((key) => key.toLowerCase()),
)

const DROPPED_SENTINEL = "[dropped-sensitive-field]"

function redactString(value: string): string {
  return value
    .replace(IBAN_RE, "[redacted-iban]")
    .replace(CARD_RE, "[redacted-card]")
    .replace(EMAIL_RE, "[redacted-email]")
    .replace(PHONE_RE, "[redacted-phone]")
    .replace(LONG_NUMBER_RE, "[redacted-number]")
    .slice(0, 1000)
}

export function redactValue(value: unknown, keyHint?: string): unknown {
  if (keyHint && ALWAYS_DROP_KEYS.has(keyHint.toLowerCase())) {
    return DROPPED_SENTINEL
  }

  if (typeof value === "string") return redactString(value)

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item))
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, redactValue(entry, key)]),
    )
  }

  return value
}

export function makeSafeSummary(summary: string, maxLength = 500): string {
  return String(redactValue(summary)).replace(/\s+/g, " ").trim().slice(0, maxLength)
}

export class MemoryAuditSink implements AuditSink {
  readonly events: Array<{
    type: AuditEventType
    actor: string
    sessionId?: string
    leadId?: string
    appointmentId?: string
    idempotencyKey?: string
    safeSummary?: string
    redactedContext?: Record<string, unknown>
  }> = []

  record(event: Parameters<AuditSink["record"]>[0]) {
    this.events.push({
      ...event,
      safeSummary: event.safeSummary ? makeSafeSummary(event.safeSummary) : undefined,
      redactedContext: event.redactedContext ? (redactValue(event.redactedContext) as Record<string, unknown>) : undefined,
    })
  }
}
