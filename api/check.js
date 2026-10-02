// /api/check — the Website-Check behind /website-check (Sprint 27, 27b; hardening, gate and assistant
// access: Sprints 30/31, contract in docs/CHECK_API.md).
//
// POST { url, lang?, trade?, town?, turnstileToken? | pass? }   browser: runs the check, answers with the PUBLIC tier
// POST { url, email, lang?, turnstileToken? | pass? }           asks for the full report: one confirmation mail with a
//                                                               signed link (double opt-in); nothing else is sent or stored
// GET  ?confirm=<token>                                         the page behind that link: one button
// POST confirm=<token> (form or JSON)                           sends the full report to the confirmed address, stores the
//                                                               lead, notifies us
// GET  ?url=<address>&lang=de|en[&format=json|md]               assistants: the PUBLIC tier as JSON or Markdown (own limits,
//                                                               CORS open); also behind api/mcp.js (tool website_check)
//
// One result for every door (founder, Sprint 36: "show everything in Ergebnis"). The answer of the browser POST, of
// GET and of the MCP tool carries: overall score and band, the six block scores with one verdict line each, the
// number of checks per status AND every check with label, status, measured value and points, the method of the speed
// block (with Lighthouse's four scores and LCP/CLS/TBT when it ran), the address, the time and the labels of the pages
// read. The report e-mail (confirmed address) is the same content as a copy to keep. Nothing carries advice ("what
// to do"): the advice texts are not part of any report, response or mail (founder, Sprint 31, still in force).
//
// What it does, block by block. A block that cannot be checked is reported as "nicht prüfbar" and gets no
// score; nothing is ever guessed.
//   1. Safety: public http/https hosts only. The host is resolved first and every address must be public
//      (no private, loopback, link-local, CGNAT, metadata, multicast or documentation ranges, IPv4 and IPv6);
//      the connection is pinned to the checked address; non-standard ports, credentials and IP literals in any
//      notation are refused; every redirect (max 3) is checked and resolved again; 1.5 MB response cap; 8 s per
//      request; own User-Agent with the address of its information page (/website-check/bot); hosts on the
//      opt-out list (data/check-optout.json) are never requested, not directly and not after a redirect.
//   2. Tempo & Technik: PageSpeed Insights API v5, mobile, Lighthouse lab values only (four category scores,
//      LCP, CLS, TBT); one retry on 429/5xx. PAGESPEED_API_KEY is optional. When PageSpeed does not answer, the
//      block is scored from our own measurement without a browser ("Eigenmessung", WEIGHTS.tempoOwn).
//   3. Auffindbarkeit: title, description, H1, canonical, noindex, lang, viewport, structured data, sitemap,
//      robots.txt, llms.txt; optional ranking lookup (DATAFORSEO_AUTH_B64 + trade + town; one call per check).
//   4. Anfrage-Tauglichkeit: tel:, mailto:, form or booking, WhatsApp, opening hours, map link, call to action;
//      up to 4 internal contact/booking pages are read as well (same host, robots.txt respected).
//   5. Vertrauen & Recht (Hinweise, keine Rechtsberatung): HTTPS, Impressum, Datenschutz, third-party hosts in
//      the HTML (listed, not judged), accessibility statement.
//   5b. Sicherheit der Website and Schutz Ihrer E-Mail-Domain (Sprint 36, api/_security.js): read-only, from the
//      fetched response, one request to the plain http address, one TLS handshake, public DNS and security.txt.
//   6. Scores: WEIGHTS below is the whole rule; the page prints it ("So bewerten wir").
//   7. Kurzfazit: a few sentences naming the overall value, the strongest and the weakest block, the open check
//      with the most weight (by its name, as a plain statement) and the method.
//      Written by the EU-routed model path of api/chat.js (CHECK_PROVIDER, CHECK_MODEL) from the scores, the
//      counts and a short list of open checks (label and measured value; never text quoted from the checked
//      site); no page text and no e-mail address reaches the model. Every number is validated against the report,
//      advice is rejected and a check may only be named by a label that was handed to the model; otherwise (or
//      without a model, or over the shared daily cost ceiling) a deterministic text is used.
//   8. Limits: see docs/CHECK_API.md. Optional shared cache/counters in Supabase (docs/sql/check_cache.sql,
//      docs/sql/check_usage_keys.sql). All in memory per instance otherwise; everything degrades to a plain message.
//      Sprint 35: three quotas for fresh checks, the same for every door: per IP address and day, per hour, per day
//      (CHECK_IP_DAILY, CHECK_HOURLY_CAP, CHECK_DAILY_CAP; changeable from the backend, docs/CHECK_QUOTA.md), and a
//      log of the checked addresses per day without anything about the visitor (docs/sql/check_runs.sql).
//   9. Bot check: with TURNSTILE_SECRET_KEY set, every browser POST needs a Cloudflare Turnstile token (or the
//      short-lived pass a verified check returns) before anything is fetched.
//
// Privacy: logs carry the host name, durations and status codes only — never an e-mail address or an IP.
// No npm dependencies. Tests: scripts/check-tool/test-check.mjs (stubbed network, nothing leaves the machine).

const dnsPromises = require("dns").promises;
const http = require("http");
const https = require("https");
const zlib = require("zlib");
const crypto = require("crypto");
const sec = require("./_security"); // Sprint 36: the two read-only areas "security" and "mail"

const SITE_ORIGIN = "https://www.rexity.ai";
const BOT_PAGE = SITE_ORIGIN + "/website-check/bot";
const UA = "RexityWebsiteCheck/1.0 (+" + BOT_PAGE + ")";
const ROBOTS_TOKEN = "rexitywebsitecheck";
const MAX_BYTES = 1500000; // 1.5 MB, compressed and decompressed
const SMALL_BYTES = 300000; // robots.txt, sitemap.xml, llms.txt
const FETCH_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;
const PSI_TIMEOUT_MS = 50000; // one attempt
const PSI_BUDGET_MS = 55000; // both attempts together (page fetch 16 s worst case + this + Kurzfazit 12 s < maxDuration 90 s)
const PSI_RETRY_WAIT_MS = 1500;
const PSI_RETRY_MIN_LEFT_MS = 12000; // no second attempt when less than this is left of the budget
const SUB_PAGES = 4; // internal contact/booking pages read beyond the entered one
const SUB_TIMEOUT_MS = 6000;
const SUB_BUDGET_MS = 9000; // all of them together
const SUB_BYTES = 800000;
const ASSET_IMAGES = 6; // sampled images (size and caching headers)
const ASSET_FILES = 3; // sampled stylesheets and scripts (caching headers)
const ASSET_CACHE_SAMPLE = 6; // files whose caching headers are scored
const ASSET_TIMEOUT_MS = 4000;
const ASSET_BUDGET_MS = 7000;
const SERP_TIMEOUT_MS = 15000;
const SUMMARY_TIMEOUT_MS = 12000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 300;
const IP_LIMIT = 5; // burst protection: fresh checks per IP in 10 minutes (the daily quota per IP is QUOTA_ENV.ip below)
const IP_WINDOW_MS = 10 * 60 * 1000;
const REQUEST_LIMIT = 40; // every request (cached ones too) per IP and window
const HOST_LIMIT = 6; // fresh checks per host and hour
const HOST_WINDOW_MS = 60 * 60 * 1000;
const MAIL_IP_LIMIT = 3; // report mails per IP and window
const MAIL_ADDRESS_LIMIT = 2; // report mails per address and day
const MAX_BODY = 6000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Assistant tier (GET /api/check, api/mcp.js): stricter than the browser's limits; cached results are free.
const API_REQUEST_LIMIT = 30; // every assistant request (cached ones too) per IP and 10 minutes
// Sprint 35: the former "3 fresh checks per IP and hour" of GET/MCP is gone. The daily quota per IP address
// (QUOTA_ENV.ip, all doors together, shared store) replaces it; 3 an hour would have stopped a caller who simply
// runs the 5 checks of a day one after the other.
// Report by e-mail: the confirmation link and the pass a verified browser gets
const CONFIRM_TTL_MS = 48 * 60 * 60 * 1000;
const PASS_TTL_MS = 30 * 60 * 1000;

const envInt = (name, fallback) => {
  const v = parseInt(String(process.env[name] || "").trim(), 10);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
};
// Sprint 35 (founder, 2 Oct 2026): the three quotas for fresh checks, all doors together (browser form, GET, MCP).
// Cached results are free and uncounted. The numbers in force can be changed from the backend without a deploy
// (quotaNow() below, docs/CHECK_QUOTA.md); these are the values without such an override.
//   ip    fresh checks per IP address and Europe/Berlin day   CHECK_IP_DAILY    default 5
//   hour  fresh checks per clock hour, all visitors           CHECK_HOURLY_CAP  default 200
//   day   fresh checks per Europe/Berlin day, all visitors    CHECK_DAILY_CAP   default 1000 (200 until Sprint 35)
const QUOTA_ENV = { ip: envInt("CHECK_IP_DAILY", 5) || 5, hour: envInt("CHECK_HOURLY_CAP", 200) || 200, day: envInt("CHECK_DAILY_CAP", 1000) || 1000 };
const API_DAILY_CAP = envInt("CHECK_API_DAILY_CAP", 50); // of the day's fresh checks: at most this many through GET and MCP
// Until Sprint 35 these two shared the number of CHECK_DAILY_CAP (200). They keep 200: report requests cost mail
// quota, ranking lookups cost money, and neither should grow because the check quota did.
const MAIL_DAILY_CAP = envInt("CHECK_MAIL_DAILY_CAP", 200); // report requests (one mail each) per day
const LOOKUP_DAILY_CAP = envInt("CHECK_LOOKUP_DAILY_CAP", 200); // ranking lookups per day
// The Kurzfazit's model route (Sprint 30): provider order and model are the check's own, not the chat's.
const CHECK_PROVIDER = String(process.env.CHECK_PROVIDER || "").trim().toLowerCase();
const CHECK_ORDER = CHECK_PROVIDER === "azure" ? ["azure", "bedrock"] : ["bedrock", "azure"];
if (CHECK_PROVIDER && !["azure", "bedrock"].includes(CHECK_PROVIDER)) console.error(`[check] CHECK_PROVIDER "${CHECK_PROVIDER.slice(0, 20)}" is unknown (bedrock|azure); using bedrock, then azure`);
const CHECK_MODEL = String(process.env.CHECK_MODEL || "eu.anthropic.claude-opus-5-5").trim();
const CHECK_MAX_TOKENS = Math.min(2000, Math.max(200, envInt("CHECK_MAX_TOKENS", 400)));

