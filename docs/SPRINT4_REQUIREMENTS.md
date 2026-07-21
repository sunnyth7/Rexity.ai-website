# Sprint 4 — Content, Branding & De-AI Requirements

Date: 2026-06-11 · Status: **CAPTURED — awaiting approval → then sprint plan → then green-light to execute.** No changes made yet.
Owner: Sunny. Context recorded so it survives across sessions.

---

## 0. The brief (from CTO/owner, verbatim intent)

1. **Confirm no Google Fonts** + add a visible note on the page so readers know "no Google Fonts used" (DSGVO trust signal).
2. **Replacement imagery** — generate new images for the copied stock photos; provide the AI prompts.
3. **Replace the 3 case-study apps** in *"Ausgewählte Arbeiten" / "Selected Work"* with our real apps: **Fresh&Save**, **LevelKraft**, **Clevr** — logo, name, screenshot, text, explanation, everything.
4. **Team section ("Das Team hinter Rexity")** — currently Sunny's profile+photo slides left→right on scroll (a pinned horizontal animation), then releases to scroll down. Change to a **normal scroll-down** (no pin/slide).
5. **De-AI the copy** — Germans are wary of AI; "AI everywhere" drives them to a traditional web shop. Recheck every banner/heading/paragraph, note the AI language, replace with concrete **business-technology** wording (outcomes, reliability, EU-compliance, automation that saves time). Keep AI only where it's a literal, concrete service.
6. Process: fix plan → record (this file) → owner approval → sprint plan → green-light → execute.

---

## 1. Confirmed: Google Fonts status
✅ **Zero Google Fonts.** Verified at runtime — the page makes 0 external requests; all fonts self-hosted under `assets/vendor/`. (Done in the GDPR self-host pass.) Proposed reader-facing note in §5.

---

## 2. Current AI/KI language audit + proposed replacements (the big one)

Strategy: lead with **what we build and the result**, not the technology label. Drop "AI/KI" from headlines and value props; keep it only where it names a real deliverable the buyer asked for. German tone: solide, ergebnisorientiert, kein Hype.

| # | Where | CURRENT (DE) | PROPOSED (DE) | PROPOSED (EN) |
|---|---|---|---|---|
| 1 | Hero H1 | KI für ambitionierte Teams. | **Software, die ambitionierte Teams voranbringt.** | Software built for ambitious teams. |
| 2 | Hero ¶1 | Hinter jedem erfolgreichen KI-Einsatz steht ein Team … tiefe KI-Expertise … | **Hinter jeder guten digitalen Lösung steht ein Team, das Ihr Unternehmen versteht. Unser technisch geführter Ansatz verbindet tiefes Fachwissen mit produktionsreifer Software, die Ihrem Team hilft, dem Wandel einen Schritt voraus zu sein.** | Behind every great digital solution is a team that understands your business. Our engineering-led approach pairs deep expertise with production-grade software that keeps your team ahead of change. |
| 3 | Hero ¶2 | … KI-Workspaces und Automatisierungen, die für Ihre Mitarbeitenden arbeiten … | **… digitale Arbeitsplätze und Automatisierungen, die für Ihre Mitarbeitenden arbeiten – nicht gegen sie.** | … digital workspaces and automations that work for your people, not against them. |
| 4 | Hero ¶3 | … EU-konformes KI-Fundament für die Zukunft … | **… belastbares, EU-konformes digitales Fundament für die Zukunft …** | … a defensible, EU-compliant digital foundation for the long term. |
| 5 | Hero ¶4 | Die Erfahrung, KI-Kompetenz und Weitsicht … | **Die Erfahrung, technische Kompetenz und Weitsicht unseres Teams sorgen dafür, dass Ihre Systeme im Takt Ihrer Ambitionen wachsen.** | Our team's experience, technical depth and foresight keep your systems growing with your ambitions. |
| 6 | Section intro | KI-Workspaces und Automatisierung – durchgängig. | **Digitale Arbeitsplätze und Automatisierung – durchgängig.** | Digital workspaces and automation, end to end. |
| 7 | Service card | … inklusive KI-Chatbots | **… inklusive intelligenter Chatbots** | … smart chatbots included |
| 8 | Service card title | KI-Voice & WhatsApp. | **Sprach- & WhatsApp-Automatisierung.** | Voice & WhatsApp automation. |
| 9 | Service card sub | Rexona Voice-Assistent + WhatsApp-Bot — DSGVO-konform … | **Telefon- und WhatsApp-Assistenten, die Anrufe und Anfragen rund um die Uhr beantworten — DSGVO-konform, EU-gehostet.** | Phone and WhatsApp assistants that answer calls and enquiries 24/7 — DSGVO-compliant, EU-hosted. |
| 10 | Service card title | SEO & KI-Video | **SEO & Video-Marketing** | SEO & Video Marketing |
| 11 | Service card sub | Technisches SEO … + KI-Videomarketing in großem Stil (Avatare …) | **Technisches SEO mit Langzeitwirkung + Video-Marketing in großem Stil (Avatare, realistische Aufnahmen, Shorts).** | Technical SEO that compounds + video marketing at scale (avatars, realistic shots, shorts). |
| 12 | Value heading | KI-nativ, nicht KI-bemalt. | **Ergebnisse, keine Buzzwords.** | Results, not buzzwords. |
| 13 | Founder bio | … verantwortet den AI-first-Ansatz … KI-Video … | **… verantwortet den technologiegetriebenen Ansatz des Unternehmens — Websites, Apps, WhatsApp- und Telefon-Automatisierung sowie Video für ambitionierte Teams …** | … leads the company's technology-first approach — websites, apps, WhatsApp and phone automation, and video for ambitious teams … |
| 14 | Stack heading | Auf einem erprobten KI-Stack gebaut | **Auf einem erprobten Technologie-Stack gebaut** | Built on a proven technology stack |
| 15 | Stack sub | … erstklassige Cloud-, KI-, GPU-, Datenbank- … | **… erstklassige Cloud-, Rechen-, Datenbank- und Deployment-Plattformen — die Infrastruktur hinter allem, was wir liefern.** | … best-in-class cloud, compute, database and deployment platforms — the infrastructure behind everything we deliver. |
| 16 | Case-study quote | … ein KI-Voice-Agent … | **… ein Telefon-Assistent …** ("a phone assistant") | … a voice assistant … |

