// api/_sources.js — further data sources of the Website-Check (Sprint 40). The leading underscore keeps Vercel from
// exposing this file as a function; api/check.js runs it.
//
// A. Free sources, for every check and every door (collect): each one is a single lookup with a short timeout that
//    runs in parallel with the speed measurement. A lookup that fails makes its own row "nicht prüfbar", never the
//    check. The requests this part may make (requestList() is this list as data; gate() refuses anything else):
//      1. POST https://chromeuxreport.googleapis.com/v1/records:queryRecord   Chrome UX Report API: p75 of LCP, INP and
//         CLS of real Chrome users on phones over 28 days; first for the page, then for the whole site (origin).
//         Sent: the checked address. Needs the Google key (PAGESPEED_API_KEY) with the API enabled in that project.
//      2. GET  https://data.iana.org/rdap/dns.json                            IANA's list of RDAP servers per ending
//         (kept one day; carries nothing about the checked site)
//      3. GET  <RDAP server of the ending>domain/<registrable domain>         the registry's public record: the
//         expiration event. Sent: the domain name. Redirects are not followed.
//      4. GET  https://api.thegreenwebfoundation.org/api/v3/greencheck/<host> Green Web Foundation: is the host's
//         provider listed as running on renewable energy. Sent: the host name.
//    Documentation and terms read on 3 Oct 2026: docs/logs/sprint-40-sources.md.
//
// B. Paid sources (paid): DataForSEO, per call. NEVER part of a check. api/check.js calls this only after an e-mail
//    address was confirmed through the signed link (double opt-in) and its caps were taken; the result goes into the
//    report e-mail and the signed view link, never into a cached report, the anonymous answer, GET, MCP or the
//    score card. The requests (paidRequestList()):
//      5. POST https://api.dataforseo.com/v3/serp/google/organic/live/regular   Google Germany, German, first 50
//         organic results for "<Gewerk> <Ort>". Sent: the search term.
//      6. POST https://api.dataforseo.com/v3/backlinks/summary/live             the provider's backlink index for the
//         registrable domain. Sent: the domain name.
//    Never sent to any of the six: an e-mail address, an IP address, anything else about the visitor.
//
// Wording (founder): what was measured and what it means. No advice, no endorsement ("von Google geprüft" and the
// like are forbidden; the data source is named factually).
// Tests: scripts/check-tool/test-check.mjs, section 27 (stubs; nothing leaves the machine).

const T = (de, en) => ({ de, en });

const CRUX_URL = "https://chromeuxreport.googleapis.com/v1/records:queryRecord";
const IANA_URL = "https://data.iana.org/rdap/dns.json";
const GREEN_URL = "https://api.thegreenwebfoundation.org/api/v3/greencheck/";
const DFS_SERP_URL = "https://api.dataforseo.com/v3/serp/google/organic/live/regular";
const DFS_BACKLINKS_URL = "https://api.dataforseo.com/v3/backlinks/summary/live";

const CRUX_TIMEOUT_MS = 4000; // one query (two at most: page, then site)
const RDAP_TIMEOUT_MS = 5000;
const GREEN_TIMEOUT_MS = 5000;
const BUDGET_MS = 9000; // all free lookups together
const IANA_CACHE_MS = 24 * 60 * 60 * 1000;
const DFS_TIMEOUT_MS = 20000;
const SERP_DEPTH = 50;

// Points of the field data inside "Tempo & Technik". They are added to the area's lab points (100) only when the
// Chrome UX Report has a record: the area's score is points reached / points possible over the checks that could be
// carried out, so a site without field data keeps exactly the score its lab values give.
const WEIGHTS = { fieldLcp: 10, fieldInp: 10, fieldCls: 10 };
// Google's published thresholds for the 75th percentile (web.dev/articles/defining-core-web-vitals-thresholds, read
// 3 Oct 2026): good up to the first value, poor above the second, "needs improvement" between.
const THRESHOLDS = { lcpMs: [2500, 4000], inpMs: [200, 500], cls: [0.1, 0.25] };
const EXPIRY_FLAG_DAYS = 30;
// List prices in USD, read on 3 Oct 2026 (dataforseo.com/pricing): the SERP in live mode costs 0.002 per 10 results,
// so 50 results cost 0.01; a backlinks request costs 0.024 plus 0.000036 per row (the summary is one row).
const PRICE_USD = { serp: 0.002 * (SERP_DEPTH / 10), backlinks: 0.024 + 0.000036 };

