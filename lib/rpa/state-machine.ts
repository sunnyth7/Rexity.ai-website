import type { AuditSink, ConversationState, StateStore, ToolName } from "./types.ts"

export const allowedTransitions: Readonly<Record<ConversationState, readonly ConversationState[]>> = {
  IDLE: ["DISCLOSURE", "HANDOFF_REQUESTED", "OPTED_OUT", "FAILED_SAFE"],
  DISCLOSURE: ["CONSENT", "FAQ", "BOOKING_COLLECT_DETAILS", "HANDOFF_REQUESTED", "OPTED_OUT", "FAILED_SAFE"],
  CONSENT: ["FAQ", "BOOKING_COLLECT_DETAILS", "HANDOFF_REQUESTED", "OPTED_OUT", "FAILED_SAFE"],
  FAQ: ["BOOKING_COLLECT_DETAILS", "HANDOFF_REQUESTED", "OPTED_OUT", "FAILED_SAFE"],
  BOOKING_COLLECT_DETAILS: ["SLOT_SCANNING", "HANDOFF_REQUESTED", "OPTED_OUT", "FAILED_SAFE"],
  SLOT_SCANNING: ["SLOT_OFFERED", "HANDOFF_REQUESTED", "FAILED_SAFE"],
  SLOT_OFFERED: ["PENDING_CONFIRMATION", "SLOT_SCANNING", "HANDOFF_REQUESTED", "OPTED_OUT", "FAILED_SAFE"],
  PENDING_CONFIRMATION: ["CONFIRMED", "SLOT_SCANNING", "HANDOFF_REQUESTED", "OPTED_OUT", "FAILED_SAFE"],
  CONFIRMED: ["RESCHEDULE_VERIFY", "CANCEL_VERIFY", "FAQ", "HANDOFF_REQUESTED", "OPTED_OUT", "FAILED_SAFE"],
  RESCHEDULE_VERIFY: ["RESCHEDULE_HOLD_NEW_SLOT", "HANDOFF_REQUESTED", "FAILED_SAFE"],
  RESCHEDULE_HOLD_NEW_SLOT: ["RESCHEDULE_SWAP", "HANDOFF_REQUESTED", "FAILED_SAFE"],
  RESCHEDULE_SWAP: ["CONFIRMED", "HANDOFF_REQUESTED", "FAILED_SAFE"],
  CANCEL_VERIFY: ["CANCELLED", "HANDOFF_REQUESTED", "FAILED_SAFE"],
  CANCELLED: ["FAQ", "HANDOFF_REQUESTED", "OPTED_OUT"],
  HANDOFF_REQUESTED: ["HANDOFF_ACTIVE", "FAILED_SAFE"],
  HANDOFF_ACTIVE: ["FAQ", "CONFIRMED", "CANCELLED", "FAILED_SAFE"],
  FAILED_SAFE: ["HANDOFF_REQUESTED", "HANDOFF_ACTIVE"],
  OPTED_OUT: [],
}

export const stateTools: Readonly<Record<ConversationState, readonly ToolName[]>> = {
  IDLE: ["AUDIT"],
  DISCLOSURE: ["AUDIT", "SAFE_SUMMARY", "REQUEST_HANDOFF", "SUPPRESSION"],
  CONSENT: ["AUDIT", "SAFE_SUMMARY", "REQUEST_HANDOFF", "SUPPRESSION"],
  FAQ: ["AUDIT", "SAFE_SUMMARY", "REQUEST_HANDOFF", "SUPPRESSION"],
  BOOKING_COLLECT_DETAILS: ["AUDIT", "SAFE_SUMMARY", "REQUEST_HANDOFF", "SUPPRESSION"],
  SLOT_SCANNING: ["AUDIT", "SCAN_SLOTS", "REQUEST_HANDOFF"],
  SLOT_OFFERED: ["AUDIT", "LEASE_SLOT", "REQUEST_HANDOFF", "SUPPRESSION"],
  PENDING_CONFIRMATION: ["AUDIT", "CONFIRM_BOOKING", "REQUEST_HANDOFF", "SUPPRESSION"],
  CONFIRMED: ["AUDIT", "VERIFY_APPOINTMENT", "REQUEST_HANDOFF", "SUPPRESSION"],
  RESCHEDULE_VERIFY: ["AUDIT", "VERIFY_APPOINTMENT", "REQUEST_HANDOFF"],
  RESCHEDULE_HOLD_NEW_SLOT: ["AUDIT", "SCAN_SLOTS", "LEASE_SLOT", "REQUEST_HANDOFF"],
  RESCHEDULE_SWAP: ["AUDIT", "RESCHEDULE_APPOINTMENT", "REQUEST_HANDOFF"],
  CANCEL_VERIFY: ["AUDIT", "VERIFY_APPOINTMENT", "CANCEL_APPOINTMENT", "REQUEST_HANDOFF"],
  CANCELLED: ["AUDIT", "SAFE_SUMMARY", "REQUEST_HANDOFF", "SUPPRESSION"],
  HANDOFF_REQUESTED: ["AUDIT", "REQUEST_HANDOFF"],
  HANDOFF_ACTIVE: ["AUDIT", "SAFE_SUMMARY"],
  FAILED_SAFE: ["AUDIT", "REQUEST_HANDOFF"],
  OPTED_OUT: ["AUDIT", "SUPPRESSION"],
}

export function canTransition(from: ConversationState, to: ConversationState): boolean {
  return allowedTransitions[from].includes(to)
}

export function assertTransition(from: ConversationState, to: ConversationState): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid conversation transition: ${from} -> ${to}`)
  }
}

export function assertToolAllowed(state: ConversationState, tool: ToolName): void {
  if (!stateTools[state].includes(tool)) {
    throw new Error(`Tool ${tool} is not allowed while session is in ${state}`)
  }
}

export async function transitionSession(input: {
  sessionId: string
  from: ConversationState
  to: ConversationState
  store: StateStore
  audit?: AuditSink
  actor?: string
  idempotencyKey?: string
}) {
  try {
    assertTransition(input.from, input.to)
  } catch (error) {
    await input.audit?.record({
      type: "STATE_TRANSITION_REJECTED",
      actor: input.actor ?? "system",
      sessionId: input.sessionId,
      idempotencyKey: input.idempotencyKey,
      safeSummary: error instanceof Error ? error.message : "Invalid state transition rejected.",
    })
    throw error
  }

  const updated = await input.store.updateSessionState(input.sessionId, input.to, input.from)
  await input.audit?.record({
    type: "STATE_TRANSITION",
    actor: input.actor ?? "system",
    sessionId: input.sessionId,
    idempotencyKey: input.idempotencyKey,
    redactedContext: { from: input.from, to: input.to },
  })
  return updated
}
