// api/_rpa.js — what the RPA demo's sandbox keeps on the server and the ONE way a demo mail leaves it (Sprint 42).
// The leading underscore keeps Vercel from exposing this file as a function; it is required by api/rpa-demo.js and
// api/rpa-reminders.js. Contract: docs/RPA_DEMO_API.md. Rules of the sandbox: assets/js/rpa-agent-core.js.
//
// THE SAFETY RULE. This is a public page: a tool on the open web must never send e-mail to an address somebody
// merely typed in. So this file has exactly two places that hand a mail to the mail provider:
//   sendConfirmation(email, …)   the double opt-in mail: one fixed text with a signed link, nothing a visitor wrote,
//                                to the address the visitor entered as HIS OWN. Limited per IP address, per address
//                                and per day by the caller. An address on the opt-out list gets nothing.
//   deliver(sid, …)              every other mail of the demo. It takes a demo session, never an address: the
//                                recipient is read from the stored row of that session, and a row exists only after
//                                the signed link was confirmed. No row, expired row, opted-out address, store not
//                                readable or a cap reached: no mail.
// Nothing in a request can name a recipient. The "customer" and the "serviceman" of the demo are roles: both mails
// go to the visitor's confirmed address, the serviceman's copy marked "Kopie an den Monteur (Demo)".
// scripts/rpa-demo/test-rpa-demo.mjs proves it: it counts the calls of the mail function in the three source files and
// drives every action with foreign addresses in every field.
//
// What is stored, and only for a confirmed session (docs/sql/rpa_agent.sql, table public.rpa_demo_session, row-level
// security, service role only, written through security-definer functions): the address, the language, and of the
// appointments the agent booked in that session: id, date, time window, serviceman, Anliegen. No pasted text. Deleted
// after 7 days, when the visitor resets the demo or removes the address, or through the opt-out link in every mail.
// An opt-out leaves the SHA-256 hash of the address in public.rpa_demo_optout (183 days), so that the address is not
// written to again.
//
// Until the SQL is applied (or when the store does not answer) the functions here answer "not available": no
// confirmation mail, no demo mail, no reminder; the page then shows every mail on screen only. Where no shared store
// is configured at all (local runs, tests) the rows live in this process's memory.
//
// Caps (fail closed, counted in public.check_usage through capBump of api/check.js): RPA_MAIL_ADDRESS_DAILY (10)
// mails per confirmed address and Europe/Berlin day, RPA_MAIL_ADDRESS_WEEKLY (30) per calendar week, RPA_MAIL_DAILY_CAP
// (150) demo mails per day in total, confirmation mails included.
// Logs: numbers and reasons only, never an address, a name or a text.

const crypto = require("crypto");
const check = require("./check");
const C = require("../assets/js/rpa-agent-core.js");
const S = check.shared;
const T = S.T;
const esc = S.esc;

const PAGE = S.SITE_ORIGIN + "/automation/rpa";
const ENDPOINT = "/api/rpa-demo";
const SESSION_TTL_S = 7 * 86400;
const OPTOUT_DAYS = 183;
const DAY_COUNTER_TTL_S = 183 * 86400;
const MAX_APPTS = 40;
const envInt = (name, fallback, min, max) => {
  const v = parseInt(String(process.env[name] || "").trim(), 10);
  return Number.isFinite(v) && v >= min && v <= max ? v : fallback;
};
const CAPS = { addressDay: envInt("RPA_MAIL_ADDRESS_DAILY", 10, 1, 1000), addressWeek: envInt("RPA_MAIL_ADDRESS_WEEKLY", 30, 1, 5000), day: envInt("RPA_MAIL_DAILY_CAP", 150, 1, 100000) };

const CONFIRM_PER_ADDRESS = 2; // confirmation mails per address and day
const SID_RE = /^[0-9a-f]{32}$/;
const sidHash = (sid) => crypto.createHash("sha256").update("rpa|" + sid).digest("hex");
const emailHash = (email) => crypto.createHash("sha256").update(String(email).trim().toLowerCase()).digest("hex");
const keysOf = (scope) => S.mailKeys("rexity-rpa/" + scope);
const notifier = () => S.deps.notify || require("./_notify");
const mailConfigured = () => Boolean(S.deps.notify || String(process.env.BREVO_API_KEY || "").trim());

