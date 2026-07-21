# CTO Audit & Sprint Plan — rexity.ai

Date: 2026-06-10 · Auditor: Claude (acting CTO) · Scope: live production site (rexity.ai → Vercel project `rexity-ai-website-um2g`, served from the static `main` branch), chatbot + lead APIs, Supabase backend.

Status: **SPRINT 1 + SPRINT 2 (code) SHIPPED.** Sprint 2 dashboard runbook pending (you). Sprints 3–4 pending.
> ✅ **SPRINT 1 SHIPPED 2026-06-10** — all off-site CTAs neutralized (0 workspace-it.com nav links live), real people + client images purged (45 files incl. all srcset variants → neutral placeholders), testimonials (NHS/Metropolitan/reviewers) hidden, contact form hidden + email CTA injected, broken images fixed. Verified on production. Stock hero/service photos deferred to Sprint 4. Originals in /tmp/wsit-img-backup.


---

## 0. Executive summary (severity-ranked)

| # | Severity | Finding | Why it matters |
|---|---|---|---|
| 1 | 🔴 CRITICAL (legal/brand) | **Every CTA button links to `workspace-it.com`** (the template's origin site). "Let's Talk", all 6 service CTAs, "Book a call", "How We Helped", "Watch the Interview", "GDPR Policy" — all navigate users OFF our site to a competitor. "Learn More" is a bare `<div>` with no link at all. | Traffic leakage to a third party + looks broken. |
| 2 | 🔴 CRITICAL (legal) | **Copyrighted images + real third-party people on our site.** Every photo except Sunny's is from the Workspace-IT WordPress media library: stock office photos, **real WSIT staff headshots** (Colin Eales, Daniel Goss, Janet Evans) with their **real LinkedIn links**, and **real client logos/testimonials** (Premier Foods, Zertus, NHS Trust, Metropolitan Gaming). | Copyright infringement + using real people's likeness/names without consent (GDPR/personality-rights exposure) while we are *mid-legal-review*. Highest-risk item. |
| 3 | 🟠 HIGH (cost) | **AI-API cost abuse / DDoS of serverless functions.** `/api/chat` costs money per call (Gemini embed + DeepSeek completion). Rate limit is in-memory **per serverless instance** — a distributed/botnet attack bypasses it. | No payment on site = no direct financial loss from fraud, but a sustained attack runs up the DeepSeek/Gemini bill. This is our #1 real attack risk. |
| 4 | 🟠 HIGH (credential) | **Supabase management token (`sbp_…`) is in plaintext chat history**, reused repeatedly. | Full management access to the Supabase account if that history ever leaks. Must be rotated. |
| 5 | 🟡 MEDIUM | **i18n is incomplete.** Only the "real content spine" translates to German. All service-card body paragraphs, the entire team section (except Sunny), all case studies, all testimonials stay English — and most of that is still Workspace-IT placeholder text. | Half-German page; reinforces finding #2. |
| 6 | 🟡 MEDIUM | **Broken images.** Two referenced files don't exist on disk (`[Customer A]_Logo_4c.svg`, `[Customer C]-Case-Study.jpg`) → broken-image icons render. | Looks unfinished. |
| 7 | 🟢 LOW | No Content-Security-Policy header (removed earlier because it broke the WSIT layout). | Defense-in-depth gap; low risk because rendering is XSS-safe (textContent/DOM, no innerHTML on dynamic data). |

---

## 1. Security assessment (hacker hat) — what I tried, what held

**Data theft — LOW RISK. Held up.**
- System-prompt extraction via chat → blocked (deterministic policy refusal).
- Knowledge-databank dump via chat → blocked (fallback).
- Direct anon read of the `Lead` (PII) table on Supabase REST → **401**. RLS is deny-by-default with no policies; the `service_role` key is server-side env only and is **not** in any client file (verified by case-sensitive secret scan of all served JS/HTML — clean).
- No client-side secrets, no auth tokens, no payment data anywhere (there is no payment system — correct).

**Site breakage / defacement — LOW RISK.**
- Static site, no CMS, no login, no user-writable content except `Lead` inserts (fixed schema, server-validated). No SQL/PostgREST injection surface.
- `/api/chat`: GET/OPTIONS → 405, malformed → 400, oversized → 413. `/api/lead`: malformed → 400, >20 KB → 413. Honeypot drops naive bots.
- Clickjacking: `X-Frame-Options: SAMEORIGIN` present. HSTS present.

**The real exposures (ranked):**
1. **AI-cost DDoS** (finding #3). In-memory per-instance rate limit is defeated by distributed traffic. Needs an *edge* control.
2. **Lead-form spam** (`/api/lead`, 8/10 min per IP, honeypot, no CAPTCHA). A botnet could fill the `Lead` table with junk. Storage/ops nuisance, not data loss.
3. **The `sbp_` token in chat history** (finding #4) — rotate now.

**Verdict:** We cannot lose money to fraud (no payments) and we cannot leak customer data (none stored that's reachable, PII locked down). The website itself is hard to deface. The two things an attacker *can* do are: (a) run up our AI bill, and (b) flood junk leads. Both are mitigable at the edge. The most damaging realistic event is the leaked management token, which is a us-problem, not an attacker-finding-a-hole problem — so rotate it.

---

## 2. Functional & content findings

- **Buttons:** 0 of ~20 CTAs work as intended (all → workspace-it.com; "Learn More" is a non-link div). The parent nav (`#about/#services/#work/#contact`) DOES work via `omi-extras.js` click-to-scroll.
- **Images:** ~25 photographic assets are copied template stock + real third-party people + real client logos. Only `rexity-team-01.jpg` (Sunny) is ours. 2 referenced images are missing → broken.
- **i18n:** spine translates; service bodies, team (except Sunny), case studies, testimonials do not.
- **Contact form:** one real form at `#contact-us` (CF7 id 59), rescued by `omi-lead.js` → `/api/lead`. Cleanly hidable by hiding `#contact-us`; `omi-lead.js` degrades silently.
- **Chatbot:** anti-abuse verified working (policy refusals, 429 rate limit, 413/400 guards). German-first + language stickiness working from prior sprints.

---

## 3. Sprint plan

### Sprint 1 — STOP THE BLEEDING (legal + brand) 🔴  *do first*
1. **Neutralize every CTA**: repoint all `workspace-it.com` links to in-page `#contact-us` (or the chatbot), and convert the dead "Learn More" div into a real link. Remove the WSIT team LinkedIn links.
2. **Purge copied imagery**: remove/replace all Workspace-IT stock photos, the Colin/Dan/Janet headshots, and all client logos/testimonial photos. Fix the 2 broken-image references. Keep Sunny's photo + the AI-stack logos.
3. **Remove placeholder sections**: delete or hide the fake team members (Colin/Dan/Janet), the placeholder testimonials (NHS, Metropolitan Gaming, "[Customer A/B/C]"), and the WSIT case studies. This simultaneously kills the biggest i18n gap and the biggest legal risk.
4. **Hide the contact form** (your explicit request) — hide `#contact-us`'s form, keep the chatbot as the contact path.
5. **Rotate the Supabase `sbp_` token** (you do this in the dashboard; I can't).

### Sprint 2 — SECURITY HARDENING 🟠
1. **Vercel Firewall / WAF**: enable edge rate-limiting on `/api/chat` and `/api/lead` (persistent across instances, unlike our in-memory limiter). Keep Attack Challenge Mode ready as the emergency switch.
2. **Provider spend caps**: hard monthly budget + alerts on DeepSeek and Gemini so a cost-DDoS can't run unbounded.
3. **Shared rate-limit store** (Vercel KV / Upstash) to replace the in-memory counter, OR rely on the WAF and keep in-memory as a second layer.
4. **CSP** header in report-only mode first (so it can't break the WSIT layout), then enforce once clean.
5. Optional: Cloudflare Turnstile on the lead form to kill bot spam without hurting UX.

### Sprint 3 — CONTENT & i18n COMPLETENESS 🟡
- Rewrite the service-card bodies as real Rexity copy (currently WSIT device-management text), add them to the i18n dictionary (DE+EN), re-embed into the chatbot KB.
- Real (or anonymized) case studies + testimonials, or remove the sections until we have them.
- Result: a fully bilingual page with zero placeholder text.

### Sprint 4 — "TRADEMARK OF OUR WORK" POLISH ✨
- **Real imagery**: AI-generated or licensed brand visuals to replace the purged photos (we have image-gen capability + an NVIDIA/Gemini key).
- **Animations**: tasteful scroll/hover/reveal motion (the page already loads GSAP — use it, respecting `prefers-reduced-motion` and performance).
- **Color/theme selector**: a small palette/theme switcher (and/or dark-mode), wired like the language pill so it persists.
- Performance & a11y pass (Lighthouse, contrast, reduced-motion).

---

## 3a. Sprint 2 — SHIPPED (code) + YOUR runbook (dashboard)

> ✅ **SPRINT 2 CODE SHIPPED 2026-06-10** — verified live on production:
> - **CSP** added as `Content-Security-Policy-Report-Only` (never blocks; realistic allowlist) + `Cross-Origin-Opener-Policy` + enforced `object-src 'none'` / `base-uri 'self'` / `frame-ancestors 'self'`. Flip to enforced `Content-Security-Policy` only after the external fonts/CSS are self-hosted (see §3b).
> - **Cost circuit breaker** in `/api/chat`: a per-instance ceiling of 120 LLM calls/min. Past it, the bot answers from the **cost-free keyword retrieval** (`engine:"fallback", degraded:true`) instead of paying Gemini+DeepSeek — so a distributed/botnet attack (many IPs each under the 20/5min per-IP cap) can no longer run the AI bill unbounded. Visitor still gets a relevant reply.
> - **Lead spam ceiling**: 40 inserts/min/instance on top of the 8/10min per-IP + honeypot.
> - **`/.well-known/security.txt`** (RFC 9116) responsible-disclosure contact → hello@rexity.ai.

**The remaining Sprint 2 items are edge/account config only YOU can do (no code):**

1. ✅ **Vercel Firewall (edge rate limiting) — DONE 2026-06-10** (configured via API). Two active custom rules on project `rexity-ai-website-um2g`:
   - `API chat rate limit` → path `/api/chat` → 30 req / 60 s per IP → **deny** (60s).
   - `API lead rate limit` → path `/api/lead` → 15 req / 60 s per IP → **deny** (300s).
   These run at Vercel's edge (block before the function runs → no LLM spend on blocked requests) across all instances. Verified normal traffic still passes (chat 200, lead 422, site 200). **You still have one toggle to set manually:** keep **Attack Challenge Mode** (Firewall tab → toggle) ready as the emergency switch during an active distributed attack — it can't be pre-armed via API.
2. **Provider spend caps (bounds the worst case).**
   - DeepSeek console → Billing → set a hard monthly limit + low-balance alert.
   - Google AI Studio / Gemini (project for `GEMINI_API_KEY`) → set quota/budget alert in Google Cloud Billing.
   With caps in place, even if every other layer failed, the bill can't exceed your number.
3. **Rotate the Supabase `sbp_` token** (still pending from Sprint 1 — it's in chat history).
4. *(Optional)* Cloudflare Turnstile on the lead form, or a Vercel KV / Upstash shared counter to replace the in-memory limiter. Only needed if Firewall + caps prove insufficient.

## 3b. GDPR / third-party-leak cleanup — ✅ DONE 2026-06-10 (verified, 0 external requests)

Self-hosted everything the page was hot-linking, and a runtime audit uncovered the page was leaking far more than fonts. All fixed and live:
- **8 stylesheets** from `workspace-it.com` → self-hosted under `assets/vendor/` (6 layout CSS sha256-byte-identical to origin; formidable + google-fonts rewritten to local). 89 Google font files + Inter (parent) vendored.
- **Google Fonts** hot-link (Open Sans/Source Sans/Poppins/Lato + parent Inter) → fully self-hosted; WebFont loader's Google call neutralized.
- **Sopro** (plugin.sopro.io) visitor-tracker → removed from the JS bundle.
- **ZoomInfo** (js.zi-scripts.com, obfuscated loader) → blocked by a first-in-head guard rejecting any script/fetch/XHR to tracker hosts.
- **Google Maps embed** of the Workspace-IT office → iframe removed.
- 4 inline `@font-face` (Inter/Cardo) hot-links + inert CSS sourcemap comments → localized / stripped.

**Verified at runtime: 0 external requests of any kind; layout pixel-identical** (headings render self-hosted Poppins). The page now sends zero visitor data to Google, workspace-it.com, or any tracker — closes the Abmahnung exposure. CSP can now be tightened toward enforced (fonts/CSS are same-origin). Original assets backed up; revert is one commit.

## 4. Recommended sequencing

Do **Sprint 1 immediately** — it removes live legal exposure (someone else's copyrighted photos + real employees' faces/names on our commercial site during legal review) and stops traffic leaking to a competitor. Sprint 2 in parallel (mostly dashboard config you do + small code). Sprints 3–4 are the craft work that makes the site a showcase.

**One-line asks that need YOU (not code):** rotate the `sbp_` token; set DeepSeek + Gemini spend caps; confirm the `hello@rexity.ai` mailbox is live; decide whether to keep or drop the case-study/testimonial sections (vs. wait for real ones).
