import type { AppointmentRecord, AppointmentRepository, CalendarProvider, CalendarSlot, ChannelType } from "./types.ts"
import { runOnce } from "./idempotency.ts"

const DEFAULT_LEASE_MS = 10 * 60 * 1000
const DEFAULT_BUSINESS_TIMEZONE = "Europe/Berlin"

/**
 * S2-T5: extract local weekday + hour for a given IANA timezone.
 * Replaces `Date#getDay()` / `Date#getHours()` which used the server's local
 * timezone (UTC on Vercel) and would offer 9–17 UTC = 11–19 Berlin.
 */
function localTimePartsInZone(date: Date, timeZone: string): { weekday: number; hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  const parts = formatter.formatToParts(date)
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value])) as Record<string, string>
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    weekday: weekdayMap[lookup.weekday] ?? 0,
    hour: parseInt(lookup.hour, 10),
    minute: parseInt(lookup.minute, 10),
  }
}

export function overlaps(a: CalendarSlot, b: CalendarSlot): boolean {
  return a.startTime < b.endTime && b.startTime < a.endTime
}

export function assertValidSlot(slot: CalendarSlot): void {
  if (!(slot.startTime instanceof Date) || !(slot.endTime instanceof Date) || slot.startTime >= slot.endTime) {
    throw new Error("Invalid calendar slot")
  }
}

export async function scanAvailableSlots(input: {
  provider: CalendarProvider
  appointments: AppointmentRepository
  window: CalendarSlot
  slotMinutes?: number
  limit?: number
  /**
   * Hours are interpreted in `timeZone`. Default 09:00–17:00 Mon–Fri Europe/Berlin.
   * Pass `timeZone: "UTC"` to operate on raw UTC hours (legacy behavior).
   */
  businessHours?: { startHour: number; endHour: number; weekdays: number[]; timeZone?: string }
}): Promise<CalendarSlot[]> {
  assertValidSlot(input.window)
  const slotMinutes = input.slotMinutes ?? 30
  const limit = input.limit ?? 3
  const businessHours = input.businessHours ?? {
    startHour: 9,
    endHour: 17,
    weekdays: [1, 2, 3, 4, 5],
    timeZone: DEFAULT_BUSINESS_TIMEZONE,
  }
  const timeZone = businessHours.timeZone ?? DEFAULT_BUSINESS_TIMEZONE
  const busy = await input.provider.listBusySlots(input.window)
  const available: CalendarSlot[] = []

  for (
    let cursor = new Date(input.window.startTime);
    cursor.getTime() + slotMinutes * 60_000 <= input.window.endTime.getTime();
    cursor = new Date(cursor.getTime() + slotMinutes * 60_000)
  ) {
    const slot = { startTime: cursor, endTime: new Date(cursor.getTime() + slotMinutes * 60_000) }
    const startLocal = localTimePartsInZone(slot.startTime, timeZone)
    const endLocal = localTimePartsInZone(slot.endTime, timeZone)
    if (!businessHours.weekdays.includes(startLocal.weekday)) continue
    if (startLocal.hour < businessHours.startHour) continue
    // End hour: an end exactly at endHour:00 is acceptable; later is not.
    if (endLocal.hour > businessHours.endHour) continue
    if (endLocal.hour === businessHours.endHour && endLocal.minute > 0) continue
    if (busy.some((busySlot) => overlaps(slot, busySlot))) continue
    if ((await input.appointments.listActiveOverlaps(slot)).length > 0) continue

    available.push(slot)
    if (available.length >= limit) break
  }

  return available
}

export async function createPendingLease(input: {
  appointments: AppointmentRepository
  slot: CalendarSlot
  source: ChannelType
  idempotencyKey: string
  now?: Date
  leaseMs?: number
  clientName?: string
  clientPhone?: string
  clientEmail?: string
  notesSummary?: string
}): Promise<{ replayed: boolean; appointment: AppointmentRecord }> {
  assertValidSlot(input.slot)
  return runOnce({
    key: input.idempotencyKey,
    lookup: (key) => input.appointments.findByIdempotencyKey(key),
    create: async () => {
      const overlaps = await input.appointments.listActiveOverlaps(input.slot)
      if (overlaps.length > 0) {
        throw new Error("Slot is not available")
      }

      return input.appointments.createPendingLease({
        ...input.slot,
        source: input.source,
        idempotencyKey: input.idempotencyKey,
        leaseExpiresAt: new Date((input.now ?? new Date()).getTime() + (input.leaseMs ?? DEFAULT_LEASE_MS)),
        clientName: input.clientName,
        clientPhone: input.clientPhone,
        clientEmail: input.clientEmail,
        notesSummary: input.notesSummary,
        calendarEventId: null,
        rescheduledFromId: null,
      })
    },
  }).then(({ replayed, value }) => ({ replayed, appointment: value }))
}

export async function confirmBooking(input: {
  appointments: AppointmentRepository
  provider: CalendarProvider
  appointmentId: string
  idempotencyKey: string
  now?: Date
}): Promise<AppointmentRecord> {
  const appointment = await input.appointments.findById(input.appointmentId)
  if (!appointment) throw new Error("Appointment not found")
  if (appointment.status === "CONFIRMED") return appointment
  if (appointment.status !== "PENDING") throw new Error(`Cannot confirm appointment in ${appointment.status}`)
  if (appointment.leaseExpiresAt && appointment.leaseExpiresAt <= (input.now ?? new Date())) {
    throw new Error("Appointment lease expired")
  }
  if ((await input.appointments.listActiveOverlaps(appointment)).some((item) => item.id !== appointment.id)) {
    throw new Error("Slot is no longer available")
  }

  const event = await input.provider.createEvent(appointment, {
    summary: appointment.notesSummary ?? "Rexity showcase appointment",
    idempotencyKey: input.idempotencyKey,
  })
  return input.appointments.confirm(appointment.id, event.calendarEventId)
}

