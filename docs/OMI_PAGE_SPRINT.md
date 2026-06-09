# Sprint O — Omi Page Audit, Hardening, and Flip-to-Prod Plan

Date: 2026-06-08
Owner: Sunny Thakur
Branch under audit: `rexity-v3-website-video-theme-base`, tip `8fd62ee`
Companion docs: `LEGAL_PAGES_SPRINT.md`, `RPA_SPRINT_PLAN.md`, `Rexity-Compliance-Checklist.docx`

---

## 1. Investigation findings

### 1.1 Architecture (as built)

| Layer | File | Size | Notes |
|---|---|---|---|
| Parent page (Rexity skin) | `public/rexity-omi/index.html` | **9.9 MB** | Webflow export, single minified line, hosts hero + footer |
| Iframe body (Workspace IT motion content) | `public/rexity-omi/omi/it-page-anim.html` | 180 KB region | GSAP + ScrollSmoother, themed `#f7f7f4` |
| Scroll proxy | `public/rexity-omi/omi/omi-scroll.js` | 55 lines | Sticky-iframe + parent-scroll → child scroller bridge |
| Sidebar nav | `public/rexity-omi/omi/omi-nav.js` | 88 lines | Shadow DOM right-side panel, isolated from page CSS/JS |
| Total folder | `public/rexity-omi/` | **~10.1 MB** | Self-contained static assets |

### 1.2 Header / hero / nav baseline check (item 1 of the brief)

✅ Header (`.navbar`), hero `<video class="rexity-hero-video">` at offset ~2.5 MB, footer `.footer-grid` at offset ~4.0 MB are preserved from prod.
✅ Hamburger handler is bound (Shadow DOM, right-side panel — verified in `omi-nav.js:43-83`).
✅ No `(14)/(07)` count badges (the cleaner in `omi-nav.js:11-17` strips them).
⚠️ Hero video poster, sources, and `.bg-video` class match prod skeleton; visual verification pending live screenshot.

### 1.3 Below-hero content (items 2–3)

✅ Iframe is `position:sticky; top:0; height:100vh; pointer-events:none` — sticky scroll-proxy pattern (single visible scrollbar).
✅ Parent scroll drives child `ScrollSmoother` via `omi-scroll.js`, with 20-tick × 500 ms settling loop after load.
⚠️ Animation init lives inside the iframe; if `ScrollSmoother` fails to attach (network or GSAP CDN error) the proxy silently no-ops — no fallback UI today.
⚠️ The 20-tick settle window (~10 s) implicitly assumes the iframe is fully painted within that time. On slow connections this can clip.

### 1.4 🔴 P0 — Branding & content leaks I found (items 5–6)

**Inside `public/rexity-omi/omi/it-page-anim.html` (these are visible/discoverable):**

| # | Leak | Location |
|---|---|---|
| L1 | `<title>Workspace IT - Managed IT Services</title>` (visible in browser tab) | head |
| L2 | `<meta name="description" content="From End-User Computing Services to Application Management, Workspace IT Develop Managed IT Solutions That Help Businesses Thrive!">` | head |
| L3 | `<meta property="og:title" content="Workspace IT - Managed IT Services">` | head |
| L4 | Plain-text **"Workspace IT"** mentions in copy | body |
| L5 | Customer names **"Zertus", "Premier Foods", "Zellis"** still referenced (these are Workspace IT's real customers, not Rexity's) | body |
| L6 | Real outbound links to **`workspace-it.com/case-studies/premier-foods/`, `/case-studies/zellis/`, `/customer-feedback-zertus/`** | body |
| L7 | `https://theluxuryfirepitco.uk/` — an unrelated UK luxury fire pit company surfaces somewhere in testimonials/cases | body |
| L8 | CSS imports from `workspace-it.com/wp-content/plugins/contact-form-7/…`, `/plugins/formidable/…`, `/plugins/oxygen/…`, `/themes/oxygen-is-not-a-theme/assets/fonts/cardo/*.woff2` | head/css |
| L9 | `https://yoast.com/product/yoast-seo-wordpress/` (WordPress SEO plugin trace) | head |

