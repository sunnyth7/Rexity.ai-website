// /api/digest — one mail a day to us with yesterday's numbers of the Website-Check and the assistant (Sprint 30).
// Called by Vercel Cron (vercel.json "crons": once a day, 05:15 UTC). Protected the way Vercel documents it: the
// project variable CRON_SECRET is sent as "Authorization: Bearer <CRON_SECRET>" with every cron invocation
// (vercel.com/docs/cron-jobs/manage-cron-jobs, read 2 Oct 2026). Without the variable the function refuses every
// request; nothing here can be triggered from outside.
//
// What it reads (Supabase, the same project and service-role key as api/lead.js; read-only):
//   check_usage  buckets of yesterday (Europe/Berlin): checks, apichecks, mails, reports, summaries (model calls for
//                the Kurzfazit, answered; also those whose text was then rejected by the guard), botfail
//   chat_usage   bucket day:<yesterday>: number of model answers and their estimated USD (chat and Kurzfazit together)
// Only numbers that are stored there. No visitor data exists in these tables and none is mailed: no address, no
// e-mail, no IP, no chat text. Status codes (4xx/5xx) and limiter hits are not stored anywhere and are therefore
// not in the mail; they are in Vercel's logs.
//
// A counter without a row is reported as "kein Eintrag": the day had none, or the shared store was not reachable,
// or (apichecks, reports, summaries, botfail) docs/sql/check_usage_keys.sql has not been applied yet.
// Vercel may deliver a cron run twice or not at all (same page): a second mail for the same day is harmless.
//
// Sprint 34 (docs/seo/CHECK_METRICS.md):
//   - more counters in the daily mail: cached, cards, apiget, mcpcalls, ratehits, usdmicro, followups, optouts
//     (they need docs/sql/check_usage_keys_s34.sql; until then "kein Eintrag"). Limiter hits of the function are
//     now stored (ratehits); other error answers and what the Vercel Firewall refuses still are not.
//   - a weekly summary, sent on Mondays (Europe/Berlin) after the daily mail: the same counters summed over the
//     seven days before today, with the number of days that had an entry, and shares computed only when both
//     numbers exist and the denominator is not zero. A counter without any entry is "kein Eintrag", never a zero.
//   - by hand, with the same secret: GET /api/digest?weekly=1 sends the weekly summary on any day, and
//     &days=28 (7 to 35) widens it, for the review 28 days after the release.

const deps = {
  fetch: (...a) => fetch(...a),
  now: () => Date.now(),
  notify: null // default: api/_notify.js (tests replace it)
};

const CHECK_KINDS = ["checks", "apichecks", "mails", "reports", "summaries", "botfail", "cached", "cards", "apiget", "mcpcalls", "ratehits", "usdmicro", "followups", "optouts"];

function berlinDay(ms) {
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms)); }
  catch (_e) { return new Date(ms).toISOString().slice(0, 10); }
}
const sameSecret = (a, b) => {
  const crypto = require("crypto");
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};

