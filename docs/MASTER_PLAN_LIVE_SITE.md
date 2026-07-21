# Master Plan — Live Site, SEO Recovery & Repo Cleanup

Created: 2026-07-21 · Owner: Sunny · Repo: https://github.com/sunnyth7/Rexity.ai-website

## Current state (audited, not guessed)

**Two sites, two branches — they have diverged:**

| Branch | What it is | Deploys |
|---|---|---|
| `origin/main` | **Production rexity.ai** — a **STATIC site** (corrected 2026-07-21): Cobalt-themed `index.html` at repo root + static route dirs (/automation, /marketing, /services, /rexity-omi, portfolio) + legal pages + `api/{chat,lead,book}.js` serverless functions (DeepSeek chatbot with pre-chat info/lead layer, Supabase persistence). Vercel project `um2g`, deploys on push to main. **This is the newest work overall** — it superseded the Next.js lineage AND the wip snapshot (388 files in rexity-omi/ incl. omi-booking, card-hotspots, loader-fast, service-links). | ✅ Live at www.rexity.ai |
| `rexity-v3-website-video-theme-base` | The older **Next.js lineage** (Omi page dev history, scroll-proxy, Sprint O). Superseded by main's static evolution; kept for history + this plan doc. Checkpoints: `8fd62ee` (good), `6cecb35` (WIP-restored). | Local only |
| `wip/sprint-o-snapshot-2026-07-21` | Preservation snapshot of 109 uncommitted files. rexity-omi subset restored to v3 branch; app-level Next WIP (prisma, RPA/RAG libs, admin APIs) parked here. | Never |
| `rexity-retheme` | Retheme experiments — reverted on main, superseded by Cobalt. Historical, kept on remote. | Never |

**Local serving:** `.claude/launch.json` config `rexity-main` serves a worktree of `main` statically (scratchpad `main-live`). Note: `api/*.js` functions don't run under static serve — chatbot send needs `vercel dev` or prod.

> ⚠️ **B2 correction:** prod is static — canonicals/`lang="de"`/metadata fixes go into the **static HTML `<head>`s** (index.html + 23 route pages), NOT Next.js `generateMetadata`. The 307→308 domain fix (B1, Vercel dashboard) is unchanged.

**SEO status (Phase 1 diagnosis, 2026-07-21):** only ~1/24 pages indexed; Google cache is stale (pre-rebrand title). Root causes: 307 (temporary) apex→www redirect, missing canonicals, CSR-only metadata on subpages, no `<html lang>`. robots.txt + sitemap are healthy. Full findings: see report in session / summary below.

**Working tree:** 113 uncommitted files on the Omi branch — mix of legitimate WIP (legal-page rewrites + CSP scoping in next.config.mjs, security.txt, contact API, prisma, docs/, app/api/admin, app/api/webhooks) and junk (.DS_Store, stray folders). NOT pure damage; needs triage, not bulk revert.

---

## Workstream A — Repo cleanup & stabilization (do first, ½ day)

**Goal:** every branch clean, every intentional change committed, junk gone, damage identified against known-good anchors.

- A1. Inventory the 113 uncommitted files into three buckets: **keep** (commit with messages per feature: legal pages, CSP, security.txt, contact API, docs), **junk** (delete: .DS_Store, `Rexity V3 Website/business-card/`, `app/macbook-m5/` if unused), **unknown** (diff against `8fd62ee`/`92f93fd` and against prod behavior; decide).
- A2. Verify Sprint O commits (`381f78d`…`92f93fd`) render correctly on local deploy — they are the suspected "blow-up"; test before trusting. If broken → fix forward or branch from `8fd62ee`.
- A3. Add `.gitignore` entries: `.DS_Store`, scratch dirs.
- A4. Commit in small scoped commits; push. Tag checkpoints: `omi-good-v1` = `8fd62ee`, `omi-sprint-o` = `92f93fd` (or its fixed successor).
- **Exit criteria:** `git status` clean on the Omi branch; local deploy verified working; tags pushed.

## Workstream B — SEO recovery on production `main` (the live-site fix, 1 day + monitoring)

