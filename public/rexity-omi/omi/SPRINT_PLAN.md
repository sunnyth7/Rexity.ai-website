# Rexity "Omi" Page — Orchestrated Sprint Plan

**Goal:** Build a new Rexity landing page = **Rexity top** (header + hero video + chatbot) ⊕ **Workspace IT body** (everything below their hero → footer-CTA), reskinned to Rexity brand, in its own folder, with a **one-line prod switch**.

**Approach:** Static HTML splice (keeps Workspace IT's GSAP scroll choreography → true 1:1), NOT a React rebuild.

---

## Repo layout & serving model

- **Working folder (separate, isolated):** `public/rexity-omi/`
- **Current prod:** `public/rexity-altrum-rebrand/index.html`, served because `app/page.tsx` does `redirect("/rexity-altrum-rebrand/index.html")`.
- **Prod switch (S6):** change that one redirect line to `/rexity-omi/index.html`. Fully revertable.
- **Local dev:** `npm run dev` → http://localhost:3000/rexity-omi/index.html (already running).
- **Vercel:** project `rexity-ai-website-um2g`, root dir `.`. Static files under `public/` ship as-is.

## Source files

| Role | Path |
|---|---|
| Rexity prod clone (orchestrator owns; DO NOT let subagents edit) | `public/rexity-omi/index.html` (12.86 MB, Webflow export, single minified line) |
| Workspace IT source (read-only reference) | `/Users/sunnythakur/Downloads/Workspace IT - Managed IT Services.html` (13 MB, WordPress single-file save) |

## Key anchors (investigated)

**Rexity `index.html`:**
- Hero `<video class="bg-video rexity-hero-video">` @ char ~2,497,931.
- **KEEP zone:** `<body>` → end of hero section (header, hero video, chatbot/intro).
- **CUT zone start:** `<section class="section-about">` @ ~4,142,480 and `<section class="for-work-section">` @ ~4,624,423 onward — remove everything down to footer.
- **Rexity footer:** single `class="footer-grid"` block @ ~6,525,562 — **preserved and re-attached** after the grafted IT body.

**Rexity brand tokens (use these for reskin):**
```
--colors--fourth-color: #070707;   /* near-black */
--colors--first-color: white;
--font--primary-font: Inter, sans-serif;
--font--h1: 9rem; --font--h2: 3rem; --font--h3: 1.9rem; --font--h4: 1.4rem;
--font-weight--400/500/600; --line-height--page-line-height: 1.1;
--page-container--container-large: 1400px;
```

**Footer/nav links to CONSERVE (must keep working):**
`#about`, `#services`, `#work`, `#blog`, `#contact`,
`systems/design.html`, `systems/development.html`, `systems/automation.html`, `systems/scale.html`,
`#post/...` journal anchors, `mailto:hello@rexity.ai` (NOTE: current page has a bug rendering `nullhello@rexity.ai` — fix to clean `mailto:hello@rexity.ai`).

**Workspace IT body (to graft), section order:**
Services grid (End-User Device Mgmt, Application Mgmt, Digital Employee Experience, Digital Workspaces, System Health Checks, Vulnerability Mgmt) → "Results That Speak" stats → IT Expertise / Proactive Innovation / Inclusive Collaboration values → "The People Making IT Happen" team → Case Studies → "Who Are Our Customers?" (partner logos) → "Get Expert Advice" CTA → "Real Feedback From Real Clients" testimonials → "There When You Need Us" closing CTA.
- 20 `<section>` elements, body region ~char 4.8M → 12.77M.
- Animations: **GSAP + ScrollTrigger** (103 / 62 refs) — engine = motion.page. Must be re-initialized after splice.
- Assets: 176 inlined `data:` images already self-contained; ~15–20 genuine external assets under `https://workspace-it.com/wp-content/uploads/...` (.jpg/.png/.mp4) must be downloaded & localized. Page-nav URLs like `/about-workspace-it/`, `/feed/`, `/wp-json/...` are NOT assets — drop or neutralize them.

---

## Parallel decomposition (no file collisions)

Each agent owns a **different file**. None touch `index.html` — the orchestrator performs the splice last.

| Agent | Owns (only file it writes) | Mission |
|---|---|---|
| **K — Extractor/Localizer** | `public/rexity-omi/omi/it-body.html` (new) + `public/rexity-omi/assets/it/` (downloaded assets) | Extract the Workspace IT body, strip WordPress cruft, localize assets, emit a clean self-contained HTML partial. |
| **L — Reskin CSS** | `public/rexity-omi/omi/omi.css` | Bridge/override CSS mapping IT section classes → Rexity brand tokens so it looks like one site. |
| **M — Animation/Interaction JS** | `public/rexity-omi/omi/omi.js` | Load GSAP+ScrollTrigger from CDN and (re)initialize scroll animations + IT widgets (sliders/accordions/counters) for the grafted sections. |

### Orchestrator merge (after K/L/M done)
1. Cut `index.html` below hero, before `section-about`/`for-work-section`.
2. Inject K's `it-body.html` between hero and the preserved Rexity `footer-grid`.
3. Add `<link rel="stylesheet" href="omi/omi.css">` + `<script src="omi/omi.js" defer></script>` + GSAP CDN before `</body>`.
4. Restore footer with conserved links; fix `mailto:hello@rexity.ai`.
5. Quality pass (no broken refs, no external workspace-it.com calls, no JS errors), local deploy verify, screenshots.

---

## Definition of Done
- `localhost:3000/rexity-omi/index.html` renders: Rexity header+hero+chatbot, then full IT body, then Rexity footer.
- Zero requests to `workspace-it.com` (network tab clean).
- GSAP scroll animations fire on IT sections.
- All conserved footer links resolve.
- `next build` passes. Prod switch = 1 line in `app/page.tsx`.
