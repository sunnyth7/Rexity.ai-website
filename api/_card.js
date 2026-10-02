// api/_card.js — the shareable score card of the Website-Check (Sprint 34, plan D34-2).
// The leading underscore keeps Vercel from exposing this file as a function; api/check.js renders it for
// GET /api/check?card=<host>[&p=<path>][&lang=en], reached as /website-check/ergebnis/<host> (vercel.json rewrite).
//
// What the page shows — and nothing else: the checked host, the overall score with its band, the four area scores
// with their bands, the date of the check and until when the result can be opened, the line "Geprüft mit dem
// Website-Check von Rexity Labs" and one button back to the tool. No verdict line, no Kurzfazit, no number of
// checks, no Lighthouse value, no finding, no advice: a subset of the public tier (docs/CHECK_API.md §1).
//
// Rules the page keeps:
//   - It never starts a check. api/check.js hands it a result only when one is stored and not older than 24 hours.
//   - noindex (header and meta): other people's scores must not become indexed pages about them.
//   - The Open Graph tags are the same for every site (title, text, one static image): a link preview kept by a
//     network for weeks therefore never carries a score that has long expired here.
//   - No script, no external file except the static preview image named in the meta tags; system fonts; every size
//     is fixed in the markup, so nothing shifts.
// Pure rendering: no network, no state. Tests: scripts/check-tool/test-check.mjs, section 22.

const SITE_ORIGIN = "https://www.rexity.ai";
const TOOL_PATH = "/website-check";
const CARD_PATH = "/website-check/ergebnis";
const OG_IMAGE = SITE_ORIGIN + "/assets/img/og/website-check.jpg";
const BLOCK_ORDER = ["tempo", "find", "contact", "trust"];

const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const T = (de, en) => ({ de, en });

const TEXT = {
  title: T("Website-Check: Ergebnis", "Website check: result"),
  ogTitle: T("Ergebnis im Website-Check von Rexity Labs", "Result in the website check by Rexity Labs"),
  ogDescription: T(
    "Gesamtwert und vier Bereiche von 0 bis 100: Tempo & Technik, Auffindbarkeit, Anfrage-Tauglichkeit, Vertrauen & Recht. Kostenlos die eigene Website prüfen.",
    "Overall value and four areas from 0 to 100: speed & technology, findability, readiness for enquiries, trust & legal. Check your own website for free."),
  eyebrow: T("Website-Check · Ergebnis", "Website check · result"),
  overall: T("Gesamt", "Overall"),
  of100: T("von 100 Punkten", "out of 100 points"),
  noOverall: T("kein Gesamtwert", "no overall value"),
  areas: T("Die vier Bereiche", "The four areas"),
  unchecked: T("nicht prüfbar", "could not be checked"),
  by: T("Geprüft mit dem Website-Check von Rexity Labs", "Checked with the website check by Rexity Labs"),
  cta: T("Eigene Website prüfen", "Check your own website"),
  ctaNow: T("Jetzt prüfen", "Check now"),
  how: T(
    "Die Werte stammen aus einer automatischen Prüfung der öffentlich erreichbaren Seite. Wie bewertet wird, steht auf der Seite des Website-Checks.",
    "The values come from an automatic check of the publicly reachable page. How it is scored is described on the website check's page."),
  owner: T(
    "Sie betreiben diese Website und möchten sie vom Website-Check ausnehmen?",
    "You run this website and want to exclude it from the website check?"),
  ownerLink: T("So geht es", "This is how"),
  noneTitle: T("Noch kein Ergebnis", "No result yet"),
  none: T(
    "Für {host} liegt gerade kein Ergebnis vor: Die Website wurde noch nicht geprüft, oder das letzte Ergebnis ist älter als 24 Stunden.",
    "There is no result for {host} at the moment: the website has not been checked yet, or the last result is older than 24 hours."),
  optoutTitle: T("Kein Ergebnis für diese Website", "No result for this website"),
  optout: T(
    "Für diese Website zeigen wir kein Ergebnis: Ihr Betreiber hat uns gebeten, sie vom Website-Check auszunehmen.",
    "We show no result for this website: its owner asked us to leave it out of the website check."),
  badTitle: T("Diese Adresse kennen wir nicht", "We do not know this address"),
  bad: T(
    "Die Adresse in diesem Link ist keine Website, die der Website-Check prüft.",
    "The address in this link is not a website the website check examines."),
  rateTitle: T("Bitte kurz warten", "Please wait a moment"),
  rate: T(
    "Das waren viele Aufrufe in kurzer Zeit. Bitte versuchen Sie es in einigen Minuten erneut.",
    "That was a lot of requests in a short time. Please try again in a few minutes."),
  tool: T("Zum Website-Check", "To the website check"),
  imprint: T("Impressum", "Legal notice"),
  privacy: T("Datenschutz", "Privacy"),
  other: T("English", "Deutsch")
};

