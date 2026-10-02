// /api/check — the Website-Check behind /website-check (Sprint 27, docs/seo/AI_OFFERS_PLAN.md §6.2).
//
// POST { url, trade?, town?, lang? }            -> the report as JSON (about a minute: PageSpeed is the slow part)
// POST { url, email, consent?, lang? }          -> sends the full report to that address (Brevo, api/_notify.js),
//                                                  stores a lead (api/lead.js path, service "Website-Check")
//
// What it does, block by block. A block that cannot be checked is reported as "nicht prüfbar" and gets no
// score; nothing is ever guessed.
//   1. Safety: public http/https hosts only. The host is resolved first and every address must be public
//      (no private, loopback, link-local, CGNAT, metadata, multicast or documentation ranges, IPv4 and IPv6);
//      the connection is pinned to the checked address; non-standard ports and credentials are refused; every
//      redirect (max 3) is checked again; 1.5 MB response cap; 8 s per request; own User-Agent.
//   2. Tempo & Technik: PageSpeed Insights API v5, mobile, Lighthouse lab values only (four category scores,
//      LCP, CLS, TBT). PAGESPEED_API_KEY is optional; without it the keyless quota applies.
//   3. Auffindbarkeit: title, description, H1, canonical, noindex, lang, viewport, structured data, sitemap,
//      robots.txt, llms.txt; optional ranking lookup (DATAFORSEO_AUTH_B64 + trade + town; one call per check).
//   4. Anfrage-Tauglichkeit: tel:, mailto:, form or booking, WhatsApp, opening hours, map link, call to action.
//   5. Vertrauen & Recht (Hinweise, keine Rechtsberatung): HTTPS, Impressum, Datenschutz, third-party hosts in
//      the HTML (listed, not judged), accessibility statement.
//   6. Scores: WEIGHTS below is the whole rule; the page prints it ("So bewerten wir").
//   7. Kurzfazit: five sentences + three fixes. Written by the EU-routed model path of api/chat.js from the
//      findings only (no page text, no e-mail address reaches the model); every number is validated against the
//      report, otherwise (or without a model, or over the daily cost ceiling) a deterministic text is used.
//   8. Limits: 5 fresh checks per 10 minutes per IP, 24 h cache per URL, CHECK_DAILY_CAP fresh checks per day
//      (default 200); optional shared cache/counters in Supabase (docs/sql/check_cache.sql). All in memory per
//      instance otherwise; everything degrades to a plain message.
//
// Privacy: logs carry the host name, durations and status codes only — never an e-mail address or an IP.
// No npm dependencies. Tests: scripts/check-tool/test-check.mjs (stubbed network, nothing leaves the machine).

const dnsPromises = require("dns").promises;
const http = require("http");
const https = require("https");
const zlib = require("zlib");
const crypto = require("crypto");

const UA = "RexityWebsiteCheck/1.0 (+https://www.rexity.ai/website-check)";
const ROBOTS_TOKEN = "rexitywebsitecheck";
const MAX_BYTES = 1500000; // 1.5 MB, compressed and decompressed
const SMALL_BYTES = 300000; // robots.txt, sitemap.xml, llms.txt
const FETCH_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;
const PSI_TIMEOUT_MS = 50000;
const SERP_TIMEOUT_MS = 15000;
const SUMMARY_TIMEOUT_MS = 12000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 300;
const IP_LIMIT = 5;
const IP_WINDOW_MS = 10 * 60 * 1000;
const REQUEST_LIMIT = 40; // every request (cached ones too) per IP and window
const HOST_LIMIT = 6; // fresh checks per host and hour
const HOST_WINDOW_MS = 60 * 60 * 1000;
const MAIL_IP_LIMIT = 3; // report mails per IP and window
const MAIL_ADDRESS_LIMIT = 2; // report mails per address and day
const MAX_BODY = 4000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DAILY_CAP = (() => {
  const v = parseInt(String(process.env.CHECK_DAILY_CAP || "").trim(), 10);
  return Number.isFinite(v) && v >= 0 ? v : 200;
})();

// ---- Injectable network (tests replace these; nothing else in this file touches the network) -----------
const deps = {
  lookup: (host) => dnsPromises.lookup(host, { all: true, verbatim: true }),
  transport: defaultTransport,
  fetch: (...a) => fetch(...a),
  now: () => Date.now(),
  summarise: null, // tests may replace the model call; default: api/chat.js completeText (loaded lazily)
  notify: null, // default: api/_notify.js (loaded lazily)
  insertLead: null // default: api/lead.js insertLead (loaded lazily)
};