// Hosts that are never requested (data/check-optout.json; an entry covers the host and its subdomains).
const OPTOUT = (() => {
  try {
    const list = require("../data/check-optout.json").hosts;
    return (Array.isArray(list) ? list : []).map((h) => String(h || "").trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/[/?#].*$/, "").replace(/\.$/, "").replace(/^www\./, "")).filter((h) => /^[a-z0-9.-]+\.[a-z0-9-]+$/.test(h));
  } catch (e) {
    console.error("[check] data/check-optout.json missing or invalid:", e && e.message);
    return [];
  }
})();

// ---- Injectable network (tests replace these; nothing else in this file touches the network) -----------
const deps = {
  lookup: (host) => dnsPromises.lookup(host, { all: true, verbatim: true }),
  transport: defaultTransport,
  fetch: (...a) => fetch(...a),
  now: () => Date.now(),
  wait: (ms) => new Promise((r) => setTimeout(r, ms)), // back-off before the second PageSpeed attempt
  summarise: null, // tests may replace the model call; default: api/chat.js completeText (loaded lazily)
  notify: null, // default: api/_notify.js (loaded lazily)
  insertLead: null, // default: api/lead.js insertLead (loaded lazily)
  verifyTurnstile: null, // default: api/lead.js verifyTurnstile (loaded lazily)
  optout: OPTOUT, // tests add hosts
  // Sprint 36 (api/_security.js): tests replace these three; nothing else in the two new areas touches the network
  tls: null, // (host, timeoutMs) -> the facts of one TLS handshake; default: sec.handshake with the pinned public address
  dns: null, // { resolveMx, resolveTxt, resolveCaa }; default: node:dns/promises through the system's resolvers
  securityRun: undefined, // tests may replace the whole collection; undefined: sec.collect
  randomBytes: (n) => crypto.randomBytes(n)
};
function isOptedOut(hostname) {
  const h = String(hostname || "").toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  return deps.optout.some((e) => h === e || h.endsWith("." + e));
}

// ---- The score rule (exported; the page prints it) ------------------------------------------------
// Block score = points reached / points possible × 100 over the checks that could be carried out.
// Overall = weighted mean of the blocks that have a score. "info" checks are shown, never scored.
const WEIGHTS = {
  // Sprint 36: six areas. The first four keep their proportions (30 : 25 : 30 : 15 = 24 : 20 : 24 : 12); the two new
  // ones take 20 of the 100 (proposal, to be confirmed by the founder). Until Sprint 36: tempo 30, find 25,
  // contact 30, trust 15.
  blocks: { tempo: 24, find: 20, contact: 24, trust: 12, security: 12, mail: 8 },
  tempo: { performance: 50, accessibility: 20, bestPractices: 15, seo: 15 },
  // Sprint 27b — "Eigenmessung": the Tempo block when PageSpeed Insights does not answer. Measured by this
  // function with plain HTTP, no browser. Each check: full points, half points or none (limits below).
  tempoOwn: { response: 25, compression: 10, weight: 10, blocking: 20, lazy: 8, dimensions: 7, formats: 5, largest: 5, caching: 10 },
  tempoOwnLimits: {
    responseMs: [800, 1800], // time to the first byte of the HTML: up to 0.8 s full, up to 1.8 s half
    htmlKb: [100, 300], // decoded HTML: up to 100 KB full, up to 300 KB half
    blocking: [3, 8], // stylesheets + scripts without defer/async in the head: up to 3 full, up to 8 half
    lazyShare: [0.7, 0.3], // images after the first two with loading="lazy": from 70 % full, from 30 % half
    dimensionsShare: [0.8, 0.4], // images with width and height: from 80 % full, from 40 % half
    formatsShare: [0.5, 0], // images as WebP, AVIF or SVG: from 50 % full, any half
    imageKb: [300, 1000], // largest sampled image: up to 300 KB full, up to 1 MB half
    cachingShare: [0.8, 0.4], // sampled files a browser may keep (max-age of a day or more: 1; only revalidation by ETag/Last-Modified: ½)
    cacheMaxAge: 86400
  },
  bands: { good: 80, mid: 50 }, // the words on the page: from 80 good, from 50 medium, below weak
  find: { title: 15, description: 15, h1: 10, canonical: 10, indexable: 15, lang: 5, viewport: 10, schema: 10, sitemap: 7, robots: 3 },
  contact: { phone: 25, form: 25, email: 10, whatsapp: 10, hours: 10, map: 10, cta: 10 },
  trust: { https: 40, impressum: 30, datenschutz: 30, a11y: 0 }, // a11y: note only (micro-enterprises are usually exempt)
  // Sprint 36 (api/_security.js): the points of the two read-only areas; checks not named there are notes
  security: sec.WEIGHTS.security,
  mail: sec.WEIGHTS.mail,
  securityLimits: sec.WEIGHTS.limits,
  // One matching link under the result: contact below 60 -> /web/web-design; else tempo or find below 60 ->
  // /web/website-umzug; else /website-wartung.
  offerThreshold: 60
};

class CheckError extends Error {
  constructor(code, message) { super(message || code); this.code = code; }
}

// ---- 1. URL safety -----------------------------------------------------------------------------
function normaliseUrl(raw) {
  let s = String(raw || "").trim();
  if (!s || s.length > 500) throw new CheckError("bad_url");
  if (/[\s<>"'`\\]/.test(s)) throw new CheckError("bad_url");
  const hadScheme = /^[a-z][a-z0-9+.-]*:/i.test(s) && !/^[^/:]+:\d+(\/|$)/.test(s);
  if (!hadScheme) s = "https://" + s.replace(/^\/+/, "");
  let u;
  try { u = new URL(s); } catch (_e) { throw new CheckError("bad_url"); }
  u.hash = "";
  assertSafeUrl(u);
  return { url: u, hadScheme };
}

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".intranet", ".lan", ".home", ".corp", ".test", ".invalid", ".example", ".onion", ".arpa"];
function assertSafeUrl(u) {
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new CheckError("bad_scheme");
  if (u.username || u.password) throw new CheckError("bad_url");
  if (u.port) throw new CheckError("bad_port"); // new URL() drops the default port; anything left is non-standard
  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host.length > 253) throw new CheckError("bad_url");
  if (host.startsWith("[") || isIPv4Literal(host) || /^[0-9.]+$/.test(host) || /^0x/i.test(host)) throw new CheckError("private_host"); // no IP literals at all
  if (!host.includes(".")) throw new CheckError("private_host");
  if (host === "localhost" || BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) throw new CheckError("private_host");
  if (!/^[a-z0-9.-]+$/.test(host)) throw new CheckError("bad_url"); // URL() has already punycoded international names
  if (isOptedOut(host)) throw new CheckError("optout"); // Sprint 30: the owner asked us not to check this site
}

function isIPv4Literal(s) { return /^\d{1,3}(\.\d{1,3}){3}$/.test(s); }
function ipv4ToInt(s) {
  const p = s.split(".").map((x) => parseInt(x, 10));
  if (p.length !== 4 || p.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return null;
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
}
const V4_BLOCKED = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4]
].map(([a, bits]) => [ipv4ToInt(a), bits]);
function isPublicIPv4(s) {
  const n = ipv4ToInt(s);
  if (n === null) return false;
  for (const [base, bits] of V4_BLOCKED) {
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    if (((n & mask) >>> 0) === ((base & mask) >>> 0)) return false;
  }
  return true;
}
// -> eight 16-bit groups, or null
function parseIPv6(input) {
  let s = String(input).toLowerCase().replace(/^\[|\]$/g, "");
  const zone = s.indexOf("%");
  if (zone >= 0) s = s.slice(0, zone);
  if (!/^[0-9a-f:.]+$/.test(s) || !s.includes(":")) return null;
  let tail = [];
  const lastColon = s.lastIndexOf(":");
  if (s.slice(lastColon + 1).includes(".")) {
    const n = ipv4ToInt(s.slice(lastColon + 1));
    if (n === null) return null;
    tail = [(n >>> 16) & 0xffff, n & 0xffff];
    s = s.slice(0, lastColon + 1) + "0:0";
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const part = (x) => (x === "" ? [] : x.split(":"));
  const head = part(halves[0]);
  const rest = halves.length === 2 ? part(halves[1]) : [];
  if ([...head, ...rest].some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  let groups;
  if (halves.length === 2) {
    const fill = 8 - head.length - rest.length;
    if (fill < 1) return null;
    groups = [...head, ...Array(fill).fill("0"), ...rest];
  } else groups = head;
  if (groups.length !== 8) return null;
  const out = groups.map((g) => parseInt(g, 16));
  if (tail.length) { out[6] = tail[0]; out[7] = tail[1]; }
  return out;
}
function isPublicIPv6(s) {
  const g = parseIPv6(s);
  if (!g) return false;
  const v4 = () => `${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`;
  if (g.slice(0, 5).every((x) => x === 0) && (g[5] === 0xffff || g[5] === 0)) return g[5] === 0xffff ? isPublicIPv4(v4()) : false; // ::, ::1, ::ffff:a.b.c.d, ::a.b.c.d
  if (g[0] === 0x64 && g[1] === 0xff9b) return g.slice(2, 6).every((x) => x === 0) ? isPublicIPv4(v4()) : false; // NAT64
  if ((g[0] & 0xe000) !== 0x2000) return false; // only global unicast 2000::/3 (drops fc00::/7, fe80::/10, fec0::/10, ff00::/8)
  if (g[0] === 0x2001 && g[1] === 0x0db8) return false; // documentation
  if (g[0] === 0x2001 && g[1] < 0x0200) return false; // 2001::/23 special purpose (Teredo, ORCHID, benchmarking)
  if (g[0] === 0x2002) return false; // 6to4 (embeds an IPv4 address)
  return true;
}
function isPublicAddress(address, family) {
  const fam = family || (String(address).includes(":") ? 6 : 4);
  return fam === 6 ? isPublicIPv6(address) : isPublicIPv4(address);
}

// Resolves the host and returns one public address; throws when any resolved address is not public.
async function resolvePublic(hostname) {
  let list;
  try { list = await deps.lookup(hostname); } catch (_e) { throw new CheckError("dns"); }
  if (!Array.isArray(list)) list = list ? [list] : [];
  list = list.map((x) => (typeof x === "string" ? { address: x, family: x.includes(":") ? 6 : 4 } : x)).filter((x) => x && x.address);
  if (!list.length) throw new CheckError("dns");
  for (const a of list) if (!isPublicAddress(a.address, a.family)) throw new CheckError("private_host");
  return list.find((a) => a.family === 4) || list[0];
}

// One GET (or HEAD: opt.method) with the connection pinned to `address`.
// -> { status, headers, body: Buffer, truncated, timing: { ttfbMs, totalMs }, wireBytes }
// timing: from sending the request on a new connection (TCP and TLS set-up included) to the response headers
// (ttfbMs) and to the last byte of the body (totalMs); wireBytes: body bytes as transferred (before decompression).
function defaultTransport(u, opt) {
  return new Promise((resolve, reject) => {
    const mod = u.protocol === "https:" ? https : http;
    const started = performance.now();
    let ttfbMs = null;
    let wireBytes = 0;
    let done = false;
    const finish = (fn, v) => { if (!done) { done = true; clearTimeout(timer); fn(v); } };
    const req = mod.request({
      protocol: u.protocol,
      hostname: u.hostname,
      port: opt.port || (u.protocol === "https:" ? 443 : 80), // opt.port: tests only (safeFetch never sets it)
      path: (u.pathname || "/") + (u.search || ""),
      method: opt.method === "HEAD" ? "HEAD" : "GET",
      servername: u.hostname,
      headers: { "User-Agent": UA, Accept: opt.accept || "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5", "Accept-Encoding": "gzip, deflate, br", "Accept-Language": "de,en;q=0.7" },
      lookup: (_h, options, cb) => {
        if (options && options.all) cb(null, [{ address: opt.address, family: opt.family }]);
        else cb(null, opt.address, opt.family);
      }
    }, (res) => {
      ttfbMs = Math.round(performance.now() - started);
      res.on("data", (c) => { wireBytes += c.length; });
      const enc = String(res.headers["content-encoding"] || "").toLowerCase();
      let stream = res;
      if (opt.method === "HEAD") { /* no body: nothing to decompress */ }
      else if (enc === "gzip" || enc === "x-gzip") stream = res.pipe(zlib.createGunzip());
      else if (enc === "deflate") stream = res.pipe(zlib.createInflate());
      else if (enc === "br") stream = res.pipe(zlib.createBrotliDecompress());
      const chunks = [];
      let size = 0;
      let truncated = false;
      const end = () => finish(resolve, { status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks), truncated, timing: { ttfbMs, totalMs: Math.round(performance.now() - started) }, wireBytes });
      stream.on("data", (c) => {
        if (truncated) return;
        if (size + c.length > opt.maxBytes) {
          chunks.push(c.subarray(0, Math.max(0, opt.maxBytes - size)));
          size = opt.maxBytes;
          truncated = true;
          req.destroy();
          end();
          return;
        }
        chunks.push(c);
        size += c.length;
      });
      stream.on("end", end);
      stream.on("error", () => (chunks.length ? end() : finish(reject, new CheckError("fetch_failed"))));
      res.on("error", () => (chunks.length ? end() : finish(reject, new CheckError("fetch_failed"))));
    });
    const timer = setTimeout(() => { req.destroy(); finish(reject, new CheckError("timeout")); }, opt.timeoutMs);
    req.on("error", () => finish(reject, new CheckError("fetch_failed")));
    req.end();
  });
}

// GET with all safety checks, following up to MAX_REDIRECTS redirects (each one checked again).
async function safeFetch(startUrl, { maxBytes = MAX_BYTES, timeoutMs = FETCH_TIMEOUT_MS, accept, method } = {}) {
  let u = startUrl instanceof URL ? new URL(startUrl.href) : new URL(String(startUrl));
  const chain = [];
  const cookies = []; // the Set-Cookie lines of every hop: what a visitor's first page view receives (read, never stored or sent back)
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    assertSafeUrl(u);
    const addr = await resolvePublic(u.hostname);
    const res = await deps.transport(u, { address: addr.address, family: addr.family, maxBytes, timeoutMs, accept, method });
    const status = res.status;
    const headers = lowerKeys(res.headers);
    cookies.push(...setCookieLines(res.headers));
    if (status >= 300 && status < 400 && headers.location) {
      chain.push(u.href);
      let next;
      try { next = new URL(String(headers.location), u); } catch (_e) { throw new CheckError("bad_redirect"); }
      next.hash = "";
      u = next;
      continue;
    }
    let body = Buffer.isBuffer(res.body) ? res.body : Buffer.from(res.body || "");
    let truncated = Boolean(res.truncated);
    if (body.length > maxBytes) { body = body.subarray(0, maxBytes); truncated = true; }
    const tm = res.timing && Number.isFinite(res.timing.ttfbMs) && Number.isFinite(res.timing.totalMs) ? { ttfbMs: Math.round(res.timing.ttfbMs), totalMs: Math.round(res.timing.totalMs) } : null;
    return { status, headers, body, truncated, finalUrl: u, redirects: chain, cookies, timing: tm, wireBytes: Number.isFinite(res.wireBytes) ? res.wireBytes : null };
  }
  throw new CheckError("too_many_redirects");
}
function setCookieLines(h) {
  for (const [k, v] of Object.entries(h || {})) if (k.toLowerCase() === "set-cookie") return (Array.isArray(v) ? v : [v]).map((x) => String(x || "")).filter(Boolean).slice(0, 50);
  return [];
}
// One request WITHOUT following a redirect (Sprint 36: the plain http address and security.txt). Same safety rules as
// every fetch: public host, standard port, pinned address, opt-out list.
async function plainGet(url, { timeoutMs = FETCH_TIMEOUT_MS, maxBytes = SMALL_BYTES } = {}) {
  const u = new URL(String(url));
  assertSafeUrl(u);
  const addr = await resolvePublic(u.hostname);
  const res = await deps.transport(u, { address: addr.address, family: addr.family, maxBytes, timeoutMs, accept: "text/plain,*/*;q=0.5" });
  return { status: res.status, headers: lowerKeys(res.headers), body: Buffer.isBuffer(res.body) ? res.body : Buffer.from(res.body || "") };
}
function lowerKeys(h) {
  const out = {};
  for (const [k, v] of Object.entries(h || {})) out[k.toLowerCase()] = Array.isArray(v) ? v.join(", ") : String(v);
  return out;
}
function decodeBody(buf, headers) {
  const ct = String((headers && headers["content-type"]) || "");
  let charset = (/charset=["']?([\w-]+)/i.exec(ct) || [])[1];
  if (!charset) charset = (/<meta[^>]+charset=["']?([\w-]+)/i.exec(buf.subarray(0, 2048).toString("latin1")) || [])[1];
  return /^(iso-8859-1|latin1|windows-1252|iso-8859-15)$/i.test(charset || "") ? buf.toString("latin1") : buf.toString("utf8");
}

// ---- robots.txt (for what we fetch beyond the entered URL) ---------------------------------------
function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  let cur = null;
  let lastWasAgent = false;
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (key === "sitemap") { sitemaps.push(val); continue; }
    if ((key === "allow" || key === "disallow") && cur) cur.rules.push({ allow: key === "allow", path: val });
  }
  return { groups, sitemaps };
}
function robotsAllows(robots, pathname) {
  if (!robots) return true;
  const own = robots.groups.filter((g) => g.agents.some((a) => a !== "*" && ROBOTS_TOKEN.includes(a)));
  const groups = own.length ? own : robots.groups.filter((g) => g.agents.includes("*"));
  let best = null;
  for (const g of groups) {
    for (const r of g.rules) {
      if (!r.path) continue; // "Disallow:" (empty) allows everything
      const re = new RegExp("^" + r.path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"));
      if (!re.test(pathname)) continue;
      if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow)) best = r;
    }
  }
  return best ? best.allow : true;
}

// ---- HTML helpers (regex based; no parser dependency) ------------------------------------------------
function decodeEntities(s) {
  return String(s || "")
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => safeChar(parseInt(d, 10)))
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&(apos|#39);/g, "'")
    .replace(/&auml;/g, "ä").replace(/&ouml;/g, "ö").replace(/&uuml;/g, "ü").replace(/&Auml;/g, "Ä").replace(/&Ouml;/g, "Ö").replace(/&Uuml;/g, "Ü").replace(/&szlig;/g, "ß");
}
function safeChar(n) { try { return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ""; } catch (_e) { return ""; } }
function attrs(tag) {
  const out = {};
  const re = /([a-zA-Z_:][\w:.-]*)\s*(?:=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  const inner = tag.replace(/^<\/?[a-zA-Z][\w:-]*/, "").replace(/\/?>$/, "");
  let m;
  while ((m = re.exec(inner))) out[m[1].toLowerCase()] = decodeEntities(m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : m[5] !== undefined ? m[5] : "");
  return out;
}
const tags = (html, name) => html.match(new RegExp("<" + name + "\\b[^>]*>", "gi")) || [];
const textOf = (html) => decodeEntities(String(html || "").replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

function collectTypes(node, out, depth) {
  if (!node || depth > 6) return;
  if (Array.isArray(node)) { for (const n of node) collectTypes(n, out, depth + 1); return; }
  if (typeof node !== "object") return;
  const t = node["@type"];
  for (const x of Array.isArray(t) ? t : [t]) if (typeof x === "string") out.add(x);
  if (node.openingHours || node.openingHoursSpecification) out.add("__hours");
  for (const v of Object.values(node)) if (v && typeof v === "object") collectTypes(v, out, depth + 1);
}
const BUSINESS_TYPE_RE = /(LocalBusiness|Organization|Corporation|Store|Restaurant|Dentist|Physician|MedicalBusiness|ProfessionalService|HomeAndConstructionBusiness|Electrician|Plumber|RoofingContractor|HousePainter|GeneralContractor|AutoRepair|AutomotiveBusiness|HealthAndBeautyBusiness|HairSalon|BeautySalon|SportsActivityLocation|ExerciseGym|LodgingBusiness|Hotel|FoodEstablishment|LegalService|Attorney|AccountingService|RealEstateAgent|FinancialService|InsuranceAgency|TravelAgency|Bakery|CafeOrCoffeeShop|DaySpa|NailSalon|TattooParlor|VeterinaryCare|Pharmacy|Optician|ChildCare|EducationalOrganization|School|NGO|MedicalClinic|Florist|Locksmith|MovingCompany|HVACBusiness)$/;

const SECOND_LEVEL = new Set(["co.uk", "org.uk", "ac.uk", "gov.uk", "com.au", "net.au", "org.au", "co.at", "or.at", "co.nz", "com.br", "com.tr", "co.jp", "co.za", "com.mx", "com.pl", "co.in"]);
function baseDomain(host) {
  const p = String(host || "").toLowerCase().replace(/\.$/, "").split(".");
  if (p.length <= 2) return p.join(".");
  const two = p.slice(-2).join(".");
  return SECOND_LEVEL.has(two) ? p.slice(-3).join(".") : two;
}
const KNOWN_HOSTS = [
  [/(^|\.)fonts\.(googleapis|gstatic)\.com$/, "Google Fonts"],
  [/(^|\.)googletagmanager\.com$/, "Google Tag Manager"],
  [/(^|\.)google-analytics\.com$|(^|\.)analytics\.google\.com$/, "Google Analytics"],
  [/(^|\.)(doubleclick\.net|googlesyndication\.com|googleadservices\.com)$/, "Google Ads"],
  [/(^|\.)maps\.(googleapis|gstatic)\.com$|(^|\.)maps\.google\.[a-z.]+$/, "Google Maps"],
  [/(^|\.)(youtube\.com|youtube-nocookie\.com|ytimg\.com)$/, "YouTube"],
  [/(^|\.)(recaptcha\.net)$|(^|\.)gstatic\.com$/, "Google (reCAPTCHA / statische Dateien)"],
  [/(^|\.)(facebook\.net|facebook\.com|fbcdn\.net)$/, "Meta (Facebook)"],
  [/(^|\.)(instagram\.com|cdninstagram\.com)$/, "Instagram"],
  [/(^|\.)(tiktok\.com|ttwstatic\.com)$/, "TikTok"],
  [/(^|\.)(linkedin\.com|licdn\.com)$/, "LinkedIn"],
  [/(^|\.)(hotjar\.com|clarity\.ms)$/, "Besucher-Aufzeichnung"],
  [/(^|\.)(vimeo\.com|vimeocdn\.com)$/, "Vimeo"],
  [/(^|\.)(jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com|bootstrapcdn\.com|jquery\.com)$/, "Skript-Bibliothek (CDN)"],
  [/(^|\.)(cookiebot\.com|usercentrics\.eu|consentmanager\.net|cookiefirst\.com|borlabs\.io|onetrust\.com|cookielaw\.org)$/, "Einwilligungs-Dienst"],
  [/(^|\.)(typekit\.net|fontawesome\.com|fonts\.bunny\.net)$/, "Schrift-Dienst"]
];
const hostLabel = (h) => { const k = KNOWN_HOSTS.find(([re]) => re.test(h)); return k ? k[1] : ""; };

const BOOKING_HOST_RE = /(calendly\.com|cal\.com|doctolib\.|treatwell\.|booksy\.com|shore\.com|timify\.com|simplybook\.|etermin\.net|terminland\.|calenso\.|planity\.com|fresha\.com|appointlet\.|setmore\.com|acuityscheduling\.com|opentable\.|thefork\.|resmio\.com|quandoo\.|eversports\.|mindbodyonline\.com|termin-direkt\.|salonkee\.|studiobookr\.com|outlook\.office365\.com\/(owa\/calendar|book))/i;
const BOOKING_WORD_RE = /(termin\s*(buchen|vereinbaren|anfragen|reservieren|online)|online[- ]?termin|jetzt\s+buchen|tisch\s+reservieren|reservieren|probetraining\s+(buchen|vereinbaren)|book\s+(now|online|an?\s+appointment|a\s+table|a\s+call)|buchung|booking)/i;
// Sprint 27b: a link or button whose (short) label names the action counts as a way to book
const ACTION_WORD_RE = /(buchen|buchung|termin(?!e\b|kalender|übersicht|uebersicht)|probetraining|reservier|\bbook(ing)?\b|appointment|reservation)/i;
// booking tools rendered by a script: their usual data attributes and container classes
const BOOKING_ATTR_RE = /(\bdata-[\w-]*(booking|buchung|termin|reserv|calendly|appointment|cal-link)[\w-]*\s*=|class\s*=\s*["'][^"']*(calendly-inline-widget|booking-widget|simplybook|eversports)[^"']*["'])/i;
// a phone number in the visible text: international prefix, or a national number right after a telephone word
const PHONE_INTL_RE = /(?:\+|\b00)[1-9]\d{0,2}[\s\d/().-]{6,18}\d/;
const PHONE_WORD_RE = /(?:\btel(?:efon)?\b|\bfon\b|\bmobil\b|\bhandy\b|\bphone\b|\bhotline\b|rufnummer|\brufen\b|\banruf|\bcall\b|☎|📞)[^\d+]{0,40}(\(?0\d{2,5}\)?[\s/.-]{0,3}\d[\d\s/.-]{3,12}\d)/i;
// internal pages worth reading for the enquiry block, by link text or address (best first)
const SUB_PAGE_RULES = [
  [/(kontakt|contact|so\s+erreichen\s+sie|anfahrt)/i, 100],
  [/(\btermin\b|termin[\s-]?(buch|vereinbar|anfrag|reserv)|online-?termin|\bbuchen\b|reservier|\bbook(ing)?\b|appointment)/i, 80],
  [/(probetraining|\banfragen?\b|angebot\s+(anfordern|einholen|anfragen)|beratungs(termin|gespräch|gespraech)|erstgespräch|erstgespraech|rückruf|rueckruf|enquir|inquir|\bquote\b|get\s+in\s+touch)/i, 60],
  [/(impressum|imprint|legal[\s-]?notice)/i, 30]
];
const NOT_A_PAGE_RE = /\.(pdf|jpe?g|png|gif|webp|avif|svg|zip|docx?|xlsx?|ics|vcf|mp4|mp3|xml|txt)$/i;
const CTA_RE = /(termin|anfrag|angebot|kontakt|buchen|reservier|anrufen|rückruf|rueckruf|beratung|beraten|probetraining|jetzt|kostenlos\s+test|unverbindlich|bestellen|contact|book|quote|call\s+us|get\s+(started|in\s+touch)|request|enquir)/i;
const HOURS_WORD_RE = /(öffnungszeiten|oeffnungszeiten|geschäftszeiten|sprechzeiten|sprechstunden|bürozeiten|opening\s+hours|business\s+hours|office\s+hours)/i;
const HOURS_PATTERN_RE = /\b(mo|di|mi|do|fr|sa|so|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|mon|tue|wed|thu|fri|sat|sun)\b[^<]{0,40}?\b\d{1,2}[:.]\d{2}\s*(uhr)?\s*(-|–|—|bis|to)\s*\d{1,2}[:.]\d{2}/i;
const MAP_RE = /(google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps|g\.page\/|g\.co\/kgs|business\.google\.com|openstreetmap\.org|maps\.apple\.com|bing\.com\/maps)/i;

// -> everything the three HTML blocks need, from one HTML string
function analyseHtml(html, finalUrl, headers) {
  const page = new URL(finalUrl);
  const noComments = String(html || "").replace(/<!--[\s\S]*?-->/g, " ");
  const headEnd = noComments.search(/<\/head>/i);
  const bodyStart = noComments.search(/<body\b/i);
  const body = bodyStart >= 0 ? noComments.slice(bodyStart) : noComments;
  const markup = noComments.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, (m) => (/^<script\b[^>]*application\/ld\+json/i.test(m) ? m : m.replace(/>[\s\S]*</, "><")));

  const titleM = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(noComments);
  const title = titleM ? decodeEntities(titleM[1]).replace(/\s+/g, " ").trim() : "";
  const metas = tags(noComments, "meta").map(attrs);
  const meta = (name) => (metas.find((m) => (m.name || "").toLowerCase() === name) || {}).content || "";
  const description = meta("description").replace(/\s+/g, " ").trim();
  const robotsMeta = [meta("robots"), meta("googlebot"), (headers && headers["x-robots-tag"]) || ""].join(",").toLowerCase();
  const h1Count = (noComments.match(/<h1\b/gi) || []).length;
  const links = tags(noComments, "link").map(attrs);
  const canonicalRaw = (links.find((l) => /\bcanonical\b/i.test(l.rel || "")) || {}).href || "";
  let canonical = "";
  try { canonical = canonicalRaw ? new URL(canonicalRaw, page).href : ""; } catch (_e) { canonical = ""; }
  const htmlTag = attrs((tags(noComments, "html")[0]) || "<html>");
  const viewport = meta("viewport");

  // structured data: JSON-LD types and microdata itemtypes
  const types = new Set();
  for (const m of noComments.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { collectTypes(JSON.parse(m[1].trim()), types, 0); } catch (_e) { /* invalid JSON-LD is ignored */ }
  }
  for (const m of noComments.matchAll(/itemtype\s*=\s*["']https?:\/\/schema\.org\/([A-Za-z]+)["']/gi)) types.add(m[1]);
  const schemaHours = types.delete("__hours") || /itemprop\s*=\s*["']openingHours/i.test(noComments);
  const schemaTypes = [...types].slice(0, 12);

  // anchors with their text
  const anchors = [];
  for (const m of markup.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const a = attrs("<a" + m[1] + ">");
    anchors.push({ href: (a.href || "").trim(), text: textOf(m[2]) || a["aria-label"] || a.title || "", index: m.index });
    if (anchors.length >= 1500) break;
  }
  const hrefs = anchors.map((a) => a.href);
  const has = (re) => hrefs.some((h) => re.test(h));
  const phone = has(/^tel:\+?[\d\s()/.-]{5,}/i);
  const email = has(/^mailto:[^@\s]+@[^@\s]+/i);
  const whatsapp = has(/(^https?:\/\/(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|web\.whatsapp\.com)\/|^whatsapp:)/i);

  // contact form: a form with an e-mail, phone or message field that is not a search form
  let form = false;
  for (const m of markup.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)) {
    const fa = attrs("<form" + m[1] + ">");
    if (/search/i.test(fa.role || "") || /search|suche/i.test(fa.class || "") || /[?&]s=|\/search/i.test(fa.action || "")) continue;
    if (/<textarea\b/i.test(m[2]) || /type\s*=\s*["']?(email|tel)\b/i.test(m[2]) || /name\s*=\s*["'][^"']*(mail|phone|telefon|message|nachricht)/i.test(m[2])) { form = true; break; }
  }
  const iframes = tags(markup, "iframe").map(attrs);
  const actionLabel = (t) => BOOKING_WORD_RE.test(t) || (t.length <= 60 && ACTION_WORD_RE.test(t));
  const bookingLink = anchors.some((a) => BOOKING_HOST_RE.test(a.href) || (actionLabel(a.text) && a.href && !/^(mailto|tel):/i.test(a.href)));
  let bookingButton = false;
  for (const m of markup.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    if (actionLabel(textOf(m[2]) || attrs("<b" + m[1] + ">")["aria-label"] || "")) { bookingButton = true; break; }
  }
  // a booking tool's host in any tag (frame, script, link, data attribute), or its usual data attributes / classes
  const bookingWidget = (markup.match(/<[a-zA-Z][^>]*>/g) || []).some((t) => /^<(iframe|script|div|section|a|button|link|form)\b/i.test(t) && (BOOKING_HOST_RE.test(t) || BOOKING_ATTR_RE.test(t)));
  const booking = bookingLink || bookingButton || bookingWidget;

  const bodyText = textOf(body);
  // a phone number that is visible but not a tel: link (reported as partly met)
  const phoneText = PHONE_INTL_RE.test(bodyText) || PHONE_WORD_RE.test(bodyText);
  const hours = schemaHours || HOURS_WORD_RE.test(bodyText) || HOURS_PATTERN_RE.test(bodyText);
  const map = has(MAP_RE) || iframes.some((f) => MAP_RE.test(f.src || "") || /google\.[a-z.]+\/maps/i.test(f.src || ""));

  // call to action in the first screen (an indication only): a tel: link or an action label among the first
  // links and buttons of the body, or in the first 6,000 characters of body markup
  const bodyMarkup = bodyStart >= 0 ? markup.slice(markup.search(/<body\b/i)) : markup;
  const first = bodyMarkup.slice(0, 6000);
  const firstLabels = [];
  for (const m of first.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const a = attrs("<a" + m[2] + ">");
    // a label repeated inside the element (hover-animation duplicates) is read once
    firstLabels.push({ href: a.href || "", text: (textOf(m[3]) || a["aria-label"] || "").replace(/^(.{2,40}?)\s+\1$/, "$1") });
  }
  const ctaHit = firstLabels.find((l) => /^tel:/i.test(l.href) || /^https?:\/\/wa\.me\//i.test(l.href) || (l.text.length <= 40 && CTA_RE.test(l.text)));
  const cta = Boolean(ctaHit);

  const linkTo = (re) => anchors.some((a) => re.test(a.text) || re.test(safePath(a.href)));
  const impressum = linkTo(/(impressum|imprint|legal[\s-]?notice|anbieterkennzeichnung)/i);
  const datenschutz = linkTo(/(datenschutz|privacy|datenschutzerkl)/i);
  const a11y = linkTo(/(barrierefreiheit|barrierefrei|accessibility)/i);

  // third-party hosts the HTML itself loads (before any consent could be given): scripts, stylesheets, preloads,
  // images, frames, media, @import and url() in inline styles. Scripts with a non-JavaScript type (the usual
  // way consent tools park a script) and data-src attributes are not loaded and therefore not counted.
  const own = baseDomain(page.hostname);
  const third = new Map();
  const note = (raw, kind) => {
    if (!raw || /^(data|blob|about|javascript|mailto|tel):/i.test(raw)) return;
    let h;
    try { h = new URL(raw, page).hostname.toLowerCase(); } catch (_e) { return; }
    if (!h || baseDomain(h) === own) return;
    if (!third.has(h)) third.set(h, new Set());
    third.get(h).add(kind);
  };
  for (const t of tags(noComments, "script")) {
    const a = attrs(t);
    if (a.type && !/(javascript|module|ecmascript)/i.test(a.type)) continue;
    note(a.src, "script");
  }
  for (const l of links) {
    const rel = (l.rel || "").toLowerCase();
    if (/(stylesheet|preload|modulepreload|preconnect|icon)/.test(rel)) note(l.href, /stylesheet/.test(rel) ? "style" : rel.split(/\s+/)[0]);
  }
  for (const t of tags(markup, "img")) note(attrs(t).src, "image");
  for (const f of iframes) note(f.src, "frame");
  for (const n of ["video", "audio", "source", "embed", "track"]) for (const t of tags(markup, n)) note(attrs(t).src, "media");
  for (const t of tags(markup, "object")) note(attrs(t).data, "media");
  for (const m of noComments.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const u of m[1].matchAll(/(?:@import\s+(?:url\()?\s*["']?|url\(\s*["']?)((?:https?:)?\/\/[^"')\s]+)/gi)) note(u[1], "style");
  }
  const thirdParty = [...third.entries()].slice(0, 40).map(([host, kinds]) => ({ host, kinds: [...kinds], label: hostLabel(host) }));

  // Sprint 27b: internal pages that suggest contact or booking (same host, a page, not this one), best first
  const bare = (h) => String(h || "").toLowerCase().replace(/^www\./, "");
  const pageKey = (u) => stripSlash(bare(u.hostname) + u.pathname);
  const seen = new Set([pageKey(page)]);
  const subPages = [];
  anchors.forEach((a, order) => {
    if (!a.href || /^(#|mailto:|tel:|javascript:|whatsapp:|sms:|data:)/i.test(a.href)) return;
    let u;
    try { u = new URL(a.href, page); } catch (_e) { return; }
    if ((u.protocol !== "http:" && u.protocol !== "https:") || bare(u.hostname) !== bare(page.hostname) || u.port !== page.port) return;
    if (NOT_A_PAGE_RE.test(u.pathname)) return;
    u.hash = "";
    const key = pageKey(u);
    if (seen.has(key)) return;
    const hay = a.text + " " + safePath(u.pathname);
    const rule = SUB_PAGE_RULES.find(([re]) => re.test(hay));
    if (!rule) return;
    seen.add(key);
    const label = a.text.replace(/\s+/g, " ").trim().replace(/^(.{2,40}?)\s+\1$/, "$1"); // a label repeated for a hover effect is read once
    subPages.push({ url: u.href, label: label && label.length <= 40 ? label : safePath(u.pathname).slice(0, 40), rank: rule[1], order });
  });
  subPages.sort((x, y) => y.rank - x.rank || x.order - y.order);

  return {
    title, titleLength: [...title].length, description, descriptionLength: [...description].length, h1Count,
    canonical, canonicalSelf: canonical ? stripSlash(canonical) === stripSlash(page.href) : null,
    noindex: /\bnoindex\b|\bnone\b/.test(robotsMeta), lang: (htmlTag.lang || "").trim(), viewport: /width\s*=\s*device-width/i.test(viewport),
    schemaTypes, schemaBusiness: schemaTypes.some((t) => BUSINESS_TYPE_RE.test(t)),
    phone, phoneText: !phone && phoneText, email, whatsapp, form, booking, bookingKind: bookingWidget ? "widget" : bookingLink ? "link" : bookingButton ? "button" : "",
    hours, map, cta, ctaLabel: ctaHit ? (ctaHit.text || "").slice(0, 40) : "",
    impressum, datenschutz, a11y, thirdParty, headOk: headEnd >= 0, subPages: subPages.slice(0, 12).map(({ url, label }) => ({ url, label }))
  };
}
function stripSlash(u) { return String(u).replace(/#.*$/, "").replace(/\/+$/, ""); }
function safePath(href) { try { return decodeURIComponent(String(href || "").replace(/^https?:\/\/[^/]+/i, "")); } catch (_e) { return String(href || ""); } }

// ---- 2. PageSpeed Insights (Lighthouse lab data only) ---------------------------------------------
// One retry on 429 / 5xx after a short wait, inside one time budget (PSI_BUDGET_MS).
async function runPageSpeed(url) {
  const t0 = deps.now();
  const first = await pageSpeedOnce(url, PSI_TIMEOUT_MS);
  if (first.ok || !first.retry) return first;
  const left = PSI_BUDGET_MS - (deps.now() - t0) - PSI_RETRY_WAIT_MS;
  if (left < PSI_RETRY_MIN_LEFT_MS) return first;
  await deps.wait(PSI_RETRY_WAIT_MS);
  const second = await pageSpeedOnce(url, Math.min(PSI_TIMEOUT_MS, left));
  return second.ok ? second : { ...second, attempts: 2 };
}
async function pageSpeedOnce(url, timeoutMs) {
  const key = String(process.env.PAGESPEED_API_KEY || "").trim();
  const q = new URLSearchParams();
  q.set("url", url);
  q.set("strategy", "mobile");
  for (const c of ["performance", "accessibility", "best-practices", "seo"]) q.append("category", c);
  if (key) q.set("key", key);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await deps.fetch("https://www.googleapis.com/pagespeedonline/v5/runPagespeed?" + q.toString(), { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!resp.ok) {
      await resp.text().catch(() => "");
      return { ok: false, reason: resp.status === 429 ? "quota" : "http_" + resp.status, retry: resp.status === 429 || resp.status >= 500 };
    }
    const data = await resp.json();
    const lh = data && data.lighthouseResult;
    const cat = lh && lh.categories;
    if (!cat) return { ok: false, reason: "no_result" };
    if (lh.runtimeError && lh.runtimeError.code && lh.runtimeError.code !== "NO_ERROR") return { ok: false, reason: "lighthouse_error" };
    const score = (c) => (c && typeof c.score === "number" ? Math.round(c.score * 100) : null);
    const num = (id) => { const a = lh.audits && lh.audits[id]; return a && typeof a.numericValue === "number" ? a.numericValue : null; };
    const out = {
      ok: true,
      performance: score(cat.performance), accessibility: score(cat.accessibility), bestPractices: score(cat["best-practices"]), seo: score(cat.seo),
      lcpMs: num("largest-contentful-paint"), cls: num("cumulative-layout-shift"), tbtMs: num("total-blocking-time"),
      lighthouseVersion: typeof lh.lighthouseVersion === "string" ? lh.lighthouseVersion : ""
    };
    if ([out.performance, out.accessibility, out.bestPractices, out.seo].every((x) => x === null)) return { ok: false, reason: "no_result" };
    return out;
  } catch (e) {
    return { ok: false, reason: e && e.name === "AbortError" ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

// ---- 2b. Own measurement without a browser (Sprint 27b; scored only when PageSpeed does not answer) ------------
// From the HTML alone: what holds up rendering in the head, the scripts, the images and which files to sample.
function analysePerf(html, finalUrl) {
  const page = new URL(finalUrl);
  const noComments = String(html || "").replace(/<!--[\s\S]*?-->/g, " ");
  const headEnd = noComments.search(/<\/head>/i);
  const head = headEnd >= 0 ? noComments.slice(0, headEnd) : "";
  const isJs = (a) => !a.type || /(javascript|module|ecmascript)/i.test(a.type);
  const own = baseDomain(page.hostname);
  const abs = (raw) => {
    if (!raw || /^(data|blob|about|javascript):/i.test(raw)) return null;
    try { const u = new URL(raw, page); u.hash = ""; return u.protocol === "http:" || u.protocol === "https:" ? u : null; } catch (_e) { return null; }
  };
  const sameSite = (u) => Boolean(u) && baseDomain(u.hostname) === own;

  let blockingCss = 0;
  let blockingJs = 0;
  for (const t of tags(head, "link")) {
    const a = attrs(t);
    if (/\bstylesheet\b/i.test(a.rel || "") && !/\balternate\b/i.test(a.rel || "") && a.href && !("disabled" in a) && !/^\s*print\s*$/i.test(a.media || "")) blockingCss++;
  }
  for (const t of tags(head, "script")) {
    const a = attrs(t);
    if (a.src && isJs(a) && !("async" in a) && !("defer" in a) && !/module/i.test(a.type || "")) blockingJs++;
  }

  const files = [];
  const addFile = (u, kind) => { if (sameSite(u) && !files.some((f) => f.url === u.href)) files.push({ url: u.href, kind }); };
  let scripts = 0;
  let thirdScripts = 0;
  const scriptUrls = [];
  for (const t of tags(noComments, "script")) {
    const a = attrs(t);
    if (!a.src || !isJs(a)) continue;
    scripts++;
    const u = abs(a.src);
    if (u && !sameSite(u)) thirdScripts++;
    if (u) scriptUrls.push(u);
  }
  const styleUrls = tags(noComments, "link").map(attrs).filter((a) => /\bstylesheet\b/i.test(a.rel || "")).map((a) => abs(a.href)).filter(Boolean);
  // files sampled for their caching headers: the first stylesheets, then the first scripts, of this site
  for (const u of styleUrls.slice(0, 4)) if (files.length < ASSET_FILES - 1) addFile(u, "style");
  for (const u of scriptUrls) if (files.length < ASSET_FILES) addFile(u, "script");

  const doc = noComments.replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, " ");
  const pictures = [];
  for (const m of doc.matchAll(/<picture\b[\s\S]*?<\/picture>/gi)) {
    pictures.push({ from: m.index, to: m.index + m[0].length, modern: /<source\b[^>]*(type\s*=\s*["']?image\/(webp|avif)|srcset\s*=\s*["'][^"']*\.(webp|avif)\b)/i.test(m[0]) });
  }
  const img = { count: 0, lazy: 0, rest: 0, dims: 0, formatKnown: 0, modern: 0 };
  const sample = [];
  for (const m of doc.matchAll(/<img\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    const deferred = a["data-src"] || a["data-lazy-src"] || "";
    const raw = a.src && !/^data:/i.test(a.src) ? a.src : deferred;
    if (!raw) continue;
    if (a.width === "1" && a.height === "1") continue; // tracking pixels are not pictures
    if (img.count >= 400) break;
    img.count++;
    const lazy = /^lazy$/i.test(a.loading || "") || Boolean(deferred);
    if (img.count > 2) { img.rest++; if (lazy) img.lazy++; }
    if (a.width && a.height) img.dims++;
    const u = abs(raw);
    const ext = u ? (/\.([a-z0-9]{3,4})$/i.exec(u.pathname) || [])[1] : null;
    const inModern = pictures.some((p) => m.index >= p.from && m.index < p.to && p.modern);
    if (inModern || /^(webp|avif|svg)$/i.test(ext || "")) { img.formatKnown++; img.modern++; }
    else if (/^(jpe?g|png|gif|bmp)$/i.test(ext || "")) img.formatKnown++;
    if (u && sameSite(u) && !/^svg$/i.test(ext || "") && sample.length < ASSET_IMAGES && !sample.some((x) => x.url === u.href)) sample.push({ url: u.href, kind: "image" });
  }
  return { headKnown: headEnd >= 0, blocking: blockingCss + blockingJs, blockingCss, blockingJs, scripts, thirdScripts, images: img, sampleImages: sample, sampleFiles: files };
}

function withBudget(promise, ms) {
  let timer;
  return Promise.race([promise, new Promise((r) => { timer = setTimeout(r, ms); })]).finally(() => clearTimeout(timer));
}

// 1 = a browser may keep the file for a day or more; 0.5 = it has to ask again every time (ETag / Last-Modified); 0 = neither
function cacheCredit(headers) {
  const cc = String(headers["cache-control"] || "").toLowerCase();
  if (/no-store/.test(cc)) return 0;
  const age = /(?:^|[,\s])max-age\s*=\s*(\d+)/.exec(cc);
  if (/immutable/.test(cc) || (age && Number(age[1]) >= WEIGHTS.tempoOwnLimits.cacheMaxAge)) return 1;
  if (!age && headers.expires) {
    const until = Date.parse(headers.expires);
    if (Number.isFinite(until) && until - deps.now() >= WEIGHTS.tempoOwnLimits.cacheMaxAge * 1000) return 1;
  }
  return headers.etag || headers["last-modified"] ? 0.5 : 0;
}

// Headers of up to ASSET_IMAGES images and ASSET_FILES stylesheets/scripts of the same site (HEAD; a short GET
// when the server refuses HEAD). Same safety rules as every fetch; robots.txt respected; one time budget.
async function sampleAssets(perf, robots) {
  const one = async (f) => {
    let u;
    try { u = new URL(f.url); } catch (_e) { return null; }
    if (robots && !robotsAllows(robots, u.pathname)) return null;
    const read = (r) => {
      if (r.status !== 200) return null;
      const len = parseInt(r.headers["content-length"] || "", 10);
      return { url: f.url, kind: f.kind, bytes: Number.isFinite(len) && len > 0 ? len : null, credit: cacheCredit(r.headers) };
    };
    try {
      const r = await safeFetch(u, { method: "HEAD", maxBytes: 2048, timeoutMs: ASSET_TIMEOUT_MS, accept: "*/*" });
      if (r.status === 200) return read(r);
      if (![400, 403, 405, 501].includes(r.status)) return null;
      return read(await safeFetch(u, { maxBytes: 2048, timeoutMs: ASSET_TIMEOUT_MS, accept: "*/*" }));
    } catch (_e) {
      return null;
    }
  };
  const list = [...perf.sampleFiles, ...perf.sampleImages];
  const out = new Array(list.length).fill(null);
  await withBudget(Promise.all(list.map(async (f, i) => { out[i] = await one(f); })), ASSET_BUDGET_MS);
  return out.filter(Boolean);
}

// Everything the "Eigenmessung" items need, as plain facts.
function ownMeasure(page, h, perf, assets) {
  const enc = String(page.headers["content-encoding"] || "").toLowerCase().trim();
  const images = assets.filter((a) => a.kind === "image" && a.bytes);
  const largest = images.reduce((m, a) => (a.bytes > (m ? m.bytes : 0) ? a : m), null);
  const cached = assets.slice(0, ASSET_CACHE_SAMPLE);
  return {
    region: String(process.env.VERCEL_REGION || "").trim().toLowerCase(),
    ttfbMs: page.timing ? page.timing.ttfbMs : null,
    totalMs: page.timing ? page.timing.totalMs : null,
    redirects: page.redirects.length,
    htmlBytes: page.body.length,
    wireBytes: page.wireBytes && enc ? page.wireBytes : null,
    encoding: /^(gzip|x-gzip)$/.test(enc) ? "gzip" : enc === "br" ? "Brotli" : enc === "deflate" ? "deflate" : enc === "zstd" ? "zstd" : "",
    truncated: Boolean(page.truncated),
    headKnown: perf.headKnown, blocking: perf.blocking, blockingCss: perf.blockingCss, blockingJs: perf.blockingJs,
    scripts: perf.scripts, thirdScripts: perf.thirdScripts, thirdHosts: h.thirdParty.length,
    images: perf.images, imagesToSample: perf.sampleImages.length,
    sampledImages: images.length, largestBytes: largest ? largest.bytes : null,
    cacheN: cached.length, cacheStrong: cached.filter((a) => a.credit === 1).length, cacheWeak: cached.filter((a) => a.credit === 0.5).length,
    cacheShare: cached.length ? cached.reduce((x, a) => x + a.credit, 0) / cached.length : null
  };
}

// ---- 3b. Optional ranking lookup (DataForSEO, one call per check) -------------------------------------
const cleanTerm = (s) => String(s || "").normalize("NFC").replace(/[^\p{L}\p{N} .&-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 40);
async function runRanking(host, trade, town) {
  const auth = String(process.env.DATAFORSEO_AUTH_B64 || "").trim();
  if (!auth || !trade || !town) return null; // block omitted
  const keyword = `${trade} ${town}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), SERP_TIMEOUT_MS);
  try {
    const resp = await deps.fetch("https://api.dataforseo.com/v3/serp/google/organic/live/regular", {
      method: "POST",
      headers: { Authorization: "Basic " + auth, "Content-Type": "application/json" },
      body: JSON.stringify([{ keyword, location_code: 2276, language_code: "de", depth: 20 }]),
      signal: ctrl.signal
    });
    if (!resp.ok) { await resp.text().catch(() => ""); return { query: keyword, checked: false, reason: "http_" + resp.status }; }
    const data = await resp.json();
    const task = data && Array.isArray(data.tasks) ? data.tasks[0] : null;
    const result = task && Array.isArray(task.result) ? task.result[0] : null;
    if (!result || !Array.isArray(result.items)) return { query: keyword, checked: false, reason: "no_result" };
    const own = baseDomain(host);
    const hit = result.items.find((i) => i && i.type === "organic" && typeof i.domain === "string" && baseDomain(i.domain) === own);
    const pos = hit ? Number(hit.rank_group || hit.rank_absolute) : null;
    return { query: keyword, checked: true, position: Number.isFinite(pos) && pos >= 1 && pos <= 20 ? pos : null, depth: 20 };
  } catch (e) {
    return { query: keyword, checked: false, reason: e && e.name === "AbortError" ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

// ---- 6. Blocks, items, scores ----------------------------------------------------------------------
const T = (de, en) => ({ de, en });
// status: ok | partial | fail | info | unknown | na. max 0 = shown, not scored.
// share: 0..1, null = could not be checked ("unknown"), "na" = does not apply to this page (e.g. no images);
// unknown and na leave the denominator.
// Sprint 31 (founder): no advice. The sixth argument of the calls below (the former "what to do" text of a check)
// is ignored: it is not stored in a report, not returned by the function and not printed in the mail.
function mk(id, max, share, label, detail) {
  const na = share === "na";
  const unknown = share === null;
  const out = na || unknown;
  const points = out ? 0 : Math.round(max * share * 10) / 10;
  const status = na ? "na" : unknown ? "unknown" : max === 0 ? "info" : share >= 1 ? "ok" : share > 0 ? "partial" : "fail";
  return { id, max, points, status, label, detail };
}
const counts = (i) => i.max > 0 && i.status !== "unknown" && i.status !== "na";
function blockScore(items) {
  const scored = items.filter(counts);
  const possible = scored.reduce((s, i) => s + i.max, 0);
  if (!possible) return null;
  return Math.round((scored.reduce((s, i) => s + i.points, 0) / possible) * 100);
}
const fmtSec = (ms, lang) => { const v = (Math.round(ms / 100) / 10).toFixed(1); return lang === "de" ? v.replace(".", ",") : v; };
const fmtCls = (v, lang) => { const s = (Math.round(v * 100) / 100).toFixed(2); return lang === "de" ? s.replace(".", ",") : s; };

const fmtMs = (ms, lang) => (ms < 1000 ? `${Math.round(ms)} ms` : `${fmtSec(ms, lang)} s`);
const fmtBytes = (n, lang) => {
  if (n < 1048576) return `${Math.max(1, Math.round(n / 1024))} KB`;
  const v = (Math.round((n / 1048576) * 10) / 10).toFixed(1);
  return `${lang === "de" ? v.replace(".", ",") : v} MB`;
};
const step = (value, [full, half], lowerIsBetter) => (lowerIsBetter ? (value <= full ? 1 : value <= half ? 0.5 : 0) : value >= full && value > 0 ? 1 : value >= half && value > 0 ? 0.5 : 0);

// The items of the own measurement. scored = false: shown next to a Lighthouse result as notes (max 0).
function ownItems(o, scored) {
  const W = WEIGHTS.tempoOwn;
  const Lm = WEIGHTS.tempoOwnLimits;
  const w = (k) => (scored ? W[k] : 0);
  const both = (fn) => T(fn("de"), fn("en"));
  const items = [];
  const from = o.region === "fra1" ? T("gemessen von unserem Server in Frankfurt", "measured from our server in Frankfurt") : T("gemessen von unserem Server", "measured from our server");

  items.push(mk("response", w("response"), o.ttfbMs === null ? null : step(o.ttfbMs, Lm.responseMs, true), T("Antwortzeit des Servers", "Server response time"),
    o.ttfbMs === null ? T("nicht prüfbar", "could not be checked")
      : both((L) => (L === "de" ? `erste Antwort nach ${fmtMs(o.ttfbMs, L)}, HTML vollständig nach ${fmtMs(o.totalMs, L)} (${from.de}, ohne Drosselung)` : `first response after ${fmtMs(o.ttfbMs, L)}, HTML complete after ${fmtMs(o.totalMs, L)} (${from.en}, no throttling)`)),
    o.ttfbMs === null ? null : both((L) => (L === "de" ? `Die Antwortzeit des Servers senken (heute ${fmtMs(o.ttfbMs, L)} bis zur ersten Antwort): Häufige Ursachen sind langsames Hosting, ein fehlender Seiten-Cache oder viele Erweiterungen.` : `Reduce the server's response time (today ${fmtMs(o.ttfbMs, L)} to the first response): common causes are slow hosting, a missing page cache or many extensions.`))));

  items.push(mk("compression", w("compression"), o.encoding ? 1 : 0, T("Komprimierte Übertragung (gzip oder Brotli)", "Compressed transfer (gzip or Brotli)"),
    o.encoding ? T(`ja (${o.encoding})`, `yes (${o.encoding})`) : T("nein: Das HTML wird unkomprimiert übertragen", "no: the HTML is transferred uncompressed"),
    T("Die Komprimierung (gzip oder Brotli) auf dem Server einschalten: Text und Code werden dann kleiner übertragen.", "Switch on compression (gzip or Brotli) on the server: text and code are then transferred smaller.")));

  const kb = o.htmlBytes / 1024;
  items.push(mk("weight", w("weight"), step(kb, Lm.htmlKb, true), T("Größe des HTML-Dokuments", "Size of the HTML document"),
    both((L) => (o.truncated ? (L === "de" ? "mehr als " : "more than ") : "") + fmtBytes(o.htmlBytes, L) + (o.wireBytes ? (L === "de" ? `, übertragen ${fmtBytes(o.wireBytes, L)}` : `, transferred ${fmtBytes(o.wireBytes, L)}`) : "")),
    both((L) => (L === "de" ? `Das HTML-Dokument verkleinern (heute ${fmtBytes(o.htmlBytes, L)}): eingebettete Skripte, Stile und Bilddaten in eigene Dateien auslagern.` : `Shrink the HTML document (today ${fmtBytes(o.htmlBytes, L)}): move embedded scripts, styles and image data into files of their own.`))));

  items.push(mk("blocking", w("blocking"), o.headKnown ? step(o.blocking, Lm.blocking, true) : null, T("Dateien, die den Seitenaufbau aufhalten", "Files that hold up rendering"),
    !o.headKnown ? T("nicht prüfbar: kein Seitenkopf im HTML gefunden", "could not be checked: no head found in the HTML")
      : o.blocking === 0 ? T("keine im Seitenkopf", "none in the head")
      : T(`${o.blocking} im Seitenkopf: ${o.blockingCss} Stylesheet${o.blockingCss === 1 ? "" : "s"}, ${o.blockingJs} Skript${o.blockingJs === 1 ? "" : "e"} ohne defer oder async`, `${o.blocking} in the head: ${o.blockingCss} stylesheet${o.blockingCss === 1 ? "" : "s"}, ${o.blockingJs} script${o.blockingJs === 1 ? "" : "s"} without defer or async`),
    T(`Weniger blockierende Dateien im Seitenkopf laden (heute ${o.blocking}): Skripte mit defer einbinden, Stylesheets zusammenfassen.`, `Load fewer blocking files in the head (today ${o.blocking}): include scripts with defer, combine stylesheets.`)));

  const im = o.images;
  const none = T("keine Bilder im HTML gefunden", "no images found in the HTML");
  items.push(mk("lazy", w("lazy"), !im.count ? "na" : !im.rest ? 1 : step(im.lazy / im.rest, Lm.lazyShare, false), T("Bilder erst bei Bedarf laden (loading=\"lazy\")", "Load images only when needed (loading=\"lazy\")"),
    !im.count ? none : !im.rest ? T(`nur ${im.count} Bild${im.count === 1 ? "" : "er"} auf der Seite`, `only ${im.count} image${im.count === 1 ? "" : "s"} on the page`)
      : T(`${im.lazy} von ${im.rest} Bildern nach den ersten beiden`, `${im.lazy} of ${im.rest} images after the first two`),
    T(`Bilder unterhalb des ersten Bildschirms mit loading="lazy" versehen (heute ${im.lazy} von ${im.rest}).`, `Give images below the first screen loading="lazy" (today ${im.lazy} of ${im.rest}).`)));
  items.push(mk("dimensions", w("dimensions"), !im.count ? "na" : step(im.dims / im.count, Lm.dimensionsShare, false), T("Bilder mit festen Maßen (width und height)", "Images with fixed dimensions (width and height)"),
    !im.count ? none : T(`${im.dims} von ${im.count} Bildern`, `${im.dims} of ${im.count} images`),
    T(`Bei Bildern Breite und Höhe angeben (width, height), damit beim Laden nichts springt (heute ${im.dims} von ${im.count}).`, `State width and height on images so that nothing jumps while loading (today ${im.dims} of ${im.count}).`)));
  items.push(mk("formats", w("formats"), !im.formatKnown ? "na" : step(im.modern / im.formatKnown, Lm.formatsShare, false), T("Moderne Bildformate (WebP, AVIF, SVG)", "Modern image formats (WebP, AVIF, SVG)"),
    !im.count ? none : !im.formatKnown ? T("Format aus den Adressen der Bilder nicht erkennbar", "format not recognisable from the image addresses") : T(`${im.modern} von ${im.formatKnown} Bildern`, `${im.modern} of ${im.formatKnown} images`),
    T(`Fotos als WebP oder AVIF ausliefern; die Dateien sind bei gleicher Qualität meist kleiner (heute ${im.modern} von ${im.formatKnown}).`, `Serve photos as WebP or AVIF; the files are usually smaller at the same quality (today ${im.modern} of ${im.formatKnown}).`)));
  items.push(mk("largest", w("largest"), !o.imagesToSample ? "na" : o.largestBytes === null ? null : step(o.largestBytes / 1024, Lm.imageKb, true), T("Größtes geprüftes Bild", "Largest image sampled"),
    !o.imagesToSample ? (im.count ? T("keine Bilder von der eigenen Adresse zum Prüfen", "no images from the site's own address to sample") : none)
      : o.largestBytes === null ? T("nicht prüfbar", "could not be checked")
      : both((L) => (L === "de" ? `${fmtBytes(o.largestBytes, L)} (größtes von ${o.sampledImages} geprüften Bildern)` : `${fmtBytes(o.largestBytes, L)} (largest of ${o.sampledImages} images sampled)`)),
    o.largestBytes === null ? null : both((L) => (L === "de" ? `Das größte Bild verkleinern (heute ${fmtBytes(o.largestBytes, L)}): passend zuschneiden und stärker komprimieren.` : `Shrink the largest image (today ${fmtBytes(o.largestBytes, L)}): crop it to size and compress it more.`))));

  items.push(mk("caching", w("caching"), o.cacheShare === null ? null : step(o.cacheShare, Lm.cachingShare, false), T("Zwischenspeichern im Browser (Cache-Angaben)", "Browser caching (cache headers)"),
    o.cacheShare === null ? T("nicht prüfbar", "could not be checked")
      : T(`${o.cacheStrong} von ${o.cacheN} geprüften Dateien dürfen mindestens einen Tag gespeichert werden` + (o.cacheWeak ? `, ${o.cacheWeak} ${o.cacheWeak === 1 ? "wird" : "werden"} bei jedem Besuch neu angefragt` : ""),
        `${o.cacheStrong} of ${o.cacheN} sampled files may be kept for at least a day` + (o.cacheWeak ? `, ${o.cacheWeak} ${o.cacheWeak === 1 ? "is" : "are"} requested again on every visit` : "")),
    T("Für Bilder, Stylesheets und Skripte eine Speicherdauer festlegen (Cache-Control: max-age), damit wiederkehrende Besucher sie nicht neu laden.", "Set a storage period for images, stylesheets and scripts (Cache-Control: max-age) so that returning visitors do not load them again.")));

  items.push(mk("scripts", 0, 1, T("Skripte und fremde Adressen", "Scripts and third-party addresses"),
    T(`${o.scripts} Skript-Datei${o.scripts === 1 ? "" : "en"}, davon ${o.thirdScripts} von fremden Adressen; ${o.thirdHosts} fremde Adresse${o.thirdHosts === 1 ? "" : "n"} im Quelltext`,
      `${o.scripts} script file${o.scripts === 1 ? "" : "s"}, ${o.thirdScripts} of them from third-party addresses; ${o.thirdHosts} third-party address${o.thirdHosts === 1 ? "" : "es"} in the source`), null));
  return items;
}

const METHOD = {
  lighthouse: T("Messung mit Google Lighthouse (PageSpeed Insights)", "Measured with Google Lighthouse (PageSpeed Insights)"),
  own: T("Eigene Messung ohne Browser (Antwortzeit, Seitengewicht, Bilder, blockierende Dateien)", "Own measurement without a browser (response time, page weight, images, blocking files)")
};
const METHOD_NOTE = {
  lighthouse: T("Laborwerte auf einem simulierten Handy mit gedrosselter Verbindung. Die Zeilen mit „Hinweis“ stammen aus unserer eigenen Messung ohne Browser und zählen hier nicht in die Punkte.", "Lab values on a simulated phone with a throttled connection. The rows marked “note” come from our own measurement without a browser and do not count towards the points here."),
  lighthouseOnly: T("Laborwerte auf einem simulierten Handy mit gedrosselter Verbindung.", "Lab values on a simulated phone with a throttled connection."),
  own: T("Die Messung mit Lighthouse über PageSpeed Insights hat gerade nicht geantwortet. Deshalb haben wir selbst gemessen, was der Server ausliefert. Das ersetzt keinen Lighthouse-Lauf in einem echten Browser.", "The Lighthouse measurement through PageSpeed Insights did not answer just now. So we measured ourselves what the server delivers. This does not replace a Lighthouse run in a real browser.")
};

// psi: the PageSpeed result; own: the facts of ownMeasure() or null (page not fetched).
function tempoBlock(psi, own) {
  const W = WEIGHTS.tempo;
  if (!psi || !psi.ok) {
    const r = (psi && psi.reason) || "network";
    if (own) {
      const items = ownItems(own, true);
      return { id: "tempo", checked: true, score: blockScore(items), items, metrics: null, method: "own", note: METHOD_NOTE.own, psiReason: r, own };
    }
    return {
      id: "tempo", checked: false, score: null, items: [], metrics: null, method: null,
      reason: r === "quota"
        ? T("Die Tempo-Messung war gerade nicht möglich: Das Kontingent der Messschnittstelle ist für den Moment erschöpft.", "The speed measurement was not possible just now: the measuring interface's quota is used up for the moment.")
        : r === "timeout"
        ? T("Die Tempo-Messung hat zu lange gedauert und wurde abgebrochen.", "The speed measurement took too long and was stopped.")
        : T("Die Tempo-Messung war gerade nicht möglich.", "The speed measurement was not possible just now.")
    };
  }
  const cat = (id, key, de, en, fixDe, fixEn) => {
    const v = psi[key];
    return mk(id, W[key], v === null ? null : v / 100, T(de, en),
      v === null ? T("nicht prüfbar", "could not be checked") : T(`${v} von 100`, `${v} out of 100`),
      v === null ? null : T(fixDe.replace("{n}", v), fixEn.replace("{n}", v)));
  };
  const items = [
    cat("performance", "performance", "Ladezeit auf dem Handy (Lighthouse Leistung)", "Loading speed on a phone (Lighthouse performance)",
      "Ladezeit auf dem Handy verbessern: große Bilder verkleinern und Skripte entfernen, die nicht gebraucht werden (Lighthouse Leistung: {n} von 100).",
      "Improve loading speed on phones: shrink large images and remove scripts that are not needed (Lighthouse performance: {n} out of 100)."),
    cat("accessibility", "accessibility", "Bedienbarkeit für alle (Lighthouse Barrierefreiheit)", "Usable by everyone (Lighthouse accessibility)",
      "Bedienbarkeit verbessern: Kontraste, Beschriftungen von Feldern und Schaltflächen, Bildbeschreibungen (Lighthouse Barrierefreiheit: {n} von 100).",
      "Improve usability: contrast, labels of fields and buttons, image descriptions (Lighthouse accessibility: {n} out of 100)."),
    cat("bestPractices", "bestPractices", "Technischer Zustand (Lighthouse Best Practices)", "Technical condition (Lighthouse best practices)",
      "Technik aufräumen: veraltete Skripte, Fehler in der Browser-Konsole und unsichere Einbindungen beheben (Lighthouse Best Practices: {n} von 100).",
      "Tidy up the technology: fix outdated scripts, console errors and insecure embeds (Lighthouse best practices: {n} out of 100)."),
    cat("seo", "seo", "Technische Grundlagen für Suchmaschinen (Lighthouse SEO)", "Technical basics for search engines (Lighthouse SEO)",
      "Technische Grundlagen für Suchmaschinen ergänzen: Seitentitel, Beschreibung, lesbare Schriftgrößen, auslesbare Links (Lighthouse SEO: {n} von 100).",
      "Add the technical basics for search engines: page title, description, legible font sizes, crawlable links (Lighthouse SEO: {n} out of 100).")
  ];
  const score = blockScore(items);
  if (own) items.push(...ownItems(own, false));
  const metrics = {};
  if (psi.lcpMs !== null) metrics.lcp = { ms: Math.round(psi.lcpMs), de: `${fmtSec(psi.lcpMs, "de")} s`, en: `${fmtSec(psi.lcpMs, "en")} s` };
  if (psi.cls !== null) metrics.cls = { value: Math.round(psi.cls * 100) / 100, de: fmtCls(psi.cls, "de"), en: fmtCls(psi.cls, "en") };
  if (psi.tbtMs !== null) metrics.tbt = { ms: Math.round(psi.tbtMs), de: `${Math.round(psi.tbtMs)} ms`, en: `${Math.round(psi.tbtMs)} ms` };
  const lighthouse = { performance: psi.performance, accessibility: psi.accessibility, bestPractices: psi.bestPractices, seo: psi.seo };
  return { id: "tempo", checked: true, score, items, metrics, lighthouse, method: "lighthouse", note: own ? METHOD_NOTE.lighthouse : METHOD_NOTE.lighthouseOnly, lighthouseVersion: psi.lighthouseVersion || "", own: own || null };
}

function findBlock(h, extra) {
  const W = WEIGHTS.find;
  const tl = h.titleLength;
  const dl = h.descriptionLength;
  const items = [
    mk("title", W.title, !h.title ? 0 : tl >= 10 && tl <= 60 ? 1 : 0.5, T("Seitentitel", "Page title"),
      !h.title ? T("fehlt", "missing") : T(`vorhanden, ${tl} Zeichen` + (tl > 60 ? " (wird in der Suche meist abgeschnitten)" : tl < 10 ? " (sehr kurz)" : ""), `present, ${tl} characters` + (tl > 60 ? " (usually cut off in search results)" : tl < 10 ? " (very short)" : "")),
      !h.title ? T("Einen Seitentitel setzen, der Leistung und Ort nennt (bis etwa 60 Zeichen).", "Set a page title that names your service and town (up to about 60 characters).")
        : T(`Den Seitentitel auf 10 bis 60 Zeichen bringen und Leistung und Ort nennen (heute ${tl} Zeichen).`, `Bring the page title to 10–60 characters and name your service and town (today ${tl} characters).`)),
    mk("description", W.description, !h.description ? 0 : dl >= 70 && dl <= 160 ? 1 : 0.5, T("Beschreibung für die Suchergebnisse", "Description for search results"),
      !h.description ? T("fehlt", "missing") : T(`vorhanden, ${dl} Zeichen` + (dl > 160 ? " (wird meist abgeschnitten)" : dl < 70 ? " (kurz)" : ""), `present, ${dl} characters` + (dl > 160 ? " (usually cut off)" : dl < 70 ? " (short)" : "")),
      !h.description ? T("Eine Beschreibung (Meta-Description) ergänzen: zwei Sätze, was Sie anbieten, für wen und wo.", "Add a meta description: two sentences on what you offer, for whom and where.")
        : T(`Die Beschreibung auf 70 bis 160 Zeichen bringen (heute ${dl} Zeichen).`, `Bring the description to 70–160 characters (today ${dl} characters).`)),
    mk("h1", W.h1, h.h1Count === 1 ? 1 : h.h1Count > 1 ? 0.5 : 0, T("Hauptüberschrift (H1)", "Main heading (H1)"),
      h.h1Count === 1 ? T("genau eine", "exactly one") : h.h1Count > 1 ? T(`${h.h1Count} Hauptüberschriften`, `${h.h1Count} main headings`) : T("fehlt", "missing"),
      h.h1Count > 1 ? T(`Nur eine Hauptüberschrift (H1) pro Seite verwenden (heute ${h.h1Count}).`, `Use only one main heading (H1) per page (today ${h.h1Count}).`)
        : T("Eine Hauptüberschrift (H1) setzen, die sagt, was Sie anbieten.", "Set a main heading (H1) that says what you offer.")),
    mk("canonical", W.canonical, h.canonical ? 1 : 0, T("Kanonische Adresse (Canonical)", "Canonical address"),
      h.canonical ? (h.canonicalSelf ? T("gesetzt, zeigt auf diese Seite", "set, points to this page") : T("gesetzt, zeigt auf eine andere Adresse", "set, points to a different address")) : T("fehlt", "missing"),
      T("Eine kanonische Adresse (Canonical) setzen, damit Suchmaschinen die richtige Fassung der Seite kennen.", "Set a canonical address so that search engines know the right version of the page.")),
    mk("indexable", W.indexable, h.noindex ? 0 : 1, T("Für Suchmaschinen freigegeben", "Open to search engines"),
      h.noindex ? T("nein: Die Seite trägt „noindex“", "no: the page carries “noindex”") : T("ja, kein „noindex“", "yes, no “noindex”"),
      T("Die Seite trägt „noindex“ und kann so nicht in Suchergebnissen erscheinen: prüfen, ob das gewollt ist, und sonst entfernen.", "The page carries “noindex” and so cannot appear in search results: check whether that is intended, otherwise remove it.")),
    mk("lang", W.lang, h.lang ? 1 : 0, T("Sprache der Seite angegeben", "Page language declared"),
      h.lang ? T(`ja („${h.lang.slice(0, 12)}“)`, `yes (“${h.lang.slice(0, 12)}”)`) : T("fehlt", "missing"),
      T("Die Sprache der Seite im HTML angeben (lang-Attribut).", "Declare the page language in the HTML (lang attribute).")),
    mk("viewport", W.viewport, h.viewport ? 1 : 0, T("Für Handys eingerichtet (Viewport)", "Set up for phones (viewport)"),
      h.viewport ? T("ja", "yes") : T("fehlt", "missing"),
      T("Die Seite für Handys einrichten (Viewport-Angabe fehlt): Ohne sie erscheint die Seite auf dem Handy verkleinert.", "Set the page up for phones (the viewport setting is missing): without it the page appears shrunk on a phone.")),
    mk("schema", W.schema, h.schemaBusiness ? 1 : h.schemaTypes.length ? 0.5 : 0, T("Strukturierte Daten (schema.org)", "Structured data (schema.org)"),
      h.schemaTypes.length ? T("gefunden: " + h.schemaTypes.slice(0, 6).join(", "), "found: " + h.schemaTypes.slice(0, 6).join(", ")) : T("keine gefunden", "none found"),
      T("Strukturierte Daten für Ihren Betrieb ergänzen (LocalBusiness: Name, Adresse, Telefon, Öffnungszeiten).", "Add structured data for your business (LocalBusiness: name, address, phone, opening hours)."))
  ];
  const sm = extra.sitemap;
  items.push(mk("sitemap", W.sitemap, sm.state === "ok" ? 1 : sm.state === "missing" ? 0 : null, T("Sitemap erreichbar", "Sitemap reachable"),
    sm.state === "ok" ? T("ja", "yes") : sm.state === "missing" ? T("nicht gefunden", "not found") : T(sm.state === "robots" ? "nicht geprüft (robots.txt untersagt den Abruf)" : "nicht prüfbar", sm.state === "robots" ? "not checked (robots.txt disallows fetching it)" : "could not be checked"),
    T("Eine Sitemap (sitemap.xml) bereitstellen und in der robots.txt nennen.", "Provide a sitemap (sitemap.xml) and name it in robots.txt.")));
  const rb = extra.robots;
  items.push(mk("robots", W.robots, rb.state === "ok" ? 1 : rb.state === "missing" ? 0 : null, T("robots.txt erreichbar", "robots.txt reachable"),
    rb.state === "ok" ? T("ja", "yes") : rb.state === "missing" ? T("nicht gefunden", "not found") : T("nicht prüfbar", "could not be checked"),
    T("Eine robots.txt bereitstellen, die auf die Sitemap verweist.", "Provide a robots.txt that points to the sitemap.")));
  const ll = extra.llms;
  items.push(mk("llms", 0, ll.state === "unknown" || ll.state === "robots" ? null : 1, T("llms.txt (Hinweisdatei für KI-Dienste)", "llms.txt (hint file for AI services)"),
    ll.state === "ok" ? T("vorhanden", "present") : ll.state === "missing" ? T("nicht vorhanden (kein Muss; zählt nicht in die Punkte)", "not present (not required; not part of the score)") : T("nicht geprüft", "not checked"), null));
  const out = { id: "find", checked: true, score: blockScore(items), items };
  if (extra.ranking) out.ranking = extra.ranking;
  return out;
}

// Sprint 27b: h may be the merged view of the entered page and the internal pages read with it (mergePages):
// h.where[key] = the label of the page a finding comes from (absent: the entered page), h.subRead = those pages.
function mergePages(h, subs) {
  const out = { ...h, where: {}, subRead: subs.map((s) => ({ label: s.label, url: s.url })) };
  for (const k of ["phone", "phoneText", "email", "whatsapp", "form", "booking", "hours", "map", "impressum", "datenschutz", "a11y"]) {
    if (h[k]) continue;
    const hit = subs.find((s) => s.h[k]);
    if (!hit) continue;
    out[k] = true;
    out.where[k] = hit.label;
    if (k === "booking") out.bookingKind = hit.h.bookingKind;
  }
  if (out.phone) { out.phoneText = false; delete out.where.phoneText; }
  return out;
}
const whereOf = (h, k) => (h.where && h.where[k]) || "";
const foundAt = (h, k, de, en) => {
  const w = whereOf(h, k);
  return w ? T(`${de ? de + " " : ""}auf der Seite „${w}“ gefunden`, `${en ? en + " " : ""}found on the page “${w}”`) : T(`${de ? de + " " : ""}gefunden`, `${en ? en + " " : ""}found`);
};
const notFound = (h) => (h.subRead && h.subRead.length
  ? T("weder auf dieser Seite noch auf den mitgeprüften Seiten gefunden", "found neither on this page nor on the pages read with it")
  : T("auf dieser Seite nicht gefunden", "not found on this page"));
// items whose detail quotes text of the checked site (a link label) are marked: that text never reaches the model
const quoting = (item, h, ...keys) => { if (keys.some((k) => whereOf(h, k))) item.pageText = true; return item; };

function contactBlock(h) {
  const W = WEIGHTS.contact;
  const no = notFound(h);
  const bookingText = () => {
    const w = whereOf(h, "booking");
    const kind = h.bookingKind === "widget" ? T("Buchungswerkzeug eingebunden", "booking tool embedded") : h.bookingKind === "button" ? T("Schaltfläche zum Buchen gefunden", "booking button found") : T("Buchung verlinkt", "booking linked");
    return w ? T(`${kind.de} (Seite „${w}“)`, `${kind.en} (page “${w}”)`) : kind;
  };
  const formText = h.form && h.booking ? T(`${foundAt(h, "form", "Formular").de}; ${bookingText().de}`, `${foundAt(h, "form", "form").en}; ${bookingText().en}`)
    : h.form ? foundAt(h, "form", "Formular", "form") : h.booking ? bookingText() : no;
  const items = [
    quoting(mk("phone", W.phone, h.phone ? 1 : h.phoneText ? 0.5 : 0, T("Telefonnummer zum Antippen", "Phone number you can tap"),
      h.phone ? foundAt(h, "phone") : h.phoneText
        ? (whereOf(h, "phoneText") ? T(`Nummer auf der Seite „${whereOf(h, "phoneText")}“ sichtbar, aber nicht anklickbar`, `number visible on the page “${whereOf(h, "phoneText")}”, but not clickable`) : T("Nummer sichtbar, aber nicht anklickbar", "number visible, but not clickable"))
        : no,
      h.phoneText ? T("Die sichtbare Telefonnummer als tel:-Link setzen, damit Besucher auf dem Handy mit einem Tipp anrufen.", "Turn the visible phone number into a tel: link so that visitors on a phone can call with one tap.")
        : T("Die Telefonnummer als anklickbaren Link setzen (tel:), damit Besucher auf dem Handy mit einem Tipp anrufen.", "Make the phone number a clickable link (tel:) so that visitors on a phone can call with one tap.")), h, "phone", "phoneText"),
    quoting(mk("form", W.form, h.form || h.booking ? 1 : 0, T("Kontaktformular oder Terminbuchung", "Contact form or booking"), formText,
      T("Ein kurzes Anfrageformular oder eine Terminbuchung auf der Startseite anbieten oder gut sichtbar verlinken.", "Offer a short enquiry form or appointment booking on the home page, or link it clearly.")), h, "form", "booking"),
    quoting(mk("email", W.email, h.email ? 1 : 0, T("E-Mail-Adresse zum Anklicken", "Clickable e-mail address"), h.email ? foundAt(h, "email") : no,
      T("Die E-Mail-Adresse als anklickbaren Link setzen (mailto:).", "Make the e-mail address a clickable link (mailto:).")), h, "email"),
    quoting(mk("whatsapp", W.whatsapp, h.whatsapp ? 1 : 0, T("WhatsApp-Link", "WhatsApp link"), h.whatsapp ? foundAt(h, "whatsapp") : no,
      T("Einen WhatsApp-Link anbieten, wenn Sie Anfragen darüber annehmen.", "Offer a WhatsApp link if you take enquiries that way.")), h, "whatsapp"),
    quoting(mk("hours", W.hours, h.hours ? 1 : 0, T("Öffnungs- oder Sprechzeiten", "Opening or office hours"), h.hours ? foundAt(h, "hours") : no,
      T("Öffnungs- oder Sprechzeiten auf der Startseite nennen.", "State your opening or office hours on the home page.")), h, "hours"),
    quoting(mk("map", W.map, h.map ? 1 : 0, T("Karte oder Link zum Google-Unternehmensprofil", "Map or link to the Google Business Profile"), h.map ? foundAt(h, "map") : no,
      T("Eine Karte oder den Link zu Ihrem Google-Unternehmensprofil einbinden, damit Besucher den Weg finden.", "Add a map or the link to your Google Business Profile so that visitors find their way.")), h, "map"),
    mk("cta", W.cta, h.cta ? 1 : 0, T("Handlungsaufforderung im ersten Bildschirm (Hinweis, automatisch erkannt)", "Call to action in the first screen (indication, detected automatically)"),
      h.cta ? T(h.ctaLabel ? `gefunden: „${h.ctaLabel}“` : "gefunden", h.ctaLabel ? `found: “${h.ctaLabel}”` : "found") : T("am Seitenanfang keine erkannt", "none detected at the top of the page"),
      T("Am Seitenanfang eine klare Schaltfläche anbieten, zum Beispiel „Termin anfragen“ oder „Jetzt anrufen“.", "Offer a clear button at the top of the page, for example “Request an appointment” or “Call now”."))
  ];
  return { id: "contact", checked: true, score: blockScore(items), items, pages: (h.subRead || []).map((p) => p.label) };
}

function trustBlock(h, finalUrl) {
  const W = WEIGHTS.trust;
  const isHttps = new URL(finalUrl).protocol === "https:";
  const n = h.thirdParty.length;
  const no = notFound(h);
  const items = [
    mk("https", W.https, isHttps ? 1 : 0, T("Verschlüsselte Verbindung (HTTPS)", "Encrypted connection (HTTPS)"), isHttps ? T("ja", "yes") : T("nein", "no"),
      T("Die Website auf HTTPS umstellen: Ohne Verschlüsselung warnen Browser vor der Seite.", "Move the website to HTTPS: without encryption, browsers warn visitors about the page.")),
    quoting(mk("impressum", W.impressum, h.impressum ? 1 : 0, T("Link zum Impressum", "Link to the legal notice (Impressum)"), h.impressum ? foundAt(h, "impressum") : no,
      T("Das Impressum von der Startseite aus verlinken (Hinweis, keine Rechtsberatung).", "Link the legal notice (Impressum) from the home page (an indication, not legal advice).")), h, "impressum"),
    quoting(mk("datenschutz", W.datenschutz, h.datenschutz ? 1 : 0, T("Link zur Datenschutzerklärung", "Link to the privacy policy"), h.datenschutz ? foundAt(h, "datenschutz") : no,
      T("Die Datenschutzerklärung von der Startseite aus verlinken (Hinweis, keine Rechtsberatung).", "Link the privacy policy from the home page (an indication, not legal advice).")), h, "datenschutz"),
    quoting(mk("a11y", 0, 1, T("Link zu einer Erklärung zur Barrierefreiheit", "Link to an accessibility statement"),
      h.a11y ? foundAt(h, "a11y") : T(no.de + ". Kleinstunternehmen, die nur Dienstleistungen anbieten, sind von der Pflicht in der Regel ausgenommen; ob das für Sie gilt, bewerten wir nicht.",
        no.en + ". Micro-enterprises that only provide services are usually exempt from the duty; we do not judge whether that applies to you."), null), h, "a11y"),
    mk("thirdparty", 0, 1, T("Fremde Dienste, die schon beim Aufruf geladen werden", "Third-party services loaded as soon as the page opens"),
      n ? T(`${n} fremde Adresse${n === 1 ? "" : "n"} im Quelltext: ` + h.thirdParty.slice(0, 12).map((t) => t.host + (t.label ? ` (${t.label})` : "")).join(", ") + (n > 12 ? " …" : "") + ". Ob dafür eine Einwilligung nötig ist, bewerten wir nicht.",
        `${n} third-party address${n === 1 ? "" : "es"} in the source: ` + h.thirdParty.slice(0, 12).map((t) => t.host + (t.label ? ` (${t.label})` : "")).join(", ") + (n > 12 ? " …" : "") + ". We do not judge whether consent is required for them.")
        : T("keine im Quelltext der Seite gefunden", "none found in the page source"), null)
  ];
  return { id: "trust", checked: true, score: blockScore(items), items, thirdParty: h.thirdParty };
}

// One plain sentence per block and band (WEIGHTS.bands).
const VERDICTS = {
  tempo: [T("Tempo und Technik sind in Ordnung.", "Speed and technology are in order."), T("Tempo oder Technik bremsen die Seite etwas.", "Speed or technology slow the page down a little."), T("Tempo oder Technik bremsen die Seite deutlich.", "Speed or technology slow the page down considerably.")],
  tempoOwn: [T("Server und Seite liefern zügig und schlank aus.", "Server and page deliver swiftly and lean."), T("Einzelne Bremsen bei Auslieferung, Bildern oder Dateien.", "A few brakes in delivery, images or files."), T("Mehrere Bremsen bei Auslieferung, Bildern oder Dateien.", "Several brakes in delivery, images or files.")],
  find: [T("Suchmaschinen können die Seite lesen und einordnen.", "Search engines can read and classify the page."), T("Für Suchmaschinen lesbar, aber einige Angaben fehlen.", "Readable for search engines, but some details are missing."), T("Suchmaschinen fehlen wichtige Angaben.", "Search engines are missing important details.")],
  contact: [T("Besucher erreichen Sie auf mehreren Wegen.", "Visitors can reach you in several ways."), T("Die wichtigsten Wege sind da, einzelne fehlen.", "The most important ways are there, a few are missing."), T("Es fehlen wichtige Wege, Sie zu erreichen.", "Important ways of reaching you are missing.")],
  trust: [T("Verschlüsselung und Pflichtseiten sind vorhanden.", "Encryption and the mandatory pages are in place."), T("Einzelne Pflichtangaben sind nicht verlinkt.", "Some mandatory details are not linked."), T("Verschlüsselung oder Pflichtseiten fehlen.", "Encryption or mandatory pages are missing.")],
  // Sprint 36: descriptive lines, never a verdict on the whole site
  security: sec.VERDICTS.security,
  mail: sec.VERDICTS.mail
};
const bandOf = (score) => (score >= WEIGHTS.bands.good ? 0 : score >= WEIGHTS.bands.mid ? 1 : 2);
const verdictOf = (id, score) => (typeof score === "number" && VERDICTS[id] ? VERDICTS[id][bandOf(score)] : null);

const uncheckedBlock = (id, reason) => ({ id, checked: false, score: null, items: [], reason });

// ---- 5b. Sprint 36: the two read-only areas (api/_security.js) -----------------------------------------------
let systemDns = null;
// What the module may use to reach the network. Every call passes the module's own list (sec.requestList) first.
const securityIo = {
  get: (url, opt) => plainGet(url, opt),
  tls: async (host, timeoutMs) => {
    if (deps.tls) return deps.tls(host, timeoutMs);
    const addr = await resolvePublic(host); // the handshake goes to the same validated public address as every fetch
    return sec.handshake(host, addr.address, timeoutMs);
  },
  dns: {
    resolveMx: (name) => (deps.dns || (systemDns = systemDns || sec.resolver())).resolveMx(name),
    resolveTxt: (name) => (deps.dns || (systemDns = systemDns || sec.resolver())).resolveTxt(name),
    resolveCaa: (name) => (deps.dns || (systemDns = systemDns || sec.resolver())).resolveCaa(name)
  },
  // the current WordPress release: a plain GET that names nothing about the checked site
  json: async (url, timeoutMs) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const resp = await deps.fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
      if (!resp.ok) { await resp.text().catch(() => ""); return null; }
      return await resp.json();
    } finally {
      clearTimeout(timer);
    }
  }
};
// -> the facts of sec.collect, or null (then both areas are "nicht prüfbar"). Never throws.
async function runSecurity({ host, finalUrl, page, html, robotsP }) {
  const ctx = {
    host, finalUrl, domain: baseDomain(host), baseDomain, html,
    page: page ? { headers: page.headers, cookies: page.cookies || [], redirects: page.redirects || [] } : null,
    robotsAllows: async (pathname) => { const r = await robotsP; return !r || !r.robots || robotsAllows(r.robots, pathname); },
    now: () => Date.now()
  };
  try {
    if (deps.securityRun !== undefined) return deps.securityRun ? await deps.securityRun(ctx, securityIo) : null;
    return await sec.collect(ctx, securityIo);
  } catch (e) {
    console.error("[check] security areas failed:", e && e.message ? String(e.message).slice(0, 160) : "error");
    return null;
  }
}
const SECURITY_OFF = T("nicht prüfbar: Die Schutzeinstellungen ließen sich in diesem Lauf nicht abfragen.", "could not be checked: the protection settings could not be queried in this run.");
const MAIL_OFF = T("nicht prüfbar: Die Einträge der E-Mail-Domain ließen sich in diesem Lauf nicht abfragen.", "could not be checked: the records of the e-mail domain could not be queried in this run.");
// why: the reason the page itself could not be read (then there are no headers and no HTML to look at)
function securityBlock(facts, why, now) {
  if (!facts || !facts.page) return uncheckedBlock("security", why || SECURITY_OFF);
  const items = sec.securityBlock(facts, mk, now);
  return { id: "security", checked: true, score: blockScore(items), items, note: sec.DISCLAIMER };
}
function mailBlock(facts) {
  if (!facts) return uncheckedBlock("mail", MAIL_OFF);
  if (facts.shared) {
    // a site under a provider's shared address has no e-mail domain of its own: the area does not apply
    return { ...uncheckedBlock("mail", T(`entfällt: ${facts.host} liegt unter der Sammel-Adresse eines Anbieters (${facts.shared}); eine eigene E-Mail-Domain gehört nicht dazu.`, `does not apply: ${facts.host} sits under a provider's shared address (${facts.shared}); it has no e-mail domain of its own.`)), na: true };
  }
  const items = sec.mailBlock(facts, mk);
  const score = blockScore(items);
  if (score === null) return uncheckedBlock("mail", T(`nicht prüfbar: Die DNS-Abfragen für ${facts.domain} haben nicht geantwortet.`, `could not be checked: the DNS lookups for ${facts.domain} did not answer.`));
  return { id: "mail", checked: true, score, items, note: sec.DISCLAIMER, domain: facts.domain };
}

function overallScore(blocks) {
  let sum = 0;
  let weight = 0;
  const used = [];
  for (const [id, w] of Object.entries(WEIGHTS.blocks)) {
    const b = blocks[id];
    if (!b || b.score === null || b.score === undefined) continue;
    sum += b.score * w;
    weight += w;
    used.push(id);
  }
  return { score: weight ? Math.round(sum / weight) : null, blocksUsed: used };
}

function offerFor(blocks) {
  const s = (id) => (blocks[id] && typeof blocks[id].score === "number" ? blocks[id].score : null);
  const t = WEIGHTS.offerThreshold;
  if (s("contact") !== null && s("contact") < t) return "design";
  if ((s("tempo") !== null && s("tempo") < t) || (s("find") !== null && s("find") < t)) return "relaunch";
  return "care";
}


// ---- 7. Kurzfazit -----------------------------------------------------------------------------------
const BLOCK_NAMES = {
  tempo: T("Tempo & Technik", "Speed & technology"),
  find: T("Auffindbarkeit", "Findability"),
  contact: T("Anfrage-Tauglichkeit", "Readiness for enquiries"),
  trust: T("Vertrauen & Recht", "Trust & legal"),
  security: sec.NAMES.security,
  mail: sec.NAMES.mail
};
const BAND_KEYS = ["good", "mid", "low"];
const BAND_LABELS = { good: T("gut", "good"), mid: T("mittel", "medium"), low: T("schwach", "weak") };
const bandKey = (score) => (typeof score === "number" ? BAND_KEYS[bandOf(score)] : null);
// The words of the six states (the page and the mail use the same ones).
const STATUS_LABELS = {
  ok: T("erfüllt", "met"), partial: T("teilweise", "partly"), fail: T("offen", "open"),
  info: T("Hinweis", "note"), unknown: T("nicht prüfbar", "could not be checked"), na: T("entfällt", "does not apply")
};
// -> how many checks of a block ended in which state
function countsOf(block) {
  const c = { ok: 0, partial: 0, fail: 0, info: 0, unknown: 0, na: 0, total: 0 };
  for (const it of (block && block.items) || []) {
    if (c[it.status] === undefined) continue;
    c[it.status]++;
    c.total++;
  }
  return c;
}

// Sprint 36: the open checks of a report, the one with the most weight first. Weight of an open check = the points
// it leaves on the table (max − points) × the share of its block in the overall value. Notes carry no points and are
// never "open". pageText: the detail quotes text of the checked site and is therefore never handed to a model.
function openChecks(report) {
  const out = [];
  for (const id of Object.keys(WEIGHTS.blocks)) {
    const b = report.blocks[id];
    if (!b || !b.checked) continue;
    for (const i of b.items || []) {
      if (i.status !== "fail" && i.status !== "partial") continue;
      out.push({ block: id, item: i, lost: ((i.max - i.points) * WEIGHTS.blocks[id]) / 100 });
    }
  }
  return out.sort((a, b) => b.lost - a.lost);
}
const SUMMARY_OPEN_MAX = 6; // open checks handed to the model (kept small)

// The fixed text: overall value, strongest block, weakest block, the open check with the most weight (by name, as a
// plain statement), the method of the speed block. No advice (Sprint 31).
function deterministicSummary(report, lang) {
  const L = lang === "en" ? "en" : "de";
  const de = L === "de";
  const scored = Object.keys(WEIGHTS.blocks).filter((id) => report.blocks[id] && typeof report.blocks[id].score === "number");
  const s = [];
  if (report.overall.score === null) s.push(de ? `Für ${report.host} ließ sich heute kein Gesamtwert bilden, weil kein Bereich geprüft werden konnte.` : `No overall value could be formed for ${report.host} today because no area could be checked.`);
  else s.push(de ? `Ihre Seite ${report.host} erreicht im Website-Check insgesamt ${report.overall.score} von 100 Punkten.` : `Your site ${report.host} reaches ${report.overall.score} out of 100 points overall in the website check.`);
  if (scored.length) {
    const best = scored.reduce((a, b) => (report.blocks[b].score > report.blocks[a].score ? b : a));
    const worst = scored.reduce((a, b) => (report.blocks[b].score < report.blocks[a].score ? b : a));
    s.push(de ? `Am stärksten ist der Bereich ${BLOCK_NAMES[best].de} mit ${report.blocks[best].score} Punkten.` : `The strongest area is ${BLOCK_NAMES[best].en} with ${report.blocks[best].score} points.`);
    if (worst !== best && report.blocks[worst].score !== report.blocks[best].score) s.push(de ? `Am schwächsten ist der Bereich ${BLOCK_NAMES[worst].de} mit ${report.blocks[worst].score} Punkten.` : `The weakest area is ${BLOCK_NAMES[worst].en} with ${report.blocks[worst].score} points.`);
    else if (scored.length === 1) s.push(de ? "Geprüft werden konnte heute nur dieser eine Bereich." : "Only this one area could be checked today.");
    else s.push(de ? "Die geprüften Bereiche liegen gleichauf." : "The areas checked are level with each other.");
    const top = openChecks(report)[0];
    if (top) s.push(de ? `Der offene Prüfpunkt mit dem größten Gewicht ist „${top.item.label.de}“ im Bereich ${BLOCK_NAMES[top.block].de}.` : `The open check with the most weight is “${top.item.label.en}” in the area ${BLOCK_NAMES[top.block].en}.`);
  } else {
    s.push(de ? "Die Seite war für die Prüfung nicht erreichbar oder hat keine auswertbare Antwort geliefert." : "The page could not be reached for the check or returned nothing that could be evaluated.");
  }
  const t = report.blocks.tempo;
  if (t && t.checked && t.method === "own") s.push(de ? "Das Tempo haben wir ohne Browser selbst gemessen, weil die Lighthouse-Messung gerade nicht geantwortet hat." : "We measured speed ourselves without a browser because the Lighthouse measurement did not answer just now.");
  else if (t && !t.checked) s.push(de ? "Das Tempo ließ sich heute nicht messen und fließt deshalb nicht in den Gesamtwert ein." : "Speed could not be measured today and is therefore not part of the overall value.");
  else s.push(de ? "Die Tempo-Werte stammen aus einer Labormessung mit Lighthouse auf einem simulierten Handy." : "The speed values come from a Lighthouse lab measurement on a simulated phone.");
  return { lang: L, source: "rules", sentences: s };
}

// Every number a summary may state: the overall value, the block scores, the numbers of checks per state, the
// values of the speed block (plus 100) and the numbers in the labels and measured values of the open checks that
// were handed to the model.
function allowedNumbers(report) {
  const set = new Set(["100"]);
  const add = (v) => {
    if (v === null || v === undefined || v === "") return;
    for (const m of String(v).matchAll(/\d+(?:[.,]\d+)?/g)) set.add(m[0].replace(",", "."));
  };
  add(report.overall.score);
  add(report.overall.blocksUsed.length);
  add(Object.keys(WEIGHTS.blocks).length);
  for (const b of Object.values(report.blocks)) {
    if (!b) continue;
    add(b.score);
    for (const v of Object.values(countsOf(b))) add(v);
    if (b.lighthouse) for (const v of Object.values(b.lighthouse)) add(v);
    if (b.metrics) for (const m of Object.values(b.metrics)) { add(m.de); add(m.en); add(m.ms); add(m.value); }
  }
  for (const o of openChecks(report).slice(0, SUMMARY_OPEN_MAX)) {
    add(o.item.label.de); add(o.item.label.en);
    if (!o.item.pageText) { add(o.item.detail.de); add(o.item.detail.en); }
  }
  return set;
}
const SUMMARY_BANNED = /(garantier|guarantee|von\s+google\s+gepr|google[- ]zertifiziert|certified\s+by\s+google|rechtssicher|abmahn|dsgvo-konform|gdpr[- ]compliant|illegal|rechtswidrig|verstoß|verstoss|https?:\/\/|www\.)/i;
// Sprint 36 (founder): never a verdict on the site's security. "Sicherheit der Website" (the area's name) passes.
const SUMMARY_VERDICT = /(gehackt|angreifbar|sicherheitslücke|sicherheitsluecke|\bunsicher|\bsicher(e[rsnm]?)?\b|\bhacked\b|vulnerab|\binsecure\b|\bunsafe\b|\b(is|are|not)\s+secure\b|\bsafe\b)/i;
// Sprint 31, founder: the Kurzfazit gives no advice …
const SUMMARY_ADVICE = /(\bsollten?\b|\bsollte[nt]?\b|\bempfehl|\bempfiehlt|\bwir raten\b|\bratsam\b|\bam besten\b|\bbeginnen sie\b|\bstarten sie\b|\bergänzen sie\b|\bsetzen sie\b|\bfügen sie\b|\bverbessern sie\b|\boptimieren sie\b|\bprüfen sie\b|\bachten sie\b|\bnächste[rn]?\s+schritt|\bals nächstes\b|\blohnt sich\b|\bes fehlt, \w+ zu\b|\byou should\b|\bshould\b|\bwe recommend\b|\brecommend|\bwe advise\b|\badvis(e|able)\b|\bconsider\b|\bstart (with|by)\b|\bnext step|\bmake sure\b|\btry to\b|\bimprove your\b|\byou need to\b|\byou could\b)/i;
// … and names a single check only by a label that was handed to it (Sprint 36): whatever is left of a sentence once
// the names of the areas and the handed-over labels are taken out must not speak of a check.
const SUMMARY_FINDING = /(telefon|\bphone\b|rufnummer|formular|\bform\b|terminbuchung|\bbooking\b|whats\s?app|e-?mail-adresse|mailto|öffnungszeit|sprechzeit|opening hours|office hours|\bkarte\b|\bmap\b|unternehmensprofil|business profile|handlungsaufforderung|call to action|impressum|legal notice|datenschutzerkl|privacy policy|barrierefreiheitserkl|accessibility statement|https|verschlüssel|encrypt|seitentitel|page title|\btitle\b|meta|beschreibung|description|überschrift|heading|\bh1\b|canonical|kanonisch|noindex|viewport|strukturierte daten|structured data|schema\.org|sitemap|robots|llms|komprimier|compress|gzip|brotli|\bbilder?\b|\bimages?\b|stylesheet|skript|script|cache|antwortzeit|response time|fremde (dienste|adressen)|third-party|google fonts|analytics|tag manager)/i;
// -> null when the summary may be shown, else the reason it is rejected
function validateSummary(obj, report) {
  if (!obj || !Array.isArray(obj.sentences) || obj.sentences.length < 3 || obj.sentences.length > 5) return "shape";
  const allowed = allowedNumbers(report);
  const hostDigits = new Set((report.host.match(/\d+/g) || []));
  // what a sentence may quote: the names of the areas and the labels of the open checks the model was given
  const known = [...Object.values(BLOCK_NAMES), ...openChecks(report).slice(0, SUMMARY_OPEN_MAX).map((o) => o.item.label)].flatMap((t) => [t.de, t.en]).sort((a, b) => b.length - a.length);
  for (const raw of obj.sentences) {
    if (typeof raw !== "string") return "shape";
    const sent = raw.trim();
    if (sent.length < 15 || sent.length > 320) return "length";
    const bare = sent.split(report.host).join(" ");
    if (SUMMARY_BANNED.test(bare)) return "banned";
    if (SUMMARY_ADVICE.test(bare)) return "advice";
    let rest = bare;
    for (const k of known) rest = rest.split(k).join(" ");
    if (SUMMARY_VERDICT.test(rest)) return "verdict";
    if (SUMMARY_FINDING.test(rest)) return "finding";
    for (const m of bare.matchAll(/\d+(?:[.,]\d+)?/g)) {
      const n = m[0].replace(",", ".");
      if (!allowed.has(n) && !hostDigits.has(m[0])) return "number:" + m[0];
    }
  }
  return null;
}
// What the model is given: the site's host, the scores, the method, the numbers of checks per state and (Sprint 36)
// at most SUMMARY_OPEN_MAX open checks with label and measured value, the one with the most weight first. A measured
// value that quotes text of the checked site is left out. No page text, no e-mail address.
function modelInput(report, lang) {
  const L = lang === "en" ? "en" : "de";
  const blocks = {};
  for (const [id, b] of Object.entries(report.blocks)) {
    if (!b.checked) { blocks[id] = { name: BLOCK_NAMES[id][L], notCheckable: true }; continue; }
    const c = countsOf(b);
    blocks[id] = { name: BLOCK_NAMES[id][L], score: b.score, band: BAND_LABELS[bandKey(b.score)] ? BAND_LABELS[bandKey(b.score)][L] : undefined, method: b.method ? METHOD[b.method][L] : undefined, checks: { met: c.ok, partly: c.partial, open: c.fail, notes: c.info, notCheckable: c.unknown } };
  }
  const cut = (t) => (t.length > 200 ? t.slice(0, 199) + "…" : t);
  const open = openChecks(report).slice(0, SUMMARY_OPEN_MAX).map((o) => {
    const row = { area: BLOCK_NAMES[o.block][L], label: o.item.label[L], state: STATUS_LABELS[o.item.status][L] };
    if (!o.item.pageText) row.measured = cut(o.item.detail[L]);
    return row;
  });
  return { site: report.host, overall: report.overall.score, blocks, open };
}
const SUMMARY_SYSTEM = {
  de: "Du schreibst das Kurzfazit eines automatischen Website-Checks für die Inhaberin oder den Inhaber eines kleinen Betriebs. Schreibe kurze, einfache Sätze auf Deutsch, in der Sie-Form, ohne Fachjargon: erstens den Gesamtwert, zweitens den stärksten Bereich, drittens den schwächsten Bereich, viertens – nur wenn die Liste open nicht leer ist – den ersten Eintrag aus open: Nenne seine Bezeichnung (label) wörtlich und in Anführungszeichen, dazu seinen Bereich, als schlichte Feststellung, was offen ist; zuletzt die Messmethode beim Tempo. Das sind vier oder fünf Sätze. Nenne nur Zahlen, die im JSON stehen. Nenne keinen Prüfpunkt, der nicht in open steht, und keine Ursache. Gib keinen Rat, keine Empfehlung und keinen nächsten Schritt; schreibe nicht, was zu tun wäre. Bewerte die Website nicht als sicher oder unsicher und verwende keine Wörter wie angreifbar, gehackt oder Sicherheitslücke. Ein Bereich mit notCheckable wurde nicht geprüft: Sage das, rate nichts. Keine Rechtsberatung, keine Versprechen, keine Aussagen über Rechtsverstöße, keine Internetadressen, kein Eigenlob, keine Anrede und kein Gruß. Antworte ausschließlich mit JSON in dieser Form: {\"sentences\":[\"…\",\"…\",\"…\",\"…\"]}",
  en: "You write the short verdict of an automatic website check for the owner of a small business. Write short, plain sentences in English, polite, no jargon: first the overall value, second the strongest area, third the weakest area, fourth – only if the list open is not empty – the first entry of open: quote its label word for word in quotation marks, with its area, as a plain statement of what is open; last, how speed was measured. That makes four or five sentences. State only numbers that appear in the JSON. Name no check that is not in open, and no cause. Give no advice, no recommendation and no next step; do not write what should be done. Do not call the website secure or insecure and do not use words such as vulnerable, hacked or security hole. An area marked notCheckable was not checked: say so, do not guess. No legal advice, no promises, no statements about legal violations, no web addresses, no self-praise, no greeting. Answer with JSON only, in this form: {\"sentences\":[\"…\",\"…\",\"…\",\"…\"]}"
};
async function buildSummary(report, lang) {
  const L = lang === "en" ? "en" : "de";
  const fallback = deterministicSummary(report, L);
  if (report.overall.score === null) return fallback;
  let summarise = deps.summarise;
  if (!summarise) {
    try { summarise = require("./chat").completeText; } catch (e) { console.error("[check] model path unavailable:", e && e.message); }
  }
  if (typeof summarise !== "function") return fallback;
  try {
    // One shared daily USD ceiling with the chat (CHAT_DAILY_USD_CEILING, api/chat.js): at or above it the call
    // returns null and the fixed text is used.
    const out = await summarise({ system: SUMMARY_SYSTEM[L], user: JSON.stringify(modelInput(report, L)), timeoutMs: SUMMARY_TIMEOUT_MS, tag: "check", order: CHECK_ORDER, model: CHECK_MODEL, maxTokens: CHECK_MAX_TOKENS, pricePrefix: "CHECK_PRICE" });
    if (!out || !out.text) return fallback; // no model configured, or the daily cost ceiling is reached
    await bumpDaily("summaries", 1);
    if (Number.isFinite(out.usd) && out.usd > 0) await countUsage("usdmicro", Math.round(out.usd * 1e6)); // Sprint 34
    const m = /\{[\s\S]*\}/.exec(out.text);
    const obj = m ? JSON.parse(m[0]) : null;
    const problem = validateSummary(obj, report);
    if (problem) {
      console.error("[check] summary rejected (" + problem.split(":")[0] + "): deterministic text used");
      return fallback;
    }
    return { lang: L, source: "model", sentences: obj.sentences.map((x) => x.trim()) };
  } catch (e) {
    console.error("[check] summary failed (" + ((e && e.name) || "error") + "): deterministic text used");
    return fallback;
  }
}

// ---- 8. Limits, cache, daily cap ---------------------------------------------------------------------
const buckets = new Map();
function hit(key, limit, windowMs, peek) {
  const now = deps.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) { buckets.set(key, hits); return true; }
  if (!peek) hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 8000) buckets.clear();
  return false;
}
function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  return (typeof fwd === "string" ? fwd.split(",")[0].trim() : "") || (req.socket && req.socket.remoteAddress) || "unknown";
}
function berlinDay(now) {
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now)); }
  catch (_e) { return new Date(now).toISOString().slice(0, 10); }
}
// Per Europe/Berlin day. checks: fresh checks (CHECK_DAILY_CAP); lookups: ranking lookups; mails: report requests
// (one mail each: the confirmation mail, or the report itself without CHECK_MAIL_SECRET); apichecks: the fresh
// checks among "checks" that came through GET or MCP (CHECK_API_DAILY_CAP); reports: full reports sent after a
// confirmed address; summaries: model answers for the Kurzfazit (also those the guard then rejected); botfail: browser requests the bot check refused.
const DAILY_KINDS = ["checks", "lookups", "mails", "apichecks", "reports", "summaries", "botfail",
  // Sprint 34 (weekly numbers, docs/seo/CHECK_METRICS.md; counted by countUsage below, never a limit):
  // cached: check requests answered from the 24-hour cache; cards: score cards shown; apiget: GET requests of
  // assistants and programs; mcpcalls: calls of the MCP tool; ratehits: answers "429" of this function;
  // usdmicro: estimated cost of the Kurzfazit's model answers in millionths of a US dollar.
  "cached", "cards", "apiget", "mcpcalls", "ratehits", "usdmicro",
  // followups: follow-up mails sent; optouts: opt-outs through the link in that mail (both counted by api/followup.js)
  "followups", "optouts",
  // Sprint 35: answers "429" because a quota was reached, by kind (per IP address, per hour, per day)
  "quotaip", "quotahour", "quotaday"];
// How long a day's counter stays in the shared store: 183 days (founder, 2 Oct 2026: six months for everything
// that is a record; 40 days until Sprint 35). Numbers only, no visitor data. Short-lived rows (per-IP quota,
// hourly counter, cache, one-time link markers) are not records and keep their short lives.
const RETENTION_DAYS = 183;
const DAY_COUNTER_TTL_S = RETENTION_DAYS * 86400;
const LEGACY_KINDS = new Set(["checks", "lookups", "mails"]); // the keys docs/sql/check_cache.sql already accepts
const daily = { day: "" };
for (const k of DAILY_KINDS) daily[k] = 0;
function today() {
  const d = berlinDay(deps.now());
  if (daily.day !== d) { daily.day = d; for (const k of DAILY_KINDS) daily[k] = 0; }
  return daily;
}

const REPORT_VERSION = 5; // 5: six areas (security, mail), every check in every answer; 4: no advice texts, Lighthouse scores on the speed block (older cached reports are not served)
const cache = new Map(); // key -> { at, report }
const cacheKey = (u) => (u.hostname.replace(/^www\./, "") + (u.pathname.replace(/\/+$/, "") || "/") + (u.search || "")).toLowerCase();
function cacheGet(key) {
  const e = cache.get(key);
  if (!e) return null;
  if (deps.now() - e.at > CACHE_TTL_MS) { cache.delete(key); return null; }
  return e.report.v === REPORT_VERSION ? e.report : null;
}
function cacheSet(key, report) {
  if (cache.size >= CACHE_MAX) {
    const now = deps.now();
    for (const [k, v] of cache) if (now - v.at > CACHE_TTL_MS) cache.delete(k);
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  }
  cache.set(key, { at: deps.now(), report });
}

// Optional shared store (docs/sql/check_cache.sql): the report cache and the daily counter across instances.
// Same variables as api/lead.js. Missing table, error or no answer within 1.5 s: memory only for 10 minutes.
const SUPABASE_URL = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const PERSIST_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_KEY) && String(process.env.CHECK_PERSISTENT || "").trim() !== "0";
let persistOffUntil = 0;
const persistActive = () => PERSIST_CONFIGURED && deps.now() >= persistOffUntil;
function persistOff(reason) {
  if (deps.now() < persistOffUntil) return;
  persistOffUntil = deps.now() + 10 * 60 * 1000;
  console.error("[check] shared store unavailable (" + reason + "): memory only on this instance for 10 minutes");
}
// soft: a refusal (HTTP 4xx, e.g. a bucket key the installed function does not know yet: docs/sql/check_usage_keys.sql
// not applied) is ignored and does not switch the shared store off.
async function rpc(name, args, soft) {
  if (!persistActive()) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 1500);
  try {
    const resp = await deps.fetch(SUPABASE_URL + "/rest/v1/rpc/" + name, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      signal: ctrl.signal
    });
    if (!resp.ok) {
      await resp.text().catch(() => "");
      if (!(soft && resp.status >= 400 && resp.status < 500)) persistOff("HTTP " + resp.status);
      return null;
    }
    // A function that returns nothing is answered with "204 No Content" by current PostgREST versions: an empty
    // body is a success, not a reason to switch the shared store off.
    const text = await resp.text();
    if (!text.trim()) return {};
    try { return JSON.parse(text); } catch (_e) { persistOff("unexpected response"); return null; }
  } catch (e) {
    persistOff(e && e.name === "AbortError" ? "timeout" : "network");
    return null;
  } finally {
    clearTimeout(timer);
  }
}
const keyHash = (key) => crypto.createHash("sha256").update(key).digest("hex").slice(0, 40);
async function sharedGet(key) {
  const data = await rpc("check_cache_get", { p_key: keyHash(key) });
  const row = Array.isArray(data) ? data[0] : data;
  const report = row && typeof row === "object" ? row.report || (row.checkedAt ? row : null) : null;
  return report && report.checkedAt && report.blocks && report.v === REPORT_VERSION ? report : null;
}
async function sharedSet(key, report) {
  await rpc("check_cache_put", { p_key: keyHash(key), p_report: report, p_ttl_seconds: Math.round(CACHE_TTL_MS / 1000) });
}
// -> the day's count after adding n (memory, or the shared counter when it answers)
async function bumpDaily(kind, n) {
  const d = today();
  d[kind] += n;
  const shared = await sharedBump(`${kind}:${d.day}`, n, DAY_COUNTER_TTL_S, !LEGACY_KINDS.has(kind));
  return shared === null ? d[kind] : Math.max(shared, d[kind]);
}
// -> the shared counter after adding n, or null (no shared store, or the key is not known there yet)
async function sharedBump(key, n, ttlSeconds, soft) {
  const data = await rpc("check_usage_bump", { p_key: key, p_count: n, p_ttl_seconds: ttlSeconds }, soft);
  const row = Array.isArray(data) ? data[0] : data;
  const shared = row && typeof row === "object" ? Number(row.count) : typeof row === "number" ? row : NaN;
  return Number.isFinite(shared) ? shared : null;
}
// The visitor's address as it appears in a shared key: a salted SHA-256 hash, never the address itself.
const IP_SALT = crypto.createHash("sha256").update("rexity-check|" + SUPABASE_KEY).digest("hex").slice(0, 32);
const ipHash = (ip) => crypto.createHash("sha256").update(IP_SALT + "|" + ip).digest("hex").slice(0, 32);

// ---- Sprint 35: quotas, their override from the backend, the log of checked addresses ---------------------------
// Europe/Berlin clock of a moment: { day: "YYYY-MM-DD", seconds since that day's midnight }
function berlinClock(now) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(now));
    const v = (t) => Number((parts.find((x) => x.type === t) || {}).value) || 0;
    return { day: berlinDay(now), seconds: (v("hour") % 24) * 3600 + v("minute") * 60 + v("second") };
  } catch (_e) {
    const d = new Date(now);
    return { day: berlinDay(now), seconds: d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds() };
  }
}
const secondsToBerlinMidnight = (now) => Math.min(86400, Math.max(60, 86400 - berlinClock(now).seconds));
const secondsToNextHour = (now) => Math.max(1, 3600 - (Math.floor(now / 1000) % 3600));
// The moment a Europe/Berlin day begins (00:00 there), as a UTC timestamp.
function berlinDayStartMs(day) {
  const [y, m, d] = String(day).split("-").map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d);
  for (const offsetHours of [2, 1, 3, 0]) { // summer time, winter time; the others only if the zone data is unusual
    const t = utcMidnight - offsetHours * 3600000;
    const c = berlinClock(t);
    if (c.day === day && c.seconds === 0) return t;
  }
  return utcMidnight - 3600000;
}
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
// The Europe/Berlin day `n` days after `day` (n may be negative): stepped from noon, so no day is skipped or doubled
// when the clocks change.
function berlinDayPlus(day, n) {
  const [y, m, d] = String(day).split("-").map(Number);
  return berlinDay(Date.UTC(y, m - 1, d, 12) + n * 86400000);
}

// The quotas in force. An override stored in the shared store (table check_config, docs/sql/check_quota.sql; set
// with scripts/check-tool/quota.mjs through the admin call below) wins over the environment values, number by
// number, until its optional expiry. It is read at most once a minute per instance; no override, an expired one,
// no shared store or SQL not applied: the environment values.
const QUOTA_RANGE = { ip: [1, 1000], hour: [1, 100000], day: [1, 1000000] };
const QUOTA_CACHE_MS = 60 * 1000;
const quotaState = { at: -Infinity, override: null, readable: false };
function cleanOverride(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) return null;
  const out = {};
  for (const k of ["ip", "hour", "day"]) {
    if (Number.isInteger(o[k]) && o[k] >= QUOTA_RANGE[k][0] && o[k] <= QUOTA_RANGE[k][1]) out[k] = o[k];
  }
  if (!("ip" in out) && !("hour" in out) && !("day" in out)) return null;
  if (typeof o.until === "string" && Number.isFinite(Date.parse(o.until))) out.until = new Date(Date.parse(o.until)).toISOString();
  if (typeof o.until_day === "string" && DAY_RE.test(o.until_day)) out.untilDay = o.until_day;
  if (typeof o.set_at === "string" && Number.isFinite(Date.parse(o.set_at))) out.setAt = o.set_at;
  return out;
}
// -> { ip, hour, day, env, override (the one in force, or null), readable (the store answered) }
async function quotaNow(force) {
  const now = deps.now();
  if (force || now - quotaState.at >= QUOTA_CACHE_MS || now < quotaState.at) {
    quotaState.at = now;
    const data = persistActive() ? await rpc("check_quota_get", {}, true) : null;
    let row = Array.isArray(data) ? data[0] : data;
    if (row && typeof row === "object" && row.check_quota_get && typeof row.check_quota_get === "object") row = row.check_quota_get;
    quotaState.readable = Boolean(row && typeof row === "object");
    quotaState.override = quotaState.readable ? cleanOverride(row) : null;
  }
  const o = quotaState.override;
  const live = o && (!o.until || now < Date.parse(o.until)) ? o : null;
  const pick = (k) => (live && k in live ? live[k] : QUOTA_ENV[k]);
  return { ip: pick("ip"), hour: pick("hour"), day: pick("day"), env: { ...QUOTA_ENV }, override: live, readable: quotaState.readable };
}

