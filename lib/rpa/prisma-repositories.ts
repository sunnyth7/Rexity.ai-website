import type { PrismaClient } from "@prisma/client"

import { makeSafeSummary, redactValue } from "./audit.ts"
import type { WebhookEventRecord, WebhookEventRepository } from "./idempotency.ts"
import type { RetentionRepository } from "./retention.ts"
import type { SessionLockRepository } from "./session-lock.ts"
import type { SuppressionRepository } from "./suppression.ts"
import type {
  AppointmentRecord,
  AppointmentRepository,
  AppointmentStatus,
  CalendarSlot,
  AuditSink,
  ChannelType,
  CommunicationSessionRef,
  ConversationState,
  StateStore,
} from "./types.ts"

type Db = PrismaClient

/**
 * Detect Prisma "unique constraint failed" errors (P2002) without depending on
 * `Prisma.PrismaClientKnownRequestError`, which would force a value-import of the
 * Prisma client into all callers (including tests using the memory repos).
 */
function isPrismaUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false
  const e = err as { code?: unknown; name?: unknown }
  return e.code === "P2002" || e.name === "PrismaClientKnownRequestError"
}

/**
 * Postgres exclusion-constraint violation (SQLSTATE 23P01). Raised by the
 * btree_gist range exclusion added in S1-T2 when two appointments would overlap.
 * Prisma surfaces this as a P2010 raw query error or a P2034 transaction error
 * depending on path; we sniff the inner code defensively.
 */
function isPrismaExclusionViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false
  const e = err as { code?: unknown; meta?: { code?: unknown } }
  return e.code === "P2010" || e.meta?.code === "23P01" || e.code === "23P01"
}

function toAppointmentRecord(record: {
  id: string
  status: AppointmentStatus
  source: ChannelType
  startTime: Date
  endTime: Date
  calendarEventId: string | null
  leaseExpiresAt: Date | null
  idempotencyKey: string | null
  clientName: string | null
  clientPhone: string | null
  clientEmail: string | null
  notesSummary: string | null
  rescheduledFromId: string | null
}): AppointmentRecord {
  return {
    id: record.id,
    status: record.status,
    source: record.source,
    startTime: record.startTime,
    endTime: record.endTime,
    calendarEventId: record.calendarEventId,
    leaseExpiresAt: record.leaseExpiresAt,
    idempotencyKey: record.idempotencyKey,
    clientName: record.clientName,
    clientPhone: record.clientPhone,
    clientEmail: record.clientEmail,
    notesSummary: record.notesSummary,
    rescheduledFromId: record.rescheduledFromId,
  }
}

function toSessionRef(record: {
  id: string
  channelId: string
  channelType: ChannelType
  currentState: ConversationState
  lockVersion: number
  lockedUntil: Date | null
}): CommunicationSessionRef {
  return {
    id: record.id,
    channelId: record.channelId,
    channelType: record.channelType,
    currentState: record.currentState,
    lockVersion: record.lockVersion,
    lockedUntil: record.lockedUntil,
  }
}

function toWebhookEvent(record: {
  id: string
  provider: string
  providerEventId: string
  channelType: ChannelType
  idempotencyKey: string
  status: string
  processedAt: Date | null
  errorSummary: string | null
}): WebhookEventRecord {
  return {
    id: record.id,
    provider: record.provider,
    providerEventId: record.providerEventId,
    channelType: record.channelType,
    idempotencyKey: record.idempotencyKey,
    status: record.status as WebhookEventRecord["status"],
    processedAt: record.processedAt,
    errorSummary: record.errorSummary,
  }
}

