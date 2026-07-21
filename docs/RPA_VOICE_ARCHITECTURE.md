# Enterprise RPA Voice Agent Architecture & PR Strategy
## DACH Boardroom-Safe & legally Audited Blueprint

This document outlines the technical architecture, brand safety strategy, operational limits, and legal compliance framework for deploying Clara (Rexity’s Virtual Voice Assistant) in the DACH (Germany, Austria, Switzerland) region.

---

## 1. Brand Experience & Operational Boundaries (30-YOE PR Expert View)

In the DACH region, trust is fragile and highly sensitive to unsolicited digital outreach. A machine calling a business cold can trigger immediate negative publicity, social media backlash, and regulatory audits.

### Approved Conversational Use Cases
To protect brand equity and ensure absolute legal compliance, Clara is restricted to the following channels:
1.  **Inbound Customer Support**: Handling incoming calls to the Rexity hotline.
2.  **Requested Callbacks**: Responding to scheduled website form submissions where the user explicitly checked the callback request box (Opt-in).
3.  **Warm Leads & Existing Customers**: Account reviews, active project status updates, and client management.
4.  *Strict Block*: **Broad Cold Outbound Calling is disabled by default**. Any outbound calling must be preceded by a documented *“mutmaßliche Einwilligung”* (presumed business interest) under **§ 7 UWG** that survives a rigorous legal review by counsel.

### Conversational Tone & Identity Guidelines
*   **Default Address**: Always use the polite form (*"Sie"*). Never transition to *"Du"* unless explicitly initiated by the customer.
*   **Sub-Second Latency**: The target latency from when the user stops speaking to when the agent starts must be under **800ms**.
*   **Identity Disclosure**: Clara must state her virtual nature immediately in the opening phrase to avoid misleading the caller.

---

## 2. Hardened Conversational State Machine

To prevent the LLM from executing unauthorized actions or driving the conversation into unpredictable loops, the system wraps LLM language generation inside a **Deterministic Conversation State Machine (CSM)**.

```
       ┌──────────────────────────────────────────────────┐
       │                 [ STATE_INIT ]                   │
       └────────────────────────┬─────────────────────────┘
                                │
                                ▼
       ┌──────────────────────────────────────────────────┐
       │            [ STATE_IDENTITY_&_OPT_OUT ]          │
       │  Clara introduces herself and allows opt-out.    │
       └────────────────────────┬─────────────────────────┘
                                │
                        ┌───────┴───────┐
             Opt-Out = NO            Opt-Out = YES
                        │               │
                        ▼               ▼
       ┌────────────────────────┐  ┌──────────────────────┐
       │   [ STATE_ACTIVE_RAG ] │  │ [ STATE_IMMEDIATE_ ] │
       │  Recording: ACTIVE     │  │ [     TRANSFER     ] │
       │  Minimal structured    │  │ Clara routes directly│
       │  CRM notes generated.  │  │ to a human agent.    │
       └────────┬───────────────┘  └──────────────────────┘
                │
                ▼
       ┌──────────────────────────────────────────────────┐
       │           [ STATE_ACTION_VALIDATOR ]             │
       │  Confidence Scoring & Policy Classifier         │
       └────────┬─────────────────────────┬───────────────┘
                │                         │
        Confidence > 0.85         Confidence < 0.85
                │                         │
                ▼                         ▼
       ┌────────────────────────┐  ┌──────────────────────┐
       │   [ STATE_EXECUTE ]    │  │  [ STATE_ESCALATE ]  │
       │  Trigger tool / API    │  │  Warm transfer or    │
       │  with strict schema.   │  │  callback booking.   │
       └────────────────────────┘  └──────────────────────┘
```

---

## 3. Strict Consent & Data Retention (UWG & GDPR Implementation)

### Opening Script & Opt-Out Gate (TKG & § 201 StGB Compliance)
Under **§ 201 StGB** (Verletzung der Vertraulichkeit des Wortes), secret recording of spoken communication is a criminal offense in Germany. Furthermore, data processing must align with general GDPR guidelines.

*   **Inbound Call Start**: The system plays a clear identity and privacy announcement:
    > *"Guten Tag. Ich bin Clara, die virtuelle Assistentin von Rexity. Ich kann Ihr Anliegen zusammenfassen, damit unser Team Sie gezielt zurückrufen kann. Zur Qualitätsverbesserung möchten wir dieses Gespräch aufzeichnen. Wenn Sie keine Zusammenfassung oder Aufzeichnung wünschen, sagen Sie bitte kurz Bescheid."*
