# Rexity — Auftragsverarbeiter / Sub-processor list

_Last updated: 2026-06-06_

This document lists the third-party processors (DSGVO Art. 28) involved in Rexity's RPA/WhatsApp delivery. It is the source of truth for `/datenschutz` and for processor contracts (DPAs) Rexity signs with customers.

Legal entity: **Rexity Labs UG (haftungsbeschränkt)** _(formation in progress — placeholder until KYB docs received)_

## Active processors

| Purpose | Processor | Location | DPA on file | Notes |
|---|---|---|---|---|
| App hosting | Vercel Inc. | US (Frankfurt edge) | ✅ DPA via Vercel terms | Logs may transit US; SCCs apply |
| Database | Neon (Databricks) | EU (Frankfurt region) | ⚠️ pending | Postgres for Lead/Appointment/Audit |
| Analytics | Vercel Analytics | US | ✅ DPA via Vercel | Cookieless, no PII, no cross-site tracking |
| ~~Web fonts~~ | ~~Google Fonts~~ | — | ✅ removed 2026-06 | Self-hosted Inter; no external font fetch |
| CSS framework CDN | Tailwind CSS via cdn.tailwindcss.com | jsDelivr/Cloudflare | ⚠️ CDN-level only | Script-based styling utility |
| Source control | GitHub Inc. (Microsoft) | US (multi-region) | ✅ Microsoft EU DPA | Code only; no end-user data |

## Explicitly NOT used (transparency)

The following commonly-deployed processors are **not** in use on rexity.ai today:

- Google Analytics, Google Tag Manager, Google Ads conversion pixels
- Meta / Facebook Pixel, LinkedIn Insight Tag, TikTok Pixel
- Hotjar, Microsoft Clarity, FullStory, Mixpanel, Segment, PostHog
- Mailchimp, HubSpot, Pipedrive, ActiveCampaign (no newsletter, no CRM)
- Zoom, Google Meet, Microsoft Teams (we communicate by email + ad-hoc booking)
- Cookies for advertising or profiling purposes

## Pending processors (gated on P-META / P-VOICE)

| Purpose | Processor | Status |
|---|---|---|
| WhatsApp Business API | Meta Platforms Ireland Ltd. | **Pending — P-META** |
| Voice (TTS/STT, telephony) | Twilio or Vapi or Retell — **TBD** | **Pending — P-VOICE** |
| Recording storage (if used) | Provider-default S3 | **Pending — P-VOICE** |
| Optional analytics / observability | Sentry / Datadog (decision pending) | Not yet contracted |

## Sub-processor change policy

- 30-day prior notice to customers under contract before adding a new sub-processor.
- Customer right to object; objection triggers reasonable mitigation discussion.
- This file is the authoritative changelog; every modification is committed and tagged.

## Data flows

```
Inbound WhatsApp message
    └─ Meta (Ireland) ──TLS──> Vercel function (EU) ──Prisma──> Neon (Frankfurt)
                                  │
                                  └─ AuditEvent rows: redacted-only, no message body

Inbound voice call (Sprint 3 dry-run, P-VOICE for live)
    └─ Voice provider ──Webhook──> Vercel function (EU) ──Prisma──> Neon (Frankfurt)
                                       │
                                       └─ No raw audio stored unless consent=granted

DSAR request (S2-T7)
    └─ Admin API (token-gated) ──Prisma──> Neon (Frankfurt)
                                       │
                                       └─ Export JSON + erasure transaction
```

## Retention defaults (see `lib/rpa/retention.ts`)

| Data | Retention |
|---|---|
| Webhook events | 30 days |
| Audit events | 180 days |
| Transient session summaries | 3 days (cleared, session stays) |
| Appointments (terminal: cancelled/rescheduled/expired) | 365 days |
| Unconverted leads | 547 days (18 months) |
| Suppression entries | Indefinite (unless `expiresAt` set) — required for opt-out compliance |

## Open compliance items (Sprint 2 backlog)

- [ ] Sign Neon DPA before storing live customer data.
- [ ] Sign Meta DPA as part of P-META.
- [ ] Sign voice-provider DPA as part of P-VOICE.
- [ ] Legal review of `/datenschutz` and `/impressum` once company entity exists.
- [ ] Publish this list at `/processors` (HTML mirror) once legal sign-off.
