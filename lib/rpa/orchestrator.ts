import { assertToolAllowed, transitionSession } from "./state-machine.ts"
import type { AuditSink, ChannelInboundEnvelope, CommunicationSessionRef, ConversationState, StateStore } from "./types.ts"

export interface SessionResolver {
  resolve(channelId: string, channelType: ChannelInboundEnvelope["channelType"]): Promise<CommunicationSessionRef>
}

const intentState: Record<ChannelInboundEnvelope["intent"], ConversationState> = {
  DISCLOSE: "DISCLOSURE",
  ACCEPT_DISCLOSURE: "CONSENT",
  CONSENT: "FAQ",
  ASK_FAQ: "FAQ",
  START_BOOKING: "BOOKING_COLLECT_DETAILS",
  OFFER_SLOTS: "SLOT_OFFERED",
  CONFIRM_SLOT: "CONFIRMED",
  START_RESCHEDULE: "RESCHEDULE_VERIFY",
  HOLD_RESCHEDULE_SLOT: "RESCHEDULE_HOLD_NEW_SLOT",
  CONFIRM_RESCHEDULE: "CONFIRMED",
  START_CANCEL: "CANCEL_VERIFY",
  CONFIRM_CANCEL: "CANCELLED",
  REQUEST_HANDOFF: "HANDOFF_REQUESTED",
  OPT_OUT: "OPTED_OUT",
  FAIL_SAFE: "FAILED_SAFE",
}

export async function handleSharedInbound(input: {
  envelope: ChannelInboundEnvelope
  sessions: SessionResolver
  store: StateStore
  audit?: AuditSink
}): Promise<CommunicationSessionRef> {
  const session = await input.sessions.resolve(input.envelope.channelId, input.envelope.channelType)
  const nextState = intentState[input.envelope.intent]

  if (input.envelope.intent === "OFFER_SLOTS") assertToolAllowed("SLOT_SCANNING", "SCAN_SLOTS")
  if (input.envelope.intent === "CONFIRM_SLOT") assertToolAllowed("PENDING_CONFIRMATION", "CONFIRM_BOOKING")
  if (input.envelope.intent === "CONFIRM_CANCEL") assertToolAllowed("CANCEL_VERIFY", "CANCEL_APPOINTMENT")
  if (input.envelope.intent === "CONFIRM_RESCHEDULE") assertToolAllowed("RESCHEDULE_SWAP", "RESCHEDULE_APPOINTMENT")

  return transitionSession({
    sessionId: session.id,
    from: session.currentState,
    to: nextState,
    store: input.store,
    audit: input.audit,
    actor: input.envelope.provider,
    idempotencyKey: input.envelope.idempotencyKey,
  })
}

export function rejectDirectModelMutation(): never {
  throw new Error("Model output cannot mutate state directly; route structured intents through the orchestrator.")
}
