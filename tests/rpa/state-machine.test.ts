import test from "node:test"
import assert from "node:assert/strict"

import { MemoryAuditSink } from "../../lib/rpa/audit.ts"
import { MemorySessionRepository } from "../../lib/rpa/memory-repositories.ts"
import { assertToolAllowed, canTransition, transitionSession } from "../../lib/rpa/state-machine.ts"

test("state transitions are explicit and reject invalid jumps", async () => {
  assert.equal(canTransition("IDLE", "DISCLOSURE"), true)
  assert.equal(canTransition("IDLE", "CONFIRMED"), false)

  const sessions = new MemorySessionRepository()
  sessions.add({ id: "s1", channelId: "c1", channelType: "VOICE", currentState: "IDLE" })
  const audit = new MemoryAuditSink()

  await transitionSession({ sessionId: "s1", from: "IDLE", to: "DISCLOSURE", store: sessions, audit })
  await assert.rejects(
    transitionSession({ sessionId: "s1", from: "DISCLOSURE", to: "CONFIRMED", store: sessions, audit }),
    /Invalid conversation transition/,
  )
  assert.equal(audit.events.some((event) => event.type === "STATE_TRANSITION_REJECTED"), true)
})

test("tool calls are constrained by state", () => {
  assert.doesNotThrow(() => assertToolAllowed("PENDING_CONFIRMATION", "CONFIRM_BOOKING"))
  assert.throws(() => assertToolAllowed("FAQ", "CONFIRM_BOOKING"), /not allowed/)
})