const CSS =
  "*,*::before,*::after{box-sizing:border-box}" +
  "html{-webkit-text-size-adjust:100%}" +
  "body{margin:0;font-family:system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;font-size:1rem;line-height:1.5;color:#17152b;background:#f4f1fc}" +
  "main{max-width:30rem;margin:0 auto;padding:1.25rem 1rem 2.5rem}" +
  ".brand{display:inline-flex;align-items:center;gap:.5rem;min-height:2.75rem;font-weight:700;font-size:1.0625rem;color:#17152b;text-decoration:none}" +
  ".brand svg{display:block;width:1.5rem;height:1.5rem}" +
  ".card{margin:.75rem 0 1.25rem;padding:1.5rem 1.25rem;background:#fff;border:1px solid #e3ddf6;border-radius:1rem}" +
  ".eyebrow{margin:0 0 .25rem;font-size:.8125rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#5b3fd6}" +
  "h1{margin:0 0 1.25rem;font-size:1.375rem;line-height:1.25;overflow-wrap:anywhere}" +
  "h2{margin:0 0 .5rem;font-size:.875rem;font-weight:600;color:#4a4763}" +
  "p{margin:0 0 1rem}" +
  ".overall{display:flex;align-items:center;gap:1rem;margin:0 0 1.5rem}" +
  ".ring{flex:0 0 7rem;width:7rem;height:7rem;position:relative}" +
  ".ring svg{display:block;width:7rem;height:7rem;transform:rotate(-90deg)}" +
  ".ring b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:2.25rem;line-height:1;font-weight:700;font-variant-numeric:tabular-nums}" +
  ".overall p{margin:0}" +
  ".label{font-size:.875rem;color:#4a4763}" +
  ".band{display:inline-block;margin-top:.25rem;padding:.125rem .625rem;border:1px solid #5b3fd6;border-radius:999px;font-size:.875rem;font-weight:600;color:#3d2aa3;background:#f4f1fc}" +
  "ul{list-style:none;margin:0 0 1.25rem;padding:0}" +
  "li{display:grid;grid-template-columns:1fr auto;column-gap:.75rem;row-gap:.375rem;align-items:baseline;padding:.75rem 0;border-top:1px solid #ece8f8}" +
  "li .v{font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}" +
  "li .v span{font-weight:400;color:#4a4763}" +
  ".bar{grid-column:1/-1;display:block;height:.375rem;border-radius:999px;background:#ece8f8;overflow:hidden}" +
  ".bar i{display:block;height:100%;border-radius:999px;background:#5b3fd6}" +
  ".meta{font-size:.875rem;color:#4a4763}" +
  ".by{font-weight:600}" +
  ".b{display:block;min-height:3rem;padding:.75rem 1.25rem;border-radius:.625rem;background:#5b3fd6;color:#fff;font-weight:600;text-align:center;text-decoration:none}" +
  ".b:hover{background:#4a31bd}" +
  ".s{font-size:.875rem;color:#4a4763}" +
  "a{color:#3d2aa3}" +
  "a:focus-visible{outline:3px solid #17152b;outline-offset:3px;border-radius:.25rem}" +
  ".foot{margin:1.5rem 0 0;font-size:.875rem;color:#4a4763}" +
  "@media (min-width:36rem){main{padding-top:2.5rem}.card{padding:2rem}h1{font-size:1.625rem}}" +
  "@media (forced-colors:active){.bar i{background:Highlight}.b{border:1px solid ButtonText}}";

