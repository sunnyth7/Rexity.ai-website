import type { AuditSink, ChannelType } from "./types.ts"
import { makeSafeSummary } from "./audit.ts"

export type SuppressionReason = "OPT_OUT" | "BOUNCE" | "MANUAL" | "COMPLIANCE"

export interface SuppressionRepository {
  find(channelType: ChannelType, identifier: string): Promise<{ id: string; identifier: string } | null>
  create(input: {
    channelType: ChannelType
    identifier: string
    reason: SuppressionReason
    source?: string
    safeSummary?: string
    expiresAt?: Date
  }): Promise<{ id: string; identifier: string }>
}

export function normalizeSuppressionIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase().replace(/\s+/g, "")
}

export async function suppressContact(input: {
  repository: SuppressionRepository
  channelType: ChannelType
  identifier: string
  reason?: SuppressionReason
  source?: string
  safeSummary?: string
  expiresAt?: Date
  audit?: AuditSink
}) {
  const identifier = normalizeSuppressionIdentifier(input.identifier)
  const existing = await input.repository.find(input.channelType, identifier)
  if (existing) return { duplicate: true, entry: existing }

  const entry = await input.repository.create({
    channelType: input.channelType,
    identifier,
    reason: input.reason ?? "OPT_OUT",
    source: input.source,
    safeSummary: input.safeSummary ? makeSafeSummary(input.safeSummary) : undefined,
    expiresAt: input.expiresAt,
  })
  await input.audit?.record({
    type: "SUPPRESSION_CREATED",
    actor: input.source ?? "system",
    safeSummary: input.safeSummary ? makeSafeSummary(input.safeSummary) : "Contact suppressed.",
    redactedContext: { channelType: input.channelType, identifier },
  })
  return { duplicate: false, entry }
}
