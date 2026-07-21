import crypto from "crypto"

import type { ChannelMessage } from "./contracts"

export interface WhatsAppWebhookVerificationInput {
  mode: string | null
  token: string | null
  challenge: string | null
  verifyToken: string | undefined
}

export interface WhatsAppInboundMessage {
  id: string
  from: string
  to?: string
  text: string
  timestamp?: string
  metadata?: Record<string, unknown>
}

const OPT_OUT_PATTERNS = [
  /\bstop\b/i,
  /\bstopp\b/i,
  /\bunsubscribe\b/i,
  /\babmelden\b/i,
  /\bkeine\s+nachrichten\b/i,
  /\bnicht\s+mehr\s+kontaktieren\b/i,
  /\bbitte\s+nicht\s+mehr\s+schreiben\b/i,
  /\bkeine\s+werbung\b/i,
  /\bwiderspruch\b/i,
]

export function verifyWhatsAppWebhookChallenge(
  input: WhatsAppWebhookVerificationInput,
) {
  if (
    input.mode === "subscribe" &&
    input.token &&
    input.verifyToken &&
    input.challenge &&
    timingSafeEqualStr(input.token, input.verifyToken)
  ) {
    return { ok: true as const, challenge: input.challenge }
  }

  return { ok: false as const }
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8")
  const bBuf = Buffer.from(b, "utf8")
  // timingSafeEqual throws on length mismatch; pad to make compare length-safe but result-correct.
  if (aBuf.length !== bBuf.length) {
    // Run a fixed-length compare against a dummy to avoid a length-based timing side-channel.
    const dummy = Buffer.alloc(aBuf.length)
    crypto.timingSafeEqual(aBuf, dummy)
    return false
  }
  return crypto.timingSafeEqual(aBuf, bBuf)
}

/**
 * Verify a Meta x-hub-signature-256 over the inbound raw body.
 *
 * S3-T5: accept either a string (legacy) OR a Uint8Array/Buffer. Prefer raw
 * bytes when called from the route handler — Meta signs the bytes, not a
 * UTF-8-decoded string, and there are edge cases where the round-trip is
 * not identity.
 */
export function verifyMetaSignature({
  rawBody,
  signatureHeader,
  appSecret,
}: {
  rawBody: string | Uint8Array
  signatureHeader: string | null
  appSecret: string | undefined
}) {
  if (!appSecret || !signatureHeader?.startsWith("sha256=")) {
    return false
  }

  const bodyBuffer = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : Buffer.from(rawBody)
  const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(bodyBuffer).digest("hex")

  const actualBuffer = Buffer.from(signatureHeader)
  const expectedBuffer = Buffer.from(expected)

  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  )
}

export function isWhatsAppOptOut(text: string) {
  const normalized = text.trim()
  return OPT_OUT_PATTERNS.some((pattern) => pattern.test(normalized))
}

function extractTextOrCaption(typed: Record<string, unknown>): string {
  // Standard text message
  if (typed.text && typeof typed.text === "object") {
    const body = (typed.text as { body?: unknown }).body
    if (typeof body === "string" && body) return body
  }
  // Image / video / document with caption
  for (const field of ["image", "video", "document"] as const) {
    const blob = typed[field]
    if (blob && typeof blob === "object") {
      const caption = (blob as { caption?: unknown }).caption
      if (typeof caption === "string" && caption) return caption
    }
  }
  // Button reply (interactive)
  if (typed.button && typeof typed.button === "object") {
    const payload = (typed.button as { text?: unknown }).text
    if (typeof payload === "string" && payload) return payload
  }
  return ""
}

export function parseWhatsAppInbound(payload: unknown): WhatsAppInboundMessage[] {
  if (!payload || typeof payload !== "object") return []

  const entries = Array.isArray((payload as { entry?: unknown }).entry)
    ? ((payload as { entry: unknown[] }).entry)
    : []

  return entries.flatMap((entry) => {
    const changes = Array.isArray((entry as { changes?: unknown }).changes)
      ? ((entry as { changes: unknown[] }).changes)
      : []

    return changes.flatMap((change) => {
      const value = (change as { value?: Record<string, unknown> }).value
      const messages = Array.isArray(value?.messages) ? value.messages : []
      const phoneNumberId =
        typeof value?.metadata === "object" && value.metadata
          ? String((value.metadata as { phone_number_id?: unknown }).phone_number_id ?? "")
          : undefined

      const parsedMessages: WhatsAppInboundMessage[] = []

      for (const message of messages) {
        const typed = message as Record<string, unknown>
        // S3-T4: extract text from `text.body` OR from `image.caption`,
        // `video.caption`, `document.caption`. Without this, any
        // image-with-caption containing "STOP" was silently dropped.
        const text = extractTextOrCaption(typed)
        const messageType = String(typed.type ?? "text")

        if (!typed.id || !typed.from) continue

        // If a non-text type produced no caption, emit a placeholder marker so
        // downstream layers can still record an audit event ("unsupported
        // message type") and route the sender to a fallback reply when
        // outbound is wired in S3-T8.
        const finalText = text || `[unsupported-message-type:${messageType}]`

        parsedMessages.push({
          id: String(typed.id),
          from: String(typed.from),
          to: phoneNumberId,
          text: finalText,
          timestamp: typed.timestamp ? String(typed.timestamp) : undefined,
          metadata: { messageType, hasText: text.length > 0 },
        })
      }

      return parsedMessages
    })
  })
}

export function toChannelMessage(message: WhatsAppInboundMessage): ChannelMessage {
  return {
    channel: "whatsapp",
    provider: "meta",
    externalMessageId: message.id,
    senderId: message.from,
    recipientId: message.to,
    text: message.text,
    receivedAt: message.timestamp
      ? new Date(Number(message.timestamp) * 1000)
      : new Date(),
    metadata: message.metadata,
  }
}

export function assertApprovedTemplateOutbound(input: {
  templateName?: string
  freeText?: string
  marketing?: boolean
}) {
  if (input.marketing && input.freeText) {
    return {
      ok: false as const,
      reason: "Unsolicited WhatsApp free-text marketing is blocked.",
    }
  }

  if (!input.templateName) {
    return {
      ok: false as const,
      reason: "Outbound WhatsApp messages require an approved Meta template.",
    }
  }

  return { ok: true as const }
}
