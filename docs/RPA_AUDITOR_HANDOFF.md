# Rexity RPA / WhatsApp Auditor Handoff

Date: 2026-06-06  
Project root: `/Users/sunnythakur/Desktop/Rexity.ai-website`  
Status: Foundation and safety-layer implementation completed. Not production-live. No outbound calls or WhatsApp sends are enabled.

---

## 1. Executive Summary

This delivery establishes the first backend and channel-safety foundation for the Rexity Labs RPA Showcase. The goal is a dual-channel automation system:

- WhatsApp Bot via Meta Graph API.
- RPA Voice Agent using a future Vapi/Retell-style provider adapter.
- Shared backend orchestration for state, idempotency, session locking, calendar lifecycle, safe audit, suppression, and retention.

The assistant identity is **Rexona**.

The implementation is intentionally conservative:

- WhatsApp inbound webhooks verify signatures and parse messages.
- Signed WhatsApp messages can now be idempotency-registered and opt-outs persisted when `DATABASE_URL` is configured.
- Full WhatsApp orchestration and outbound replies remain disabled.
- Voice provider helpers exist, but no live voice webhook route was launched.
- No raw audio or raw transcripts are stored by default.
- No real outbound calling or outbound WhatsApp marketing was enabled.

---

## 2. Source Files for Audit

### Architecture / Plans

- `/Users/sunnythakur/Desktop/Rexity.ai-website/docs/RPA_SHOWCASE_ARCHITECTURE.md`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/docs/RPA_VOICE_ARCHITECTURE.md`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/docs/RPA_STACK.md`
- `/Users/sunnythakur/.gemini/antigravity/brain/aef64ce6-f546-4cc0-8b65-9fe2baa186d6/implementation_plan.md`

### Database Schema

- `/Users/sunnythakur/Desktop/Rexity.ai-website/prisma/schema.prisma`

### Existing App Endpoint Touched

- `/Users/sunnythakur/Desktop/Rexity.ai-website/app/api/contact/route.ts`

### WhatsApp Endpoint

- `/Users/sunnythakur/Desktop/Rexity.ai-website/app/api/webhooks/whatsapp/route.ts`

### Backend RPA Core

- `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/types.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/state-machine.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/orchestrator.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/idempotency.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/session-lock.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/audit.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/suppression.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/calendar.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/retention.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/memory-repositories.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/prisma-repositories.ts`

### Channel / Runtime Adapters

- `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa-showcase/contracts.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa-showcase/whatsapp.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa-showcase/voice.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa-showcase/guardrails.ts`

### Tests

- `/Users/sunnythakur/Desktop/Rexity.ai-website/tests/rpa/state-machine.test.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/tests/rpa/idempotency.test.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/tests/rpa/calendar.test.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/tests/rpa/audit-suppression-retention.test.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/tests/rpa/channel-adapters.test.ts`

---

## 3. Database / Prisma Delivery

File: `/Users/sunnythakur/Desktop/Rexity.ai-website/prisma/schema.prisma`

Added enums:

- `ChannelType`
- `ConversationState`
- `AppointmentStatus`
- `AuditEventType`
- `SuppressionReason`

Added/expanded models:

- `Lead`
- `Appointment`
- `CommunicationSession`
- `WebhookEvent`
- `AuditEvent`
- `SuppressionEntry`

Important schema decisions:

- `Lead.source` is now enum-backed with default `WEBSITE`.
- `Lead.message` became optional to support non-form leads.
- `Appointment` includes pending lease fields, idempotency key, verification summary, and calendar event mapping.
- `CommunicationSession` stores current state, consent flags, privacy notice version, redacted context, and lock metadata.
- `WebhookEvent` supports provider event dedupe and idempotency.
- `AuditEvent` stores redacted metadata and safe summaries only.
- `SuppressionEntry` records opt-outs and compliance suppressions.

Migration status:

