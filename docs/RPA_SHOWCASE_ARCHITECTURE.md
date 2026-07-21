# Rexity Labs — Dual RPA Showcase Architecture
## WhatsApp Bot & RPA Voice Agent for Reception, Booking, Reminders, and Client Handoff

This document defines the hardened architecture for the **Rexity Labs Dual RPA Showcase**. The showcase demonstrates two business automation channels:

- **WhatsApp Bot** using the official Meta Graph API.
- **RPA Voice Agent** using VoIP/SIP, Vapi or Retell, and a telephony carrier.

Both channels share one deterministic backend state machine, one appointment ledger, one legal/compliance model, and one human override path. The assistant identity for the showcase is **Rexona**, a configurable Rexity virtual assistant.

This is a prototype-to-production blueprint, not legal advice. Before public outbound calling in Germany, the final scripts, privacy policy, opt-out language, and data processing contracts must be reviewed by a German IT/privacy lawyer or qualified Datenschutzbeauftragter.

---

## 1. Executive Verdict

The system is viable if it is built as a controlled automation platform, not as a free-running chatbot.

The core principles are:

1. **Deterministic state machine first, LLM second.**
2. **No recording by default.**
3. **No raw conversation logs by default.**
4. **No binding pricing, legal, refund, or contract decisions.**
5. **Human handoff must always be available.**
6. **Every webhook, call event, and calendar action must be idempotent.**
7. **Every outbound touch must be consent-aware, business-relevant, rate-limited, and opt-out capable.**

---

## 2. System Topology & Shared State Engine

The WhatsApp Bot and Voice Agent must not run as separate brains. They both call the same orchestrator, which owns state, locks, compliance gates, and actions.

```text
                  +----------------------------------------+
                  |          Showcase Entrypoints          |
                  | WhatsApp Webhook | Voice/SIP Webhook   |
                  +------------------+---------------------+
                              |                   |
                              v                   v
                  +----------------------------------------+
                  |        Security & Ingress Layer        |
                  | HMAC verify | rate limit | idempotency |
                  +------------------+---------------------+
                                             |
                                             v
                  +----------------------------------------+
                  |       Unified Orchestrator             |
                  | Session identity | state lock | policy |
                  +------------------+---------------------+
                                             |
                                             v
                  +----------------------------------------+
                  |       Deterministic State Machine      |
                  | Allowed transitions | tool approvals   |
                  +------------------+---------------------+
                                             |
                   +-------------------------+-------------------------+
                   |                         |                         |
                   v                         v                         v
          +----------------+        +----------------+        +----------------+
          | RAG Knowledge  |        | Calendar Tools |        | Human Handoff  |
          | closed-book    |        | lease/swap     |        | warm transfer  |
          +----------------+        +----------------+        +----------------+
                                             |
                                             v
                  +----------------------------------------+
                  |         Prisma / Postgres Layer        |
                  | leads | sessions | events | audits     |
                  +----------------------------------------+
```

---

## 3. Assistant Identity: Rexona

**Rexona** is the showcase assistant identity.

Default German voice introduction:

> Guten Tag, mein Name ist Rexona, die virtuelle Assistenz von Rexity. Ich kann Fragen zu unseren Leistungen beantworten und Termine vorbereiten. Bei komplexen Anliegen verbinde ich Sie mit unserem Team.

Default English chat introduction:

> Hi, I am Rexona, Rexity's virtual assistant. I can answer questions about our services, products, demos, and appointments. For complex decisions, I will route you to the team.

Rules:

- Rexona must clearly disclose that it is a virtual assistant.
- Rexona must use **Sie** in German unless the user explicitly switches to informal language.
- Rexona must not pretend to be a human employee.
- Rexona must not claim authority to approve pricing, refunds, legal terms, contracts, or binding delivery dates.
- The name must be configurable in environment/config, not hardcoded into core logic.

---

## 4. Deterministic Conversation State Machine

The LLM may generate language, but it must not control operational state directly. All state transitions are owned by the orchestrator.

Required states:

```text
IDLE
DISCLOSURE
CONSENT
FAQ
BOOKING_COLLECT_DETAILS
SLOT_SCANNING
SLOT_OFFERED
PENDING_CONFIRMATION
CONFIRMED
RESCHEDULE_VERIFY
RESCHEDULE_HOLD_NEW_SLOT
RESCHEDULE_SWAP
CANCEL_VERIFY
CANCELLED
HANDOFF_REQUESTED
HANDOFF_ACTIVE
FAILED_SAFE
OPTED_OUT
```

State rules:

- Every state has an allowed transition list.
- Tool calls are only allowed in states that explicitly permit them.
- Calendar writes require a state lock and idempotency key.
- Cancellation and rescheduling require caller/user verification.
- If confidence is low, latency is high, or the user asks for a human, route to `HANDOFF_REQUESTED`.
- If the user asks for pricing, refunds, contracts, invoices, legal policies, or account decisions, Rexona must refuse to decide and route to the right contact path.

Fallback wording:

> Das kann ich nicht verbindlich entscheiden. Ich kann Ihr Anliegen aber an unser Team weitergeben oder einen Rückruf vorbereiten.

---

## 5. System 1: WhatsApp Showcase Bot

The WhatsApp Bot runs through the official Meta Graph API. The Rexity backend receives webhooks, validates them, resolves or creates a session, and passes only safe state/context into the orchestrator.

### Flow

```text
[User Message]
    -> [Meta Graph API]
    -> [/api/webhooks/whatsapp]
    -> [Raw body HMAC validation]
    -> [WebhookEvent idempotency check]
    -> [Rate limit by phone + sender + endpoint]
    -> [Session lock]
    -> [State machine]
    -> [RAG or booking action]
    -> [Meta response / approved template]
```

### WhatsApp Controls

- Verify `X-Hub-Signature-256` against the raw request body and `WHATSAPP_APP_SECRET`.
- Persist every inbound webhook ID in `WebhookEvent` before processing.
- Drop duplicate events safely.
- Rate limit by phone number, WhatsApp sender ID, endpoint, and rolling window.
- Use approved Meta templates for outbound reminders and confirmations.
- Never send unsolicited free-text marketing messages.
- Store opt-out signals such as `STOP`, `STOPP`, `unsubscribe`, `keine Nachrichten`, and equivalent German phrases.
- Keep WhatsApp session content minimal. Store safe summaries, not raw chat logs, unless explicit consent and retention basis exist.

---

## 6. System 2: RPA Voice Agent

The RPA Voice Agent handles inbound reception, FAQ, appointment booking, cancellation, rescheduling, and reminder calls.

### Voice Flow

```text
[Incoming Call]
    -> [Carrier / SIP]
    -> [Vapi or Retell Voice Runtime]
    -> [Disclosure]
    -> [Recording Consent Gate]
    -> [Session lookup]
    -> [State machine]
    -> [RAG / Calendar / Handoff]
```

### Voice Stack

- **Carrier**: Twilio BYOC, Telnyx, or equivalent DACH-friendly SIP carrier.
- **Gateway**: Vapi or Retell for voice runtime, turn-taking, and SIP bridge.
- **STT**: Deepgram, Azure Speech, or comparable German-capable engine.
- **LLM**: Provider-agnostic model adapter. Claude, OpenAI, Gemini, or Bedrock may be used behind a strict output schema.
- **TTS**: ElevenLabs, Cartesia, Azure, or equivalent German natural voice provider.

Do not bind the architecture to one model. Use a model adapter so Rexity can switch vendors if latency, privacy, price, or reliability changes.

### Inbound Reception

Rexona may:

- Answer approved questions about Rexity services, products, demos, contact routes, and appointment process.
- Collect name, company, email, phone, and desired outcome.
- Offer available appointment slots.
- Create a pending appointment hold.
- Confirm a booking.
- Route to a human.

Rexona must not:

- Quote binding prices.
- Make refund decisions.
- Promise legal/commercial terms.
- Diagnose regulated professional questions.
- Continue if the user asks for a human.

### Caller Identification

Caller ID alone is not enough for sensitive operations.

For appointment cancellation or rescheduling, require at least one verification factor:

- Confirmation of email domain or full email.
- Appointment ID from SMS/WhatsApp/email.
- Last four digits of phone plus appointment time.
- One-time code for higher-risk workflows.

---

## 7. Appointment Lifecycle Engine

### Booking

