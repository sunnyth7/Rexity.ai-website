# Rexity.ai — Site Architecture & Migration Plan

Date: 2026-06-12 · Status: **Path C SHIPPED & live (2026-06-13). 18 pages + nav wiring on production. Remaining: per-page imagery (optional).**

> **Decision log:** Build approach = **Path C (hybrid)**. Migration = **done** (Omi page at `rexity.ai/`, old altrum homepage removed, `/rexity-omi` 301→`/`). 17 service pages + `/services` overview generated from `data/services.json` via `scripts/gen-service-pages.mjs`, all live. Homepage "Services" nav repointed to `/services` via `omi-services-nav.js`. Verified live 2026-06-13.

---

## 0. The situation (why this needs a decision, not just execution)

There are **two separate codebases** today:

| | A. Static "Omi" page (LIVE) | B. Next.js app (NOT deployed) |
|---|---|---|
| Where | rexity.ai (`/` → `/rexity-omi`) | Desktop branch `rexity-v3`, never shipped |
| Has | All Sprint 1–4 work: chatbot (DeepSeek+RAG), DE/EN i18n, de-AI copy, 3 real app case studies + WAN images + logos, GDPR self-hosting, tracker removal, lead API | `app/services/[slug]` route + `lib/services.ts` (8 services with sub-steps/offerings/FAQs) + voice/WhatsApp webhooks |
| Missing | Per-service sub-pages | The whole polished homepage, chatbot, i18n, case studies, legal, GDPR work |
| Type | Static Webflow export (one big page, iframe) | React/Next.js, builds per-route |

**You can't easily have both at once.** Your request ("a page per service + sub-pages" **and** "make Omi the main site") pulls toward both codebases. §3 is the decision.

---

## 1. Proposed service taxonomy (reconciled)

Merging the live page (6), the chatbot KB (6), `lib/services.ts` (8), and your hints (Web→Design/Dev/SaaS/Dashboards; Automation→RPA/WhatsApp). Top-level **hubs** → **sub-service pages**:

```
/  (Homepage — the Omi page)
│
├─ /web                         Web & Apps  (hub)
│   ├─ /web/web-design          Web Design
│   ├─ /web/web-development      Web Development
│   ├─ /web/saas                SaaS Platforms
│   ├─ /web/mobile-apps         Mobile Apps (iOS/Android)
│   └─ /web/dashboards          Dashboards & Reporting
│
├─ /automation                  Automation  (hub)
│   ├─ /automation/rpa          RPA / Business-Process Automation
│   ├─ /automation/whatsapp     WhatsApp Agents
│   └─ /automation/voice        Voice Agents / Cloud Receptionist
│
├─ /ai-agents                   AI Agents  (hub)        [decision: keep, or fold into /automation]
│   ├─ /ai-agents/chatbots      Website Chatbots
│   └─ /ai-agents/assistants    WhatsApp & Voice Assistants
│
├─ /marketing                   Digital Marketing  (hub)
│   ├─ /marketing/seo           SEO
│   ├─ /marketing/content       Content & Social
│   └─ /marketing/video         AI Video Marketing
│
├─ /sap                         SAP Agentic AI Workflows  (enterprise, standalone)
│
├─ /testing-support             Testing & Support  (standalone)
│
├─ /work                        Ausgewählte Arbeiten (LevelKraft · Clevr · Save&Fresh)
├─ /about                       Team / company
├─ /contact                     (or chatbot/email only)
└─ /impressum /datenschutz /agb /aeb /barrierefreiheit   (existing legal)
```

**LOCKED taxonomy (2026-06-13):**
- `/web` (hub) → `web-design` · `web-development` · `saas` · `mobile-apps` · `dashboards`
- `/automation` (hub) → `rpa` · `whatsapp` · `voice` · `chatbots`  *(AI Agents folded in here)*
- `/marketing` (hub) → `seo` · `content` · `video`
- `/sap` (standalone, enterprise)
- `/testing-support` (standalone)

= **5 top-level + 12 sub = 17 service pages.** Dropped from scope for launch: Trainings, Research & Analysis (kept in `lib/services.ts` for later).

---

## 2. What each page contains (template)

**Hub page** (e.g. `/web`): hero (what the hub covers) · a grid of the sub-service cards (each links to its page) · why-Rexity · process · CTA · chatbot · i18n.

