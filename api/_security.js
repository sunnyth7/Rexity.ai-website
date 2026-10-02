// api/_security.js — two areas of the Website-Check (Sprint 36): "Sicherheit der Website" (security) and "Schutz Ihrer
// E-Mail-Domain" (mail). The leading underscore keeps Vercel from exposing this file as a function; api/check.js
// runs it in parallel with the speed measurement.
//
// Both areas are built ONLY from what every visitor's browser and public DNS already receive. Nothing is submitted,
// no credentials, no ports other than 80 and 443, no address is tried beyond this list (requestList() below is the
// same list as data, and gate() refuses anything else before it leaves this module):
//   0. (no request) the response of the entered page that the check has fetched anyway: status, headers, cookies, HTML
//   1. GET  http://<host>/                                 one request, redirects are NOT followed (does it lead to https?)
//   2. TLS  <host>:443                                     one handshake, then the connection is closed: certificate
//                                                          dates, issuer, whether it is valid for the host, protocol
//   3. GET  <origin of the page>/.well-known/security.txt  the standard public file (RFC 9116); robots.txt respected;
//                                                          redirects are NOT followed
//   4. DNS  MX, TXT and CAA of the registrable domain, TXT of _dmarc.<registrable domain>
//   5. GET  https://api.wordpress.org/core/version-check/1.7/   only when the page itself states a WordPress version;
//                                                          the request carries nothing about the checked site; the
//                                                          answer is kept for a day
// Not checked, and said so in the rule: DKIM (the selector is not public knowledge and is not guessed) and DNSSEC
// (node:dns cannot ask for or read the signed-answer flag).
//
// Wording (founder): every finding is one factual sentence with its plain consequence. Never a verdict on the whole
// site; never "gehackt", "angreifbar", "Sicherheitslücke", "unsicher" or "sicher" as a label. No advice.
// Tests: scripts/check-tool/test-check.mjs, section 26.

const tls = require("tls");
const dns = require("dns");

const T = (de, en) => ({ de, en });

const NAMES = {
  security: T("Sicherheit der Website", "Website security settings"),
  mail: T("Schutz Ihrer E-Mail-Domain", "E-mail domain protection")
};
// Points per check (each area adds up to 100). Checks that are not named here are notes without points.
const WEIGHTS = {
  security: { redirect: 10, cert: 14, certExpiry: 8, tls: 4, hsts: 10, csp: 10, frame: 7, nosniff: 6, referrer: 4, permissions: 3, cookies: 8, mixed: 10, httpForms: 6 },
  mail: { spf: 30, spfAll: 20, dmarc: 50 },
  limits: {
    certDays: 21, // fewer days left: partly met, with the date
    hstsMaxAge: 15552000 // 180 days: full points from here, half below
  }
};
const VERDICTS = {
  security: [
    T("Die meisten Schutzeinstellungen sind gesetzt.", "Most protection settings are in place."),
    T("Ein Teil der Schutzeinstellungen ist gesetzt.", "Some of the protection settings are in place."),
    T("Mehrere Schutzeinstellungen fehlen.", "Several protection settings are missing.")
  ],
  mail: [
    T("SPF und DMARC sind für die Domain gesetzt.", "SPF and DMARC are set for the domain."),
    T("Der Schutz der E-Mail-Domain ist nur zum Teil eingerichtet.", "The protection of the e-mail domain is only partly set up."),
    T("Wichtige Einträge zum Schutz der E-Mail-Domain fehlen.", "Important records for protecting the e-mail domain are missing.")
  ]
};
const DISCLAIMER = T(
  "Von außen sichtbare Einstellungen, geprüft ohne Eingriff in die Website; kein Sicherheitsaudit und keine Gewähr.",
  "Settings visible from outside, checked without interfering with the website; not a security audit and no warranty.");
// What the rule says about the two things that are deliberately not checked.
const RULE_NOTES = {
  dkim: T(
    "DKIM prüfen wir nicht: Der dafür nötige Eintrag liegt unter einem frei gewählten Namen (Selektor), den nur der Betreiber und sein E-Mail-Anbieter kennen. Wir raten keine Namen.",
    "We do not check DKIM: the record it needs sits under a freely chosen name (selector) that only the operator and its e-mail provider know. We do not guess names."),
  dnssec: T(
    "DNSSEC prüfen wir nicht: Mit den Mitteln dieser Prüfung lässt sich nicht verlässlich feststellen, ob eine Domain signiert ist.",
    "We do not check DNSSEC: with the means of this check it cannot be told reliably whether a domain is signed.")
};

const TLS_TIMEOUT_MS = 5000;
const HTTP_TIMEOUT_MS = 5000;
const DNS_TIMEOUT_MS = 5000; // one lookup, both tries together
const WP_TIMEOUT_MS = 4000;
const BUDGET_MS = 9000; // everything together; what has not arrived by then is "nicht prüfbar"
const WP_URL = "https://api.wordpress.org/core/version-check/1.7/";
const WP_CACHE_MS = 24 * 60 * 60 * 1000;
const SECURITY_TXT = "/.well-known/security.txt";

// Addresses under which many unrelated sites live. A site there has no e-mail domain of its own, so the mail area
// does not apply. A short list of the platforms small businesses use, not the full Public Suffix List.
const SHARED_SUFFIXES = ["wixsite.com", "wordpress.com", "jimdosite.com", "jimdofree.com", "webflow.io", "myshopify.com", "squarespace.com", "github.io", "vercel.app", "netlify.app", "pages.dev", "web.app", "firebaseapp.com", "blogspot.com", "weebly.com", "godaddysites.com", "business.site", "framer.website", "carrd.co", "herokuapp.com", "azurewebsites.net", "onrender.com", "webnode.page", "mystrikingly.com"];
const sharedSuffix = (host) => {
  const h = String(host || "").toLowerCase().replace(/\.$/, "");
  return SHARED_SUFFIXES.find((s) => h.endsWith("." + s)) || "";
};

// ---- The list of requests ------------------------------------------------------------------------------
// ctx: { host, origin, domain } -> the only requests this module may make for that site, as plain strings.
function requestList(ctx) {
  const list = ["GET http://" + ctx.host + "/", "TLS " + ctx.host + ":443", "GET " + ctx.origin + SECURITY_TXT, "GET " + WP_URL];
  if (ctx.domain) list.push("DNS MX " + ctx.domain, "DNS TXT " + ctx.domain, "DNS CAA " + ctx.domain, "DNS TXT _dmarc." + ctx.domain);
  return list;
}
function gate(ctx) {
  const allowed = new Set(requestList(ctx));
  return (key) => { if (!allowed.has(key)) throw new Error("security: request outside the list: " + key); };
}

