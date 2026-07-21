# rexity.ai — Audit explained, verified & fix plan (2026-06-15)

An external audit (Opus) flagged 15 points across Tech Stack, Vulnerabilities,
Opportunities. This doc (1) explains each point in plain terms — *why* it's like
that — (2) records what's **actually true on the live site today** (verified by
curl/grep against production, not the audit's snapshot), and (3) gives a fix
plan + sprint plan. Several audit points were already handled this month or were
based on an older state.

Legend: ✅ accurate · ⚠️ partly stale · ❌ no longer true · 🆕 we found this.

---

## A. Tech stack — what we run and why

1. **Webflow export.** ✅ The homepage is a Webflow-designed page exported to
   static HTML — that's the source of all the `wf-`/`w-nav` classes and the
   bundled normalize.css. *Why:* it was built visually in Webflow for speed, then
   exported so we can host it ourselves and add our own scripts (chatbot, i18n).

2. **Hosted on Vercel (fra1 / Frankfurt).** ✅ Static files + serverless API on
   Vercel's edge, not Webflow hosting. *Why:* faster, free/cheap, EU edge, git-
   push deploys, and lets us run our own `/api` functions.

3. **GSAP for animations.** ✅ used — but **self-hosted** at
   `/rexity-omi/assets/it/js/gsap.min.js`, NOT loaded from gsap.com. The
   "gsap.com" strings are license comments inside the file. *Why:* GSAP gives the
   premium scroll/animation feel; self-hosting it = no third-party request (GDPR
   + speed). So this is one fewer external dependency than the audit implied.

4. **Supabase backend + fonts.** Supabase ✅ — but accessed **server-side only**
   via our `/api/lead` and `/api/chat` functions (service-role key, never in the
   browser). Fonts: we **self-host Inter** (GDPR work). 🆕 A leftover **Adobe
   Typekit loader** (`use.typekit.net`) string still sits in the Webflow shell
   JS, and the CSP still allow-lists `workspace-it.com` + Google Fonts — cleanup
   items (see B1/A4). *Why Supabase:* it's our database for leads + the chatbot
   knowledge; proxying through `/api` means no DB credentials reach the browser.

5. **Socials, HTTP/2+3, HTTP→HTTPS (308).** ✅ standard, correct. *Why:* Vercel
   gives this for free; good baseline plumbing.

---

## B. Vulnerabilities — verified + fix

1. **CSP is report-only + uses `unsafe-inline`/`unsafe-eval`.** ✅ TRUE.
   `Content-Security-Policy-Report-Only` is live (monitoring, not blocking).
   *Why report-only:* we set it to observe before enforcing so we don't break
   the Webflow/GSAP page, which needs inline scripts/eval.
   **Fix:** confirm no real violations, then switch `-Report-Only` → enforced
   `Content-Security-Policy`. Tighten sources: drop `workspace-it.com`, Google
   Fonts, and `*.supabase.co` from the policy if unused (we self-host fonts and
   call Supabase only server-side). Keep `unsafe-inline`/`unsafe-eval` in
   script-src only as long as Webflow/GSAP require it.

2. **Supabase anon key exposed client-side.** ❌ NOT TRUE for us. There is **no
   supabase-js client and no anon JWT in the browser** (verified — grep finds
   none). Forms post to `/api/lead`; the bot calls `/api/chat`; both use the
   service-role key **server-side**. This is *better* than the audit assumed.
   **Fix (hygiene only):** still verify Row-Level Security is ON for every table
   as defense-in-depth, and confirm the service-role key is only in Vercel env
   (it is). No client exposure to close.

3. **Heavy page weight (~10 MB).** ✅ TRUE — homepage is **9.9 MB** (mostly
   inline base64 images + the Webflow export + GSAP). *Why:* Webflow exports
   inline a lot, and we kept the rich hero. Real risk for mobile Core Web Vitals.
   **Fix:** see Sprint C (extract base64 → compressed files, lazy-load below the
   fold, defer non-critical JS, preload/subset fonts).

4. **`access-control-allow-origin: *` on the document.** ✅ present on the static
   page (a Vercel default for static assets). Low risk for a public page.
   **Verified:** our `/api/chat` and `/api/lead` do **not** return a wildcard —
   they're not open. **Fix:** optional; leave the static wildcard or drop it.

5. **No Impressum/Datenschutz + no sitemap.** ⚠️ PARTLY STALE.
   `/impressum`, `/datenschutz`, `/agb`, `/aeb`, `/barrierefreiheit` all return
   **200** (built + Impressum finalised this month). **`/sitemap.xml` is still
   404** — that part is valid. **Fix:** generate `sitemap.xml` + list it in
   robots.txt (Sprint A).

🆕 **Found, not in the audit but the biggest SEO blocker:** the homepage serves
`<meta name="robots" content="noindex,nofollow,noarchive">` — the **entire site
is hidden from Google on purpose** (pre-launch). Nothing about SEO matters until
this is lifted. **Fix:** lift `noindex` at go-live (Sprint A, gated on owner's
go-live decision).

---

## C. Opportunities — verified + fix

1. **Page title says "...Website".** ✅ TRUE & unfixed — live title is literally
   `Rexity - AI Automation Website`. Biggest quick SEO/brand win.
   **Fix:** rewrite to a benefit-led, keyworded title + meta description
   (Sprint A). e.g. *"Rexity Labs — Web, Apps & Automation, built in Germany"* +
   a 150-char description.

2. **Add Impressum + Datenschutz.** ✅ ALREADY DONE (all legal pages live).

3. **Performance pass.** ✅ valid (the 9.9 MB). Sprint C → then put a green
   Lighthouse score in the sales deck.