// ---- The store ---------------------------------------------------------------------------------------------------
// Shared store configured: the security-definer functions of docs/sql/rpa_agent.sql. Not configured: this process.
const mem = { sessions: new Map(), optout: new Map() };
let storeOffUntil = 0; // the functions are not installed (SQL not applied) or did not answer
const shared = () => S.persistConfigured();
async function call(name, args) {
  if (S.deps.now() < storeOffUntil) return null;
  const out = await S.rpc(name, args, true);
  if (out === null) storeOffUntil = S.deps.now() + 5 * 60 * 1000;
  return out;
}
const first = (data) => (Array.isArray(data) ? data[0] : data);
const live = (row) => row && row.expires > S.deps.now();
function memPurge() {
  for (const [k, r] of mem.sessions) if (!live(r)) mem.sessions.delete(k);
  for (const [k, at] of mem.optout) if (S.deps.now() - at > OPTOUT_DAYS * 86400000) mem.optout.delete(k);
}
const rowOf = (r) => (r && typeof r.email === "string" && S.EMAIL_RE.test(r.email)
  ? { email: r.email, lang: r.lang === "en" ? "en" : "de", appts: Array.isArray(r.appts) ? r.appts : [], reminded: Array.isArray(r.reminded) ? r.reminded : [], expires: typeof r.expires_at === "string" ? Date.parse(r.expires_at) : r.expires }
  : null);

// -> { ok: false } (the store cannot be read: nothing may be sent) or { ok: true, row | null }
async function sessionGet(sid) {
  if (!SID_RE.test(String(sid || ""))) return { ok: true, row: null };
  const h = sidHash(sid);
  if (!shared()) { memPurge(); const r = mem.sessions.get(h); return { ok: true, row: r ? rowOf(r) : null, hash: h }; }
  const data = await call("rpa_demo_get", { p_sid_hash: h });
  if (data === null) return { ok: false };
  const row = rowOf(first(data));
  return { ok: true, row: row && row.expires > S.deps.now() ? row : null, hash: h };
}
// The address is confirmed: the row is created (or its address replaced). -> "ok" | "optout" | null (store not available)
async function sessionConfirm(sid, email, lang) {
  const h = sidHash(sid);
  const eh = emailHash(email);
  if (!shared()) {
    memPurge();
    if (mem.optout.has(eh)) return "optout";
    const old = mem.sessions.get(h);
    mem.sessions.set(h, { email, email_hash: eh, lang, appts: old && old.email_hash === eh ? old.appts : [], reminded: old && old.email_hash === eh ? old.reminded : [], expires: S.deps.now() + SESSION_TTL_S * 1000 });
    return "ok";
  }
  const data = await call("rpa_demo_confirm", { p_sid_hash: h, p_email: email, p_email_hash: eh, p_lang: lang, p_ttl_seconds: SESSION_TTL_S });
  const v = first(data);
  const state = typeof v === "string" ? v : v && typeof v === "object" ? v.rpa_demo_confirm : null;
  return state === "ok" || state === "optout" ? state : null;
}
// -> true (on the list), false, null (the list cannot be read: then nothing is sent)
async function optedOut(email) {
  const eh = emailHash(email);
  if (!shared()) { memPurge(); return mem.optout.has(eh); }
  const data = await call("rpa_demo_optout_has", { p_email_hash: eh });
  const v = first(data);
  const b = typeof v === "boolean" ? v : v && typeof v === "object" ? v.rpa_demo_optout_has : null;
  return typeof b === "boolean" ? b : null;
}
const bool = (data, name) => { const v = first(data); return typeof v === "boolean" ? v : v && typeof v === "object" && typeof v[name] === "boolean" ? v[name] : null; };
// The appointments the agent booked in this session (for the reminder job). -> true | false (no such session) | null
async function sessionSync(sid, appts) {
  const h = sidHash(sid);
  if (!shared()) { memPurge(); const r = mem.sessions.get(h); if (!r) return false; r.appts = appts; return true; }
  return bool(await call("rpa_demo_sync", { p_sid_hash: h, p_appts: appts }), "rpa_demo_sync");
}
async function sessionDelete(sid) {
  const h = sidHash(sid);
  if (!shared()) return mem.sessions.delete(h);
  return bool(await call("rpa_demo_delete", { p_sid_hash: h }), "rpa_demo_delete");
}
// One reminder per appointment and date: whoever gets true sends; nobody else can. -> true | false | null
async function claim(hash, key) {
  if (!shared()) { const r = mem.sessions.get(hash); if (!r || !live(r) || r.reminded.includes(key)) return false; r.reminded.push(key); return true; }
  return bool(await call("rpa_demo_claim", { p_sid_hash: hash, p_key: key }), "rpa_demo_claim");
}
async function release(hash, key) {
  if (!shared()) { const r = mem.sessions.get(hash); if (r) r.reminded = r.reminded.filter((k) => k !== key); return true; }
  return bool(await call("rpa_demo_release", { p_sid_hash: hash, p_key: key }), "rpa_demo_release");
}
// Opt-out: every session of the address goes, its hash stays on the list. -> true when stored
async function optOut(email) {
  const eh = emailHash(email);
  if (!shared()) { for (const [k, r] of mem.sessions) if (r.email_hash === eh) mem.sessions.delete(k); mem.optout.set(eh, S.deps.now()); return true; }
  const data = await call("rpa_demo_optout", { p_email_hash: eh });
  return data !== null;
}
// Sessions with an appointment on `day`. -> [{ hash, email, lang, appts, reminded }] or null
async function due(day, limit) {
  if (!shared()) {
    memPurge();
    return [...mem.sessions].filter(([, r]) => r.appts.some((a) => a.date === day)).slice(0, limit).map(([hash, r]) => ({ hash, ...rowOf(r) }));
  }
  const data = await call("rpa_demo_due", { p_date: day, p_limit: limit });
  if (!Array.isArray(data)) return null;
  return data.map((r) => { const row = rowOf(r); return row && /^[0-9a-f]{64}$/.test(String(r.sid_hash)) ? { hash: r.sid_hash, ...row } : null; }).filter(Boolean);
}
async function purge() {
  if (!shared()) { memPurge(); return true; }
  return (await call("rpa_demo_purge", {})) !== null;
}
// Can the demo send mail at all? (secret for the signed links, a mail provider, a store that answers)
async function mailAvailable() {
  if (!keysOf("confirm") || !mailConfigured()) return false;
  if (!shared()) return true;
  return (await call("rpa_demo_get", { p_sid_hash: "0".repeat(64) })) !== null;
}