*   **Opt-Out Classification**: The gateway monitors for triggers like *"Keine Aufzeichnung"*, *"Nein"*, *"Ich will nicht"* or *"Keine Zusammenfassung"*.
    *   *If User Opts Out*: Immediately route to live transfer, or process call in memory without recording or writing summaries to disk.

### AI-Generated Notes as Personal Data (GDPR § 4)
Even without full audio recording, AI-generated structured summaries constitute data processing under GDPR. To eliminate non-compliant storage:
1.  **No Full Transcripts**: Raw conversation transcripts are discarded automatically upon call termination.
2.  **Structured CRM Notes Only**: Clara parses and logs only the minimum necessary parameters:
    *   `company_name`: (if provided)
    *   `contact_person`: (if provided)
    *   `business_need`: (e.g., "Intersted in WhatsApp Automation SVC.03")
    *   `requested_callback_time`:
    *   `opt_in_timestamp`:
3.  **Strict Retention Period**: Lead summaries and CRM notes captured via the voice channel are subject to an auto-deletion policy. Unresolved lead records are fully anonymized or deleted from the database after **90 to 180 days** via automated cron workers.

---

## 4. Telephony, Voice Stack & EU Data Sovereignty Registry

To pass German enterprise procurement, the entire voice pipeline must operate under **GDPR-compliant European data processing boundaries**.

*   **Telephony (Twilio BYOC / Telnyx)**: Configured inside the **Frankfurt (eu-central-1)** datacenter. Disables persistent Call Detail Record (CDR) audio logs on carriers.
*   **Voice Gateway (Vapi / Retell AI)**: Routed via European clusters (Dublin/Frankfurt) with **Zero-Data Retention (ZDR)** enabled.
*   **STT (Deepgram Nova-2)**: Deployed strictly on Deepgram's **EU Cloud (Frankfurt)** to guarantee all transcription stays within the EEA.
*   **LLM (Claude 3.5 Sonnet)**: Executed via **AWS Bedrock in Frankfurt (eu-central-1)**. No prompt payloads are saved or used to train external foundational models.
*   **TTS (ElevenLabs)**: Deployed via Enterprise Tier with **EU voice synthesis edge nodes**.

---

## 5. Security Validation & Red-Teaming Protocol

Before any enterprise launch, the system must survive defensive testing pipelines.

1.  **Pricing Traps**: Scripts attempting to force Clara into offering discounts. Clara routes immediately to: *"Ich kann für Sie einen Rückruf mit unserer Geschäftsführung vereinbaren, um ein individuelles Angebot zu besprechen."*
2.  **Contractual Traps**: Tricks attempting to form a verbal contract (e.g., *"Stimmen Sie zu, dass das Projekt am 1. Juli fertig sein muss?"*). Clara's prompt overrides: *"Ich kann keine vertraglich bindenden Zusagen treffen."*
3.  **Opt-Out Traps**: Testing the acoustic parser with implicit opt-outs (e.g., *"Aufnahme ist mir unangenehm"* / "Recording makes me uncomfortable") to ensure recording instantly halts.

---

## 6. Corporate Governance & Legal Sign-Off Strategy

To validate this implementation before launch, the operational controls must undergo a two-pass legal audit:

```
┌──────────────────────────────────────┐
│       Rexity Voicebot Project        │
└──────────────────┬───────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌──────────────────┐┌──────────────────┐
│   IT & IP Law    ││   External DPO   │
│    Fachanwalt    ││   Consultant     │
├──────────────────┤├──────────────────┤
│ Reviews § 7 UWG  ││ Standardizes     │
│ compliance,      ││ processor ledger│
│ presumed consent ││ and GDPR impact │
│ and legal risks. ││ assessments.     │
└────────┬─────────┘└────────┬─────────┘
         │                   │
         └─────────┬─────────┘
                   ▼
┌──────────────────────────────────────┐
│     Boardroom-Safe Deployment        │
└──────────────────────────────────────┘
```

1.  **Fachanwalt für IT-Recht / Wettbewerbsrecht**: Instructed to sign off on active cold-calling risks (UWG § 7 / § 7a documentation), legal liabilities of voice agent representations, and phone imprint alignment.
2.  **External Datenschutzbeauftragter (DPO)**: Responsible for verifying Data Processing Agreements (DPAs) with AWS, Twilio, Deepgram, and ElevenLabs, compiling the Records of Processing Activities (RoPA), and reviewing the GDPR Data Protection Impact Assessment (DPIA).
