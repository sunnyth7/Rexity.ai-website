import type { AuditSink, CommunicationSessionRef } from "./types.ts"

export interface SessionLockRepository {
  acquireLock(sessionId: string, now: Date, lockedUntil: Date): Promise<CommunicationSessionRef | null>
  releaseLock(sessionId: string, lockVersion: number): Promise<void>
}

export async function withSessionLock<T>(input: {
  sessionId: string
  repository: SessionLockRepository
  ttlMs?: number
  now?: Date
  audit?: AuditSink
  run: (session: CommunicationSessionRef) => Promise<T>
}): Promise<T> {
  const now = input.now ?? new Date()
  const lockedUntil = new Date(now.getTime() + (input.ttlMs ?? 30_000))
  const session = await input.repository.acquireLock(input.sessionId, now, lockedUntil)

  if (!session) {
    await input.audit?.record({
      type: "SESSION_LOCK_REJECTED",
      actor: "system",
      sessionId: input.sessionId,
      safeSummary: "Session is already locked by another operation.",
    })
    throw new Error(`Session ${input.sessionId} is locked`)
  }

  await input.audit?.record({
    type: "SESSION_LOCK_ACQUIRED",
    actor: "system",
    sessionId: input.sessionId,
    redactedContext: { lockedUntil: lockedUntil.toISOString(), lockVersion: session.lockVersion },
  })

  try {
    return await input.run(session)
  } finally {
    await input.repository.releaseLock(input.sessionId, session.lockVersion ?? 0)
  }
}