// ---- The lists of requests --------------------------------------------------------------------------------
// ctx: { url, host, domain, rdapBase? } -> the only requests the free part may make for that site
function requestList(ctx) {
  const list = ["POST " + CRUX_URL, "GET " + IANA_URL, "GET " + GREEN_URL + ctx.host];
  if (ctx.rdapBase && ctx.domain) list.push("GET " + ctx.rdapBase + "domain/" + ctx.domain);
  return list;
}
function paidRequestList() {
  return ["POST " + DFS_SERP_URL, "POST " + DFS_BACKLINKS_URL];
}
function gate(list) {
  const allowed = new Set(list);
  return (key) => { if (!allowed.has(key)) throw new Error("sources: request outside the list: " + key); };
}
const HOST_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

// one request with its own timeout -> { status, json } (json: null when the body is not JSON); throws on network errors
async function request(io, url, opt, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await io.fetch(url, { ...opt, signal: ctrl.signal, redirect: "error" });
    let json = null;
    try { json = JSON.parse(await resp.text()); } catch (_e) { /* not JSON */ }
    return { status: resp.status, json };
  } finally {
    clearTimeout(timer);
  }
}
const within = (promise, ms, fallback) => {
  let timer;
  return Promise.race([promise, new Promise((resolve) => { timer = setTimeout(() => resolve(fallback), ms); })]).finally(() => clearTimeout(timer));
};
const reasonOf = (e) => (e && e.name === "AbortError" ? "timeout" : "network");

