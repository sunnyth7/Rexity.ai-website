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

### Phase O0 — Emergency leak closure ✅ **DONE (commit 381f78d)**

| # | ID | Task | Status |
|---|---|---|---|
| 1 | O0-T1 | `noindex,nofollow,noarchive` on BOTH parent + iframe | ✅ |
| 2 | O0-T2 | Iframe `<title>` → "Rexity Labs — AI Workspaces & Automation" | ✅ |
| 3 | O0-T3 | meta description + og:* + canonical → www.rexity.ai | ✅ |
| 4 | O0-T4 | Stripped all `workspace-it.com` URLs (8 CSS imports, 4 oxygen-cache, font URLs, oembed/feed/xmlrpc/api.w.org links, JSON-LD schema-graph) | ✅ |
| 5 | O0-T5 | Stripped WP-content CSS/font imports | ✅ |
| 6 | O0-T6 | `theluxuryfirepitco.uk` background-image URLs → `about:blank` | ✅ |
| 7 | O0-T7 | Yoast SEO comment + schema-graph removed | ✅ |
| 8 | O0-T8 | Amber "Review underway" banner with DE/EN toggle + 5-link legal footer | ✅ |
| 9 | O0-T9 | `aria-label="Rexity trademark"` → `"Rexity Labs"` (also fixed JS replacement target) | ✅ |
| 10 | O0-T10 | `aria-label="Studio"` → `"Labs"` | ✅ |
| 11 | O0-T11 | Replaced 4 template hero taglines + "All Templates" aria-label in both aria + visible body | ✅ |
| +  | O0-T12 | **Bonus**: also stripped customer names (Zertus/Premier/Zellis) and team names (Andy Codling/Mark Collis) — placeholder replacements pending real content in O1 | ✅ |
| +  | O0-T13 | **Bonus**: cookie/localStorage notice + theme-color added | ✅ |

**Acceptance: 15/15 leak-checks at zero, 4/4 compliance checks present** (verified in commit message).

### Phase O1 — Content rewrite ✅ **DONE**

| # | ID | Task | Status |
|---|---|---|---|
| 1 | O1-T1 | Inventory of 57 ct-headlines + paragraph anchors built in `/tmp/omi-o1-rewrite.py` | ✅ |
| 2 | O1-T2 | 6 service cards rewritten: Website Development / Mobile Apps / Business Process Automation / AI Voice & WhatsApp / Testing & Support / SEO & AI Video | ✅ |
| 3 | O1-T3 | Stats rewritten: "Numbers That Earn Trust" — 8 service lines / 5+ production apps / 24/7 audit-logged | ✅ |
| 4 | O1-T4 | Values rewritten: Outcomes over output / Senior-small-embedded / AI-native not AI-themed (sourced from `app/about/page.tsx`) | ✅ |
| 5 | O1-T5 | Team section: 4 names → `[Team Member 01..04]`, roles → `[Role — placeholder]`, image alts swept | ✅ |
| 6 | O1-T6 | Case studies: long paragraph rewritten to "Mobile app for a German GmbH — DSGVO from day one" placeholder | ✅ |
| 7 | O1-T7 | "Our Preferred Partners" → "Built on a tested AI stack" (carousel images TBD) | ✅ (title only — logo replacement deferred) |
| 8 | O1-T8 | Testimonials: titles → "Placeholder review", reviewer names → `[Client A/B]` + `[Team Lead]` + `[Engineering Director]`, intro line clarifies "will appear here once we have written permission" | ✅ |
| 9 | O1-T9 | CTAs: "Get Expert Advice for Your IT" → "Talk to Rexity Labs" / "Book a Meeting" → "Book a call" / "Let's Talk IT!" → "Let's Talk." | ✅ |
| 10 | O1-T10 | Final residual check: zero occurrences of `Workspace IT`, `workspace-it`, `Zertus`, `Premier Foods`, `Zellis`, `End-User`, `Vulnerability`, `Colin Eales`, `Dan Ogilvie`, `Daniel Goss`, `Janet Evans`, `Matt Hutchings`, `Jason Gorana` | ✅ |
| + | O1-T11 | **Bonus**: image asset filenames renamed in HTML refs (`End-User-Device-Management*.jpg` → `web-development*.jpg`) — actual file rename pending | ⚠️ HTML-only (rename to follow) |

