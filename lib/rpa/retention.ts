import type { AppointmentRepository, AppointmentStatus } from "./types.ts"

export interface RetentionRepository {
  deleteWebhookEventsOlderThan(cutoff: Date): Promise<number>
  deleteAuditEventsOlderThan(cutoff: Date): Promise<number>
  clearSessionSummariesOlderThan(cutoff: Date): Promise<number>
  deleteExpiredSuppressions(now: Date): Promise<number>
  /**
   * S2-T3: delete Leads with no appointment and no activity since `cutoff`.
   * Leads that DO have an appointment fall under the appointment retention
   * window; they are not deleted here.
   */
  deleteUnconvertedLeadsOlderThan(cutoff: Date): Promise<number>
}

export interface RetentionPolicy {
  webhookEventDays: number
  auditEventDays: number
  transientSessionDays: number
  appointmentDays: number
  /** S2-T3 default: 18 months for an unconverted lead. */
  leadDays: number
}

export const defaultRetentionPolicy: RetentionPolicy = {
  webhookEventDays: 30,
  auditEventDays: 180,
  transientSessionDays: 3,
  appointmentDays: 365,
  leadDays: 547, // 18 months
}

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

export async function runRetentionCleanup(input: {
  repository: RetentionRepository
  appointments: AppointmentRepository
  policy?: RetentionPolicy
  now?: Date
}): Promise<Record<string, number>> {
  const policy = input.policy ?? defaultRetentionPolicy
  const now = input.now ?? new Date()
  const terminalStatuses: AppointmentStatus[] = ["CANCELLED", "RESCHEDULED", "EXPIRED"]

  return {
    webhookEvents: await input.repository.deleteWebhookEventsOlderThan(daysAgo(now, policy.webhookEventDays)),
    auditEvents: await input.repository.deleteAuditEventsOlderThan(daysAgo(now, policy.auditEventDays)),
    sessionSummaries: await input.repository.clearSessionSummariesOlderThan(daysAgo(now, policy.transientSessionDays)),
    appointments: await input.appointments.deleteOlderThan(daysAgo(now, policy.appointmentDays), terminalStatuses),
    suppressions: await input.repository.deleteExpiredSuppressions(now),
    leads: await input.repository.deleteUnconvertedLeadsOlderThan(daysAgo(now, policy.leadDays)),
  }
}