// ---- 1. Chrome UX Report --------------------------------------------------------------------------------
// -> { state: "ok", scope: "page" | "site", lcpMs, inpMs, cls, from, to } (a value may be null)
//    { state: "none" }                       no record for the page and none for the site (too few visits)
//    { state: "off", reason }                no key, API not enabled (403), quota, error, timeout
const numOf = (v) => { const n = typeof v === "string" ? parseFloat(v) : v; return Number.isFinite(n) && n >= 0 ? n : null; };
const dateOf = (d) => (d && Number.isInteger(d.year) && Number.isInteger(d.month) && Number.isInteger(d.day) ? `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}` : "");
function readCrux(json, scope) {
  const rec = json && json.record;
  const m = rec && rec.metrics;
  if (!m || typeof m !== "object") return null;
  const p75 = (name) => (m[name] && m[name].percentiles ? numOf(m[name].percentiles.p75) : null);
  const out = { state: "ok", scope, lcpMs: p75("largest_contentful_paint"), inpMs: p75("interaction_to_next_paint"), cls: p75("cumulative_layout_shift"),
    from: dateOf(rec.collectionPeriod && rec.collectionPeriod.firstDate), to: dateOf(rec.collectionPeriod && rec.collectionPeriod.lastDate) };
  return out.lcpMs === null && out.inpMs === null && out.cls === null ? null : out;
}
async function crux(io, check, url, key) {
  if (!key) return { state: "off", reason: "no_key" };
  let origin;
  try { origin = new URL(url).origin; } catch (_e) { return { state: "off", reason: "bad_url" }; }
  const metrics = ["largest_contentful_paint", "interaction_to_next_paint", "cumulative_layout_shift"];
  const ask = async (body) => {
    check("POST " + CRUX_URL);
    // the key travels in a header, never in the address (addresses end up in logs)
    return request(io, CRUX_URL, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", "X-Goog-Api-Key": key }, body: JSON.stringify({ ...body, formFactor: "PHONE", metrics }) }, CRUX_TIMEOUT_MS);
  };
  try {
    for (const [scope, body] of [["page", { url }], ["site", { origin }]]) {
      const r = await ask(body);
      if (r.status === 200) { const rec = readCrux(r.json, scope); if (rec) return rec; continue; }
      if (r.status === 404) continue; // "chrome ux report data not found": no record for this address
      return { state: "off", reason: r.status === 403 ? "disabled" : r.status === 429 ? "quota" : "http_" + r.status };
    }
    return { state: "none" };
  } catch (e) {
    return { state: "off", reason: reasonOf(e) };
  }
}

// ---- 2. Domain expiry (RDAP) ----------------------------------------------------------------------------
// -> { state: "ok", expires: <ms> }
//    { state: "nodate" }      the registry answers but publishes no expiration event
//    { state: "noserver" }    IANA lists no RDAP server for the ending (e.g. .de): the registry publishes none
//    { state: "notfound" }    the registry does not know the domain (404)
//    { state: "off", reason } error, timeout, rate limit
let ianaCache = { at: -Infinity, map: null };
function readBootstrap(json) {
  const map = new Map();
  for (const svc of (json && Array.isArray(json.services) ? json.services : [])) {
    if (!Array.isArray(svc) || !Array.isArray(svc[0]) || !Array.isArray(svc[1])) continue;
    const base = svc[1].map(String).find((u) => /^https:\/\/[a-z0-9.-]+(\/[A-Za-z0-9._~\/-]*)?$/i.test(u));
    if (!base) continue;
    for (const tld of svc[0]) map.set(String(tld).toLowerCase(), base.endsWith("/") ? base : base + "/");
  }
  return map.size ? map : null;
}
async function rdapBaseOf(io, check, domain, now) {
  if (!ianaCache.map || now - ianaCache.at > IANA_CACHE_MS) {
    check("GET " + IANA_URL);
    const r = await request(io, IANA_URL, { headers: { Accept: "application/json" } }, RDAP_TIMEOUT_MS);
    const map = r.status === 200 ? readBootstrap(r.json) : null;
    if (!map) throw Object.assign(new Error("bootstrap"), { reason: "bootstrap" });
    ianaCache = { at: now, map };
  }
  // the longest listed ending wins ("co.uk" before "uk")
  const labels = domain.split(".");
  for (let i = 1; i < labels.length; i++) {
    const base = ianaCache.map.get(labels.slice(i).join("."));
    if (base) return base;
  }
  return "";
}
async function rdap(io, ctx, now) {
  const domain = String(ctx.domain || "").toLowerCase();
  if (!HOST_RE.test(domain)) return { state: "off", reason: "no_domain" };
  try {
    const base = await rdapBaseOf(io, gate(requestList(ctx)), domain, now);
    if (!base) return { state: "noserver" };
    const url = base + "domain/" + domain;
    gate(requestList({ ...ctx, rdapBase: base }))("GET " + url);
    const r = await request(io, url, { headers: { Accept: "application/rdap+json, application/json" } }, RDAP_TIMEOUT_MS);
    if (r.status === 404) return { state: "notfound" };
    if (r.status !== 200 || !r.json) return { state: "off", reason: r.status === 429 ? "quota" : "http_" + r.status };
    const ev = (Array.isArray(r.json.events) ? r.json.events : []).find((e) => e && String(e.eventAction || "").toLowerCase() === "expiration");
    const t = ev ? Date.parse(ev.eventDate) : NaN;
    return Number.isFinite(t) ? { state: "ok", expires: t } : { state: "nodate" };
  } catch (e) {
    return { state: "off", reason: e && e.reason ? e.reason : reasonOf(e) };
  }
}

// ---- 3. Green hosting (Green Web Foundation) --------------------------------------------------------------
// -> { state: "ok", green: true | false, provider } | { state: "off", reason }
async function green(io, check, host) {
  const h = String(host || "").toLowerCase();
  if (!HOST_RE.test(h)) return { state: "off", reason: "no_host" };
  try {
    check("GET " + GREEN_URL + h);
    const r = await request(io, GREEN_URL + h, { headers: { Accept: "application/json" } }, GREEN_TIMEOUT_MS);
    if (r.status !== 200 || !r.json || typeof r.json.green !== "boolean") return { state: "off", reason: r.status === 200 ? "no_result" : "http_" + r.status };
    return { state: "ok", green: r.json.green, provider: typeof r.json.hosted_by === "string" ? r.json.hosted_by.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) : "" };
  } catch (e) {
    return { state: "off", reason: reasonOf(e) };
  }
}

