# Rexity.ai Redesign Brief — "Sanjaya-structure × Praktika-light"

Branch: `redesign/sanjaya-light` (cut from prod `main` @ 1fe84c7) · Owner: Sunny · Orchestrator: Claude · Builder: Antigravity

## Goal
Rebuild the Rexity.ai landing experience as an ORIGINAL implementation:
- **Structure/composition inspired by** the Sanjaya AI-Agency layout (section rhythm only)
- **Color/mood inspired by** praktika.ai: light, warm, generous whitespace, playful-professional
- Rexity branding, copy, images and pages throughout. German-first, DE/EN.

## ⚖️ Hard guardrails (non-negotiable)
1. The reference file `~/Downloads/Sanjaya - AI Agency Framer Template.html` is **read-only inspiration
   for section structure**. Do NOT copy its HTML/CSS/JS/assets into this repo, do NOT commit the file,
   do NOT reproduce its copy, imagery, illustrations or exact visual styling. Original code only.
2. Same rule for praktika.ai: take the color *direction*, not their assets/illustrations/mascots.
3. Images: only our existing assets (`assets/`, `rexity-omi/assets/it/img/` — post-purge, all clean) or
   new free-license stock (Pexels/Unsplash, note source in commit).

## Section blueprint (adapted from Sanjaya's rhythm → Rexity content)
1. **Hero** — bold 3-word promise (style: "Clear. Precise. Automated." → ours e.g. "Verstehen. Bauen. Automatisieren.")
   + subline + CTA. Reserve a full-bleed media slot: Sunny is generating a hero video (Google Flow); until
   it lands use a light abstract poster.
2. **Problem** — "The hidden cost of manual work" angle, localized to German SMB reality.
3. **Case studies w/ metrics** — 2–3 cards, big numbers. Use REAL Rexity work only (clevr, Save&Fresh,
   LevelKraft — see `/work` route + `data/rexity-knowledge.json`). NO invented clients or metrics; if a
   metric isn't real, use qualitative outcomes.
4. **Process** — 3 steps (Understand → Design & Build → Optimize & Scale) — matches our existing copy.
5. **Services** — 4 cards: Web & Apps · AI Agents (Chat/WhatsApp/Voice) · Business Process Automation/RPA ·
   Testing & Support (+ Marketing as 5th if layout allows). Source copy from live site + knowledge json.
6. **Stats/impact band** — reuse the real "Numbers That Earn Trust" figures from current site.
7. **Testimonials** — ⚠️ we have NO approved client quotes yet. Build the component but ship it HIDDEN
   behind a flag until real quotes exist.
8. **Pricing** — SKIP tiered pricing (chatbot policy: no public prices). Replace with a "Let's scope it"
   CTA band → contact.
9. **Insights/blog teaser** — optional, only if cheap.
10. **Footer** — must contain: `© Rexity Labs UG (haftungsbeschränkt) · HRB 213911 · Amtsgericht Lüneburg`
    + links to /impressum, /datenschutz, /agb, /aeb, /barrierefreiheit.

## Design tokens (Praktika-inspired, Rexity-anchored)
- `--bg: #FAF8F4` (warm off-white) · `--bg-card: #FFFFFF` · `--ink: #10233F` (keep Rexity navy)
- `--accent: #1560BD` (Rexity cobalt — primary CTA) · `--accent-2: vivid teal ~#0FB5A6` (energy/highlights)
- Rounded-2xl cards, soft shadows, pill buttons, big friendly type (Inter or similar, self-hosted — NO
  Google Fonts CDN, strict CSP), generous section padding. Light theme ONLY.
- Motion: subtle (fade/slide on scroll, hover lifts). MUST fully resolve on mobile — this codebase has a
  history of desktop-tuned animations parking mid-state on phones. Test at 390px, every section.

## Tech + must-survive
- **Stack:** Next.js 15 App Router + Tailwind + Motion, TypeScript. Build in `next/` subfolder of this
  branch first (don't break the static root until switchover is decided).
- **Must survive unchanged:** `api/chat.js|lead.js|book.js` (Azure OpenAI EU chatbot — do not touch),
  chatbot widget embed (`assets/chatbot/`), legal pages + their URLs, sitemap URL structure
  (/web, /automation, /marketing, /services, /work, legal — SEO recovery in progress, breaking URLs is
  forbidden), DE/EN with `lang="de"` default, canonicals on www.rexity.ai.
- Performance targets: LCP < 2.0s, hero media ≤ 2.5MB, Lighthouse ≥ 90 mobile.

## Definition of done
Landing page + service/work/contact pages render at 390px and 1440px with zero unreadable text and zero
stuck animations; chatbot opens and sends; legal links resolve; `npm run build` clean; PR opened against
`main` — NO direct pushes to `main`, NO production deploys.