**Sub-service page** (e.g. `/web/web-design`): hero (one-line promise) · what's included (deliverables) · 3-step process · who it's for · mini-FAQ · related sub-services · CTA (email/demo) · chatbot · DE/EN. ~1 screen, fast, SEO-titled. No prices (per policy).

All pages inherit: the DE/EN toggle, the chatbot, the footer legal strip, the GDPR/self-hosted assets, and the no-AI-buzzword tone.

---

## 3. THE FORK — pick one (this decides the whole build)

### Path A — Static, hand-built pages (extend what's live)
Keep the Omi page as homepage; build each service/sub-page as a new lightweight **static HTML page** in the brand style, sharing the chatbot + i18n + footer.
- ✅ Keeps every bit of Sprint 1–4 work untouched. Same fast static hosting. Lowest risk to what's live.
- ❌ ~18 pages hand-built; the heavy Webflow export can't be reused per page, so new pages get a cleaner (slightly different) template than the homepage. More manual content work.

### Path B — Switch production to the Next.js app
Ship the existing Next app (it already has `/services/[slug]` + service data) as rexity.ai.
- ✅ Service pages exist already; scalable, one template, easy to add pages.
- ❌ **Loses the homepage, chatbot, i18n, case studies, de-AI copy, GDPR/tracker work** — all of it lives only on the static Omi page. We'd have to port months of work into the Next app first. Highest effort + risk.

### Path C — Hybrid (RECOMMENDED)
Omi page stays the **homepage at `/`**. Build the **service hub + sub-pages as a new, clean, consistent static template** (shared header/footer/chatbot/i18n), generated from a single `services.json` so content is maintainable. Old root site removed.
- ✅ Keeps all Sprint work. Proper per-service pages with a modern, lighter template. One data file drives all service pages (easy to edit/translate). Static = fast + cheap + same deploy.
- ❌ The new service pages won't be pixel-identical to the Webflow homepage (they'll be a cleaner sibling style) — arguably a plus.

**My recommendation: Path C.** It preserves everything you've built, gives real per-service pages, and stays on the simple static pipeline. I'd drive all ~18 pages from one `services.json` (EN+DE) so you can edit copy in one place.

---

## 4. Migration: Omi → root, remove old site (low-risk, do first)

Independent of the fork; this is the "make Omi the main site" part.
1. **Serve Omi at `/`** — change `vercel.json` `/` from a **307 redirect** to a **rewrite** → `/rexity-omi/index.html` (URL stays `rexity.ai/`, assets keep working since files stay under `/rexity-omi/`). Add a 301 `/rexity-omi` → `/` for canonicalization + SEO.
2. **Remove the old website** — delete/retire the old root `index.html` (altrum-derived) + `altrum.html` + `systems/` (confirm these are the "old site"). Keep legal pages + app privacy pages (clevr/, levelkraft-…, save-and-fresh/).
3. **SEO** — set canonical to `https://www.rexity.ai/`, update `robots.txt`/sitemap, keep the noindex banner until you say go-live.
4. Verify: `/` shows the Omi page, no redirect loop, all assets 200, chatbot/i18n intact.

Risk: low (rewrite + file removal, fully reversible). ~30 min + verify.

---

## 5. Phased execution (after you pick a path)

- **Phase 0** — Migration (§4): Omi → `/`, remove old site. ✅ **DONE (live).**
- **Phase 1** — Taxonomy locked + `data/services.json` (18 pages, EN+DE, offerings/outcomes/process/who/stack/FAQ/related). ✅ **DONE.**
- **Phase 2** — `scripts/gen-service-pages.mjs` template (hub + leaf + index): brand palette, self-hosted Inter, chatbot include, DE/EN via shared `rexity_lang`. ✅ **DONE.**
- **Phase 3** — All 17 service pages + `/services` overview generated; homepage "Services" nav repointed to `/services` (`omi-services-nav.js`). ✅ **DONE (live).**
- **Phase 4** — Per-page WAN hero imagery, sitemap.xml, lift `noindex` at go-live, Lighthouse pass. ⏳ **OPTIONAL / pending** (pages are text-first and clean without images).

---

## 6. What I need from you
1. **Pick a path** (A / B / **C-recommended**).
2. **Confirm the taxonomy** (§1) — the hub list + the 4 open questions.
3. **OK to run Phase 0 (migration) now?** It's low-risk and independent; I can do it immediately while you decide the rest.
