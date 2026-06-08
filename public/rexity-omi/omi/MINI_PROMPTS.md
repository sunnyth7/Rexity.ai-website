# Mini-Prompts — Agents K, L, M

All agents: read `public/rexity-omi/omi/SPRINT_PLAN.md` first for full context.
Repo root: `/Users/sunnythakur/Desktop/Rexity.ai-website`.
**Hard rule:** only write to YOUR assigned file(s). Never touch `index.html`. Work is parallel; collisions = failure.

---

## Agent K — Extractor / Localizer
**Writes:** `public/rexity-omi/omi/it-body.html` (new) + `public/rexity-omi/assets/it/` (downloaded assets).

1. Read the Workspace IT source `/Users/sunnythakur/Downloads/Workspace IT - Managed IT Services.html`.
2. Extract the **body sections only**: from the first section AFTER the hero (Services grid) through the closing "There When You Need Us" CTA — i.e. the 20 `<section>` blocks in the body region (~char 4.8M–12.77M). Exclude: `<head>`, hero, WordPress `<footer>`, admin bar, cookie banners, `wp-json`/feed/oembed `<link>`s, analytics/gtag scripts.
3. **Strip WordPress cruft:** remove `wpadminbar`, `wp-emoji`, comment forms, `xmlrpc`, RSS, and inline WP block-library style noise that isn't needed for layout.
4. **Localize assets:** find every `https://workspace-it.com/wp-content/uploads/...` image/video, download into `public/rexity-omi/assets/it/` (keep filenames), and rewrite refs to relative `assets/it/<file>`. Inlined `data:` images stay as-is. Page-nav links (`/about-workspace-it/`, `/contact-workspace-it/`, etc.) → replace `href` with `#` (placeholder) so nothing calls the live site.
5. Output `it-body.html` as a clean HTML fragment (no `<html>/<head>/<body>` wrapper) — just the sequence of `<section>`s. Keep all original class names and `data-*` attributes intact (Agent M needs them for GSAP).
6. At the top of the file add an HTML comment listing the sections in order and the assets you downloaded.

Verify: `grep -c 'workspace-it.com' it-body.html` returns 0 (except inside harmless text). Report the asset count and any download failures.

---

## Agent L — Reskin CSS
**Writes:** `public/rexity-omi/omi/omi.css` (overwrite the scaffold).

1. Read SPRINT_PLAN.md brand tokens. Goal: make the grafted Workspace IT sections look like they belong to Rexity (dark, Inter, generous spacing) — a **bridge stylesheet** that overrides the IT classes, scoped under a wrapper class `.omi-it` (the orchestrator will wrap the grafted body in `<div class="omi-it">`).
2. Map: backgrounds → `#070707` / white per Rexity; body font → `Inter, sans-serif`; headings → Rexity h1–h6 scale; buttons → Rexity button style (white text, rounded as Rexity uses); container max-width `1400px`; section vertical rhythm consistent with Rexity.
3. Neutralize Workspace IT brand colors (their blues/teals) → Rexity palette. Keep layout/grid from the IT markup; only restyle color, type, spacing, button/card chrome.
4. Make it responsive (mobile ≤ 768px): stack grids, scale type down.
5. Use only `.omi-it`-scoped selectors so nothing leaks into the Rexity header/hero/footer. Add brief section comments.

You may peek at the IT source for class names but do NOT edit it. Reference IT classes: `.omi-it .<their-class> { ... }`.

---

## Agent M — Animation / Interaction JS
**Writes:** `public/rexity-omi/omi/omi.js` (overwrite the scaffold).

1. Read SPRINT_PLAN.md. The grafted IT sections rely on **GSAP + ScrollTrigger** (motion.page output). Produce a self-contained script that:
   - Loads GSAP 3.x + ScrollTrigger from CDN (`cdn.jsdelivr.net/npm/gsap@3`) if `window.gsap` is absent.
   - On `DOMContentLoaded`, initializes reveal-on-scroll animations for elements within `.omi-it` (fade/slide-up for sections, headings, cards, stats) using ScrollTrigger — approximating the original motion.page choreography (staggered entrances, parallax where present).
   - Implements any interactive widgets the IT body needs: number **counters** (the "Results That Speak" stats, e.g. 10257), **testimonial slider/carousel**, **accordion/tabs** if present, **case-study** hover states. Inspect the IT source for the relevant class names / `data-*` hooks.
2. Scope all selectors under `.omi-it` so Rexity's own Webflow JS is untouched. Guard against double-init.
3. Fail gracefully if GSAP CDN is blocked (content still visible — no `opacity:0` left stuck; use a `.no-anim` fallback or set final state on load error).
4. Add a short header comment describing what it initializes.

Inspect (read-only) the IT source for class names; do NOT edit it.

---

## Orchestrator (me) — after K, L, M
Splice index.html, inject `<div class="omi-it">…it-body…</div>`, wire css/js + GSAP CDN, restore Rexity footer + conserved links, fix mailto, QA, local deploy, screenshots, then prep S6 prod switch.
