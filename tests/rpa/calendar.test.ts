import test from "node:test"
import assert from "node:assert/strict"

import {
  cancelAppointment,
  cleanupExpiredLeases,
  confirmBooking,
  createPendingLease,
  rescheduleAppointment,
  scanAvailableSlots,
  verifyAppointmentFactor,
} from "../../lib/rpa/calendar.ts"
import { MemoryAppointmentRepository, MemoryCalendarProvider } from "../../lib/rpa/memory-repositories.ts"

const date = (iso: string) => new Date(iso)

test("calendar lease prevents double-booking and supports idempotent replay", async () => {
  const appointments = new MemoryAppointmentRepository()
  const slot = { startTime: date("2026-06-08T09:00:00.000Z"), endTime: date("2026-06-08T09:30:00.000Z") }

  const first = await createPendingLease({ appointments, slot, source: "VOICE", idempotencyKey: "lease-1" })
  const replay = await createPendingLease({ appointments, slot, source: "VOICE", idempotencyKey: "lease-1" })

  assert.equal(first.replayed, false)
  assert.equal(replay.replayed, true)
  await assert.rejects(createPendingLease({ appointments, slot, source: "VOICE", idempotencyKey: "lease-2" }), /not available/)
})

test("expired pending leases are released by cleanup", async () => {
  const appointments = new MemoryAppointmentRepository()
  await createPendingLease({
    appointments,
    source: "WHATSAPP",
    idempotencyKey: "expired",
    slot: { startTime: date("2026-06-08T10:00:00.000Z"), endTime: date("2026-06-08T10:30:00.000Z") },
    now: date("2026-06-08T08:00:00.000Z"),
    leaseMs: 1,
  })

  assert.equal(await cleanupExpiredLeases(appointments, date("2026-06-08T08:00:01.000Z")), 1)
  assert.equal(appointments.records[0].status, "EXPIRED")
})

test("booking confirmation writes one calendar event after lease validation", async () => {
  const appointments = new MemoryAppointmentRepository()
  const provider = new MemoryCalendarProvider()
  const { appointment } = await createPendingLease({
    appointments,
    source: "VOICE",
    idempotencyKey: "confirm-lease",
    slot: { startTime: date("2026-06-08T11:00:00.000Z"), endTime: date("2026-06-08T11:30:00.000Z") },
  })

  const confirmed = await confirmBooking({ appointments, provider, appointmentId: appointment.id, idempotencyKey: "confirm-1" })
  assert.equal(confirmed.status, "CONFIRMED")
  assert.equal(confirmed.calendarEventId, "cal_confirm-1")
})

test("cancellation requires verification", async () => {
  const appointments = new MemoryAppointmentRepository()
  const provider = new MemoryCalendarProvider()
  const { appointment } = await createPendingLease({
    appointments,
    source: "VOICE",
    idempotencyKey: "cancel-lease",
    slot: { startTime: date("2026-06-08T12:00:00.000Z"), endTime: date("2026-06-08T12:30:00.000Z") },
  })
  await confirmBooking({ appointments, provider, appointmentId: appointment.id, idempotencyKey: "cancel-confirm" })

  await assert.rejects(cancelAppointment({ appointments, provider, appointmentId: appointment.id, idempotencyKey: "cancel", verified: false }), /verification/)
  const cancelled = await cancelAppointment({ appointments, provider, appointmentId: appointment.id, idempotencyKey: "cancel", verified: true })
  assert.equal(cancelled.status, "CANCELLED")
})

test("reschedule holds new slot before marking old appointment rescheduled", async () => {
  const appointments = new MemoryAppointmentRepository()
  const provider = new MemoryCalendarProvider()
  const { appointment } = await createPendingLease({
    appointments,
    source: "VOICE",
    idempotencyKey: "old-lease",
    slot: { startTime: date("2026-06-08T13:00:00.000Z"), endTime: date("2026-06-08T13:30:00.000Z") },
  })
  await confirmBooking({ appointments, provider, appointmentId: appointment.id, idempotencyKey: "old-confirm" })

  const result = await rescheduleAppointment({
    appointments,
    provider,
    oldAppointmentId: appointment.id,
    source: "VOICE",
    holdIdempotencyKey: "new-hold",
    swapIdempotencyKey: "new-swap",
    verified: true,
    newSlot: { startTime: date("2026-06-08T14:00:00.000Z"), endTime: date("2026-06-08T14:30:00.000Z") },
  })

  assert.equal(result.oldAppointment.status, "RESCHEDULED")
  assert.equal(result.newAppointment.status, "CONFIRMED")
})