1. Collect minimum required details.
2. Scan the dedicated showcase Google Calendar.
3. Offer 2-3 available slots.
4. Create `AppointmentStatus = PENDING` with a 10-minute lease.
5. Confirm user selection.
6. Create Google Calendar event.
7. Store `calendarEventId`.
8. Send confirmation through the user's active channel.

### Rescheduling

Do not release the old slot first.

Correct order:

1. Verify user identity.
2. Hold the new slot as `PENDING`.
3. Confirm the user's new choice.
4. Update or recreate the calendar event.
5. Mark the old appointment as `RESCHEDULED`.
6. Confirm the new appointment.

### Cancellation

1. Verify user identity.
2. Confirm cancellation intent.
3. Cancel the Google Calendar event.
4. Mark appointment `CANCELLED`.
5. Send confirmation.
6. Retain only required audit metadata.

---

## 8. Legal & Compliance Notes for Germany / DACH

### Voice Recording

- Recording spoken words without valid consent can create serious legal risk under **§ 201 StGB**.
- Recording must be **disabled by default**.
- Consent must be explicit before recording starts.
- If consent is refused, the call may continue in transient processing mode without recording.
- Do not store raw audio unless a valid purpose, retention period, and processor chain are documented.

Required German consent gate:

> Dieses Gespräch wird standardmäßig nicht aufgezeichnet. Wenn Sie möchten, können wir es zur Qualitätsverbesserung aufzeichnen. Sind Sie damit einverstanden?

If no:

> Kein Problem. Wir fahren ohne Aufzeichnung fort.

### AI Disclosure

Users must be told that they are interacting with a virtual assistant.

Minimum disclosure:

> Ich bin Rexona, die virtuelle Assistenz von Rexity.

### B2B Cold Calling

Business-to-business calls in Germany are not automatically risk-free. They may be possible when a specific presumed business interest exists, but broad cold calling can create risk under German unfair competition rules.

Safest outbound posture:

- Call only business contacts where there is a plausible, documented business relevance.
- Maintain suppression and opt-out lists.
- Respect "do not contact again" immediately.
- Avoid aggressive repeated dialing.
- Use business hours only.
- Identify Rexity and the call purpose clearly at the start.
- Do not record unless explicit consent is given.
- Keep generated notes minimal and factual.

### Notes vs Transcripts

Generated notes can still be personal data if they identify a person, phone number, company contact, intent, or conversation details.

Safest approach:

- Do not store transcripts by default.
- Do not store raw audio by default.
- Store only a short business summary needed for follow-up.
- Mark notes as AI-generated.
- Redact unnecessary personal details.
- Apply retention limits.
- Give users a contact path for deletion/access requests.

### Required Public Policy Updates

Before launch, Rexity must update:

- Privacy Policy / Datenschutzerklaerung.
- Impressum contact path.
- AI assistant disclosure.
- Voice processing section.
- WhatsApp processing section.
- Processor list and DPAs.
- Retention schedule.
- Opt-out and data subject request procedure.

Legal review should be performed by:

- A German IT/privacy lawyer.
- A Datenschutzbeauftragter if Rexity appoints one.
- For enterprise customers, their procurement/legal team may also require a DPA and TOMs document.

---

## 9. Data Retention & Privacy Model

Default storage posture:

- **Raw audio**: disabled by default.
- **Raw transcript**: disabled by default.
- **Chat transcript**: disabled by default unless needed and consented.
- **Safe summary**: allowed for lead follow-up.
- **Audit events**: allowed, redacted, no message body.
- **Webhook metadata**: allowed for idempotency and security.

Recommended retention:

- Transient session context: 24-72 hours.
- Appointment audit metadata: as required for business operations.
- Opt-out records: retained as long as needed to honor suppression.
- Failed webhook/event IDs: 7-30 days.
- Raw audio/transcripts, if explicitly enabled: shortest possible period, with deletion automation.

---

## 10. RAG & Anti-Hallucination Controls

RAG must be closed-book.

Required controls:

- Chunked Rexity knowledge base with versioned sources.
- Retrieval confidence threshold, but not a blind "85%" only rule.
- Answer only from retrieved context.
- Tool schema validation before any action.
- Refusal/fallback for unknown answers.
- Pricing, refund, legal, billing, and contract interceptors.
- Prompt-injection detection.
- Model output JSON schema validation.
- Human handoff for complex architecture or commercial questions.

