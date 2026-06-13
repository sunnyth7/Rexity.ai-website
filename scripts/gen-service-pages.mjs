#!/usr/bin/env node
/* gen-service-pages.mjs — generates the static service hub + sub-pages from
   data/services.json into the site root. Run from the repo root:
       node scripts/gen-service-pages.mjs
   Output: /<slug>/index.html (hubs + standalones) and
           /<parent>/<slug>/index.html (sub-services).
   These pages share the brand (self-hosted Inter, brand palette, chatbot,
   DE/EN via the same rexity_lang localStorage key as the homepage). */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(ROOT, "data/services.json"), "utf8"));
const CHAT_V = "20260615"; // keep in sync with the homepage chatbot cache-buster
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
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#f5f5f3">
<link rel="icon" href="/rexity-omi/assets/brand/final/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/rexity-omi/assets/brand/final/apple-touch-icon.png">
<link rel="stylesheet" href="/rexity-omi/assets/vendor/css/inter.css">
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
  <p class="rx-ft-copy">© Rexity Labs UG ${"2026"}. ${"<span data-en=\"All rights reserved.\" data-de=\"Alle Rechte vorbehalten.\">Alle Rechte vorbehalten.</span>"}</p>
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
</body></html>`;
}

function list(bi) {
  // bi = {en:[],de:[]} → bilingual <li> by index
  return bi.de
    .map((d, i) => `<li><span data-en="${esc(bi.en[i] ?? d)}" data-de="${esc(d)}">${esc(d)}</span></li>`)
    .join("");
}

function heroBlock(p, isHub) {
  return `<section class="rx-hero">
  <div class="rx-code">${esc(p.code)}</div>
  ${t(p.title, "h1", "")}
  ${t(p.tagline, "p", "rx-tag")}
  ${t(isHub ? p.hero : p.summary, "p", "rx-lead")}
  <a class="rx-btn" href="mailto:${EMAIL}">${"<span data-en=\"Start a conversation\" data-de=\"Gespräch starten\">Gespräch starten</span>"}</a>
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
  sections.push(`<section class="rx-sec"><h2 data-en="What's included" data-de="Was dazugehört">Was dazugehört</h2><ul class="rx-ticks">${list(p.offerings)}</ul></section>`);
  sections.push(`<section class="rx-sec rx-alt"><h2 data-en="What you get" data-de="Was Sie bekommen">Was Sie bekommen</h2><ul class="rx-ticks">${list(p.outcomes)}</ul></section>`);
  const steps = p.process
    .map(
      (s, i) => `<div class="rx-step"><span class="rx-step-n">${i + 1}</span><div>${t(s.title, "h3", "")}${t(s.body, "p", "")}</div></div>`
    )
    .join("");
  sections.push(`<section class="rx-sec"><h2 data-en="How we work" data-de="Wie wir arbeiten">Wie wir arbeiten</h2><div class="rx-steps">${steps}</div></section>`);
  if (p.who) sections.push(`<section class="rx-sec rx-who">${t(p.who, "p", "")}</section>`);
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
        return `<a class="rx-rel" href="${urlOf(c)}">${t(c.title, "span", "")}</a>`;
      })
      .join("");
    sections.push(`<section class="rx-sec"><h2 data-en="Related services" data-de="Verwandte Leistungen">Verwandte Leistungen</h2><div class="rx-rels">${rel}</div></section>`);
  }
  return sections.join("\n");
}

function renderPage(p) {
  const isHub = p.type === "hub";
  const body = isHub ? childCards(p) : leafBody(p);
  const crumb = p.parent
    ? `<nav class="rx-crumb"><a href="/">Home</a> / <a href="/${p.parent}">${esc(byslug[p.parent].title.de)}</a> / <span>${esc(p.title.de)}</span></nav>`
    : `<nav class="rx-crumb"><a href="/">Home</a> / <span>${esc(p.title.de)}</span></nav>`;
  return `${head(p)}${header()}<main>${crumb}${heroBlock(p, isHub)}${body}</main>${tail()}`;
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
.rx-sec{padding:40px 0;border-bottom:1px solid var(--line)}
.rx-sec>h2{font-size:13px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:22px}
.rx-alt{background:linear-gradient(0deg,#fff,#fff);}
.rx-ticks{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
.rx-ticks li{position:relative;padding-left:28px;font-size:16px}
.rx-ticks li:before{content:"";position:absolute;left:0;top:8px;width:14px;height:14px;border-radius:50%;background:var(--red);opacity:.16}
.rx-ticks li:after{content:"";position:absolute;left:5px;top:11px;width:4px;height:7px;border:2px solid var(--red);border-top:0;border-left:0;transform:rotate(40deg)}
.rx-steps{display:grid;gap:18px}
.rx-step{display:flex;gap:18px;align-items:flex-start;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px 22px}
.rx-step-n{flex:none;width:34px;height:34px;border-radius:50%;background:var(--black);color:#fff;display:grid;place-items:center;font-weight:700;font-size:15px}
.rx-step h3{font-size:18px;font-weight:700;margin-bottom:4px}
.rx-step p{margin:0;color:var(--muted);font-size:15px}
.rx-who p{font-size:21px;font-weight:600;letter-spacing:-.01em;max-width:34ch;color:var(--ink)}
.rx-note p{font-size:14px;color:var(--muted);background:#fff;border:1px solid var(--line);border-left:3px solid var(--red);border-radius:10px;padding:14px 16px;margin:0}
.rx-chips,.rx-rels{display:flex;flex-wrap:wrap;gap:10px}
.rx-chip{font-size:13px;font-weight:500;color:var(--muted);background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:7px 14px}
.rx-faq{padding:16px 0;border-top:1px solid var(--line)}
.rx-faq:first-of-type{border-top:0}
.rx-faq h3{font-size:17px;font-weight:700;margin-bottom:6px}
.rx-faq p{margin:0;color:var(--muted)}
.rx-rel{font-size:15px;font-weight:600;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 16px;transition:border-color .15s}
.rx-rel:hover{border-color:var(--red)}
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
}
console.log(`Generated ${count} service pages.`);