test("S2-T5 slot scanning respects Europe/Berlin business hours, not server-local time", async () => {
  const appointments = new MemoryAppointmentRepository()
  const provider = new MemoryCalendarProvider()
  // Window: 06:00-09:00 UTC on a Monday in DST = 08:00-11:00 Berlin
  // Berlin business hours 9-17: 08:00 Berlin is OUT, 09:00 Berlin is IN
  const slots = await scanAvailableSlots({
    appointments,
    provider,
    window: { startTime: date("2026-06-08T06:00:00.000Z"), endTime: date("2026-06-08T09:00:00.000Z") },
    slotMinutes: 30,
    limit: 4,
  })
  // First valid slot should be 07:00 UTC (= 09:00 Berlin)
  assert.equal(slots[0].startTime.toISOString(), "2026-06-08T07:00:00.000Z")
  assert.equal(slots.length, 4)
})

test("slot scanning filters busy/provider and pending appointment overlaps", async () => {
  const appointments = new MemoryAppointmentRepository()
  const provider = new MemoryCalendarProvider()
  provider.busy.push({ startTime: date("2026-06-08T09:00:00.000Z"), endTime: date("2026-06-08T09:30:00.000Z") })
  await createPendingLease({
    appointments,
    source: "WHATSAPP",
    idempotencyKey: "busy-local",
    slot: { startTime: date("2026-06-08T09:30:00.000Z"), endTime: date("2026-06-08T10:00:00.000Z") },
  })

  const slots = await scanAvailableSlots({
    appointments,
    provider,
    window: { startTime: date("2026-06-08T09:00:00.000Z"), endTime: date("2026-06-08T11:00:00.000Z") },
    slotMinutes: 30,
    limit: 2,
  })

  assert.deepEqual(slots, [
    { startTime: date("2026-06-08T10:00:00.000Z"), endTime: date("2026-06-08T10:30:00.000Z") },
    { startTime: date("2026-06-08T10:30:00.000Z"), endTime: date("2026-06-08T11:00:00.000Z") },
  ])
})

test("appointment verification accepts approved factors", () => {
  // Full email equality verifies
  assert.equal(
    verifyAppointmentFactor({
      providedEmail: "sunny@rexity.ai",
      appointmentEmail: "sunny@rexity.ai",
    }),
    true,
  )
  // Phone last-4 + start time verifies
  assert.equal(
    verifyAppointmentFactor({
      providedPhoneLast4: "1234",
      appointmentPhone: "+49 30 555 1234",
      providedStartTime: date("2026-06-08T10:00:00.000Z"),
      appointmentStartTime: date("2026-06-08T10:00:00.000Z"),
    }),
    true,
  )
  // Appointment id (cuid) verifies
  assert.equal(
    verifyAppointmentFactor({
      providedAppointmentId: "cks0123456789abc",
      appointmentId: "cks0123456789abc",
    }),
    true,
  )
})

test("appointment verification rejects domain-only email by default (CRITICAL-1 fix)", () => {
  // Pre-fix this returned true and allowed any-@-domain to verify any appointment.
  assert.equal(
    verifyAppointmentFactor({
      providedEmail: "@rexity.ai",
      appointmentEmail: "sunny@rexity.ai",
    }),
    false,
  )
  // Lookalike domain must not match
  assert.equal(
    verifyAppointmentFactor({
      providedEmail: "attacker@rexity.ai",
      appointmentEmail: "sunny@rexity.ai",
    }),
    false,
  )
  // Email case-insensitive
  assert.equal(
    verifyAppointmentFactor({
      providedEmail: "Sunny@Rexity.AI",
      appointmentEmail: "sunny@rexity.ai",
    }),
    true,
  )
})

test("B2B domain match requires explicit opt-in AND a second factor (start time)", () => {
  // Domain alone, even with allowDomainMatch, is NOT enough
  assert.equal(
    verifyAppointmentFactor({
      allowDomainMatch: true,
      providedEmail: "@rexity.ai",
      appointmentEmail: "sunny@rexity.ai",
    }),
    false,
  )
  // Domain + matching start time = verified
  assert.equal(
    verifyAppointmentFactor({
      allowDomainMatch: true,
      providedEmail: "@rexity.ai",
      appointmentEmail: "sunny@rexity.ai",
      providedStartTime: date("2026-06-08T10:00:00.000Z"),
      appointmentStartTime: date("2026-06-08T10:00:00.000Z"),
    }),
    true,
  )
  // Domain + wrong start time = rejected
  assert.equal(
    verifyAppointmentFactor({
      allowDomainMatch: true,
      providedEmail: "@rexity.ai",
      appointmentEmail: "sunny@rexity.ai",
      providedStartTime: date("2026-06-08T10:00:00.000Z"),
      appointmentStartTime: date("2026-06-08T11:00:00.000Z"),
    }),
    false,
  )
})