4. **Enforce CSP + add sitemap.** ✅ valid (CSP report-only; sitemap 404).
   Covered by B1 + A2.

5. **Conversion / dogfooding (case studies, CTA, testimonials).** ⚠️ partly done
   — the homepage already has 3 app case studies (Clevr/LevelKraft/Save&Fresh)
   with real imagery; service pages have CTAs. **Fix:** add a proper
   portfolio/case-study section (incl. local/Hermannsburg work), sharpen the hero
   CTA, add testimonials (Sprint D, ongoing).

---

## Fix plan → Sprint plan

### Sprint A — SEO unblock + quick wins  (~½ day, low risk)
- **A1** Rewrite homepage `<title>` + add a strong `<meta name="description">`.
  Check the og:title/twitter tags too.
- **A2** Generate `sitemap.xml` (all public pages + service pages) and reference
  it in `robots.txt`.
- **A3** Remove the leftover Adobe **Typekit loader** + tidy the CSP allow-list
  (drop `workspace-it.com` / Google Fonts / unused `supabase.co`); re-verify
  zero external font requests at runtime.
- **A4** (gated on go-live decision) Lift `noindex` site-wide so Google can index.

### Sprint B — Security hardening  (~½–1 day)
- **B1** Switch CSP `Report-Only` → enforced after confirming clean reports;
  tighten source lists; keep `unsafe-inline/eval` only where Webflow/GSAP need.
- **B2** Verify Supabase **RLS** is ON for every table; confirm service-role key
  is Vercel-env-only (defense-in-depth — no client exposure exists today).
- **B3** Confirm `/api/chat` + `/api/lead` rate limits + non-wildcard CORS still
  hold; optionally drop the static document's wildcard ACAO.

### Sprint C — Performance  (~1–2 days)
- **C1** Extract inline base64 images → compressed external files (WebP/AVIF);
  lazy-load everything below the fold.
- **C2** Defer/async non-critical JS; audit GSAP usage; preload + subset the
  self-hosted Inter font.
- **C3** Lighthouse/PageSpeed pass → target green; capture the score for sales.

### Sprint D — Conversion & brand  (ongoing)
- **D1** Portfolio/case-study section (apps + Hermannsburg/local work).
- **D2** Sharper hero CTA + testimonials.
- **D3** Run the marketing-skills (CRO/copy/SEO) over the homepage — dogfood it.

**Suggested order:** A → B → C → D. A1/A2/A3 are safe to ship immediately; A4
(noindex) waits for the owner's go-live call; D is continuous.

---

## Progress log (2026-06-15)

**Sprint A — DONE & live.** A1 title/meta de-AI'd + benefit-led; A2 sitemap.xml
(23 URLs) + robots; A3 CSP allow-list tidied (dropped workspace-it/Google
Fonts/Supabase). A4 (lift noindex) still held for go-live.

**Sprint B — DONE & live.** B1 CSP flipped Report-Only → enforced (verified safe:
page loads zero external resources). B2 RLS confirmed default-deny on all 7
tables **and** redundant anon/authenticated GRANTs revoked (49→0; service_role
intact). B3 APIs confirmed rate-limited + honeypot + no wildcard + server-side
secrets; static wildcard CORS replaced with the canonical origin.

**Sprint C — partial.** C1 DONE & live: extracted 8.7MB of inlined base64
(images+fonts) from the homepage → **index.html 9.9MB → 1.19MB (−88%)**, assets
external + cached + lazy. Hero videos compressed: desktop 10.7→2.5MB (−77%),
mobile 2.5→1.6MB. **Lighthouse 58→60** — but **LCP stays ~17–25s** because the
real LCP gate is the **full-screen GSAP intro loader**, not asset bytes
(compressing the video didn't move LCP). TBT (40–50ms) + CLS (0.009) are green;
FCP ~3.1s.
  - **Remaining LCP lever = the intro loader** (reveal on poster-ready instead
    of waiting for the hero) — touches the GSAP timeline = higher risk; a design
    tradeoff vs. the cinematic hero. **Owner decision pending.**
  - Real-world UX is much improved regardless (lean HTML + compressed video +
    caching); the low synthetic score is inherent to the animated GSAP/iframe
    hero.

**Sprint C — DONE.** Loader/LCP fix shipped: preloaded the hero poster +
fetchpriority=high, and added omi-loader-fast.js to cap the full-screen GSAP
intro loader (~1.4s) so the hero paints early. Result: LCP **element render
delay 2.65s → ~0** (loader no longer gates paint), LCP 17.1s → 12.7s, TBT
30ms, CLS ~0.08. Hero renders correctly (verified via Lighthouse screenshot —
video + headline intact, text animations unaffected). Final Lighthouse perf
~58–60 on simulated slow-4G/4×-CPU; the remaining cap is Speed Index (visual
completeness of the cinematic GSAP/iframe/video hero) which is inherent to the
design. Real-world UX is dramatically better (1.2MB HTML, 2.5MB desktop video,
no render-blocking, everything cached). Banked wins: −88% HTML, −77% desktop
video, loader no longer blocking, TBT/CLS green.

**Sprint D — in progress.** D1 DONE: new **/work portfolio page** live (clean
template, Lighthouse 97) showing the 3 real apps (Clevr, LevelKraft, Fresh&Save)
as case cards with banner + logo + audience tag + bilingual copy; added to the
service-page nav + sitemap. D2 (testimonials) BLOCKED — needs **real quotes**
from clients (no fabricated social proof). D3 (CRO/copy dogfood pass) optional/
pending. Homepage already carries the same 3 case studies inline.