// This instance's own count of today's fresh checks per IP address (salted hash) and of the current clock hour.
// It is the limit when there is no shared store, and a cheap first refusal when there is one.
const quotaMem = { day: "", ips: new Map(), hour: -1, hourCount: 0 };
function quotaMemNow() {
  const d = today();
  if (quotaMem.day !== d.day) { quotaMem.day = d.day; quotaMem.ips.clear(); }
  const h = Math.floor(deps.now() / 3600000);
  if (quotaMem.hour !== h) { quotaMem.hour = h; quotaMem.hourCount = 0; }
  if (quotaMem.ips.size > 20000) quotaMem.ips.clear();
  return quotaMem;
}
let quotaTakeOffUntil = 0; // the shared quota function did not answer: memory and the old day counter until then
// One fresh check against the three quotas. -> null (granted and counted) or "ip" | "hour" | "day" (refused, nothing
// counted). With the shared store: one call to public.check_quota_take, which compares and counts all of them in
// one transaction, so the numbers hold across instances and a refused request uses nothing up. Without it (not
// configured, SQL not applied, no answer): this instance's memory, plus the shared day counter checks:<day> where
// the older SQL provides it.
async function quotaTake(ip, q, api) {
  const m = quotaMemNow();
  const d = today();
  const key = ipHash(ip);
  const seen = m.ips.get(key) || 0;
  if (seen >= q.ip) return "ip";
  if (m.hourCount >= q.hour) return "hour";
  if (d.checks >= q.day || (api && d.apichecks >= API_DAILY_CAP)) return "day";
  if (persistActive() && deps.now() >= quotaTakeOffUntil) {
    const data = await rpc("check_quota_take", {
      p_ip_key: `qip:${key}:${d.day}`, p_hour_key: `hchecks:${m.hour}`, p_day: d.day,
      p_ip_limit: q.ip, p_hour_limit: q.hour, p_day_limit: q.day, p_api: Boolean(api), p_api_limit: API_DAILY_CAP, p_day_ttl_seconds: DAY_COUNTER_TTL_S
    }, true);
    const row = Array.isArray(data) ? data[0] : data;
    if (row && typeof row === "object" && typeof row.granted === "boolean") {
      const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
      m.ips.set(key, Math.max(m.ips.get(key) || 0, n(row.ip_count)));
      m.hourCount = Math.max(m.hourCount, n(row.hour_count));
      d.checks = Math.max(d.checks, n(row.day_count));
      if (api) d.apichecks = Math.max(d.apichecks, n(row.api_count));
      if (row.granted) return null;
      return row.reason === "ip" || row.reason === "hour" ? row.reason : "day";
    }
    quotaTakeOffUntil = deps.now() + 10 * 60 * 1000;
  }
  m.ips.set(key, (m.ips.get(key) || 0) + 1);
  m.hourCount++;
  if (api && (await bumpDaily("apichecks", 1)) > API_DAILY_CAP) return "day";
  if ((await bumpDaily("checks", 1)) > q.day) return "day";
  return null;
}

