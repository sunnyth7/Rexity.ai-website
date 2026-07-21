import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { makeIdempotencyKey, registerWebhookEvent } from "@/lib/rpa/idempotency"
import {
  PrismaAuditSink,
  PrismaSessionRepository,
  PrismaSuppressionRepository,
  PrismaWebhookEventRepository,
} from "@/lib/rpa/prisma-repositories"
import { processInboundMessage } from "@/lib/rpa/inbound-processor"
import {
  DEFAULT_REQUEST_LIMIT,
  DEFAULT_SENDER_LIMIT,
  MAX_MESSAGES_PER_PAYLOAD,
  clientIpFromHeaders,
  consumeToken,
} from "@/lib/rpa/rate-limit"
import { suppressContact } from "@/lib/rpa/suppression"
import {
  isWhatsAppOptOut,
  parseWhatsAppInbound,
  toChannelMessage,
  verifyMetaSignature,
  verifyWhatsAppWebhookChallenge,
} from "@/lib/rpa-showcase/whatsapp"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const result = verifyWhatsAppWebhookChallenge({
    mode: url.searchParams.get("hub.mode"),
    token: url.searchParams.get("hub.verify_token"),
    challenge: url.searchParams.get("hub.challenge"),
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  })

  if (!result.ok) {
    return NextResponse.json({ error: "Invalid verification token." }, { status: 403 })
  }

  return new Response(result.challenge, { status: 200 })
}

export async function POST(req: Request) {
  // S2-T4 layer 1: per-source-IP token bucket BEFORE we burn CPU on HMAC.
  const ip = clientIpFromHeaders(req.headers)
  const ipQuota = consumeToken(`ip:${ip}`, DEFAULT_REQUEST_LIMIT)
  if (!ipQuota.allowed) {
    return new NextResponse("rate_limited", {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(ipQuota.retryAfterMs / 1000)) },
    })
  }

  // S3-T5: HMAC over raw bytes, not a UTF-8 string.
  const bodyBytes = new Uint8Array(await req.arrayBuffer())
  const signature = req.headers.get("x-hub-signature-256")

  if (
    !verifyMetaSignature({
      rawBody: bodyBytes,
      signatureHeader: signature,
      appSecret: process.env.WHATSAPP_APP_SECRET,
    })
  ) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 })
  }

  let payload: unknown

  try {
    payload = JSON.parse(Buffer.from(bodyBytes).toString("utf8")) as unknown
  } catch {
    return NextResponse.json({ error: "Malformed webhook payload." }, { status: 400 })
  }

  const messages = parseWhatsAppInbound(payload)
  if (messages.length > MAX_MESSAGES_PER_PAYLOAD) {
    return NextResponse.json({ error: "Too many messages in single payload." }, { status: 413 })
  }
  const channelMessages = messages.map(toChannelMessage)

  // S2-T4 layer 2: per-sender bucket. One attacker controlling a sender id
  // cannot burst through the per-IP bucket.
  for (const message of channelMessages) {
    const senderQuota = consumeToken(`whatsapp:${message.senderId}`, DEFAULT_SENDER_LIMIT)
    if (!senderQuota.allowed) {
      return new NextResponse("rate_limited", {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(senderQuota.retryAfterMs / 1000)) },
      })
    }
  }

  const optedOut = channelMessages.filter((message) => isWhatsAppOptOut(message.text))

  if (!process.env.DATABASE_URL) {
    // S2-T2: never echo phone numbers or message ids in the response body.
    return NextResponse.json({
      ok: true,
      received: channelMessages.length,
      optOuts: optedOut.length,
      persisted: false,
      processed: false,
    })
  }

  const audit = new PrismaAuditSink(prisma)
  const webhooks = new PrismaWebhookEventRepository(prisma)
  const suppressions = new PrismaSuppressionRepository(prisma)
  const sessions = new PrismaSessionRepository(prisma)
  let duplicates = 0
  let registered = 0
  let suppressedNew = 0
  let processed = 0
  let lockRejected = 0
  let skipped = 0

  for (const message of channelMessages) {
    const idempotencyKey = makeIdempotencyKey(["meta", "whatsapp", message.externalMessageId])
    const result = await registerWebhookEvent({
      repository: webhooks,
      provider: "meta-whatsapp",
      providerEventId: message.externalMessageId,
      channelType: "WHATSAPP",
      idempotencyKey,
      audit,
    })

    if (result.duplicate) {
      duplicates += 1
      continue
    }

    registered += 1

    // S2-T6: suppression check → session lock → orchestrator → state transition.
    // Replies are still disabled until S3 (RAG + Meta templates).
    const inboundResult = await processInboundMessage(
      { sessions, store: sessions, suppressions, audit },
      {
        channelType: "WHATSAPP",
        channelId: message.senderId,
        externalMessageId: message.externalMessageId,
        text: message.text,
        provider: "meta-whatsapp",
      },
    )

    if (inboundResult.status === "SUPPRESSED") skipped += 1
    else if (inboundResult.status === "LOCK_REJECTED") lockRejected += 1
    else if (inboundResult.status === "PROCESSED") processed += 1

    // If the orchestrator picked OPT_OUT, persist a SuppressionEntry so we
    // suppress all future sends to this number.
    if (
      inboundResult.status === "PROCESSED" &&
      inboundResult.intent === "OPT_OUT"
    ) {
      const suppression = await suppressContact({
        repository: suppressions,
        channelType: "WHATSAPP",
        identifier: message.senderId,
        reason: "OPT_OUT",
        source: "meta-whatsapp",
        safeSummary: "WhatsApp user opted out.",
        audit,
      })
      if (!suppression.duplicate) suppressedNew += 1
    }

    await webhooks.markProcessed(result.event.id, new Date())
  }

  return NextResponse.json({
    ok: true,
    received: channelMessages.length,
    registered,
    duplicates,
    suppressed: suppressedNew,
    skipped,
    lockRejected,
    processed,
    optOuts: optedOut.length,
    persisted: true,
  })
}
