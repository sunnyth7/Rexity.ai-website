export type ChannelType = "WEBSITE" | "WHATSAPP" | "VOICE" | "EMAIL" | "SMS" | "INTERNAL"

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

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "RESCHEDULED" | "EXPIRED"

export type ToolName =
  | "SAFE_SUMMARY"
  | "AUDIT"
  | "SUPPRESSION"
  | "SCAN_SLOTS"
  | "LEASE_SLOT"
  | "CONFIRM_BOOKING"
  | "VERIFY_APPOINTMENT"
  | "CANCEL_APPOINTMENT"
  | "RESCHEDULE_APPOINTMENT"
  | "REQUEST_HANDOFF"

export type AuditEventType =
  | "STATE_TRANSITION"
  | "STATE_TRANSITION_REJECTED"
  | "WEBHOOK_RECEIVED"
  | "WEBHOOK_DUPLICATE"
  | "IDEMPOTENCY_REPLAY"
  | "SESSION_LOCK_ACQUIRED"
  | "SESSION_LOCK_REJECTED"
  | "SAFE_SUMMARY_UPDATED"
  | "SUPPRESSION_CREATED"
  | "APPOINTMENT_LEASED"
  | "APPOINTMENT_CONFIRMED"
  | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_RESCHEDULED"
  | "RETENTION_CLEANUP"
  | "HANDOFF_REQUESTED"
  | "POLICY_BLOCKED"

export interface CommunicationSessionRef {
  id: string
  channelId: string
  channelType: ChannelType
  currentState: ConversationState
  lockVersion?: number
  lockedUntil?: Date | null
}

export interface AuditSink {
  record(event: {
    type: AuditEventType
    actor: string
    sessionId?: string
    leadId?: string
    appointmentId?: string
    idempotencyKey?: string
    safeSummary?: string
    redactedContext?: Record<string, unknown>
  }): Promise<void> | void
}

export interface StateStore {
  updateSessionState(
    sessionId: string,
    nextState: ConversationState,
    expectedCurrentState?: ConversationState,
  ): Promise<CommunicationSessionRef>
}

export interface ChannelInboundEnvelope {
  channelType: ChannelType
  channelId: string
  idempotencyKey: string
  provider: string
  providerEventId: string
  intent:
    | "DISCLOSE"
    | "ACCEPT_DISCLOSURE"
    | "CONSENT"
    | "ASK_FAQ"
    | "START_BOOKING"
    | "OFFER_SLOTS"
    | "CONFIRM_SLOT"
    | "START_RESCHEDULE"
    | "HOLD_RESCHEDULE_SLOT"
    | "CONFIRM_RESCHEDULE"
    | "START_CANCEL"
    | "CONFIRM_CANCEL"
    | "REQUEST_HANDOFF"
    | "OPT_OUT"
    | "FAIL_SAFE"
  safeSummary?: string
  redactedContext?: Record<string, unknown>
}

export interface CalendarSlot {
  startTime: Date
  endTime: Date
}

export interface CalendarEventLease extends CalendarSlot {
  appointmentId: string
  leaseExpiresAt: Date
}

export interface CalendarProvider {
  listBusySlots(window: CalendarSlot): Promise<CalendarSlot[]>
  createEvent(slot: CalendarSlot, details: { summary: string; idempotencyKey: string }): Promise<{ calendarEventId: string }>
  updateEvent(eventId: string, slot: CalendarSlot, details: { summary: string; idempotencyKey: string }): Promise<{ calendarEventId: string }>
  cancelEvent(eventId: string, details: { idempotencyKey: string }): Promise<void>
}

export interface AppointmentRecord extends CalendarSlot {
  id: string
  status: AppointmentStatus
  source: ChannelType
  calendarEventId?: string | null
  leaseExpiresAt?: Date | null
  idempotencyKey?: string | null
  clientName?: string | null
  clientPhone?: string | null
  clientEmail?: string | null
  notesSummary?: string | null
  rescheduledFromId?: string | null
}

export interface AppointmentRepository {
  listActiveOverlaps(slot: CalendarSlot): Promise<AppointmentRecord[]>
  createPendingLease(input: Omit<AppointmentRecord, "id" | "status"> & { leaseExpiresAt: Date }): Promise<AppointmentRecord>
  findById(id: string): Promise<AppointmentRecord | null>
  findByIdempotencyKey(idempotencyKey: string): Promise<AppointmentRecord | null>
  confirm(id: string, calendarEventId: string): Promise<AppointmentRecord>
  cancel(id: string): Promise<AppointmentRecord>
  markRescheduled(id: string): Promise<AppointmentRecord>
  expireLeases(now: Date): Promise<number>
  deleteOlderThan(cutoff: Date, statuses: AppointmentStatus[]): Promise<number>
}