export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly db: Db) {}

  async listActiveOverlaps(slot: CalendarSlot) {
    const records = await this.db.appointment.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: slot.endTime },
        endTime: { gt: slot.startTime },
      },
    })
    return records.map(toAppointmentRecord)
  }

  async createPendingLease(input: Omit<AppointmentRecord, "id" | "status"> & { leaseExpiresAt: Date }) {
    try {
      const record = await this.db.appointment.create({
        data: {
          startTime: input.startTime,
          endTime: input.endTime,
          source: input.source,
          status: "PENDING",
          calendarEventId: input.calendarEventId,
          leaseExpiresAt: input.leaseExpiresAt,
          idempotencyKey: input.idempotencyKey,
          clientName: input.clientName,
          clientPhone: input.clientPhone,
          clientEmail: input.clientEmail,
          notesSummary: input.notesSummary ? makeSafeSummary(input.notesSummary) : null,
          rescheduledFromId: input.rescheduledFromId,
        },
      })
      return toAppointmentRecord(record)
    } catch (err) {
      // Possible races we want to recognize:
      //   - same idempotency key inserted twice → return the existing row (replay)
      //   - exclusion constraint on overlapping time range (S1-T2 migration) → surface as
      //     "slot unavailable" to the caller via a dedicated error
      if (isPrismaUniqueViolation(err) && input.idempotencyKey) {
        const existing = await this.findByIdempotencyKey(input.idempotencyKey)
        if (existing) return existing
      }
      if (isPrismaExclusionViolation(err)) {
        throw new Error("Slot is not available")
      }
      throw err
    }
  }

  async findById(id: string) {
    const record = await this.db.appointment.findUnique({ where: { id } })
    return record ? toAppointmentRecord(record) : null
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    const record = await this.db.appointment.findUnique({ where: { idempotencyKey } })
    return record ? toAppointmentRecord(record) : null
  }

  async confirm(id: string, calendarEventId: string) {
    const record = await this.db.appointment.update({
      where: { id },
      data: { status: "CONFIRMED", calendarEventId, leaseExpiresAt: null },
    })
    return toAppointmentRecord(record)
  }

  async cancel(id: string) {
    const record = await this.db.appointment.update({ where: { id }, data: { status: "CANCELLED" } })
    return toAppointmentRecord(record)
  }

  async markRescheduled(id: string) {
    const record = await this.db.appointment.update({ where: { id }, data: { status: "RESCHEDULED" } })
    return toAppointmentRecord(record)
  }

  async expireLeases(now: Date) {
    const result = await this.db.appointment.updateMany({
      where: { status: "PENDING", leaseExpiresAt: { lte: now } },
      data: { status: "EXPIRED" },
    })
    return result.count
  }

  async deleteOlderThan(cutoff: Date, statuses: AppointmentStatus[]) {
    const result = await this.db.appointment.deleteMany({
      where: { status: { in: statuses }, endTime: { lt: cutoff } },
    })
    return result.count
  }
}

export class PrismaWebhookEventRepository implements WebhookEventRepository {
  constructor(private readonly db: Db) {}

  async findByProviderEvent(provider: string, providerEventId: string) {
    const record = await this.db.webhookEvent.findUnique({ where: { provider_providerEventId: { provider, providerEventId } } })
    return record ? toWebhookEvent(record) : null
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    const record = await this.db.webhookEvent.findUnique({ where: { idempotencyKey } })
    return record ? toWebhookEvent(record) : null
  }

  async create(event: Omit<WebhookEventRecord, "id">) {
    try {
      const record = await this.db.webhookEvent.create({ data: event })
      return toWebhookEvent(record)
    } catch (err) {
      // Concurrent insert race: another request created the same idempotency key
      // or (provider, providerEventId) pair. Re-read and return as duplicate.
      if (isPrismaUniqueViolation(err)) {
        const existing =
          (await this.findByProviderEvent(event.provider, event.providerEventId)) ??
          (await this.findByIdempotencyKey(event.idempotencyKey))
        if (existing) return existing
      }
      throw err
    }
  }

  async markProcessed(id: string, processedAt: Date) {
    const record = await this.db.webhookEvent.update({
      where: { id },
      data: { status: "PROCESSED", processedAt },
    })
    return toWebhookEvent(record)
  }

  async markFailed(id: string, errorSummary: string) {
    const record = await this.db.webhookEvent.update({
      where: { id },
      data: { status: "FAILED", errorSummary: makeSafeSummary(errorSummary) },
    })
    return toWebhookEvent(record)
  }
}

export class PrismaSessionRepository implements StateStore, SessionLockRepository {
  constructor(private readonly db: Db) {}

  async resolve(channelId: string, channelType: ChannelType) {
    const record = await this.db.communicationSession.upsert({
      where: { channelId_channelType: { channelId, channelType } },
      update: { lastActive: new Date() },
      create: { channelId, channelType, currentState: "IDLE" },
    })
    return toSessionRef(record)
  }