// -> rows of one table, or null when it cannot be read (not configured, table missing, error, no answer in 4 s)
async function readRows(table, query) {
  const base = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!base || !key) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const resp = await deps.fetch(`${base}/rest/v1/${table}?${query}`, { headers: { apikey: key, Authorization: "Bearer " + key, Accept: "application/json" }, signal: ctrl.signal });
    if (!resp.ok) { await resp.text().catch(() => ""); console.error("[digest] " + table + " HTTP " + resp.status); return null; }
    const rows = await resp.json();
    return Array.isArray(rows) ? rows : null;
  } catch (e) {
    console.error("[digest] " + table + " " + (e && e.name === "AbortError" ? "timeout" : "network"));
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// -> { day, check: { kind: number|null }, checkReadable, chat: { answers, usd } | null, chatReadable }
async function collect(day) {
  const keys = CHECK_KINDS.map((k) => `${k}:${day}`);
  const [checkRows, chatRows] = await Promise.all([
    readRows("check_usage", "select=bucket,count&bucket=in.(" + keys.map((k) => `"${k}"`).join(",") + ")"),
    readRows("chat_usage", "select=bucket,count,usd&bucket=eq." + encodeURIComponent("day:" + day))
  ]);
  const check = {};
  for (const k of CHECK_KINDS) {
    const row = (checkRows || []).find((r) => r && r.bucket === `${k}:${day}`);
    check[k] = row && Number.isFinite(Number(row.count)) ? Number(row.count) : null;
  }
  const c = (chatRows || []).find((r) => r && r.bucket === "day:" + day);
  return { day, check, checkReadable: checkRows !== null, chat: c ? { answers: Number(c.count) || 0, usd: Number(c.usd) || 0 } : null, chatReadable: chatRows !== null };
}

const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const NO_ENTRY_NOTE = "„kein Eintrag“ heißt: Es wurde nichts gezählt, der gemeinsame Speicher war nicht erreichbar oder die Zähler-Erweiterungen (docs/sql/check_usage_keys.sql, docs/sql/check_usage_keys_s34.sql) sind noch nicht eingespielt.";
const NOT_STORED_NOTE = "Gezählt werden nur die Antworten 429 der Funktion selbst. Andere Fehlerantworten (4xx/5xx) und Anfragen, die schon die Vercel-Firewall abweist, werden nicht gespeichert; sie stehen in den Vercel-Logs.";
const deNum = (v, digits) => v.toFixed(digits).replace(".", ",");
// millionths of a US dollar -> "0,0025 USD (Schätzung)"; null -> "kein Eintrag"
const usdOf = (micro) => (micro === null || micro === undefined ? "kein Eintrag" : `${deNum(micro / 1e6, 4)} USD (Schätzung aus Token-Zahlen und Listenpreisen)`);
const deDate = (day) => { const [y, m, d] = day.split("-"); return `${d}.${m}.${y}`; };
const mailBody = (text) => `<pre style="font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.5">${esc(text)}</pre>`;

// ---- Sprint 34: the weekly summary ---------------------------------------------------------------------
// The `count` Berlin days before the day of `nowMs`, oldest first.
function lastDays(nowMs, count) {
  const out = [];
  const seen = new Set();
  // step back 24 hours from noon UTC of today's Berlin date: no day is skipped or doubled when the clocks change
  const [y, m, d] = berlinDay(nowMs).split("-").map(Number);
  const noon = Date.UTC(y, m - 1, d, 12);
  for (let i = 1; out.length < count && i <= count + 2; i++) {
    const day = berlinDay(noon - i * 24 * 60 * 60 * 1000);
    if (!seen.has(day)) { seen.add(day); out.unshift(day); }
  }
  return out;
}
const isBerlinMonday = (nowMs) => {
  try { return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", weekday: "short" }).format(new Date(nowMs)) === "Mon"; }
  catch (_e) { return new Date(nowMs).getUTCDay() === 1; }
};

// -> { days, check: { kind: { sum, days } | null }, checkReadable, chat: { answers, usd, days } | null, chatReadable }
// A counter is null when none of the days has a row for it (it is then reported as "kein Eintrag").
async function collectRange(days) {
  const keys = [];
  for (const day of days) for (const k of CHECK_KINDS) keys.push(`"${k}:${day}"`);
  const [checkRows, chatRows] = await Promise.all([
    readRows("check_usage", "select=bucket,count&bucket=in.(" + keys.join(",") + ")"),
    readRows("chat_usage", "select=bucket,count,usd&bucket=in.(" + days.map((d) => `"day:${d}"`).join(",") + ")")
  ]);
  const check = {};
  for (const k of CHECK_KINDS) {
    let sum = 0;
    let withRow = 0;
    for (const day of days) {
      const row = (checkRows || []).find((r) => r && r.bucket === `${k}:${day}`);
      if (row && Number.isFinite(Number(row.count))) { sum += Number(row.count); withRow++; }
    }
    check[k] = withRow ? { sum, days: withRow } : null;
  }
  let answers = 0;
  let usd = 0;
  let chatDays = 0;
  for (const day of days) {
    const row = (chatRows || []).find((r) => r && r.bucket === "day:" + day);
    if (row) { answers += Number(row.count) || 0; usd += Number(row.usd) || 0; chatDays++; }
  }
  return { days, check, checkReadable: checkRows !== null, chat: chatDays ? { answers, usd, days: chatDays } : null, chatReadable: chatRows !== null };
}

// A share of two counters, only when both have entries and the denominator is not zero.
function shareLine(label, part, whole, unit) {
  if (!part || !whole) return `  ${label}: nicht berechenbar (kein Eintrag für ${[!part && unit[0], !whole && unit[1]].filter(Boolean).join(" und ")})`;
  if (whole.sum === 0) return `  ${label}: nicht berechenbar (${unit[1]}: 0)`;
  return `  ${label}: ${deNum((part.sum / whole.sum) * 100, 1)} % (${part.sum} von ${whole.sum})`;
}

function weeklyMail(w) {
  const total = w.days.length;
  const from = deDate(w.days[0]);
  const to = deDate(w.days[total - 1]);
  const c = w.check;
  const n = (v) => (v ? `${v.sum} (Einträge an ${v.days} von ${total} Tagen)` : "kein Eintrag");
  const lines = [`${total === 7 ? "Wochenzahlen" : "Zahlen über " + total + " Tage"}: ${from} bis ${to} (Europe/Berlin)`, ""];
  lines.push("Website-Check (Summen)");
  if (!w.checkReadable) lines.push("  Die Zähler waren nicht lesbar (Supabase nicht eingerichtet, Tabelle check_usage fehlt oder keine Antwort).");
  else {
    lines.push(`  Neue Prüfungen: ${n(c.checks)}`);
    lines.push(`  davon über GET /api/check und MCP: ${n(c.apichecks)}`);
    lines.push(`  Aus dem Zwischenspeicher beantwortete Prüf-Anfragen: ${n(c.cached)}`);
    lines.push(`  Berichts-Anforderungen: ${n(c.mails)}`);
    lines.push(`  Bestätigte Berichte (vollständiger Bericht versendet): ${n(c.reports)}`);
    lines.push(`  Aufrufe der Ergebnis-Karte: ${n(c.cards)}`);
    lines.push(`  Anfragen über GET /api/check (Assistenten und Programme): ${n(c.apiget)}`);
    lines.push(`  Aufrufe des MCP-Werkzeugs: ${n(c.mcpcalls)}`);
    lines.push(`  Von der Bot-Prüfung abgewiesen: ${n(c.botfail)}`);
    lines.push(`  Treffer der Limits (Antwort 429 der Funktion): ${n(c.ratehits)}`);
    lines.push(`  Aufrufe des Sprachmodells für das Kurzfazit: ${n(c.summaries)}`);
    lines.push(`  Geschätzte Kosten des Kurzfazits: ${c.usdmicro ? usdOf(c.usdmicro.sum) + `, Einträge an ${c.usdmicro.days} von ${total} Tagen` : "kein Eintrag"}`);
    lines.push(`  Nachfass-E-Mails versendet: ${n(c.followups)}`);
    lines.push(`  Abmeldungen über den Link der Nachfass-E-Mail: ${n(c.optouts)}`);
    lines.push("", "Anteile (nur berechnet, wenn beide Zahlen einen Eintrag haben und der Nenner nicht 0 ist)");
    lines.push(shareLine("Berichts-Anforderungen je neuer Prüfung", c.mails, c.checks, ["Berichts-Anforderungen", "neue Prüfungen"]));
    lines.push(shareLine("Bestätigte Berichte je Berichts-Anforderung", c.reports, c.mails, ["bestätigte Berichte", "Berichts-Anforderungen"]));
    lines.push(shareLine("Bestätigte Berichte je neuer Prüfung", c.reports, c.checks, ["bestätigte Berichte", "neue Prüfungen"]));
    lines.push(shareLine("Neue Prüfungen über GET und MCP je neuer Prüfung", c.apichecks, c.checks, ["Prüfungen über GET und MCP", "neue Prüfungen"]));
    lines.push(shareLine("Aufrufe der Ergebnis-Karte je neuer Prüfung", c.cards, c.checks, ["Aufrufe der Ergebnis-Karte", "neue Prüfungen"]));
    lines.push(shareLine("Abmeldungen je Nachfass-E-Mail", c.optouts, c.followups, ["Abmeldungen", "Nachfass-E-Mails"]));
    lines.push(!c.usdmicro || !c.checks
      ? `  Geschätzte Kosten des Kurzfazits je neuer Prüfung: nicht berechenbar (kein Eintrag für ${[!c.usdmicro && "Kosten", !c.checks && "neue Prüfungen"].filter(Boolean).join(" und ")})`
      : c.checks.sum === 0 ? "  Geschätzte Kosten des Kurzfazits je neuer Prüfung: nicht berechenbar (neue Prüfungen: 0)"
      : `  Geschätzte Kosten des Kurzfazits je neuer Prüfung: ${deNum(c.usdmicro.sum / 1e6 / c.checks.sum, 4)} USD`);
  }
  lines.push("", "Sprachmodell (Assistent und Kurzfazit zusammen)");
  if (!w.chatReadable) lines.push("  Die Zähler waren nicht lesbar (Supabase nicht eingerichtet, Tabelle chat_usage fehlt oder keine Antwort).");
  else if (!w.chat) lines.push("  Modellantworten: kein Eintrag", "  Geschätzte Kosten: kein Eintrag");
  else {
    lines.push(`  Modellantworten: ${w.chat.answers} (Einträge an ${w.chat.days} von ${total} Tagen)`);
    lines.push(`  Geschätzte Kosten: ${deNum(w.chat.usd, 4)} USD (Schätzung aus Token-Zahlen und Listenpreisen, keine Rechnung)`);
  }
  lines.push("", "Ein Tag ohne Eintrag zählt nicht als 0: An dem Tag wurde nichts gezählt, oder der gemeinsame Speicher war nicht erreichbar. Die Summen enthalten nur die Tage mit Eintrag.");
  lines.push(NO_ENTRY_NOTE);
  lines.push(NOT_STORED_NOTE);
  lines.push("Nicht in diesen Zahlen: gebuchte Gespräche (sie kommen über das Kontaktformular, per E-Mail oder Telefon und werden von Hand gezählt).");
  lines.push("Was jede Zahl bedeutet: docs/seo/CHECK_METRICS.md. Diese E-Mail enthält keine Besucherdaten.");
  const text = lines.join("\n");
  return { subject: `Website-Check: ${total === 7 ? "Wochenzahlen" : total + " Tage"} ${from} bis ${to}`, textContent: text, htmlContent: mailBody(text) };
}
function digestMail(d) {
  const [y, m, dd] = d.day.split("-");
  const date = `${dd}.${m}.${y}`;
  const n = (v) => (v === null || v === undefined ? "kein Eintrag" : String(v));
  const lines = [];
  lines.push(`Zahlen für ${date} (Europe/Berlin)`, "");
  lines.push("Website-Check");
  if (!d.checkReadable) lines.push("  Die Zähler waren nicht lesbar (Supabase nicht eingerichtet, Tabelle check_usage fehlt oder keine Antwort).");
  else {
    lines.push(`  Neue Prüfungen: ${n(d.check.checks)}`);
    lines.push(`  davon über GET /api/check und MCP: ${n(d.check.apichecks)}`);
    lines.push(`  Aus dem Zwischenspeicher beantwortete Prüf-Anfragen: ${n(d.check.cached)}`);
    lines.push(`  Berichts-Anforderungen (je eine E-Mail: Bestätigungslink oder Bericht): ${n(d.check.mails)}`);
    lines.push(`  Vollständige Berichte versendet: ${n(d.check.reports)}`);
    lines.push(`  Aufrufe der Ergebnis-Karte: ${n(d.check.cards)}`);
    lines.push(`  Anfragen über GET /api/check (Assistenten und Programme): ${n(d.check.apiget)}`);
    lines.push(`  Aufrufe des MCP-Werkzeugs: ${n(d.check.mcpcalls)}`);
    lines.push(`  Aufrufe des Sprachmodells für das Kurzfazit: ${n(d.check.summaries)}`);
    lines.push(`  Geschätzte Kosten des Kurzfazits: ${usdOf(d.check.usdmicro)}`);
    lines.push(`  Von der Bot-Prüfung abgewiesen: ${n(d.check.botfail)}`);
    lines.push(`  Treffer der Limits (Antwort 429 der Funktion): ${n(d.check.ratehits)}`);
    lines.push(`  Nachfass-E-Mails versendet: ${n(d.check.followups)}`);
    lines.push(`  Abmeldungen über den Link der Nachfass-E-Mail: ${n(d.check.optouts)}`);
  }
  lines.push("", "Sprachmodell (Assistent und Kurzfazit zusammen)");
  if (!d.chatReadable) lines.push("  Die Zähler waren nicht lesbar (Supabase nicht eingerichtet, Tabelle chat_usage fehlt oder keine Antwort).");
  else if (!d.chat) lines.push("  Modellantworten: kein Eintrag", "  Geschätzte Kosten: kein Eintrag");
  else {
    lines.push(`  Modellantworten: ${d.chat.answers}`);
    if (d.check.summaries !== null && d.chat.answers >= d.check.summaries) lines.push(`  davon Antworten des Assistenten: ${d.chat.answers - d.check.summaries}`);
    lines.push(`  Geschätzte Kosten: ${d.chat.usd.toFixed(4).replace(".", ",")} USD (Schätzung aus Token-Zahlen und Listenpreisen, keine Rechnung)`);
  }
  const ceiling = parseFloat(String(process.env.CHAT_DAILY_USD_CEILING || "").trim());
  lines.push(`  Tagesobergrenze: ${(Number.isFinite(ceiling) && ceiling >= 0 ? ceiling : 2).toString().replace(".", ",")} USD (CHAT_DAILY_USD_CEILING)`);
  lines.push("", NO_ENTRY_NOTE);
  lines.push(NOT_STORED_NOTE);
  lines.push("Diese E-Mail enthält keine Besucherdaten.");
  const text = lines.join("\n");
  return { subject: `Website-Check und Assistent: Zahlen vom ${date}`, textContent: text, htmlContent: mailBody(text) };
}

async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const secret = String(process.env.CRON_SECRET || "").trim();
  const auth = req.headers && typeof req.headers.authorization === "string" ? req.headers.authorization : "";
  if (!secret || !sameSecret(auth, "Bearer " + secret)) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ ok: false, error: "unauthorized" }));
  }
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    return res.end(JSON.stringify({ ok: false, error: "method" }));
  }
  const notify = deps.notify || require("./_notify");
  const to = String(process.env.DIGEST_TO || process.env.LEAD_NOTIFY_TO || "info@rexity.ai").trim();
  let query;
  try { query = new URL(String(req.url || "/"), "https://www.rexity.ai").searchParams; } catch (_e) { query = new URLSearchParams(); }
  const byHand = query.get("weekly") === "1"; // only the weekly summary, on any day
  let day = null;
  let data = null;
  let sent = null;
  if (!byHand) {
    day = berlinDay(deps.now() - 24 * 60 * 60 * 1000);
    data = await collect(day);
    const mail = digestMail(data);
    sent = await notify.sendMail({ to, subject: mail.subject, textContent: mail.textContent, htmlContent: mail.htmlContent });
    console.log("[digest] day=" + day + " sent=" + Boolean(sent && sent.sent) + (sent && !sent.sent ? " reason=" + (sent.reason || "unknown") : ""));
  }
  // Sprint 34: the weekly summary, on Mondays (Europe/Berlin) after the daily mail, or by hand with ?weekly=1[&days=7…35]
  let weekly = null;
  if (byHand || isBerlinMonday(deps.now())) {
    const asked = parseInt(query.get("days") || "", 10);
    const span = byHand && Number.isFinite(asked) ? Math.min(35, Math.max(7, asked)) : 7;
    const range = await collectRange(lastDays(deps.now(), span));
    const wm = weeklyMail(range);
    const ws = await notify.sendMail({ to, subject: wm.subject, textContent: wm.textContent, htmlContent: wm.htmlContent });
    console.log("[digest] weekly days=" + span + " sent=" + Boolean(ws && ws.sent) + (ws && !ws.sent ? " reason=" + (ws.reason || "unknown") : ""));
    weekly = { sent: Boolean(ws && ws.sent), from: range.days[0], to: range.days[range.days.length - 1], days: span, check: range.check, chat: range.chat, readable: { check: range.checkReadable, chat: range.chatReadable } };
  }
  const ok = (byHand || Boolean(sent && sent.sent)) && (!weekly || weekly.sent);
  res.statusCode = ok ? 200 : 502;
  const out = byHand ? { ok, weekly } : { ok, day, check: data.check, chat: data.chat, readable: { check: data.checkReadable, chat: data.chatReadable } };
  if (!byHand && weekly) out.weekly = weekly;
  return res.end(JSON.stringify(out));
}

module.exports = handler;
module.exports._test = { deps, collect, digestMail, berlinDay, CHECK_KINDS, collectRange, weeklyMail, lastDays, isBerlinMonday, shareLine };