// ctx: { url, host, domain, key, now } ; io: { fetch } -> { crux, expiry, green, ms }. Never throws.
async function collect(ctx, io) {
  const t0 = Date.now();
  const ms = {};
  const timed = (name, p) => p.then((v) => { ms[name] = Date.now() - t0; return v; });
  const off = { state: "off", reason: "timeout" };
  const check = gate(requestList(ctx));
  const safe = (p) => p.catch((e) => ({ state: "off", reason: /outside the list/.test(String(e && e.message)) ? "gate" : "error" }));
  const [c, e, g] = await Promise.all([
    within(timed("crux", safe(crux(io, check, ctx.url, ctx.key))), BUDGET_MS, off),
    within(timed("rdap", safe(rdap(io, ctx, ctx.now))), BUDGET_MS, off),
    within(timed("green", safe(green(io, check, ctx.host))), BUDGET_MS, off)
  ]);
  return { crux: c, expiry: e, green: g, ms };
}

// ---- The rows ------------------------------------------------------------------------------------------
const de1 = (n, digits) => n.toFixed(digits).replace(".", ",");
const band = (v, [good, poor]) => (v <= good ? 1 : v <= poor ? 0.5 : 0);
const BAND_WORD = { 1: T("gut", "good"), 0.5: T("verbesserungswürdig", "needs improvement"), 0: T("schwach", "poor") };
const FIELD_LABEL = {
  lcp: T("Felddaten: Aufbau des größten Elements bei echten Besuchern (LCP)", "Field data: largest element painted for real users (LCP)"),
  inp: T("Felddaten: Reaktion auf Eingaben bei echten Besuchern (INP)", "Field data: response to input for real users (INP)"),
  cls: T("Felddaten: Verschiebungen im Layout bei echten Besuchern (CLS)", "Field data: layout shifts for real users (CLS)"),
  all: T("Tempo bei echten Besuchern (Felddaten aus dem Chrome UX Report)", "Speed for real users (field data from the Chrome UX Report)")
};
const SOURCE_NOTE = T(
  "Felddaten aus dem Chrome UX Report: 75. Perzentil echter Chrome-Nutzer auf Handys in den letzten 28 Tagen.",
  "Field data from the Chrome UX Report: 75th percentile of real Chrome users on phones over the last 28 days.");
// -> the rows of the field data for "Tempo & Technik" (mk of api/check.js builds a row)
function fieldItems(c, mk) {
  if (!c || c.state === "off") {
    return [mk("field", WEIGHTS.fieldLcp + WEIGHTS.fieldInp + WEIGHTS.fieldCls, null, FIELD_LABEL.all,
      T("nicht prüfbar: Die Felddaten ließen sich in diesem Lauf nicht abfragen.", "could not be checked: the field data could not be queried in this run."))];
  }
  if (c.state === "none") {
    return [mk("field", 0, 1, FIELD_LABEL.all,
      T("Für diese Website liegen keine Felddaten vor (zu wenige Besuche). Das zählt weder für noch gegen die Seite.", "There is no field data for this website (too few visits). This counts neither for nor against the page."))];
  }
  const scope = c.scope === "page" ? T("Wert dieser Seite", "value of this page") : T("Wert der gesamten Website", "value of the whole website");
  const tail = T(`${scope.de}; echte Chrome-Nutzer auf Handys, letzte 28 Tage, 75. Perzentil`, `${scope.en}; real Chrome users on phones, last 28 days, 75th percentile`);
  const none = T("für diesen Wert liegen keine Felddaten vor", "there is no field data for this value");
  const row = (id, weight, label, v, limits, fmt) => {
    if (v === null) return mk(id, weight, "na", label, none);
    const share = band(v, limits);
    return mk(id, weight, share, label, T(`${fmt(v, "de")} (${BAND_WORD[share].de}; ${tail.de})`, `${fmt(v, "en")} (${BAND_WORD[share].en}; ${tail.en})`));
  };
  const sec = (v, L) => (L === "de" ? de1(v / 1000, 1) : (v / 1000).toFixed(1)) + " s";
  const msf = (v) => Math.round(v) + " ms";
  const cls = (v, L) => (L === "de" ? de1(v, 2) : v.toFixed(2));
  return [
    row("fieldLcp", WEIGHTS.fieldLcp, FIELD_LABEL.lcp, c.lcpMs, THRESHOLDS.lcpMs, sec),
    row("fieldInp", WEIGHTS.fieldInp, FIELD_LABEL.inp, c.inpMs, THRESHOLDS.inpMs, msf),
    row("fieldCls", WEIGHTS.fieldCls, FIELD_LABEL.cls, c.cls, THRESHOLDS.cls, cls)
  ];
}