// The log of checked addresses (founder, 2 Oct 2026: "how many URLs were analysed each day with URL name").
// One row per Europe/Berlin day and address in public.check_runs (docs/sql/check_runs.sql): the address as checked
// without its query string, the host, how often it was checked afresh and viewed from the cache that day, the door
// of the first run, the overall score and status of the latest run, first and last time. Nothing about the visitor:
// no IP address, no e-mail address. Kept 183 days. Sites on the opt-out list are never written. Without the shared
// store, or before the SQL is applied, nothing is logged and the check works as before.
let runLogOffUntil = 0;
async function logRun({ url, door, score, status, cached }) {
  try {
    if (!persistActive() || deps.now() < runLogOffUntil) return;
    const u = url instanceof URL ? url : new URL(String(url));
    if (isOptedOut(u.hostname)) return;
    const data = await rpc("check_run_log", {
      p_day: today().day, p_url: (u.origin + u.pathname).slice(0, 300), p_host: u.hostname.slice(0, 253),
      p_door: door === "get" || door === "mcp" ? door : "form",
      p_score: Number.isInteger(score) ? score : null, p_status: String(status || "ok").slice(0, 40),
      p_fresh: cached ? 0 : 1, p_cached: cached ? 1 : 0, p_keep_days: RETENTION_DAYS
    }, true);
    if (data === null) runLogOffUntil = deps.now() + 10 * 60 * 1000;
  } catch (_e) { /* the log never affects a check */ }
}
// What the log says about a check that did not produce a result
const runStatusOf = (e) => (!(e instanceof CheckError) ? "Fehler" : e.code === "dns" ? "nicht gefunden" : e.code === "optout" ? null : "abgelehnt");

