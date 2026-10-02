// /api/followup — the one follow-up mail after a confirmed Website-Check report (Sprint 34, plan section 7).
//
// OFF BY DEFAULT. Nothing is queued and nothing is sent unless the project variable CHECK_FOLLOWUP is exactly "1"
// (the wording needs the founder's and a lawyer's eyes first). CHECK_FOLLOWUP=0 or no value: the kill switch.
// The opt-out link of a mail that already went out keeps working in every state.
//
// What it does
//   - api/check.js calls queueFollowup() after the full report went to a confirmed address. That stores one row in
//     public.check_followup (docs/sql/check_followup.sql): the address, its SHA-256 hash, the checked host, the
//     language and the time the mail is due (48 hours later). One row per address: a second report within the
//     35 days a row lives does not queue a second mail. An address on the suppression list is never queued.
//   - Vercel Cron calls GET /api/followup once a day (vercel.json, 07:30 UTC; "Authorization: Bearer <CRON_SECRET>",
//     as for /api/digest). The job sends every row that is due: one short plain mail offering a 15-minute call about
//     the result. No advice, no sequence, no second mail. A row is claimed before its mail goes out (state pending ->
//     sent in one conditional update, the address is removed from the row at that moment), so two runs at the same
//     time, or a run that Vercel delivers twice, send one mail. A mail the provider refuses is not retried.
//     A row that is more than 3 days overdue is closed unsent (the job did not run, or the switch was off).
//   - Every mail carries an opt-out link: GET /api/followup?stop=<token> shows a page with one button (opening the
//     link alone changes nothing, because mail scanners open links); the button, or a mail program's own
//     "unsubscribe" (List-Unsubscribe-Post, RFC 8058: a POST to the same address), stores the address's hash in
//     public.check_suppression, closes a pending row and tells us by e-mail, so that nobody contacts the address
//     by hand either. The token carries the address encrypted (AES-256-GCM) and signed (HMAC-SHA256), keyed from
//     CHECK_MAIL_SECRET like the confirmation link of api/check.js; it does not expire.
//   - By hand (a withdrawal that reached us by e-mail): POST /api/followup with the cron secret and
//     {"suppress": "name@betrieb.de"}.
//
// Needs, and sends nothing while one is missing: CHECK_FOLLOWUP=1, CHECK_MAIL_SECRET (16+ characters),
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY with docs/sql/check_followup.sql applied, BREVO_API_KEY, CRON_SECRET.
//
// Privacy: logs and JSON answers carry numbers only, never an address or a host. The address is stored in
// check_followup until the mail is sent (at most 5 days), then only its hash (35 days, so that no second mail is
// queued); check_suppression keeps the hash of an address that opted out for as long as we send such mails.
// No npm dependencies. Tests: scripts/check-tool/test-check.mjs, section 24 (a stand-in for the database).

const crypto = require("crypto");

const SITE_ORIGIN = "https://www.rexity.ai";
const DUE_MS = 48 * 60 * 60 * 1000; // two days after the confirmed report
const OVERDUE_MS = 3 * 24 * 60 * 60 * 1000; // a row this long overdue is closed unsent
const ROW_DAYS = 35; // a row (after sending: only the hash) is deleted after this many days
const BATCH = 40; // mails per run
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOST_RE = /^[a-z0-9.-]{3,253}$/;
const SIGNATURE = ["Rexity Labs UG (haftungsbeschränkt)", "info@rexity.ai", "+49 174 2471435", "www.rexity.ai"];
const CALL_URL = SITE_ORIGIN + "/#kontakt";

const deps = {
  fetch: (...a) => fetch(...a),
  now: () => Date.now(),
  notify: null, // default: api/_notify.js
  count: null, // default: api/check.js countUsage
  randomBytes: (n) => crypto.randomBytes(n)
};

const enabled = () => String(process.env.CHECK_FOLLOWUP || "").trim() === "1";
const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const emailHash = (email) => crypto.createHash("sha256").update(String(email).trim().toLowerCase()).digest("hex");
const sameSecret = (a, b) => crypto.timingSafeEqual(crypto.createHash("sha256").update(String(a)).digest(), crypto.createHash("sha256").update(String(b)).digest());