// ---- Counters ------------------------------------------------------------------------------------------------------
let countOffUntil = 0;
async function count(kind, n) {
  try {
    if (!S.persistActive() || S.deps.now() < countOffUntil) return;
    if ((await S.sharedBump(`${kind}:${S.today().day}`, n || 1, DAY_COUNTER_TTL_S, true)) === null) countOffUntil = S.deps.now() + 10 * 60 * 1000;
  } catch (_e) { /* a counter never affects a response */ }
}
const addressKey = (email) => crypto.createHmac("sha256", keysOf("caps").mac).update(String(email).trim().toLowerCase()).digest("hex").slice(0, 32);
// One mail against the three caps: each counter is raised and then compared, so a refused attempt stays counted
// (the cap then stays reached, which is the point). -> null (granted) | "address" | "day" | "store" (cannot be
// counted: no mail)
async function takeMail(email) {
  const day = S.today().day;
  const a = addressKey(email);
  const keys = [[`rpamaila:${a}:${day}`, CAPS.addressDay, 2 * 86400, "address"], [`rpamailw:${a}:${S.isoWeek(day)}`, CAPS.addressWeek, 8 * 86400, "address"], [`rpamail:${day}`, CAPS.day, DAY_COUNTER_TTL_S, "day"]];
  for (const [key, cap, ttl, name] of keys) {
    const now = await S.capBump(key, 1, ttl);
    if (now === null) return "store";
    if (now > cap) return name;
  }
  return null;
}
// the global daily cap alone (the confirmation mail: the address is not confirmed yet, so no address counter)
async function takeDay() {
  const now = await S.capBump(`rpamail:${S.today().day}`, 1, DAY_COUNTER_TTL_S);
  return now === null ? "store" : now > CAPS.day ? "day" : null;
}