// ---- Default network primitives (api/check.js wraps them with its own safety checks; tests replace them) ----------
// One TLS handshake with `address` (the already validated public address of `host`), nothing is sent afterwards.
function handshake(host, address, timeoutMs) {
  return new Promise((resolve) => {
    let done = false;
    let socket = null;
    const finish = (v) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { if (socket) socket.destroy(); } catch (_e) { /* closed already */ }
      resolve(v);
    };
    const timer = setTimeout(() => finish({ ok: false, reason: "timeout" }), timeoutMs || TLS_TIMEOUT_MS);
    try {
      // rejectUnauthorized: false — the certificate is read and judged here, not trusted; no data is exchanged
      socket = tls.connect({ host: address, port: 443, servername: host, rejectUnauthorized: false }, () => {
        const cert = socket.getPeerCertificate(false) || {};
        const issuer = cert.issuer || {};
        finish({
          ok: true,
          authorized: Boolean(socket.authorized),
          error: socket.authorized ? "" : String(socket.authorizationError || "unknown"),
          validFrom: Date.parse(cert.valid_from),
          validTo: Date.parse(cert.valid_to),
          issuer: String(issuer.O || issuer.CN || "").slice(0, 80),
          protocol: String(socket.getProtocol() || "")
        });
      });
      socket.on("error", (e) => finish({ ok: false, reason: String((e && e.code) || "error") }));
    } catch (e) {
      finish({ ok: false, reason: String((e && e.code) || "error") });
    }
  });
}
// Public DNS through the system's resolvers (node:dns/promises).
function resolver() {
  const r = new dns.promises.Resolver({ timeout: 2000, tries: 2 });
  return { resolveMx: (name) => r.resolveMx(name), resolveTxt: (name) => r.resolveTxt(name), resolveCaa: (name) => r.resolveCaa(name) };
}

const within = (promise, ms) => {
  let timer;
  return Promise.race([promise, new Promise((_r, reject) => { timer = setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), ms); })]).finally(() => clearTimeout(timer));
};
// -> the records, [] when the name has none (a definite answer), or null when the lookup did not answer
async function lookup(fn, name) {
  try {
    const out = await within(Promise.resolve().then(() => fn(name)), DNS_TIMEOUT_MS);
    return Array.isArray(out) ? out : [];
  } catch (e) {
    return e && (e.code === "ENODATA" || e.code === "ENOTFOUND") ? [] : null;
  }
}