export async function cancelAppointment(input: {
  appointments: AppointmentRepository
  provider: CalendarProvider
  appointmentId: string
  idempotencyKey: string
  verified: boolean
}): Promise<AppointmentRecord> {
  if (!input.verified) throw new Error("Cancellation requires caller verification")
  const appointment = await input.appointments.findById(input.appointmentId)
  if (!appointment) throw new Error("Appointment not found")
  if (appointment.status === "CANCELLED") return appointment
  if (appointment.status !== "CONFIRMED" && appointment.status !== "PENDING") {
    throw new Error(`Cannot cancel appointment in ${appointment.status}`)
  }

  if (appointment.calendarEventId) {
    await input.provider.cancelEvent(appointment.calendarEventId, { idempotencyKey: input.idempotencyKey })
  }
  return input.appointments.cancel(appointment.id)
}

export async function rescheduleAppointment(input: {
  appointments: AppointmentRepository
  provider: CalendarProvider
  oldAppointmentId: string
  newSlot: CalendarSlot
  source: ChannelType
  holdIdempotencyKey: string
  swapIdempotencyKey: string
  verified: boolean
  now?: Date
}): Promise<{ oldAppointment: AppointmentRecord; newAppointment: AppointmentRecord }> {
  if (!input.verified) throw new Error("Reschedule requires caller verification")
  const oldAppointment = await input.appointments.findById(input.oldAppointmentId)
  if (!oldAppointment) throw new Error("Original appointment not found")
  if (oldAppointment.status !== "CONFIRMED") throw new Error(`Cannot reschedule appointment in ${oldAppointment.status}`)

  const { appointment: hold } = await createPendingLease({
    appointments: input.appointments,
    slot: input.newSlot,
    source: input.source,
    idempotencyKey: input.holdIdempotencyKey,
    now: input.now,
    clientName: oldAppointment.clientName ?? undefined,
    clientPhone: oldAppointment.clientPhone ?? undefined,
    clientEmail: oldAppointment.clientEmail ?? undefined,
    notesSummary: oldAppointment.notesSummary ?? undefined,
  })

  const event = oldAppointment.calendarEventId
    ? await input.provider.updateEvent(oldAppointment.calendarEventId, hold, {
        summary: hold.notesSummary ?? "Rexity showcase appointment",
        idempotencyKey: input.swapIdempotencyKey,
      })
    : await input.provider.createEvent(hold, {
        summary: hold.notesSummary ?? "Rexity showcase appointment",
        idempotencyKey: input.swapIdempotencyKey,
      })

  const confirmedHold = await input.appointments.confirm(hold.id, event.calendarEventId)
  const rescheduledOld = await input.appointments.markRescheduled(oldAppointment.id)
  return { oldAppointment: rescheduledOld, newAppointment: confirmedHold }
}

export function verifyAppointmentFactor(input: {
  providedEmail?: string
  appointmentEmail?: string | null
  providedAppointmentId?: string
  appointmentId?: string
  providedPhoneLast4?: string
  appointmentPhone?: string | null
  providedStartTime?: Date
  appointmentStartTime?: Date
  /**
   * Opt-in B2B mode. When true, a domain-only email such as "@rexity.ai"
   * may verify any appointment whose email belongs to that domain.
   *
   * SECURITY: Never set this in B2C flows. Domain match is NOT identity.
   * Domain mode also requires `providedStartTime` to match `appointmentStartTime`
   * as a second factor — domain alone is never sufficient.
   */
  allowDomainMatch?: boolean
}): boolean {
  // Factor 1: full appointment id (cuid, unguessable in normal use)
  if (input.providedAppointmentId && input.appointmentId && input.providedAppointmentId === input.appointmentId) {
    return true
  }

  // Factor 2: full email equality (case-insensitive, trimmed)
  if (input.providedEmail && input.appointmentEmail) {
    const provided = input.providedEmail.trim().toLowerCase()
    const actual = input.appointmentEmail.trim().toLowerCase()
    if (provided && actual && provided === actual) return true

    // Optional B2B mode: domain-only match REQUIRES a matching start time as a 2nd factor.
    if (
      input.allowDomainMatch &&
      provided.startsWith("@") &&
      provided.length > 1 &&
      actual.endsWith(provided) &&
      input.providedStartTime &&
      input.appointmentStartTime &&
      input.providedStartTime.getTime() === input.appointmentStartTime.getTime()
    ) {
      return true
    }
  }

  // Factor 3: last-4 phone digits + exact start time
  if (input.providedPhoneLast4 && input.appointmentPhone && input.providedStartTime && input.appointmentStartTime) {
    const actualLast4 = input.appointmentPhone.replace(/\D/g, "").slice(-4)
    return (
      actualLast4 === input.providedPhoneLast4.replace(/\D/g, "") &&
      input.providedStartTime.getTime() === input.appointmentStartTime.getTime()
    )
  }
  return false
}

export async function cleanupExpiredLeases(appointments: AppointmentRepository, now = new Date()): Promise<number> {
  return appointments.expireLeases(now)
}
