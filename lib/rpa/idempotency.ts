import type { AuditSink, ChannelType } from "./types.ts"

export type IdempotencyStatus = "PROCESSING" | "PROCESSED" | "FAILED"

export interface WebhookEventRecord {
  id: string
  provider: string
  providerEventId: string
  channelType: ChannelType
  idempotencyKey: string
  status: IdempotencyStatus
  processedAt?: Date | null
  errorSummary?: string | null
}

export interface WebhookEventRepository {
  findByProviderEvent(provider: string, providerEventId: string): Promise<WebhookEventRecord | null>
  findByIdempotencyKey(idempotencyKey: string): Promise<WebhookEventRecord | null>
  create(event: Omit<WebhookEventRecord, "id">): Promise<WebhookEventRecord>
  markProcessed(id: string, processedAt: Date): Promise<WebhookEventRecord>
  markFailed(id: string, errorSummary: string): Promise<WebhookEventRecord>
}

export function makeIdempotencyKey(parts: readonly (string | number | Date | null | undefined)[]): string {
  return parts
    .filter((part): part is string | number | Date => part !== null && part !== undefined)
    .map((part) => (part instanceof Date ? part.toISOString() : String(part)))
    .join(":")
    .toLowerCase()
}

export async function registerWebhookEvent(input: {
  repository: WebhookEventRepository
  provider: string
  providerEventId: string
  channelType: ChannelType
  idempotencyKey?: string
  audit?: AuditSink
}): Promise<{ duplicate: boolean; event: WebhookEventRecord }> {
  const idempotencyKey = input.idempotencyKey ?? makeIdempotencyKey([input.provider, input.providerEventId])
  const existing =
    (await input.repository.findByProviderEvent(input.provider, input.providerEventId)) ??
    (await input.repository.findByIdempotencyKey(idempotencyKey))

  if (existing) {
    await input.audit?.record({
      type: "WEBHOOK_DUPLICATE",
      actor: input.provider,
      idempotencyKey,
      redactedContext: { provider: input.provider, providerEventId: input.providerEventId, status: existing.status },
    })
    return { duplicate: true, event: existing }
  }

  const event = await input.repository.create({
    provider: input.provider,
    providerEventId: input.providerEventId,
    channelType: input.channelType,
    idempotencyKey,
    status: "PROCESSING",
    processedAt: null,
    errorSummary: null,
  })
  await input.audit?.record({
    type: "WEBHOOK_RECEIVED",
    actor: input.provider,
    idempotencyKey,
    redactedContext: { provider: input.provider, providerEventId: input.providerEventId },
  })
  return { duplicate: false, event }
}

export async function runOnce<T>(input: {
  key: string
  lookup: (key: string) => Promise<T | null>
  create: () => Promise<T>
  audit?: AuditSink
}): Promise<{ replayed: boolean; value: T }> {
  const existing = await input.lookup(input.key)
  if (existing) {
    await input.audit?.record({ type: "IDEMPOTENCY_REPLAY", actor: "system", idempotencyKey: input.key })
    return { replayed: true, value: existing }
  }

  return { replayed: false, value: await input.create() }
}