// ---- The score rule (exported; the page prints it) ------------------------------------------------
// Block score = points reached / points possible × 100 over the checks that could be carried out.
// Overall = weighted mean of the blocks that have a score. "info" checks are shown, never scored.
const WEIGHTS = {
  blocks: { tempo: 30, find: 25, contact: 30, trust: 15 },
  tempo: { performance: 50, accessibility: 20, bestPractices: 15, seo: 15 },
  find: { title: 15, description: 15, h1: 10, canonical: 10, indexable: 15, lang: 5, viewport: 10, schema: 10, sitemap: 7, robots: 3 },
  contact: { phone: 25, form: 25, email: 10, whatsapp: 10, hours: 10, map: 10, cta: 10 },
  trust: { https: 40, impressum: 25, datenschutz: 25, a11y: 10 },
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

// One GET with the connection pinned to `address`. -> { status, headers, body: Buffer, truncated }
function defaultTransport(u, opt) {
  return new Promise((resolve, reject) => {
    const mod = u.protocol === "https:" ? https : http;
    let done = false;
    const finish = (fn, v) => { if (!done) { done = true; clearTimeout(timer); fn(v); } };
    const req = mod.request({
      protocol: u.protocol,
      hostname: u.hostname,
      port: opt.port || (u.protocol === "https:" ? 443 : 80), // opt.port: tests only (safeFetch never sets it)
      path: (u.pathname || "/") + (u.search || ""),
      method: "GET",
      servername: u.hostname,
      headers: { "User-Agent": UA, Accept: opt.accept || "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5", "Accept-Encoding": "gzip, deflate, br", "Accept-Language": "de,en;q=0.7" },
      lookup: (_h, options, cb) => {
        if (options && options.all) cb(null, [{ address: opt.address, family: opt.family }]);
        else cb(null, opt.address, opt.family);
      }
    }, (res) => {
      const enc = String(res.headers["content-encoding"] || "").toLowerCase();
      let stream = res;
      if (enc === "gzip" || enc === "x-gzip") stream = res.pipe(zlib.createGunzip());
      else if (enc === "deflate") stream = res.pipe(zlib.createInflate());
      else if (enc === "br") stream = res.pipe(zlib.createBrotliDecompress());
      const chunks = [];
      let size = 0;
      let truncated = false;
      const end = () => finish(resolve, { status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks), truncated });
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
async function safeFetch(startUrl, { maxBytes = MAX_BYTES, timeoutMs = FETCH_TIMEOUT_MS, accept } = {}) {
  let u = startUrl instanceof URL ? new URL(startUrl.href) : new URL(String(startUrl));
  const chain = [];
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    assertSafeUrl(u);
    const addr = await resolvePublic(u.hostname);
    const res = await deps.transport(u, { address: addr.address, family: addr.family, maxBytes, timeoutMs, accept });
    const status = res.status;
    const headers = lowerKeys(res.headers);
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
    return { status, headers, body, truncated, finalUrl: u, redirects: chain };
  }
  throw new CheckError("too_many_redirects");
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
  const bookingLink = anchors.some((a) => BOOKING_HOST_RE.test(a.href) || (BOOKING_WORD_RE.test(a.text) && a.href && !/^(mailto|tel):/i.test(a.href)));
  const bookingWidget = iframes.some((f) => BOOKING_HOST_RE.test(f.src || "")) || tags(markup, "script").map(attrs).some((s) => BOOKING_HOST_RE.test(s.src || ""));
  const booking = bookingLink || bookingWidget;

  const bodyText = textOf(body);
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

  return {
    title, titleLength: [...title].length, description, descriptionLength: [...description].length, h1Count,
    canonical, canonicalSelf: canonical ? stripSlash(canonical) === stripSlash(page.href) : null,
    noindex: /\bnoindex\b|\bnone\b/.test(robotsMeta), lang: (htmlTag.lang || "").trim(), viewport: /width\s*=\s*device-width/i.test(viewport),
    schemaTypes, schemaBusiness: schemaTypes.some((t) => BUSINESS_TYPE_RE.test(t)),
    phone, email, whatsapp, form, booking, hours, map, cta, ctaLabel: ctaHit ? (ctaHit.text || "").slice(0, 40) : "",
    impressum, datenschutz, a11y, thirdParty, headOk: headEnd >= 0
  };
}
function stripSlash(u) { return String(u).replace(/#.*$/, "").replace(/\/+$/, ""); }
function safePath(href) { try { return decodeURIComponent(String(href || "").replace(/^https?:\/\/[^/]+/i, "")); } catch (_e) { return String(href || ""); } }

// ---- 2. PageSpeed Insights (Lighthouse lab data only) ---------------------------------------------
async function runPageSpeed(url) {
  const key = String(process.env.PAGESPEED_API_KEY || "").trim();
  const q = new URLSearchParams();
  q.set("url", url);
  q.set("strategy", "mobile");
  for (const c of ["performance", "accessibility", "best-practices", "seo"]) q.append("category", c);
  if (key) q.set("key", key);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PSI_TIMEOUT_MS);
  try {
    const resp = await deps.fetch("https://www.googleapis.com/pagespeedonline/v5/runPagespeed?" + q.toString(), { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!resp.ok) {
      await resp.text().catch(() => "");
      return { ok: false, reason: resp.status === 429 ? "quota" : "http_" + resp.status };
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
// status: ok | partial | fail | info | unknown. max 0 = shown, not scored.
function mk(id, max, share, label, detail, fix) {
  const unknown = share === null;
  const points = unknown ? 0 : Math.round(max * share * 10) / 10;
  const status = unknown ? "unknown" : max === 0 ? "info" : share >= 1 ? "ok" : share > 0 ? "partial" : "fail";
  return { id, max, points, status, label, detail, fix: !unknown && max > 0 && share < 1 ? fix || null : null };
}
function blockScore(items) {
  const scored = items.filter((i) => i.max > 0 && i.status !== "unknown");
  const possible = scored.reduce((s, i) => s + i.max, 0);
  if (!possible) return null;
  return Math.round((scored.reduce((s, i) => s + i.points, 0) / possible) * 100);
}
const fmtSec = (ms, lang) => { const v = (Math.round(ms / 100) / 10).toFixed(1); return lang === "de" ? v.replace(".", ",") : v; };
const fmtCls = (v, lang) => { const s = (Math.round(v * 100) / 100).toFixed(2); return lang === "de" ? s.replace(".", ",") : s; };

function tempoBlock(psi) {
  const W = WEIGHTS.tempo;
  if (!psi || !psi.ok) {
    const r = (psi && psi.reason) || "network";
    return {
      id: "tempo", checked: false, score: null, items: [], metrics: null,
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
  const metrics = {};
  if (psi.lcpMs !== null) metrics.lcp = { ms: Math.round(psi.lcpMs), de: `${fmtSec(psi.lcpMs, "de")} s`, en: `${fmtSec(psi.lcpMs, "en")} s` };
  if (psi.cls !== null) metrics.cls = { value: Math.round(psi.cls * 100) / 100, de: fmtCls(psi.cls, "de"), en: fmtCls(psi.cls, "en") };
  if (psi.tbtMs !== null) metrics.tbt = { ms: Math.round(psi.tbtMs), de: `${Math.round(psi.tbtMs)} ms`, en: `${Math.round(psi.tbtMs)} ms` };
  return { id: "tempo", checked: true, score: blockScore(items), items, metrics, lighthouseVersion: psi.lighthouseVersion || "" };
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

function contactBlock(h) {
  const W = WEIGHTS.contact;
  const yes = T("gefunden", "found");
  const no = T("nicht gefunden", "not found");
  const items = [
    mk("phone", W.phone, h.phone ? 1 : 0, T("Telefonnummer zum Antippen", "Phone number you can tap"), h.phone ? yes : no,
      T("Die Telefonnummer als anklickbaren Link setzen (tel:), damit Besucher auf dem Handy mit einem Tipp anrufen.", "Make the phone number a clickable link (tel:) so that visitors on a phone can call with one tap.")),
    mk("form", W.form, h.form || h.booking ? 1 : 0, T("Kontaktformular oder Terminbuchung", "Contact form or booking"),
      h.form && h.booking ? T("Formular und Buchung gefunden", "form and booking found") : h.form ? T("Formular gefunden", "form found") : h.booking ? T("Buchung gefunden", "booking found") : T("auf dieser Seite nicht gefunden", "not found on this page"),
      T("Ein kurzes Anfrageformular oder eine Terminbuchung auf der Startseite anbieten oder gut sichtbar verlinken.", "Offer a short enquiry form or appointment booking on the home page, or link it clearly.")),
    mk("email", W.email, h.email ? 1 : 0, T("E-Mail-Adresse zum Anklicken", "Clickable e-mail address"), h.email ? yes : no,
      T("Die E-Mail-Adresse als anklickbaren Link setzen (mailto:).", "Make the e-mail address a clickable link (mailto:).")),
    mk("whatsapp", W.whatsapp, h.whatsapp ? 1 : 0, T("WhatsApp-Link", "WhatsApp link"), h.whatsapp ? yes : no,
      T("Einen WhatsApp-Link anbieten, wenn Sie Anfragen darüber annehmen.", "Offer a WhatsApp link if you take enquiries that way.")),
    mk("hours", W.hours, h.hours ? 1 : 0, T("Öffnungs- oder Sprechzeiten", "Opening or office hours"), h.hours ? yes : T("auf dieser Seite nicht gefunden", "not found on this page"),
      T("Öffnungs- oder Sprechzeiten auf der Startseite nennen.", "State your opening or office hours on the home page.")),
    mk("map", W.map, h.map ? 1 : 0, T("Karte oder Link zum Google-Unternehmensprofil", "Map or link to the Google Business Profile"), h.map ? yes : no,
      T("Eine Karte oder den Link zu Ihrem Google-Unternehmensprofil einbinden, damit Besucher den Weg finden.", "Add a map or the link to your Google Business Profile so that visitors find their way.")),
    mk("cta", W.cta, h.cta ? 1 : 0, T("Handlungsaufforderung im ersten Bildschirm (Hinweis, automatisch erkannt)", "Call to action in the first screen (indication, detected automatically)"),
      h.cta ? T(h.ctaLabel ? `gefunden: „${h.ctaLabel}“` : "gefunden", h.ctaLabel ? `found: “${h.ctaLabel}”` : "found") : T("am Seitenanfang keine erkannt", "none detected at the top of the page"),
      T("Am Seitenanfang eine klare Schaltfläche anbieten, zum Beispiel „Termin anfragen“ oder „Jetzt anrufen“.", "Offer a clear button at the top of the page, for example “Request an appointment” or “Call now”."))
  ];
  return { id: "contact", checked: true, score: blockScore(items), items };
}

function trustBlock(h, finalUrl) {
  const W = WEIGHTS.trust;
  const isHttps = new URL(finalUrl).protocol === "https:";
  const n = h.thirdParty.length;
  const items = [
    mk("https", W.https, isHttps ? 1 : 0, T("Verschlüsselte Verbindung (HTTPS)", "Encrypted connection (HTTPS)"), isHttps ? T("ja", "yes") : T("nein", "no"),
      T("Die Website auf HTTPS umstellen: Ohne Verschlüsselung warnen Browser vor der Seite.", "Move the website to HTTPS: without encryption, browsers warn visitors about the page.")),
    mk("impressum", W.impressum, h.impressum ? 1 : 0, T("Link zum Impressum", "Link to the legal notice (Impressum)"), h.impressum ? T("gefunden", "found") : T("nicht gefunden", "not found"),
      T("Das Impressum von der Startseite aus verlinken (Hinweis, keine Rechtsberatung).", "Link the legal notice (Impressum) from the home page (an indication, not legal advice).")),
    mk("datenschutz", W.datenschutz, h.datenschutz ? 1 : 0, T("Link zur Datenschutzerklärung", "Link to the privacy policy"), h.datenschutz ? T("gefunden", "found") : T("nicht gefunden", "not found"),
      T("Die Datenschutzerklärung von der Startseite aus verlinken (Hinweis, keine Rechtsberatung).", "Link the privacy policy from the home page (an indication, not legal advice).")),
    mk("a11y", W.a11y, h.a11y ? 1 : 0, T("Link zu einer Erklärung zur Barrierefreiheit", "Link to an accessibility statement"), h.a11y ? T("gefunden", "found") : T("nicht gefunden", "not found"),
      T("Prüfen, ob für Ihre Website eine Erklärung zur Barrierefreiheit nötig ist, und sie dann verlinken (Hinweis, keine Rechtsberatung).", "Check whether your website needs an accessibility statement and, if so, link it (an indication, not legal advice).")),
    mk("thirdparty", 0, 1, T("Fremde Dienste, die schon beim Aufruf geladen werden", "Third-party services loaded as soon as the page opens"),
      n ? T(`${n} fremde Adresse${n === 1 ? "" : "n"} im Quelltext: ` + h.thirdParty.slice(0, 12).map((t) => t.host + (t.label ? ` (${t.label})` : "")).join(", ") + (n > 12 ? " …" : "") + ". Ob dafür eine Einwilligung nötig ist, bewerten wir nicht.",
        `${n} third-party address${n === 1 ? "" : "es"} in the source: ` + h.thirdParty.slice(0, 12).map((t) => t.host + (t.label ? ` (${t.label})` : "")).join(", ") + (n > 12 ? " …" : "") + ". We do not judge whether consent is required for them.")
        : T("keine im Quelltext der Seite gefunden", "none found in the page source"), null)
  ];
  return { id: "trust", checked: true, score: blockScore(items), items, thirdParty: h.thirdParty };
}

const uncheckedBlock = (id, reason) => ({ id, checked: false, score: null, items: [], reason });

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

// Fix candidates in order of the points they would bring to the overall score.
function rankFixes(blocks) {
  const out = [];
  for (const [id, w] of Object.entries(WEIGHTS.blocks)) {
    const b = blocks[id];
    if (!b || !b.checked) continue;
    const possible = b.items.filter((i) => i.max > 0 && i.status !== "unknown").reduce((s, i) => s + i.max, 0) || 1;
    for (const it of b.items) {
      if (!it.fix) continue;
      out.push({ id: `${id}.${it.id}`, block: id, gain: Math.round((((it.max - it.points) / possible) * w) * 10) / 10, text: it.fix });
    }
  }
  return out.sort((a, b) => b.gain - a.gain);
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
  trust: T("Vertrauen & Recht", "Trust & legal")
};
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
    if (worst !== best) s.push(de ? `Am meisten zu holen ist im Bereich ${BLOCK_NAMES[worst].de} mit ${report.blocks[worst].score} Punkten.` : `There is most to gain in ${BLOCK_NAMES[worst].en} with ${report.blocks[worst].score} points.`);
    else s.push(de ? "Geprüft werden konnte heute nur dieser eine Bereich." : "Only this one area could be checked today.");
  } else {
    s.push(de ? "Die Seite war für die Prüfung nicht erreichbar oder hat keine auswertbare Antwort geliefert." : "The page could not be reached for the check or returned nothing that could be evaluated.");
    s.push(de ? "Versuchen Sie es später noch einmal oder prüfen Sie die eingegebene Adresse." : "Please try again later or check the address you entered.");
  }
  const t = report.blocks.tempo;
  if (t && t.checked && t.metrics && t.metrics.lcp) s.push(de ? `Auf dem Handy erscheint der größte sichtbare Inhalt nach ${t.metrics.lcp.de.replace(" s", "")} Sekunden (Laborwert von Lighthouse).` : `On a phone the largest visible content appears after ${t.metrics.lcp.en.replace(" s", "")} seconds (Lighthouse lab value).`);
  else if (t && !t.checked) s.push(de ? "Das Tempo ließ sich heute nicht messen und fließt deshalb nicht in den Gesamtwert ein." : "Speed could not be measured today and is therefore not part of the overall value.");
  else s.push(de ? "Die Tempo-Werte stammen aus einer Labormessung mit Lighthouse auf einem simulierten Handy." : "The speed values come from a Lighthouse lab measurement on a simulated phone.");
  const fixes = rankFixes(report.blocks).slice(0, 3);
  if (fixes.length) s.push((de ? "Der wichtigste nächste Schritt: " : "The most important next step: ") + fixes[0].text[L]);
  else s.push(de ? "In den geprüften Punkten haben wir nichts gefunden, das Sie dringend ändern müssten." : "In the points we checked we found nothing that you urgently need to change.");
  return { lang: L, source: "rules", sentences: s.slice(0, 5), fixes: fixes.map((f) => f.id) };
}

// Every number a summary may state: the scores, metrics, counts and lengths of this report (plus 100).
function allowedNumbers(report) {
  const set = new Set(["100"]);
  const add = (v) => {
    if (v === null || v === undefined || v === "") return;
    for (const m of String(v).matchAll(/\d+(?:[.,]\d+)?/g)) set.add(m[0].replace(",", "."));
  };
  add(report.overall.score);
  for (const b of Object.values(report.blocks)) {
    if (!b) continue;
    add(b.score);
    for (const it of b.items || []) { add(it.points); add(it.max); add(it.detail && it.detail.de); add(it.detail && it.detail.en); }
    if (b.metrics) for (const m of Object.values(b.metrics)) { add(m.de); add(m.en); add(m.ms); add(m.value); }
    if (b.ranking) { add(b.ranking.position); add(b.ranking.depth); }
    if (b.thirdParty) add(b.thirdParty.length);
  }
  return set;
}
const SUMMARY_BANNED = /(garantier|guarantee|von\s+google\s+gepr|google[- ]zertifiziert|certified\s+by\s+google|rechtssicher|abmahn|dsgvo-konform|gdpr[- ]compliant|illegal|rechtswidrig|verstoß|verstoss|https?:\/\/|www\.)/i;
function validateSummary(obj, report, candidates) {
  if (!obj || !Array.isArray(obj.sentences) || obj.sentences.length !== 5) return "shape";
  const allowed = allowedNumbers(report);
  const hostDigits = new Set((report.host.match(/\d+/g) || []));
  for (const raw of obj.sentences) {
    if (typeof raw !== "string") return "shape";
    const sent = raw.trim();
    if (sent.length < 15 || sent.length > 320) return "length";
    if (SUMMARY_BANNED.test(sent.split(report.host).join(""))) return "banned";
    for (const m of sent.split(report.host).join(" ").matchAll(/\d+(?:[.,]\d+)?/g)) {
      const n = m[0].replace(",", ".");
      if (!allowed.has(n) && !hostDigits.has(m[0])) return "number:" + m[0];
    }
  }
  if (!Array.isArray(obj.fixes)) return "fixes";
  const ids = new Set(candidates.map((c) => c.id));
  const picked = [...new Set(obj.fixes.filter((x) => typeof x === "string" && ids.has(x)))];
  if (picked.length !== Math.min(3, candidates.length)) return "fixes";
  return null;
}
function modelInput(report, lang, candidates) {
  const L = lang === "en" ? "en" : "de";
  const blocks = {};
  for (const [id, b] of Object.entries(report.blocks)) {
    blocks[id] = b.checked
      ? { name: BLOCK_NAMES[id][L], score: b.score, checks: b.items.filter((i) => i.id !== "thirdparty").map((i) => ({ check: i.label[L], result: i.status, detail: i.id === "schema" || i.id === "cta" || i.id === "lang" ? undefined : i.detail[L] })), metrics: b.metrics ? Object.fromEntries(Object.entries(b.metrics).map(([k, v]) => [k, v[L]])) : undefined, thirdPartyHosts: b.thirdParty ? b.thirdParty.length : undefined }
      : { name: BLOCK_NAMES[id][L], notCheckable: true };
  }
  return { site: report.host, overall: report.overall.score, blocks, fixCandidates: candidates.slice(0, 8).map((c) => ({ id: c.id, text: c.text[L] })) };
}
const SUMMARY_SYSTEM = {
  de: "Du schreibst das Kurzfazit eines automatischen Website-Checks für die Inhaberin oder den Inhaber eines kleinen Betriebs. Schreibe genau fünf kurze, einfache Sätze auf Deutsch, in der Sie-Form, ohne Fachjargon. Nenne nur Zahlen, die im JSON stehen, und erfinde keine Befunde. Ein Bereich mit notCheckable wurde nicht geprüft: Sage das, rate nichts. Keine Rechtsberatung, keine Versprechen, keine Aussagen über Rechtsverstöße, keine Internetadressen, kein Eigenlob, keine Anrede und kein Gruß. Wähle aus fixCandidates die drei nützlichsten Schritte (nur deren id). Antworte ausschließlich mit JSON in dieser Form: {\"sentences\":[\"…\",\"…\",\"…\",\"…\",\"…\"],\"fixes\":[\"id\",\"id\",\"id\"]}",
  en: "You write the short verdict of an automatic website check for the owner of a small business. Write exactly five short, plain sentences in English, polite, no jargon. State only numbers that appear in the JSON and do not invent findings. An area marked notCheckable was not checked: say so, do not guess. No legal advice, no promises, no statements about legal violations, no web addresses, no self-praise, no greeting. Choose the three most useful steps from fixCandidates (their id only). Answer with JSON only, in this form: {\"sentences\":[\"…\",\"…\",\"…\",\"…\",\"…\"],\"fixes\":[\"id\",\"id\",\"id\"]}"
};
async function buildSummary(report, lang) {
  const L = lang === "en" ? "en" : "de";
  const fallback = deterministicSummary(report, L);
  const candidates = rankFixes(report.blocks);
  if (report.overall.score === null) return fallback;
  let summarise = deps.summarise;
  if (!summarise) {
    try { summarise = require("./chat").completeText; } catch (e) { console.error("[check] model path unavailable:", e && e.message); }
  }
  if (typeof summarise !== "function") return fallback;
  try {
    const out = await summarise({ system: SUMMARY_SYSTEM[L], user: JSON.stringify(modelInput(report, L, candidates)), timeoutMs: SUMMARY_TIMEOUT_MS, tag: "check" });
    if (!out || !out.text) return fallback; // no model configured, or the daily cost ceiling is reached
    const m = /\{[\s\S]*\}/.exec(out.text);
    const obj = m ? JSON.parse(m[0]) : null;
    const problem = validateSummary(obj, report, candidates);
    if (problem) {
      console.error("[check] summary rejected (" + problem.split(":")[0] + "): deterministic text used");
      return fallback;
    }
    const ids = new Set(candidates.map((c) => c.id));
    return { lang: L, source: "model", sentences: obj.sentences.map((x) => x.trim()), fixes: [...new Set(obj.fixes.filter((x) => ids.has(x)))].slice(0, 3) };
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
const daily = { day: "", checks: 0, lookups: 0, mails: 0 };
function today() {
  const d = berlinDay(deps.now());
  if (daily.day !== d) { daily.day = d; daily.checks = 0; daily.lookups = 0; daily.mails = 0; }
  return daily;
}

const cache = new Map(); // key -> { at, report }
const cacheKey = (u) => (u.hostname.replace(/^www\./, "") + (u.pathname.replace(/\/+$/, "") || "/") + (u.search || "")).toLowerCase();
function cacheGet(key) {
  const e = cache.get(key);
  if (!e) return null;
  if (deps.now() - e.at > CACHE_TTL_MS) { cache.delete(key); return null; }
  return e.report;
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
async function rpc(name, args) {
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
    if (!resp.ok) { await resp.text().catch(() => ""); persistOff("HTTP " + resp.status); return null; }
    return await resp.json();
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
  return report && report.checkedAt && report.blocks ? report : null;
}
async function sharedSet(key, report) {
  await rpc("check_cache_put", { p_key: keyHash(key), p_report: report, p_ttl_seconds: Math.round(CACHE_TTL_MS / 1000) });
}
// -> the day's count after adding n (memory, or the shared counter when it answers)
async function bumpDaily(kind, n) {
  const d = today();
  d[kind] += n;
  const data = await rpc("check_usage_bump", { p_key: `${kind}:${d.day}`, p_count: n, p_ttl_seconds: 3 * 86400 });
  const row = Array.isArray(data) ? data[0] : data;
  const shared = row && typeof row === "object" ? Number(row.count) : typeof row === "number" ? row : NaN;
  return Number.isFinite(shared) ? Math.max(shared, d[kind]) : d[kind];
}

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

  // PageSpeed (slow) in parallel with the small files and the optional ranking lookup
  const tPsi = deps.now();
  const psiP = runPageSpeed(entered.href).then((r) => { timing.psi = deps.now() - tPsi; return r; });
  const sideP = (async () => {
    if (!htmlOk) return null;
    const origin = finalUrl.origin;
    const rb = await fetchSide(origin, "/robots.txt", null, "text/plain,*/*;q=0.5");
    let robots = null;
    if (rb.state === "ok") {
      const txt = decodeBody(rb.res.body, rb.res.headers);
      if (looksLikeHtml(txt)) rb.state = "missing"; // a "soft 404" page instead of a robots.txt
      else robots = parseRobots(txt);
    }
    const [sm, ll] = await Promise.all([
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
      })()
    ]);
    return { robots: { state: rb.state }, sitemap: { state: sm.state }, llms: { state: ll.state } };
  })();
  const rankP = (async () => {
    if (!htmlOk || !input.trade || !input.town) return null;
    if (!String(process.env.DATAFORSEO_AUTH_B64 || "").trim()) return null;
    if (today().lookups >= DAILY_CAP) return null;
    today().lookups++;
    return runRanking(host, input.trade, input.town);
  })();
  const [psi, side, ranking] = await Promise.all([psiP, sideP, rankP]);

  const blocks = { tempo: tempoBlock(psi) };
  if (htmlOk) {
    const h = analyseHtml(html, finalUrl.href, page.headers);
    blocks.find = findBlock(h, { ...side, ranking });
    blocks.contact = contactBlock(h);
    blocks.trust = trustBlock(h, finalUrl.href);
  } else {
    const why = pageError === "timeout"
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
  const report = {
    v: 1,
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
  console.log(`[check] host=${host} ms=${report.durationMs} fetch=${timing.fetch || 0} psi=${timing.psi || 0} psi_ok=${Boolean(psi && psi.ok)}${psi && !psi.ok ? " psi_reason=" + psi.reason : ""} html=${htmlOk} ranking=${ranking ? (ranking.checked ? "ok" : "failed") : "off"} overall=${report.overall.score}`);
  return report;
}

// What the page gets: one language, the first fix only (the full list goes out by e-mail).
function publicView(report, lang, cached) {
  const L = lang === "en" ? "en" : "de";
  const sum = report.summaries[L];
  const cand = rankFixes(report.blocks);
  const byId = Object.fromEntries(cand.map((c) => [c.id, c]));
  const fixIds = (sum && sum.fixes && sum.fixes.length ? sum.fixes : cand.slice(0, 3).map((c) => c.id)).filter((id) => byId[id]);
  const blocks = {};
  for (const [id, b] of Object.entries(report.blocks)) {
    blocks[id] = {
      name: BLOCK_NAMES[id][L], checked: b.checked, score: b.score, weight: WEIGHTS.blocks[id],
      reason: b.reason ? b.reason[L] : undefined,
      items: (b.items || []).map((i) => ({ id: i.id, label: i.label[L], status: i.status, detail: i.detail[L], max: i.max, points: i.points })),
      metrics: b.metrics ? Object.fromEntries(Object.entries(b.metrics).map(([k, v]) => [k, v[L]])) : undefined,
      ranking: b.ranking ? { query: b.ranking.query, checked: b.ranking.checked, position: b.ranking.position === undefined ? null : b.ranking.position } : undefined
    };
  }
  return {
    ok: true, lang: L, url: report.url, finalUrl: report.finalUrl, host: report.host, checkedAt: report.checkedAt, cached: Boolean(cached),
    truncated: report.truncated, overall: report.overall, blocks,
    summary: sum ? { sentences: sum.sentences, source: sum.source } : null,
    firstFix: fixIds.length ? byId[fixIds[0]].text[L] : null,
    moreFixes: Math.max(0, fixIds.length - 1),
    offer: report.offer
  };
}

// ---- 9. Report by e-mail --------------------------------------------------------------------------------
const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const MARK = { ok: "✓", partial: "~", fail: "✗", info: "i", unknown: "?" };
function reportMail(report, lang) {
  const L = lang === "en" ? "en" : "de";
  const de = L === "de";
  const view = publicView(report, L, false);
  const sum = report.summaries[L] || deterministicSummary(report, L);
  const cand = Object.fromEntries(rankFixes(report.blocks).map((c) => [c.id, c]));
  const fixes = sum.fixes.map((id) => cand[id]).filter(Boolean).map((c) => c.text[L]);
  const date = new Intl.DateTimeFormat(de ? "de-DE" : "en-GB", { timeZone: "Europe/Berlin", dateStyle: "long", timeStyle: "short" }).format(new Date(report.checkedAt));
  const head = de ? `Website-Check für ${report.host}` : `Website check for ${report.host}`;
  const overall = view.overall.score === null ? (de ? "Gesamt: nicht prüfbar" : "Overall: could not be checked") : (de ? `Gesamt: ${view.overall.score} von 100 Punkten` : `Overall: ${view.overall.score} out of 100 points`);
  const text = [head, de ? `Geprüfte Adresse: ${report.finalUrl}` : `Address checked: ${report.finalUrl}`, de ? `Geprüft am ${date} Uhr` : `Checked on ${date}`, "", overall, ""];
  let html = `<div style="font-family:sans-serif;font-size:14px;line-height:1.5;color:#111"><h1 style="font-size:20px;margin:0 0 4px">${esc(head)}</h1>` +
    `<p style="margin:0 0 12px;color:#555">${esc(de ? "Geprüfte Adresse" : "Address checked")}: ${esc(report.finalUrl)}<br>${esc(de ? `Geprüft am ${date} Uhr` : `Checked on ${date}`)}</p>` +
    `<p style="font-size:16px"><strong>${esc(overall)}</strong></p>`;
  text.push(de ? "Kurzfazit" : "Short verdict");
  html += `<h2 style="font-size:16px;margin:16px 0 4px">${de ? "Kurzfazit" : "Short verdict"}</h2><p>${sum.sentences.map(esc).join(" ")}</p>`;
  text.push(sum.sentences.join(" "), "");
  if (sum.source === "model") {
    const n = de ? "Das Kurzfazit wurde von einer KI aus den Messwerten dieses Berichts formuliert." : "The short verdict was worded by an AI from the measurements in this report.";
    text.push(n, "");
    html += `<p style="font-size:12px;color:#555">${esc(n)}</p>`;
  }
  if (fixes.length) {
    const h = de ? "Die drei nützlichsten Schritte" : "The three most useful steps";
    text.push(h, ...fixes.map((f, i) => `${i + 1}. ${f}`), "");
    html += `<h2 style="font-size:16px;margin:16px 0 4px">${esc(h)}</h2><ol>${fixes.map((f) => `<li>${esc(f)}</li>`).join("")}</ol>`;
  }
  for (const id of Object.keys(WEIGHTS.blocks)) {
    const b = view.blocks[id];
    const title = b.name + (id === "trust" ? (de ? " (Hinweise, keine Rechtsberatung)" : " (indications, not legal advice)") : "") + ": " + (b.score === null ? (de ? "nicht prüfbar" : "could not be checked") : (de ? `${b.score} von 100` : `${b.score} out of 100`));
    text.push(title);
    html += `<h2 style="font-size:16px;margin:16px 0 4px">${esc(title)}</h2>`;
    if (!b.checked) { text.push("  " + (b.reason || ""), ""); html += `<p>${esc(b.reason || "")}</p>`; continue; }
    html += '<table cellpadding="4" style="border-collapse:collapse;font-size:14px">';
    for (const i of b.items) {
      text.push(`  [${MARK[i.status]}] ${i.label}: ${i.detail}`);
      html += `<tr><td style="vertical-align:top">${MARK[i.status]}</td><td style="vertical-align:top">${esc(i.label)}</td><td style="vertical-align:top">${esc(i.detail)}</td></tr>`;
    }
    html += "</table>";
    if (b.metrics) {
      const m = [b.metrics.lcp && `LCP ${b.metrics.lcp}`, b.metrics.cls && `CLS ${b.metrics.cls}`, b.metrics.tbt && `TBT ${b.metrics.tbt}`].filter(Boolean).join(" · ");
      if (m) { const line = (de ? "Laborwerte (Lighthouse mobil): " : "Lab values (Lighthouse mobile): ") + m; text.push("  " + line); html += `<p style="color:#555">${esc(line)}</p>`; }
    }
    if (b.ranking) {
      const r = b.ranking;
      const line = !r.checked ? (de ? `Platz bei Google für „${r.query}“: nicht prüfbar` : `Position on Google for “${r.query}”: could not be checked`)
        : r.position ? (de ? `Platz bei Google für „${r.query}“ (Deutschland): ${r.position}` : `Position on Google for “${r.query}” (Germany): ${r.position}`)
        : (de ? `Platz bei Google für „${r.query}“ (Deutschland): nicht in den ersten 20 Ergebnissen` : `Position on Google for “${r.query}” (Germany): not in the first 20 results`);
      text.push("  " + line);
      html += `<p>${esc(line)}</p>`;
    }
    text.push("");
  }
  const rule = de
    ? `So bewerten wir: Jeder Bereich erhält 0 bis 100 Punkte aus den Prüfpunkten, die sich prüfen ließen. Gesamt = Tempo & Technik ${WEIGHTS.blocks.tempo} %, Auffindbarkeit ${WEIGHTS.blocks.find} %, Anfrage-Tauglichkeit ${WEIGHTS.blocks.contact} %, Vertrauen & Recht ${WEIGHTS.blocks.trust} %. Die vollständige Regel steht auf https://www.rexity.ai/website-check. Tempo-Messung mit Google Lighthouse (PageSpeed Insights), Laborwerte auf einem simulierten Handy. Der Check ist eine automatische Momentaufnahme der eingegebenen Seite und ersetzt keine Rechtsberatung.`
    : `How we score: each area gets 0 to 100 points from the checks that could be carried out. Overall = speed & technology ${WEIGHTS.blocks.tempo}%, findability ${WEIGHTS.blocks.find}%, readiness for enquiries ${WEIGHTS.blocks.contact}%, trust & legal ${WEIGHTS.blocks.trust}%. The full rule is on https://www.rexity.ai/website-check. Speed measured with Google Lighthouse (PageSpeed Insights), lab values on a simulated phone. The check is an automatic snapshot of the page you entered and does not replace legal advice.`;
  const why = de
    ? "Sie erhalten diese E-Mail, weil diese Adresse auf rexity.ai/website-check für den Bericht eingetragen wurde. Wir nutzen sie nur für diesen Versand – außer Sie haben dort zugestimmt, dass wir Sie zu dem Ergebnis kontaktieren dürfen."
    : "You receive this e-mail because this address was entered for the report on rexity.ai/website-check. We use it only to send this report – unless you agreed there that we may contact you about the result.";
  const sig = ["Rexity Labs UG (haftungsbeschränkt)", "info@rexity.ai", "+49 174 2471435", "www.rexity.ai"];
  text.push(rule, "", why, "", ...sig);
  html += `<p style="font-size:12px;color:#555;margin-top:20px">${esc(rule)}</p><p style="font-size:12px;color:#555">${esc(why)}</p><p>${sig.map(esc).join("<br>")}</p></div>`;
  return { subject: de ? `Ihr Website-Check: ${report.host}` : `Your website check: ${report.host}`, textContent: text.join("\n"), htmlContent: html };
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
  dns: T("Diese Adresse haben wir nicht gefunden. Bitte prüfen Sie die Schreibweise.", "We could not find this address. Please check the spelling."),
  rate: T("Das waren viele Prüfungen in kurzer Zeit. Bitte versuchen Sie es in einigen Minuten erneut.", "That was a lot of checks in a short time. Please try again in a few minutes."),
  cap: T("Für heute ist die Zahl der kostenlosen Prüfungen erreicht. Bitte versuchen Sie es morgen wieder oder schreiben Sie uns an info@rexity.ai.", "Today's number of free checks has been reached. Please try again tomorrow or write to info@rexity.ai."),
  email: T("Bitte geben Sie eine gültige E-Mail-Adresse ein.", "Please enter a valid e-mail address."),
  mail_failed: T("Der Bericht konnte gerade nicht versendet werden. Bitte schreiben Sie uns an info@rexity.ai.", "The report could not be sent just now. Please write to info@rexity.ai."),
  server: T("Die Prüfung ist fehlgeschlagen. Bitte versuchen Sie es später erneut.", "The check failed. Please try again later.")
};
const fail = (res, status, code, lang, headers) => send(res, status, { ok: false, error: code, message: (MSG[code] || MSG.server)[lang === "en" ? "en" : "de"] }, headers);

// Cache first (memory, then the shared store); a fresh check counts against the per-IP, per-host and daily limits.
async function getReport(input, ip, lang) {
  const key = cacheKey(input.parsed.url);
  let report = cacheGet(key);
  let cached = Boolean(report);
  if (!report) {
    report = await sharedGet(key);
    if (report) { cached = true; cacheSet(key, report); }
  }
  if (!report) {
    if (hit("ip:" + ip, IP_LIMIT, IP_WINDOW_MS)) throw new CheckError("rate");
    if (hit("host:" + input.parsed.url.hostname, HOST_LIMIT, HOST_WINDOW_MS)) throw new CheckError("rate");
    if (today().checks >= DAILY_CAP) throw new CheckError("cap");
    if ((await bumpDaily("checks", 1)) > DAILY_CAP) throw new CheckError("cap");
    report = await runCheck(input);
    cacheSet(key, report);
  } else if (input.trade && input.town && report.blocks.find && report.blocks.find.checked && !report.blocks.find.ranking) {
    // a cached report without the ranking block: one lookup (never more than one per request)
    if (String(process.env.DATAFORSEO_AUTH_B64 || "").trim() && today().lookups < DAILY_CAP && !hit("rank:" + ip, IP_LIMIT, IP_WINDOW_MS)) {
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
  return { report, cached };
}

async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "method" }, { Allow: "POST" });
  const ip = clientIp(req);
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > MAX_BODY) return send(res, 413, { ok: false, error: "too_large" });
  }
  let data;
  try { data = JSON.parse(body || "{}"); } catch (_e) { return send(res, 400, { ok: false, error: "json" }); }
  if (!data || typeof data !== "object" || Array.isArray(data)) return send(res, 400, { ok: false, error: "json" });
  const lang = String(data.lang || "").toLowerCase().startsWith("en") ? "en" : "de";
  const wantsMail = data.email !== undefined && data.email !== null && String(data.email).trim() !== "";

  // Honeypot (as in api/lead.js): pretend success, do nothing.
  if (String(data.company_website || data._gotcha || "").trim()) return send(res, 200, wantsMail ? { ok: true, sent: true } : { ok: false, error: "server", message: MSG.server[lang] });

  if (hit("req:" + ip, REQUEST_LIMIT, IP_WINDOW_MS)) return fail(res, 429, "rate", lang, { "Retry-After": "300" });

  let parsed;
  try { parsed = normaliseUrl(data.url); } catch (e) { return fail(res, 422, e instanceof CheckError ? e.code : "bad_url", lang); }
  const input = { parsed, trade: cleanTerm(data.trade), town: cleanTerm(data.town) };

  try {
    if (wantsMail) {
      const email = String(data.email).trim().slice(0, 200);
      if (!EMAIL_RE.test(email)) return fail(res, 422, "email", lang);
      const addrKey = "mail:" + crypto.createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 24);
      if (hit("mailip:" + ip, MAIL_IP_LIMIT, IP_WINDOW_MS) || hit(addrKey, MAIL_ADDRESS_LIMIT, 24 * 60 * 60 * 1000) || today().mails >= DAILY_CAP) return fail(res, 429, "rate", lang, { "Retry-After": "600" });
      today().mails++;
      const { report } = await getReport(input, ip, lang);
      const notify = deps.notify || require("./_notify");
      const consent = data.consent === true || data.consent === "true" || data.consent === "on" || data.consent === 1;
      const mail = reportMail(report, lang);
      const sent = await notify.sendMail({ to: email, subject: mail.subject, textContent: mail.textContent, htmlContent: mail.htmlContent });
      if (!sent || !sent.sent) {
        console.log("[check] report mail sent=false reason=" + ((sent && sent.reason) || "unknown"));
        return fail(res, 502, "mail_failed", lang);
      }
      // Lead (api/lead.js path): stored for every report request; marked for contact only with the separate tick.
      const overall = report.overall.score === null ? "nicht prüfbar" : report.overall.score + "/100";
      const message = `Kontakt erlaubt: ${consent ? "ja" : "nein"}\nWebsite-Check für ${report.finalUrl}\nGesamt: ${overall}` +
        Object.keys(WEIGHTS.blocks).map((id) => `\n${BLOCK_NAMES[id].de}: ${report.blocks[id].score === null ? "nicht prüfbar" : report.blocks[id].score + "/100"}`).join("");
      try {
        const insertLead = deps.insertLead || require("./lead").insertLead;
        await insertLead({
          id: "web_" + crypto.randomUUID(), name: report.host, email, phone: null, company: null,
          service: consent ? "Website-Check (Kontakt erlaubt)" : "Website-Check", message, source: "WEBSITE", updatedAt: new Date(deps.now()).toISOString()
        });
      } catch (e) {
        console.error("[check] lead insert failed:", e && e.message ? String(e.message).slice(0, 120) : "error");
      }
      try {
        await notify.notifyLead({ kind: "website-check", name: report.host, email, message, service: consent ? "Website-Check (Kontakt erlaubt)" : "Website-Check", source: "/website-check", lang }, { confirmation: false });
      } catch (_e) { /* never affects the response */ }
      return send(res, 200, { ok: true, sent: true });
    }

    const { report, cached } = await getReport(input, ip, lang);
    return send(res, 200, publicView(report, lang, cached));
  } catch (e) {
    if (e instanceof CheckError) {
      const status = e.code === "rate" || e.code === "cap" ? 429 : 422;
      return fail(res, status, e.code, lang, status === 429 ? { "Retry-After": e.code === "cap" ? "3600" : "300" } : undefined);
    }
    console.error("[check] failed:", e && e.message ? String(e.message).slice(0, 200) : "error");
    return fail(res, 500, "server", lang);
  }
}

module.exports = handler;
module.exports.WEIGHTS = WEIGHTS;
module.exports.BLOCK_NAMES = BLOCK_NAMES;
// For scripts/check-tool/test-check.mjs and the local dev server (not used by Vercel).
module.exports._test = {
  deps, CheckError, normaliseUrl, assertSafeUrl, isPublicIPv4, isPublicIPv6, isPublicAddress, parseIPv6, resolvePublic, safeFetch,
  parseRobots, robotsAllows, analyseHtml, runPageSpeed, runRanking, tempoBlock, findBlock, contactBlock, trustBlock, blockScore, overallScore,
  rankFixes, offerFor, deterministicSummary, validateSummary, allowedNumbers, buildSummary, runCheck, publicView, reportMail, cacheKey, baseDomain,
  cache, buckets, daily, DAILY_CAP, MAX_BYTES, UA, IP_LIMIT, CACHE_TTL_MS,
  defaultTransport,
  reset() { cache.clear(); buckets.clear(); daily.day = ""; daily.checks = 0; daily.lookups = 0; daily.mails = 0; persistOffUntil = 0; }
};
