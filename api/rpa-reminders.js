// /api/rpa-reminders — the reminder job of the RPA demo's sandbox (Sprint 42): "Service-Erinnerung, täglich 9:00 Uhr".
// A real scheduled job, not a button: Vercel Cron calls it, it finds every demo appointment that is due tomorrow and
// belongs to a visitor with a confirmed address, and sends each one friendly reminder (date, time window,
// serviceman's first name, how to move or cancel).
//
// 9:00 in Germany, all year. Vercel's cron expressions are in UTC and know no time zone, and 9:00 Europe/Berlin is
// 07:00 UTC in summer and 08:00 UTC in winter. So vercel.json calls this function at both hours, every day, and the
// function itself looks at the clock in Berlin: it works only when the hour there is 9, and answers "skipped" at the
// other call. One entry would be an hour early or late for half of the year; a check of the exact minute would be
// wrong too, because Vercel may start a job some minutes late (on the Hobby plan anywhere within the hour), so the
// guard is the hour. On the two days the clocks change the same holds: only one of the two calls falls into the hour
// 9 in Berlin (tested for both days in scripts/rpa-demo/test-rpa-demo.mjs).
//
// Protection: the project variable CRON_SECRET, sent by Vercel as "Authorization: Bearer <CRON_SECRET>" (as for
// /api/digest and /api/followup). Without it every request is refused. With the secret, by hand:
//   GET /api/rpa-reminders?force=1   run now, whatever the hour (the check after a deploy)
//   GET /api/rpa-reminders?dry=1     count what would be sent, send nothing (also ignores the hour)
//
// Idempotence: a reminder is claimed in the store before it goes out (one conditional update per appointment and
// date, docs/sql/rpa_agent.sql rpa_demo_claim), so two runs at the same time, a run Vercel delivers twice or a run
// repeated after it broke off half-way send each reminder once. The same claim is used when a visitor sends the
// reminder from the page ("Lauf jetzt ansehen"), so the job does not send it again.
//
// Recipients: api/_rpa.js deliver() — the confirmed address stored with the demo session, nobody else. Caps as there.
// Needs, and sends nothing while one is missing: CRON_SECRET, CHECK_MAIL_SECRET, BREVO_API_KEY, SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY with docs/sql/rpa_agent.sql applied.
// The run leaves one line of numbers for the daily digest (counters rparemrun and rparem in public.check_usage) and
// one log line; neither carries an address. No npm dependencies.

const crypto = require("crypto");
const check = require("./check");
const R = require("./_rpa");
const C = require("../assets/js/rpa-agent-core.js");
const S = check.shared;

const RUN_HOUR = 9; // Europe/Berlin
const sameSecret = (a, b) => crypto.timingSafeEqual(crypto.createHash("sha256").update(String(a)).digest(), crypto.createHash("sha256").update(String(b)).digest());
const berlinHour = (ms) => Math.floor(C.berlinNow(ms).minutes / 60);
const isRunHour = (ms) => berlinHour(ms) === RUN_HOUR;

async function handler(req, res) {
  const secret = String(process.env.CRON_SECRET || "").trim();
  const auth = req.headers && typeof req.headers.authorization === "string" ? req.headers.authorization : "";
  if (!secret || !sameSecret(auth, "Bearer " + secret)) return S.send(res, 401, { ok: false, error: "unauthorized" });
  if (req.method !== "GET") return S.send(res, 405, { ok: false, error: "method" }, { Allow: "GET" });
  const query = S.queryOf(req);
  const dry = query.get("dry") === "1";
  const force = query.get("force") === "1" || dry;
  const now = S.deps.now();
  if (!force && !isRunHour(now)) {
    console.log("[rpa-reminders] skipped: hour in Berlin is " + berlinHour(now) + ", the job runs at " + RUN_HOUR);
    return S.send(res, 200, { ok: true, skipped: true, berlinHour: berlinHour(now), runHour: RUN_HOUR });
  }
  const r = await R.runReminders({ dry });
  console.log(`[rpa-reminders] day=${r.day} due=${r.due} ready=${r.ready}${r.reason ? " reason=" + r.reason : ""} sessions=${r.sessions} appointments=${r.appointments} sent=${r.sent} already=${r.already} failed=${r.failed} capped=${r.capped}${dry ? " dry=1" : ""}`);
  // "not ready" because the demo cannot send mail at all (no SQL, no secret, no provider) is a state, not a failure
  const ok = !r.failed && (r.ready || r.reason === "mail_off");
  return S.send(res, ok ? 200 : 502, { ok, skipped: false, dry, ...r });
}

module.exports = handler;
module.exports._test = { RUN_HOUR, berlinHour, isRunHour };