**Goal:** all 24 pages eligible + submitted; Google re-crawls the rebranded site.

- B1. **Domain redirect 307→308** (highest impact): Vercel dashboard → project `um2g` → Domains → `www.rexity.ai` primary, `rexity.ai` → 308 permanent. Verify: `curl -sI https://rexity.ai/` shows `308`.
- B2. **SSR metadata + canonicals** on `main`: Next.js `generateMetadata` for every route; self-referencing canonical `https://www.rexity.ai/<path>` built from one config constant; real `<title>`/description in initial HTML (raw `curl` must show them, not just rendered DOM).
- B3. **`<html lang="de">`** in root layout. Decide DE/EN strategy: if EN toggle stays on same URLs, add `hreflang` alternates later; do not block on this.
- B4. Trim homepage description ≤155 chars; title ≤60.
- B5. Deploy → **live curl verification** of every fix (status codes, canonicals in HTML, sitemap still 200/all-www).
- B6. **Submission:** GSC — resubmit sitemap + Request Indexing for top ~10 URLs (manual, ~10/day cap). Bing — "Import from GSC". **IndexNow** — key file in `public/`, bulk-submit all 24 URLs (covers Bing/DDG/AI search; Google ignores it).
- B7. **Monitoring:** weekly cron — curl priority URLs, sitemap loc count, `site:rexity.ai` count, IndexNow re-submit, one-line report. Baseline recorded today: **1 indexed / 24**.
- **Exit criteria:** all fixes verified live by curl; GSC sitemap accepted; IndexNow 200/202 receipt; monitor running. (Indexing itself: expect movement in 2–6 weeks — that's Google, not us.)

## Workstream C — Omi page: finish & decide its role (½–1 day + a decision)

**Goal:** Omi page polished and its go-live path explicit.

- C1. Fix the **preloader** (words too fast/clipped): disable it (recommended) or timeScale it down.
- C2. Fix **iframe button clickability** (pointer-events:none side effect of scroll-proxy) — selective pointer-events re-enable.
- C3. Optional polish: smooth sidebar slide (GSAP), remaining workspace-it.com font/nav-link refs cleanup.
- C4. **DECISION (Sunny):** what does Omi become?
  - (a) A **new landing page on prod** (e.g. `/omi` or replacing `/` on main) — then it must be MERGED into main carefully (main has diverged; the one-line redirect flip only works on the old branch),
  - (b) A **separate preview/subdomain** (e.g. omi.rexity.ai from its branch),
  - (c) Parked as internal prototype.
  - ⚠️ Note: replacing prod's German homepage with the English Omi page would fight Workstream B (Google is being asked to index the German site). Recommend (a)-as-`/omi`-route or (b) until SEO recovery lands.
- **Exit criteria:** loader + clickability fixed and verified; decision recorded here; if (a)/(b): deployed and smoke-tested.

## Sequencing

1. **A** (clean base) → 2. **B1** immediately after (pure Vercel config, independent of code) → 3. **B2–B7** on main → 4. **C** in parallel with B's monitoring window.
Nothing in C blocks B. B is the revenue-relevant path ("live site that gets found").

## Verification discipline (applies to every workstream)

- No claim of "done" without live evidence: curl output for SEO, browser/DOM checks for Omi, `git status` clean for cleanup.
- Every fix lands as a scoped commit on the right branch; prod changes only via `main`.
- Before/after metric for the client story: indexed pages (baseline 1/24, target 20+/24), GSC impressions.

## Decision log

| Date | Decision | By |
|---|---|---|
| 2026-07-21 | Plan created; A→B→C sequencing agreed | — |
| 2026-07-21 | **Constraint: keep the current deployed German "Rexity Labs" site as THE live site.** | Sunny |
| 2026-07-21 | **C4 = Omi as a `/omi` route on prod, `noindex`.** Never replaces `/`; showcase only; won't compete for SEO. | Sunny (delegated) |
| 2026-07-21 | **B3 = German-only canonical for now.** `lang="de"`, German canonicals, defer `/en/` hreflang split until indexing recovers. | Sunny (delegated) |