**Inside `public/rexity-omi/index.html`:**

| # | Leak | What it is |
|---|---|---|
| L10 | `aria-label="Rexity trademark"` | Webflow template artifact (despite the visible ™ being removed in `8fd62ee`) |
| L11 | `aria-label="Studio"` | Original template footer animated letters — relic of the source template "[X] Studio" |
| L12 | `aria-label="All Templates"` | Webflow Marketplace template-shop leftover |
| L13 | `aria-label="we are a creative engine."` × multiple template taglines (`design authority`, `digital benchmark`, `build digital ecosystems`) | Template hero taglines never rewritten for Rexity |
| L14 | `©AI systems for ambitious teams.` (footer h2) | Probably intentional but worth confirming |

### 1.5 🟠 P1 — Privacy / 3rd-party / network surface

| # | Issue | Risk |
|---|---|---|
| N1 | `fonts.googleapis.com` / `fonts.gstatic.com` font loading | IP → Google (already disclosed on prod, but Omi page doesn't currently disclose anything) |
| N2 | `https://use.typekit.net/...` (Adobe Typekit) | IP → Adobe (US transfer); **not currently disclosed anywhere** |
| N3 | `https://gsap.com/...` CDN script for GSAP | IP → GreenSock; runtime dep |
| N4 | `instagram.com`, `linkedin.com`, `x.com` profile links | Standard, fine — but referrer leaks |
| N5 | `workspace-it.com` font/CSS pulls (L8) | **Will 404 in prod, leak referrer, AND mention competitor's domain in net log** |
| N6 | No Content-Security-Policy / SRI / `referrer-policy` headers | Missing browser-side hardening |
| N7 | No CSRF / clickjacking defense (no `X-Frame-Options` / `frame-ancestors`) | Iframe-anchored layout means this needs careful CSP design |

### 1.6 🟡 P2 — Compliance gaps vs. our other properties

The Omi page **does not yet have** any of the work we just shipped on `rexity.ai`:

- ❌ No `<meta name="robots" content="noindex,nofollow">`
- ❌ No "Review underway" banner
- ❌ No cookie / localStorage notice
- ❌ No footer link to `/impressum`, `/datenschutz`, `/agb`, `/aeb`, `/barrierefreiheit`
- ❌ No reference to Rexity Labs UG (haftungsbeschränkt) i. Gr.
- ❌ No DSAR / DSGVO contact pointer

### 1.7 🟡 P2 — Architecture / performance concerns

| # | Concern | Impact |
|---|---|---|
| A1 | `index.html` is **9.9 MB** in a single line | First-load time, BFSG load-budget, mobile data |
| A2 | Scroll proxy assumes ScrollSmoother attaches within ~10 s | Silent fail on slow/throttled networks |
| A3 | No fallback when iframe fails to load | Blank section |
| A4 | `pointer-events:none` on iframe disables in-iframe clicks (intentional for scroll proxy but means in-iframe links **don't work** if any exist) | UX trap if iframe has CTAs |
| A5 | Iframe + parent + Shadow DOM nav = 3 isolated worlds → 3 places to keep in sync for any future change | Maintenance cost |

### 1.8 What's good

- ✅ Solid orchestration choice (static HTML splice over React rebuild)
- ✅ Clean parallel work decomposition (K/L/M with no file collisions)
- ✅ One-line revertible prod switch (`app/page.tsx` redirect)
- ✅ Shadow-DOM nav is genuinely isolated — bulletproof against page CSS regressions
- ✅ Branding sweep is partway done (visible ™ removed)
- ✅ Folder is self-contained so we can lift-and-shift / disable without affecting the rest of `rexity.ai`

---

## 2. Sprint plan

5 phases. Phase O0 happens **today** because the leaks are discoverable as soon as anyone shares the local URL or any preview deploy lands.

### Phase O0 — Emergency leak closure (TODAY)

| # | ID | Task | File(s) | Effort |
|---|---|---|---|---|
| 1 | O0-T1 | Add `<meta name="robots" content="noindex,nofollow,noarchive">` to BOTH `index.html` head AND `it-page-anim.html` head | both | XS |
| 2 | O0-T2 | Replace `<title>Workspace IT - Managed IT Services</title>` → `<title>Rexity Labs — AI Workspaces & Automation</title>` in `it-page-anim.html` | `it-page-anim.html` | XS |
| 3 | O0-T3 | Replace meta description + og:title in `it-page-anim.html` with Rexity copy | `it-page-anim.html` | XS |
| 4 | O0-T4 | Strip all `workspace-it.com` URLs from `it-page-anim.html` → neutralize to `#` or `/contact` | `it-page-anim.html` | S |
| 5 | O0-T5 | Strip all `workspace-it.com/wp-content/...` CSS/font imports from `it-page-anim.html` head | `it-page-anim.html` | S |
| 6 | O0-T6 | Strip `https://theluxuryfirepitco.uk` reference | `it-page-anim.html` | XS |
| 7 | O0-T7 | Strip `https://yoast.com/product/...` Yoast comment / link | `it-page-anim.html` | XS |
| 8 | O0-T8 | Add "Review underway / Entwurf" banner (same DE/EN toggle pattern as prod) | `index.html` | S |
| 9 | O0-T9 | Replace `aria-label="Rexity trademark"` → `aria-label="Rexity"` (drop the trademark word) | `index.html` | XS |
| 10 | O0-T10 | Replace `aria-label="Studio"` (footer animated letters) → either empty or "Labs" | `index.html` | XS |
| 11 | O0-T11 | Replace template `aria-label`s ("creative engine", "design authority", "digital benchmark", "build digital ecosystems", "All Templates") with Rexity copy or remove | `index.html` | S |

**O0 acceptance:** zero requests to `workspace-it.com`, `theluxuryfirepitco.uk`, `yoast.com`; tab title says Rexity; no "Studio" / "All Templates" / template-taglines in source.

### Phase O1 — Content rewrite (this week)

You said: *"the theme and elements will be same 100% only the wording and texts will be changes"*. This phase is the systematic find-and-replace of Workspace IT copy with Rexity copy, keeping the visual structure.

| # | ID | Task | Effort |
|---|---|---|---|
| 1 | O1-T1 | **Inventory** every visible English text node in `it-page-anim.html` — section headers, body copy, button labels, alt text. Build a translation table EN(WSIT) → EN(Rexity). | M |
| 2 | O1-T2 | Section: Services grid (End-User Device Mgmt → Web Development, Application Mgmt → SaaS Platforms, Digital Employee Experience → Business Process Automation, Digital Workspaces → Workspace AI, System Health Checks → Testing & Support, Vulnerability Mgmt → SEO & Marketing). 6 cards → 6 cards, keep image asset placeholders. | M |
| 3 | O1-T3 | Section: "Results That Speak" stats — rewrite numbers + labels for Rexity (e.g., 8 services, 4+ approved apps, EU-hosted, etc.) | S |
| 4 | O1-T4 | Section: Values (IT Expertise / Proactive Innovation / Inclusive Collaboration) → Rexity values (Outcomes over output / Senior-small-embedded / AI-native, etc. — sourced from `app/about/page.tsx`) | S |
| 5 | O1-T5 | Section: Team — remove WSIT team photos & names OR replace with Rexity team placeholders. Hide if not ready. | S |
| 6 | O1-T6 | Section: Case Studies — remove Zertus / Premier Foods / Zellis. Either hide or replace with CLEVR + LevelKraft + Save&Fresh + asogrove as our case studies. | M |
| 7 | O1-T7 | Section: "Who Are Our Customers?" partners carousel — replace logos with our actual partners or hide section | M |
| 8 | O1-T8 | Section: Testimonials ("Real Feedback From Real Clients") — remove WSIT testimonials. Hide until we have real testimonials with written permission. | S |
| 9 | O1-T9 | Section: "Get Expert Advice" + "There When You Need Us" CTAs → "Get a demo" / "Talk to Rexona" CTAs pointing at `/contact` | S |
| 10 | O1-T10 | Rerun the find pattern after rewrite — assert ZERO occurrences of: `Workspace IT`, `Zertus`, `Premier Foods`, `Zellis`, `End-User Device`, `Digital Workspaces`, `vulnerability mgmt`, etc. | XS |

**O1 acceptance:** every visible text on the page is Rexity copy; section structure unchanged; animations still fire.

### Phase O2 — Compliance footer + legal (this week)

Mirror the rexity.ai compliance posture onto the Omi page.

| # | ID | Task | File(s) | Effort |
|---|---|---|---|---|
| 1 | O2-T1 | Add 5-link footer strip (Impressum · Datenschutz · AGB · AEB · Barrierefreiheit) **inside the parent `.footer-grid`** so it's part of the Rexity-owned chrome | `index.html` | S |
| 2 | O2-T2 | Verify footer links work after prod-flip — confirm `/impressum`, `/datenschutz`, etc. still resolve when `app/page.tsx` redirects to `/rexity-omi/index.html` | n/a | XS |
| 3 | O2-T3 | Add cookie / localStorage notice (DE/EN toggle, dismissible) — replicate the working component from prod `index.html` | `index.html` | S |
| 4 | O2-T4 | Add `<meta name="description">` + `<meta property="og:*">` to parent — describe Rexity, NOT Webflow template | `index.html` | XS |
| 5 | O2-T5 | Add `Rexity Labs UG (haftungsbeschränkt) i. Gr.` copyright line in footer | `index.html` | XS |
| 6 | O2-T6 | Add `<meta name="theme-color" content="#f7f7f4">` for mobile browser chrome | `index.html` | XS |
| 7 | O2-T7 | Add a `/security.txt` at `/.well-known/security.txt` — disclose responsible disclosure email | `public/.well-known/security.txt` | XS |
| 8 | O2-T8 | Document the new page in `docs/PROCESSORS.md` — call out Adobe Typekit (or remove), GSAP CDN, any new external script | `docs/PROCESSORS.md` | S |
| 9 | O2-T9 | Update `/datenschutz` §5.1 with: GSAP CDN (gsap.com), Adobe Typekit if used, font CDN choices made on the Omi page | `datenschutz.html` (static site) | S |

**O2 acceptance:** Omi page has full footer parity with rexity.ai; cookies notice shows; legal links resolve; PROCESSORS.md reflects reality.

### Phase O3 — Architecture & performance hardening

| # | ID | Task | Effort |
|---|---|---|---|
| 1 | O3-T1 | **Self-host Google Fonts** to remove the `fonts.googleapis.com` runtime fetch (post-LG München 2022 ruling exposure) — already on the plan in `RPA_SPRINT_PLAN.md`, finally do it for Omi | M |
| 2 | O3-T2 | **Decide on Adobe Typekit** — either remove and self-host the typeface, or add it to PROCESSORS.md and Datenschutz §5.1 (Adobe is a US transfer; SCCs needed) | M |
| 3 | O3-T3 | **Self-host or remove GSAP CDN** — either pin to a self-hosted copy under `public/rexity-omi/assets/vendor/` or accept the CDN dependency with SRI | M |
| 4 | O3-T4 | Add fallback for iframe load failure: show a static "loading" or skeleton in the proxy region; hide cleanly if GSAP unavailable | S |
| 5 | O3-T5 | Pre-paint guard for the scroll-proxy: replace fixed-tick `setInterval` settling with `ResizeObserver(iframe.contentDocument.body)` → trigger remeasure on actual DOM change | S |
| 6 | O3-T6 | Optimize `index.html` — even modest minification of the 9.9 MB single-line file (extract inline `<style>` blocks to CSS files; lift large inline base64 images to actual files) — target 30 % size reduction | L |
| 7 | O3-T7 | Add CSP header via `vercel.json`: `script-src 'self' 'unsafe-inline' https://gsap.com https://cdn.tailwindcss.com; img-src 'self' data:; …` (will need tuning) | M |
| 8 | O3-T8 | Add `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` via `vercel.json` | XS |
| 9 | O3-T9 | Add `Referrer-Policy: strict-origin-when-cross-origin` | XS |
| 10 | O3-T10 | Add `Permissions-Policy: camera=(), microphone=(), geolocation=()` (Rexity doesn't need any) | XS |
| 11 | O3-T11 | Add `X-Content-Type-Options: nosniff` | XS |
| 12 | O3-T12 | Run Lighthouse audit before flip; target Performance ≥ 50, Best Practices ≥ 90, SEO ≥ 90 | M |
| 13 | O3-T13 | Run `axe-core` against rendered page; capture and address top 10 WCAG findings | M |

**O3 acceptance:** 3rd-party network calls only to disclosed processors; CSP shipped; perf budget hit; Lighthouse + axe targets met.

### Phase O4 — Pre-flip review

| # | ID | Task | Owner |
|---|---|---|---|
| 1 | O4-T1 | Run O0..O3 acceptance checks end-to-end | Eng |
| 2 | O4-T2 | Take screenshots of every section + send to Kaupat with note "Same lawyer review as rexity.ai applies. New surface: AI workspace page." | You + Kaupat |
| 3 | O4-T3 | Confirm `noindex` still set so this preview doesn't leak | Eng |
| 4 | O4-T4 | Confirm cookie banner + footer legal links work on the Omi page | Eng |
| 5 | O4-T5 | Confirm `app/page.tsx` redirect is still pointing at the OLD page (don't flip yet) | Eng |
| 6 | O4-T6 | Get Kaupat's written sign-off on the rewritten content | Kaupat |
| 7 | O4-T7 | Get specialist sign-off on any *new* AI-services language in the rewritten copy that goes beyond what's in `/agb` | Specialist |
| 8 | O4-T8 | Run `npm run build` end-to-end; assert zero workspace-it / luxury-fire-pit / yoast references in build output | Eng |
| 9 | O4-T9 | Smoke-test mobile (iPhone Safari, Android Chrome) — iframe sticky scroll is notoriously buggy on iOS | Eng |
| 10 | O4-T10 | Test with `prefers-reduced-motion: reduce` — ScrollSmoother / GSAP should respect | Eng |

**O4 acceptance:** lawyer signed off; build clean; mobile/reduced-motion verified; redirect untouched.

### Phase O5 — Flip + monitor (D-day)

| # | ID | Task |
|---|---|---|
| 1 | O5-T1 | Single-line change in `app/page.tsx`: `redirect("/rexity-altrum-rebrand/index.html")` → `redirect("/rexity-omi/index.html")` |
| 2 | O5-T2 | Push to `main`, watch Vercel deploy |
| 3 | O5-T3 | Smoke test prod URL within 5 min of go-live |
| 4 | O5-T4 | If the noindex banner is still appropriate (lawyer not fully done), keep it on; otherwise drop |
| 5 | O5-T5 | Monitor Vercel logs + error tracking for 24h after flip |
| 6 | O5-T6 | Rollback procedure documented: revert the one line, redeploy; <60 s to recover |

---

## 3. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Workspace IT discovers the page through their domain logs and Abmahnt for plagiarism | M | H | O0 strips all WSIT references; lawyer review confirms our rewrite is original |
| R2 | Customer (Zertus / Premier Foods / Zellis) sees their name on our site and reports | M | H | O1-T6 removes all real customer names; only our own approved apps appear |
| R3 | Mobile Safari breaks iframe sticky scroll → page appears blank | H | M | O4-T9 mobile test + O3-T4 fallback |
| R4 | GSAP CDN goes down → animations don't fire | L | M | O3-T3 self-host; O3-T4 fallback UI |
| R5 | LG München 2022 ruling — Google Fonts loaded externally → Abmahn-vector | M | M | O3-T1 self-host fonts |
| R6 | Adobe Typekit IP transfer to US not disclosed → DSGVO complaint | M | M | O3-T2 decision (remove or disclose) |
| R7 | The 9.9 MB parent HTML kills first-paint on 3G → BFSG failure / SEO penalty | M | M | O3-T6 size reduction |
| R8 | Flip to prod before lawyer signoff → marketing live with unreviewed AGB-AI clauses | L | H | O4-T6 hard gate; O5-T1 last step |
| R9 | "Review underway" banner contains German that visitors can't read on a global page | L | L | O0-T8 DE/EN toggle |
| R10 | Cookie banner conflicts with iframe scroll proxy (z-index war) | M | L | O2-T3 z-index audit |

---

## 4. Definition of Done — Sprint O

### Hard requirements (no flip without these)
- [ ] All O0 items shipped (no Workspace IT / theluxuryfirepitco / Yoast / Zertus / Premier Foods / Zellis / "Studio" / "All Templates" references in source)
- [ ] All O1 items shipped (every visible text is Rexity copy)
- [ ] All O2 items shipped (legal footer, cookie notice, robots noindex, security.txt)
- [ ] O3-T1, O3-T2, O3-T3 decided and shipped (font + GSAP transparency)
- [ ] O3-T7..T11 security headers in `vercel.json`
- [ ] Lighthouse: Best Practices ≥ 90, SEO ≥ 90, Performance ≥ 50
- [ ] axe-core: zero serious/critical violations
- [ ] Kaupat sign-off on rewritten content (O4-T6)
- [ ] Mobile Safari + Chrome smoke test passed
- [ ] noindex still set until lawyer drops the requirement
- [ ] `npm run build` passes; no broken refs

### Soft requirements (do before marketing channels open)
- [ ] O3-T6 size reduction shipped
- [ ] O3-T13 axe top-10 closed
- [ ] PROCESSORS.md reflects every 3rd-party dep
- [ ] Datenschutz §5.1 updated to mention any new dep we kept

### Track but don't gate
- [ ] Replicate same package on asogrove / levelkraft / clevr (separate sprint per `LEGAL_PAGES_SPRINT.md` L0-T7)
- [ ] Customer-facing AVV template ready (`LEGAL_PAGES_SPRINT.md` L4-T13)

---

## 5. Recommended execution order

This avoids merge conflicts and lets you ship value incrementally:

1. **O0** in one PR — 11 small edits, mechanical sweep. Can land in 2 hours. Closes the bleeding.
2. **O1** in one PR — bigger content rewrite. Best done as a single editorial pass, ~half a day. Ship behind `noindex`, so even if unfinished it's not externally visible.
3. **O2** in one PR — legal footer + cookie notice. Cleanly bolted onto the parent shell. ~3 hours.
4. **O3** split into sub-PRs:
   - O3-T1/T2/T3 (font + GSAP decision) — needs your decision before code
   - O3-T7..T11 (security headers) — small `vercel.json` change
   - O3-T4/T5 (scroll proxy hardening) — focused refactor
   - O3-T6 (size reduction) — separate effort, biggest engineering risk
   - O3-T12/T13 (audits) — runs after everything else
5. **O4** runs in parallel with O3 (review + mobile test + lawyer)
6. **O5** is the one-line flip when O0..O4 are all green

---

## 6. Open decisions I need from you

| Decision | Options | Recommendation |
|---|---|---|
| Adobe Typekit | (a) Remove + self-host (b) Keep + disclose | (a) Remove — cleaner DSGVO posture |
| GSAP loading | (a) Self-host (b) Keep CDN with SRI hash | (a) Self-host — predictable + offline-able |
| Footer copyright line | "© 2026 Rexity Labs UG (haftungsbeschränkt) i. Gr." vs. "© 2026 Rexity" | Full legal name on legal-pages, brand on hero/header |
| Banner DE-only or DE+EN | The brief reads more English-y for this page | DE+EN toggle, matching prod |
| Case-study section | Hide / Replace with our apps / Keep but anonymize | Replace with CLEVR + LevelKraft + asogrove (real ones we own) |
| Testimonials | Hide / Keep as "coming soon" / Use placeholder quotes | Hide section entirely until we have real written-permission quotes |

_All decisions can be deferred until O1-T1 (content rewrite), but blocking decisions for O3-T1 and O3-T2 should be answered before O3 starts._