// ---- Signed values ---------------------------------------------------------------------------------------------------
const confirmLink = (email, sid, lang) => S.SITE_ORIGIN + ENDPOINT + "?confirm=" + S.signConfirm({ email, url: PAGE, lang, exp: S.deps.now() + S.CONFIRM_TTL_MS, data: { sid } }, keysOf("confirm"));
// -> { email, sid, lang } | { error, lang? }
function readConfirmLink(token) {
  const p = S.readConfirm(token, keysOf("confirm"));
  if (p.error) return p;
  if (p.url !== PAGE || !p.data || !SID_RE.test(String(p.data.sid || "")) || !S.EMAIL_RE.test(p.email)) return { error: "confirm_bad" };
  return { email: p.email, sid: p.data.sid, lang: p.lang, exp: p.exp };
}
// the opt-out link does not expire in practice (ten years): it must work for as long as a mail is in a mailbox
const stopLink = (email, lang) => S.SITE_ORIGIN + ENDPOINT + "?stop=" + S.signConfirm({ email, url: PAGE + "#stop", lang, exp: S.deps.now() + 3650 * 86400000 }, keysOf("stop"));
function readStopLink(token) {
  const p = S.readConfirm(token, keysOf("stop"));
  return p.error || p.url !== PAGE + "#stop" || !S.EMAIL_RE.test(p.email) ? null : { email: p.email, lang: p.lang };
}
// A confirmation text the model wrote and this function checked is sealed, so that the page can hand it back for
// sending and nothing else: a text without a valid seal is replaced by the fixed template.
const b64u = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function sealOf(lang, body) {
  const keys = keysOf("seal");
  return keys ? b64u(crypto.createHmac("sha256", keys.mac).update((lang === "en" ? "en" : "de") + "\n" + body).digest()) : null;
}
function sealValid(lang, body, seal) {
  const want = sealOf(lang, body);
  if (!want || typeof seal !== "string" || seal.length !== want.length) return false;
  return crypto.timingSafeEqual(Buffer.from(seal), Buffer.from(want));
}

// ---- What a mail may contain -----------------------------------------------------------------------------------------
const clean = (s) => String(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").replace(/\r\n?/g, "\n");
const LINK_RE = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:de|com|net|org|eu|io|ai|info|shop|app|at|ch)\b(?:\/\S*)?/gi;
const PRICE_RE = /(?:\d[\d.,]*\s*(?:€|eur\b|euro\b|usd\b|\$|dollar|cent\b|pfund|£))|(?:(?:€|\$|£)\s*\d)/i;
// nothing beyond the booked slot: no price, no cost, no guarantee, no promise of punctuality or of a result
const PROMISE_RE = /garantier|versprech|zugesagt|kostenlos|\bgratis|\bkostet\b|\bkosten\b|\bpreis|festpreis|rabatt|p(?:ü|ue)nktlich|auf\s+jeden\s+fall|ganz\s+sicher|\bbehoben\s+sein|guarantee|we\s+promise|free\s+of\s+charge|\bcosts?\b|\bprice|discount|on\s+time|without\s+fail|will\s+be\s+fixed/i;
// a date, a weekday or a time of its own: the only appointment in the text is the placeholder the code fills in
const DATE_RE = /\d{1,2}[:.]\d{2}|\d{1,2}\s*uhr\b|\d{1,2}\.\s?\d{1,2}\.|\d\s*(?:am|pm)\b|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\bheute\b|(?:ü|ue)bermorgen|\btoday\b|\btomorrow\b|n(?:ä|ae)chste[rn]?\s+woche|next\s+week|vormittag|nachmittag|\bafternoon\b/i;
const CLOSING_RE = /\n\s*(?:mit\s+freundlichen\s+gr(?:ü|ue)(?:ß|ss)en|freundliche\s+gr(?:ü|ue)(?:ß|ss)e|viele\s+gr(?:ü|ue)(?:ß|ss)e|beste\s+gr(?:ü|ue)(?:ß|ss)e|herzliche\s+gr(?:ü|ue)(?:ß|ss)e|kind\s+regards|best\s+regards|yours\s+sincerely|regards)[\s\S]*$/i;
const BODY = { min: 120, max: 700 };
/* The confirmation text of a model: -> the text as it may be used (placeholders still in it), or null (the fixed
   template is used instead). */
