// S2-T6: shared inbound processing pipeline.
//
// Sequence per inbound channel message:
//   1. webhook idempotency (already done before this is called)
//   2. suppression check  → if suppressed, skip but return reason
//   3. session resolve   → upserts a CommunicationSession by channel + sender
//   4. session lock      → optimistic lock window (TTL 30s default)
//   5. intent classify   → IDLE→DISCLOSURE on first contact; OPT_OUT on opt-out
//                          text; otherwise no transition (we don't have NLU yet)
//   6. state transition  → through orchestrator + state machine
//
// Outbound replies are NOT generated here. Reply generation lands in Sprint 3
// once RAG + voice are wired (and Meta templates approved via P-META).

import { handleSharedInbound, type SessionResolver } from "./orchestrator.ts"
import { withSessionLock, type SessionLockRepository } from "./session-lock.ts"
import type {
  AuditSink,
  ChannelInboundEnvelope,
  ChannelType,
  CommunicationSessionRef,
  StateStore,
} from "./types.ts"
import type { SuppressionRepository } from "./suppression.ts"
import { normalizeSuppressionIdentifier } from "./suppression.ts"

export type InboundMessage = {
  channelType: ChannelType
  channelId: string // sender's stable id (e.g. WhatsApp E.164)
  externalMessageId: string
  text: string
  provider: string
}

export type InboundResult =
  | { status: "SUPPRESSED" }
  | { status: "PROCESSED"; session: CommunicationSessionRef; intent: ChannelInboundEnvelope["intent"] }
  | { status: "NO_TRANSITION"; session: CommunicationSessionRef }
  | { status: "LOCK_REJECTED" }

export interface InboundDeps {
  suppressions: SuppressionRepository
  sessions: SessionResolver & SessionLockRepository
  store: StateStore
  audit?: AuditSink
  /** Pluggable text→intent classifier. Default uses the simple opt-out / first-contact heuristic. */
  classifyIntent?: (message: InboundMessage, currentState: CommunicationSessionRef["currentState"]) => ChannelInboundEnvelope["intent"] | null
}

const DEFAULT_OPT_OUT_PATTERNS = [
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

function defaultClassifier(
  message: InboundMessage,
  currentState: CommunicationSessionRef["currentState"],
): ChannelInboundEnvelope["intent"] | null {
  if (DEFAULT_OPT_OUT_PATTERNS.some((pattern) => pattern.test(message.text))) {
    return "OPT_OUT"
  }
  if (currentState === "IDLE") {
    return "DISCLOSE"
  }
  // We don't classify mid-conversation intents here yet — Sprint 3 RAG/LLM does.
  return null
}

export async function processInboundMessage(
  deps: InboundDeps,
  message: InboundMessage,
): Promise<InboundResult> {
  const normalizedSender = normalizeSuppressionIdentifier(message.channelId)
  const suppression = await deps.suppressions.find(message.channelType, normalizedSender)
  if (suppression) {
    await deps.audit?.record({
      type: "POLICY_BLOCKED",
      actor: message.provider,
      safeSummary: "Inbound from suppressed sender skipped.",
    })
    return { status: "SUPPRESSED" }
  }

  const session = await deps.sessions.resolve(message.channelId, message.channelType)

  try {
    return await withSessionLock({
      sessionId: session.id,
      repository: deps.sessions,
      audit: deps.audit,
      run: async (locked) => {
        const classify = deps.classifyIntent ?? defaultClassifier
        const intent = classify(message, locked.currentState)
        if (!intent) {
          return { status: "NO_TRANSITION" as const, session: locked }
        }
        const envelope: ChannelInboundEnvelope = {
          channelType: message.channelType,
          channelId: message.channelId,
          idempotencyKey: `${message.provider}:${message.externalMessageId}`,
          provider: message.provider,
          providerEventId: message.externalMessageId,
          intent,
        }
        const updated = await handleSharedInbound({
          envelope,
          sessions: deps.sessions,
          store: deps.store,
          audit: deps.audit,
        })
        return { status: "PROCESSED" as const, session: updated, intent }
      },
    })
  } catch (err) {
    if (err instanceof Error && /locked/i.test(err.message)) {
      return { status: "LOCK_REJECTED" }
    }
    throw err
  }
}
