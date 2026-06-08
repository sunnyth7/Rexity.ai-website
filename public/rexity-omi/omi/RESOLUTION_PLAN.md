# Omi Page — Fix Round (parallel agents)

Repo root: `/Users/sunnythakur/Desktop/Rexity.ai-website`. Dev URL: http://localhost:3000/rexity-omi/index.html
Architecture: Rexity Webflow page (`public/rexity-omi/index.html`, div-based) embeds the animated Workspace IT page
(`public/rexity-omi/omi/it-page-anim.html`, GSAP + ScrollSmoother) in an `<iframe#omi-it-frame>`.

## Parallel split (one file per agent — NO collisions)
- **Agent K** → `omi/it-page-anim.html` only: remove WS-IT footer (#5) + off-white theme inside iframe (#3-inner).
- **Agent L** → `index.html` only: move stack grid above footer (#2) + iframe wrapper bg off-white (#3-outer) + include `omi/omi-nav.js`.
- **Agent M** → NEW `omi/omi-nav.js` only: hamburger menu open/close (#4).
- **Orchestrator (after K/L/M)** → #1 double-scroll: convert iframe to A2 sticky scroll-proxy (edits index.html + it-page-anim.html).

## Contract
- L adds, before `</body>` in index.html: `<script src="omi/omi-nav.js" defer></script>`.
- M's `omi-nav.js` targets the existing Webflow nav classes: `.w-nav-button` (hamburger), `.w-nav-menu`, `.w-nav-overlay`, nav links inside `.w-nav-menu`.
- Rexity off-white = `#f7f7f4`. White cards stay white.
- Do NOT touch the `#omi-it-frame` iframe scroll mechanism — orchestrator owns #1.