Rexona fallback:

> Dazu habe ich keine freigegebene Information. Ich kann einen Rueckruf mit dem Rexity Team vorbereiten.

---

## 11. Observability & Operations

Production-quality RPA needs operations visibility from day one.

Track:

- p50/p95/p99 response latency.
- STT failure rate.
- TTS failure rate.
- LLM timeout rate.
- RAG no-answer rate.
- Human handoff rate.
- Booking conversion rate.
- Appointment cancellation/reschedule rate.
- WhatsApp template delivery failures.
- Duplicate webhook drop count.
- Rate-limit hit count.
- Opt-out events.

Required admin dashboard:

- Live sessions.
- Pending appointments.
- Failed state transitions.
- Human handoff queue.
- Recent safe summaries.
- Opt-out list.
- Retry queue.
- Provider health.

---

## 12. Failure Handling

Never fail silently.

If latency exceeds the budget:

> Einen Moment bitte, ich verbinde Sie mit unserem Team.

If tool execution fails:

> Ich konnte den Termin gerade nicht sicher eintragen. Ich gebe das an unser Team weiter.

If speech recognition fails repeatedly:

> Ich habe Sie leider nicht eindeutig verstanden. Ich verbinde Sie mit unserem Team oder sende Ihnen einen Link per WhatsApp.

If the user asks for a human:

> Natuerlich. Ich verbinde Sie mit dem Rexity Team.

---

## 13. Shared Database Schema Extensions

The schema below is conceptual. Exact implementation can be adapted to the current app stack.

```prisma
model Lead {
  id           String        @id @default(cuid())
  name         String?
  email        String?
  phone        String?
  company      String?
  service      String?
  source       ChannelType
  safeSummary  String?
  appointments Appointment[]
  sessions     CommunicationSession[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Appointment {
  id              String            @id @default(cuid())
  leadId          String?
  lead            Lead?             @relation(fields: [leadId], references: [id])
  clientName      String?
  clientPhone     String?
  clientEmail     String?
  startTime       DateTime
  endTime         DateTime
  status          AppointmentStatus @default(PENDING)
  source          ChannelType
  notesSummary    String?
  calendarEventId String?
  leaseExpiresAt  DateTime?
  idempotencyKey  String?           @unique
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([clientPhone])
  @@index([startTime])
  @@index([status])
}

model CommunicationSession {
  id                     String   @id @default(cuid())
  leadId                 String?
  lead                   Lead?    @relation(fields: [leadId], references: [id])
  channelId              String
  channelType            ChannelType
  currentState           ConversationState @default(IDLE)
  recordingConsent       Boolean  @default(false)
  aiDisclosureAccepted   Boolean  @default(false)
  marketingConsent       Boolean  @default(false)
  privacyNoticeVersion   String?
  consentTimestamp       DateTime?
  consentChannel         String?
  safeSummary            String?
  redactedContext        Json?
  lastActive             DateTime @default(now())
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  @@unique([channelId, channelType])
  @@index([currentState])
  @@index([lastActive])
}

model WebhookEvent {
  id              String      @id @default(cuid())
  provider        String
  providerEventId String
  channelType     ChannelType
  idempotencyKey  String      @unique
  processedAt     DateTime?
  status          String
  errorSummary    String?
  createdAt       DateTime    @default(now())

  @@unique([provider, providerEventId])
}

model AuditEvent {
  id             String      @id @default(cuid())
  sessionId      String?
  channelType    ChannelType
  eventType      String
  redactedMeta   Json?
  createdAt      DateTime    @default(now())

  @@index([sessionId])
  @@index([eventType])
}

model SuppressionEntry {
  id          String      @id @default(cuid())
  channelId   String
  channelType ChannelType
  reason      String
  createdAt   DateTime    @default(now())

  @@unique([channelId, channelType])
}

enum ChannelType {
  voice
  whatsapp
  web
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  RESCHEDULED
  CANCELLED
  EXPIRED
}

enum ConversationState {
  IDLE
  DISCLOSURE
  CONSENT
  FAQ
  BOOKING_COLLECT_DETAILS
  SLOT_SCANNING
  SLOT_OFFERED
  PENDING_CONFIRMATION
  CONFIRMED
  RESCHEDULE_VERIFY
  RESCHEDULE_HOLD_NEW_SLOT
  RESCHEDULE_SWAP
  CANCEL_VERIFY
  CANCELLED
  HANDOFF_REQUESTED
  HANDOFF_ACTIVE
  FAILED_SAFE
  OPTED_OUT
}
```

