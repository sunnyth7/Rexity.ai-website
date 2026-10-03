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
//
// Sprint 35 (docs/CHECK_QUOTA.md, docs/RETENTION.md):
//   - quota hits by kind (quotaip, quotahour, quotaday; docs/sql/check_quota.sql)
//   - Claude on Amazon Bedrock: yesterday's estimated spend, the number of calls, the ceiling and whether it was
//     reached (chat_usage buckets claude:<day> and claudestop:<day>; docs/sql/claude_budget.sql)
//   - "Geprüfte Adressen gestern": the addresses checked yesterday, from public.check_runs (docs/sql/check_runs.sql).
//     These are addresses of websites, without anything about who asked: no IP address, no e-mail address.
//   - the daily retention purge (six months): the one place where this function WRITES. It calls
//     public.site_retention_purge (docs/sql/retention.sql) with a cutoff 183 days back. Unless RETENTION_PURGE is
//     exactly "1" it is a dry run that only counts; the mail reports the numbers either way. Only the daily cron
//     run does this, never ?weekly=1.

const deps = {
  fetch: (...a) => fetch(...a),
  now: () => Date.now(),
  notify: null // default: api/_notify.js (tests replace it)
};

const CHECK_KINDS = ["checks", "apichecks", "mails", "reports", "summaries", "botfail", "cached", "cards", "apiget", "mcpcalls", "ratehits", "usdmicro", "followups", "optouts", "quotaip", "quotahour", "quotaday",
  // Sprint 40: confirmed reports with paid lookups, the DataForSEO calls made for them and what their answers reported as cost
  "paidruns", "lookups", "dfsmicro",
  // Sprint 42 (RPA demo's sandbox agent; docs/sql/rpa_agent.sql): agent runs with an own text, confirmed addresses,
  // demo mails delivered, runs of the 9:00 reminder job and the reminders it (or the page) delivered, opt-outs
  "rparuns", "rpaconf", "rpasent", "rparemrun", "rparem", "rpastop"];
const RETENTION_DAYS = 183; // six months (founder, 2 Oct 2026)
const RUN_LIST_MAX = 50; // lines of "Geprüfte Adressen gestern" in the mail
// The Claude ceiling as api/chat.js computes it (same variables, same defaults and ranges)
const numEnv = (name, def, min, max) => {
  const v = parseFloat(String(process.env[name] || "").trim().replace(",", "."));
  return Number.isFinite(v) && v >= min && v <= max ? v : def;
};
const claudeBudget = () => {
  const eur = numEnv("CLAUDE_DAILY_EUR_CEILING", 3, 0, 1000);
  const rate = numEnv("EUR_USD_RATE", 1, 0.5, 2);
  return { eur, rate, usd: Math.round(eur * rate * 1e6) / 1e6 };
};

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

