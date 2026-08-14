# Below-the-fold restyle — status

Branch `feature/3d-hero`, local only, never pushed.

## Done

| Pass | Commit | What |
|---|---|---|
| Hero (frozen) | `b5de952` | WebGL hero, hero-only integration |
| 1 | `9d63530` | Anton display type + violet accents in the IT embed |
| 2 | `9e6c8d6` | White ground, `--rx-*` token retone, pass-1 correction |
| fix | `a9b4269` | Footer nav was white-on-white after the ground change |
| 3 | `0447e40` | Leistungen rail: case numbers, per-service accents, hover |

All styling lives in two appended override files. Delete them and the old look returns:
- `rexity-omi/omi/rx-vibe.css` — inside the embed
- `assets/3d-hero/site-vibe.css` — parent page sections

## Verified

- Grounds white throughout: `html`, `body`, `.omi-it-embed`, footer section, cards.
- Tokens retoned: `--rx-blue`/`--rx-card` white, `--rx-text` navy, `--rx-ink` restored
  to the page's own `#10233F`, our accent isolated as `--rxv-accent`.
- Six service cards: numbers 01–06 in order, six distinct accents, routes intact.
- Contrast: 73 text-owning elements measured, zero below 3:1.

## Not verified — needs a human pass

1. **Contrast coverage is partial.** 153 elements own text; only 73 could be measured.
   The rest sit in GSAP-animated sections that stay collapsed until their ScrollTrigger
   fires. Scripted scrolling does not reliably trigger them when the browser pane is
   backgrounded (timers throttle), so the deeper sections — numbers, team, Clevr work,
   tech stack, contact — have NOT been contrast-checked. Scroll through them by hand.
2. **Card hover.** Rules are written to match the stock selector shape and are appended
   later, but simulating hover via an injected class failed on specificity and proved
   nothing. Needs a real pointer test.
3. **Four blocks still compute beige**: `div_block-4804-10`, `-5075-10`, `-9-1569`,
   `-64-1569`. Every matching rule resolves to white, the `--rx-card` token is white on
   the element and all ancestors, and an id-level `!important` with `background-image:
   none` is in the cascade. No inline style. Source is therefore applied at runtime —
   next step is a MutationObserver on one node to catch the writer.

## Content issue, not styling

The six service CTAs still read as template English — "Streamline Your Device…",
"Manage Your Application…", "Optimise Your Resource…", "Transform Your Opera…",
"Identify Issues", "Proactive Updates". They do not match the German headings above
them and are not Rexity's voice. Needs real copy, in both DE and EN.
