import type {
  AppointmentRecord,
  AppointmentRepository,
  AppointmentStatus,
  CalendarSlot,
  ChannelType,
  CommunicationSessionRef,
  ConversationState,
} from "./types.ts"
import type { SessionLockRepository } from "./session-lock.ts"
import type { StateStore } from "./types.ts"
import type { SuppressionRepository } from "./suppression.ts"
import type { WebhookEventRecord, WebhookEventRepository } from "./idempotency.ts"
import { overlaps } from "./calendar.ts"

let sequence = 0
const id = (prefix: string) => `${prefix}_${++sequence}`

export class MemoryAppointmentRepository implements AppointmentRepository {
  readonly records: AppointmentRecord[] = []

  async listActiveOverlaps(slot: CalendarSlot) {
    return this.records.filter((item) => ["PENDING", "CONFIRMED"].includes(item.status) && overlaps(item, slot))
  }

  async createPendingLease(input: Omit<AppointmentRecord, "id" | "status"> & { leaseExpiresAt: Date }) {
    const record: AppointmentRecord = { id: id("apt"), status: "PENDING", ...input }
    this.records.push(record)
    return record
  }

  async findById(recordId: string) {
    return this.records.find((item) => item.id === recordId) ?? null
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    return this.records.find((item) => item.idempotencyKey === idempotencyKey) ?? null
  }

  async confirm(recordId: string, calendarEventId: string) {
    const record = await this.required(recordId)
    record.status = "CONFIRMED"
    record.calendarEventId = calendarEventId
    record.leaseExpiresAt = null
    return record
  }

  async cancel(recordId: string) {
    const record = await this.required(recordId)
    record.status = "CANCELLED"
    return record
  }

  async markRescheduled(recordId: string) {
    const record = await this.required(recordId)
    record.status = "RESCHEDULED"
    return record
  }

  async expireLeases(now: Date) {
    let count = 0
    for (const record of this.records) {
      if (record.status === "PENDING" && record.leaseExpiresAt && record.leaseExpiresAt <= now) {
        record.status = "EXPIRED"
        count += 1
      }
    }
    return count
  }

  async deleteOlderThan(cutoff: Date, statuses: AppointmentStatus[]) {
    const before = this.records.length
    for (let index = this.records.length - 1; index >= 0; index -= 1) {
      const record = this.records[index]
      if (statuses.includes(record.status) && record.endTime < cutoff) this.records.splice(index, 1)
    }
    return before - this.records.length
  }

  private async required(recordId: string) {
    const record = await this.findById(recordId)
    if (!record) throw new Error("Appointment not found")
    return record
  }
}

export class MemoryCalendarProvider {
  readonly busy: CalendarSlot[] = []
  readonly cancelled: string[] = []

  async listBusySlots() {
    return this.busy
  }

  async createEvent(slot: CalendarSlot, details: { idempotencyKey: string }) {
    const calendarEventId = `cal_${details.idempotencyKey}`
    this.busy.push({ ...slot })
    return { calendarEventId }
  }

  async updateEvent(_eventId: string, slot: CalendarSlot, details: { idempotencyKey: string }) {
    return this.createEvent(slot, details)
  }

  async cancelEvent(eventId: string) {
    this.cancelled.push(eventId)
  }
}

export class MemoryWebhookEventRepository implements WebhookEventRepository {
  readonly records: WebhookEventRecord[] = []

  async findByProviderEvent(provider: string, providerEventId: string) {
    return this.records.find((item) => item.provider === provider && item.providerEventId === providerEventId) ?? null
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    return this.records.find((item) => item.idempotencyKey === idempotencyKey) ?? null
  }

  async create(event: Omit<WebhookEventRecord, "id">) {
    const record = { id: id("webhook"), ...event }
    this.records.push(record)
    return record
  }

  async markProcessed(recordId: string, processedAt: Date) {
    const record = this.records.find((item) => item.id === recordId)
    if (!record) throw new Error("Webhook event not found")
    record.status = "PROCESSED"
    record.processedAt = processedAt
    return record
  }

  async markFailed(recordId: string, errorSummary: string) {
    const record = this.records.find((item) => item.id === recordId)
    if (!record) throw new Error("Webhook event not found")
    record.status = "FAILED"
    record.errorSummary = errorSummary
    return record
  }
}

export class MemorySessionRepository implements StateStore, SessionLockRepository {
  readonly sessions = new Map<string, CommunicationSessionRef>()

  add(session: CommunicationSessionRef) {
    this.sessions.set(session.id, { ...session, lockVersion: session.lockVersion ?? 0 })
  }

  resolve(channelId: string, channelType: ChannelType) {
    const existing = [...this.sessions.values()].find((item) => item.channelId === channelId && item.channelType === channelType)
    if (existing) return Promise.resolve(existing)
    const session: CommunicationSessionRef = { id: id("session"), channelId, channelType, currentState: "IDLE", lockVersion: 0 }
    this.add(session)
    return Promise.resolve(session)
  }

  async updateSessionState(sessionId: string, nextState: ConversationState, expectedCurrentState?: ConversationState) {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error("Session not found")
    if (expectedCurrentState && session.currentState !== expectedCurrentState) throw new Error("Session state changed during update")
    session.currentState = nextState
    return session
  }

  async acquireLock(sessionId: string, now: Date, lockedUntil: Date) {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error("Session not found")
    if (session.lockedUntil && session.lockedUntil > now) return null
    session.lockVersion = (session.lockVersion ?? 0) + 1
    session.lockedUntil = lockedUntil
    return { ...session }
  }

  async releaseLock(sessionId: string, lockVersion: number) {
    const session = this.sessions.get(sessionId)
    if (session && session.lockVersion === lockVersion) session.lockedUntil = null
  }
}

export class MemorySuppressionRepository implements SuppressionRepository {
  readonly records: Array<{ id: string; channelType: ChannelType; identifier: string }> = []

  async find(channelType: ChannelType, identifier: string) {
    return this.records.find((item) => item.channelType === channelType && item.identifier === identifier) ?? null
  }

  async create(input: { channelType: ChannelType; identifier: string }) {
    const record = { id: id("suppress"), ...input }
    this.records.push(record)
    return record
  }
}