function checkBody(raw) {
  if (typeof raw !== "string") return null;
  let d = clean(raw).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(CLOSING_RE, "").trim();
  if (d.length < BODY.min || d.length > BODY.max) return null;
  if (d.split("[TERMIN]").length !== 2) return null;
  const tech = d.split("[MONTEUR]").length - 1;
  if (tech < 1 || tech > 2) return null;
  const bare = d.split("[TERMIN]").join(" ").split("[MONTEUR]").join(" ");
  if (/[[\]{}<>]/.test(bare)) return null; // another placeholder, markup
  LINK_RE.lastIndex = 0;
  if (LINK_RE.test(bare) || /@/.test(bare)) return null;
  if (PRICE_RE.test(bare) || PROMISE_RE.test(bare)) return null;
  if (DATE_RE.test(bare.replace(/guten\s+morgen/gi, " ")) || /(?:^|[^\p{L}])morgen(?![\p{L}])/iu.test(bare.replace(/guten\s+morgen/gi, " "))) return null;
  if (/\d{5,}/.test(bare.replace(/[\s/().-]/g, ""))) return null; // a phone number, a postcode: the mail needs neither
  return d;
}
const line = (v, max) => {
  if (typeof v !== "string") return null;
  LINK_RE.lastIndex = 0;
  const s = clean(v).replace(/\s+/g, " ").replace(LINK_RE, " ").replace(/[<>]/g, " ").replace(/\s+/g, " ").trim();
  return s && s.length <= max ? s : null;
};
const PREPARED = { de: Object.values(C.EXAMPLE_BODIES).map((b) => b.de), en: Object.values(C.EXAMPLE_BODIES).map((b) => b.en) };
const SLOT_KINDS = ["confirm", "tech", "moved", "tech_moved", "reminder"];
const OLD_KINDS = ["moved", "tech_moved", "cancelled", "tech_cancelled", "rejected"];
/* The facts of one mail as the page hands them over: every field is checked against the sandbox's fixed data
   (serviceman, window, a date of the calendar) or reduced to one capped line without links. -> facts | null */
