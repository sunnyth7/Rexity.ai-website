#!/usr/bin/env node
/* gen-service-pages.mjs — generates the static service hub + sub-pages from
   data/services.json into the site root. Run from the repo root:
       node scripts/gen-service-pages.mjs
   Output: /<slug>/index.html (hubs + standalones) and
           /<parent>/<slug>/index.html (sub-services).
   These pages share the brand (self-hosted Inter, brand palette, chatbot,
   DE/EN via the same rexity_lang localStorage key as the homepage). */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(ROOT, "data/services.json"), "utf8"));
const CHAT_V = "20260817a"; // keep in sync with the homepage chatbot cache-buster
const EMAIL = data.brand.email;

const byslug = Object.fromEntries(data.pages.map((p) => [p.slug, p]));
const urlOf = (p) => (p.parent ? `/${p.parent}/${p.slug}` : `/${p.slug}`);

// --- tiny helpers -----------------------------------------------------------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// bilingual <span>: visible text defaults to DE (primary market), JS swaps.
const t = (bi, tag = "span", cls = "") =>
  `<${tag}${cls ? ` class="${cls}"` : ""} data-en="${esc(bi.en)}" data-de="${esc(bi.de)}">${esc(bi.de)}</${tag}>`;
const tText = (bi) => `<span data-en="${esc(bi.en)}" data-de="${esc(bi.de)}">${esc(bi.de)}</span>`;

function head(p) {
  const title = `${p.title.de} — Rexity Labs`;
  const desc = p.summary.de;
  return `<!DOCTYPE html><html lang="de"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title data-en="${esc(p.title.en)} — Rexity Labs" data-de="${esc(title)}">${esc(title)}</title>
<meta name="description" data-en="${esc(p.summary.en)}" data-de="${esc(desc)}" content="${esc(desc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://www.rexity.ai${urlOf(p)}">
<meta name="theme-color" content="#f5f5f3">
<link rel="icon" href="/rexity-omi/assets/brand/final/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/rexity-omi/assets/brand/final/apple-touch-icon.png">
<link rel="stylesheet" href="/rexity-omi/assets/vendor/css/inter.css">
<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};</script>
<script defer src="/_vercel/insights/script.js"></script>
<link rel="stylesheet" href="/rexity-omi/assets/chatbot/rexity-chatbot.css?v=${CHAT_V}">
<style>${CSS}</style>
</head><body>`;
}

const NAV = data.nav
  .map((n) => `<a href="/${n.slug}" data-en="${esc(n.title.en)}" data-de="${esc(n.title.de)}">${esc(n.title.de)}</a>`)
  .join("");

function header() {
  return `<header class="rx-hd">
  <a class="rx-logo" href="/" aria-label="Rexity Labs"><img src="/rexity-omi/assets/brand/final/rexity-logo-horizontal.svg" alt="Rexity Labs" width="132" height="28"></a>
  <nav class="rx-nav">${NAV}</nav>
  <button class="rx-pill" id="rx-lang" type="button" aria-label="Sprache wechseln"><span data-lang="de">DE</span><span class="sep">/</span><span data-lang="en">EN</span></button>
</header>`;
}

function footer() {
  const legal = [
    ["/impressum", { en: "Imprint", de: "Impressum" }],
    ["/datenschutz", { en: "Privacy", de: "Datenschutz" }],
    ["/agb", { en: "Terms", de: "AGB" }],
    ["/barrierefreiheit", { en: "Accessibility", de: "Barrierefreiheit" }],
  ]
    .map(([h, b]) => `<a href="${h}" data-en="${esc(b.en)}" data-de="${esc(b.de)}">${esc(b.de)}</a>`)
    .join("");
  return `<footer class="rx-ft">
  <div class="rx-ft-top">
    <a class="rx-logo" href="/"><img src="/rexity-omi/assets/brand/final/rexity-logo-horizontal.svg" alt="Rexity Labs" width="120" height="26"></a>
    <a class="rx-ft-mail" href="mailto:${EMAIL}">${EMAIL}</a>
  </div>
  <nav class="rx-ft-links">${legal}</nav>
  <p class="rx-ft-copy">© Rexity Labs UG (haftungsbeschränkt) 2026 · HRB 213911 · Amtsgericht Lüneburg. ${"<span data-en=\"All rights reserved.\" data-de=\"Alle Rechte vorbehalten.\">Alle Rechte vorbehalten.</span>"}</p>
</footer>`;
}

function cta() {
  return `<section class="rx-cta">
  ${t({ en: "Have a project in mind?", de: "Ein Projekt im Kopf?" }, "h2", "")}
  ${t({ en: "Tell us what you're building. We reply within a day.", de: "Erzählen Sie uns, was Sie bauen. Wir antworten innerhalb eines Tages." }, "p", "")}
  <a class="rx-btn" href="mailto:${EMAIL}">${EMAIL}</a>
</section>`;
}

function tail() {
  return `${cta()}${footer()}
<script src="/rexity-omi/assets/chatbot/rexity-chatbot.js?v=${CHAT_V}" defer></script>
<script>${LANG_JS}</script>
</body></html>
`;
}

function list(bi) {
  // bi = {en:[],de:[]} → bilingual <li> by index
  return bi.de
    .map((d, i) => `<li><span data-en="${esc(bi.en[i] ?? d)}" data-de="${esc(d)}">${esc(d)}</span></li>`)
    .join("");
}