// ---- The check ---------------------------------------------------------------------------------------
async function fetchSide(origin, pathname, robots, accept) {
  if (robots && !robotsAllows(robots, pathname)) return { state: "robots" };
  try {
    const r = await safeFetch(new URL(pathname, origin), { maxBytes: SMALL_BYTES, accept });
    if (r.status === 200 && r.body.length > 0) return { state: "ok", res: r };
    if (r.status === 404 || r.status === 410 || (r.status === 200 && !r.body.length)) return { state: "missing" };
    return { state: "unknown" };
  } catch (_e) {
    return { state: "unknown" };
  }
}
const looksLikeHtml = (text) => /<html\b|<!doctype html/i.test(text.slice(0, 600));

// Sprint 27b: up to SUB_PAGES internal pages that suggest contact or booking (candidates from analyseHtml, best
// first), read in parallel with the same safety rules. robots.txt is respected; a page that leaves the site, is
// not HTML or does not arrive inside the common time budget is left out.
async function readSubPages(h, finalUrl, robots) {
  const bare = (x) => String(x || "").toLowerCase().replace(/^www\./, "");
  const picks = (h.subPages || []).filter((c) => { try { return robotsAllows(robots, new URL(c.url).pathname); } catch (_e) { return false; } }).slice(0, SUB_PAGES);
  const out = new Array(picks.length).fill(null);
  const one = async (c) => {
    try {
      const r = await safeFetch(new URL(c.url), { maxBytes: SUB_BYTES, timeoutMs: SUB_TIMEOUT_MS });
      if (r.status !== 200 || bare(r.finalUrl.hostname) !== bare(finalUrl.hostname)) return null;
      if (stripSlash(r.finalUrl.origin + r.finalUrl.pathname) === stripSlash(finalUrl.origin + finalUrl.pathname)) return null; // back on the entered page
      const text = decodeBody(r.body, r.headers);
      if (!/html/i.test(String(r.headers["content-type"] || "")) && !looksLikeHtml(text)) return null;
      return { label: c.label, url: r.finalUrl.href, h: analyseHtml(text, r.finalUrl.href, r.headers) };
    } catch (_e) {
      return null;
    }
  };
  await withBudget(Promise.all(picks.map(async (c, i) => { out[i] = await one(c); })), SUB_BUDGET_MS);
  return out.filter(Boolean);
}