// ---- Signed opt-out link -----------------------------------------------------------------------------------
const b64u = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s) => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");
const hmacOf = (key, v) => crypto.createHmac("sha256", key).update(v).digest();
// -> the two keys derived from CHECK_MAIL_SECRET (their own labels: a confirmation link is no opt-out link), or null
function stopKeys() {
  const s = String(process.env.CHECK_MAIL_SECRET || "").trim();
  if (s.length < 16) return null;
  return { enc: hmacOf(s, "rexity-check/optout/enc/v1"), mac: hmacOf(s, "rexity-check/optout/mac/v1") };
}
function signStop(payload, keys) {
  const iv = deps.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", keys.enc, iv);
  const ct = Buffer.concat([c.update(JSON.stringify(payload), "utf8"), c.final()]);
  const body = "s1." + b64u(Buffer.concat([iv, c.getAuthTag(), ct]));
  return body + "." + b64u(hmacOf(keys.mac, body));
}
// -> { email, lang } or null
function readStop(token, keys) {
  const parts = String(token || "").split(".");
  if (!keys || parts.length !== 3 || parts[0] !== "s1" || String(token).length > 2000) return null;
  const body = parts[0] + "." + parts[1];
  try {
    const mac = unb64u(parts[2]);
    const want = hmacOf(keys.mac, body);
    if (mac.length !== want.length || !crypto.timingSafeEqual(mac, want)) return null;
    const raw = unb64u(parts[1]);
    const d = crypto.createDecipheriv("aes-256-gcm", keys.enc, raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    const p = JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8"));
    if (!p || typeof p.e !== "string" || !EMAIL_RE.test(p.e)) return null;
    return { email: p.e, lang: p.l === "en" ? "en" : "de" };
  } catch (_e) {
    return null;
  }
}
const stopUrl = (email, lang, keys) => SITE_ORIGIN + "/api/followup?stop=" + signStop({ e: email, l: lang === "en" ? "en" : "de" }, keys);

// ---- The database (Supabase REST, service role; the same variables as api/lead.js) ---------------------------
// -> parsed JSON (an array for a read or a write with "return=representation", true for a write without), or
//    null when the store is not configured, the table is missing, it errors or does not answer within 4 s.
async function rest(method, table, query, body, prefer) {
  const base = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!base || !key) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const headers = { apikey: key, Authorization: "Bearer " + key, Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (prefer) headers.Prefer = prefer;
    const resp = await deps.fetch(`${base}/rest/v1/${table}${query ? "?" + query : ""}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: ctrl.signal });
    if (!resp.ok) { await resp.text().catch(() => ""); console.error("[followup] " + method + " " + table + " HTTP " + resp.status); return null; }
    if (resp.status === 204) return true;
    const text = await resp.text();
    if (!text) return true;
    try { return JSON.parse(text); } catch (_e) { return true; }
  } catch (e) {
    console.error("[followup] " + method + " " + table + " " + (e && e.name === "AbortError" ? "timeout" : "network"));
    return null;
  } finally {
    clearTimeout(timer);
  }
}
const iso = (ms) => new Date(ms).toISOString();
const q = (v) => encodeURIComponent(v);

// -> true (on the list), false (not on it), null (the list could not be read: then nothing is sent)
async function isSuppressed(hash) {
  const rows = await rest("GET", "check_suppression", "select=email_hash&email_hash=eq." + hash);
  return Array.isArray(rows) ? rows.length > 0 : null;
}
// Stores the hash of an address that wants no further mail and closes its pending row. -> true when stored
async function suppress(email, source) {
  const hash = emailHash(email);
  const stored = await rest("POST", "check_suppression", "on_conflict=email_hash", { email_hash: hash, source: source === "mail" ? "mail" : "link" }, "resolution=ignore-duplicates,return=minimal");
  if (stored === null) return false;
  await rest("PATCH", "check_followup", "email_hash=eq." + hash + "&state=eq.pending", { state: "suppressed", email: null }, "return=minimal");
  return true;
}

// ---- Queue (called by api/check.js after the report went to a confirmed address) -----------------------------
// -> "queued" | "off" | "no_secret" | "bad" | "suppressed" | "no_store"; never throws
async function queueFollowup({ email, host, lang, now }) {
  try {
    if (!enabled()) return "off";
    if (!stopKeys()) return "no_secret"; // without the secret no opt-out link can be signed: no mail
    const address = String(email || "").trim();
    const h = String(host || "").trim().toLowerCase();
    if (!EMAIL_RE.test(address) || address.length > 200 || !HOST_RE.test(h)) return "bad";
    const hash = emailHash(address);
    const sup = await isSuppressed(hash);
    if (sup === null) return "no_store";
    if (sup) return "suppressed";
    const at = Number.isFinite(now) ? now : deps.now();
    const row = { id: crypto.randomUUID(), email_hash: hash, email: address, host: h, lang: lang === "en" ? "en" : "de", state: "pending", due_at: iso(at + DUE_MS), created_at: iso(at) };
    const ok = await rest("POST", "check_followup", "on_conflict=email_hash", row, "resolution=ignore-duplicates,return=minimal");
    return ok === null ? "no_store" : "queued";
  } catch (_e) {
    return "no_store";
  }
}

// ---- The mail ------------------------------------------------------------------------------------------------
function consentNote(lang) {
  try { return require("./check").CONSENT_NOTE[lang === "en" ? "en" : "de"]; } catch (_e) { return ""; }
}
function followupMail(host, lang, link) {
  const de = lang !== "en";
  const hello = de ? "Guten Tag," : "Hello,";
  const lines = de
    ? [`vor zwei Tagen haben Sie von uns den vollständigen Bericht zum Website-Check für ${host} erhalten.`,
      "Wenn Sie über das Ergebnis sprechen möchten: In 15 Minuten gehen wir die Werte gemeinsam mit Ihnen durch und beantworten Ihre Fragen dazu.",
      `Termin anfragen: ${CALL_URL}`,
      "oder telefonisch unter +49 174 2471435. Sie können auch einfach auf diese E-Mail antworten.",
      "Das ist unsere einzige Nachfrage zu diesem Bericht. Eine weitere Erinnerung senden wir nicht."]
    : [`two days ago we sent you the full report of the website check for ${host}.`,
      "If you would like to talk about the result: in 15 minutes we go through the values with you and answer your questions about them.",
      `Request an appointment: ${CALL_URL}`,
      "or by phone on +49 174 2471435. You can also simply reply to this e-mail.",
      "This is our only follow-up on this report. We will not send another reminder."];
  const why = (de
    ? "Sie erhalten diese E-Mail, weil diese Adresse auf rexity.ai/website-check für den Bericht eingetragen und bestätigt wurde. "
    : "You receive this e-mail because this address was entered and confirmed for the report on rexity.ai/website-check. ") + consentNote(lang);
  const stop = de ? "Keine weiteren E-Mails zum Website-Check erhalten:" : "Receive no further e-mails about the website check:";
  const stopLabel = de ? "Abmelden" : "Unsubscribe";
  const button = de ? "Termin anfragen" : "Request an appointment";
  const text = [hello, "", lines[0], "", lines[1], "", lines[2], lines[3], "", lines[4], "", ...SIGNATURE, "", why.trim(), "", stop + " " + link].join("\n");
  const html = `<div style="font-family:sans-serif;font-size:14px;line-height:1.5;color:#111"><p>${esc(hello)}</p><p>${esc(lines[0])}</p><p>${esc(lines[1])}</p>` +
    `<p><a href="${esc(CALL_URL)}" style="display:inline-block;padding:10px 16px;background:#17152b;color:#fff;text-decoration:none;border-radius:6px">${esc(button)}</a></p>` +
    `<p>${esc(lines[3])}</p><p>${esc(lines[4])}</p><p>${SIGNATURE.map(esc).join("<br>")}</p>` +
    `<p style="font-size:12px;color:#555">${esc(why.trim())}</p><p style="font-size:12px;color:#555">${esc(stop)} <a href="${esc(link)}">${esc(stopLabel)}</a></p></div>`;
  return {
    subject: de ? `Ihr Website-Check für ${host}: 15 Minuten dazu sprechen?` : `Your website check for ${host}: talk about it for 15 minutes?`,
    textContent: text,
    htmlContent: html,
    // a mail program's own "unsubscribe" (RFC 2369 / RFC 8058): one POST to the same signed address, or a mail to us
    headers: { "List-Unsubscribe": `<${link}>, <mailto:info@rexity.ai?subject=${encodeURIComponent(de ? "Abmeldung Website-Check" : "Unsubscribe website check")}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
  };
}

// ---- The job -------------------------------------------------------------------------------------------------
const count = async (kind, n) => {
  try { await (deps.count || require("./check").countUsage)(kind, n); } catch (_e) { /* a counter never affects the job */ }
};
// -> { on, due, sent, failed, suppressed, taken, invalid, closed }
async function runJob() {
  const now = deps.now();
  const out = { on: enabled(), ready: true, due: 0, sent: 0, failed: 0, suppressed: 0, taken: 0, invalid: 0 };
  // Housekeeping runs in every state, also with the switch off: rows that are too old go, overdue rows are closed.
  await rest("DELETE", "check_followup", "created_at=lt." + q(iso(now - ROW_DAYS * 86400000)), undefined, "return=minimal");
  await rest("PATCH", "check_followup", "state=eq.pending&due_at=lt." + q(iso(now - OVERDUE_MS)), { state: "expired", email: null }, "return=minimal");
  if (!out.on) return out;
  const keys = stopKeys();
  if (!keys) { out.ready = false; console.error("[followup] CHECK_MAIL_SECRET missing or shorter than 16 characters: no opt-out link can be signed, nothing is sent"); return out; }
  const rows = await rest("GET", "check_followup", "select=id,email_hash,email,host,lang,state,due_at&state=eq.pending&due_at=lte." + q(iso(now)) + "&order=due_at.asc&limit=" + BATCH);
  if (!Array.isArray(rows)) { out.ready = false; return out; }
  const notify = deps.notify || require("./_notify");
  const seen = new Set();
  for (const row of rows) {
    // Every condition is checked again here; the query above is not trusted alone.
    const due = Date.parse(row && row.due_at);
    if (!row || row.state !== "pending" || !Number.isFinite(due) || due > now || now - due > OVERDUE_MS) continue;
    out.due++;
    const email = String(row.email || "").trim();
    const host = String(row.host || "").toLowerCase();
    const idOk = /^[0-9a-f-]{36}$/i.test(String(row.id));
    if (!idOk || !EMAIL_RE.test(email) || !HOST_RE.test(host) || row.email_hash !== emailHash(email) || seen.has(row.email_hash)) {
      out.invalid++;
      if (idOk) await rest("PATCH", "check_followup", "id=eq." + row.id + "&state=eq.pending", { state: "failed", email: null }, "return=minimal");
      continue;
    }
    seen.add(row.email_hash);
    const sup = await isSuppressed(row.email_hash);
    if (sup === null) { out.ready = false; break; } // the list cannot be read: stop, send nothing
    if (sup) {
      out.suppressed++;
      await rest("PATCH", "check_followup", "id=eq." + row.id + "&state=eq.pending", { state: "suppressed", email: null }, "return=minimal");
      continue;
    }
    // Claim: pending -> sent in one conditional update. Whoever gets the row back sends; nobody else can.
    const claimed = await rest("PATCH", "check_followup", "id=eq." + row.id + "&state=eq.pending", { state: "sent", sent_at: iso(now), email: null }, "return=representation");
    if (!Array.isArray(claimed) || claimed.length !== 1) { out.taken++; continue; }
    const lang = row.lang === "en" ? "en" : "de";
    const mail = followupMail(host, lang, stopUrl(email, lang, keys));
    let sent = null;
    try { sent = await notify.sendMail({ to: email, subject: mail.subject, textContent: mail.textContent, htmlContent: mail.htmlContent, headers: mail.headers }); } catch (_e) { sent = null; }
    if (sent && sent.sent) { out.sent++; continue; }
    out.failed++; // not retried: one mail at most is the rule, a second attempt could become a second mail
    await rest("PATCH", "check_followup", "id=eq." + row.id, { state: "failed" }, "return=minimal");
  }
  if (out.sent) await count("followups", out.sent);
  return out;
}

// ---- The opt-out page ------------------------------------------------------------------------------------------
const TEXT = {
  title: { de: "Website-Check: keine weiteren E-Mails", en: "Website check: no further e-mails" },
  ask: { de: "Mit einem Klick senden wir an {email} keine weiteren E-Mails zum Website-Check.", en: "With one click we will send no further e-mails about the website check to {email}." },
  button: { de: "Keine weiteren E-Mails senden", en: "Send no further e-mails" },
  doneTitle: { de: "Erledigt", en: "Done" },
  done: { de: "An {email} senden wir keine weiteren E-Mails zum Website-Check. Ihre Einwilligung zur Kontaktaufnahme ist damit widerrufen.", en: "We will send no further e-mails about the website check to {email}. Your consent to being contacted is thereby withdrawn." },
  badTitle: { de: "Dieser Link ist ungültig", en: "This link is not valid" },
  bad: { de: "Der Abmelde-Link ist nicht vollständig oder nicht mehr gültig. Eine kurze Nachricht an info@rexity.ai genügt, dann tragen wir Ihre Adresse von Hand aus.", en: "The opt-out link is incomplete or no longer valid. A short message to info@rexity.ai is enough and we will remove your address by hand." },
  failTitle: { de: "Das hat nicht geklappt", en: "That did not work" },
  fail: { de: "Die Abmeldung konnte gerade nicht gespeichert werden. Bitte versuchen Sie es später erneut oder schreiben Sie kurz an info@rexity.ai.", en: "The opt-out could not be stored just now. Please try again later or write a short message to info@rexity.ai." },
  rate: { de: "Das waren viele Aufrufe in kurzer Zeit. Bitte versuchen Sie es in einigen Minuten erneut.", en: "That was a lot of requests in a short time. Please try again in a few minutes." }
};
const fill = (t, email) => esc(t).replace("{email}", "<strong>" + esc(email) + "</strong>");
function page(res, status, lang, title, bodyHtml) {
  const de = lang !== "en";
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.end(`<!doctype html><html lang="${de ? "de" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><meta name="referrer" content="no-referrer"><title>${esc(title)}</title>` +
    `<style>body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:17px;line-height:1.55;color:#17152b;background:#f4f1fc}main{max-width:34rem;margin:0 auto;padding:3rem 1.25rem}h1{font-size:1.5rem;line-height:1.25;margin:0 0 1rem}p{margin:0 0 1rem}.b{display:inline-block;font:inherit;font-weight:600;padding:.8rem 1.2rem;border:0;border-radius:.5rem;background:#17152b;color:#fff;cursor:pointer}form{margin:0 0 1.25rem}.b:focus-visible,a:focus-visible{outline:3px solid #5b3fd6;outline-offset:3px}.s{font-size:.875rem;color:#4a4763}a{color:#3d2aa3}</style></head>` +
    `<body><main data-wc-stop><h1>${esc(title)}</h1>${bodyHtml}<p class="s"><a href="${SITE_ORIGIN}/website-check">${de ? "Zum Website-Check" : "To the website check"}</a> · Rexity Labs UG (haftungsbeschränkt) · <a href="${SITE_ORIGIN}/impressum">${de ? "Impressum" : "Legal notice"}</a> · <a href="${SITE_ORIGIN}/datenschutz">${de ? "Datenschutz" : "Privacy"}</a></p></main></body></html>`);
}

// Stores the opt-out and tells us. -> true when at least one of the two worked (the address is then on record)
async function optOut(email, lang, source) {
  const stored = await suppress(email, source);
  let told = false;
  try {
    const notify = deps.notify || require("./_notify");
    const to = String(process.env.LEAD_NOTIFY_TO || "info@rexity.ai").trim();
    const text = ["Abmeldung vom Website-Check", "", `Adresse: ${email}`, `Weg: ${source === "mail" ? "von Hand eingetragen" : "Link in der Nachfass-E-Mail"}`,
      `In der Sperrliste gespeichert: ${stored ? "ja" : "NEIN – bitte von Hand eintragen (docs/sql/check_followup.sql, Abschnitt am Ende)"}`, "",
      "Die Einwilligung zur Kontaktaufnahme ist widerrufen: Bitte diese Adresse nicht mehr zum Website-Check anschreiben, auch nicht von Hand."].join("\n");
    const r = await notify.sendMail({ to, subject: "Website-Check: Abmeldung", textContent: text, htmlContent: `<pre style="font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.5">${esc(text)}</pre>` });
    told = Boolean(r && r.sent);
  } catch (_e) { /* the stored opt-out stands on its own */ }
  if (stored || told) await count("optouts", 1);
  console.log("[followup] opt-out stored=" + stored + " told=" + told);
  return stored || told;
}

// ---- Handler -----------------------------------------------------------------------------------------------
const buckets = new Map();
function hit(key, limit, windowMs) {
  const now = deps.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) { buckets.set(key, hits); return true; }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 4000) buckets.clear();
  return false;
}
const ipOf = (req) => {
  const fwd = req.headers && req.headers["x-forwarded-for"];
  return (typeof fwd === "string" ? fwd.split(",")[0].trim() : "") || (req.socket && req.socket.remoteAddress) || "unknown";
};
const json = (res, status, payload, headers) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  for (const [k, v] of Object.entries(headers || {})) res.setHeader(k, v);
  res.end(JSON.stringify(payload));
};