const dateText = (ms, L) => new Intl.DateTimeFormat(L === "de" ? "de-DE" : "en-GB", { timeZone: "Europe/Berlin", dateStyle: "long" }).format(new Date(ms));
// -> one note (no points) for "Sicherheit der Website"; flag "soon" under EXPIRY_FLAG_DAYS days, "expired" after the date
function expiryItem(e, domain, mk, now) {
  const label = T("Ablauf der Domain-Registrierung", "Expiry of the domain registration");
  if (!e || e.state === "off") return mk("domainExpiry", 0, null, label, T("nicht prüfbar: Die Registrierungsdaten ließen sich in diesem Lauf nicht abfragen.", "could not be checked: the registration data could not be queried in this run."));
  if (e.state === "noserver" || e.state === "nodate") return mk("domainExpiry", 0, 1, label, T(`Die Registrierungsstelle veröffentlicht kein Ablaufdatum (${domain}).`, `The registry publishes no expiry date (${domain}).`));
  if (e.state === "notfound") return mk("domainExpiry", 0, null, label, T(`nicht prüfbar: Die Registrierungsstelle kennt ${domain} nicht als eigene Registrierung.`, `could not be checked: the registry does not know ${domain} as a registration of its own.`));
  const days = Math.floor((e.expires - now) / 86400000);
  const item = e.expires < now
    ? mk("domainExpiry", 0, 1, label, T(`${domain}: laut Registrierungsstelle am ${dateText(e.expires, "de")} abgelaufen. Eine abgelaufene Registrierung kann gelöscht und neu vergeben werden.`, `${domain}: expired on ${dateText(e.expires, "en")} according to the registry. An expired registration can be deleted and given to someone else.`))
    : days < EXPIRY_FLAG_DAYS
    ? mk("domainExpiry", 0, 1, label, T(`${domain}: registriert bis ${dateText(e.expires, "de")}, das sind weniger als ${EXPIRY_FLAG_DAYS} Tage (noch ${days}). Ohne Verlängerung ist die Website danach nicht mehr erreichbar.`, `${domain}: registered until ${dateText(e.expires, "en")}, which is less than ${EXPIRY_FLAG_DAYS} days away (${days} left). Without renewal the website can no longer be reached after that.`))
    : mk("domainExpiry", 0, 1, label, T(`${domain}: registriert bis ${dateText(e.expires, "de")} (laut Registrierungsstelle; viele Registrierungen verlängern sich automatisch).`, `${domain}: registered until ${dateText(e.expires, "en")} (according to the registry; many registrations renew automatically).`));
  if (e.expires < now) item.flag = "expired";
  else if (days < EXPIRY_FLAG_DAYS) item.flag = "soon";
  return item;
}

// -> one note (no points) for "Tempo & Technik"
function greenItem(g, host, mk) {
  const label = T("Hosting mit Strom aus erneuerbaren Quellen (Green Web Foundation)", "Hosting on renewable energy (Green Web Foundation)");
  if (!g || g.state !== "ok") return mk("greenHosting", 0, null, label, T("nicht prüfbar: Das Verzeichnis der Green Web Foundation hat in diesem Lauf nicht geantwortet.", "could not be checked: the Green Web Foundation's directory did not answer in this run."));
  if (g.green) {
    return mk("greenHosting", 0, 1, label, g.provider
      ? T(`Laut Green Web Foundation wird ${host} bei einem Anbieter betrieben, der dort mit Nachweis für Strom aus erneuerbaren Quellen verzeichnet ist: ${g.provider}.`, `According to the Green Web Foundation, ${host} runs at a provider listed there with evidence of renewable energy: ${g.provider}.`)
      : T(`Laut Green Web Foundation ist ${host} mit Nachweis für Strom aus erneuerbaren Quellen verzeichnet.`, `According to the Green Web Foundation, ${host} is listed with evidence of renewable energy.`));
  }
  return mk("greenHosting", 0, 1, label, T(`Laut Green Web Foundation ist für ${host} kein Anbieter mit Nachweis für Strom aus erneuerbaren Quellen verzeichnet. Das Verzeichnis beruht auf Angaben der Anbieter.`, `According to the Green Web Foundation, no provider with evidence of renewable energy is listed for ${host}. The directory is based on what providers submit.`));
}

