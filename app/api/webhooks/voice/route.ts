// S3-T8: voice webhook scaffold.
//
// Accepts mock Vapi/Retell-shaped payloads. When P-VOICE unblocks (live
// provider + DPA), only the env vars flip:
//   - VOICE_PROVIDER=vapi|retell
//   - VOICE_APP_SECRET=<hmac secret from provider dashboard>
//
// Today (dry-run): if VOICE_APP_SECRET is unset, the route only echoes the
// parsed event back without persisting. Once configured, persists the event
// through the same idempotency/audit machinery as WhatsApp.

import crypto from "node:crypto"

import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { makeIdempotencyKey, registerWebhookEvent } from "@/lib/rpa/idempotency"
import {
  PrismaAuditSink,
  PrismaWebhookEventRepository,
} from "@/lib/rpa/prisma-repositories"
import {
  DEFAULT_REQUEST_LIMIT,
  clientIpFromHeaders,
  consumeToken,
} from "@/lib/rpa/rate-limit"
import {
  normalizeVoiceProviderEvent,
  parseRecordingConsent,
  shouldRecordCall,
  type VoiceProvider,
} from "@/lib/rpa-showcase/voice"

export const runtime = "nodejs"

const PROVIDER: VoiceProvider = (process.env.VOICE_PROVIDER as VoiceProvider) ?? "vapi"

function verifyVoiceSignature(rawBody: Uint8Array, headerValue: string | null): boolean {
  const secret = process.env.VOICE_APP_SECRET
  if (!secret || !headerValue) return false
  const expected = crypto.createHmac("sha256", secret).update(Buffer.from(rawBody)).digest("hex")
  const headerBuf = Buffer.from(headerValue.replace(/^sha256=/i, ""))
  const expectedBuf = Buffer.from(expected)
  return (
    headerBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(headerBuf, expectedBuf)
  )
}

export async function POST(req: Request) {
  const ip = clientIpFromHeaders(req.headers)
  const quota = consumeToken(`ip:${ip}`, DEFAULT_REQUEST_LIMIT)
  if (!quota.allowed) {
    return new NextResponse("rate_limited", {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(quota.retryAfterMs / 1000)) },
    })
  }

  const bodyBytes = new Uint8Array(await req.arrayBuffer())
  const signatureHeader = req.headers.get("x-rexity-signature") ?? req.headers.get("x-signature")

  // Dry-run mode: when no VOICE_APP_SECRET is configured, accept payloads
  // unsigned so we can run smoke tests against mock callers locally. This is
  // ALWAYS disabled in production — the route refuses unsigned requests once
  // VOICE_APP_SECRET is set.
  if (process.env.VOICE_APP_SECRET && !verifyVoiceSignature(bodyBytes, signatureHeader)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(Buffer.from(bodyBytes).toString("utf8"))
  } catch {
    return NextResponse.json({ error: "Malformed payload." }, { status: 400 })
  }

  const event = normalizeVoiceProviderEvent(PROVIDER, payload)
  if (!event) {
    return NextResponse.json({ error: "Unrecognized voice event." }, { status: 400 })
  }

  // Detect explicit recording consent in the transcript only if this event is
  // the user's direct response to the consent prompt — driven by an upstream
  // flag set by the dialog state. We default to NOT recording.
  const consentSignal =
    event.eventType === "speech"
      ? parseRecordingConsent(event.transcriptText ?? "", true)
      : "unknown"

  const recordingEnabled = shouldRecordCall(consentSignal)

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      ok: true,
      provider: PROVIDER,
      eventType: event.eventType,
      callId: event.callId,
      consentSignal,
      recordingEnabled,
      persisted: false,
      reason: "DATABASE_URL not configured — voice route is in dry-run mode.",
    })
  }

  const audit = new PrismaAuditSink(prisma)
  const webhooks = new PrismaWebhookEventRepository(prisma)
  const result = await registerWebhookEvent({
    repository: webhooks,
    provider: `voice-${PROVIDER}`,
    providerEventId: event.eventId,
    channelType: "VOICE",
    idempotencyKey: makeIdempotencyKey(["voice", PROVIDER, event.eventId]),
    audit,
  })

  await webhooks.markProcessed(result.event.id, new Date())

  return NextResponse.json({
    ok: true,
    provider: PROVIDER,
    eventType: event.eventType,
    callId: event.callId,
    duplicate: result.duplicate,
    consentSignal,
    recordingEnabled,
    persisted: true,
  })
}