async function runCheck(input) {
  const t0 = deps.now();
  const { url: start, hadScheme } = input.parsed;
  const timing = {};

  // The entered host must resolve to public addresses before anything is fetched or sent to a third party:
  // an unknown or non-public host ends the check here (CheckError -> 422).
  await resolvePublic(start.hostname);

  // The entered address. A failure from here on (timeout, error status, a redirect to a target we do not fetch)
  // makes the three HTML blocks "nicht prüfbar"; it does not end the check.
  let page = null;
  let pageError = null;
  let entered = start;
  const tFetch = deps.now();
  try {
    page = await safeFetch(entered);
  } catch (e) {
    pageError = e instanceof CheckError ? e.code : "fetch_failed";
    if (!hadScheme && ["fetch_failed", "timeout"].includes(pageError)) {
      // no scheme was typed and https did not answer: try http once (a site without HTTPS is a finding, not an error)
      try {
        const alt = new URL(entered.href.replace(/^https:/, "http:"));
        page = await safeFetch(alt);
        entered = alt;
        pageError = null;
      } catch (_e2) { /* keep the first error */ }
    }
  }
  timing.fetch = deps.now() - tFetch;
  // A redirect onto a site whose owner asked us not to check it ends the check: nothing more is requested, and the
  // address is not handed to PageSpeed Insights either.
  if (pageError === "optout") throw new CheckError("optout");

  const finalUrl = page ? page.finalUrl : entered;
  const host = finalUrl.hostname;
  let html = "";
  let htmlOk = false;
  if (page) {
    html = decodeBody(page.body, page.headers);
    const ct = String(page.headers["content-type"] || "");
    htmlOk = page.status >= 200 && page.status < 300 && (/html/i.test(ct) || (!ct && looksLikeHtml(html)) || looksLikeHtml(html));
    if (!htmlOk) pageError = page.status >= 400 ? "http_" + page.status : "not_html";
  }

  // PageSpeed (slow) in parallel with the small files, the pages read with the entered one, the sampled files and
  // the optional ranking lookup
  const tPsi = deps.now();
  const psiP = runPageSpeed(entered.href).then((r) => { timing.psi = deps.now() - tPsi; return r; });
  // robots.txt once, for everything that is fetched beyond the entered address (also security.txt, Sprint 36)
  const robotsP = (async () => {
    if (!htmlOk) return null;
    const rb = await fetchSide(finalUrl.origin, "/robots.txt", null, "text/plain,*/*;q=0.5");
    let robots = null;
    if (rb.state === "ok") {
      const txt = decodeBody(rb.res.body, rb.res.headers);
      if (looksLikeHtml(txt)) rb.state = "missing"; // a "soft 404" page instead of a robots.txt
      else robots = parseRobots(txt);
    }
    return { rb, robots };
  })();
  // Sprint 36: the two read-only areas, in parallel with everything else (each request has its own short timeout)
  const tSec = Date.now();
  const secP = runSecurity({ host, finalUrl, page: htmlOk ? page : null, html, robotsP }).then((r) => { timing.sec = Date.now() - tSec; return r; });
  const sideP = (async () => {
    if (!htmlOk) return null;
    const origin = finalUrl.origin;
    const { rb, robots } = await robotsP;
    const h0 = analyseHtml(html, finalUrl.href, page.headers);
    const perf = analysePerf(html, finalUrl.href);
    const tSide = deps.now();
    const [sm, ll, subs, assets] = await Promise.all([
      (async () => {
        const first = await fetchSide(origin, "/sitemap.xml", robots, "application/xml,text/xml,*/*;q=0.5");
        if (first.state === "ok" && /<(urlset|sitemapindex)\b/i.test(decodeBody(first.res.body, first.res.headers))) return { state: "ok" };
        if (first.state === "robots") return first;
        // a sitemap named in robots.txt counts as well (fetched with the same safety checks)
        for (const s of (robots ? robots.sitemaps : []).slice(0, 2)) {
          try {
            const su = new URL(s, origin);
            if (su.pathname === "/sitemap.xml" && su.host === finalUrl.host) continue;
            if (baseDomain(su.hostname) === baseDomain(host) && !robotsAllows(robots, su.pathname)) continue;
            const r = await safeFetch(su, { maxBytes: SMALL_BYTES, accept: "application/xml,text/xml,*/*;q=0.5" });
            if (r.status === 200 && r.body.length) return { state: "ok" };
          } catch (_e) { /* next */ }
        }
        return { state: first.state === "ok" ? "missing" : first.state };
      })(),
      (async () => {
        const r = await fetchSide(origin, "/llms.txt", robots, "text/plain,*/*;q=0.5");
        if (r.state === "ok" && looksLikeHtml(decodeBody(r.res.body, r.res.headers))) return { state: "missing" };
        return { state: r.state };
      })(),
      readSubPages(h0, finalUrl, robots),
      sampleAssets(perf, robots)
    ]);
    timing.side = deps.now() - tSide;
    timing.subs = subs.length;
    timing.assets = assets.length;
    return { robots: { state: rb.state }, sitemap: { state: sm.state }, llms: { state: ll.state }, h: mergePages(h0, subs), own: ownMeasure(page, h0, perf, assets) };
  })();
  const rankP = (async () => {
    if (!htmlOk || !input.trade || !input.town) return null;
    if (!String(process.env.DATAFORSEO_AUTH_B64 || "").trim()) return null;
    if (today().lookups >= LOOKUP_DAILY_CAP) return null;
    today().lookups++;
    return runRanking(host, input.trade, input.town);
  })();
  const [psi, side, ranking, secFacts] = await Promise.all([psiP, sideP, rankP, secP]);

  const blocks = { tempo: tempoBlock(psi, side ? side.own : null) };
  let why = null;
  if (htmlOk) {
    const h = side.h;
    blocks.find = findBlock(h, { robots: side.robots, sitemap: side.sitemap, llms: side.llms, ranking });
    blocks.contact = contactBlock(h);
    blocks.trust = trustBlock(h, finalUrl.href);
  } else {
    why = pageError === "timeout"
      ? T("nicht prüfbar: Die Seite hat nicht innerhalb von 8 Sekunden geantwortet.", "could not be checked: the page did not answer within 8 seconds.")
      : /^http_/.test(pageError || "")
      ? T(`nicht prüfbar: Die Seite hat mit dem Fehler ${String(pageError).slice(5)} geantwortet.`, `could not be checked: the page answered with error ${String(pageError).slice(5)}.`)
      : pageError === "not_html"
      ? T("nicht prüfbar: Unter der Adresse liegt keine HTML-Seite.", "could not be checked: there is no HTML page at this address.")
      : pageError === "too_many_redirects"
      ? T("nicht prüfbar: Die Adresse leitet mehr als dreimal weiter.", "could not be checked: the address redirects more than three times.")
      : ["private_host", "bad_redirect", "bad_port", "bad_scheme", "bad_url", "dns"].includes(pageError)
      ? T("nicht prüfbar: Die Adresse leitet auf ein Ziel weiter, das wir nicht abrufen.", "could not be checked: the address redirects to a target we do not fetch.")
      : T("nicht prüfbar: Die Seite war nicht erreichbar.", "could not be checked: the page could not be reached.");
    for (const id of ["find", "contact", "trust"]) blocks[id] = uncheckedBlock(id, why);
  }
  blocks.security = securityBlock(secFacts, why, deps.now());
  blocks.mail = mailBlock(secFacts);
  const report = {
    v: REPORT_VERSION,
    url: entered.href,
    finalUrl: finalUrl.href,
    host,
    checkedAt: new Date(deps.now()).toISOString(),
    truncated: Boolean(page && page.truncated),
    blocks,
    overall: overallScore(blocks),
    summaries: {}
  };
  report.offer = offerFor(blocks);
  report.durationMs = deps.now() - t0;
  console.log(`[check] host=${host} ms=${report.durationMs} fetch=${timing.fetch || 0} psi=${timing.psi || 0} psi_ok=${Boolean(psi && psi.ok)}${psi && !psi.ok ? " psi_reason=" + psi.reason : ""} tempo=${blocks.tempo.method || "none"} side=${timing.side || 0} sec=${timing.sec || 0}${secFacts && secFacts.ms ? " sec_parts=" + Object.entries(secFacts.ms).map(([k, v]) => k + ":" + v).join(",") : ""} subpages=${timing.subs || 0} files=${timing.assets || 0} html=${htmlOk} ranking=${ranking ? (ranking.checked ? "ok" : "failed") : "off"} overall=${report.overall.score}`);
  return report;
}

// ---- The result every door returns (Sprint 36) -----------------------------------------------------------------
const LINKS = { page: SITE_ORIGIN + "/website-check", bot: BOT_PAGE, openapi: SITE_ORIGIN + "/.well-known/openapi.json", mcp: SITE_ORIGIN + "/mcp" };
const MAIL_COPY_NOTE = T(
  "Dieses Ergebnis enthält jeden Prüfpunkt mit seinem Messwert. Auf der Seite lässt es sich zusätzlich als Bericht per E-Mail anfordern: als Kopie zum Aufbewahren oder Weitergeben, an eine Adresse, die über den Link in einer Bestätigungs-E-Mail bestätigt wurde.",
  "This result contains every check with its measured value. On the page it can also be requested as a report by e-mail: a copy to keep or pass on, sent to an address that was confirmed through the link in a confirmation e-mail.");
const OFFERS = {
  design: { label: T("Webdesign: Websites, die Anfragen bringen", "Web design: websites that bring enquiries"), path: "/web/web-design" },
  relaunch: { label: T("Website-Relaunch: neue Technik, gleiche Adresse", "Website relaunch: new technology, same address"), path: "/web/website-umzug" },
  care: { label: T("Website-Wartung: damit die Werte so bleiben", "Website maintenance: so the values stay this way"), path: "/website-wartung" }
};
const verdictKey = (id, b) => (b.method === "own" ? "tempoOwn" : id);
const BLOCK_IDS = Object.keys(WEIGHTS.blocks);
// "12,5 von 25 Punkten" / "nicht gewertet" / "ohne Punkte": the same words on the page, in Markdown and in the mail
const pointsLabel = (i, L) => (i.max > 0 && i.status !== "unknown" && i.status !== "na"
  ? (L === "de" ? `${String(i.points).replace(".", ",")} von ${i.max} Punkten` : `${i.points} of ${i.max} points`)
  : i.max > 0 ? (L === "de" ? "nicht gewertet" : "not scored") : (L === "de" ? "ohne Punkte" : "no points"));

// What the browser, GET /api/check and the MCP tool get: scores, bands, one verdict line per block, the numbers of
// checks per state AND every check (label, state, measured value, points), the speed block's method (with
// Lighthouse's four scores and LCP/CLS/TBT when it ran), the labels of the pages read. No advice.
// opts.ranking: the position of the ranking lookup is part of the answer (only for the browser request that asked
// with trade and town, and in the report e-mail; GET and MCP never carry the search term a visitor typed).
function publicView(report, lang, cached, opts) {
  const L = lang === "en" ? "en" : "de";
  const sum = report.summaries[L];
  const blocks = {};
  for (const id of BLOCK_IDS) {
    const b = report.blocks[id];
    if (!b) continue;
    const v = verdictOf(verdictKey(id, b), b.score);
    const band = bandKey(b.score);
    blocks[id] = {
      name: BLOCK_NAMES[id][L], checked: b.checked, score: b.score, band, bandLabel: band ? BAND_LABELS[band][L] : undefined, weight: WEIGHTS.blocks[id],
      verdict: v ? v[L] : undefined,
      reason: b.reason ? b.reason[L] : undefined,
      notApplicable: b.na ? true : undefined,
      counts: countsOf(b),
      items: (b.items || []).map((i) => ({ id: i.id, label: i.label[L], status: i.status, statusLabel: STATUS_LABELS[i.status][L], detail: i.detail[L], points: i.points, max: i.max, pointsLabel: pointsLabel(i, L) }))
    };
    if (id === "tempo") {
      blocks[id].method = b.method || null;
      blocks[id].methodLabel = b.method ? METHOD[b.method][L] : undefined;
      blocks[id].note = b.note ? b.note[L] : undefined;
      if (b.method === "lighthouse") {
        blocks[id].lighthouse = b.lighthouse || undefined;
        blocks[id].metrics = b.metrics ? Object.fromEntries(Object.entries(b.metrics).map(([k, m]) => [k, m[L]])) : undefined;
      }
    } else if (b.note) blocks[id].note = b.note[L]; // security, mail: the disclaimer
    if (id === "contact" && b.pages && b.pages.length) blocks[id].pages = b.pages.slice(0, SUB_PAGES);
    if (id === "find" && opts && opts.ranking && b.ranking) blocks[id].ranking = { query: b.ranking.query, checked: b.ranking.checked, position: b.ranking.position === undefined ? null : b.ranking.position, text: rankingLine(b.ranking, L === "de") };
  }
  const oBand = bandKey(report.overall.score);
  const offer = OFFERS[report.offer] ? report.offer : "design";
  return {
    ok: true, tier: "full", v: REPORT_VERSION, lang: L, url: report.url, finalUrl: report.finalUrl, host: report.host, checkedAt: report.checkedAt, cached: Boolean(cached),
    truncated: report.truncated,
    overall: { score: report.overall.score, band: oBand, bandLabel: oBand ? BAND_LABELS[oBand][L] : undefined, blocksUsed: report.overall.blocksUsed },
    blocks,
    pages: ((report.blocks.contact && report.blocks.contact.pages) || []).slice(0, SUB_PAGES),
    summary: sum ? { sentences: sum.sentences, source: sum.source } : null,
    offer, offerLabel: OFFERS[offer].label[L], offerUrl: SITE_ORIGIN + OFFERS[offer].path,
    statusLabels: Object.fromEntries(Object.entries(STATUS_LABELS).map(([k, v]) => [k, v[L]])),
    mailCopy: { by: "email", note: MAIL_COPY_NOTE[L], url: LINKS.page },
    links: LINKS
  };
}

// The same result with the ranking position: what the report e-mail prints (and what the tests read).
function fullView(report, lang) {
  return publicView(report, lang === "en" ? "en" : "de", false, { ranking: true });
}

const rankingLine = (r, de) => (!r.checked ? (de ? `Platz bei Google für „${r.query}“: nicht prüfbar` : `Position on Google for “${r.query}”: could not be checked`)
  : r.position ? (de ? `Platz bei Google für „${r.query}“ (Deutschland): ${r.position}` : `Position on Google for “${r.query}” (Germany): ${r.position}`)
  : (de ? `Platz bei Google für „${r.query}“ (Deutschland): nicht in den ersten 20 Ergebnissen` : `Position on Google for “${r.query}” (Germany): not in the first 20 results`));

// The result as Markdown (GET ?format=md, Accept: text/markdown, and the MCP tool).
function publicMarkdown(view) {
  const de = view.lang === "de";
  const date = new Intl.DateTimeFormat(de ? "de-DE" : "en-GB", { timeZone: "Europe/Berlin", dateStyle: "long", timeStyle: "short" }).format(new Date(view.checkedAt));
  const na = de ? "nicht prüfbar" : "could not be checked";
  const ids = BLOCK_IDS.filter((id) => view.blocks[id]);
  const cell = (x) => String(x).replace(/\|/g, "/").replace(/\s+/g, " ").trim();
  const out = [];
  out.push(de ? `# Website-Check: ${view.host}` : `# Website check: ${view.host}`, "");
  out.push(de ? `- Geprüfte Adresse: ${view.finalUrl}` : `- Address checked: ${view.finalUrl}`);
  out.push(de ? `- Geprüft am: ${date} Uhr (Europe/Berlin)${view.cached ? ", Ergebnis der letzten 24 Stunden" : ""}` : `- Checked on: ${date} (Europe/Berlin)${view.cached ? ", result from the last 24 hours" : ""}`);
  out.push(view.overall.score === null ? (de ? `- Gesamt: ${na}` : `- Overall: ${na}`) : (de ? `- Gesamt: ${view.overall.score} von 100 Punkten (${view.overall.bandLabel})` : `- Overall: ${view.overall.score} out of 100 points (${view.overall.bandLabel})`));
  out.push("");
  if (view.summary) out.push(de ? "## Kurzfazit" : "## Short verdict", "", view.summary.sentences.join(" "), "");
  if (view.summary && view.summary.source === "model") out.push(de ? "_Das Kurzfazit wurde von einer KI aus den Werten dieses Ergebnisses formuliert._" : "_The short verdict was worded by an AI from the values of this result._", "");
  out.push(de ? "## Bereiche" : "## Areas", "");
  out.push(de ? "| Bereich | Punkte | Einordnung | Gewicht | erfüllt | teilweise | offen | Hinweise | nicht prüfbar | entfällt |" : "| Area | Points | Band | Weight | met | partly | open | notes | not checkable | does not apply |");
  out.push("|---|---|---|---|---|---|---|---|---|---|");
  for (const id of ids) {
    const b = view.blocks[id];
    const c = b.counts;
    out.push(`| ${b.name} | ${b.score === null ? (b.notApplicable ? view.statusLabels.na : na) : b.score} | ${b.bandLabel || "–"} | ${b.weight} % | ${c.ok} | ${c.partial} | ${c.fail} | ${c.info} | ${c.unknown} | ${c.na} |`);
  }
  out.push("");
  // every area with its checks: state, label, measured value, points
  for (const id of ids) {
    const b = view.blocks[id];
    out.push(`## ${b.name}${b.score === null ? "" : (de ? `: ${b.score} von 100 (${b.bandLabel})` : `: ${b.score} out of 100 (${b.bandLabel})`)}`, "");
    out.push(b.checked ? b.verdict || "" : b.reason || na, "");
    if (!b.checked) continue;
    if (id === "tempo" && b.methodLabel) {
      out.push(`${b.methodLabel}. ${b.note || ""}`.trim(), "");
      if (b.lighthouse) {
        const lh = b.lighthouse;
        const n = (x) => (x === null || x === undefined ? na : x);
        out.push(de ? `- Lighthouse (mobil): Leistung ${n(lh.performance)}, Barrierefreiheit ${n(lh.accessibility)}, Best Practices ${n(lh.bestPractices)}, SEO ${n(lh.seo)}` : `- Lighthouse (mobile): performance ${n(lh.performance)}, accessibility ${n(lh.accessibility)}, best practices ${n(lh.bestPractices)}, SEO ${n(lh.seo)}`);
        const m = b.metrics || {};
        const parts = [m.lcp && `LCP ${m.lcp}`, m.cls && `CLS ${m.cls}`, m.tbt && `TBT ${m.tbt}`].filter(Boolean);
        if (parts.length) out.push((de ? "- Laborwerte: " : "- Lab values: ") + parts.join(", "));
        out.push("");
      }
    }
    out.push(de ? "| Status | Prüfpunkt | Gemessen | Punkte |" : "| State | Check | Measured | Points |", "|---|---|---|---|");
    for (const i of b.items) out.push(`| ${i.statusLabel} | ${cell(i.label)} | ${cell(i.detail)} | ${i.pointsLabel} |`);
    out.push("");
    if (id === "contact" && b.pages) out.push((de ? "Mitgelesene Seiten: " : "Pages read as well: ") + b.pages.join(", "), "");
    if (id !== "tempo" && b.note) out.push(`_${b.note}_`, "");
  }
  out.push(de ? "## Kopie per E-Mail" : "## Copy by e-mail", "", `${view.mailCopy.note} ${view.mailCopy.url}`, "");
  out.push(de
    ? "Der Check ist eine automatische Momentaufnahme der eingegebenen Seite. Er nennt, was gemessen wurde, und gibt keine Handlungsempfehlungen. Die Angaben zu Vertrauen & Recht sind Hinweise und keine Rechtsberatung. " + sec.DISCLAIMER.de
    : "The check is an automatic snapshot of the page entered. It states what was measured and gives no recommendations. The indications on trust & legal are not legal advice. " + sec.DISCLAIMER.en);
  return out.join("\n") + "\n";
}

// ---- 9. Report by e-mail --------------------------------------------------------------------------------
const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const MARK = { ok: "✓", partial: "~", fail: "✗", info: "i", unknown: "?", na: "–" };
const SIGNATURE = ["Rexity Labs UG (haftungsbeschränkt)", "info@rexity.ai", "+49 174 2471435", "www.rexity.ai"];
const CALL_URL = SITE_ORIGIN + "/#kontakt";
// The sentence of the form in force (2 Oct 2026): requesting the report includes consent to be contacted.
const CONSENT_NOTE = T(
  "Mit der Anforderung des Berichts haben Sie eingewilligt, dass Rexity Labs Sie per E-Mail zu diesem Ergebnis und zu passenden Leistungen kontaktiert. Die Einwilligung können Sie jederzeit widerrufen: Eine kurze Nachricht an info@rexity.ai genügt.",
  "By requesting the report you agreed that Rexity Labs may contact you by e-mail about this result and about matching services. You can withdraw this consent at any time: a short message to info@rexity.ai is enough.");

const CONSENT_ASK = T(CONSENT_NOTE.de.replace("haben Sie eingewilligt", "willigen Sie ein"), CONSENT_NOTE.en.replace("you agreed", "you agree"));

// The report by e-mail: the same content as the result on the page, as a copy to keep or pass on (Sprint 36): every
// check with its state, measured value and points, the Lighthouse values, the pages read and the rule. No advice
// (founder, Sprint 31). One call to action: the 15-minute call and the matching service page.
function reportMail(report, lang) {
  const L = lang === "en" ? "en" : "de";
  const de = L === "de";
  const view = fullView(report, L);
  const sum = report.summaries[L] || deterministicSummary(report, L);
  const date = new Intl.DateTimeFormat(de ? "de-DE" : "en-GB", { timeZone: "Europe/Berlin", dateStyle: "long", timeStyle: "short" }).format(new Date(report.checkedAt));
  const head = de ? `Website-Check für ${report.host}` : `Website check for ${report.host}`;
  const overall = view.overall.score === null ? (de ? "Gesamt: nicht prüfbar" : "Overall: could not be checked") : (de ? `Gesamt: ${view.overall.score} von 100 Punkten (${view.overall.bandLabel})` : `Overall: ${view.overall.score} out of 100 points (${view.overall.bandLabel})`);
  const text = [head, de ? `Geprüfte Adresse: ${report.finalUrl}` : `Address checked: ${report.finalUrl}`, de ? `Geprüft am ${date} Uhr` : `Checked on ${date}`, "", overall, ""];
  let html = `<div style="font-family:sans-serif;font-size:14px;line-height:1.5;color:#111"><h1 style="font-size:20px;margin:0 0 4px">${esc(head)}</h1>` +
    `<p style="margin:0 0 12px;color:#555">${esc(de ? "Geprüfte Adresse" : "Address checked")}: ${esc(report.finalUrl)}<br>${esc(de ? `Geprüft am ${date} Uhr` : `Checked on ${date}`)}</p>` +
    `<p style="font-size:16px"><strong>${esc(overall)}</strong></p>`;
  const copyLine = de ? "Dieser Bericht ist eine Kopie des Ergebnisses, das die Seite des Website-Checks angezeigt hat: zum Aufbewahren oder Weitergeben." : "This report is a copy of the result the website check's page showed: to keep or pass on.";
  text.push(copyLine, "");
  html += `<p style="color:#555">${esc(copyLine)}</p>`;
  text.push(de ? "Kurzfazit" : "Short verdict");
  html += `<h2 style="font-size:16px;margin:16px 0 4px">${de ? "Kurzfazit" : "Short verdict"}</h2><p>${sum.sentences.map(esc).join(" ")}</p>`;
  text.push(sum.sentences.join(" "), "");
  if (sum.source === "model") {
    const n = de ? "Das Kurzfazit wurde von einer KI aus den Werten dieses Berichts formuliert." : "The short verdict was worded by an AI from the values in this report.";
    text.push(n, "");
    html += `<p style="font-size:12px;color:#555">${esc(n)}</p>`;
  }
  const pts = (i) => i.pointsLabel;
  for (const id of BLOCK_IDS) {
    const b = view.blocks[id];
    const title = b.name + (id === "trust" ? (de ? " (Hinweise, keine Rechtsberatung)" : " (indications, not legal advice)") : "") + ": " + (b.score === null ? (b.notApplicable ? view.statusLabels.na : de ? "nicht prüfbar" : "could not be checked") : (de ? `${b.score} von 100` : `${b.score} out of 100`));
    text.push(title);
    html += `<h2 style="font-size:16px;margin:16px 0 4px">${esc(title)}</h2>`;
    if (!b.checked) { text.push("  " + (b.reason || ""), ""); html += `<p>${esc(b.reason || "")}</p>`; continue; }
    if (b.methodLabel) { const line = b.methodLabel + ". " + (b.note || ""); text.push("  " + line.trim()); html += `<p style="color:#555">${esc(line.trim())}</p>`; }
    else if (b.note) { text.push("  " + b.note); html += `<p style="color:#555">${esc(b.note)}</p>`; } // security, mail: the disclaimer
    if (b.pages) { const line = (de ? "Mitgeprüfte Seiten: " : "Pages read as well: ") + b.pages.join(", "); text.push("  " + line); html += `<p style="color:#555">${esc(line)}</p>`; }
    html += '<table cellpadding="4" style="border-collapse:collapse;font-size:14px">';
    for (const i of b.items) {
      text.push(`  [${MARK[i.status]}] ${i.label} (${i.statusLabel}, ${pts(i)}): ${i.detail}`);
      html += `<tr><td style="vertical-align:top">${MARK[i.status]}</td><td style="vertical-align:top">${esc(i.label)}<br><span style="font-size:12px;color:#555">${esc(i.statusLabel + ", " + pts(i))}</span></td><td style="vertical-align:top">${esc(i.detail)}</td></tr>`;
    }
    html += "</table>";
    if (b.metrics) {
      const m = [b.metrics.lcp && `LCP ${b.metrics.lcp}`, b.metrics.cls && `CLS ${b.metrics.cls}`, b.metrics.tbt && `TBT ${b.metrics.tbt}`].filter(Boolean).join(" · ");
      if (m) { const line = (de ? "Laborwerte (Lighthouse mobil): " : "Lab values (Lighthouse mobile): ") + m; text.push("  " + line); html += `<p style="color:#555">${esc(line)}</p>`; }
    }
    if (b.ranking) {
      const line = rankingLine(b.ranking, de);
      text.push("  " + line);
      html += `<p>${esc(line)}</p>`;
    }
    text.push("");
  }
  // The one call to action
  const offer = OFFERS[report.offer] || OFFERS.design;
  const ctaHead = de ? "Über das Ergebnis sprechen" : "Talk about the result";
  const ctaCall = de ? "15 Minuten über das Ergebnis sprechen:" : "Talk about the result for 15 minutes:";
  const ctaPhone = de ? "oder telefonisch unter +49 174 2471435" : "or by phone on +49 174 2471435";
  const ctaOffer = de ? "Die passende Leistung dazu:" : "The matching service:";
  text.push(ctaHead, `${ctaCall} ${CALL_URL} ${ctaPhone}`, `${ctaOffer} ${offer.label[L]}: ${SITE_ORIGIN + offer.path}`, "");
  html += `<h2 style="font-size:16px;margin:20px 0 4px">${esc(ctaHead)}</h2><p>${esc(ctaCall)} <a href="${esc(CALL_URL)}">${esc(CALL_URL)}</a> ${esc(ctaPhone)}<br>${esc(ctaOffer)} <a href="${esc(SITE_ORIGIN + offer.path)}">${esc(offer.label[L])}</a></p>`;

  const tm = report.blocks.tempo && report.blocks.tempo.method;
  const tempoLine = tm === "own"
    ? T("Tempo in diesem Bericht: eigene Messung ohne Browser; sie ersetzt keinen Lighthouse-Lauf in einem echten Browser.", "Speed in this report: our own measurement without a browser; it does not replace a Lighthouse run in a real browser.")
    : tm === "lighthouse"
    ? T("Tempo-Messung mit Google Lighthouse (PageSpeed Insights), Laborwerte auf einem simulierten Handy.", "Speed measured with Google Lighthouse (PageSpeed Insights), lab values on a simulated phone.")
    : T("Das Tempo ließ sich in diesem Lauf nicht messen.", "Speed could not be measured in this run.");
  const rule = de
    ? `So bewerten wir: Jeder Prüfpunkt hat eine feste Punktzahl; sie steht oben hinter jedem Punkt. Ein Bereich erhält 0 bis 100 Punkte: erreichte Punkte geteilt durch mögliche Punkte der Prüfpunkte, die sich prüfen ließen. Hinweise zählen nicht mit. Ab ${WEIGHTS.bands.good} Punkten gilt ein Wert als gut, ab ${WEIGHTS.bands.mid} als mittel, darunter als schwach. Gesamt = ${BLOCK_IDS.map((id) => `${BLOCK_NAMES[id].de} ${WEIGHTS.blocks[id]} %`).join(", ")}; fehlt ein Bereich, wird der Rest auf 100 % hochgerechnet. Die vollständige Regel steht auf https://www.rexity.ai/website-check. ${tempoLine.de} Der Check ist eine automatische Momentaufnahme der eingegebenen Seite und ersetzt keine Rechtsberatung. ${BLOCK_NAMES.security.de} und ${BLOCK_NAMES.mail.de}: ${sec.DISCLAIMER.de} ${sec.RULE_NOTES.dkim.de}`
    : `How we score: every check has a fixed number of points; it is shown above after each check. An area gets 0 to 100 points: points reached divided by points possible over the checks that could be carried out. Notes do not count. From ${WEIGHTS.bands.good} points a value counts as good, from ${WEIGHTS.bands.mid} as medium, below that as weak. Overall = ${BLOCK_IDS.map((id) => `${BLOCK_NAMES[id].en} ${WEIGHTS.blocks[id]}%`).join(", ")}; if an area is missing, the rest is scaled to 100%. The full rule is on https://www.rexity.ai/website-check. ${tempoLine.en} The check is an automatic snapshot of the page you entered and does not replace legal advice. ${BLOCK_NAMES.security.en} and ${BLOCK_NAMES.mail.en}: ${sec.DISCLAIMER.en} ${sec.RULE_NOTES.dkim.en}`;
  const why = (de
    ? "Sie erhalten diese E-Mail, weil diese Adresse auf rexity.ai/website-check für den Bericht eingetragen und bestätigt wurde. "
    : "You receive this e-mail because this address was entered and confirmed for the report on rexity.ai/website-check. ") + CONSENT_NOTE[L];
  text.push(rule, "", why, "", ...SIGNATURE);
  html += `<p style="font-size:12px;color:#555;margin-top:20px">${esc(rule)}</p><p style="font-size:12px;color:#555">${esc(why)}</p><p>${SIGNATURE.map(esc).join("<br>")}</p></div>`;
  return { subject: de ? `Ihr Website-Check: ${report.host}` : `Your website check: ${report.host}`, textContent: text.join("\n"), htmlContent: html };
}