async function handler(req, res) {
  let query;
  try { query = new URL(String(req.url || "/"), SITE_ORIGIN).searchParams; } catch (_e) { query = new URLSearchParams(); }
  const auth = req.headers && typeof req.headers.authorization === "string" ? req.headers.authorization : "";
  const secret = String(process.env.CRON_SECRET || "").trim();
  const authorised = Boolean(secret) && sameSecret(auth, "Bearer " + secret);

  let body = "";
  if (req.method === "POST") {
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 4000) return json(res, 413, { ok: false, error: "too_large" });
    }
  }
  const type = req.headers && typeof req.headers["content-type"] === "string" ? req.headers["content-type"] : "";
  let data = {};
  if (req.method === "POST" && body) {
    if (/application\/json/i.test(type)) { try { data = JSON.parse(body) || {}; } catch (_e) { data = {}; } }
    else data = Object.fromEntries(new URLSearchParams(body));
    if (!data || typeof data !== "object" || Array.isArray(data)) data = {};
  }

  // 1. The opt-out link: the page (GET), the button and a mail program's one-click unsubscribe (POST)
  const token = query.get("stop") || (typeof data.stop === "string" ? data.stop : "");
  if (token) {
    const p = readStop(token, stopKeys());
    const lang = p ? p.lang : "de";
    if (!p) return page(res, 400, "de", TEXT.badTitle.de, `<p>${esc(TEXT.bad.de)}</p><p lang="en">${esc(TEXT.bad.en)}</p>`);
    if (req.method === "GET" || req.method === "HEAD") {
      return page(res, 200, lang, TEXT.title[lang], `<p>${fill(TEXT.ask[lang], p.email)}</p><form method="post" action="/api/followup"><input type="hidden" name="stop" value="${esc(token)}"><button class="b" type="submit">${esc(TEXT.button[lang])}</button></form>`);
    }
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "method" }, { Allow: "GET, POST" });
    if (hit("stop:" + ipOf(req), 20, 10 * 60 * 1000)) { res.setHeader("Retry-After", "300"); return page(res, 429, lang, TEXT.failTitle[lang], `<p>${esc(TEXT.rate[lang])}</p>`); }
    const ok = await optOut(p.email, lang, "link");
    return ok ? page(res, 200, lang, TEXT.doneTitle[lang], `<p>${fill(TEXT.done[lang], p.email)}</p>`) : page(res, 502, lang, TEXT.failTitle[lang], `<p>${esc(TEXT.fail[lang])}</p>`);
  }

  // 2. Everything else needs the cron secret
  if (!authorised) return json(res, 401, { ok: false, error: "unauthorized" });
  if (req.method === "POST") {
    // a withdrawal that reached us by e-mail, entered by hand
    const email = typeof data.suppress === "string" ? data.suppress.trim() : "";
    if (!EMAIL_RE.test(email) || email.length > 200) return json(res, 422, { ok: false, error: "email" });
    const stored = await suppress(email, "mail");
    if (stored) await count("optouts", 1);
    return json(res, stored ? 200 : 502, { ok: stored, suppressed: stored });
  }
  if (req.method !== "GET") return json(res, 405, { ok: false, error: "method" }, { Allow: "GET, POST" });
  const r = await runJob();
  console.log("[followup] on=" + r.on + " ready=" + r.ready + " due=" + r.due + " sent=" + r.sent + " failed=" + r.failed + " suppressed=" + r.suppressed + " taken=" + r.taken + " invalid=" + r.invalid);
  return json(res, r.failed || !r.ready ? 502 : 200, { ok: !r.failed && r.ready, ...r });
}

module.exports = handler;
module.exports.queueFollowup = queueFollowup;
module.exports._test = { deps, enabled, emailHash, stopKeys, signStop, readStop, stopUrl, followupMail, runJob, suppress, isSuppressed, optOut, buckets, DUE_MS, OVERDUE_MS, ROW_DAYS, BATCH };