// The brand mark of assets/brand/final/rexity-mark.svg (two paths), drawn inline so the page needs no file.
const MARK =
  '<svg viewBox="30 30 200 205" aria-hidden="true" focusable="false"><path fill="currentColor" d="M45.7 43.8h99.1c43.4 0 73.8 28.8 73.8 70.6 0 28.1-14 51.6-36.7 63.6l27.8 27.8c9.1 9.1 2.7 24.7-10.2 24.7h-28.8c-3.8 0-7.4-1.5-10.2-4.2l-55.1-55.1H74.2c-13.3 0-19.6-16.3-9.8-25.3l.6-.5c2.7-2.4 6.1-3.7 9.8-3.7h69.4c18.4 0 32.1-11.6 32.1-29.1 0-17.9-13.7-29.6-32.1-29.6H67.8c-4.1 0-8-1.7-10.7-4.8L35 54.1c-5.9-6.5-1.3-16.8 7.5-16.8 1.2 0 2.3.2 3.2.5Z"/><path fill="currentColor" d="M55.7 157.8h26.8c4.1 0 8.1 1.7 10.9 4.7l35.5 38c8.4 9 2 23.8-10.3 23.8H55.7c-7.8 0-14.2-6.4-14.2-14.2v-38.1c0-7.8 6.4-14.2 14.2-14.2Z"/></svg>';

const fmtDate = (ms, lang) => {
  try {
    const s = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "de-DE", { timeZone: "Europe/Berlin", dateStyle: "long", timeStyle: "short" }).format(new Date(ms));
    return lang === "en" ? s : s + " Uhr";
  } catch (_e) {
    return new Date(ms).toISOString();
  }
};

// The address of a card: /website-check/ergebnis/<host>, a checked sub-page as ?p=/path, English as ?lang=en.
function cardPath(host, pagePath, lang) {
  const q = [];
  if (pagePath && pagePath !== "/") q.push("p=" + encodeURIComponent(pagePath));
  if (lang === "en") q.push("lang=en");
  return CARD_PATH + "/" + encodeURIComponent(String(host || "").toLowerCase()) + (q.length ? "?" + q.join("&") : "");
}

function ring(score) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const part = typeof score === "number" ? Math.max(0, Math.min(100, score)) / 100 : 0;
  return '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#ece8f8" stroke-width="10"/>' +
    (part > 0 ? '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#5b3fd6" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + (c * part).toFixed(1) + " " + c.toFixed(1) + '"/>' : "") + "</svg>";
}

function resultHtml(view, L, ttlMs) {
  const o = view.overall || {};
  const has = typeof o.score === "number";
  const checked = Date.parse(view.checkedAt);
  const until = checked + ttlMs;
  const hours = Math.round(ttlMs / 3600000);
  const meta = L === "en"
    ? `Result of ${fmtDate(checked, L)}, available for ${hours} hours (until ${fmtDate(until, L)}).`
    : `Ergebnis vom ${fmtDate(checked, L)}, ${hours} Stunden abrufbar (bis ${fmtDate(until, L)}).`;
  const rows = BLOCK_ORDER.filter((id) => view.blocks && view.blocks[id]).map((id) => {
    const b = view.blocks[id];
    const scored = b.checked && typeof b.score === "number";
    return "<li><span>" + esc(b.name) + "</span>" +
      (scored
        ? '<span class="v">' + b.score + " <span>· " + esc(b.bandLabel || "") + "</span></span>" + '<span class="bar" aria-hidden="true"><i style="width:' + Math.max(0, Math.min(100, b.score)) + '%"></i></span>'
        : '<span class="v"><span>' + esc(TEXT.unchecked[L]) + "</span></span>" + '<span class="bar" aria-hidden="true"></span>') +
      "</li>";
  }).join("");
  return '<article class="card" aria-labelledby="wc-card-title">' +
    '<p class="eyebrow">' + esc(TEXT.eyebrow[L]) + "</p>" +
    '<h1 id="wc-card-title">' + esc(view.host) + "</h1>" +
    '<div class="overall"><div class="ring">' + ring(has ? o.score : null) + "<b>" + (has ? o.score : "–") + "</b></div>" +
    "<div><p class=\"label\">" + esc(TEXT.overall[L]) + "</p>" +
    (has
      ? "<p><strong>" + o.score + "</strong> " + esc(TEXT.of100[L]) + '</p><p><span class="band">' + esc(o.bandLabel || "") + "</span></p>"
      : "<p><strong>" + esc(TEXT.noOverall[L]) + "</strong></p>") +
    "</div></div>" +
    "<h2>" + esc(TEXT.areas[L]) + "</h2><ul>" + rows + "</ul>" +
    '<p class="meta">' + esc(meta) + "</p>" +
    '<p class="by">' + esc(TEXT.by[L]) + "</p>" +
    '<a class="b" href="' + TOOL_PATH + '">' + esc(TEXT.cta[L]) + "</a>" +
    "</article>" +
    '<p class="s">' + esc(TEXT.how[L]) + ' <a href="' + TOOL_PATH + '">' + esc(TEXT.tool[L]) + "</a></p>" +
    '<p class="s">' + esc(TEXT.owner[L]) + ' <a href="' + TOOL_PATH + '/bot">' + esc(TEXT.ownerLink[L]) + "</a></p>";
}