// ---- HTML and headers (no request) -----------------------------------------------------------------------
const tagsOf = (html, name) => html.match(new RegExp("<" + name + "\\b[^>]*>", "gi")) || [];
function attrsOf(tag) {
  const out = {};
  const re = /([a-zA-Z_:][\w:.-]*)\s*(?:=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  const inner = tag.replace(/^<\/?[a-zA-Z][\w:-]*/, "").replace(/\/?>$/, "");
  let m;
  while ((m = re.exec(inner))) out[m[1].toLowerCase()] = String(m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : m[5] !== undefined ? m[5] : "").replace(/&amp;/g, "&").trim();
  return out;
}
const SYSTEMS = [
  ["WordPress", (g, h, html) => /^wordpress\b/i.test(g) || /\/wp-(content|includes)\//i.test(html)],
  ["Wix", (g, h, html) => /wix\.com/i.test(g) || Boolean(h["x-wix-request-id"]) || /static\.(wixstatic|parastorage)\.com/i.test(html)],
  ["Joomla", (g, h, html) => /joomla/i.test(g) || /\/media\/(jui|system)\/js\//i.test(html)],
  ["Shopify", (g, h, html) => Boolean(h["x-shopify-stage"] || h["x-shopid"]) || /shopify/i.test(h["powered-by"] || "") || /cdn\.shopify\.com/i.test(html)],
  ["Jimdo", (g, h, html) => /jimdo/i.test(g) || /assets\.jimstatic\.com/i.test(html)],
  ["Squarespace", (g, h, html) => /squarespace/i.test(g) || /^squarespace$/i.test(h.server || "") || /static1\.squarespace\.com/i.test(html)],
  ["TYPO3", (g, h, html) => /typo3/i.test(g) || /\/typo3(conf|temp)\//i.test(html)],
  ["Webflow", (g, h, html) => /webflow/i.test(g) || /\sdata-wf-site=/i.test(html) || /\.website-files\.com/i.test(html)]
];
const HAS_VERSION = /\d+\.\d+/;

// -> the facts the HTML and the response headers give. baseDomain: the function of api/check.js.
function analysePage(html, finalUrl, headers, baseDomain) {
  const page = new URL(finalUrl);
  const h = headers || {};
  const src = String(html || "").replace(/<!--[\s\S]*?-->/g, " ");
  const isHttps = page.protocol === "https:";
  const own = baseDomain(page.hostname);
  const isJs = (a) => !a.type || /(javascript|module|ecmascript)/i.test(a.type);
  const isHttp = (u) => /^http:\/\//i.test(String(u || "").trim());

  let active = 0;
  let passive = 0;
  let thirdScripts = 0;
  let thirdNoIntegrity = 0;
  for (const t of tagsOf(src, "script")) {
    const a = attrsOf(t);
    if (!a.src || !isJs(a)) continue;
    if (isHttp(a.src)) active++;
    let host = "";
    try { host = new URL(a.src, page).hostname.toLowerCase(); } catch (_e) { continue; }
    if (!host || baseDomain(host) === own) continue;
    thirdScripts++;
    if (!a.integrity) thirdNoIntegrity++;
  }
  for (const t of tagsOf(src, "link")) { const a = attrsOf(t); if (/\bstylesheet\b/i.test(a.rel || "") && isHttp(a.href)) active++; }
  for (const t of tagsOf(src, "iframe")) if (isHttp(attrsOf(t).src)) active++;
  for (const n of ["img", "video", "audio", "source", "embed"]) for (const t of tagsOf(src, n)) if (isHttp(attrsOf(t).src)) passive++;

  const forms = tagsOf(src, "form").map(attrsOf);
  const httpForms = forms.filter((f) => isHttp(f.action)).length;

  const metas = tagsOf(src, "meta").map(attrsOf);
  const generator = String((metas.find((m) => (m.name || "").toLowerCase() === "generator") || {}).content || "").replace(/\s+/g, " ").trim().slice(0, 80);
  const metaCsp = metas.some((m) => /^content-security-policy$/i.test(m["http-equiv"] || "") && m.content);
  const metaReferrer = String((metas.find((m) => (m.name || "").toLowerCase() === "referrer") || {}).content || "").trim().toLowerCase().slice(0, 60);
  const systems = SYSTEMS.filter(([, test]) => test(generator, h, src)).map(([name]) => name);
  const wp = /^WordPress\s+(\d+(?:\.\d+){1,2})\b/i.exec(generator);
  const named = [];
  if (h.server && HAS_VERSION.test(h.server)) named.push({ where: "Server", value: String(h.server).slice(0, 80) });
  if (h["x-powered-by"] && HAS_VERSION.test(h["x-powered-by"])) named.push({ where: "X-Powered-By", value: String(h["x-powered-by"]).slice(0, 80) });
  if (generator && HAS_VERSION.test(generator)) named.push({ where: "Generator", value: generator });

  const csp = String(h["content-security-policy"] || "");
  const hsts = /(?:^|;)\s*max-age\s*=\s*"?(\d+)/i.exec(String(h["strict-transport-security"] || ""));
  const xfo = String(h["x-frame-options"] || "").trim().toUpperCase().split(",")[0].trim();
  return {
    isHttps,
    hsts: h["strict-transport-security"] ? (hsts ? Number(hsts[1]) : 0) : null,
    csp: csp ? "header" : metaCsp ? "meta" : h["content-security-policy-report-only"] ? "report" : "",
    frame: /(?:^|;)\s*frame-ancestors\s/i.test(csp) ? "frame-ancestors" : /^(DENY|SAMEORIGIN)$/.test(xfo) ? "X-Frame-Options: " + xfo : "",
    nosniff: /(^|,)\s*nosniff\s*(,|$)/i.test(String(h["x-content-type-options"] || "")),
    referrer: String(h["referrer-policy"] || "").trim().toLowerCase().slice(0, 60) || metaReferrer,
    permissions: Boolean(h["permissions-policy"]),
    mixedActive: active, mixedPassive: passive,
    forms: forms.length, httpForms,
    thirdScripts, thirdNoIntegrity,
    systems, named, wpVersion: wp ? wp[1] : ""
  };
}
// Set-Cookie lines -> how many carry which mark
function analyseCookies(lines) {
  const list = (Array.isArray(lines) ? lines : []).map((l) => String(l || "")).filter((l) => /^[^=;\s]+=/.test(l.trim()));
  const flags = list.map((l) => l.split(";").slice(1).map((p) => p.trim().toLowerCase()));
  const names = new Set(list.map((l) => l.trim().split("=")[0]));
  return {
    count: names.size,
    lines: list.length,
    secure: flags.filter((f) => f.includes("secure")).length,
    httpOnly: flags.filter((f) => f.includes("httponly")).length,
    sameSite: flags.filter((f) => f.some((p) => p.startsWith("samesite="))).length
  };
}

// ---- DNS records ----------------------------------------------------------------------------------------
const joinTxt = (records) => (records || []).map((r) => (Array.isArray(r) ? r.join("") : String(r || "")).trim());
function readSpf(txt) {
  if (txt === null) return null;
  const records = joinTxt(txt).filter((r) => /^v=spf1(\s|$)/i.test(r));
  if (records.length !== 1) return { count: records.length };
  const terms = records[0].split(/\s+/).slice(1);
  const all = terms.map((t) => /^([+\-~?]?)all$/i.exec(t)).find(Boolean);
  const redirect = terms.map((t) => /^redirect=(\S+)$/i.exec(t)).find(Boolean);
  return { count: 1, all: all ? all[1] || "+" : "", redirect: !all && redirect ? redirect[1].slice(0, 80) : "" };
}
function readDmarc(txt) {
  if (txt === null) return null;
  const records = joinTxt(txt).filter((r) => /^v=DMARC1\s*(;|$)/i.test(r));
  if (records.length !== 1) return { count: records.length };
  const p = /(?:^|;)\s*p\s*=\s*([a-z]+)/i.exec(records[0]);
  const policy = p ? p[1].toLowerCase() : "";
  return { count: 1, policy: ["none", "quarantine", "reject"].includes(policy) ? policy : "" };
}
function readMx(mx) {
  if (mx === null) return null;
  const list = mx.filter((m) => m && typeof m.exchange === "string");
  const real = list.filter((m) => m.exchange.replace(/\.$/, "") !== "");
  return { count: real.length, nullMx: list.length > 0 && real.length === 0 };
}
function readCaa(caa) {
  if (caa === null) return null;
  const issuers = [...new Set(caa.map((c) => String((c && (c.issue || c.issuewild)) || "").split(";")[0].trim()).filter(Boolean))].slice(0, 6);
  return { count: caa.length, issuers };
}

const cmpVersion = (a, b) => {
  const x = String(a).split(".").map(Number);
  const y = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
};
const wpCache = { at: -Infinity, version: "" };

// ---- collect: every request of the two areas, in parallel, each with its own short timeout -------------------------
// ctx: { host, finalUrl (URL), domain (registrable domain of host), baseDomain(fn), page: { headers, cookies, redirects } | null,
//        html, robotsAllows: async (pathname) => boolean, now: () => ms }
// io:  { get(url, { timeoutMs, maxBytes }) -> { status, headers, body } (one hop, never follows a redirect),
//        tls(host, timeoutMs) -> see handshake(), dns: { resolveMx, resolveTxt, resolveCaa }, json(url, timeoutMs) -> object }
// -> facts (plain data). A request that fails leaves its fact null: that single check is "nicht prüfbar".
async function collect(ctx, io) {
  const origin = ctx.finalUrl.origin;
  const shared = sharedSuffix(ctx.host);
  const domain = shared ? "" : ctx.domain;
  const allow = gate({ host: ctx.host, origin, domain });
  const facts = { host: ctx.host, domain, shared, page: null, cookies: null, http: null, tls: null, securityTxt: null, wpLatest: "", mx: null, spf: null, dmarc: null, caa: null, ms: {} };
  const t0 = ctx.now();
  const timed = (name, p) => p.then((v) => { facts.ms[name] = ctx.now() - t0; return v; }, () => { facts.ms[name] = ctx.now() - t0; return null; });

  if (ctx.page) {
    facts.page = analysePage(ctx.html, ctx.finalUrl.href, ctx.page.headers, ctx.baseDomain);
    facts.cookies = analyseCookies(ctx.page.cookies);
  }
  const jobs = [];
  // 1. the plain http address of the same host (not needed when the entered address was that one and led to https)
  if (ctx.page) {
    const chain = ctx.page.redirects || [];
    const at = chain.findIndex((u) => { try { const x = new URL(u); return x.protocol === "http:" && x.hostname === ctx.host; } catch (_e) { return false; } });
    const next = at >= 0 ? chain[at + 1] || ctx.finalUrl.href : "";
    if (ctx.finalUrl.protocol !== "https:") facts.http = { state: "plain" };
    else if (at >= 0 && /^https:/i.test(next)) facts.http = { state: "https", seen: true };
    else {
      jobs.push(timed("http", (async () => {
        const url = "http://" + ctx.host + "/";
        allow("GET " + url);
        const r = await io.get(url, { timeoutMs: HTTP_TIMEOUT_MS, maxBytes: 1024 });
        const loc = String((r.headers && r.headers.location) || "");
        let target = null;
        try { target = loc ? new URL(loc, url) : null; } catch (_e) { target = null; }
        if (r.status >= 300 && r.status < 400 && target) facts.http = { state: target.protocol === "https:" ? "https" : "http-again" };
        else facts.http = { state: "none", status: r.status };
      })()));
    }
  }
  // 2. one TLS handshake
  jobs.push(timed("tls", (async () => {
    allow("TLS " + ctx.host + ":443");
    const r = await io.tls(ctx.host, TLS_TIMEOUT_MS);
    facts.tls = r && r.ok ? r : { ok: false, reason: (r && r.reason) || "error" };
  })()));
  // 3. security.txt
  if (ctx.page) {
    jobs.push(timed("securityTxt", (async () => {
      if (!(await ctx.robotsAllows(SECURITY_TXT))) { facts.securityTxt = { state: "robots" }; return; }
      allow("GET " + origin + SECURITY_TXT);
      const r = await io.get(origin + SECURITY_TXT, { timeoutMs: HTTP_TIMEOUT_MS, maxBytes: 20000 });
      const text = Buffer.isBuffer(r.body) ? r.body.toString("utf8") : String(r.body || "");
      if (r.status >= 300 && r.status < 400) facts.securityTxt = { state: "redirect" };
      else if (r.status === 200 && /^\s*contact\s*:/im.test(text) && !/<html\b|<!doctype html/i.test(text.slice(0, 600))) facts.securityTxt = { state: "ok" };
      else if (r.status === 200 || r.status === 404 || r.status === 410) facts.securityTxt = { state: "missing" };
      else facts.securityTxt = null;
    })()));
  }
  // 4. public DNS of the registrable domain
  if (domain) {
    const ask = (key, fn, name, read, slot) => jobs.push(timed(slot, (async () => { allow("DNS " + key + " " + name); facts[slot] = read(await lookup(fn, name)); })()));
    ask("MX", io.dns.resolveMx, domain, readMx, "mx");
    ask("TXT", io.dns.resolveTxt, domain, readSpf, "spf");
    ask("TXT", io.dns.resolveTxt, "_dmarc." + domain, readDmarc, "dmarc");
    ask("CAA", io.dns.resolveCaa, domain, readCaa, "caa");
  }
  // 5. the current WordPress release, only when the page states its own version
  if (facts.page && facts.page.wpVersion) {
    jobs.push(timed("wp", (async () => {
      if (ctx.now() - wpCache.at < WP_CACHE_MS && wpCache.version) { facts.wpLatest = wpCache.version; return; }
      allow("GET " + WP_URL);
      const data = await io.json(WP_URL, WP_TIMEOUT_MS);
      const v = data && Array.isArray(data.offers) && data.offers[0] && String(data.offers[0].version || "");
      if (v && /^\d+(\.\d+){1,2}$/.test(v)) { wpCache.at = ctx.now(); wpCache.version = v; facts.wpLatest = v; }
    })()));
  }
  let timer;
  await Promise.race([Promise.all(jobs), new Promise((r) => { timer = setTimeout(r, BUDGET_MS); })]).finally(() => clearTimeout(timer));
  facts.ms.all = ctx.now() - t0;
  return facts;
}

// ---- The two blocks ------------------------------------------------------------------------------------------
const NA = T("nicht prüfbar", "could not be checked");
const plural = (n, one, many) => (n === 1 ? one : many);
const fmtDate = (ms) => {
  const f = (locale, opt) => { try { return new Intl.DateTimeFormat(locale, { timeZone: "Europe/Berlin", ...opt }).format(new Date(ms)); } catch (_e) { return new Date(ms).toISOString().slice(0, 10); } };
  return T(f("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }), f("en-GB", { day: "numeric", month: "long", year: "numeric" }));
};

// mk: the item constructor of api/check.js (id, max, share, label, detail); now: time of the check in ms
function securityBlock(f, mk, now) {
  const W = WEIGHTS.security;
  const p = f.page;
  const host = f.host;
  const items = [];
  const add = (id, share, label, detail) => items.push(mk(id, W[id] || 0, share, label, detail));

  // -- HTTPS
  const h = f.http;
  add("redirect", !h ? null : h.state === "https" ? 1 : h.state === "http-again" ? null : 0, T("Weiterleitung von http auf https", "Redirect from http to https"),
    !h ? T("Die http-Adresse hat nicht geantwortet.", "The http address did not answer.")
      : h.state === "https" ? T("Die http-Adresse leitet auf https weiter.", "The http address redirects to https.")
      : h.state === "http-again" ? T("Die http-Adresse leitet zunächst auf eine weitere http-Adresse; dieser sind wir nicht gefolgt.", "The http address first redirects to another http address; we did not follow it.")
      : h.state === "plain" ? T("Die Seite wird über http ausgeliefert, ohne Verschlüsselung. Browser zeigen bei solchen Seiten einen Warnhinweis in der Adresszeile.", "The page is delivered over http, without encryption. Browsers show a warning in the address bar for such pages.")
      : h.status >= 200 && h.status < 300 ? T("Die http-Adresse leitet nicht auf https weiter. Wer die Adresse ohne https aufruft, bleibt auf der unverschlüsselten Fassung.", "The http address does not redirect to https. Anyone who opens the address without https stays on the unencrypted version.")
      : T(`Die http-Adresse antwortet mit dem Status ${h.status} statt mit einer Weiterleitung auf https. Wer die Adresse ohne https aufruft, erreicht die Seite nicht.`, `The http address answers with status ${h.status} instead of a redirect to https. Anyone who opens the address without https does not reach the page.`));

  const c = f.tls && f.tls.ok ? f.tls : null;
  const noTls = T("Die Verbindung auf Port 443 kam nicht zustande.", "The connection on port 443 was not established.");
  const hasDates = c && Number.isFinite(c.validTo);
  const until = hasDates ? fmtDate(c.validTo) : T("", "");
  const days = hasDates ? Math.floor((c.validTo - now) / 86400000) : null;
  const warn = T("Browser warnen vor der Seite, bevor sie sie anzeigen.", "Browsers warn about the page before they show it.");
  const chainOnly = c && /^(UNABLE_TO_VERIFY_LEAF_SIGNATURE|UNABLE_TO_GET_ISSUER_CERT_LOCALLY|UNABLE_TO_GET_ISSUER_CERT)$/.test(c.error);
  add("cert", !c ? null : c.authorized ? 1 : chainOnly ? 0.5 : 0, T("Zertifikat gültig für diese Adresse", "Certificate valid for this address"),
    !c ? noTls
      : c.authorized ? T(`Das Zertifikat ist gültig und auf ${host} ausgestellt` + (c.issuer ? ` (Aussteller: ${c.issuer}).` : "."), `The certificate is valid and issued for ${host}` + (c.issuer ? ` (issuer: ${c.issuer}).` : "."))
      : c.error === "CERT_HAS_EXPIRED" ? T(`Das Zertifikat ist ${until.de ? "am " + until.de + " " : ""}abgelaufen. ${warn.de}`, `The certificate expired${until.en ? " on " + until.en : ""}. ${warn.en}`)
      : c.error === "ERR_TLS_CERT_ALTNAME_INVALID" ? T(`Das Zertifikat ist nicht auf ${host} ausgestellt. ${warn.de}`, `The certificate is not issued for ${host}. ${warn.en}`)
      : /SELF_SIGNED/.test(c.error) ? T(`Das Zertifikat stammt von keiner anerkannten Zertifizierungsstelle (selbst signiert). ${warn.de}`, `The certificate does not come from a recognised certificate authority (self-signed). ${warn.en}`)
      : chainOnly ? T("Der Server liefert die Zertifikatskette nicht vollständig mit (ein Zwischenzertifikat fehlt). Die meisten Browser gleichen das aus, manche Programme lehnen die Verbindung ab.", "The server does not send the complete certificate chain (an intermediate certificate is missing). Most browsers make up for that, some programs refuse the connection.")
      : T(`Das Zertifikat ließ sich nicht bestätigen (${c.error.slice(0, 60)}). Browser können vor der Seite warnen.`, `The certificate could not be confirmed (${c.error.slice(0, 60)}). Browsers may warn about the page.`));
  const L = WEIGHTS.limits;
  add("certExpiry", !c || !hasDates ? null : days < 0 ? 0 : days < L.certDays ? 0.5 : 1, T("Laufzeit des Zertifikats", "Certificate validity period"),
    !c ? noTls
      : !hasDates ? NA
      : days < 0 ? T(`Das Zertifikat ist seit dem ${until.de} abgelaufen. Browser warnen vor Ihrer Seite.`, `The certificate has been expired since ${until.en}. Browsers warn about your page.`)
      : days < L.certDays ? T(days === 0 ? `Das Zertifikat läuft heute ab (am ${until.de}). Danach warnen Browser vor Ihrer Seite.` : `Das Zertifikat läuft in ${days} ${plural(days, "Tag", "Tagen")} ab (am ${until.de}). Danach warnen Browser vor Ihrer Seite.`,
        days === 0 ? `The certificate expires today (${until.en}). After that, browsers warn about your page.` : `The certificate expires in ${days} ${plural(days, "day", "days")} (on ${until.en}). After that, browsers warn about your page.`)
      : T(`Das Zertifikat ist noch ${days} Tage gültig (bis ${until.de}).`, `The certificate is valid for another ${days} days (until ${until.en}).`));
  const proto = c ? c.protocol.replace(/^TLSv/, "TLS ") : "";
  const modern = c && /^TLSv1\.[23]$/.test(c.protocol);
  add("tls", !c || !c.protocol ? null : modern ? 1 : 0, T("Protokollversion der Verschlüsselung (TLS)", "Encryption protocol version (TLS)"),
    !c ? noTls
      : !c.protocol ? NA
      : modern ? T(`Ausgehandelt wurde ${proto}.`, `${proto} was negotiated.`)
      : T(`Ausgehandelt wurde ${proto}. Aktuelle Browser erwarten TLS 1.2 oder neuer und können die Verbindung ablehnen.`, `${proto} was negotiated. Current browsers expect TLS 1.2 or newer and may refuse the connection.`));

  // -- protection settings sent by the site
  const httpOnly = T("Die Seite selbst wird über http ausgeliefert.", "The page itself is delivered over http.");
  const hstsDays = p && p.hsts !== null ? Math.floor(p.hsts / 86400) : 0;
  add("hsts", !p ? null : !p.isHttps ? "na" : p.hsts === null || p.hsts === 0 ? 0 : p.hsts >= L.hstsMaxAge ? 1 : 0.5, T("Strict-Transport-Security (HSTS)", "Strict-Transport-Security (HSTS)"),
    !p ? NA : !p.isHttps ? httpOnly
      : p.hsts === null || p.hsts === 0 ? T("Die Seite sendet kein Strict-Transport-Security. Diese Einstellung weist Browser an, die Seite nur noch verschlüsselt aufzurufen.", "The page sends no Strict-Transport-Security. This setting tells browsers to open the page only with encryption from then on.")
      : p.hsts >= L.hstsMaxAge ? T(`Die Seite sendet Strict-Transport-Security (Dauer: ${hstsDays} Tage). Browser rufen sie in dieser Zeit nur verschlüsselt auf.`, `The page sends Strict-Transport-Security (duration: ${hstsDays} days). Browsers open it only with encryption during that time.`)
      : T(`Die Seite sendet Strict-Transport-Security mit kurzer Dauer (${hstsDays} ${plural(hstsDays, "Tag", "Tage")}). Die Vorgabe endet, wenn ein Besucher länger nicht wiederkommt.`, `The page sends Strict-Transport-Security with a short duration (${hstsDays} ${plural(hstsDays, "day", "days")}). The instruction ends when a visitor does not return for longer than that.`));
  add("csp", !p ? null : p.csp === "header" || p.csp === "meta" ? 1 : p.csp === "report" ? 0.5 : 0, T("Content-Security-Policy", "Content-Security-Policy"),
    !p ? NA
      : p.csp === "header" ? T("Die Seite sendet eine Content-Security-Policy.", "The page sends a Content-Security-Policy.")
      : p.csp === "meta" ? T("Die Seite setzt eine Content-Security-Policy per Meta-Angabe im HTML.", "The page sets a Content-Security-Policy through a meta element in the HTML.")
      : p.csp === "report" ? T("Die Seite sendet die Content-Security-Policy nur im Meldemodus (Report-Only). In diesem Modus wird nichts begrenzt.", "The page sends the Content-Security-Policy in report-only mode. Nothing is restricted in that mode.")
      : T("Die Seite sendet keine Content-Security-Policy. Diese Einstellung begrenzt, welche fremden Inhalte im Browser Ihrer Besucher laufen dürfen.", "The page sends no Content-Security-Policy. This setting limits which third-party content may run in your visitors' browsers."));
  add("frame", !p ? null : p.frame ? 1 : 0, T("Schutz vor Einbettung in fremde Seiten", "Protection against embedding in other sites"),
    !p ? NA
      : p.frame ? T(`Die Seite legt fest, wer sie einbetten darf (${p.frame}).`, `The page states who may embed it (${p.frame}).`)
      : T("Die Seite legt nicht fest, wer sie einbetten darf (weder frame-ancestors noch X-Frame-Options). Fremde Seiten können sie damit in einem Rahmen anzeigen.", "The page does not state who may embed it (neither frame-ancestors nor X-Frame-Options). Other sites can therefore show it inside a frame."));
  add("nosniff", !p ? null : p.nosniff ? 1 : 0, T("X-Content-Type-Options", "X-Content-Type-Options"),
    !p ? NA
      : p.nosniff ? T("Die Seite sendet X-Content-Type-Options: nosniff.", "The page sends X-Content-Type-Options: nosniff.")
      : T("Die Seite sendet kein X-Content-Type-Options: nosniff. Mit dieser Einstellung halten sich Browser an den angegebenen Dateityp, statt ihn zu erraten.", "The page does not send X-Content-Type-Options: nosniff. With this setting browsers keep to the declared file type instead of guessing it."));
  const refItem = mk("referrer", W.referrer, !p ? null : !p.referrer ? 0 : /unsafe-url/.test(p.referrer) ? 0.5 : 1, T("Referrer-Policy", "Referrer-Policy"),
    !p ? NA
      : !p.referrer ? T("Die Seite sendet keine Referrer-Policy. Dann gilt die Voreinstellung des jeweiligen Browsers dafür, wie viel von der besuchten Adresse an andere Seiten weitergegeben wird.", "The page sends no Referrer-Policy. The browser's own default then decides how much of the visited address is passed on to other sites.")
      : /unsafe-url/.test(p.referrer) ? T("Die Seite sendet die Referrer-Policy „unsafe-url“. Damit geben Browser die vollständige Adresse der besuchten Seite an andere Seiten weiter.", "The page sends the Referrer-Policy “unsafe-url”. Browsers then pass the full address of the visited page on to other sites.")
      : T(`Die Seite sendet eine Referrer-Policy (${p.referrer}).`, `The page sends a Referrer-Policy (${p.referrer}).`));
  if (p && p.referrer) refItem.pageText = true; // quotes a value the site sent
  items.push(refItem);
  add("permissions", !p ? null : p.permissions ? 1 : 0, T("Permissions-Policy", "Permissions-Policy"),
    !p ? NA
      : p.permissions ? T("Die Seite sendet eine Permissions-Policy.", "The page sends a Permissions-Policy.")
      : T("Die Seite sendet keine Permissions-Policy. Diese Einstellung legt fest, ob eingebettete Inhalte Kamera, Mikrofon oder Standort anfragen dürfen.", "The page sends no Permissions-Policy. This setting states whether embedded content may ask for the camera, microphone or location."));

  // -- cookies set on the first page view
  const k = f.cookies;
  const marks = T("Secure beschränkt ein Cookie auf verschlüsselte Verbindungen, HttpOnly verbirgt es vor Skripten, SameSite regelt das Mitsenden bei Aufrufen von anderen Seiten.", "Secure restricts a cookie to encrypted connections, HttpOnly hides it from scripts, SameSite governs whether it is sent with requests coming from other sites.");
  const kn = k ? k.lines : 0;
  const allMarked = k && k.secure === kn && k.httpOnly === kn && k.sameSite === kn;
  add("cookies", !k ? null : !kn ? "na" : (k.secure + k.httpOnly + k.sameSite) / (3 * kn), T("Cookies beim ersten Aufruf", "Cookies on the first page view"),
    !k ? NA
      : !kn ? T("Beim ersten Aufruf setzt die Seite keine Cookies.", "The page sets no cookies on the first page view.")
      : T(`${kn} ${plural(kn, "Cookie", "Cookies")} beim ersten Aufruf: ${k.secure} mit Secure, ${k.httpOnly} mit HttpOnly, ${k.sameSite} mit SameSite.` + (allMarked ? "" : " " + marks.de),
        `${kn} ${plural(kn, "cookie", "cookies")} on the first page view: ${k.secure} with Secure, ${k.httpOnly} with HttpOnly, ${k.sameSite} with SameSite.` + (allMarked ? "" : " " + marks.en)));

  // -- content
  const mixed = p ? p.mixedActive + p.mixedPassive : 0;
  add("mixed", !p ? null : !p.isHttps ? "na" : !mixed ? 1 : p.mixedActive ? 0 : 0.5, T("Über http geladene Inhalte auf der https-Seite", "Content loaded over http on the https page"),
    !p ? NA : !p.isHttps ? httpOnly
      : !mixed ? T("Im HTML der Seite werden keine Inhalte über http geladen.", "No content is loaded over http in the page's HTML.")
      : p.mixedActive ? T(`${p.mixedActive} ${plural(p.mixedActive, "Skript, Stylesheet oder Rahmen wird", "Skripte, Stylesheets oder Rahmen werden")} über http geladen` + (p.mixedPassive ? `, dazu ${p.mixedPassive} ${plural(p.mixedPassive, "Bild- oder Mediendatei", "Bild- oder Mediendateien")}` : "") + ". Browser blockieren solche Inhalte auf einer https-Seite.",
        `${p.mixedActive} ${plural(p.mixedActive, "script, stylesheet or frame is", "scripts, stylesheets or frames are")} loaded over http` + (p.mixedPassive ? `, plus ${p.mixedPassive} image or media ${plural(p.mixedPassive, "file", "files")}` : "") + ". Browsers block such content on an https page.")
      : T(`${p.mixedPassive} ${plural(p.mixedPassive, "Bild- oder Mediendatei wird", "Bild- oder Mediendateien werden")} über http geladen. Browser stellen solche Adressen auf https um und blenden die Datei aus, wenn sie dort nicht erreichbar ist.`,
        `${p.mixedPassive} image or media ${plural(p.mixedPassive, "file is", "files are")} loaded over http. Browsers switch such addresses to https and leave the file out when it cannot be reached there.`));
  const plainForms = p && !p.isHttps && p.forms > 0;
  add("httpForms", !p ? null : !p.forms ? "na" : plainForms || p.httpForms ? 0 : 1, T("Formulare, die an eine http-Adresse senden", "Forms that send to an http address"),
    !p ? NA
      : !p.forms ? T("Im HTML der Seite steht kein Formular.", "There is no form in the page's HTML.")
      : plainForms ? T(`Die Seite wird über http ausgeliefert; ${plural(p.forms, "ihr Formular sendet seine", `ihre ${p.forms} Formulare senden ihre`)} Eingaben damit unverschlüsselt.`, `The page is delivered over http; ${plural(p.forms, "its form sends its", `its ${p.forms} forms send their`)} input without encryption.`)
      : p.httpForms ? T(`${p.httpForms} von ${p.forms} ${plural(p.forms, "Formular", "Formularen")} ${plural(p.httpForms, "sendet", "senden")} an eine http-Adresse. Die Eingaben werden dann unverschlüsselt übertragen.`, `${p.httpForms} of ${p.forms} ${plural(p.forms, "form", "forms")} ${plural(p.httpForms, "sends", "send")} to an http address. The input is then transferred without encryption.`)
      : T(p.forms === 1 ? "Das Formular der Seite sendet nicht an eine http-Adresse." : `Keines der ${p.forms} Formulare sendet an eine http-Adresse.`, p.forms === 1 ? "The page's form does not send to an http address." : `None of the ${p.forms} forms sends to an http address.`));

  // -- notes without points
  add("sri", !p ? null : 1, T("Skripte von fremden Adressen ohne Prüfsumme (integrity)", "Scripts from other hosts without a checksum (integrity)"),
    !p ? NA
      : !p.thirdScripts ? T("Die Seite lädt keine Skripte von fremden Adressen.", "The page loads no scripts from other hosts.")
      : !p.thirdNoIntegrity ? T(p.thirdScripts === 1 ? "Das eine Skript von einer fremden Adresse trägt eine Prüfsumme (integrity)." : `Alle ${p.thirdScripts} Skripte von fremden Adressen tragen eine Prüfsumme (integrity).`, p.thirdScripts === 1 ? "The one script from another host carries a checksum (integrity)." : `All ${p.thirdScripts} scripts from other hosts carry a checksum (integrity).`)
      : T(`${p.thirdNoIntegrity} von ${p.thirdScripts} ${plural(p.thirdScripts, "Skript", "Skripten")} von fremden Adressen ${plural(p.thirdNoIntegrity, "trägt", "tragen")} keine Prüfsumme (integrity). Mit Prüfsumme lädt der Browser ein Skript nur, wenn es unverändert ist.`,
        `${p.thirdNoIntegrity} of ${p.thirdScripts} ${plural(p.thirdScripts, "script", "scripts")} from other hosts ${plural(p.thirdNoIntegrity, "carries", "carry")} no checksum (integrity). With a checksum the browser loads a script only when it is unchanged.`));
  let software;
  if (!p) software = NA;
  else {
    const de = [];
    const en = [];
    if (p.systems.length) { de.push(`Erkanntes System: ${p.systems.join(", ")}.`); en.push(`System detected: ${p.systems.join(", ")}.`); }
    if (p.named.length) {
      de.push(`Die Seite nennt Versionsnummern: ${p.named.map((n) => `${n.where} „${n.value}“`).join(", ")}. Versionsnummern zeigen Außenstehenden, welcher Softwarestand läuft.`);
      en.push(`The page states version numbers: ${p.named.map((n) => `${n.where} “${n.value}”`).join(", ")}. Version numbers show outsiders which software release is running.`);
    } else { de.push("Die Seite nennt in Kopfzeilen und Generator-Angabe keine Versionsnummern."); en.push("The page states no version numbers in its headers or generator tag."); }
    if (p.wpVersion && f.wpLatest) {
      const older = cmpVersion(p.wpVersion, f.wpLatest) < 0;
      de.push(older ? `WordPress: ältere Version als die aktuelle (${p.wpVersion} gegenüber ${f.wpLatest}).` : `WordPress: Die genannte Version ${p.wpVersion} ist die aktuelle.`);
      en.push(older ? `WordPress: an older version than the current one (${p.wpVersion} compared with ${f.wpLatest}).` : `WordPress: the stated version ${p.wpVersion} is the current one.`);
    }
    software = T(de.join(" "), en.join(" "));
  }
  const sw = mk("software", 0, !p ? null : 1, T("Öffentlich genannte Software", "Software named publicly"), software);
  if (p && p.named.length) sw.pageText = true;
  items.push(sw);
  const st = f.securityTxt;
  add("securityTxt", !st || st.state === "robots" || st.state === "redirect" ? null : 1, T("security.txt (Kontakt für Sicherheitsmeldungen)", "security.txt (contact for security reports)"),
    !st ? NA
      : st.state === "robots" ? T("nicht geprüft (robots.txt untersagt den Abruf)", "not checked (robots.txt disallows fetching it)")
      : st.state === "redirect" ? T("nicht geprüft: Die Adresse /.well-known/security.txt leitet weiter; der Weiterleitung sind wir nicht gefolgt.", "not checked: the address /.well-known/security.txt redirects; we did not follow the redirect.")
      : st.state === "ok" ? T("Unter /.well-known/security.txt steht eine Kontaktangabe für Sicherheitsmeldungen.", "There is a contact for security reports at /.well-known/security.txt.")
      : T("Unter /.well-known/security.txt liegt keine solche Datei. Sie nennt Fachleuten, an wen sie eine Sicherheitsmeldung richten können. Kein Muss; zählt nicht in die Punkte.", "There is no such file at /.well-known/security.txt. It tells specialists whom to send a security report to. Not required; not part of the score."));
  return items;
}

function mailBlock(f, mk) {
  const W = WEIGHTS.mail;
  const d = f.domain;
  const items = [];
  const add = (id, share, label, detail) => items.push(mk(id, W[id] || 0, share, label, detail));
  const still = T("SPF und DMARC zählen trotzdem, denn sie legen fest, wer im Namen der Domain senden darf.", "SPF and DMARC still count, because they state who may send in the domain's name.");
  const mx = f.mx;
  add("mx", !mx ? null : 1, T("Posteingang der Domain (MX-Einträge)", "Mail reception for the domain (MX records)"),
    !mx ? NA
      : mx.nullMx ? T(`Für ${d} ist ein leerer MX-Eintrag gesetzt: Die Domain erklärt damit, keine E-Mail zu empfangen. ${still.de}`, `An empty MX record is set for ${d}: the domain thereby declares that it receives no e-mail. ${still.en}`)
      : !mx.count ? T(`Für ${d} ist kein MX-Eintrag gesetzt: Die Domain ist nicht für den Empfang von E-Mail eingerichtet. ${still.de}`, `No MX record is set for ${d}: the domain is not set up to receive e-mail. ${still.en}`)
      : T(`Für ${d} ${plural(mx.count, "ist ein MX-Eintrag", `sind ${mx.count} MX-Einträge`)} gesetzt: Die Domain empfängt E-Mail.`, `${plural(mx.count, "One MX record is", `${mx.count} MX records are`)} set for ${d}: the domain receives e-mail.`));
  const s = f.spf;
  add("spf", !s ? null : s.count === 1 ? 1 : 0, T("SPF-Eintrag", "SPF record"),
    !s ? NA
      : s.count === 1 ? T(`Für ${d} ist genau ein SPF-Eintrag gesetzt.`, `Exactly one SPF record is set for ${d}.`)
      : s.count === 0 ? T(`Für ${d} ist kein SPF-Eintrag gesetzt. Empfänger können dann nicht prüfen, welche Server in Ihrem Namen senden dürfen.`, `No SPF record is set for ${d}. Recipients then cannot check which servers may send in your name.`)
      : T(`Für ${d} sind ${s.count} SPF-Einträge gesetzt; zulässig ist genau einer. Empfänger werten das als Fehler und prüfen den Absender dann nicht.`, `${s.count} SPF records are set for ${d}; exactly one is permitted. Recipients treat that as an error and then do not check the sender.`));
  const one = s && s.count === 1;
  const endItem = mk("spfAll", W.spfAll, !s ? null : !one ? "na" : s.redirect ? null : s.all === "-" || s.all === "~" ? 1 : s.all === "+" ? 0 : 0.5, T("Abschluss des SPF-Eintrags", "How the SPF record ends"),
    !s ? NA
      : !one ? T("Es gibt keinen einzelnen SPF-Eintrag, dessen Abschluss sich bewerten ließe.", "There is no single SPF record whose ending could be assessed.")
      : s.redirect ? T(`Der SPF-Eintrag verweist auf einen anderen Eintrag (redirect=${s.redirect}); diesen fragen wir nicht ab.`, `The SPF record points to another record (redirect=${s.redirect}); we do not query that one.`)
      : s.all === "-" ? T("Der SPF-Eintrag endet auf „-all“: Nicht aufgeführte Server sind als Absender ausgeschlossen.", "The SPF record ends in “-all”: servers that are not listed are excluded as senders.")
      : s.all === "~" ? T("Der SPF-Eintrag endet auf „~all“: E-Mails von nicht aufgeführten Servern gelten als verdächtig, werden aber nicht abgewiesen.", "The SPF record ends in “~all”: e-mails from servers that are not listed count as suspicious but are not rejected.")
      : s.all === "?" ? T("Der SPF-Eintrag endet auf „?all“: Er trifft damit keine Aussage über nicht aufgeführte Server.", "The SPF record ends in “?all”: it thereby makes no statement about servers that are not listed.")
      : s.all === "+" ? T("Der SPF-Eintrag endet auf „+all“: Damit ist jeder Server als Absender zugelassen.", "The SPF record ends in “+all”: every server is thereby permitted as a sender.")
      : T("Der SPF-Eintrag hat keinen Abschluss („all“ fehlt): Er trifft damit keine Aussage über nicht aufgeführte Server.", "The SPF record has no ending (“all” is missing): it thereby makes no statement about servers that are not listed."));
  if (one && s.redirect) endItem.pageText = true; // quotes a value from the domain's record
  items.push(endItem);
  const m = f.dmarc;
  const failing = T("E-Mails, die die Prüfung nicht bestehen,", "e-mails that fail the check");
  add("dmarc", !m ? null : m.count !== 1 || !m.policy ? 0 : m.policy === "none" ? 0.5 : 1, T("DMARC-Eintrag", "DMARC record"),
    !m ? NA
      : m.count === 0 ? T(`Für ${d} ist kein DMARC-Eintrag gesetzt. Damit können Dritte E-Mails versenden, die so aussehen, als kämen sie von Ihnen.`, `No DMARC record is set for ${d}. Third parties can therefore send e-mails that look as if they came from you.`)
      : m.count > 1 ? T(`Unter _dmarc.${d} stehen ${m.count} DMARC-Einträge; zulässig ist genau einer. Empfänger werten dann keinen davon aus.`, `There are ${m.count} DMARC records at _dmarc.${d}; exactly one is permitted. Recipients then evaluate none of them.`)
      : !m.policy ? T(`Der DMARC-Eintrag für ${d} nennt keine gültige Vorgabe (p=). Empfänger wenden ihn dann nicht an.`, `The DMARC record for ${d} states no valid policy (p=). Recipients then do not apply it.`)
      : m.policy === "none" ? T(`Für ${d} ist ein DMARC-Eintrag mit der Vorgabe „none“ gesetzt: Er dient nur der Auswertung; ${failing.de} werden trotzdem zugestellt.`, `A DMARC record with the policy “none” is set for ${d}: it serves reporting only; ${failing.en} are still delivered.`)
      : m.policy === "quarantine" ? T(`Für ${d} ist ein DMARC-Eintrag mit der Vorgabe „quarantine“ gesetzt: ${failing.de} sollen als verdächtig behandelt werden.`, `A DMARC record with the policy “quarantine” is set for ${d}: ${failing.en} are to be treated as suspicious.`)
      : T(`Für ${d} ist ein DMARC-Eintrag mit der Vorgabe „reject“ gesetzt: ${failing.de} sollen abgewiesen werden.`, `A DMARC record with the policy “reject” is set for ${d}: ${failing.en} are to be rejected.`));
  const caa = f.caa;
  const caaItem = mk("caa", 0, !caa ? null : 1, T("CAA-Eintrag (zugelassene Zertifizierungsstellen)", "CAA record (permitted certificate authorities)"),
    !caa ? NA
      : caa.count ? T(`Für ${d} ist ein CAA-Eintrag gesetzt` + (caa.issuers.length ? ` (${caa.issuers.join(", ")}).` : "."), `A CAA record is set for ${d}` + (caa.issuers.length ? ` (${caa.issuers.join(", ")}).` : "."))
      : T(`Für ${d} ist kein CAA-Eintrag gesetzt. Dann darf jede Zertifizierungsstelle Zertifikate für die Domain ausstellen. Kein Muss; zählt nicht in die Punkte.`, `No CAA record is set for ${d}. Every certificate authority may then issue certificates for the domain. Not required; not part of the score.`));
  if (caa && caa.count) caaItem.pageText = true;
  items.push(caaItem);
  return items;
}

module.exports = {
  NAMES, WEIGHTS, VERDICTS, DISCLAIMER, RULE_NOTES, SHARED_SUFFIXES, WP_URL, SECURITY_TXT, BUDGET_MS,
  requestList, collect, securityBlock, mailBlock, handshake, resolver, sharedSuffix,
  _test: { analysePage, analyseCookies, readSpf, readDmarc, readMx, readCaa, cmpVersion, wpCache, gate, lookup }
};