// The six-months purge (docs/sql/retention.sql). -> { dryRun, leads, appointments, addressLog, kept, cutoff } or
// { error } when the function is not installed or did not answer. With dryRun nothing is deleted.
async function retentionPurge(nowMs) {
  const base = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const dryRun = String(process.env.RETENTION_PURGE || "").trim() !== "1";
  const cutoff = new Date(nowMs - RETENTION_DAYS * 86400000).toISOString();
  if (!base || !key) return { dryRun, cutoff, error: "not_configured" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000); // the function has Vercel's default duration; reads (4 s) + this + two mails must fit
  try {
    const resp = await deps.fetch(`${base}/rest/v1/rpc/site_retention_purge`, {
      method: "POST",
      headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ p_cutoff: cutoff, p_dry_run: dryRun }),
      signal: ctrl.signal
    });
    if (!resp.ok) { await resp.text().catch(() => ""); console.error("[digest] retention purge HTTP " + resp.status); return { dryRun, cutoff, error: "http_" + resp.status }; }
    const data = await resp.json();
    const row = Array.isArray(data) ? data[0] : data;
    const out = row && typeof row === "object" && row.site_retention_purge && typeof row.site_retention_purge === "object" ? row.site_retention_purge : row;
    if (!out || typeof out !== "object" || typeof out.dry_run !== "boolean") return { dryRun, cutoff, error: "unexpected" };
    const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const r = { dryRun: out.dry_run, cutoff, leads: n(out.leads), appointments: n(out.appointments), addressLog: n(out.address_log), kept: n(out.leads_kept_for_appointment) };
    console.log(`[digest] retention purge dry_run=${r.dryRun} leads=${r.leads} appointments=${r.appointments} address_log=${r.addressLog} kept=${r.kept} cutoff=${cutoff.slice(0, 10)}`);
    return r;
  } catch (e) {
    console.error("[digest] retention purge " + (e && e.name === "AbortError" ? "timeout" : "network"));
    return { dryRun, cutoff, error: e && e.name === "AbortError" ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

// -> { day, check: { kind: number|null }, checkReadable, chat: { answers, usd } | null, chatReadable,
//      claude: { usd, calls, refused } | null, runs: [{ url, runs, cached, door, score, status }] | null }
async function collect(day) {
  const keys = CHECK_KINDS.map((k) => `${k}:${day}`);
  const [checkRows, chatRows, runRows] = await Promise.all([
    readRows("check_usage", "select=bucket,count&bucket=in.(" + keys.map((k) => `"${k}"`).join(",") + ")"),
    readRows("chat_usage", "select=bucket,count,usd&bucket=in.(" + [`"day:${day}"`, `"claude:${day}"`, `"claudestop:${day}"`].join(",") + ")"),
    readRows("check_runs", `select=url,runs,cached,door,score,status&day=eq.${day}&order=runs.desc,url.asc&limit=2000`)
  ]);
  const check = {};
  for (const k of CHECK_KINDS) {
    const row = (checkRows || []).find((r) => r && r.bucket === `${k}:${day}`);
    check[k] = row && Number.isFinite(Number(row.count)) ? Number(row.count) : null;
  }
  const c = (chatRows || []).find((r) => r && r.bucket === "day:" + day);
  const cl = (chatRows || []).find((r) => r && r.bucket === "claude:" + day);
  const stop = (chatRows || []).find((r) => r && r.bucket === "claudestop:" + day);
  const claude = cl || stop ? { usd: cl ? Number(cl.usd) || 0 : 0, calls: cl ? Number(cl.count) || 0 : 0, refused: stop ? Number(stop.count) || 0 : 0 } : null;
  const runs = runRows === null ? null : runRows.filter((r) => r && typeof r.url === "string").map((r) => ({ url: r.url, runs: Number(r.runs) || 0, cached: Number(r.cached) || 0, door: String(r.door || ""), score: r.score === null || r.score === undefined ? null : Number(r.score), status: String(r.status || "") }));
  return { day, check, checkReadable: checkRows !== null, chat: c ? { answers: Number(c.count) || 0, usd: Number(c.usd) || 0 } : null, chatReadable: chatRows !== null, claude, runs };
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
    lines.push(`  davon Kontingent je IP-Adresse erreicht: ${n(c.quotaip)}`);
    lines.push(`  davon Kontingent je Stunde erreicht: ${n(c.quotahour)}`);
    lines.push(`  davon Kontingent je Tag erreicht: ${n(c.quotaday)}`);
    lines.push(`  Aufrufe des Sprachmodells für das Kurzfazit: ${n(c.summaries)}`);
    lines.push(`  Geschätzte Kosten des Kurzfazits: ${c.usdmicro ? usdOf(c.usdmicro.sum) + `, Einträge an ${c.usdmicro.days} von ${total} Tagen` : "kein Eintrag"}`);
    lines.push(`  Berichte mit Google-Position und Backlinks (bezahlte Abfragen): ${n(c.paidruns)}`);
    lines.push(`  davon Abfragen bei DataForSEO: ${n(c.lookups)}`);
    lines.push(`  Kosten laut den Antworten von DataForSEO: ${c.dfsmicro ? deNum(c.dfsmicro.sum / 1e6, 4) + " USD" + `, Einträge an ${c.dfsmicro.days} von ${total} Tagen` : "kein Eintrag"}`);
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
// ---- Sprint 41 (own block): the Automatisierungs-Check and its language model ---------------------------------------------
// Counters of api/automation-check.js (check_usage) and the Gemini ceiling of api/_gemini.js (chat_usage buckets
// gemini:<day>, geministop:<day>; docs/sql/auto_check.sql). Also removes expired waiting entries of report requests.
const AUTO_KINDS = ["autoruns", "automodel", "autofallback", "autoquota", "automails", "autoreports", "autocallbacks", "autobookings"];
// -> { counts: { kind: number|null } | null (not readable), gemini: { usd, calls, refused } | null, geminiReadable, purged: number|null }
async function collectAuto(day) {
  const [rows, chatRows] = await Promise.all([
    readRows("check_usage", "select=bucket,count&bucket=in.(" + AUTO_KINDS.map((k) => `"${k}:${day}"`).join(",") + ")"),
    readRows("chat_usage", "select=bucket,count,usd&bucket=in.(" + [`"gemini:${day}"`, `"geministop:${day}"`].join(",") + ")")
  ]);
  let counts = null;
  if (rows !== null) {
    counts = {};
    for (const k of AUTO_KINDS) {
      const row = rows.find((r) => r && r.bucket === `${k}:${day}`);
      counts[k] = row && Number.isFinite(Number(row.count)) ? Number(row.count) : null;
    }
  }
  const g = (chatRows || []).find((r) => r && r.bucket === "gemini:" + day);
  const stop = (chatRows || []).find((r) => r && r.bucket === "geministop:" + day);
  const gemini = g || stop ? { usd: g ? Number(g.usd) || 0 : 0, calls: g ? Number(g.count) || 0 : 0, refused: stop ? Number(stop.count) || 0 : 0 } : null;
  // expired waiting entries (ciphertext only) are removed once a day; null: function not installed or no answer
  let purged = null;
  const base = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (base && key) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    try {
      const resp = await deps.fetch(`${base}/rest/v1/rpc/auto_pending_purge`, { method: "POST", headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: "{}", signal: ctrl.signal });
      const text = await resp.text().catch(() => "");
      if (resp.ok && /^\s*\d+\s*$/.test(text)) purged = parseInt(text, 10);
    } catch (_e) { /* the rows expire by themselves and are never returned after 48 hours */ } finally { clearTimeout(timer); }
  }
  return { counts, gemini, geminiReadable: chatRows !== null, purged };
}
function autoLines(a) {
  if (!a) return [];
  const n = (v) => (v === null || v === undefined ? "kein Eintrag" : String(v));
  const ceiling = numEnv("GEMINI_DAILY_USD_CEILING", 3, 0, 1000);
  const lines = ["", "Automatisierungs-Check"];
  if (!a.counts) lines.push("  Die Zähler waren nicht lesbar (Supabase nicht eingerichtet, Tabelle check_usage fehlt oder keine Antwort).");
  else {
    lines.push(`  Auswertungen: ${n(a.counts.autoruns)}`);
    lines.push(`  davon vom Sprachmodell formuliert: ${n(a.counts.automodel)}, nach festen Regeln: ${n(a.counts.autofallback)}`);
    lines.push(`  Kontingent erreicht (Antwort 429): ${n(a.counts.autoquota)}`);
    lines.push(`  Berichts-Anforderungen: ${n(a.counts.automails)}`);
    lines.push(`  Bestätigte Berichte (Anfrage gespeichert): ${n(a.counts.autoreports)}`);
    lines.push(`  Rückruf-Bitten: ${n(a.counts.autocallbacks)}`);
    lines.push(`  Terminfenster aus dem Ergebnis geöffnet: ${n(a.counts.autobookings)}`);
  }
  lines.push("  Sprachmodell des Automatisierungs-Checks (eigene Tagesobergrenze)");
  lines.push(`  Tagesobergrenze: ${String(ceiling).replace(".", ",")} USD (GEMINI_DAILY_USD_CEILING)`);
  if (!a.geminiReadable) lines.push("  Die Zähler waren nicht lesbar.");
  else if (!a.gemini) lines.push("  Geschätzte Kosten: kein Eintrag (kein Aufruf; oder docs/sql/auto_check.sql ist nicht eingespielt, dann wird das Modell nicht aufgerufen)");
  else {
    lines.push(`  Geschätzte Kosten: ${deNum(a.gemini.usd, 4)} USD für ${a.gemini.calls} ${a.gemini.calls === 1 ? "Aufruf" : "Aufrufe"}; Schätzung aus Token-Zahlen und dem hinterlegten Preis, keine Rechnung`);
    lines.push(a.gemini.refused > 0 ? `  Obergrenze erreicht: ja (${a.gemini.refused} ${a.gemini.refused === 1 ? "Auswertung lief" : "Auswertungen liefen"} nach festen Regeln)` : "  Obergrenze erreicht: nein");
  }
  if (a.purged !== null && a.purged > 0) lines.push(`  Abgelaufene, nicht bestätigte Berichts-Anforderungen entfernt: ${a.purged}`);
  return lines;
}
// ---- end of the Sprint 41 block ----------------------------------------------------------------------------------------------
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
    lines.push(`  davon Kontingent erreicht: je IP-Adresse ${n(d.check.quotaip)}, je Stunde ${n(d.check.quotahour)}, je Tag ${n(d.check.quotaday)}`);
    lines.push(`  Berichte mit Google-Position und Backlinks (bezahlte Abfragen, nur bestätigte Adressen): ${n(d.check.paidruns)}`);
    lines.push(`  davon Abfragen bei DataForSEO: ${n(d.check.lookups)}`);
    lines.push(`  Kosten laut den Antworten von DataForSEO: ${d.check.dfsmicro === null || d.check.dfsmicro === undefined ? "kein Eintrag" : deNum(d.check.dfsmicro / 1e6, 4) + " USD"}`);
    lines.push(`  Nachfass-E-Mails versendet: ${n(d.check.followups)}`);
    lines.push(`  Abmeldungen über den Link der Nachfass-E-Mail: ${n(d.check.optouts)}`);
    // Sprint 42: the RPA demo's sandbox agent. One line for the reminder job's runs of that day; numbers only.
    lines.push("", "RPA-Demo (Sandbox auf /automation/rpa)");
    lines.push(`  Agentenläufe mit eigenem Text: ${n(d.check.rparuns)}`);
    lines.push(`  Bestätigte Adressen: ${n(d.check.rpaconf)} · Demo-E-Mails an bestätigte Adressen: ${n(d.check.rpasent)} · Abmeldungen: ${n(d.check.rpastop)}`);
    lines.push(`  Erinnerungslauf 9:00 Uhr: Läufe ${n(d.check.rparemrun)}, Erinnerungen versendet ${n(d.check.rparem)}`);
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
  // Sprint 35: Claude on Amazon Bedrock has a ceiling of its own
  const budget = claudeBudget();
  const eurOf = (usd) => deNum(usd / budget.rate, 2);
  lines.push("", "Claude über Amazon Bedrock (eigene Tagesobergrenze)");
  lines.push(`  Tagesobergrenze: ${String(budget.eur).replace(".", ",")} EUR = ${deNum(budget.usd, 2)} USD (CLAUDE_DAILY_EUR_CEILING × EUR_USD_RATE ${String(budget.rate).replace(".", ",")})`);
  if (!d.chatReadable) lines.push("  Die Zähler waren nicht lesbar.");
  else if (!d.claude) lines.push("  Geschätzte Kosten: kein Eintrag (kein Aufruf; oder docs/sql/claude_budget.sql ist nicht eingespielt, dann wird Bedrock nicht aufgerufen)");
  else {
    lines.push(`  Geschätzte Kosten: ${deNum(d.claude.usd, 4)} USD (etwa ${eurOf(d.claude.usd)} EUR zum festen Kurs) für ${d.claude.calls} ${d.claude.calls === 1 ? "Aufruf" : "Aufrufe"}; Schätzung aus Token-Zahlen und dem hinterlegten Preis, keine Rechnung`);
    lines.push(d.claude.refused > 0
      ? `  Obergrenze erreicht: ja (${d.claude.refused} ${d.claude.refused === 1 ? "Aufruf ging" : "Aufrufe gingen"} an den nächsten Anbieter oder bekamen den festen Text)`
      : "  Obergrenze erreicht: nein");
  }
  for (const l of autoLines(d.auto)) lines.push(l); // Sprint 41
  // Sprint 35: the addresses checked yesterday (websites, not visitors)
  lines.push("", "Geprüfte Adressen gestern");
  if (!d.runs) lines.push("  Das Protokoll war nicht lesbar (docs/sql/check_runs.sql nicht eingespielt, Supabase nicht eingerichtet oder keine Antwort).");
  else {
    const fresh = d.runs.filter((r) => r.runs > 0);
    lines.push(`  Neue Prüfungen: ${fresh.reduce((a, r) => a + r.runs, 0)}, verschiedene Adressen: ${fresh.length}`);
    const door = { form: "Formular", get: "GET", mcp: "MCP" };
    for (const r of fresh.slice(0, RUN_LIST_MAX)) {
      const result = r.status && r.status !== "ok" ? r.status : r.score === null ? "kein Gesamtwert" : `${r.score} Punkte`;
      lines.push(`  ${r.url} | ${r.runs} ${r.runs === 1 ? "Prüfung" : "Prüfungen"} | ${result} | ${door[r.door] || r.door}${r.cached > 0 ? ` | ${r.cached}-mal aus dem Zwischenspeicher` : ""}`);
    }
    if (fresh.length > RUN_LIST_MAX) lines.push(`  und ${fresh.length - RUN_LIST_MAX} weitere`);
    const onlyCached = d.runs.filter((r) => r.runs === 0 && r.cached > 0).length;
    if (onlyCached) lines.push(`  Dazu ${onlyCached} ${onlyCached === 1 ? "Adresse" : "Adressen"}, deren Ergebnis nur aus dem Zwischenspeicher angesehen wurde.`);
    lines.push("  Gespeichert werden Adresse, Tag und Ergebnis, 183 Tage lang; keine IP-Adresse, keine E-Mail-Adresse.");
  }
  // Sprint 35: six months retention
  if (d.retention) {
    const r = d.retention;
    const cut = deDate(r.cutoff.slice(0, 10));
    lines.push("", "Aufbewahrung (6 Monate)");
    if (r.error) lines.push(`  Nicht verfügbar (docs/sql/retention.sql nicht eingespielt, Supabase nicht eingerichtet oder keine Antwort): Es wurde nichts gelöscht und nichts gezählt.`);
    else {
      const what = `${r.leads} ${r.leads === 1 ? "Anfrage" : "Anfragen"} der Website (Tabelle Lead)${r.appointments ? ` mit ${r.appointments} ${r.appointments === 1 ? "Terminanfrage" : "Terminanfragen"}` : ""} und ${r.addressLog} ${r.addressLog === 1 ? "Zeile" : "Zeilen"} des Adress-Protokolls, älter als ${cut}`;
      lines.push(r.dryRun ? `  Probelauf, nichts gelöscht (RETENTION_PURGE ist nicht 1). Gelöscht würden: ${what}.` : `  Gelöscht: ${what}.`);
      if (r.kept) lines.push(`  Behalten trotz Alter: ${r.kept} ${r.kept === 1 ? "Anfrage" : "Anfragen"} mit einem Termin, der nicht vom Buchungsformular stammt oder jünger ist.`);
    }
  }
  lines.push("", NO_ENTRY_NOTE);
  lines.push(NOT_STORED_NOTE);
  lines.push("Diese E-Mail enthält keine Besucherdaten: keine IP-Adresse, keine E-Mail-Adresse, keinen Chat-Text. Die geprüften Adressen sind Adressen von Websites.");
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
    data.retention = await retentionPurge(deps.now()); // Sprint 35: a dry run unless RETENTION_PURGE=1
    data.auto = await collectAuto(day); // Sprint 41
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
  const out = byHand ? { ok, weekly } : { ok, day, check: data.check, chat: data.chat, claude: data.claude, addresses: data.runs ? { checks: data.runs.reduce((a, r) => a + r.runs, 0), different: data.runs.filter((r) => r.runs > 0).length } : null, retention: data.retention, readable: { check: data.checkReadable, chat: data.chatReadable, addresses: data.runs !== null } };
  if (!byHand && weekly) out.weekly = weekly;
  return res.end(JSON.stringify(out));
}

module.exports = handler;
module.exports._test = { deps, collect, digestMail, collectAuto, autoLines, AUTO_KINDS, berlinDay, CHECK_KINDS, collectRange, weeklyMail, lastDays, isBerlinMonday, shareLine, retentionPurge, claudeBudget, RETENTION_DAYS, RUN_LIST_MAX };