// ---- B. Paid sources (DataForSEO) ---------------------------------------------------------------------------
const costOf = (json) => { const c = json && Number(json.cost); return Number.isFinite(c) && c > 0 ? c : 0; };
const taskOf = (json) => (json && Array.isArray(json.tasks) ? json.tasks[0] : null);
async function dfs(io, url, auth, body) {
  paidGate("POST " + url);
  return request(io, url, { method: "POST", headers: { Authorization: "Basic " + auth, "Content-Type": "application/json" }, body: JSON.stringify([body]) }, DFS_TIMEOUT_MS);
}
const paidGate = gate(paidRequestList());

// Google Germany, organic, first 50 -> { query, checked, position (1…50 | null), top: [three domains], usd }
async function serpPosition(io, auth, keyword, domain, baseDomain) {
  const out = { query: keyword, checked: false, position: null, top: [], depth: SERP_DEPTH, usd: 0 };
  try {
    const r = await dfs(io, DFS_SERP_URL, auth, { keyword, location_code: 2276, language_code: "de", depth: SERP_DEPTH, device: "desktop" });
    out.usd = costOf(r.json);
    const task = taskOf(r.json);
    const result = task && Array.isArray(task.result) ? task.result[0] : null;
    if (r.status !== 200 || !result || !Array.isArray(result.items)) return { ...out, reason: r.status !== 200 ? "http_" + r.status : "task_" + ((task && task.status_code) || "none") };
    const organic = result.items.filter((i) => i && i.type === "organic" && typeof i.domain === "string" && HOST_RE.test(i.domain.toLowerCase()));
    const hit = organic.find((i) => baseDomain(i.domain.toLowerCase()) === domain);
    const pos = hit ? Number(hit.rank_group) : NaN;
    const top = [];
    for (const i of organic) { const d = i.domain.toLowerCase().replace(/^www\./, ""); if (!top.includes(d)) top.push(d); if (top.length === 3) break; }
    return { ...out, checked: true, position: Number.isInteger(pos) && pos >= 1 && pos <= SERP_DEPTH ? pos : null, top };
  } catch (e) {
    return { ...out, reason: reasonOf(e) };
  }
}
// The provider's backlink index -> { checked, referringDomains, backlinks, spamScore (0…100 | null), usd }
async function backlinksSummary(io, auth, domain) {
  const out = { checked: false, referringDomains: null, backlinks: null, spamScore: null, usd: 0 };
  try {
    const r = await dfs(io, DFS_BACKLINKS_URL, auth, { target: domain, include_subdomains: true, backlinks_status_type: "live" });
    out.usd = costOf(r.json);
    const task = taskOf(r.json);
    const res = task && Array.isArray(task.result) ? task.result[0] : null;
    const int = (v) => (Number.isFinite(Number(v)) && Number(v) >= 0 && v !== null && v !== "" ? Math.round(Number(v)) : null);
    // an account without access to the Backlinks API gets a task error (e.g. 40204 "Access denied") and no result
    if (r.status !== 200 || !res || int(res.referring_domains) === null || int(res.backlinks) === null) return { ...out, reason: r.status !== 200 ? "http_" + r.status : "task_" + ((task && task.status_code) || "none") };
    const spam = int(res.backlinks_spam_score);
    return { ...out, checked: true, referringDomains: int(res.referring_domains), backlinks: int(res.backlinks), spamScore: spam !== null && spam <= 100 ? spam : null };
  } catch (e) {
    return { ...out, reason: reasonOf(e) };
  }
}
// in: { auth, domain, keyword ("" = no search term), baseDomain } -> { position | null, backlinks, usd, calls }
async function paid(io, { auth, domain, keyword, baseDomain }) {
  const [position, backlinks] = await Promise.all([
    keyword ? serpPosition(io, auth, keyword, domain, baseDomain) : Promise.resolve(null),
    backlinksSummary(io, auth, domain)
  ]);
  return { position, backlinks, usd: (position ? position.usd : 0) + backlinks.usd, calls: (position ? 1 : 0) + 1 };
}
// What a run is expected to cost at list price (reserved against the daily USD cap before the calls are made)
const expectedUsd = (keyword) => (keyword ? PRICE_USD.serp : 0) + PRICE_USD.backlinks;