// The short mail that asks for the confirmation (double opt-in). Nothing else is sent and nothing is stored until
// the link in it is opened and the button on the page behind it is pressed.
function confirmMail(host, link, lang) {
  const de = lang !== "en";
  const lines = de
    ? [`für die Website ${host} wurde auf rexity.ai/website-check der vollständige Bericht an diese E-Mail-Adresse angefordert.`,
      "Bitte bestätigen Sie Ihre Adresse. Danach senden wir Ihnen den Bericht:",
      link,
      "Der Link gilt 48 Stunden.",
      CONSENT_ASK.de,
      "Sie haben nichts angefordert? Dann ignorieren Sie diese E-Mail einfach. Ohne Bestätigung erhalten Sie keine weitere E-Mail von uns."]
    : [`the full report for the website ${host} was requested for this e-mail address on rexity.ai/website-check.`,
      "Please confirm your address. We will then send you the report:",
      link,
      "The link is valid for 48 hours.",
      CONSENT_ASK.en,
      "You did not request anything? Then simply ignore this e-mail. Without confirmation you will not receive any further e-mail from us."];
  const hello = de ? "Guten Tag," : "Hello,";
  const button = de ? "Adresse bestätigen und Bericht erhalten" : "Confirm address and get the report";
  const html = `<div style="font-family:sans-serif;font-size:14px;line-height:1.5;color:#111"><p>${esc(hello)}</p><p>${esc(lines[0])}</p><p>${esc(lines[1])}</p>` +
    `<p><a href="${esc(link)}" style="display:inline-block;padding:10px 16px;background:#17152b;color:#fff;text-decoration:none;border-radius:6px">${esc(button)}</a></p>` +
    `<p style="font-size:12px;color:#555">${esc(lines[3])}</p><p style="font-size:12px;color:#555">${esc(lines[4])}</p><p style="font-size:12px;color:#555">${esc(lines[5])}</p><p>${SIGNATURE.map(esc).join("<br>")}</p></div>`;
  return {
    subject: de ? `Bitte bestätigen: Ihr Website-Check für ${host}` : `Please confirm: your website check for ${host}`,
    textContent: [hello, "", lines[0], "", lines[1], lines[2], "", lines[3], "", lines[4], "", lines[5], "", ...SIGNATURE].join("\n"),
    htmlContent: html
  };
}

// ---- Signed values: the confirmation link and the pass of a verified browser ------------------------------------
const b64u = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s) => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");
const hmacOf = (key, v) => crypto.createHmac("sha256", key).update(v).digest();
const sameBytes = (a, b) => a.length === b.length && crypto.timingSafeEqual(a, b);
let mailSecretWarned = false;
// -> the two keys derived from CHECK_MAIL_SECRET, or null (variable missing or shorter than 16 characters)
function mailKeys() {
  const s = String(process.env.CHECK_MAIL_SECRET || "").trim();
  if (s.length < 16) {
    if (s && !mailSecretWarned) { mailSecretWarned = true; console.error("[check] CHECK_MAIL_SECRET is shorter than 16 characters and is ignored: report mails go out without confirmation"); }
    return null;
  }
  return { enc: hmacOf(s, "rexity-check/confirm/enc/v1"), mac: hmacOf(s, "rexity-check/confirm/mac/v1") };
}
// The link carries everything needed to send the report later: address, checked URL, language, expiry. It is
// encrypted (AES-256-GCM), so the e-mail address is not readable in a URL or a log, and signed (HMAC-SHA256 with
// CHECK_MAIL_SECRET). Why no "pending" row in the database: an address that is never confirmed is then stored
// nowhere, the link works on every instance without a shared store, and there is nothing to clean up. The price:
// a single link cannot be withdrawn before its 48 hours are over (changing the secret withdraws all of them), and
// "already used" is known in memory and, once docs/sql/check_usage_keys.sql is applied, in the shared counter.
function signConfirm(payload, keys) {
  const iv = deps.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", keys.enc, iv);
  const ct = Buffer.concat([c.update(JSON.stringify(payload), "utf8"), c.final()]);
  const body = "v1." + b64u(Buffer.concat([iv, c.getAuthTag(), ct]));
  return body + "." + b64u(hmacOf(keys.mac, body));
}
// -> { email, url, lang, exp } or { error: "confirm_bad" | "confirm_expired" }
function readConfirm(token, keys) {
  const parts = String(token || "").split(".");
  if (!keys || parts.length !== 3 || parts[0] !== "v1" || String(token).length > 4000) return { error: "confirm_bad" };
  const body = parts[0] + "." + parts[1];
  try {
    if (!sameBytes(unb64u(parts[2]), hmacOf(keys.mac, body))) return { error: "confirm_bad" };
    const raw = unb64u(parts[1]);
    const d = crypto.createDecipheriv("aes-256-gcm", keys.enc, raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    const p = JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8"));
    if (!p || typeof p.email !== "string" || typeof p.url !== "string" || !Number.isFinite(p.exp)) return { error: "confirm_bad" };
    if (deps.now() > p.exp) return { error: "confirm_expired", lang: p.lang === "en" ? "en" : "de" };
    return { email: p.email, url: p.url, lang: p.lang === "en" ? "en" : "de", exp: p.exp };
  } catch (_e) {
    return { error: "confirm_bad" };
  }
}
const tokenId = (token) => crypto.createHash("sha256").update(String(token)).digest("hex").slice(0, 40);
const usedTokens = new Map(); // token id -> expiry (confirmation links that already sent their report)

// The pass: a browser that solved the bot check once gets a value that is accepted instead of a new token for
// 30 minutes from the same IP address (the language switch and the report request need no second challenge).
const turnstileSecret = () => String(process.env.TURNSTILE_SECRET_KEY || "").trim();
const passKey = (secret) => hmacOf(secret, "rexity-check/pass/v1");
function makePass(ip, secret) {
  const exp = deps.now() + PASS_TTL_MS;
  const body = exp.toString(36) + "." + crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
  return { pass: body + "." + b64u(hmacOf(passKey(secret), body)), expiresAt: new Date(exp).toISOString() };
}
function passValid(pass, ip, secret) {
  const p = String(pass || "").split(".");
  if (p.length !== 3 || String(pass).length > 200) return false;
  const body = p[0] + "." + p[1];
  try {
    if (!sameBytes(unb64u(p[2]), hmacOf(passKey(secret), body))) return false;
  } catch (_e) { return false; }
  const exp = parseInt(p[0], 36);
  return Number.isFinite(exp) && deps.now() <= exp && p[1] === crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}
// -> { ok, issued? } With TURNSTILE_SECRET_KEY set a browser POST needs a valid pass or a token Cloudflare accepts.
async function botCheck(data, ip) {
  const secret = turnstileSecret();
  if (!secret) return { ok: true };
  if (data.pass && passValid(data.pass, ip, secret)) return { ok: true };
  const token = typeof data.turnstileToken === "string" ? data.turnstileToken.slice(0, 4000) : "";
  const verify = deps.verifyTurnstile || require("./_turnstile").verifyTurnstile;
  if (token && (await verify(token, ip))) return { ok: true, issued: makePass(ip, secret) };
  await bumpDaily("botfail", 1);
  return { ok: false };
}

// ---- Handler ------------------------------------------------------------------------------------------
function send(res, status, payload, headers) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  for (const [k, v] of Object.entries(headers || {})) res.setHeader(k, v);
  res.end(JSON.stringify(payload));
}
const MSG = {
  bad_url: T("Bitte geben Sie eine gültige Internetadresse ein, zum Beispiel www.ihr-betrieb.de.", "Please enter a valid web address, for example www.your-business.com."),
  bad_scheme: T("Bitte geben Sie eine Adresse ein, die mit http:// oder https:// beginnt.", "Please enter an address that starts with http:// or https://."),
  bad_port: T("Adressen mit Portangabe prüfen wir nicht. Bitte geben Sie die öffentliche Adresse Ihrer Website ein.", "We do not check addresses with a port. Please enter the public address of your website."),
  private_host: T("Diese Adresse prüfen wir nicht: Der Check ist nur für öffentlich erreichbare Websites gedacht.", "We do not check this address: the check is meant for publicly reachable websites only."),
  optout: T("Diese Website prüfen wir nicht: Ihr Betreiber hat uns gebeten, sie vom Website-Check auszunehmen.", "We do not check this website: its owner asked us to leave it out of the website check."),
  dns: T("Diese Adresse haben wir nicht gefunden. Bitte prüfen Sie die Schreibweise.", "We could not find this address. Please check the spelling."),
  rate: T("Das waren viele Prüfungen in kurzer Zeit. Bitte versuchen Sie es in einigen Minuten erneut.", "That was a lot of checks in a short time. Please try again in a few minutes."),
  // Sprint 35 (the founder's wording): a quota for fresh checks is reached. Per IP address and per day it comes back
  // "tomorrow"; for the hourly quota that would be untrue, so it names the next full hour.
  quota_ip: T("Kontingent erreicht. Es steht morgen wieder zur Verfügung. Entschuldigen Sie die Unannehmlichkeit.", "Quota threshold reached. It will be restored tomorrow. Sorry for the inconvenience."),
  quota_day: T("Kontingent erreicht. Es steht morgen wieder zur Verfügung. Entschuldigen Sie die Unannehmlichkeit.", "Quota threshold reached. It will be restored tomorrow. Sorry for the inconvenience."),
  quota_hour: T("Kontingent erreicht. Es steht in der nächsten vollen Stunde wieder zur Verfügung. Entschuldigen Sie die Unannehmlichkeit.", "Quota threshold reached. It will be restored at the next full hour. Sorry for the inconvenience."),
  email: T("Bitte geben Sie eine gültige E-Mail-Adresse ein.", "Please enter a valid e-mail address."),
  mail_failed: T("Die E-Mail konnte gerade nicht versendet werden. Bitte schreiben Sie uns an info@rexity.ai.", "The e-mail could not be sent just now. Please write to info@rexity.ai."),
  bot_check: T("Die Sicherheitsprüfung ist fehlgeschlagen. Bitte laden Sie die Seite neu und versuchen Sie es noch einmal.", "The security check failed. Please reload the page and try again."),
  origin: T("Diese Anfrage kommt nicht von unserer Seite. Für Programme gibt es die Abfrage per GET, siehe https://www.rexity.ai/.well-known/openapi.json.", "This request does not come from our page. Programs can use the GET request, see https://www.rexity.ai/.well-known/openapi.json."),
  confirm_bad: T("Dieser Bestätigungslink ist ungültig. Bitte fordern Sie den Bericht auf www.rexity.ai/website-check neu an.", "This confirmation link is not valid. Please request the report again on www.rexity.ai/website-check."),
  confirm_expired: T("Dieser Bestätigungslink ist abgelaufen (er gilt 48 Stunden). Bitte fordern Sie den Bericht auf www.rexity.ai/website-check neu an.", "This confirmation link has expired (it is valid for 48 hours). Please request the report again on www.rexity.ai/website-check."),
  method: T("Diese Methode wird nicht unterstützt.", "This method is not supported."),
  json: T("Die Anfrage war kein gültiges JSON.", "The request was not valid JSON."),
  too_large: T("Die Anfrage ist zu groß.", "The request is too large."),
  server: T("Die Prüfung ist fehlgeschlagen. Bitte versuchen Sie es später erneut.", "The check failed. Please try again later.")
};
const msgOf = (code, lang) => (MSG[code] || MSG.server)[lang === "en" ? "en" : "de"];
const fail = (res, status, code, lang, headers) => send(res, status, { ok: false, error: code, message: msgOf(code, lang) }, headers);
// HTTP status and Retry-After of a CheckError
function errorShape(e, api) {
  if (!(e instanceof CheckError)) return { status: 500, code: "server" };
  if (e.code === "rate") return { status: 429, code: "rate", retry: api ? "600" : "300" };
  // Retry-After of a quota: the seconds until it is restored (the next full hour; midnight in Europe/Berlin)
  if (e.code === "quota_hour") return { status: 429, code: e.code, retry: String(secondsToNextHour(deps.now())) };
  if (e.code === "quota_ip" || e.code === "quota_day") return { status: 429, code: e.code, retry: String(secondsToBerlinMidnight(deps.now())) };
  return { status: 422, code: e.code };
}

// Cache first (memory, then the shared store): a cached result costs no limit. A fresh check counts against the
// three quotas (Sprint 35: per IP address and day, per hour, per day; the same for the form, GET and MCP) and the
// short-window burst protection (per IP in 10 minutes, per checked host and hour). opts.door: "form" | "get" | "mcp".
async function getReport(input, ip, lang, opts) {
  const api = Boolean(opts && opts.api);
  const door = api ? (opts.door === "mcp" ? "mcp" : "get") : "form";
  const key = cacheKey(input.parsed.url);
  let report = cacheGet(key);
  let cached = Boolean(report);
  if (!report) {
    report = await sharedGet(key);
    if (report) { cached = true; cacheSet(key, report); }
  }
  if (!report) {
    // 1. the quotas, from this instance's own count first: a visitor past the quota gets the quota's sentence, and
    //    nothing is counted for a request that is refused
    const q = await quotaNow();
    const refuse = async (kind) => { await countUsage("quota" + kind, 1); throw new CheckError("quota_" + kind); };
    const m = quotaMemNow();
    if ((m.ips.get(ipHash(ip)) || 0) >= q.ip) await refuse("ip");
    if (m.hourCount >= q.hour) await refuse("hour");
    if (today().checks >= q.day || (api && today().apichecks >= API_DAILY_CAP)) await refuse("day");
    // 2. burst protection (memory per instance): 5 fresh checks per IP in 10 minutes, 6 per checked host and hour.
    //    A fresh check takes most of a minute, so someone running the 5 checks of a day one after the other stays
    //    inside both.
    if (hit("host:" + input.parsed.url.hostname, HOST_LIMIT, HOST_WINDOW_MS)) throw new CheckError("rate");
    if (hit("ip:" + ip, IP_LIMIT, IP_WINDOW_MS)) throw new CheckError("rate");
    // An attempt that produces no result is logged as one, with its status (never for an opted-out site).
    const attempt = async (e) => { const status = runStatusOf(e); if (status) await logRun({ url: input.parsed.url, door, score: null, status }); };
    // 3. the host must exist and be public before a quota is used: a typing mistake costs none of the day's five
    try { await resolvePublic(input.parsed.url.hostname); } catch (e) { await attempt(e); throw e; }
    // 4. count it (shared store when there is one)
    const refused = await quotaTake(ip, q, api);
    if (refused) await refuse(refused);
    try {
      report = await runCheck(input);
    } catch (e) {
      await attempt(e);
      throw e;
    }
    cacheSet(key, report);
    await logRun({ url: report.url, door, score: report.overall.score, status: report.blocks.find && report.blocks.find.checked ? "ok" : "nicht erreichbar" });
  } else if (!api && input.trade && input.town && report.blocks.find && report.blocks.find.checked && !report.blocks.find.ranking) {
    // a cached report without the ranking block: one lookup (never more than one per request)
    if (String(process.env.DATAFORSEO_AUTH_B64 || "").trim() && today().lookups < LOOKUP_DAILY_CAP && !hit("rank:" + ip, IP_LIMIT, IP_WINDOW_MS)) {
      today().lookups++;
      const r = await runRanking(report.host, input.trade, input.town);
      if (r) report.blocks.find.ranking = r;
    }
  }
  if (!report.summaries[lang]) {
    report.summaries[lang] = await buildSummary(report, lang);
    cacheSet(key, report);
    await sharedSet(key, report);
  }
  if (cached && !(opts && opts.quiet)) await logRun({ url: report.url, door, score: report.overall.score, status: report.blocks.find && report.blocks.find.checked ? "ok" : "nicht erreichbar", cached: true });
  return { report, cached };
}

// GET /api/check?url=… and the MCP tool: the public tier for assistants and programs. No bot check; own limits.
// -> { status, body, headers }
async function assistantCheckCore({ url, lang, ip, door }) {
  const L = String(lang || "").toLowerCase().startsWith("en") ? "en" : "de";
  const err = (status, code, retry) => ({ status, lang: L, body: { ok: false, error: code, message: msgOf(code, L), links: LINKS }, headers: retry ? { "Retry-After": retry } : {} });
  if (hit("apireq:" + ip, API_REQUEST_LIMIT, IP_WINDOW_MS)) return err(429, "rate", "600");
  let parsed;
  try { parsed = normaliseUrl(url); } catch (e) { return err(422, e instanceof CheckError ? e.code : "bad_url"); }
  try {
    const { report, cached } = await getReport({ parsed, trade: "", town: "" }, ip, L, { api: true, door });
    return { status: 200, lang: L, body: publicView(report, L, cached), headers: {} };
  } catch (e) {
    const s = errorShape(e, true);
    if (s.code === "server") console.error("[check] failed:", e && e.message ? String(e.message).slice(0, 200) : "error");
    return err(s.status, s.code, s.retry);
  }
}

// The small page behind the confirmation link (and the answer after its button was pressed). No script, no
// external file; the token never leaves in a referrer.
function htmlPage(res, status, lang, title, bodyHtml) {
  const de = lang !== "en";
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.end(`<!doctype html><html lang="${de ? "de" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><meta name="referrer" content="no-referrer"><title>${esc(title)}</title>` +
    // Sprint 31: the light look of /website-check (violet tint, one white card, the accent button), with the system
    // font because the page loads no file
    `<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.25rem;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:17px;line-height:1.55;color:#17152b;background:radial-gradient(60% 50% at 50% 0%,rgba(124,58,237,.18),transparent 70%),#f4f1fc}main{width:100%;max-width:33rem;padding:2rem 1.5rem;border-radius:28px;background:#fff;box-shadow:0 1px 2px rgba(23,21,43,.05),0 30px 70px -28px rgba(75,50,170,.42)}.k{margin:0 0 .6rem;color:#5b3fd6;font-size:.8125rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase}h1{font-size:1.75rem;line-height:1.15;letter-spacing:-.02em;margin:0 0 1rem}p{margin:0 0 1rem}strong{overflow-wrap:anywhere}.b{display:inline-block;min-height:52px;font:inherit;font-weight:600;padding:.8rem 1.6rem;border:0;border-radius:14px;background:#5b3fd6;color:#fff;cursor:pointer;box-shadow:0 10px 24px -10px rgba(91,63,214,.75)}.b:hover{background:#4a31b8}form{margin:1.5rem 0}.b:focus-visible,a:focus-visible{outline:3px solid #5b3fd6;outline-offset:3px}.s{font-size:.8125rem;color:#55536b}.s:last-child{margin:1.5rem 0 0;padding-top:1rem;border-top:1px solid rgba(23,21,43,.1)}a{color:#4a31b8}@media(min-width:560px){main{padding:2.75rem 2.75rem 2.25rem}}@media(max-width:420px){.b{width:100%}}</style></head>` +
    `<body><main data-wc-confirm><p class="k">${de ? "Website-Check" : "Website check"}</p><h1>${esc(title)}</h1>${bodyHtml}<p class="s"><a href="${SITE_ORIGIN}/website-check">${de ? "Zum Website-Check" : "To the website check"}</a> · Rexity Labs UG (haftungsbeschränkt) · <a href="${SITE_ORIGIN}/impressum">${de ? "Impressum" : "Legal notice"}</a> · <a href="${SITE_ORIGIN}/datenschutz">${de ? "Datenschutz" : "Privacy"}</a></p></main></body></html>`);
}
const CONFIRM_TEXT = {
  title: T("Website-Check: Bericht bestätigen", "Website check: confirm the report"),
  ask: T("Mit einem Klick senden wir den vollständigen Bericht für {host} an {email}.", "With one click we send the full report for {host} to {email}."),
  button: T("Bericht jetzt senden", "Send the report now"),
  sentTitle: T("Der Bericht ist unterwegs", "The report is on its way"),
  sent: T("Wir haben den vollständigen Bericht für {host} an {email} gesendet. Bitte sehen Sie auch im Spam-Ordner nach, falls er in wenigen Minuten nicht da ist.", "We have sent the full report for {host} to {email}. Please also look in your spam folder if it has not arrived in a few minutes."),
  already: T("Der Bericht für {host} wurde über diesen Link bereits an {email} gesendet. Für einen neuen Bericht fordern Sie ihn bitte auf der Seite erneut an.", "The report for {host} has already been sent to {email} through this link. For a new report please request it again on the page."),
  failTitle: T("Das hat nicht geklappt", "That did not work")
};
const fillText = (t, host, email) => esc(t).replace("{host}", "<strong>" + esc(host) + "</strong>").replace("{email}", "<strong>" + esc(email) + "</strong>");
const hostOf = (u) => { try { return new URL(u).hostname; } catch (_e) { return ""; } };

// Pressing the button behind the confirmation link: the report goes out, and only now the lead is stored and we
// are told. -> { status, code, lang, host, email }
async function confirmReport(token, ip) {
  const keys = mailKeys();
  const p = readConfirm(token, keys);
  if (p.error) return { status: p.error === "confirm_expired" ? 410 : 400, code: p.error, lang: p.lang || "de" };
  const lang = p.lang;
  const base = { lang, host: hostOf(p.url), email: p.email };
  if (hit("confirmip:" + ip, 10, IP_WINDOW_MS)) return { ...base, status: 429, code: "rate", retry: "300" };
  const id = tokenId(token);
  for (const [k, exp] of usedTokens) if (deps.now() > exp) usedTokens.delete(k);
  if (usedTokens.has(id)) return { ...base, status: 200, code: "already_sent" };
  const before = await sharedBump("done:" + id, 0, 3 * 86400, true);
  if (before !== null && before > 0) { usedTokens.set(id, p.exp); return { ...base, status: 200, code: "already_sent" }; }
  let parsed;
  try { parsed = normaliseUrl(p.url); } catch (e) { return { ...base, status: 422, code: e instanceof CheckError ? e.code : "bad_url" }; }
  let report;
  try {
    ({ report } = await getReport({ parsed, trade: "", town: "" }, ip, lang, { quiet: true }));
  } catch (e) {
    const s = errorShape(e, false);
    if (s.code === "server") console.error("[check] confirm failed:", e && e.message ? String(e.message).slice(0, 200) : "error");
    return { ...base, status: s.status, code: s.code, retry: s.retry };
  }
  usedTokens.set(id, p.exp); // claimed before the mail goes out: a double click sends one report
  const sent = await deliverReport(report, p.email, lang);
  if (!sent) { usedTokens.delete(id); return { ...base, status: 502, code: "mail_failed" }; }
  await sharedBump("done:" + id, 1, 3 * 86400, true);
  return { ...base, host: report.host, status: 200, code: "report_sent" };
}

// The full report to a confirmed address (or, without CHECK_MAIL_SECRET, to the address as entered), then the
// lead and our own notification. -> true when the mail went out
async function deliverReport(report, email, lang) {
  const notify = deps.notify || require("./_notify");
  const mail = reportMail(report, lang);
  const sent = await notify.sendMail({ to: email, subject: mail.subject, textContent: mail.textContent, htmlContent: mail.htmlContent });
  if (!sent || !sent.sent) {
    console.log("[check] report mail sent=false reason=" + ((sent && sent.reason) || "unknown"));
    return false;
  }
  await bumpDaily("reports", 1);
  await queueFollowup(report, email, lang); // Sprint 34: one follow-up two days later; does nothing unless CHECK_FOLLOWUP=1
  // Lead (api/lead.js path). The form states it: requesting the report includes consent to be contacted.
  const service = "Website-Check (Kontakt erlaubt)";
  const overall = report.overall.score === null ? "nicht prüfbar" : report.overall.score + "/100";
  const message = `Kontakt erlaubt: ja\nWebsite-Check für ${report.finalUrl}\nGesamt: ${overall}` +
    Object.keys(WEIGHTS.blocks).map((id) => `\n${BLOCK_NAMES[id].de}: ${report.blocks[id].score === null ? "nicht prüfbar" : report.blocks[id].score + "/100"}`).join("");
  try {
    const insertLead = deps.insertLead || require("./lead").insertLead;
    await insertLead({ id: "web_" + crypto.randomUUID(), name: report.host, email, phone: null, company: null, service, message, source: "WEBSITE", updatedAt: new Date(deps.now()).toISOString() });
  } catch (e) {
    console.error("[check] lead insert failed:", e && e.message ? String(e.message).slice(0, 120) : "error");
  }
  try {
    await notify.notifyLead({ kind: "website-check", name: report.host, email, message, service, source: "/website-check", lang }, { confirmation: false });
  } catch (_e) { /* never affects the response */ }
  return true;
}

const queryOf = (req) => { try { return new URL(String(req.url || "/"), SITE_ORIGIN).searchParams; } catch (_e) { return new URLSearchParams(); } };
const headerOf = (req, name) => { const v = req.headers && req.headers[name]; return typeof v === "string" ? v : Array.isArray(v) ? v.join(", ") : ""; };
const OWN_HOSTS = new Set(["www.rexity.ai", "rexity.ai"]);
// A browser POST from another site is refused (programs use GET; requests without an Origin header pass).
function foreignOrigin(req) {
  const origin = headerOf(req, "origin");
  if (!origin) return false;
  let host;
  try { host = new URL(origin).host.toLowerCase(); } catch (_e) { return true; }
  const own = (headerOf(req, "x-forwarded-host") || headerOf(req, "host")).toLowerCase();
  return !(OWN_HOSTS.has(host) || (own && host === own));
}
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Accept, Content-Type", "Access-Control-Max-Age": "86400" };