function cleanFacts(kind, raw, lang, today) {
  if (!C.KINDS.includes(kind) || !raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const f = { name: line(raw.name, 80), address: line(raw.address, 140), topic: line(raw.topic, 140), reason: line(raw.reason, 120) };
  const phone = line(raw.phone, 40);
  f.phone = phone && /^[+\d][\d\s/().-]{5,}$/.test(phone) ? phone : null;
  // an address inside the text of a job sheet is a detail of the job, never a recipient (see deliver)
  f.email = typeof raw.email === "string" && S.EMAIL_RE.test(raw.email.trim()) && raw.email.trim().length <= 120 && !/[<>\s]/.test(raw.email.trim()) ? raw.email.trim() : null;
  f.trade = Object.prototype.hasOwnProperty.call(C.TRADES, raw.trade) ? raw.trade : "other";
  f.severity = Object.prototype.hasOwnProperty.call(C.SEVERITY_LABEL, raw.severity) ? raw.severity : "normal";
  f.signal = C.SIGNAL_IDS.includes(raw.signal) ? raw.signal : null;
  const slot = (tech, date, win) => {
    const t = C.techOf(tech);
    if (!t || !C.winOf(win) || !C.DAY_RE.test(String(date)) || !C.works(t, date, win)) return false;
    const d = C.dayDiff(date, today);
    return d >= -1 && d <= 21;
  };
  if (SLOT_KINDS.includes(kind)) {
    if (!slot(raw.tech, raw.date, raw.win)) return null;
    f.tech = raw.tech; f.date = raw.date; f.win = raw.win;
  }
  if (OLD_KINDS.includes(kind)) {
    const oldTech = raw.oldTech || raw.tech;
    if (!slot(oldTech, raw.oldDate, raw.oldWin)) return null;
    f.oldTech = oldTech; f.oldDate = raw.oldDate; f.oldWin = raw.oldWin;
    if (!f.tech) f.tech = oldTech;
  }
  if (kind === "ask") {
    f.missing = Array.isArray(raw.missing) ? C.REQUIRED.filter((m) => raw.missing.includes(m)) : [];
    if (!f.missing.length) return null;
  }
  // a wording other than the template: only one this function sealed, or one of the page's prepared examples
  if (kind === "confirm" && typeof raw.body === "string" && (sealValid(lang, raw.body, raw.seal) || PREPARED[lang].includes(raw.body)) && checkBody(raw.body) === raw.body) f.body = raw.body;
  if (kind === "reminder") f.name = null; // the job knows no name; the reminder sent from the page reads the same
  return f;
}

// ---- The mails as they are sent ----------------------------------------------------------------------------------------
const NOTE = {
  banner: T("Demo-E-Mail aus der Sandbox „Beispiel-Betrieb Haustechnik“ auf rexity.ai. Der Betrieb, der Monteur und der Termin sind erfunden; es kommt niemand zu Ihnen.",
    "Demo e-mail from the sandbox “Example Building Services” on rexity.ai. The business, the serviceman and the appointment are invented; nobody will come to you."),
  customer: T("E-Mail an den Kunden. In der Demo erhalten Sie sie in der Rolle des Kunden.", "E-mail to the customer. In the demo you receive it in the role of the customer."),
  tech: T("Kopie an den Monteur (Demo). Im echten Betrieb ginge diese E-Mail an den Monteur; in der Demo erhalten nur Sie sie.", "Copy to the serviceman (demo). In a real business this e-mail would go to the serviceman; in the demo only you receive it."),
  why: T("Sie erhalten diese E-Mail, weil diese Adresse auf rexity.ai/automation/rpa für die Demo eingetragen und über den Link in unserer Bestätigungs-E-Mail bestätigt wurde. Wir speichern die Adresse, die Sprache und die Termine der Demo sieben Tage lang und löschen sie danach.",
    "You receive this e-mail because this address was entered for the demo on rexity.ai/automation/rpa and confirmed through the link in our confirmation e-mail. We store the address, the language and the demo's appointments for seven days and delete them afterwards."),
  stop: T("Keine weiteren Demo-E-Mails erhalten und die gespeicherten Daten löschen:", "Receive no further demo e-mails and delete the stored data:"),
  stopLabel: T("Abmelden", "Unsubscribe")
};
function wrap(mail, lang, link) {
  const L = lang === "en" ? "en" : "de";
  const role = NOTE[mail.role === "tech" ? "tech" : "customer"][L];
  const rule = "----------------------------------------";
  const text = [NOTE.banner[L], role, rule, "", mail.body, "", rule, NOTE.why[L], NOTE.stop[L] + " " + link, "", ...S.SIGNATURE].join("\n");
  const html = `<div style="font-family:sans-serif;font-size:14px;line-height:1.5;color:#111">` +
    `<p style="margin:0 0 12px;padding:10px 12px;border-radius:6px;background:#f4f1fc;font-size:13px"><strong>${esc(NOTE.banner[L])}</strong><br>${esc(role)}</p>` +
    `<div style="white-space:pre-wrap;padding:4px 0 12px">${esc(mail.body)}</div>` +
    `<p style="font-size:12px;color:#555;border-top:1px solid #ddd;padding-top:10px">${esc(NOTE.why[L])}</p><p style="font-size:12px;color:#555">${esc(NOTE.stop[L])} <a href="${esc(link)}">${esc(NOTE.stopLabel[L])}</a></p><p style="font-size:12px;color:#555">${S.SIGNATURE.map(esc).join("<br>")}</p></div>`;
  return {
    subject: (mail.role === "tech" ? (L === "de" ? "[Demo · Kopie an den Monteur] " : "[Demo · copy to the serviceman] ") : "[Demo] ") + mail.subject,
    textContent: text, htmlContent: html,
    headers: { "List-Unsubscribe": `<${link}>, <mailto:info@rexity.ai?subject=${encodeURIComponent(L === "de" ? "Abmeldung RPA-Demo" : "Unsubscribe RPA demo")}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
  };
}

/* THE way a demo mail leaves: by session, never by address. -> { sent: true } | { sent: false, reason }
   reason: "no_session" (not confirmed, expired, removed) | "store" | "cap_address" | "cap_day" | "bad" | "mail_failed" */
async function deliver(sid, kind, rawFacts, lang, session) {
  const s = session || (await sessionGet(sid));
  if (!s.ok) return { sent: false, reason: "store" };
  if (!s.row) return { sent: false, reason: "no_session" };
  if (!keysOf("stop")) return { sent: false, reason: "store" }; // without the secret no opt-out link can be signed: no mail
  const L = lang === "en" ? "en" : "de";
  const facts = cleanFacts(kind, rawFacts, L, S.today().day);
  const mail = facts ? C.mailFor(kind, facts, L) : null;
  if (!mail) return { sent: false, reason: "bad" };
  const refused = await takeMail(s.row.email);
  if (refused) return { sent: false, reason: refused === "store" ? "store" : "cap_" + refused };
  const out = wrap(mail, L, stopLink(s.row.email, L));
  let sent = null;
  try { sent = await notifier().sendMail({ to: s.row.email, subject: out.subject, textContent: out.textContent, htmlContent: out.htmlContent, headers: out.headers }); } catch (_e) { sent = null; }
  if (!sent || !sent.sent) { console.log("[rpa] mail kind=" + kind + " sent=false reason=" + ((sent && sent.reason) || "unknown")); return { sent: false, reason: "mail_failed", detail: (sent && sent.reason) || "unknown" }; }
  await count(kind === "reminder" ? "rparem" : "rpasent", 1);
  return { sent: true };
}

function confirmationMail(link, lang) {
  const de = lang !== "en";
  const lines = de
    ? ["auf rexity.ai/automation/rpa wurde diese E-Mail-Adresse für die Demo „Vom Posteingang zum Auftrag“ eingetragen: Die E-Mails, die der Agent in der Demo schreibt, sollen an diese Adresse gehen.",
      "Bitte bestätigen Sie, dass das Ihre Adresse ist:", link, "Der Link gilt 48 Stunden.",
      "Nach der Bestätigung erhalten Sie die E-Mails dieser Demo (Terminbestätigung, Kopie an den Monteur, Erinnerung am Vortag um 9:00 Uhr) an diese Adresse, höchstens 10 am Tag und 30 in der Woche. Dafür speichern wir die Adresse, die Sprache und die Termine der Demo sieben Tage lang. Jede E-Mail enthält einen Link zum Abmelden.",
      "Sie haben nichts eingetragen? Dann ignorieren Sie diese E-Mail einfach. Ohne Bestätigung erhalten Sie keine weitere E-Mail, und Ihre Adresse wird nicht gespeichert."]
    : ["this e-mail address was entered for the demo “From inbox to job” on rexity.ai/automation/rpa: the e-mails the agent writes in the demo are to go to this address.",
      "Please confirm that this is your address:", link, "The link is valid for 48 hours.",
      "After confirming you will receive the e-mails of this demo (appointment confirmation, copy to the serviceman, reminder at 9:00 the day before) at this address, at most 10 a day and 30 a week. For that we store the address, the language and the demo's appointments for seven days. Every e-mail contains an unsubscribe link.",
      "You did not enter anything? Then simply ignore this e-mail. Without confirmation you will not receive any further e-mail, and your address is not stored."];
  const hello = de ? "Guten Tag," : "Hello,";
  const button = de ? "Adresse bestätigen" : "Confirm the address";
  const html = `<div style="font-family:sans-serif;font-size:14px;line-height:1.5;color:#111"><p>${esc(hello)}</p><p>${esc(lines[0])}</p><p>${esc(lines[1])}</p>` +
    `<p><a href="${esc(link)}" style="display:inline-block;padding:10px 16px;background:#17152b;color:#fff;text-decoration:none;border-radius:6px">${esc(button)}</a></p>` +
    `<p style="font-size:12px;color:#555">${esc(lines[3])}</p><p style="font-size:12px;color:#555">${esc(lines[4])}</p><p style="font-size:12px;color:#555">${esc(lines[5])}</p><p>${S.SIGNATURE.map(esc).join("<br>")}</p></div>`;
  return { subject: de ? "Bitte bestätigen: Ihre Adresse für die RPA-Demo" : "Please confirm: your address for the RPA demo", textContent: [hello, "", lines[0], "", lines[1], lines[2], "", lines[3], "", lines[4], "", lines[5], "", ...S.SIGNATURE].join("\n"), htmlContent: html };
}
/* The double opt-in mail: a fixed text and a signed link to the address the visitor entered as his own.
   -> { sent: true } | { sent: false, reason: "off" | "optout" | "cap_address" | "cap_day" | "store" | "mail_failed" } */
async function sendConfirmation(email, sid, lang) {
  if (!(await mailAvailable())) return { sent: false, reason: "off" };
  const out = await optedOut(email);
  if (out === null) return { sent: false, reason: "store" };
  if (out) return { sent: false, reason: "optout" };
  // at most CONFIRM_PER_ADDRESS confirmation mails per address and day, counted in the shared store (fail closed)
  const perAddress = await S.capBump(`rpaconfa:${addressKey(email)}:${S.today().day}`, 1, 2 * 86400);
  if (perAddress === null) return { sent: false, reason: "store" };
  if (perAddress > CONFIRM_PER_ADDRESS) return { sent: false, reason: "cap_address" };
  const refused = await takeDay();
  if (refused) return { sent: false, reason: refused === "store" ? "store" : "cap_day" };
  const mail = confirmationMail(confirmLink(email, sid, lang), lang);
  let sent = null;
  try { sent = await notifier().sendMail({ to: email, subject: mail.subject, textContent: mail.textContent, htmlContent: mail.htmlContent }); } catch (_e) { sent = null; }
  if (!sent || !sent.sent) { console.log("[rpa] confirmation mail sent=false reason=" + ((sent && sent.reason) || "unknown")); return { sent: false, reason: "mail_failed" }; }
  return { sent: true };
}

// ---- The reminder job ------------------------------------------------------------------------------------------------------
const reminderKey = (a) => a.id + "@" + a.date;
const apptOk = (a) => a && typeof a === "object" && /^[a-z0-9-]{3,40}$/.test(String(a.id)) && C.DAY_RE.test(String(a.date)) && C.winOf(a.win) && C.techOf(a.tech);
/* One reminder for one stored appointment of a confirmed session, claimed before it goes out.
   -> "sent" | "already" | "failed" | "cap" | "store" | "bad" */
async function remindOne(hash, row, appt) {
  if (!apptOk(appt)) return "bad";
  const key = reminderKey(appt);
  if (row.reminded.includes(key)) return "already";
  const got = await claim(hash, key);
  if (got === null) return "store";
  if (!got) return "already";
  const r = await deliver(null, "reminder", { tech: appt.tech, date: appt.date, win: appt.win, topic: appt.topic }, row.lang, { ok: true, row });
  if (r.sent) return "sent";
  // The claim is given back only when the mail certainly did not go out (a cap, a refusal by the provider): then a
  // later run may send it. After a timeout nobody knows, so the claim stays: never two reminders for one appointment.
  const certain = r.reason === "cap_address" || r.reason === "cap_day" || r.reason === "store" || r.reason === "bad" || (r.reason === "mail_failed" && /^(http_|not_configured|bad_address)/.test(String(r.detail)));
  if (certain) await release(hash, key);
  return r.reason === "cap_address" || r.reason === "cap_day" ? "cap" : r.reason === "store" ? "store" : "failed";
}
const BATCH = 60; // sessions per run
/* -> { ready, day (run), due (date), sessions, sent, already, failed, capped } */
async function runReminders(opts) {
  const now = C.berlinNow(S.deps.now());
  const dueDay = C.dayPlus(now.day, 1);
  const out = { ready: true, day: now.day, due: dueDay, sessions: 0, appointments: 0, sent: 0, already: 0, failed: 0, capped: 0 };
  await purge();
  if (!(await mailAvailable())) { out.ready = false; out.reason = "mail_off"; return out; }
  const rows = await due(dueDay, BATCH);
  if (rows === null) { out.ready = false; out.reason = "store"; return out; }
  for (const row of rows) {
    out.sessions++;
    const gone = await optedOut(row.email);
    if (gone !== false) { if (gone === null) { out.ready = false; out.reason = "store"; break; } continue; }
    for (const appt of row.appts.filter((a) => a && a.date === dueDay).slice(0, 5)) {
      out.appointments++;
      if (opts && opts.dry) continue;
      const r = await remindOne(row.hash, row, appt);
      if (r === "sent") { out.sent++; row.reminded.push(reminderKey(appt)); }
      else if (r === "already") out.already++;
      else if (r === "cap") out.capped++;
      else out.failed++;
    }
  }
  if (!(opts && opts.dry)) await count("rparemrun", 1);
  return out;
}

module.exports = {
  PAGE, ENDPOINT, CAPS, SID_RE, SESSION_TTL_S, MAX_APPTS, BODY,
  sessionGet, sessionConfirm, sessionSync, sessionDelete, optedOut, optOut, mailAvailable, count,
  confirmLink, readConfirmLink, stopLink, readStopLink, sealOf, sealValid, checkBody, cleanFacts, line, clean, LINK_RE, PRICE_RE, PROMISE_RE,
  deliver, sendConfirmation, remindOne, runReminders, reminderKey, apptOk, wrap, confirmationMail, NOTE,
  _test: { mem, sidHash, emailHash, takeMail, takeDay, claim, release, due, purge, addressKey, reset() { mem.sessions.clear(); mem.optout.clear(); storeOffUntil = 0; countOffUntil = 0; } }
};