- No Prisma migration was generated yet.
- Reason: the repo currently has no existing `prisma/migrations` folder and no confirmed real database/migration workflow.
- `prisma validate` was run successfully with a dummy PostgreSQL URL.

---

## 4. WhatsApp Delivery

### Files

- Endpoint: `/Users/sunnythakur/Desktop/Rexity.ai-website/app/api/webhooks/whatsapp/route.ts`
- Helper: `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa-showcase/whatsapp.ts`
- Tests: `/Users/sunnythakur/Desktop/Rexity.ai-website/tests/rpa/channel-adapters.test.ts`

### Implemented

GET verification:

- Supports Meta webhook challenge verification.
- Requires `hub.mode=subscribe`.
- Requires verify token to match `WHATSAPP_VERIFY_TOKEN`.
- Returns challenge on success.
- Returns `403` on failure.

POST verification:

- Reads raw body.
- Verifies `X-Hub-Signature-256`.
- HMAC uses `WHATSAPP_APP_SECRET`.
- Rejects missing/invalid signatures with `401`.
- Rejects malformed JSON with `400`.

Inbound parsing:

- Parses Meta `entry[].changes[].value.messages[]`.
- Extracts message id, sender, recipient phone number id, text body, timestamp, and message type metadata.
- Converts parsed messages into channel messages.

Opt-out detection:

Recognizes English/German opt-out phrases including:

- `stop`
- `stopp`
- `unsubscribe`
- `abmelden`
- `keine nachrichten`
- `nicht mehr kontaktieren`
- `bitte nicht mehr schreiben`
- `keine werbung`
- `widerspruch`

Outbound safety:

- `assertApprovedTemplateOutbound` blocks unsolicited free-text marketing.
- Outbound WhatsApp messages require an approved Meta template.
- No outbound message sending code was added.

Persistence behavior:

- If `DATABASE_URL` is missing:
  - Signed inbound messages are parsed only.
  - No persistence or processing is attempted.
  - Endpoint returns `persisted: false`.

- If `DATABASE_URL` exists:
  - Registers each inbound message as a `WebhookEvent`.
  - Uses idempotency key: `meta:whatsapp:<externalMessageId>`.
  - Drops duplicates safely.
  - Records audit events.
  - Persists opt-outs as `SuppressionEntry`.
  - Marks registered webhook events as processed.
  - Still returns `processed: false` because full orchestration is intentionally disabled.

### Not Implemented Yet

- Rate limiting.
- Real WhatsApp outbound sends.
- Real RAG answers over WhatsApp.
- Real booking flow over WhatsApp.
- Session locking inside the WhatsApp route.
- Full orchestrator state transition execution from WhatsApp messages.

---

## 5. RPA Voice Delivery

### Files

- `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa-showcase/voice.ts`
- `/Users/sunnythakur/Desktop/Rexity.ai-website/tests/rpa/channel-adapters.test.ts`

### Implemented

Voice provider abstraction:

- `VoiceProvider = "vapi" | "retell"`
- Normalizes provider event payloads into:
  - provider
  - event id
  - call id
  - caller id
  - transcript text
  - mapped event type

Rexona disclosure:

- German disclosure states Rexona is Rexity's virtual assistant.
- English disclosure states Rexona is Rexity's virtual assistant.
- Assistant name is configurable through function input.

Recording consent:

- `RecordingConsentState = "unknown" | "granted" | "denied"`
- `parseRecordingConsent` recognizes German and English yes/no consent.
- `shouldRecordCall` returns true only for explicit `granted`.
- Default behavior is no recording.
- `getNoRecordingNotice` supports German and English.

### Not Implemented Yet

- No live voice webhook route.
- No Vapi or Retell outbound calls.
- No SIP integration.
- No recording provider configuration.
- No live STT/TTS/model chain.
- No human call transfer implementation.

---

## 6. RPA Backend Core Delivery

### Deterministic State Machine

File: `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/state-machine.ts`

Implemented:

- Explicit allowed state transitions.
- Tool permissions per state.
- Invalid transitions throw.
- Invalid tool usage throws.
- State transition audit support.