async function coreHandler(req, res) {
  const ip = clientIp(req);
  const query = queryOf(req);

  // Sprint 35: the protected admin call (quotas, the log of checked addresses). Nothing else is reachable through it.
  if (query.has("admin")) return adminHandler(req, res, query, ip);

  if (req.method === "OPTIONS") { // preflight of a cross-origin GET
    res.statusCode = 204;
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
    return res.end();
  }

  if (req.method === "GET" || req.method === "HEAD") {
    // 1. the page behind the confirmation link
    if (query.has("confirm")) {
      const p = readConfirm(query.get("confirm"), mailKeys());
      const lang = p.lang || "de";
      if (p.error) return htmlPage(res, p.error === "confirm_expired" ? 410 : 400, lang, CONFIRM_TEXT.failTitle[lang], `<p>${esc(msgOf(p.error, lang))}</p>`);
      return htmlPage(res, 200, lang, CONFIRM_TEXT.title[lang],
        `<p>${fillText(CONFIRM_TEXT.ask[lang], hostOf(p.url), p.email)}</p><form method="post" action="/api/check"><input type="hidden" name="confirm" value="${esc(query.get("confirm"))}"><button class="b" type="submit">${esc(CONFIRM_TEXT.button[lang])}</button></form><p class="s">${esc(CONSENT_ASK[lang])}</p>`);
    }
    // 1b. Sprint 34: the shareable score card (/website-check/ergebnis/<host>, vercel.json rewrite). Never starts a check.
    if (query.has("card")) return cardPage(req, res, query, ip);
    // 2. assistants and programs: the public tier
    const lang = String(query.get("lang") || "").toLowerCase().startsWith("en") ? "en" : "de";
    const head = { ...CORS, Vary: "Accept", "X-Robots-Tag": "noindex" };
    if (!query.has("url")) {
      return send(res, 400, { ok: false, error: "bad_url", message: msgOf("bad_url", lang), usage: "GET /api/check?url=<address>&lang=de|en[&format=json|md]", links: LINKS }, head);
    }
    const r = await assistantCheck({ url: query.get("url"), lang, ip, via: "get" });
    const format = String(query.get("format") || "").toLowerCase();
    const wantsMd = format === "md" || format === "markdown" || (format !== "json" && /text\/markdown/i.test(headerOf(req, "accept")));
    if (r.status === 200 && wantsMd) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      for (const [k, v] of Object.entries(head)) res.setHeader(k, v);
      return res.end(publicMarkdown(r.body));
    }
    if (r.status === 429 && wantsMd && /^quota_/.test(String(r.body && r.body.error))) {
      // Sprint 35: a reached quota is answered in the format that was asked for, with the same sentence
      res.statusCode = 429;
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      for (const [k, v] of Object.entries({ ...head, ...r.headers })) res.setHeader(k, v);
      return res.end(`# Website-Check\n\n${r.body.message}\n\n(${r.body.error})\n`);
    }
    return send(res, r.status, r.body, { ...head, ...r.headers });
  }

  if (req.method !== "POST") return send(res, 405, { ok: false, error: "method", message: msgOf("method", "de") }, { Allow: "GET, POST, OPTIONS" });

  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > MAX_BODY) return send(res, 413, { ok: false, error: "too_large", message: msgOf("too_large", "de") });
  }
  const isForm = /application\/x-www-form-urlencoded/i.test(headerOf(req, "content-type"));
  let data;
  if (isForm) data = Object.fromEntries(new URLSearchParams(body));
  else {
    try { data = JSON.parse(body || "{}"); } catch (_e) { return send(res, 400, { ok: false, error: "json", message: msgOf("json", "de") }); }
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return send(res, 400, { ok: false, error: "json", message: msgOf("json", "de") });
  const lang = String(data.lang || "").toLowerCase().startsWith("en") ? "en" : "de";

  // The button behind the confirmation link (a plain form), or the same as JSON. No Origin check here: the page
  // behind the link sends "Referrer-Policy: no-referrer", so the browser posts the form with "Origin: null"; the
  // signed link itself is what authorises the request.
  if (typeof data.confirm === "string" && data.confirm) {
    const r = await confirmReport(data.confirm, ip);
    const ok = r.code === "report_sent" || r.code === "already_sent";
    if (!isForm) {
      return ok ? send(res, 200, { ok: true, status: r.code, host: r.host, lang: r.lang })
        : send(res, r.status, { ok: false, error: r.code, message: msgOf(r.code, r.lang) }, r.retry ? { "Retry-After": r.retry } : undefined);
    }
    const L = r.lang;
    if (r.retry) res.setHeader("Retry-After", r.retry);
    if (r.code === "report_sent") return htmlPage(res, 200, L, CONFIRM_TEXT.sentTitle[L], `<p>${fillText(CONFIRM_TEXT.sent[L], r.host, r.email)}</p>`);
    if (r.code === "already_sent") return htmlPage(res, 200, L, CONFIRM_TEXT.sentTitle[L], `<p>${fillText(CONFIRM_TEXT.already[L], r.host, r.email)}</p>`);
    return htmlPage(res, r.status, L, CONFIRM_TEXT.failTitle[L], `<p>${esc(msgOf(r.code, L))}</p>`);
  }
  if (isForm) return send(res, 400, { ok: false, error: "json", message: msgOf("json", lang) });
  if (foreignOrigin(req)) return fail(res, 403, "origin", lang);

  const wantsMail = data.email !== undefined && data.email !== null && String(data.email).trim() !== "";

  // Honeypot (as in api/lead.js): pretend success, do nothing.
  if (String(data.company_website || data._gotcha || "").trim()) return send(res, 200, wantsMail ? { ok: true, sent: true, status: "confirmation_sent" } : { ok: false, error: "server", message: MSG.server[lang] });

  if (hit("req:" + ip, REQUEST_LIMIT, IP_WINDOW_MS)) return fail(res, 429, "rate", lang, { "Retry-After": "300" });

  let parsed;
  try { parsed = normaliseUrl(data.url); } catch (e) { return fail(res, 422, e instanceof CheckError ? e.code : "bad_url", lang); }
  const input = { parsed, trade: cleanTerm(data.trade), town: cleanTerm(data.town) };
  let email = "";
  if (wantsMail) {
    email = String(data.email).trim().slice(0, 200);
    if (!EMAIL_RE.test(email)) return fail(res, 422, "email", lang);
  }

  try {
    // Bot check before anything is fetched, measured or sent to a model
    const bot = await botCheck(data, ip);
    if (!bot.ok) return fail(res, 403, "bot_check", lang);
    const passFields = bot.issued ? { pass: bot.issued.pass, passExpiresAt: bot.issued.expiresAt } : {};

    if (wantsMail) {
      const addrKey = "mail:" + crypto.createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 24);
      if (hit("mailip:" + ip, MAIL_IP_LIMIT, IP_WINDOW_MS) || hit(addrKey, MAIL_ADDRESS_LIMIT, 24 * 60 * 60 * 1000) || today().mails >= MAIL_DAILY_CAP) return fail(res, 429, "rate", lang, { "Retry-After": "600" });
      if ((await bumpDaily("mails", 1)) > MAIL_DAILY_CAP) return fail(res, 429, "rate", lang, { "Retry-After": "600" });
      const { report } = await getReport(input, ip, lang, { quiet: true }); // quiet: asking for the report is not a view of the result
      const keys = mailKeys();
      if (keys) {
        // Double opt-in: one short mail with a signed link. The report, the lead and our notification follow only
        // after the address is confirmed.
        const token = signConfirm({ email, url: report.url, lang, exp: deps.now() + CONFIRM_TTL_MS }, keys);
        const mail = confirmMail(report.host, SITE_ORIGIN + "/api/check?confirm=" + token, lang);
        const notify = deps.notify || require("./_notify");
        const sent = await notify.sendMail({ to: email, subject: mail.subject, textContent: mail.textContent, htmlContent: mail.htmlContent });
        if (!sent || !sent.sent) {
          console.log("[check] confirmation mail sent=false reason=" + ((sent && sent.reason) || "unknown"));
          return fail(res, 502, "mail_failed", lang);
        }
        return send(res, 200, { ok: true, sent: true, status: "confirmation_sent", expiresInHours: Math.round(CONFIRM_TTL_MS / 3600000), ...passFields });
      }
      console.log("[check] CHECK_MAIL_SECRET not set: report sent without confirmation of the address");
      if (!(await deliverReport(report, email, lang))) return fail(res, 502, "mail_failed", lang);
      return send(res, 200, { ok: true, sent: true, status: "report_sent", ...passFields });
    }

    const { report, cached } = await getReport(input, ip, lang);
    if (cached) await countUsage("cached", 1); // Sprint 34
    // the ranking position is shown to the request that asked with exactly this search (never to GET or MCP)
    const rk = report.blocks.find && report.blocks.find.ranking;
    const ownSearch = Boolean(rk && input.trade && input.town && rk.query === `${input.trade} ${input.town}`);
    return send(res, 200, { ...publicView(report, lang, cached, { ranking: ownSearch }), ...passFields });
  } catch (e) {
    const s = errorShape(e, false);
    if (s.code === "server") console.error("[check] failed:", e && e.message ? String(e.message).slice(0, 200) : "error");
    return fail(res, s.status, s.code, lang, s.retry ? { "Retry-After": s.retry } : undefined);
  }
}

// ---- Sprint 35: the admin call --------------------------------------------------------------------------------
// GET  /api/check?admin=quota                     the quotas in force and today's usage
// POST /api/check?admin=quota  {ip?, hour?, day?, until?}  store an override ("until": YYYY-MM-DD, valid through that
//                              Europe/Berlin day); numbers that are not named fall back to the environment values
// POST /api/check?admin=quota  {reset: true}      remove the override
// GET  /api/check?admin=log[&day=YYYY-MM-DD | &days=1…183]   the log of checked addresses
// Every call needs "Authorization: Bearer <CHECK_ADMIN_SECRET>". Without the variable (or with fewer than 16
// characters) the call is switched off (503). The command for it: scripts/check-tool/quota.mjs.
const adminSecret = () => { const s = String(process.env.CHECK_ADMIN_SECRET || "").trim(); return s.length >= 16 ? s : ""; };
const sameSecret = (a, b) => crypto.timingSafeEqual(crypto.createHash("sha256").update(String(a)).digest(), crypto.createHash("sha256").update(String(b)).digest());
// rows of a table through the REST interface (service role), or null when it cannot be read
async function readRows(table, query) {
  if (!persistActive()) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const resp = await deps.fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, Accept: "application/json" }, signal: ctrl.signal });
    if (!resp.ok) { await resp.text().catch(() => ""); return null; }
    const rows = await resp.json();
    return Array.isArray(rows) ? rows : null;
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
async function quotaView() {
  const q = await quotaNow(true);
  const d = today();
  const m = quotaMemNow();
  const names = ["checks", "apichecks", "cached", "ratehits", "quotaip", "quotahour", "quotaday"];
  const keys = names.map((k) => `${k}:${d.day}`).concat(`hchecks:${m.hour}`);
  const rows = await readRows("check_usage", "select=bucket,count&bucket=in.(" + keys.map((k) => `"${k}"`).join(",") + ")");
  const stored = (k) => { const r = (rows || []).find((x) => x && x.bucket === k); return r && Number.isFinite(Number(r.count)) ? Number(r.count) : null; };
  // from the shared store: null = no row (nothing counted yet, or the SQL for that counter is not applied)
  const usage = rows
    ? { source: "shared store", day: d.day, checksToday: stored(`checks:${d.day}`), checksThisHour: stored(`hchecks:${m.hour}`), viaGetAndMcpToday: stored(`apichecks:${d.day}`), cachedToday: stored(`cached:${d.day}`), limitHitsToday: stored(`ratehits:${d.day}`), quotaHitsToday: { ip: stored(`quotaip:${d.day}`), hour: stored(`quotahour:${d.day}`), day: stored(`quotaday:${d.day}`) } }
    : { source: "memory of one function instance (the shared store could not be read)", day: d.day, checksToday: d.checks, checksThisHour: m.hourCount, viaGetAndMcpToday: d.apichecks, cachedToday: d.cached, limitHitsToday: d.ratehits, quotaHitsToday: { ip: d.quotaip, hour: d.quotahour, day: d.quotaday } };
  let claude = null;
  try {
    const budget = require("./chat").CLAUDE;
    const cr = await readRows("chat_usage", "select=bucket,count,usd&bucket=in.(" + [`"claude:${d.day}"`, `"claudestop:${d.day}"`].join(",") + ")");
    const spent = (cr || []).find((x) => x && x.bucket === `claude:${d.day}`);
    const stops = (cr || []).find((x) => x && x.bucket === `claudestop:${d.day}`);
    claude = { eurCeiling: budget.eurCeiling, eurUsdRate: budget.eurUsdRate, usdBudget: budget.usdBudget, readable: cr !== null, usdToday: spent ? Number(spent.usd) || 0 : cr ? 0 : null, callsToday: spent ? Number(spent.count) || 0 : cr ? 0 : null, refusedToday: stops ? Number(stops.count) || 0 : cr ? 0 : null };
  } catch (_e) { /* the model path is not loadable here: the quota view does not depend on it */ }
  const src = (k) => (q.override && k in q.override ? "override" : "env");
  return {
    ok: true,
    quota: { ip: q.ip, hour: q.hour, day: q.day },
    source: { ip: src("ip"), hour: src("hour"), day: src("day") },
    env: q.env,
    override: q.override,
    overrideStore: q.readable ? "ok" : (PERSIST_CONFIGURED ? "not readable: docs/sql/check_quota.sql not applied, or the shared store did not answer. Only the environment values apply." : "no shared store configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). Only the environment values apply."),
    apiDailyCap: API_DAILY_CAP,
    usage,
    claude
  };
}
async function quotaSet(data) {
  const bad = (message) => ({ status: 422, body: { ok: false, error: "bad_value", message } });
  const args = { p_ip: null, p_hour: null, p_day: null, p_until: null, p_until_day: null };
  if (data.reset !== true) {
    let named = 0;
    for (const k of ["ip", "hour", "day"]) {
      if (data[k] === undefined || data[k] === null) continue;
      const [min, max] = QUOTA_RANGE[k];
      if (!Number.isInteger(data[k]) || data[k] < min || data[k] > max) return bad(`${k} must be a whole number from ${min} to ${max}.`);
      args["p_" + k] = data[k];
      named++;
    }
    if (!named) return bad("Name at least one of ip, hour, day (or reset: true).");
    if (data.until !== undefined && data.until !== null) {
      if (typeof data.until !== "string" || !DAY_RE.test(data.until) || berlinDay(berlinDayStartMs(data.until)) !== data.until) return bad("until must be a date in the form YYYY-MM-DD.");
      if (data.until < today().day) return bad("until lies in the past.");
      args.p_until_day = data.until;
      args.p_until = new Date(berlinDayStartMs(berlinDayPlus(data.until, 1))).toISOString(); // valid through that day
    }
  }
  const stored = await rpc("check_quota_set", args, true);
  if (stored === null) {
    return { status: 503, body: { ok: false, error: "store", message: "The override could not be stored: no shared store is configured, docs/sql/check_quota.sql is not applied, or the store did not answer. Only the environment values apply (CHECK_IP_DAILY, CHECK_HOURLY_CAP, CHECK_DAILY_CAP)." } };
  }
  console.log(data.reset === true ? "[check] quota override removed" : `[check] quota override set ip=${args.p_ip === null ? "env" : args.p_ip} hour=${args.p_hour === null ? "env" : args.p_hour} day=${args.p_day === null ? "env" : args.p_day} until=${args.p_until_day || "none"}`);
  return { status: 200, body: await quotaView() };
}
// -> { ok, readable, days: [{ day, total, addresses, cachedViews, rows: [...] }] }, newest day first
async function runLogView(query) {
  const todayStr = today().day;
  let from = todayStr;
  let to = todayStr;
  const day = String(query.get("day") || "");
  if (day) {
    if (!DAY_RE.test(day)) return { status: 422, body: { ok: false, error: "bad_value", message: "day must be a date in the form YYYY-MM-DD." } };
    from = to = day;
  } else if (query.has("days")) {
    const n = parseInt(query.get("days"), 10);
    if (!Number.isInteger(n) || n < 1 || n > RETENTION_DAYS) return { status: 422, body: { ok: false, error: "bad_value", message: `days must be a whole number from 1 to ${RETENTION_DAYS}.` } };
    from = berlinDayPlus(todayStr, -(n - 1));
  }
  const rows = await readRows("check_runs", `select=day,url,host,runs,cached,door,score,status,first_at,last_at&day=gte.${from}&day=lte.${to}&order=day.desc,runs.desc,url.asc&limit=20000`);
  const days = [];
  for (let d = to; d >= from && days.length <= RETENTION_DAYS; d = berlinDayPlus(d, -1)) {
    const list = (rows || []).filter((r) => r && r.day === d).map((r) => ({ url: String(r.url || ""), host: String(r.host || ""), runs: Number(r.runs) || 0, cached: Number(r.cached) || 0, door: String(r.door || ""), score: r.score === null || r.score === undefined ? null : Number(r.score), status: String(r.status || ""), firstAt: r.first_at || null, lastAt: r.last_at || null }));
    days.push({ day: d, total: list.reduce((a, r) => a + r.runs, 0), addresses: list.filter((r) => r.runs > 0).length, cachedViews: list.reduce((a, r) => a + r.cached, 0), rows: list });
  }
  return { status: 200, body: { ok: true, readable: rows !== null, note: rows === null ? (PERSIST_CONFIGURED ? "The log could not be read: docs/sql/check_runs.sql not applied, or the shared store did not answer." : "No shared store is configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY): nothing is logged.") : undefined, from, to, days } };
}
async function adminHandler(req, res, query, ip) {
  const head = { "X-Robots-Tag": "noindex" };
  const secret = adminSecret();
  if (!secret) return send(res, 503, { ok: false, error: "admin_off", message: "CHECK_ADMIN_SECRET is not set (or shorter than 16 characters): the admin call is switched off." }, head);
  if (hit("admin:" + ip, 30, IP_WINDOW_MS)) return send(res, 429, { ok: false, error: "rate", message: msgOf("rate", "en") }, { ...head, "Retry-After": "600" });
  if (!sameSecret(headerOf(req, "authorization"), "Bearer " + secret)) return send(res, 401, { ok: false, error: "unauthorized" }, head);
  const what = String(query.get("admin") || "");
  if (what === "quota" && req.method === "GET") return send(res, 200, await quotaView(), head);
  if (what === "quota" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 2000) return send(res, 413, { ok: false, error: "too_large", message: msgOf("too_large", "en") }, head);
    }
    let data;
    try { data = JSON.parse(body || "{}"); } catch (_e) { data = null; }
    if (!data || typeof data !== "object" || Array.isArray(data)) return send(res, 400, { ok: false, error: "json", message: msgOf("json", "en") }, head);
    const r = await quotaSet(data);
    return send(res, r.status, r.body, head);
  }
  if (what === "log" && req.method === "GET") {
    const r = await runLogView(query);
    return send(res, r.status, r.body, head);
  }
  return send(res, what === "quota" || what === "log" ? 405 : 404, { ok: false, error: what === "quota" || what === "log" ? "method" : "admin_unknown" }, head);
}

// ---- Sprint 34: usage counters, the score card, the follow-up queue ------------------------------------------
// Everything in this section is additive: it counts, or it reads what is already stored. None of it is a limit.

// One more for a day's counter (memory and, when the shared store knows the key, there). Never throws and never
// blocks a response on a store that refuses the key: docs/sql/check_usage_keys_s34.sql not applied yet means the
// counter exists in memory only and the digest reports "kein Eintrag"; the store is then left alone for 10 minutes.
const countOffUntil = new Map(); // kind -> time until which the shared store is not asked for it
async function countUsage(kind, n) {
  try {
    const add = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 1;
    const d = today();
    if (!(kind in d) || !add) return;
    d[kind] += add;
    if (!persistActive() || deps.now() < (countOffUntil.get(kind) || 0)) return;
    const shared = await sharedBump(`${kind}:${d.day}`, add, DAY_COUNTER_TTL_S, true);
    if (shared === null) countOffUntil.set(kind, deps.now() + 10 * 60 * 1000);
  } catch (_e) { /* a counter never affects a response */ }
}

// GET /api/check?url=… and the MCP tool (via: "get" | "mcp"): the public tier, counted for the weekly numbers.
async function assistantCheck({ url, lang, ip, via }) {
  const mcp = via === "mcp";
  await countUsage(mcp ? "mcpcalls" : "apiget", 1);
  const r = await assistantCheckCore({ url, lang, ip, door: mcp ? "mcp" : "get" });
  if (r.status === 200 && r.body && r.body.cached) await countUsage("cached", 1);
  if (r.status === 429 && mcp) await countUsage("ratehits", 1); // a GET's 429 is counted by handler() below
  return r;
}

// The stored result for an address, or null. Reads the memory cache and the shared store; never fetches the
// website, never calls a model, never writes. A result older than 24 hours is not returned even when an instance
// still holds it.
async function storedReport(url) {
  const key = cacheKey(url);
  const report = cacheGet(key) || (await sharedGet(key));
  if (!report || !report.checkedAt) return null;
  const age = deps.now() - Date.parse(report.checkedAt);
  return Number.isFinite(age) && age >= 0 && age <= CACHE_TTL_MS ? report : null;
}

const CARD_REQUEST_LIMIT = 60; // score-card requests per IP and 10 minutes
const PREVIEW_AGENT = /bot\b|bot\/|crawler|spider|facebookexternalhit|whatsapp|slack|telegram|discord|preview|embedly|skype|pinterest|vkshare|curl\/|wget\//i;
// -> { status, card } for api/_card.js. host: the first path segment of /website-check/ergebnis/<host>; page: the
// path of a checked sub-page (?p=/kontakt). The opt-out list wins over a stored result.
async function cardData({ host, page, lang, ip }) {
  const L = lang === "en" ? "en" : "de";
  const h = String(host || "").trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/[/?#].*$/, "").replace(/\.$/, "");
  if (hit("cardreq:" + ip, CARD_REQUEST_LIMIT, IP_WINDOW_MS)) return { status: 429, card: { state: "rate", host: "" } };
  if (!h || h.length > 253 || !/^[a-z0-9.-]+$/.test(h)) return { status: 400, card: { state: "bad", host: "" } };
  let p = String(page || "/");
  if (!p.startsWith("/") || p.startsWith("//") || p.length > 300 || /[\s<>"'`\\]/.test(p)) p = "/";
  let parsed;
  try { parsed = normaliseUrl("https://" + h + p); } catch (e) {
    return e instanceof CheckError && e.code === "optout" ? { status: 404, card: { state: "optout", host: "" } } : { status: 400, card: { state: "bad", host: "" } };
  }
  const shown = parsed.url.hostname.replace(/^www\./, "");
  const report = await storedReport(parsed.url);
  // a stored result whose final address (after a redirect) belongs to an opted-out site is not shown either
  if (report && (isOptedOut(report.host) || isOptedOut(hostOf(report.finalUrl)))) return { status: 404, card: { state: "optout", host: "" } };
  const path = (parsed.url.pathname.replace(/\/+$/, "") || "/") + (parsed.url.search || "");
  if (!report) return { status: 404, card: { state: "none", host: shown, path } };
  return { status: 200, card: { state: "result", host: shown, path, view: publicView(report, L, true), ttlMs: CACHE_TTL_MS } };
}

async function cardPage(req, res, query, ip) {
  const lang = String(query.get("lang") || "").toLowerCase().startsWith("en") ? "en" : "de";
  const r = await cardData({ host: query.get("card"), page: query.get("p"), lang, ip });
  // A view is a person opening the card; the fetch of a link preview (a network's bot) is not counted.
  if (r.status === 200 && req.method === "GET" && !PREVIEW_AGENT.test(headerOf(req, "user-agent"))) await countUsage("cards", 1);
  res.statusCode = r.status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store"); // the opt-out list and the 24 hours must hold at every request
  res.setHeader("X-Robots-Tag", "noindex");
  if (r.status === 429) res.setHeader("Retry-After", "300");
  const html = require("./_card").renderCard(r.card, lang);
  return res.end(req.method === "HEAD" ? "" : html);
}

// The one follow-up mail (api/followup.js): queued only when CHECK_FOLLOWUP=1 and never affects the report.
async function queueFollowup(report, email, lang) {
  try {
    const queue = deps.queueFollowup || require("./followup").queueFollowup;
    await queue({ email, host: report.host, lang, now: deps.now() });
  } catch (e) {
    console.error("[check] follow-up not queued:", e && e.message ? String(e.message).slice(0, 120) : "error");
  }
}

// The function Vercel calls. It wraps coreHandler for one purpose: an answer "429" (a limit of this function was
// hit) is counted before the response is closed, so the count is not lost when the instance is frozen.
async function handler(req, res) {
  const end = res.end;
  let pending = null;
  res.end = function (...args) {
    if (res.statusCode !== 429 || pending) return end.apply(res, args);
    pending = countUsage("ratehits", 1).then(() => end.apply(res, args));
    return res;
  };
  try {
    await coreHandler(req, res);
  } finally {
    if (pending) await pending;
    res.end = end;
  }
}

module.exports = handler;
module.exports.WEIGHTS = WEIGHTS;
module.exports.BLOCK_NAMES = BLOCK_NAMES;
module.exports.SECURITY = { DISCLAIMER: sec.DISCLAIMER, RULE_NOTES: sec.RULE_NOTES, requestList: sec.requestList }; // Sprint 36: for the page's rule
module.exports.METHOD = METHOD;
module.exports.METHOD_NOTE = METHOD_NOTE;
module.exports.STATUS_LABELS = STATUS_LABELS;
module.exports.BAND_LABELS = BAND_LABELS;
module.exports.UA = UA;
module.exports.LINKS = LINKS;
module.exports.LIMITS = {
  // Sprint 35: the quotas for fresh checks, all doors together (the values without an override from the backend)
  quota: { perIpPerDay: QUOTA_ENV.ip, perHour: QUOTA_ENV.hour, perDay: QUOTA_ENV.day },
  browser: { freshPerIp: IP_LIMIT, requestsPerIp: REQUEST_LIMIT, windowMinutes: IP_WINDOW_MS / 60000, freshPerHostPerHour: HOST_LIMIT, mailsPerIp: MAIL_IP_LIMIT, mailsPerAddressPerDay: MAIL_ADDRESS_LIMIT },
  api: { requestsPerIp: API_REQUEST_LIMIT, windowMinutes: IP_WINDOW_MS / 60000, freshPerDay: API_DAILY_CAP },
  cacheHours: CACHE_TTL_MS / 3600000, confirmHours: CONFIRM_TTL_MS / 3600000, passMinutes: PASS_TTL_MS / 60000
};
// api/mcp.js (the tool website_check) uses the same path as GET /api/check
module.exports.assistantCheck = assistantCheck;
module.exports.publicMarkdown = publicMarkdown;
module.exports.clientIp = clientIp;
// Sprint 34: api/mcp.js and api/followup.js count through the same counters
module.exports.countUsage = countUsage;
module.exports.CONSENT_NOTE = CONSENT_NOTE; // the follow-up mail repeats the consent sentence and the withdrawal note
// For scripts/check-tool/test-check.mjs and the local dev server (not used by Vercel).
module.exports._test = {
  deps, CheckError, normaliseUrl, assertSafeUrl, isPublicIPv4, isPublicIPv6, isPublicAddress, parseIPv6, resolvePublic, safeFetch, isOptedOut,
  parseRobots, robotsAllows, analyseHtml, analysePerf, ownMeasure, ownItems, sampleAssets, readSubPages, mergePages, cacheCredit, verdictOf, modelInput, runPageSpeed, runRanking, tempoBlock, findBlock, contactBlock, trustBlock, blockScore, overallScore,
  offerFor, countsOf, openChecks, securityBlock, mailBlock, runSecurity, securityIo, plainGet, sec, pointsLabel, deterministicSummary, validateSummary, allowedNumbers, buildSummary, runCheck, publicView, fullView, publicMarkdown, reportMail, confirmMail, cacheKey, cacheGet, baseDomain,
  signConfirm, readConfirm, mailKeys, makePass, passValid, foreignOrigin,
  countUsage, storedReport, cardData, DAILY_KINDS, DAY_COUNTER_TTL_S, countOffUntil,
  cache, buckets, daily, usedTokens, DAILY_CAP: QUOTA_ENV.day, API_DAILY_CAP, MAX_BYTES, UA, IP_LIMIT, CACHE_TTL_MS, CONFIRM_TTL_MS, PASS_TTL_MS, REPORT_VERSION, CHECK_ORDER, CHECK_MODEL, CHECK_MAX_TOKENS, SUMMARY_SYSTEM,
  defaultTransport,
  // Sprint 35
  QUOTA_ENV, QUOTA_RANGE, MAIL_DAILY_CAP, LOOKUP_DAILY_CAP, RETENTION_DAYS, quotaNow, quotaTake, quotaMem, quotaState, logRun, berlinClock, berlinDayStartMs, berlinDayPlus, secondsToBerlinMidnight, secondsToNextHour, msgOf,
  reset() { cache.clear(); buckets.clear(); usedTokens.clear(); countOffUntil.clear(); daily.day = ""; for (const k of DAILY_KINDS) daily[k] = 0; persistOffUntil = 0; quotaMem.day = ""; quotaMem.ips.clear(); quotaMem.hour = -1; quotaMem.hourCount = 0; quotaState.at = -Infinity; quotaState.override = null; quotaState.readable = false; quotaTakeOffUntil = 0; runLogOffUntil = 0; }
};