---

## 14. Implementation Gates

Do not launch publicly until these gates pass:

1. Webhook signature tests pass.
2. Duplicate webhook/idempotency tests pass.
3. Calendar double-booking tests pass.
4. Reschedule swap tests pass.
5. Consent-gate tests pass for yes/no/no-answer.
6. Recording-disabled-by-default test passes.
7. RAG no-answer fallback tests pass.
8. Pricing/refund/legal refusal tests pass.
9. Human handoff test passes.
10. Opt-out test passes.
11. Retention cleanup job test passes.
12. Privacy policy and Impressum updates are reviewed.
13. Processor/DPA list is prepared.
14. German outbound calling review is completed before real cold outreach.

---

## 15. Minimal Implementation Plan

### Sprint 1: Foundation

- Add Prisma models for sessions, appointments, webhook events, audit events, and suppression.
- Build orchestrator state machine.
- Add idempotency utility.
- Add safe summary/audit logger.

### Sprint 2: WhatsApp

- Add Meta webhook verification.
- Add inbound message handling.
- Add approved-template outbound flow.
- Add opt-out parsing.
- Add booking flow through orchestrator.

### Sprint 3: Voice

- Add Vapi/Retell webhook adapter.
- Add disclosure and consent states.
- Add voice booking flow.
- Add warm handoff.
- Add no-recording default config.

### Sprint 4: Calendar & Ops

- Add calendar hold/confirm/cancel/reschedule swap logic.
- Add dashboard views.
- Add monitoring metrics.
- Add retry queues and failure states.

### Sprint 5: Compliance & Launch Hardening

- Add retention cleanup jobs.
- Add privacy policy updates.
- Run red-team scripts.
- Run German legal/privacy review.
- Prepare demo sandbox and production toggles.

---

## 16. Final Production Stance

This architecture is strong enough for a premium Rexity showcase if built with the controls above.

The highest-risk areas are:

- German outbound calling rules.
- Recording/transcript handling.
- Calendar race conditions.
- LLM overreach.
- Weak caller verification.
- Missing operational dashboard.

The safest, most credible Rexity position is:

> Rexity builds controlled AI automation systems where the AI speaks naturally, but deterministic software owns identity, consent, state, compliance, and business actions.

---

## 17. Agent Delivery & Documentation Protocol

The build may be split across two implementation agents:

- **Agent X**: backend core, Prisma/schema, orchestrator, deterministic state machine, idempotency, calendar lifecycle, safe summaries, redacted audits, retention cleanup, and backend tests.
- **Agent Y**: WhatsApp adapter, voice adapter, Rexona runtime behavior, consent/disclosure scripts, RAG, provider adapters, channel guardrails, opt-out parsing, and channel tests.

Coordination rules:

- Both agents must read this architecture file before coding.
- Both agents must read the implementation plan at `/Users/sunnythakur/.gemini/antigravity/brain/aef64ce6-f546-4cc0-8b65-9fe2baa186d6/implementation_plan.md`.
- Agent X owns schema changes. Agent Y must not modify schema without recording the decision and coordinating with Agent X.
- Agent Y owns provider adapters. Agent X must not hardcode provider-specific WhatsApp, Vapi, Retell, STT, TTS, or LLM assumptions into core state logic.
- Both agents must keep the deterministic state machine as the authority. No LLM may directly mutate session, appointment, consent, suppression, or audit state.
- No agent may enable recording by default.
- No agent may add raw transcript or raw audio persistence by default.
- No agent may implement binding pricing, refund, legal, billing, contract, or delivery-date decisions.
- No agent may launch real outbound calling before legal/privacy review and owner approval.
- Both agents must append a build-log entry to the implementation plan after every meaningful change.

Build-log entries must include:

- Scope.
- Files changed.
- Decisions.
- Tests run.
- Risks/blockers.
- Next handoff.
