export type Channel = "whatsapp" | "voice"

export type Locale = "de" | "en"

export type ConversationState =
  | "IDLE"
  | "DISCLOSURE"
  | "CONSENT"
  | "FAQ"
  | "BOOKING_COLLECT_DETAILS"
  | "SLOT_SCANNING"
  | "SLOT_OFFERED"
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "RESCHEDULE_VERIFY"
  | "RESCHEDULE_HOLD_NEW_SLOT"
  | "RESCHEDULE_SWAP"
  | "CANCEL_VERIFY"
  | "CANCELLED"
  | "HANDOFF_REQUESTED"
  | "HANDOFF_ACTIVE"
  | "FAILED_SAFE"
  | "OPTED_OUT"

export type GuardrailTopic =
  | "pricing"
  | "refund"
  | "legal"
  | "billing"
  | "contract"
  | "delivery_commitment"

export type HandoffReason =
  | "human_requested"
  | "guardrail_topic"
  | "low_confidence"
  | "no_answer"
  | "latency_failure"
  | "stt_failure"
  | "tts_failure"
  | "tool_failure"
  | "verification_required"

export interface ChannelMessage {
  channel: Channel
  provider: string
  externalMessageId: string
  senderId: string
  recipientId?: string
  text: string
  locale?: Locale
  receivedAt: Date
  metadata?: Record<string, unknown>
}

export interface OrchestratorRequest {
  channel: Channel
  sessionId?: string
  message: ChannelMessage
  currentState?: ConversationState
}

export interface OrchestratorResponse {
  state: ConversationState
  replyText: string
  handoffReason?: HandoffReason
  auditMetadata?: Record<string, unknown>
}

export interface OrchestratorPort {
  handleInbound(input: OrchestratorRequest): Promise<OrchestratorResponse>
}

export interface SuppressionPort {
  isSuppressed(channel: Channel, subjectId: string): Promise<boolean>
  suppress(input: {
    channel: Channel
    subjectId: string
    reason: "opt_out" | "legal_hold" | "owner_request"
    sourceMessageId?: string
  }): Promise<void>
}

export interface AuditPort {
  record(event: {
    channel: Channel
    sessionId?: string
    eventType: string
    redactedMetadata?: Record<string, unknown>
  }): Promise<void>
}

export interface RagResult {
  answer: string
  confidence: number
  citations: Array<{ id: string; title: string }>
}

export interface RagAdapter {
  answer(input: {
    question: string
    locale: Locale
    safeContext?: Record<string, unknown>
  }): Promise<RagResult>
}

export interface ModelOutput {
  intent:
    | "faq"
    | "booking"
    | "handoff"
    | "opt_out"
    | "unknown"
    | "guardrail_refusal"
  reply: string
  confidence: number
  requestedTool?: "calendar_scan" | "calendar_hold" | "calendar_confirm" | "handoff"
  guardrailTopic?: GuardrailTopic
}
