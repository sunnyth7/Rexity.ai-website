# Rexity Enterprise RPA Technology Stack

This document serves as the standard technology stack reference for Rexity's **Business Process Automation** service line (matching `SVC.03` in `SCOPE_OF_SERVICES.md`). Use this stack for designing, building, and deploying automated customer channels, messaging campaigns, VoIP integration, and internal workflows.

---

## 1. Stack Overview

```
 ┌────────────────────────────────────────────────────────┐
 │                   User Touchpoints                     │
 │      Voice (PSTN)  │  WhatsApp Business  │  Web Forms  │
 └──────────────────────────┬─────────────────────────────┘
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │               Integration & API Gateways               │
 │    Twilio/Telnyx   │  Meta Graph API   │ Next.js APIs  │
 └──────────────────────────┬─────────────────────────────┘
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │               Orchestration & Workflow                 │
 │       n8n (Self-Hosted)   │   Node.js Serverless       │
 └──────────────────────────┬─────────────────────────────┘
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │                AI, Database & Analytics                │
 │    Claude/GPT-4   │   Neon (Postgres)   │   Looker     │
 └────────────────────────────────────────────────────────┘
```

---

## 2. Component breakdown

### A. VoIP7 Cloud Receptionist
*   **Purpose**: Fully automated 24/7 cloud receptionist routing, answering FAQs, and capturing warm callback briefings.
*   **Core Software**: VoIP7 online platform.
*   **Bridges**: SIP trunking endpoints to Vapi/Retell AI gateway.
*   **Failover**: Twilio Elastic SIP Trunking with multiple backup routing profiles.

### B. WhatsApp for Business API
*   **Purpose**: Transactional messages, auto-replies, interactive customer menus, and AI-led conversational support.
*   **Provider**: Meta Cloud API (direct integration to bypass third-party margins).
*   **SDKs**: Official Meta NodeJS/Python SDK.
*   **Verification**: Meta Business Suite verification required for DACH phone number green badge check.
*   **Templates**: Pre-approved, bilingual (DE/EN) WhatsApp templates for appointment updates and confirmations to prevent spam flags.

### C. Workflow & Orchestration Engine
*   **Primary Tool**: **n8n (Self-Hosted on Vercel/Render/Docker)**.
    *   *Why n8n*: Visual workflow node setup with advanced JavaScript nodes, hosting independence, direct integration with Google Calendar API, WhatsApp Cloud API, and local PostgreSQL databases.
*   **Backup / Lightweight**: **Next.js Route Handlers** (TypeScript serverless functions).
*   **State Management**: Prisma ORM with Neon (Serverless Postgres) database tracking all queue transactions, user sessions, and consent logs.

### D. LLM & Context Engine
*   **Model**: Anthropic Claude 3.5 Sonnet or OpenAI GPT-4o.
*   **Vector Database**: pgvector (via Neon/Supabase) or Pinecone for rapid RAG context extraction.
*   **System Controls**: Custom JSON-Schema validation to ensure 100% deterministic output for lead categorization.

---

## 3. Deployment & Scalability Specs

1.  **Hosting Infrastructure**:
    *   **Frontend & APIs**: Vercel (Next.js hosting with low-latency edge caching).
    *   **Workflow Engine**: n8n deployed via Docker on AWS ECS or Render with a highly available Redis queue runner for concurrent call handling.
    *   **Databases**: Neon Postgres (with auto-scaling compute bounds).
2.  **Telemetry & Monitoring**:
    *   **Alerting**: Sentry for Next.js route errors; n8n webhook notifications to Slack for run failures.
    *   **Call Auditing**: OpenTelemetry-compatible tracing (e.g., Datadog or Baselime) to track latency at every node (STT -> LLM -> TTS).

---

## 4. DACH Compliance Requirements

*   **Hosting Location**: Frankfurt (`eu-central-1`) AWS / Neon region for all personal identifiable information (PII).
*   **IP Masking**: Strict masking of caller IP addresses before passing transcripts to external AI gateways.
*   **Opt-Out Logging**: Double-opt-in state saved directly in Prisma database for all automated messaging channels (WhatsApp and Phone Callbacks).