const VISIBILITY = {
  title: T("Sichtbarkeit bei Google (nur im Bericht)", "Visibility on Google (in the report only)"),
  note: T(
    "Diese Angaben zählen nicht in die Punkte. Die Google-Position ist eine Momentaufnahme aus einer Ergebnis-Datenbank (Google Deutschland, deutsch, ohne Standort und ohne persönlichen Verlauf) und kann von dem abweichen, was Sie selbst sehen. Die Backlink-Zahlen stammen aus dem Index des Datenanbieters DataForSEO und sind eine Schätzung; andere Anbieter zählen anders.",
    "These figures do not count towards the points. The Google position is a snapshot from a results database (Google Germany, German, without a location and without personal history) and can differ from what you see yourself. The backlink figures come from the index of the data provider DataForSEO and are an estimate; other providers count differently."),
  unavailable: T("Google-Position und Backlinks heute nicht verfügbar.", "Google position and backlinks not available today."),
  teaser: T("Google-Position und Backlinks: im Bericht per E-Mail", "Google position and backlinks: in the report by e-mail")
};
const nf = (n, L) => new Intl.NumberFormat(L === "de" ? "de-DE" : "en-GB").format(n);
// p: what api/check.js keeps of a paid run ({ available, position, backlinks }) -> { title, note, rows: [{ label, detail }] } in one language
function visibilityView(p, lang) {
  const L = lang === "en" ? "en" : "de";
  const de = L === "de";
  const out = { title: VISIBILITY.title[L], note: VISIBILITY.note[L], rows: [] };
  if (!p || !p.available) { out.rows.push({ label: de ? "Google-Position und Backlinks" : "Google position and backlinks", detail: VISIBILITY.unavailable[L] }); return out; }
  const pos = p.position;
  if (pos) {
    const label = de ? `Google-Position für „${pos.query}“` : `Google position for “${pos.query}”`;
    if (!pos.checked) out.rows.push({ label, detail: de ? "nicht prüfbar: Die Abfrage hat in diesem Lauf nicht geantwortet." : "could not be checked: the lookup did not answer in this run." });
    else {
      out.rows.push({ label, detail: pos.position ? (de ? `Platz ${pos.position} der organischen Ergebnisse (Google Deutschland)` : `position ${pos.position} of the organic results (Google Germany)`) : (de ? `nicht unter den ersten ${pos.depth || SERP_DEPTH} (Google Deutschland)` : `not among the first ${pos.depth || SERP_DEPTH} (Google Germany)`) });
      if (pos.top && pos.top.length) out.rows.push({ label: de ? "Die ersten drei Domains für diese Suche" : "The first three domains for this search", detail: pos.top.join(", ") });
    }
  } else {
    out.rows.push({ label: de ? "Google-Position" : "Google position", detail: de ? "nicht abgefragt: Gewerk und Ort wurden nicht angegeben." : "not looked up: trade and town were not given." });
  }
  const b = p.backlinks;
  const bl = de ? "Backlinks der Domain (Index des Datenanbieters, Schätzung)" : "Backlinks of the domain (the data provider's index, an estimate)";
  if (!b || !b.checked) out.rows.push({ label: bl, detail: de ? "nicht verfügbar: Die Abfrage hat in diesem Lauf kein Ergebnis geliefert." : "not available: the lookup returned no result in this run." });
  else {
    out.rows.push({ label: bl, detail: (de ? `${nf(b.referringDomains, L)} verweisende Domains, ${nf(b.backlinks, L)} Backlinks` : `${nf(b.referringDomains, L)} referring domains, ${nf(b.backlinks, L)} backlinks`) + (b.spamScore === null ? "" : (de ? `; Spam-Wert der Backlinks laut Anbieter: ${b.spamScore} von 100` : `; spam score of the backlinks according to the provider: ${b.spamScore} out of 100`)) });
  }
  return out;
}

module.exports = {
  WEIGHTS, THRESHOLDS, EXPIRY_FLAG_DAYS, PRICE_USD, SERP_DEPTH, SOURCE_NOTE, VISIBILITY, FIELD_LABEL,
  requestList, paidRequestList, collect, fieldItems, expiryItem, greenItem,
  paid, expectedUsd, visibilityView,
  _test: { crux, rdap, green, readCrux, readBootstrap, serpPosition, backlinksSummary, gate, resetCache() { ianaCache = { at: -Infinity, map: null }; }, CRUX_URL, IANA_URL, GREEN_URL, DFS_SERP_URL, DFS_BACKLINKS_URL }
};
