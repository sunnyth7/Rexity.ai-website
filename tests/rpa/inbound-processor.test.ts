// S2-T6 tests for the suppression-check → session-lock → orchestrator pipeline.
import test from "node:test"
import assert from "node:assert/strict"

import { MemoryAuditSink } from "../../lib/rpa/audit.ts"
import {
  MemorySessionRepository,
  MemorySuppressionRepository,
} from "../../lib/rpa/memory-repositories.ts"
import { processInboundMessage } from "../../lib/rpa/inbound-processor.ts"
import { suppressContact } from "../../lib/rpa/suppression.ts"

function fakeMessage(text: string, id = "wamid.X", from = "491700000001") {
  return {
    channelType: "WHATSAPP" as const,
    channelId: from,
    externalMessageId: id,
    text,
    provider: "meta-whatsapp",
  }
}

test("S2-T6 first contact: IDLE → DISCLOSURE via orchestrator", async () => {
  const sessions = new MemorySessionRepository()
  const suppressions = new MemorySuppressionRepository()
  const audit = new MemoryAuditSink()

  const result = await processInboundMessage(
    { sessions, store: sessions, suppressions, audit },
    fakeMessage("Hi I'd like a demo"),
  )

  assert.equal(result.status, "PROCESSED")
  if (result.status === "PROCESSED") {
    assert.equal(result.intent, "DISCLOSE")
    assert.equal(result.session.currentState, "DISCLOSURE")
  }
  const types = audit.events.map((e) => e.type)
  assert.ok(types.includes("SESSION_LOCK_ACQUIRED"))
  assert.ok(types.includes("STATE_TRANSITION"))
})

test("S2-T6 opt-out: IDLE → OPTED_OUT via orchestrator", async () => {
  const sessions = new MemorySessionRepository()
  const suppressions = new MemorySuppressionRepository()
  const audit = new MemoryAuditSink()

  const result = await processInboundMessage(
    { sessions, store: sessions, suppressions, audit },
    fakeMessage("Bitte nicht mehr schreiben"),
  )

  assert.equal(result.status, "PROCESSED")
  if (result.status === "PROCESSED") {
    assert.equal(result.intent, "OPT_OUT")
    assert.equal(result.session.currentState, "OPTED_OUT")
  }
})

test("S2-T6 suppressed sender is skipped before lock", async () => {
  const sessions = new MemorySessionRepository()
  const suppressions = new MemorySuppressionRepository()
  const audit = new MemoryAuditSink()

  await suppressContact({
    repository: suppressions,
    channelType: "WHATSAPP",
    identifier: "491700000001",
    reason: "OPT_OUT",
  })

  const result = await processInboundMessage(
    { sessions, store: sessions, suppressions, audit },
    fakeMessage("hi"),
  )

  assert.equal(result.status, "SUPPRESSED")
  assert.equal(sessions.sessions.size, 0, "no session should be created for a suppressed sender")
  assert.ok(audit.events.some((e) => e.type === "POLICY_BLOCKED"))
})

test("S2-T6 non-IDLE non-opt-out message yields NO_TRANSITION (NLU not wired yet)", async () => {
  const sessions = new MemorySessionRepository()
  const suppressions = new MemorySuppressionRepository()
  const audit = new MemoryAuditSink()

  // First message walks IDLE → DISCLOSURE
  await processInboundMessage(
    { sessions, store: sessions, suppressions, audit },
    fakeMessage("hi", "msg-1"),
  )
  // Second message: no opt-out, not IDLE → classifier returns null → no transition
  const result = await processInboundMessage(
    { sessions, store: sessions, suppressions, audit },
    fakeMessage("what services do you offer?", "msg-2"),
  )
  assert.equal(result.status, "NO_TRANSITION")
})