> Net: "AI/KI" goes from ~18 prominent mentions to ~0 in headlines/value props. The chatbot KB (separate) already de-emphasises; can align if wanted.

---

## 3. "Ausgewählte Arbeiten" → our 3 real apps

Replace the leftover WSIT case studies (Premier Foods / Zellis / Zertus — logos, screenshots, "[Customer A/B/C]" copy) with:

| Slot | App | Needs |
|---|---|---|
| 1 | **Fresh&Save** | logo + 1–2 screenshots + 2–3 sentence DE/EN description (what it is, what we built, outcome) |
| 2 | **LevelKraft** | logo + screenshots + description (TELC/Sprachprüfungs-Vorbereitung) |
| 3 | **Clevr** | logo + screenshots + description (clevr.social — social events) |

**Open Q (need from you):** real logos + app-store/screenshot images for each, OR confirm I source them from the live apps (levelkraft.de, clevr.social, Fresh&Save store listing). Plus 1 line each on what to highlight. I'll write the DE/EN case-study copy once you confirm.

---

## 4. Team section — remove the horizontal slide
The team area uses a GSAP **pinned horizontal scroll** (`v-scroll-trigger` / `v-scroll-wrapper-left/right` timeline) that slides Sunny's profile+photo left→right while pinned, then releases. Plan: neutralise *that specific* timeline so the team block is a **normal vertical scroll**, leaving the other pinned sections (stats counter, service h-scroll) untouched. Also remove the leftover "Team Member 04 placeholder" (Janet) image/slot so only the real team shows.

---

## 5. "No Google Fonts" / privacy trust note (reader-facing)
Add a small **trust strip** (footer, near the legal links) — bilingual:
> **DE:** "DSGVO-konform · EU-gehostet · keine Google Fonts · kein Tracking von Dritten"
> **EN:** "DSGVO-compliant · EU-hosted · no Google Fonts · no third-party tracking"
Honest now (we verified 0 external requests) and a strong differentiator for German buyers.

---

## 6. Image replacement — AI generation prompts

Style target: clean, modern, German/European business setting, natural light, real-work feel (not glossy US stock), 16:10 or square to match slots. Avoid logos/brands/faces of identifiable real people. Render via our Gemini/NVIDIA image capability or hand to a tool.

| Slot (current file) | Prompt |
|---|---|
| **Hero** (expert-it.jpg) | "A bright, modern European office; a small team of two collaborating at desks with laptops and a large monitor showing clean dashboards and code, soft natural daylight from large windows, calm and focused mood, neutral palette with subtle warm accents, candid documentary photography, shallow depth of field, no readable brand logos." |
| **Service: Website/App dev** (End-User-Device-Management.jpg) | "Close-up of a designer's desk: a laptop showing a clean website/app interface in a Figma-like editor, a phone beside it mirroring the mobile layout, plants and coffee, soft daylight, minimalist modern workspace, candid, no recognizable brands." |
| **Service: Digital Marketing** (Application-Management-Service.jpg) | "A marketer reviewing an analytics dashboard with rising charts on a monitor, sticky notes with a content calendar on a glass wall, bright modern office, optimistic professional mood, candid photography, neutral tones." |
| **Service: Automations** (Digital-Employee-Experience.jpg) | "Abstract-but-real: a tidy desk with a laptop showing a flowchart of connected steps (an automation workflow), a smartphone showing a WhatsApp-style chat, clean and organised, soft light, conveys 'work done for you', no brand logos." |
| **Service: Voice & WhatsApp** (Digital-Workspaces-1.jpg) | "A friendly small-business reception desk with a phone and a laptop, a subtle soundwave/voice motif on the screen, warm welcoming light, conveys calls handled smoothly, candid, European setting." |
| **Service: Testing & Support** (syshealth.jpg) | "A developer reviewing test results / a green-checkmarks QA dashboard on a monitor in a calm modern office, focused and reassuring mood, candid, neutral palette." |
| **Service: Dashboards/SAP** (Proactive-Innovation.jpg) | "A clean business intelligence dashboard with KPI cards and charts on a large screen in a meeting room, two people pointing at a metric, bright professional setting, candid, no brand names." |
| **Decorative 'team work'** (getty/christina unsplash) | "Two colleagues collaborating over a laptop in a bright modern European office, genuine candid moment, natural light, diverse, neutral modern palette, documentary style." |

Sunny's photo (`rexity-team-01.jpg`) stays — it's real.

---

## 7. Open questions before sprint planning
1. App assets (logos/screenshots) for Fresh&Save / LevelKraft / Clevr — you provide, or I source from the live apps?
2. De-AI copy — approve the §2 table as-is, or tweak specific lines?
3. Image generation — should I generate them with our Gemini/NVIDIA key, or do you just want the prompts to run elsewhere?
4. Trust strip wording (§5) — ok?