States include:

- `IDLE`
- `DISCLOSURE`
- `CONSENT`
- `FAQ`
- `BOOKING_COLLECT_DETAILS`
- `SLOT_SCANNING`
- `SLOT_OFFERED`
- `PENDING_CONFIRMATION`
- `CONFIRMED`
- `RESCHEDULE_VERIFY`
- `RESCHEDULE_HOLD_NEW_SLOT`
- `RESCHEDULE_SWAP`
- `CANCEL_VERIFY`
- `CANCELLED`
- `HANDOFF_REQUESTED`
- `HANDOFF_ACTIVE`
- `FAILED_SAFE`
- `OPTED_OUT`

### Orchestrator

File: `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/orchestrator.ts`

Implemented:

- Maps inbound intents to deterministic next states.
- Resolves session by channel.
- Applies state machine transition rules.
- Rejects direct model mutation.
- Does not yet execute full WhatsApp or voice business actions.

### Idempotency

File: `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/idempotency.ts`

Implemented:

- `makeIdempotencyKey`.
- `registerWebhookEvent`.
- Duplicate provider event detection.
- Duplicate idempotency key detection.
- Audit events for received and duplicate webhooks.
- `runOnce` utility for idempotent create-or-replay flows.

### Session Locking

File: `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/session-lock.ts`

Implemented:

- `withSessionLock`.
- Lock acquire/release contract.
- Rejected lock audit event.
- Lock-acquired audit event.

### Safe Audit / Redaction

File: `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/audit.ts`

Implemented:

- Email redaction.
- Phone redaction.
- Long-number redaction.
- Safe summary truncation.
- Memory audit sink for tests.

### Suppression

File: `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/suppression.ts`

Implemented:

- Identifier normalization.
- Idempotent suppression create.
- Audit event on suppression creation.

### Calendar Lifecycle

File: `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/calendar.ts`

Implemented:

- Slot validation.
- Slot overlap detection.
- Available slot scanning.
- Business-hour filtering.
- Provider busy slot filtering.
- Pending appointment overlap filtering.
- Pending lease creation.
- Idempotent pending lease replay.
- Booking confirmation.
- Lease expiry check.
- Cancellation requiring verification.
- Rescheduling requiring verification.
- Reschedule holds new slot before old appointment is marked rescheduled.
- Appointment verification factors:
  - appointment id
  - email/domain
  - last four phone digits plus appointment time
- Expired lease cleanup.

### Retention

File: `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/retention.ts`

Implemented:

- Retention policy defaults.
- Webhook event cleanup hook.
- Audit event cleanup hook.
- Transient session summary cleanup hook.
- Terminal appointment cleanup.
- Expired suppression cleanup.

### Prisma-backed Repositories

File: `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/prisma-repositories.ts`

Implemented:

- `PrismaAppointmentRepository`
- `PrismaWebhookEventRepository`
- `PrismaSessionRepository`
- `PrismaSuppressionRepository`
- `PrismaAuditSink`
- `PrismaRetentionRepository`

Purpose:

- Production adapters behind the backend interfaces.
- Memory repositories remain available for deterministic tests.

---

## 7. RAG / Guardrails Delivery

File: `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa-showcase/guardrails.ts`

Implemented:

- Guardrail topic detection:
  - pricing
  - refund
  - legal
  - billing
  - contract
  - delivery commitment
- Prompt injection detection.
- Zod schema for structured model output.
- Closed-book RAG confidence policy.
- No-answer fallback.
- Guardrail refusal copy in English and German.
- Safe model-output coercion to handoff for invalid/low-confidence output.

Important behavior:

- Unknown or low-confidence answers fall back.
- Guardrail topics should route to human handling.
- Model output cannot directly mutate state; operational state must flow through the orchestrator/state machine.

---

## 8. Compliance / Safety Posture

Implemented or documented controls:

- Rexona identifies itself as a virtual assistant.
- Recording is disabled unless explicit consent is granted.
- No recording by default.
- No raw audio persistence.
- No raw transcript persistence.
- Safe summaries and redacted audit events only.
- WhatsApp signatures are required.
- WhatsApp free-text marketing is blocked.
- WhatsApp outbound requires approved Meta templates.
- Opt-out suppression exists.
- Pricing/refund/legal/billing/contract/delivery commitment guardrails exist.
- Calendar cancellation/rescheduling requires verification.
- Idempotency prevents duplicate webhook and duplicate appointment operations.

Still required before public production:

- German legal/privacy review.
- Privacy Policy / Datenschutzerklaerung updates.
- Impressum updates if needed.
- Processor/DPA list.
- Real retention policy approval.
- Real database migration.
- Provider configuration audit for no-recording default.
- Rate limiting.
- Human handoff operational route.
- Production incident/ops dashboard.

---

## 9. Verification Performed

Commands run successfully:

```bash
npm run test:rpa
npm run typecheck
env DATABASE_URL=postgresql://user:pass@localhost:5432/rexity npx prisma validate
env DATABASE_URL=postgresql://user:pass@localhost:5432/rexity npm run build
```

Test result:

- `npm run test:rpa` passed.
- 18 tests passed.

Covered test areas:

- Safe summaries and redacted audit metadata.
- Suppression idempotency.
- Retention cleanup delegation.
- Calendar lease/double-booking protection.
- Lease expiry.
- Booking confirmation.
- Cancellation verification.
- Reschedule ordering.
- Slot scanning.
- Appointment verification factors.
- Webhook idempotency.
- State transition validation.
- State tool permission validation.
- WhatsApp challenge and HMAC verification.
- WhatsApp parsing and opt-out.
- WhatsApp outbound template safety.
- Voice consent and no-recording default.
- Guardrails, prompt injection, and low-confidence fallback.

---

## 10. Current Risks / Auditor Focus Areas

Please assess:

1. Whether the Prisma schema is production-safe for privacy/compliance.
2. Whether opt-out handling is sufficient for WhatsApp and later voice/SMS channels.
3. Whether storing `redactedContext` JSON is acceptable under the intended data retention policy.
4. Whether webhook idempotency and provider-event dedupe are sufficient.
5. Whether calendar lease/confirm/reschedule flows prevent race conditions in a real database.
6. Whether Germany/DACH voice recording consent copy is acceptable.
7. Whether B2B outbound calling language and controls need stricter handling.
8. Whether separate `lib/rpa/types.ts` and `lib/rpa-showcase/contracts.ts` should be consolidated before further work.
9. Whether the WhatsApp endpoint should fail closed when `DATABASE_URL` is absent, instead of returning parsed-only success.
10. Whether rate limiting must be implemented before deploying even a signed webhook parser.

---

## 11. Known Gaps / Next Engineering Work

Highest priority next steps:

1. Generate a real Prisma migration using the approved database workflow.
2. Consolidate shared contracts between:
   - `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa/types.ts`
   - `/Users/sunnythakur/Desktop/Rexity.ai-website/lib/rpa-showcase/contracts.ts`
3. Add rate limiting to WhatsApp webhook.
4. Wire WhatsApp messages through:
   - suppression check
   - session locking
   - orchestrator
   - safe response generation
5. Add voice webhook route after shared contracts are consolidated.
6. Add human handoff queue.
7. Add admin/ops visibility for failed sessions, handoffs, pending appointments, and opt-outs.
8. Finalize German legal/privacy review before real outbound calling.

---

## 12. Production Readiness Verdict

Current maturity:

- Architecture: strong foundation.
- Backend core: early but well-structured.
- WhatsApp: safe inbound shell with idempotency/opt-out persistence; not a full bot yet.
- Voice: helper layer only; no live runtime yet.
- Compliance posture: conservative and directionally correct, but legal review still required.
- Production readiness: not production-live. Suitable for audit and next engineering sprint.