  async updateSessionState(sessionId: string, nextState: ConversationState, expectedCurrentState?: ConversationState) {
    const result = await this.db.communicationSession.updateMany({
      where: expectedCurrentState ? { id: sessionId, currentState: expectedCurrentState } : { id: sessionId },
      data: { currentState: nextState, lastActive: new Date() },
    })
    if (result.count !== 1) throw new Error("Session state changed during update")

    const record = await this.db.communicationSession.findUniqueOrThrow({ where: { id: sessionId } })
    return toSessionRef(record)
  }

  async acquireLock(sessionId: string, now: Date, lockedUntil: Date) {
    const result = await this.db.communicationSession.updateMany({
      where: {
        id: sessionId,
        OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
      },
      data: { lockedUntil, lockVersion: { increment: 1 } },
    })
    if (result.count !== 1) return null

    const record = await this.db.communicationSession.findUniqueOrThrow({ where: { id: sessionId } })
    return toSessionRef(record)
  }

  async releaseLock(sessionId: string, lockVersion: number) {
    await this.db.communicationSession.updateMany({
      where: { id: sessionId, lockVersion },
      data: { lockedUntil: null },
    })
  }
}

export class PrismaSuppressionRepository implements SuppressionRepository {
  constructor(private readonly db: Db) {}

  async find(channelType: ChannelType, identifier: string) {
    return this.db.suppressionEntry.findUnique({ where: { channelType_identifier: { channelType, identifier } } })
  }

  async create(input: Parameters<SuppressionRepository["create"]>[0]) {
    try {
      return await this.db.suppressionEntry.create({
        data: {
          channelType: input.channelType,
          identifier: input.identifier,
          reason: input.reason,
          source: input.source,
          safeSummary: input.safeSummary ? makeSafeSummary(input.safeSummary) : null,
          expiresAt: input.expiresAt,
        },
      })
    } catch (err) {
      // Concurrent insert race: another request created the same (channelType, identifier).
      // Re-read and return the existing row.
      if (isPrismaUniqueViolation(err)) {
        const existing = await this.find(input.channelType, input.identifier)
        if (existing) return existing as { id: string; identifier: string }
      }
      throw err
    }
  }
}

export class PrismaAuditSink implements AuditSink {
  constructor(private readonly db: Db) {}

  async record(event: Parameters<AuditSink["record"]>[0]) {
    await this.db.auditEvent.create({
      data: {
        type: event.type,
        actor: event.actor,
        sessionId: event.sessionId,
        leadId: event.leadId,
        appointmentId: event.appointmentId,
        idempotencyKey: event.idempotencyKey,
        safeSummary: event.safeSummary ? makeSafeSummary(event.safeSummary) : null,
        redactedContext: event.redactedContext ? (redactValue(event.redactedContext) as object) : undefined,
      },
    })
  }
}

export class PrismaRetentionRepository implements RetentionRepository {
  constructor(private readonly db: Db) {}

  async deleteWebhookEventsOlderThan(cutoff: Date) {
    const result = await this.db.webhookEvent.deleteMany({ where: { createdAt: { lt: cutoff } } })
    return result.count
  }

  async deleteAuditEventsOlderThan(cutoff: Date) {
    const result = await this.db.auditEvent.deleteMany({ where: { createdAt: { lt: cutoff } } })
    return result.count
  }

  async clearSessionSummariesOlderThan(cutoff: Date) {
    const result = await this.db.communicationSession.updateMany({
      where: { lastActive: { lt: cutoff }, safeSummary: { not: null } },
      data: { safeSummary: null },
    })
    return result.count
  }

  async deleteExpiredSuppressions(now: Date) {
    const result = await this.db.suppressionEntry.deleteMany({ where: { expiresAt: { lte: now } } })
    return result.count
  }

  /**
   * S2-T3: only delete leads that have no appointments at all (so we never
   * delete a Lead row that still backs a CONFIRMED Appointment) and whose
   * `updatedAt` is older than the cutoff.
   */
  async deleteUnconvertedLeadsOlderThan(cutoff: Date) {
    const result = await this.db.lead.deleteMany({
      where: {
        updatedAt: { lt: cutoff },
        appointments: { none: {} },
      },
    })
    return result.count
  }
}