function messageHtml(state, host, L) {
  const title = TEXT[state + "Title"][L];
  const text = esc(TEXT[state][L]).replace("{host}", "<strong>" + esc(host) + "</strong>");
  return '<article class="card" aria-labelledby="wc-card-title">' +
    '<p class="eyebrow">' + esc(TEXT.eyebrow[L]) + "</p>" +
    '<h1 id="wc-card-title">' + esc(title) + "</h1>" +
    "<p>" + text + "</p>" +
    (state === "rate" ? "" : '<a class="b" href="' + TOOL_PATH + '">' + esc(state === "none" ? TEXT.ctaNow[L] : TEXT.cta[L]) + "</a>") +
    "</article>";
}

// -> the whole document. card = { state: "result" | "none" | "optout" | "bad" | "rate", host, path?, view?, ttlMs? }
function renderCard(card, lang) {
  const L = lang === "en" ? "en" : "de";
  const state = ["result", "none", "optout", "bad", "rate"].includes(card && card.state) ? card.state : "bad";
  const host = String((card && card.host) || "");
  const known = state === "result" || state === "none";
  const self = known ? cardPath(host, card.path, L) : CARD_PATH;
  const other = known ? cardPath(host, card.path, L === "en" ? "de" : "en") : CARD_PATH + (L === "en" ? "" : "?lang=en");
  const body = state === "result" ? resultHtml(card.view, L, card.ttlMs || 24 * 3600000) : messageHtml(state, host, L);
  return "<!doctype html><html lang=\"" + L + "\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
    "<meta name=\"robots\" content=\"noindex\"><title>" + esc(TEXT.title[L]) + " | Rexity Labs</title>" +
    "<meta name=\"description\" content=\"" + esc(TEXT.ogDescription[L]) + "\">" +
    "<meta property=\"og:type\" content=\"website\"><meta property=\"og:site_name\" content=\"Rexity Labs\"><meta property=\"og:locale\" content=\"" + (L === "en" ? "en_GB" : "de_DE") + "\">" +
    "<meta property=\"og:title\" content=\"" + esc(TEXT.ogTitle[L]) + "\"><meta property=\"og:description\" content=\"" + esc(TEXT.ogDescription[L]) + "\">" +
    "<meta property=\"og:url\" content=\"" + esc(SITE_ORIGIN + self) + "\"><meta property=\"og:image\" content=\"" + OG_IMAGE + "\"><meta property=\"og:image:width\" content=\"1200\"><meta property=\"og:image:height\" content=\"630\">" +
    "<meta property=\"og:image:alt\" content=\"" + esc(TEXT.ogTitle[L]) + "\">" +
    "<meta name=\"twitter:card\" content=\"summary_large_image\"><meta name=\"twitter:title\" content=\"" + esc(TEXT.ogTitle[L]) + "\"><meta name=\"twitter:description\" content=\"" + esc(TEXT.ogDescription[L]) + "\"><meta name=\"twitter:image\" content=\"" + OG_IMAGE + "\">" +
    "<meta name=\"theme-color\" content=\"#f4f1fc\"><link rel=\"icon\" href=\"/assets/brand/final/favicon.svg\" type=\"image/svg+xml\">" +
    "<style>" + CSS + "</style></head>" +
    "<body><main data-wc-card=\"" + state + "\"><a class=\"brand\" href=\"/\">" + MARK + "<span>Rexity Labs</span></a>" + body +
    "<p class=\"foot\"><a href=\"" + esc(other) + "\" lang=\"" + (L === "en" ? "de" : "en") + "\" hreflang=\"" + (L === "en" ? "de" : "en") + "\">" + esc(TEXT.other[L]) + "</a> · Rexity Labs UG (haftungsbeschränkt) · " +
    "<a href=\"/impressum\">" + esc(TEXT.imprint[L]) + "</a> · <a href=\"/datenschutz\">" + esc(TEXT.privacy[L]) + "</a></p></main></body></html>";
}

module.exports = { renderCard, cardPath, CARD_PATH };