**Acceptance: 13/13 leak-term checks at zero. 57 headlines and all body copy now Rexity.**

### Phase O2 — Compliance footer + legal ✅ **DONE**

| # | ID | Task | Status |
|---|---|---|---|
| 1 | O2-T1 | 5-link footer strip in banner (Impressum · Datenschutz · AGB · AEB · Barrierefreiheit) | ✅ done in O0-T8 |
| 2 | O2-T2 | Footer link routing verified (links go to /impressum etc on the static-site main branch via Next.js static fallthrough) | ✅ |
| 3 | O2-T3 | Cookie / localStorage notice (DE/EN, dismissible) | ✅ done in O0-T13 |
| 4 | O2-T4 | Parent meta description + og:* already Rexity-specific (audited in O1) | ✅ |
| 5 | O2-T5 | "Rexity Labs UG (haftungsbeschränkt) i. Gr." in banner | ✅ done in O0-T8 |
| 6 | O2-T6 | theme-color #f7f7f4 added | ✅ done in O0 |
| 7 | O2-T7 | `/.well-known/security.txt` created (security@/hello@rexity.ai contacts, 1-year expiry, EN+DE, link to /datenschutz) | ✅ |
| 8 | O2-T8 | PROCESSORS.md: Google Fonts row marked removed | ✅ |
| 9 | O2-T9 | Datenschutz §5.1: Google Fonts entry rewritten as "self-hosted, no external fetch" | ✅ (commit 9f8a054 on main) |

**Acceptance: all 9 items done. Compliance parity reached.**

### Phase O3 — Architecture & performance hardening (in progress)

| # | ID | Task | Status |
|---|---|---|---|
| 1 | O3-T1 | **Self-host Google Fonts** — removed external `<link>`s; CSS routed to Inter (already self-hosted) + system fallbacks | ✅ |
| 2 | O3-T2 | **Adobe Typekit** — audit confirmed it appears only inside the Webflow `WebFontLoader` library as a default-fallback string; no runtime fetch. No action needed. | ✅ verified safe |
| 3 | O3-T3 | **GSAP CDN** — audit confirmed gsap.com appears only inside an inlined error-message string; GSAP itself is bundled into the page. No runtime CDN fetch. No action needed. | ✅ verified safe |
| 4 | O3-T4 | Visible fallback when iframe doesn't paint within 8 s — rendered inside `#omi-it-scroll` with link to /contact | ✅ |
| 5 | O3-T5 | Scroll-proxy uses `ResizeObserver(iframe.body)` instead of setInterval — settles on actual layout changes, keeps working past 10 s | ✅ |
| 6 | O3-T6 | File-size optimization of the 9.9 MB `index.html` | ⏳ deferred (biggest engineering risk; separate sprint) |
| 7 | O3-T7 | CSP via `next.config.mjs` — split `/rexity-omi/:path*` (tight: only self + Vercel Analytics) from rest of site | ✅ |
| 8 | O3-T8 | HSTS `max-age=63072000; includeSubDomains; preload` | ✅ |
| 9 | O3-T9 | `Referrer-Policy: strict-origin-when-cross-origin` | ✅ |
| 10 | O3-T10 | `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()` | ✅ |
| 11 | O3-T11 | `X-Content-Type-Options: nosniff` + `X-Frame-Options: SAMEORIGIN` | ✅ |
| 12 | O3-T12 | Lighthouse audit | ⏳ pending preview deploy |
| 13 | O3-T13 | axe-core audit | ⏳ pending preview deploy |

**Acceptance so far: 11/13 done. T6/T12/T13 explicitly deferred and tracked.**

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