// Hero media: real photo if the file is on disk, else a branded placeholder
// (so layout holds while WAN images are pending). Returns "" when no image.
function heroMedia(p) {
  // A looping muted video showcase takes priority (e.g. the MacBook M5 clip).
  if (p.video) {
    const alt = p.video.alt ? esc(p.video.alt.de) : "";
    const poster = p.video.poster ? ` poster="${esc(p.video.poster)}"` : "";
    const webm = p.video.webm ? `<source src="${esc(p.video.webm)}" type="video/webm">` : "";
    const mp4 = p.video.mp4 ? `<source src="${esc(p.video.mp4)}" type="video/mp4">` : "";
    return `<div class="rx-hero-media rx-hero-video"><video autoplay muted loop playsinline preload="metadata"${poster} aria-label="${alt}">${webm}${mp4}</video></div>`;
  }
  if (!p.image) return "";
  const onDisk = existsSync(join(ROOT, p.image.src.replace(/^\//, "")));
  if (onDisk) {
    return `<div class="rx-hero-media"><img src="${esc(p.image.src)}" alt="${esc(p.image.alt.de)}" data-alt-en="${esc(p.image.alt.en)}" data-alt-de="${esc(p.image.alt.de)}" loading="eager" decoding="async"></div>`;
  }
  return `<div class="rx-hero-media rx-hero-ph" role="img" aria-label="${esc(p.image.alt.de)}"><span>${esc(p.code)}</span></div>`;
}

function heroBlock(p, isHub) {
  const media = heroMedia(p);
  return `<section class="rx-hero${media ? " rx-hero-split" : ""}">
  <div class="rx-hero-text">
    <div class="rx-code">${esc(p.code)}</div>
    ${t(p.title, "h1", "")}
    ${t(p.tagline, "p", "rx-tag")}
    ${t(isHub ? p.hero : p.summary, "p", "rx-lead")}
    <a class="rx-btn" href="mailto:${EMAIL}">${"<span data-en=\"Start a conversation\" data-de=\"Gespräch starten\">Gespräch starten</span>"}</a>
  </div>
  ${media}
</section>`;
}

// HTML/CSS workflow diagram (wraps + responsive + bilingual; better than SVG
// for long DE labels). Renders the flow as connected pills with a branch row.
function flowDiagram(flow) {
  const parts = flow
    .map((stage, idx) => {
      const conn = idx > 0 ? `<div class="rx-fconn" aria-hidden="true"></div>` : "";
      if (stage.node) return `${conn}<div class="rx-fnode">${tText(stage.node)}</div>`;
      if (stage.branch) {
        const items = stage.branch.map((b) => `<div class="rx-fitem">${tText(b)}</div>`).join("");
        return `${conn}<div class="rx-fbranch">${items}</div>`;
      }
      return "";
    })
    .join("");
  return `<div class="rx-flow">${parts}</div>`;
}

function workflowSection(p) {
  if (!p.workflow) return "";
  const w = p.workflow;
  const steps = w.steps
    .map((s, i) => `<div class="rx-wstep"><span class="rx-wnum">${i + 1}</span><div>${t(s.title, "h3", "")}${t(s.body, "p", "")}</div></div>`)
    .join("");
  return `<section class="rx-sec rx-work"><h2 data-en="How it works" data-de="So funktioniert's">So funktioniert's</h2>
  ${t(w.intro, "p", "rx-work-intro")}
  <div class="rx-work-grid">
    <div class="rx-work-diagram">${flowDiagram(w.flow)}</div>
    <div class="rx-work-steps">${steps}</div>
  </div>
</section>`;
}

function childCards(p) {
  const cards = p.children
    .map((slug) => {
      const c = byslug[slug];
      return `<a class="rx-card" href="${urlOf(c)}">
      <span class="rx-card-code">${esc(c.code)}</span>
      ${t(c.title, "h3", "")}
      ${t(c.tagline, "p", "")}
      <span class="rx-card-go" data-en="Learn more →" data-de="Mehr erfahren →">Mehr erfahren →</span>
    </a>`;
    })
    .join("");
  return `<section class="rx-grid">${cards}</section>`;
}

function leafBody(p) {
  const sections = [];
  // The real "How it works" workflow is the centerpiece — show it first.
  if (p.workflow) sections.push(workflowSection(p));
  sections.push(`<section class="rx-sec"><h2 data-en="What's included" data-de="Was dazugehört">Was dazugehört</h2><ul class="rx-ticks">${list(p.offerings)}</ul></section>`);
  sections.push(`<section class="rx-sec rx-alt"><h2 data-en="What you get" data-de="Was Sie bekommen">Was Sie bekommen</h2><ul class="rx-ticks">${list(p.outcomes)}</ul></section>`);
  // Generic 3-step process only when there's no richer workflow (avoids dupes).
  if (!p.workflow) {
    const steps = p.process
      .map(
        (s, i) => `<div class="rx-step"><span class="rx-step-n">${i + 1}</span><div>${t(s.title, "h3", "")}${t(s.body, "p", "")}</div></div>`
      )
      .join("");
    sections.push(`<section class="rx-sec"><h2 data-en="How we work" data-de="Wie wir arbeiten">Wie wir arbeiten</h2><div class="rx-steps">${steps}</div></section>`);
  }
  if (p.who) sections.push(`<section class="rx-sec rx-who"><div class="rx-who-card"><span class="rx-who-label" data-en="Who it's for" data-de="Für wen">Für wen</span>${t(p.who, "p", "")}</div></section>`);
  if (p.note) sections.push(`<section class="rx-sec rx-note">${t(p.note, "p", "")}</section>`);
  if (p.stack && p.stack.length) {
    const chips = p.stack.map((s) => `<span class="rx-chip">${esc(s)}</span>`).join("");
    sections.push(`<section class="rx-sec"><h2 data-en="Stack" data-de="Technologie">Technologie</h2><div class="rx-chips">${chips}</div></section>`);
  }
  if (p.faqs && p.faqs.length) {
    const fa = p.faqs
      .map((f) => `<div class="rx-faq">${t(f.q, "h3", "")}${t(f.a, "p", "")}</div>`)
      .join("");
    sections.push(`<section class="rx-sec rx-alt"><h2 data-en="FAQ" data-de="FAQ">FAQ</h2>${fa}</section>`);
  }
  if (p.related && p.related.length) {
    const rel = p.related
      .map((slug) => {
        const c = byslug[slug];
        if (!c) return "";
        return `<a class="rx-rel" href="${urlOf(c)}">${t(c.title, "span", "")}<span class="rx-rel-go" aria-hidden="true">→</span></a>`;
      })
      .join("");
    sections.push(`<section class="rx-sec"><h2 data-en="Related services" data-de="Verwandte Leistungen">Verwandte Leistungen</h2><div class="rx-rels">${rel}</div></section>`);
  }
  return sections.join("\n");
}

function indexBody() {
  const sections = data.nav
    .map((n) => {
      const hub = byslug[n.slug];
      const kids = n.children.length ? n.children : [n.slug];
      const cards = kids
        .map((slug) => {
          const c = byslug[slug];
          return `<a class="rx-card" href="${urlOf(c)}">
        <span class="rx-card-code">${esc(c.code)}</span>
        ${t(c.title, "h3", "")}
        ${t(c.tagline, "p", "")}
        <span class="rx-card-go" data-en="Learn more →" data-de="Mehr erfahren →">Mehr erfahren →</span>
      </a>`;
        })
        .join("");
      const heading = n.children.length
        ? `<a class="rx-cat-h" href="${urlOf(hub)}">${t(hub.title, "h2", "")}<span class="rx-cat-go" data-en="View all →" data-de="Alle ansehen →">Alle ansehen →</span></a>`
        : "";
      return `<section class="rx-cat">${heading}<div class="rx-grid rx-grid-tight">${cards}</div></section>`;
    })
    .join("");
  return sections;
}

const caseUrl = (c) => `/work/${c.slug}`;

function caseCard(c) {
  const url = caseUrl(c);
  const img = c.image ? `<a class="rx-case-img" href="${url}" tabindex="-1" aria-hidden="true"><img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy" decoding="async"></a>` : "";
  const meta = c.duration ? `<p class="rx-case-meta">${tText({ en: "Duration", de: "Dauer" })}: ${tText(c.duration)}</p>` : "";
  return `<article class="rx-case">${img}<div class="rx-case-body">${t(c.audience, "span", "rx-case-aud")}<h3><a href="${url}">${esc(c.name)}</a></h3>${t(c.tagline, "p", "rx-case-tag")}${t(c.body, "p", "rx-case-text")}${meta}<a class="rx-case-link" href="${url}">${tText({ en: "View case study →", de: "Projekt ansehen →" })}</a></div></article>`;
}

function workBody(p) {
  const cards = (p.cases || []).map(caseCard).join("");
  return `<section class="rx-sec"><h2 data-en="Selected work" data-de="Ausgewählte Arbeiten">Ausgewählte Arbeiten</h2><div class="rx-cases">${cards}</div></section>`;
}

// --- case study detail pages (/work/<slug>) ---------------------------------
// Scroll-through preview of the real pages: full-length captures, sliced into
// tiles, inside a browser window + a phone frame. (The live sites send
// X-Frame-Options: DENY, and a live frame would allow real bookings anyway.)
const biText = (v) => (typeof v === "string" ? esc(v) : tText(v));
function livePane(pg, i, device) {
  const lbl = esc(pg.label.de);
  if (pg.slides) {
    const imgs = pg.slides.map((src, k) => `<img src="${esc(src)}" width="${pg.w}" height="${pg.h}" alt="${lbl} ${k + 1}" loading="lazy" decoding="async">`).join("");
    return `<div class="rx-pane rx-pane-slides" role="tabpanel" tabindex="0" aria-label="${lbl}"${i ? " hidden" : ""}>${imgs}</div>`;
  }
  const tiles = pg.tiles.map((h, k) => `<img src="${esc(pg.src)}-${k + 1}.webp" width="${pg.w}" height="${h}" alt="${k ? "" : lbl}" loading="${!i && !k && device === "desk" ? "eager" : "lazy"}" decoding="async">`).join("");
  return `<div class="rx-pane" role="tabpanel" tabindex="0" aria-label="${lbl}" data-path="${esc(pg.path || "")}"${i ? " hidden" : ""}>${tiles}</div>`;
}
function liveTabs(pages) {
  return `<div class="rx-live-tabs" role="tablist">${pages.map((pg, i) => `<button type="button" role="tab" aria-selected="${i ? "false" : "true"}" data-i="${i}">${tText(pg.label)}</button>`).join("")}</div>`;
}
function screenFlow(c) {
  const pv = c.preview;
  const desk = `<div class="rx-browser rx-live-box" data-live>
    <div class="rx-browser-bar"><span class="rx-dots" aria-hidden="true"></span><div class="rx-url"><span class="rx-url-lock" aria-hidden="true"></span>${biText(pv.host)}<span class="rx-url-path">${esc(pv.desktop[0].path || "")}</span></div></div>
    ${liveTabs(pv.desktop)}
    <div class="rx-screen rx-screen-desk">${pv.desktop.map((pg, i) => livePane(pg, i, "desk")).join("")}<span class="rx-scroll-hint" aria-hidden="true">${tText({ en: "Scroll", de: "Scrollen" })} ↓</span></div>
  </div>`;
  const phone = `<div class="rx-phone rx-live-box" data-live>
    ${liveTabs(pv.mobile)}
    <div class="rx-phone-shell"><div class="rx-screen rx-screen-phone">${pv.mobile.map((pg, i) => livePane(pg, i, "phone")).join("")}<span class="rx-scroll-hint" aria-hidden="true">${pv.mobile[0].slides ? `← ${tText({ en: "Swipe", de: "Wischen" })} →` : `${tText({ en: "Scroll", de: "Scrollen" })} ↓`}</span></div></div>
  </div>`;
  const live = c.link ? ` <a href="${esc(c.link)}" target="_blank" rel="noopener">${tText({ en: "Open the live site ↗", de: "Echte Seite öffnen ↗" })}</a>` : "";
  return `<section class="rx-sec"><h2 data-en="Try it yourself" data-de="Selbst ausprobieren">Selbst ausprobieren</h2>${t(c.flowIntro, "p", "rx-work-intro")}<div class="rx-live">${desk}${phone}</div><p class="rx-live-note">${tText({ en: "Preview of the real pages — scroll inside the windows.", de: "Vorschau der echten Seiten — einfach im Fenster scrollen." })}${live}</p></section>`;
}

const LIVE_JS = `
document.querySelectorAll('[data-live]').forEach(function(box){
  var tabs=box.querySelectorAll('[role=tab]'), panes=box.querySelectorAll('.rx-pane'), path=box.querySelector('.rx-url-path'), hint=box.querySelector('.rx-scroll-hint');
  function show(i){
    tabs.forEach(function(t,k){t.setAttribute('aria-selected',k===i?'true':'false')});
    panes.forEach(function(p,k){p.hidden=k!==i; if(k===i){p.scrollTop=0;p.scrollLeft=0}});
    if(path)path.textContent=panes[i].getAttribute('data-path')||'';
  }
  tabs.forEach(function(t,k){t.addEventListener('click',function(){show(k)})});
  panes.forEach(function(p){p.addEventListener('scroll',function(){if(hint)hint.classList.add('off')},{passive:true})});
});
`;

function feedbackVideo(c) {
  const v = c.video;
  const media = v && v.mp4
    ? `<div class="rx-fb-media"><video controls playsinline preload="metadata"${v.poster ? ` poster="${esc(v.poster)}"` : ""}><source src="${esc(v.mp4)}" type="video/mp4"></video></div>`
    : `<div class="rx-fb-media rx-fb-ph" role="img" aria-label="${esc(c.feedbackLabel.de)}"><span class="rx-fb-play" aria-hidden="true"></span>${t({ en: "Video feedback coming soon", de: "Video-Feedback folgt in Kürze" }, "p", "rx-fb-soon")}${t(c.feedbackLabel, "p", "rx-fb-who")}</div>`;
  return `<section class="rx-sec"><h2 data-en="In their words" data-de="In eigenen Worten">In eigenen Worten</h2>${media}</section>`;
}

function renderCase(c, i, all) {
  const page = { slug: c.slug, parent: "work", code: String(i + 1).padStart(2, "0"), title: { en: c.name, de: c.name }, summary: c.tagline };
  const facts = [
    [{ en: "Duration", de: "Dauer" }, c.duration],
    [{ en: "Timeframe", de: "Zeitraum" }, c.period],
    [{ en: "Type", de: "Art" }, c.audience],
    [{ en: "Status", de: "Status" }, c.status],
  ].map(([k, v]) => `<div class="rx-fact">${t(k, "span", "rx-fact-k")}${t(v, "span", "rx-fact-v")}</div>`).join("");
  const visit = c.link ? `<a class="rx-btn rx-btn-ghost" href="${esc(c.link)}" target="_blank" rel="noopener">${tText({ en: "Visit the live site ↗", de: "Live ansehen ↗" })}</a>` : "";
  const hero = `<section class="rx-hero rx-hero-split rx-case-hero">
  <div class="rx-hero-text">
    <div class="rx-code">${esc(page.code)}</div>
    <h1>${esc(c.name)}</h1>
    ${t(c.tagline, "p", "rx-tag")}
    ${t(c.body, "p", "rx-lead")}
    <div class="rx-hero-ctas"><a class="rx-btn" href="mailto:${EMAIL}">${tText({ en: "Start a similar project", de: "Ähnliches Projekt anfragen" })}</a>${visit}</div>
  </div>
  <div class="rx-hero-media rx-hero-shot"><img src="${esc(c.image)}" alt="${esc(c.name)}" loading="eager" decoding="async"></div>
</section>
<div class="rx-facts">${facts}</div>`;
  const built = `<section class="rx-sec"><h2 data-en="What we built" data-de="Was wir gebaut haben">Was wir gebaut haben</h2>${t(c.challenge, "p", "rx-work-intro")}<ul class="rx-ticks">${list(c.built)}</ul></section>`;
  const outcome = `<section class="rx-sec rx-alt"><h2 data-en="The outcome" data-de="Das Ergebnis">Das Ergebnis</h2><ul class="rx-ticks">${list(c.outcome)}</ul></section>`;
  const prev = all[(i - 1 + all.length) % all.length], next = all[(i + 1) % all.length];
  const pager = `<nav class="rx-pager"><a href="${caseUrl(prev)}"><span data-en="← Previous project" data-de="← Vorheriges Projekt">← Vorheriges Projekt</span><strong>${esc(prev.name)}</strong></a><a href="/work" class="rx-pager-mid"><span data-en="All projects" data-de="Alle Projekte">Alle Projekte</span></a><a href="${caseUrl(next)}" class="rx-pager-next"><span data-en="Next project →" data-de="Nächstes Projekt →">Nächstes Projekt →</span><strong>${esc(next.name)}</strong></a></nav>`;
  const crumb = `<nav class="rx-crumb"><a href="/">Home</a> / <a href="/work">${tText(byslug.work.title)}</a> / <span>${esc(c.name)}</span></nav>`;
  return `${head(page)}${header()}<main>${crumb}${hero}${built}${screenFlow(c)}${outcome}${feedbackVideo(c)}${pager}</main>${tail().replace("</body>", `<script>${LIVE_JS}</script>\n</body>`)}`;
}

function renderPage(p) {
  const isHub = p.type === "hub";
  const isIndex = p.type === "index";
  const isWork = p.type === "work";
  const body = isIndex ? indexBody() : isWork ? workBody(p) : isHub ? childCards(p) : leafBody(p);
  const crumb = p.parent
    ? `<nav class="rx-crumb"><a href="/">Home</a> / <a href="/${p.parent}">${tText(byslug[p.parent].title)}</a> / ${tText(p.title)}</nav>`
    : `<nav class="rx-crumb"><a href="/">Home</a> / ${tText(p.title)}</nav>`;
  return `${head(p)}${header()}<main>${crumb}${heroBlock(p, isHub || isIndex || isWork)}${body}</main>${tail()}`;
}

// ============================================================================
// CSS + client lang JS (kept inline so the pages are self-contained).
// Defined before the write-loop so head()/tail() can reference them.
// ============================================================================
const CSS = `
:root{--ink:#111214;--black:#050505;--soft:#f5f5f3;--panel:#fff;--muted:#686b72;--red:#ff2d2d;--line:#e7e7e3;--maxw:1080px}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--ink);background:var(--soft);line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
main{max-width:var(--maxw);margin:0 auto;padding:0 24px}
h1,h2,h3{line-height:1.12;letter-spacing:-.02em;margin:0}
/* header */
.rx-hd{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:24px;padding:14px 24px;background:rgba(245,245,243,.85);backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid var(--line)}
.rx-logo img{display:block;height:26px;width:auto}
.rx-nav{display:flex;gap:22px;margin-left:auto;flex-wrap:wrap}
.rx-nav a{font-size:14px;font-weight:500;color:var(--muted);transition:color .15s}
.rx-nav a:hover{color:var(--ink)}
.rx-pill{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--line);background:var(--panel);border-radius:999px;padding:5px 11px;font:600 12px/1 Inter,sans-serif;cursor:pointer;color:var(--muted)}
.rx-pill .sep{opacity:.4}
.rx-pill [data-lang].on{color:var(--ink)}
/* breadcrumb */
.rx-crumb{font-size:13px;color:var(--muted);padding:22px 0 0}
.rx-crumb a:hover{color:var(--ink)}
.rx-crumb span{color:var(--ink)}
/* hero */
.rx-hero{padding:46px 0 40px;border-bottom:1px solid var(--line)}
.rx-code{display:inline-block;font:600 12px/1 Inter,sans-serif;letter-spacing:.18em;color:var(--red);border:1px solid var(--line);border-radius:999px;padding:6px 12px;margin-bottom:20px}
.rx-hero h1{font-size:clamp(34px,6vw,58px);font-weight:700;max-width:14ch}
.rx-tag{font-size:clamp(18px,2.4vw,24px);font-weight:600;margin:14px 0 0;max-width:24ch}
.rx-lead{font-size:17px;color:var(--muted);margin:18px 0 28px;max-width:60ch}
.rx-btn{display:inline-block;background:var(--black);color:#fff;font-weight:600;font-size:15px;padding:13px 22px;border-radius:10px;transition:transform .15s,background .15s}
.rx-btn:hover{transform:translateY(-1px);background:var(--red)}
/* hub grid */
.rx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;padding:40px 0}
.rx-card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:24px;transition:transform .15s,border-color .15s,box-shadow .15s}
.rx-card:hover{transform:translateY(-3px);border-color:#d6d6d0;box-shadow:0 12px 30px -18px rgba(0,0,0,.25)}
.rx-card-code{font:600 11px/1 Inter,sans-serif;letter-spacing:.16em;color:var(--red)}
.rx-card h3{font-size:21px;font-weight:700;margin:14px 0 8px}
.rx-card p{color:var(--muted);font-size:15px;margin:0 0 18px}
.rx-card-go{font-size:14px;font-weight:600;color:var(--ink)}
/* leaf sections */
.rx-sec{padding:44px 0;border-bottom:1px solid var(--line)}
.rx-sec>h2{display:flex;align-items:center;gap:11px;font-size:13px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:24px}
.rx-sec>h2:before{content:"";width:20px;height:2px;border-radius:2px;background:var(--red);flex:none}
/* alt sections become contained cards */
.rx-alt{border:1px solid var(--line);border-bottom:1px solid var(--line);border-radius:20px;background:#fff;padding:36px 34px;margin:18px 0;box-shadow:0 1px 0 rgba(0,0,0,.02)}
@media(max-width:560px){.rx-alt{padding:26px 20px}}
.rx-ticks{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
.rx-ticks li{position:relative;padding-left:28px;font-size:16px}
.rx-ticks li:before{content:"";position:absolute;left:0;top:8px;width:14px;height:14px;border-radius:50%;background:var(--red);opacity:.16}
.rx-ticks li:after{content:"";position:absolute;left:5px;top:11px;width:4px;height:7px;border:2px solid var(--red);border-top:0;border-left:0;transform:rotate(40deg)}
.rx-steps{display:grid;gap:18px}
.rx-step{display:flex;gap:18px;align-items:flex-start;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px 22px}
.rx-step-n{flex:none;width:34px;height:34px;border-radius:50%;background:var(--black);color:#fff;display:grid;place-items:center;font-weight:700;font-size:15px}
.rx-step h3{font-size:18px;font-weight:700;margin-bottom:4px}
.rx-step p{margin:0;color:var(--muted);font-size:15px}
.rx-who{border-bottom:1px solid var(--line)}
.rx-who-card{background:linear-gradient(105deg,#fff,#fdf2f2);border:1px solid var(--line);border-left:4px solid var(--red);border-radius:16px;padding:26px 30px}
.rx-who-label{display:block;font:600 12px/1 Inter,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:var(--red);margin-bottom:12px}
.rx-who-card p{font-size:22px;font-weight:600;letter-spacing:-.01em;max-width:42ch;color:var(--ink);margin:0;line-height:1.35}
.rx-note p{font-size:14px;color:var(--muted);background:#fff;border:1px solid var(--line);border-left:3px solid var(--red);border-radius:10px;padding:14px 16px;margin:0}
.rx-chips,.rx-rels{display:flex;flex-wrap:wrap;gap:10px}
.rx-chip{font-size:13px;font-weight:500;color:var(--muted);background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:7px 14px}
.rx-faq{padding:16px 0;border-top:1px solid var(--line)}
.rx-faq:first-of-type{border-top:0}
.rx-faq h3{font-size:17px;font-weight:700;margin-bottom:6px}
.rx-faq p{margin:0;color:var(--muted)}
.rx-rel{display:inline-flex;align-items:center;gap:10px;font-size:15px;font-weight:600;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 18px;transition:border-color .15s,transform .15s,box-shadow .15s}
.rx-rel:hover{border-color:var(--red);transform:translateY(-2px);box-shadow:0 10px 24px -16px rgba(0,0,0,.3)}
.rx-rel-go{color:var(--red);font-weight:700;transition:transform .15s}
.rx-rel:hover .rx-rel-go{transform:translateX(3px)}
/* hero with media */
.rx-hero-split{display:grid;grid-template-columns:1.08fr .92fr;gap:48px;align-items:center}
.rx-hero-media{border-radius:18px;overflow:hidden;border:1px solid var(--line);background:#ece9e4;aspect-ratio:4/3}
.rx-hero-media img{display:block;width:100%;height:100%;object-fit:cover}
.rx-hero-video{aspect-ratio:16/9;background:#0c0c0d;border-color:#1d1d1f}
.rx-hero-video video{display:block;width:100%;height:100%;object-fit:cover}
.rx-hero-ph{display:grid;place-items:center;background:linear-gradient(135deg,#fff,#f0efe9 55%,#ffe9e9);position:relative}
.rx-hero-ph span{position:relative;z-index:1;font:700 12px/1 Inter,sans-serif;letter-spacing:.2em;color:var(--red);border:1px solid var(--line);background:rgba(255,255,255,.7);padding:8px 14px;border-radius:999px}
.rx-hero-ph:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 72% 28%,rgba(255,45,45,.12),transparent 60%)}
@media(max-width:820px){.rx-hero-split{grid-template-columns:1fr;gap:26px}.rx-hero-media{order:-1;aspect-ratio:16/10}}
/* how it works */
.rx-work-intro{font-size:18px;color:var(--ink);max-width:62ch;margin:-4px 0 30px}
.rx-work-grid{display:grid;grid-template-columns:minmax(240px,330px) 1fr;gap:42px;align-items:start}
@media(max-width:820px){.rx-work-grid{grid-template-columns:1fr;gap:30px}}
.rx-flow{display:flex;flex-direction:column;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:24px 16px}
.rx-fnode{width:100%;max-width:280px;text-align:center;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 16px;font-weight:600;font-size:14px}
.rx-fnode:first-child{background:#111214;color:#fff;border-color:#111214}
.rx-fnode:last-child{background:#fff7f7;border-color:#f3d6d6}
.rx-fconn{width:2px;height:22px;background:#cfcfca;position:relative}
.rx-fconn:after{content:"";position:absolute;left:50%;bottom:-1px;transform:translateX(-50%);border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #cfcfca}
.rx-fbranch{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;width:100%;max-width:300px}
.rx-fitem{flex:1 1 calc(50% - 8px);min-width:118px;text-align:center;background:#faf3f3;border:1px solid #f1dada;border-radius:10px;padding:9px 10px;font-size:12.5px;font-weight:600;color:#b3261e}
.rx-work-steps{display:grid;gap:16px}
.rx-wstep{display:flex;gap:16px;align-items:flex-start}
.rx-wnum{flex:none;width:30px;height:30px;border-radius:50%;background:var(--red);color:#fff;display:grid;place-items:center;font-weight:700;font-size:14px}
.rx-wstep h3{font-size:17px;font-weight:700;margin-bottom:3px}
.rx-wstep p{margin:0;color:var(--muted);font-size:15px}
/* work / case studies */
.rx-cases{display:grid;grid-template-columns:1fr;gap:22px}
.rx-case{display:grid;grid-template-columns:minmax(220px,300px) 1fr;border:1px solid var(--line);border-radius:18px;overflow:hidden;background:#fff}
@media(max-width:700px){.rx-case{grid-template-columns:1fr}}
.rx-case-img{background:#ece9e4}
.rx-case-img img{display:block;width:100%;height:100%;object-fit:cover;aspect-ratio:4/3}
.rx-case-body{padding:26px 28px}
.rx-case-logo{height:26px;width:auto;margin-bottom:12px;display:block}
.rx-case-name{font-weight:700;font-size:14px;margin-bottom:8px}
.rx-case h3{font-size:22px;font-weight:700;margin:0 0 6px}
.rx-case-tag{font-size:15px;font-weight:600;color:var(--ink);margin:0 0 12px}
.rx-case-aud{display:inline-block;font:600 12px/1 Inter,sans-serif;letter-spacing:.04em;color:var(--red);background:#fdf2f2;border:1px solid #f3d6d6;border-radius:999px;padding:5px 11px;margin:0 0 14px}
.rx-case-text{color:var(--muted);font-size:15px;margin:0 0 16px}
.rx-case-link{font-weight:600;color:var(--ink)}
.rx-case-link:hover{color:var(--red)}
/* case study cards + detail pages */
.rx-case h3 a:hover{color:var(--red)}
.rx-case-img{display:block}
.rx-case-meta{font-size:13px;font-weight:600;color:var(--muted);margin:0 0 14px}
.rx-hero-ctas{display:flex;gap:12px;flex-wrap:wrap}
.rx-btn-ghost{background:#fff;color:var(--ink);border:1px solid var(--line)}
.rx-btn-ghost:hover{background:#fff;color:var(--red);border-color:var(--red)}
.rx-hero-shot{aspect-ratio:16/10;box-shadow:0 30px 60px -38px rgba(0,0,0,.45)}
.rx-hero-shot img{object-position:top}
.rx-facts{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);border-radius:16px;background:#fff;margin:28px 0 0;overflow:hidden}
.rx-fact{padding:18px 20px;border-left:1px solid var(--line)}
.rx-fact:first-child{border-left:0}
.rx-fact-k{display:block;font:600 11px/1 Inter,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--red);margin-bottom:8px}
.rx-fact-v{display:block;font-size:15px;font-weight:600;line-height:1.35}
@media(max-width:820px){.rx-facts{grid-template-columns:1fr 1fr}.rx-fact:nth-child(3){border-left:0}.rx-fact:nth-child(n+3){border-top:1px solid var(--line)}}
.rx-live{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:30px;align-items:start}
@media(max-width:900px){.rx-live{grid-template-columns:1fr;gap:34px}.rx-phone{order:-1;justify-self:center;width:100%;max-width:290px}.rx-screen-desk{height:clamp(300px,58vh,520px)!important}}
.rx-live-box{min-width:0}
.rx-browser{border:1px solid #d9d8d3;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 34px 70px -44px rgba(0,0,0,.5)}
.rx-browser-bar{display:flex;align-items:center;gap:14px;padding:10px 14px;background:#ecebe7;border-bottom:1px solid #dddcd7}
.rx-dots{flex:none;width:7px;height:7px;border-radius:50%;background:#ff5f57;box-shadow:12px 0 0 #febc2e,24px 0 0 #28c840;margin-right:24px}
.rx-url{flex:1;min-width:0;display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #dddcd7;border-radius:8px;padding:5px 11px;font-size:12.5px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rx-url-path{color:var(--muted)}
.rx-url-lock{flex:none;width:9px;height:7px;border:1.5px solid var(--muted);border-radius:2px;position:relative;margin-top:3px}
.rx-url-lock:before{content:"";position:absolute;left:1px;top:-6px;width:4px;height:5px;border:1.5px solid var(--muted);border-bottom:0;border-radius:3px 3px 0 0}
.rx-live-tabs{display:flex;gap:6px;flex-wrap:wrap;padding:10px 12px;border-bottom:1px solid var(--line);background:#faf9f7}
.rx-phone .rx-live-tabs{justify-content:center;border:0;background:none;padding:0 0 12px}
.rx-live-tabs button{font:600 12.5px/1 Inter,sans-serif;color:var(--muted);background:#fff;border:1px solid var(--line);border-radius:999px;padding:7px 12px;cursor:pointer;transition:color .15s,border-color .15s,background .15s}
.rx-live-tabs button:hover{color:var(--ink);border-color:#cfcfca}
.rx-live-tabs button[aria-selected=true]{background:var(--ink);border-color:var(--ink);color:#fff}
.rx-screen{position:relative;background:#111}
.rx-screen-desk{height:596px}
.rx-pane{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-width:thin}
.rx-pane[hidden]{display:none}
.rx-pane:focus-visible{outline:3px solid var(--red);outline-offset:-3px}
.rx-pane img{display:block;width:100%;height:auto}
.rx-pane-slides{display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory}
.rx-pane-slides img{flex:0 0 100%;width:100%;height:100%;object-fit:cover;object-position:top;scroll-snap-align:start}
.rx-phone-shell{border:9px solid #111214;border-radius:40px;overflow:hidden;background:#111214;box-shadow:0 34px 70px -40px rgba(0,0,0,.55)}
.rx-screen-phone{aspect-ratio:390/844;border-radius:31px;overflow:hidden}
.rx-scroll-hint{position:absolute;left:12px;bottom:14px;pointer-events:none;font:600 12px/1 Inter,sans-serif;color:#fff;background:rgba(17,18,20,.78);backdrop-filter:blur(6px);padding:8px 13px;border-radius:999px;transition:opacity .4s;white-space:nowrap}
.rx-scroll-hint.off{opacity:0}
.rx-live-note{font-size:13.5px;color:var(--muted);margin:18px 0 0}
.rx-live-note a{font-weight:600;color:var(--ink);margin-left:6px}
.rx-live-note a:hover{color:var(--red)}
.rx-fb-media{border-radius:18px;overflow:hidden;aspect-ratio:16/9;background:#0c0c0d}
.rx-fb-media video{display:block;width:100%;height:100%;object-fit:cover}
.rx-fb-ph{display:grid;place-content:center;justify-items:center;gap:6px;text-align:center;background:radial-gradient(circle at 50% 38%,#26262a,#0c0c0d 70%);color:#fff;padding:24px}
.rx-fb-play{width:74px;height:74px;border-radius:50%;border:2px solid rgba(255,255,255,.35);position:relative;margin-bottom:14px}
.rx-fb-play:after{content:"";position:absolute;left:29px;top:22px;border-left:22px solid #fff;border-top:15px solid transparent;border-bottom:15px solid transparent}
.rx-fb-soon{font-size:clamp(18px,2.4vw,24px);font-weight:700;margin:0}
.rx-fb-who{font-size:14px;color:rgba(255,255,255,.62);margin:0}
.rx-pager{display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center;padding:36px 0 10px}
.rx-pager a{display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--muted)}
.rx-pager a strong{font-size:17px;color:var(--ink)}
.rx-pager a:hover strong{color:var(--red)}
.rx-pager-next{text-align:right;align-items:flex-end}
.rx-pager-mid{font-weight:600;color:var(--ink)!important;border:1px solid var(--line);border-radius:999px;padding:9px 16px;background:#fff}
@media(max-width:560px){.rx-pager{grid-template-columns:1fr 1fr}.rx-pager-mid{display:none!important}}
/* services index */
.rx-cat{padding:34px 0 8px;border-bottom:1px solid var(--line)}
.rx-cat:last-of-type{border-bottom:0}
.rx-cat-h{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:20px;flex-wrap:wrap}
.rx-cat-h h2{font-size:clamp(22px,3vw,30px);font-weight:700}
.rx-cat-go{font-size:14px;font-weight:600;color:var(--red);white-space:nowrap}
.rx-grid-tight{padding:0 0 8px}
/* cta */
.rx-cta{max-width:var(--maxw);margin:0 auto;padding:64px 24px;text-align:center}
.rx-cta h2{font-size:clamp(26px,4vw,40px);font-weight:700;margin-bottom:12px}
.rx-cta p{color:var(--muted);font-size:17px;margin:0 auto 26px;max-width:46ch}
/* footer */
.rx-ft{border-top:1px solid var(--line);background:#fff}
.rx-ft-top,.rx-ft-links{max-width:var(--maxw);margin:0 auto;padding:0 24px}
.rx-ft-top{display:flex;align-items:center;justify-content:space-between;padding-top:34px;gap:18px;flex-wrap:wrap}
.rx-ft-mail{font-weight:600;color:var(--ink)}
.rx-ft-links{display:flex;gap:20px;flex-wrap:wrap;padding-top:18px}
.rx-ft-links a{font-size:14px;color:var(--muted)}
.rx-ft-links a:hover{color:var(--ink)}
.rx-ft-copy{max-width:var(--maxw);margin:0 auto;padding:16px 24px 40px;font-size:13px;color:var(--muted)}
@media(max-width:720px){.rx-nav{display:none}.rx-hero{padding:34px 0 30px}}
`;

const LANG_JS = `
(function(){
  function get(){try{return localStorage.getItem('rexity_lang')||'de'}catch(e){return 'de'}}
  function apply(l){
    document.documentElement.lang=l;
    document.querySelectorAll('[data-de][data-en]').forEach(function(el){
      var v=el.getAttribute('data-'+l); if(v==null)return;
      if(el.tagName==='TITLE'){el.textContent=v;}
      else if(el.tagName==='META'){el.setAttribute('content',v);}
      else{el.textContent=v;}
    });
    document.querySelectorAll('[data-alt-de][data-alt-en]').forEach(function(el){
      var v=el.getAttribute('data-alt-'+l); if(v!=null)el.setAttribute('alt',v);
    });
    document.querySelectorAll('#rx-lang [data-lang]').forEach(function(s){
      s.classList.toggle('on', s.getAttribute('data-lang')===l);
    });
  }
  function set(l){try{localStorage.setItem('rexity_lang',l)}catch(e){}; apply(l);
    try{window.dispatchEvent(new CustomEvent('rexity:languagechange',{detail:{lang:l}}))}catch(e){}}
  document.addEventListener('DOMContentLoaded',function(){
    apply(get());
    var btn=document.getElementById('rx-lang');
    if(btn)btn.addEventListener('click',function(){set(get()==='de'?'en':'de')});
  });
  window.addEventListener('storage',function(e){if(e.key==='rexity_lang'&&e.newValue)apply(e.newValue)});
  window.addEventListener('rexity:languagechange',function(e){if(e&&e.detail&&e.detail.lang)apply(e.detail.lang)});
  window.rexityGetLang=get; window.rexitySetLang=set;
})();
`;

// --- write all pages --------------------------------------------------------
let count = 0;
for (const p of data.pages) {
  const url = urlOf(p);
  const outDir = join(ROOT, url.replace(/^\//, ""));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), renderPage(p));
  count++;
  if (p.type === "work") {
    (p.cases || []).forEach((c, i, all) => {
      const dir = join(ROOT, "work", c.slug);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "index.html"), renderCase(c, i, all));
      count++;
    });
  }
}
console.log(`Generated ${count} service pages.`);
