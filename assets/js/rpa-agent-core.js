/* rpa-agent-core.js — the rules of the RPA demo's sandbox (Sprint 42), one file for the page and the functions:
   loaded with defer on /automation/rpa (before assets/js/rpa-demo.js) and required by api/rpa-demo.js, api/_rpa.js
   and api/rpa-reminders.js. No model is involved here: everything in this file is fixed code.

   The sandbox is a fictional business, "Beispiel-Betrieb Haustechnik", with three fictional servicemen and a
   calendar of the next ten working days (Monday to Friday, Europe/Berlin; public holidays are not considered).

   window.RexityRpaCore / module.exports
     BUSINESS, TECHS, WINDOWS, TRADES, SIGNALS, REQUIRED       the fixed data
     berlinNow(ms) -> { day, minutes }                         Europe/Berlin clock of a moment
     dayPlus(day, n), weekday(day), workingDays(from, n)       day arithmetic on "YYYY-MM-DD"
     seedCalendar(today) -> [appointment]                      the fictional appointments the calendar starts with
     seedDay(day) -> [appointment]                             … of one day (when the ten-day window moves on)
     signalsIn(text) -> [id]                                   severity signals found by keyword
     severityOf(signals, text?) -> { level, signal }           Notfall / dringend / normal, decided by a fixed table
     tradeIn(text), intentIn(text)                             the rule-based reading's trade and intent
     parseWishes(text, today) -> [{ day?, from?, half? }]      date words of a wish, as days of the calendar
     missingOf(fields) -> [id]                                 the required details that are not there
     freeSlots(appts, now, trade, opts?)                       every free window of the servicemen of a trade
     chooseSlot(input) -> { chosen, candidates, why, late }    the slot rule (see SLOT RULE below)
     findAppointment(query, appts, today) -> { state, hits }   which calendar entry a change request means
     fmtDay, fmtWindow, fmtSlot                                dates as the page and the mails print them
     mailFor(kind, facts, lang) -> { role, subject, body }     every mail of the demo, as a fixed template
     fillBody(body, facts, lang)                               puts the booked slot into a model-written text
     nextRun(now) -> { runDay, dueDay }                        the next reminder run (daily, 9:00) and its day

   SLOT RULE (travel time is not considered)
     Servicemen: those whose trades include the job's trade; the one whose first trade it is comes first.
     A window is free when the serviceman works in it, nothing is booked in it and it has not begun yet.
     Notfall   the next free window today or on the next calendar day; no other appointment is moved. If there is
               none in that time, the next free window at all, and the result says so ("late").
     dringend  the first free window up to the end of the second working day after today; within that time a
               window on the wished day or half-day is preferred. None in that time: the next free one, "late".
     normal    not today. The wished day and half-day if free; else the free window nearest to the wish (fewest
               days away, then the same half-day, then the earlier one); without a wish the first free window from
               the next working day on.
     The three best windows by that order are shown; the first is booked. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.RexityRpaCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var BUSINESS = { de: "Beispiel-Betrieb Haustechnik", en: "Example Building Services" };
  var DAYS = 10; // working days the calendar shows
  var WINDOWS = [
    { id: "w1", from: "08:00", to: "10:00", start: 480, half: "am" },
    { id: "w2", from: "10:00", to: "12:00", start: 600, half: "am" },
    { id: "w3", from: "13:00", to: "15:00", start: 780, half: "pm" },
    { id: "w4", from: "15:00", to: "17:00", start: 900, half: "pm" }
  ];
  var TRADES = {
    heizung: { de: "Heizung", en: "Heating" },
    sanitaer: { de: "Sanitär", en: "Plumbing" },
    elektro: { de: "Elektro", en: "Electrical" },
    other: { de: "nicht im Angebot", en: "not offered" }
  };
  // first names only; weekdays 0 = Monday … 4 = Friday
  var TECHS = [
    { id: "tom", name: "Tom", trades: ["heizung", "sanitaer"], days: [0, 1, 2, 3, 4], wins: ["w1", "w2", "w3", "w4"], hours: { de: "Mo–Fr, 8–17 Uhr", en: "Mon–Fri, 8:00–17:00" } },
    { id: "mara", name: "Mara", trades: ["sanitaer", "heizung"], days: [0, 1, 2, 3], wins: ["w1", "w2", "w3"], hours: { de: "Mo–Do, 8–15 Uhr", en: "Mon–Thu, 8:00–15:00" } },
    { id: "deniz", name: "Deniz", trades: ["elektro"], days: [0, 1, 2, 3, 4], wins: ["w2", "w3", "w4"], hours: { de: "Mo–Fr, 10–17 Uhr", en: "Mon–Fri, 10:00–17:00" } }
  ];
  var REQUIRED = ["topic", "name", "contact", "address"]; // "Make sure all details are present"
  var LEVELS = ["normal", "dringend", "notfall"]; // index = level - 1

  // ---- Severity: a fixed table of signals. level 3 = Notfall, 2 = dringend. -----------------------------------------
  var SIGNALS = {
    water_leak: { level: 3, de: "Wasser tritt aus", en: "water is escaping", re: /rohrbruch|wasserschaden|überschwemm|ueberschwemm|wasser\s+(?:läuft|laeuft|tritt|strömt|stroemt|spritzt|steht)|unter\s+wasser|burst\s+pipe|flood|water\s+(?:is\s+)?(?:pouring|gushing|everywhere)/i },
    gas_smell: { level: 3, de: "Gasgeruch", en: "smell of gas", re: /gasgeruch|riecht\s+(?:es\s+)?nach\s+gas|gas\s+riecht|smell(?:s)?\s+of\s+gas|gas\s+smell/i },
    burning: { level: 3, de: "Schmorgeruch oder Funken", en: "burning smell or sparks", re: /schmor|brandgeruch|funken|kokelt|qualm|burning\s+smell|sparks?\b|smoke\b|scorch/i },
    no_power: { level: 3, de: "kein Strom", en: "no power", re: /(?:kein(?:en)?|ohne)\s+strom|stromausfall|komplett\s+dunkel|no\s+power|power\s+(?:is\s+)?(?:out|cut)|power\s+cut/i },
    no_heating: { level: 3, de: "Heizung ausgefallen", en: "heating has failed", re: /heizung\s+(?:ist\s+|komplett\s+|ganz\s+)?(?:ausgefallen|aus\b|kalt|tot)|heizungsausfall|keine\s+heizung|ist\s+(?:bei\s+uns\s+)?die\s+heizung\s+ausgefallen|heating\s+(?:has\s+|is\s+|has\s+been\s+)?(?:failed|out|broken\s+down|down)|no\s+heating/i },
    emergency: { level: 3, de: "als Notfall gemeldet", en: "reported as an emergency", re: /\bnotfall|\bemergency/i },
    no_hot_water: { level: 2, de: "kein Warmwasser", en: "no hot water", re: /kein(?:e)?\s+warmwasser|warmwasser\s+(?:bleibt\s+|ist\s+)?kalt|no\s+hot\s+water|hot\s+water\s+stays\s+cold/i },
    drip: { level: 2, de: "etwas tropft oder ist undicht", en: "something drips or leaks", re: /\btropft|undicht|\bleck|dripping|\bdrips?\b|\bleak(?:ing|s)?\b/i },
    blocked: { level: 2, de: "verstopft", en: "blocked", re: /verstopft|läuft\s+nicht\s+(?:mehr\s+)?ab|laeuft\s+nicht\s+(?:mehr\s+)?ab|\bblocked\b|\bclogged\b/i },
    fuse: { level: 2, de: "Sicherung löst aus", en: "a fuse keeps tripping", re: /sicherung[^.!?\n]{0,60}(?:fliegt|springt|löst\s+aus|loest\s+aus|fällt|faellt|ausgelöst)|fi[- ]?schalter|fuse\s+(?:keeps\s+)?(?:trips|tripping|blows|blowing)|breaker\s+(?:keeps\s+)?trip/i },
    urgent_word: { level: 2, de: "vom Kunden als dringend bezeichnet", en: "called urgent by the customer", re: /\bdringend|\beilt\b|\beilig|so\s+schnell\s+wie\s+m(?:ö|oe)glich|schnellstm(?:ö|oe)glich|\bumgehend|\bsofort\b|\burgent|\basap\b|as\s+soon\s+as\s+possible|right\s+away/i }
  };
  var SIGNAL_IDS = Object.keys(SIGNALS);
  var RELAXED = /keine\s+eile|eilt\s+nicht|nicht\s+dringend|irgendwann|bei\s+gelegenheit|no\s+rush|not\s+urgent|whenever\s+(?:it\s+)?suits/i;

  function signalsIn(text) {
    var t = String(text || "");
    return SIGNAL_IDS.filter(function (id) { return SIGNALS[id].re.test(t); });
  }
  /* -> { level: "notfall" | "dringend" | "normal", signal: id | null }. "Keine Eile" lowers a "dringend" to normal,
     never a Notfall. */
  function severityOf(signals, text) {
    var best = null;
    (signals || []).forEach(function (id) {
      var s = SIGNALS[id];
      if (s && (!best || s.level > SIGNALS[best].level)) best = id;
    });
    if (!best) return { level: "normal", signal: null };
    if (SIGNALS[best].level === 2 && RELAXED.test(String(text || ""))) return { level: "normal", signal: null };
    return { level: LEVELS[SIGNALS[best].level - 1], signal: best };
  }
  var SEVERITY_LABEL = { notfall: { de: "Notfall", en: "Emergency" }, dringend: { de: "dringend", en: "urgent" }, normal: { de: "normal", en: "normal" } };
  function severityReason(sev, lang) {
    var L = lang === "en" ? "en" : "de";
    if (sev.signal && SIGNALS[sev.signal]) return SIGNALS[sev.signal][L];
    return L === "de" ? "kein Hinweis auf Gefahr oder Eile" : "no sign of danger or haste";
  }

  // ---- Trade and intent by keyword (the rule-based reading; a model's answer is an enum checked by the function) ----
  var TRADE_RE = {
    heizung: /heizung|heizk(?:ö|oe)rper|therme|kessel|brenner|warmwasser|boiler|fu(?:ß|ss)bodenheizung|heating|radiator|hot\s+water/gi,
    sanitaer: /wasserhahn|armatur|\bwc\b|toilette|sp(?:ü|ue)lkasten|abfluss|rohr|dusche|waschbecken|sp(?:ü|ue)le|wasserschaden|\btap\b|faucet|toilet|drain|\bpipe|shower|\bsink\b|plumb/gi,
    elektro: /steckdose|sicherung|\bstrom|lampe|leuchte|lichtschalter|schalter|kabel|elektr|fi[- ]?schalter|socket|\bfuse|\bpower\b|\blight(?:s|ing)?\b|switch|wiring|electric/gi
  };
  function tradeIn(text) {
    var t = String(text || "");
    var best = "other";
    var n = 0;
    Object.keys(TRADE_RE).forEach(function (k) {
      var m = t.match(TRADE_RE[k]);
      if (m && m.length > n) { n = m.length; best = k; }
    });
    return best;
  }
  var MOVE_RE = /verschieb|verleg|umbuch|anderen\s+termin|neuen\s+termin|termin\s+(?:ä|ae)ndern|reschedul|postpone|mov(?:e|ing)\s+(?:my|the|our)\s+appointment|another\s+(?:date|time|day)/i;
  var CANCEL_RE = /\babsag|stornier|\bcancel|nicht\s+mehr\s+n(?:ö|oe)tig|hat\s+sich\s+erledigt|no\s+longer\s+need/i;
  var JOB_RE = /ausgefallen|defekt|kaputt|st(?:ö|oe)rung|funktioniert\s+nicht|geht\s+nicht|tropft|undicht|verstopft|reparier|wartung|einbau|install|pr(?:ü|ue)f|austausch|erneuern|broken|not\s+working|repair|service|fit\b|replace|check/i;
  function intentIn(text) {
    var t = String(text || "");
    if (CANCEL_RE.test(t) && !MOVE_RE.test(t)) return "cancel";
    if (MOVE_RE.test(t)) return "move";
    if (tradeIn(t) !== "other" || JOB_RE.test(t) || signalsIn(t).length) return "new";
    return "other";
  }

  // ---- Days -------------------------------------------------------------------------------------------------------
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function berlinNow(ms) {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(ms));
      var v = {};
      parts.forEach(function (p) { v[p.type] = p.value; });
      return { day: v.year + "-" + v.month + "-" + v.day, minutes: (Number(v.hour) % 24) * 60 + Number(v.minute) };
    } catch (e) {
      var d = new Date(ms);
      return { day: d.toISOString().slice(0, 10), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
    }
  }
  var DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
  function utcNoon(day) { var p = String(day).split("-").map(Number); return Date.UTC(p[0], p[1] - 1, p[2], 12); }
  function dayPlus(day, n) { return new Date(utcNoon(day) + n * 86400000).toISOString().slice(0, 10); }
  function weekday(day) { return (new Date(utcNoon(day)).getUTCDay() + 6) % 7; } // Monday = 0
  function isWorking(day) { return weekday(day) < 5; }
  /* the next `count` working days, `from` included when it is one */
  function workingDays(from, count) {
    var out = [];
    var d = from;
    while (out.length < (count || DAYS)) { if (isWorking(d)) out.push(d); d = dayPlus(d, 1); }
    return out;
  }
  function dayDiff(a, b) { return Math.round((utcNoon(a) - utcNoon(b)) / 86400000); }
  function winOf(id) { for (var i = 0; i < WINDOWS.length; i++) if (WINDOWS[i].id === id) return WINDOWS[i]; return null; }
  function techOf(id) { for (var i = 0; i < TECHS.length; i++) if (TECHS[i].id === id) return TECHS[i]; return null; }
  function works(tech, day, winId) { return tech.days.indexOf(weekday(day)) !== -1 && tech.wins.indexOf(winId) !== -1; }

  // ---- The calendar's fictional appointments ----------------------------------------------------------------------
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rand(seed) { // mulberry32: one number in [0, 1) per seed string
    var a = hash(seed) + 0x6d2b79f5;
    var t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  var SEED_NAMES = ["Kim Beispiel", "Robin Muster", "Sascha Beispiel", "Toni Muster", "Chris Beispiel", "Luca Muster", "Noah Beispiel", "Mika Muster", "Jule Beispiel", "Pat Muster"];
  var SEED_TOPICS = {
    heizung: [{ de: "Wartung der Heizung", en: "Heating service" }, { de: "Heizkörper wird nicht warm", en: "Radiator does not get warm" }, { de: "Thermostat tauschen", en: "Replace a thermostat" }],
    sanitaer: [{ de: "Spülkasten läuft nach", en: "Cistern keeps running" }, { de: "Armatur in der Küche erneuern", en: "Replace the kitchen tap" }, { de: "Abfluss im Bad reinigen", en: "Clear the bathroom drain" }],
    elektro: [{ de: "Steckdosen in der Küche setzen", en: "Fit sockets in the kitchen" }, { de: "Leuchte im Flur anschließen", en: "Connect a hallway light" }, { de: "Sicherungskasten prüfen", en: "Check the fuse box" }]
  };
  var FILL = 0.42; // share of windows that start as booked
  function seedAppt(tech, day, win, i) {
    var trade = tech.trades[0];
    var topics = SEED_TOPICS[trade];
    var r = rand("t|" + day + tech.id + win);
    return {
      id: "s-" + day + "-" + tech.id + "-" + win, tech: tech.id, date: day, win: win, trade: trade, sev: "normal", src: "seed",
      name: SEED_NAMES[Math.floor(rand("n|" + day + tech.id + win) * SEED_NAMES.length)],
      address: "Beispielstraße " + (1 + Math.floor(rand("a|" + day + tech.id + win) * 60)) + ", 12345 Musterstadt",
      phone: "0171 000 00 " + pad(i % 100),
      topic: topics[Math.floor(r * topics.length)]
    };
  }
  function seedDay(day) {
    var out = [];
    if (!isWorking(day)) return out;
    var i = 0;
    TECHS.forEach(function (tech) {
      tech.wins.forEach(function (win) {
        i++;
        if (works(tech, day, win) && rand("f|" + day + tech.id + win) < FILL) out.push(seedAppt(tech, day, win, i));
      });
    });
    return out;
  }
  /* The two customers of the ready-made change requests: always in the calendar a new sandbox starts with. */
  var FIXED = {
    move: { name: "Alex Beispiel", tech: "tom", win: "w2", trade: "heizung", topic: { de: "Wartung der Heizung", en: "Heating service" }, address: "Musterweg 3, 12345 Musterstadt", phone: "040 000 00 00" },
    cancel: { name: "Erika Muster", tech: "mara", win: "w1", trade: "sanitaer", topic: { de: "Armatur im Bad erneuern", en: "Replace the bathroom tap" }, address: "Beispielallee 12, 12345 Musterstadt", phone: "0171 000 00 00" }
  };
  function seedCalendar(today) {
    var days = workingDays(today, DAYS);
    var appts = [];
    days.forEach(function (d) { appts = appts.concat(seedDay(d)); });
    var place = function (f, fromIndex) {
      var tech = techOf(f.tech);
      for (var i = fromIndex; i < days.length; i++) {
        if (!works(tech, days[i], f.win)) continue;
        appts = appts.filter(function (a) { return !(a.tech === f.tech && a.date === days[i] && a.win === f.win); });
        appts.push({ id: "s-" + days[i] + "-" + f.tech + "-" + f.win, tech: f.tech, date: days[i], win: f.win, trade: f.trade, sev: "normal", src: "seed", name: f.name, address: f.address, phone: f.phone, topic: f.topic });
        return;
      }
    };
    place(FIXED.move, 3);
    place(FIXED.cancel, 5);
    return sortAppts(appts);
  }
  function sortAppts(appts) {
    return appts.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : winOf(a.win).start - winOf(b.win).start || (a.tech < b.tech ? -1 : 1); });
  }

  // ---- Wishes: date words -> days of the calendar -------------------------------------------------------------------
  var WD = [
    ["montag", "monday"], ["dienstag", "tuesday"], ["mittwoch", "wednesday"], ["donnerstag", "thursday"], ["freitag", "friday"], ["samstag", "saturday"], ["sonntag", "sunday"]
  ];
  var WD_RE = /(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonnabend|sonntag|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(s?)(vormittag|nachmittag|morgen|abend)?/gi;
  var NEXT_WEEK = /n(?:ä|ae)chste[rn]?\s+woche|kommende[rn]?\s+woche|next\s+week/i;
  function wdIndex(word) {
    var w = word.toLowerCase() === "sonnabend" ? "samstag" : word.toLowerCase();
    for (var i = 0; i < WD.length; i++) if (WD[i].indexOf(w) !== -1) return i;
    return -1;
  }
  function halfIn(s) {
    var t = String(s || "").toLowerCase();
    if (/nachmittag|afternoon|abend|evening|\d\s*pm\b|ab\s+1[2-9]\s*uhr|nach\s+1[2-9]\s*uhr|after\s+1[2-9]/.test(t)) return "pm";
    if (/vormittag|morgens|\bfr(?:ü|ue)h|morning|\d\s*am\b|vor\s+1[0-2]\s*uhr|before\s+1[0-2]/.test(t)) return "am";
    var m = /(?:um|at|gegen|around)\s+(\d{1,2})(?:[:.]\d{2})?/.exec(t) || /\b(\d{1,2})[:.]\d{2}\s*(?:uhr)?/.exec(t) || /\b(\d{1,2})\s*uhr/.exec(t);
    if (m) { var h = Number(m[1]); if (h >= 7 && h < 12) return "am"; if (h >= 12 && h <= 18) return "pm"; }
    return null;
  }
  /* One wish per alternative ("Freitagvormittag oder nächste Woche Dienstag" -> two). Each: { day } a certain day,
     { from } "from that day on", optionally { half }. A text without a date word but with a half-day -> [{ half }]. */
  function parseWishes(text, today) {
    var out = [];
    var parts = String(text || "").split(/\s+(?:oder|or|bzw\.?|alternativ|\/)\s+|\s*\/\s*/i);
    parts.forEach(function (raw) {
      var s = raw.toLowerCase();
      var w = {};
      var half = halfIn(s);
      var nextWeek = NEXT_WEEK.test(s);
      var m;
      WD_RE.lastIndex = 0;
      var date = /(\d{1,2})\.\s?(\d{1,2})\.(?:\s?(\d{2,4}))?/.exec(s);
      var en = /(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)/.exec(s) || null;
      if (!date && en) date = [en[0], en[1], String(MONTH_EN.map(function (x) { return x.toLowerCase(); }).indexOf(en[2]) + 1), undefined];
      if (date) {
        var y = date[3] ? Number(date[3].length === 2 ? "20" + date[3] : date[3]) : Number(today.slice(0, 4));
        var d = y + "-" + pad(Number(date[2])) + "-" + pad(Number(date[1]));
        if (DAY_RE.test(d) && !isNaN(utcNoon(d))) { if (!date[3] && d < today) d = (y + 1) + d.slice(4); w.day = d; }
      } else if ((m = WD_RE.exec(s))) {
        var idx = wdIndex(m[1]);
        var delta = (idx - weekday(today) + 7) % 7 || 7; // the next such weekday after today
        if (nextWeek) { var monday = dayPlus(today, 7 - weekday(today)); w.day = dayPlus(monday, idx); }
        else w.day = dayPlus(today, delta);
        if (m[3] && !half) half = /nachmittag|abend/.test(m[3]) ? "pm" : "am";
      } else if (/(?:ü|ue)bermorgen|day\s+after\s+tomorrow/.test(s)) w.day = dayPlus(today, 2);
      else if (/\bheute\b|\btoday\b/.test(s)) { w.day = today; if (/heute\s+morgen/.test(s) && !half) half = "am"; }
      else if (/\btomorrow\b/.test(s) || /(?:^|[^\p{L}])morgen(?![\p{L}])/u.test(s.replace(/guten\s+morgen/g, " "))) w.day = dayPlus(today, 1);
      else if (nextWeek) w.from = dayPlus(today, 7 - weekday(today));
      else if (/diese[rn]?\s+woche|this\s+week/.test(s)) w.from = today;
      if (half) w.half = half;
      if (w.day || w.from || w.half) out.push(w);
    });
    return out.slice(0, 3);
  }

  // ---- Required details ---------------------------------------------------------------------------------------------
  function missingOf(f) {
    var out = [];
    if (!f || !f.topic) out.push("topic");
    if (!f || !f.name) out.push("name");
    if (!f || (!f.phone && !f.email)) out.push("contact");
    if (!f || !f.address) out.push("address");
    return out;
  }
  var MISSING_LABEL = {
    topic: { de: "Anliegen", en: "request" }, name: { de: "Name", en: "name" },
    contact: { de: "ein Kontaktweg (Telefon oder E-Mail)", en: "a way to reach you (phone or e-mail)" }, address: { de: "Adresse", en: "address" }
  };

  // ---- Free windows and the slot rule ---------------------------------------------------------------------------------
  function techsFor(trade) {
    return TECHS.filter(function (t) { return t.trades.indexOf(trade) !== -1; })
      .sort(function (a, b) { return a.trades.indexOf(trade) - b.trades.indexOf(trade); });
  }
  /* now: { day, minutes }; opts.ignore: id of an appointment that does not block (the one being moved);
     opts.not: { tech, date, win } a window that is not offered (the old one of a move) */
  function freeSlots(appts, now, trade, opts) {
    var o = opts || {};
    var busy = {};
    (appts || []).forEach(function (a) { if (a.id !== o.ignore) busy[a.tech + "|" + a.date + "|" + a.win] = true; });
    var techs = techsFor(trade);
    var out = [];
    workingDays(now.day, DAYS).forEach(function (day, di) {
      WINDOWS.forEach(function (w) {
        if (day === now.day && w.start <= now.minutes) return; // has begun
        techs.forEach(function (t, ti) {
          if (!works(t, day, w.id) || busy[t.id + "|" + day + "|" + w.id]) return;
          if (o.not && o.not.tech === t.id && o.not.date === day && o.not.win === w.id) return;
          out.push({ tech: t.id, date: day, win: w.id, half: w.half, order: di * 1000 + w.start + ti * 0.1 });
        });
      });
    });
    return out.sort(function (a, b) { return a.order - b.order; });
  }
  function matches(slot, w) {
    if (w.day && slot.date !== w.day) return false;
    if (w.from && slot.date < w.from) return false;
    if (w.half && slot.half !== w.half) return false;
    return true;
  }
  /* input: { severity, trade, wishes, appts, now, ignore?, not?, prefer? (tech id of the current appointment) }
     -> { chosen: slot | null, candidates: [slot ≤ 3], why: id, late: boolean, wish: boolean (a wish was met) } */
  function chooseSlot(input) {
    var now = input.now;
    var wishes = input.wishes || [];
    var pool = freeSlots(input.appts, now, input.trade, { ignore: input.ignore, not: input.not });
    if (input.prefer) pool = pool.map(function (s) { return s.tech === input.prefer ? assign(s, { order: s.order - 0.5 }) : s; }).sort(function (a, b) { return a.order - b.order; });
    var none = { chosen: null, candidates: [], why: "none", late: false, wish: false };
    if (!pool.length) return none;
    var ranked;
    var why;
    var late = false;
    var wish = false;
    if (input.severity === "notfall") {
      var limit = dayPlus(now.day, 1);
      var soon = pool.filter(function (s) { return s.date <= limit; });
      late = !soon.length;
      ranked = soon.length ? soon.concat(pool.filter(function (s) { return s.date > limit; })) : pool;
      why = late ? "notfall_late" : "notfall";
    } else if (input.severity === "dringend") {
      var days = workingDays(dayPlus(now.day, 1), 2);
      var last = days[1];
      var range = pool.filter(function (s) { return s.date <= last; });
      late = !range.length;
      if (late) { ranked = pool; why = "dringend_late"; }
      else {
        var hit = [];
        wishes.forEach(function (w) { range.forEach(function (s) { if (matches(s, w) && hit.indexOf(s) === -1) hit.push(s); }); });
        wish = hit.length > 0;
        ranked = hit.concat(range.filter(function (s) { return hit.indexOf(s) === -1; })).concat(pool.filter(function (s) { return s.date > last; }));
        why = wish ? "dringend_wish" : "dringend";
      }
    } else {
      var later = pool.filter(function (s) { return s.date > now.day; });
      if (!later.length) return none;
      var exact = [];
      wishes.forEach(function (w) { later.forEach(function (s) { if (matches(s, w) && exact.indexOf(s) === -1) exact.push(s); }); });
      if (exact.length) { wish = true; why = "normal_wish"; ranked = exact.concat(nearest(later.filter(function (s) { return exact.indexOf(s) === -1; }), wishes[0])); }
      else if (wishes.length) { why = "normal_near"; ranked = nearest(later, wishes[0]); }
      else { why = "normal"; ranked = later; }
    }
    return { chosen: ranked[0], candidates: ranked.slice(0, 3), why: why, late: late, wish: wish };
  }
  /* the windows nearest to a wish: fewest days away from the wished day (or its "from" day), then the wished
     half-day, then the earlier one */
  function nearest(slots, w) {
    var anchor = w && (w.day || w.from);
    return slots.slice().sort(function (a, b) {
      var da = anchor ? Math.abs(dayDiff(a.date, anchor)) : 0;
      var db = anchor ? Math.abs(dayDiff(b.date, anchor)) : 0;
      if (da !== db) return da - db;
      var ha = w && w.half && a.half !== w.half ? 1 : 0;
      var hb = w && w.half && b.half !== w.half ? 1 : 0;
      if (ha !== hb) return ha - hb;
      return a.order - b.order;
    });
  }
  function assign(a, b) { var o = {}; var k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
  var WHY = {
    notfall: { de: "Notfall: Das ist das nächste freie Zeitfenster; kein anderer Termin wird dafür verschoben.", en: "Emergency: this is the next free window; no other appointment is moved for it." },
    notfall_late: { de: "Notfall: Heute und morgen ist kein Zeitfenster frei, deshalb das nächste freie; im echten Betrieb würde das Büro jetzt zusätzlich anrufen.", en: "Emergency: no window is free today or tomorrow, hence the next free one; in a real business the office would also call now." },
    dringend: { de: "Dringend: Das ist das erste freie Zeitfenster innerhalb der nächsten zwei Werktage.", en: "Urgent: this is the first free window within the next two working days." },
    dringend_wish: { de: "Dringend: Das Zeitfenster liegt innerhalb der nächsten zwei Werktage und passt zum Wunsch des Kunden.", en: "Urgent: the window lies within the next two working days and fits the customer's wish." },
    dringend_late: { de: "Dringend: In den nächsten zwei Werktagen ist nichts frei, deshalb das nächste freie Zeitfenster.", en: "Urgent: nothing is free in the next two working days, hence the next free window." },
    normal: { de: "Normal: Ohne Wunschtermin ist das das erste freie Zeitfenster ab dem nächsten Werktag.", en: "Normal: without a wished date this is the first free window from the next working day on." },
    normal_wish: { de: "Normal: Das Zeitfenster entspricht dem Wunsch des Kunden und ist frei.", en: "Normal: the window matches the customer's wish and is free." },
    normal_near: { de: "Normal: Der Wunschtermin ist belegt oder liegt außerhalb der Arbeitszeit, deshalb das nächstgelegene freie Zeitfenster.", en: "Normal: the wished date is taken or outside working hours, hence the nearest free window." },
    none: { de: "In den nächsten zehn Werktagen ist kein Zeitfenster frei.", en: "No window is free in the next ten working days." }
  };

  // ---- Which appointment does a change request mean? ----------------------------------------------------------------
  function squash(s) { return String(s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ""); }
  /* query: { name, address, days: [day] (the date words of the old appointment) }
     -> { state: "found" | "ambiguous" | "none", hits: [appointment] } */
  function findAppointment(query, appts, today) {
    var q = query || {};
    var name = squash(q.name);
    var street = squash(String(q.address || "").split(",")[0]);
    var future = (appts || []).filter(function (a) { return a.date >= today; });
    var hits = future.filter(function (a) {
      var n = squash(a.name);
      var byName = name.length > 3 && (n === name || (n.length > 3 && (n.indexOf(name) !== -1 || name.indexOf(n) !== -1)));
      var byAddress = street.length > 5 && squash(String(a.address).split(",")[0]) === street;
      return byName || byAddress;
    });
    var days = q.days || [];
    if (hits.length > 1 && days.length) {
      var onDay = hits.filter(function (a) { return days.indexOf(a.date) !== -1; });
      if (onDay.length) hits = onDay;
    }
    return { state: hits.length === 1 ? "found" : hits.length ? "ambiguous" : "none", hits: sortAppts(hits).slice(0, 5) };
  }

  // ---- Dates as text -----------------------------------------------------------------------------------------------------
  var WD_NAME = { de: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"], en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] };
  var MONTH_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function fmtDay(day, lang, short) {
    var p = String(day).split("-");
    var wd = WD_NAME[lang === "en" ? "en" : "de"][weekday(day)];
    if (lang === "en") return (short ? wd.slice(0, 3) : wd) + ", " + Number(p[2]) + " " + (short ? MONTH_EN[Number(p[1]) - 1].slice(0, 3) : MONTH_EN[Number(p[1]) - 1]) + (short ? "" : " " + p[0]);
    return (short ? wd.slice(0, 2) : wd) + ", " + p[2] + "." + p[1] + "." + (short ? "" : p[0]);
  }
  function fmtWindow(winId, lang) {
    var w = winOf(winId);
    return lang === "en" ? w.from + "–" + w.to : w.from + "–" + w.to + " Uhr";
  }
  /* the slot as it stands in a sentence: "am Dienstag, 06.10.2026, zwischen 10:00 und 12:00 Uhr" */
  function fmtSlot(date, winId, lang) {
    var w = winOf(winId);
    return lang === "en" ? "on " + fmtDay(date, "en") + ", between " + w.from + " and " + w.to
      : "am " + fmtDay(date, "de") + ", zwischen " + w.from + " und " + w.to + " Uhr";
  }
  function topicOf(a, lang) { return a && a.topic && typeof a.topic === "object" ? a.topic[lang === "en" ? "en" : "de"] : (a && a.topic) || ""; }

  // ---- The mails --------------------------------------------------------------------------------------------------------
  var PREPARE = {
    heizung: { de: "Bitte sorgen Sie dafür, dass der Heizungsraum und das Gerät zugänglich sind, und notieren Sie, wenn möglich, was die Anzeige am Gerät meldet.", en: "Please make sure the boiler room and the unit are accessible and, if possible, note what the display on the unit shows." },
    sanitaer: { de: "Bitte räumen Sie den Bereich rund um die betroffene Stelle frei und halten Sie den Haupthahn zugänglich.", en: "Please clear the area around the affected spot and keep the main stopcock accessible." },
    elektro: { de: "Bitte halten Sie den Sicherungskasten zugänglich und notieren Sie, welche Räume oder Geräte betroffen sind.", en: "Please keep the fuse box accessible and note which rooms or appliances are affected." }
  };
  /* The prepared wording of the confirmation for the two ready-made new enquiries of the page (src/data/rpa-demo.json,
     by example id): written by hand in the shape a model's wording has, placeholders included. It stands here because
     the function sends a wording other than the template only if it sealed it itself or if it is one of these. */
  var EXAMPLE_BODIES = {
    "heizung": {
      "de": "Guten Tag Jonas Beispiel,\n\nvielen Dank für Ihre Nachricht. Den Ausfall von Heizung und Warmwasser haben wir als Notfall aufgenommen: [MONTEUR] kommt [TERMIN] zu Ihnen.\n\nBitte sorgen Sie dafür, dass der Heizungsraum zugänglich ist, und notieren Sie, was die Störungsanzeige am Gerät meldet.",
      "en": "Hello Jonas Beispiel,\n\nthank you for your message. We have recorded the failure of your heating and hot water as an emergency: [MONTEUR] will come to you [TERMIN].\n\nPlease make sure the boiler room is accessible and note what the fault display on the unit shows."
    },
    "wasserhahn": {
      "de": "Guten Tag Maria Muster,\n\nvielen Dank für Ihre Nachricht. Wir kümmern uns um den tropfenden Wasserhahn in Ihrer Küche: [MONTEUR] kommt [TERMIN] zu Ihnen.\n\nBitte räumen Sie den Unterschrank unter der Spüle frei, damit die Anschlüsse gut erreichbar sind.",
      "en": "Hello Maria Muster,\n\nthank you for your message. We will take care of the dripping tap in your kitchen: [MONTEUR] will come to you [TERMIN].\n\nPlease clear the cupboard under the sink so that the connections are easy to reach."
    }
  };
  var CHANGE = { de: "Sie möchten den Termin verschieben oder absagen? Antworten Sie einfach auf diese E-Mail.", en: "Would you like to move or cancel the appointment? Simply reply to this e-mail." };
  function bye(lang) { return lang === "en" ? "Kind regards\nYour team at " + BUSINESS.en : "Freundliche Grüße\nIhr Team vom " + BUSINESS.de; }
  function hello(name, lang) { return lang === "en" ? "Hello" + (name ? " " + name : "") + "," : "Guten Tag" + (name ? " " + name : "") + ","; }
  function joinList(list, lang) { return list.length < 2 ? list.join("") : list.slice(0, -1).join(", ") + (lang === "en" ? " and " : " und ") + list[list.length - 1]; }
  /* A model-written confirmation carries [TERMIN] and [MONTEUR]; the code puts the booked slot in. */
  function fillBody(body, f, lang) {
    return String(body).split("[TERMIN]").join(fmtSlot(f.date, f.win, lang)).split("[MONTEUR]").join(techOf(f.tech).name);
  }
  var ROLE = {
    customer: { de: "An: Kunde", en: "To: customer" },
    tech: { de: "Kopie an den Monteur (Demo)", en: "Copy to the serviceman (demo)" }
  };
  var KINDS = ["confirm", "tech", "ask", "which", "decline", "moved", "tech_moved", "cancelled", "tech_cancelled", "rejected", "reminder"];
  /* facts: { name, phone, email, address, topic, trade, severity, signal, tech, date, win, oldDate, oldWin, oldTech,
              missing, reason, body (model-written confirmation with placeholders, already checked) }
     -> { role: "customer" | "tech", subject, body } */
  function mailFor(kind, f, lang) {
    var L = lang === "en" ? "en" : "de";
    var de = L === "de";
    var tech = f.tech ? techOf(f.tech) : null;
    var slot = f.date && f.win ? fmtSlot(f.date, f.win, L) : "";
    var old = f.oldDate && f.oldWin ? fmtSlot(f.oldDate, f.oldWin, L) : "";
    var topic = f.topic || (de ? "Ihr Anliegen" : "your request");
    var sev = SEVERITY_LABEL[f.severity || "normal"][L] + (f.signal && SIGNALS[f.signal] ? " (" + SIGNALS[f.signal][L] + ")" : "");
    var job = function (rows) { return rows.filter(function (r) { return r[1]; }).map(function (r) { return r[0] + ": " + r[1]; }).join("\n"); };
    switch (kind) {
      case "confirm": {
        var text = f.body ? fillBody(f.body, f, L)
          : [hello(f.name, L), "", de
            ? "vielen Dank für Ihre Nachricht. Wir haben Ihr Anliegen aufgenommen (" + topic + ") und einen Termin für Sie eingeplant: " + tech.name + " kommt " + slot + " zu Ihnen."
            : "thank you for your message. We have recorded your request (" + topic + ") and scheduled an appointment for you: " + tech.name + " will come to you " + slot + ".",
          (PREPARE[f.trade] || PREPARE.sanitaer)[L]].join("\n");
        return { role: "customer", subject: (de ? "Ihr Termin " : "Your appointment ") + slot, body: [text, "", CHANGE[L], "", bye(L)].join("\n") };
      }
      case "tech":
        return { role: "tech", subject: (de ? "Neuer Auftrag " : "New job ") + slot, body: [de ? "Hallo " + tech.name + "," : "Hello " + tech.name + ",", "", de ? "neuer Termin in deinem Kalender:" : "a new appointment in your calendar:", "",
          job([[de ? "Termin" : "Appointment", fmtDay(f.date, L) + ", " + fmtWindow(f.win, L)], [de ? "Anliegen" : "Request", topic], [de ? "Dringlichkeit" : "Urgency", sev], [de ? "Kunde" : "Customer", f.name], [de ? "Adresse" : "Address", f.address], [de ? "Telefon" : "Phone", f.phone], ["E-Mail", f.email]]),
          "", de ? "Viele Grüße\nBüro, " + BUSINESS.de : "Regards\nOffice, " + BUSINESS.en].join("\n") };
      case "ask": {
        var list = (f.missing || []).map(function (m) { return MISSING_LABEL[m][L]; });
        return { role: "customer", subject: de ? "Rückfrage zu Ihrer Anfrage" : "A question about your enquiry", body: [hello(f.name, L), "", de
          ? "vielen Dank für Ihre Nachricht. Damit wir einen Termin für Sie einplanen können, fehlt uns noch: " + joinList(list, L) + "."
          : "thank you for your message. So that we can schedule an appointment for you, we still need: " + joinList(list, L) + ".",
        de ? "Antworten Sie einfach auf diese E-Mail. Sobald die Angaben da sind, erhalten Sie Ihren Termin." : "Simply reply to this e-mail. As soon as we have the details, you will receive your appointment.", "", bye(L)].join("\n") };
      }
      case "which":
        return { role: "customer", subject: de ? "Rückfrage zu Ihrem Termin" : "A question about your appointment", body: [hello(f.name, L), "", de
          ? "vielen Dank für Ihre Nachricht. Wir konnten den Termin, den Sie meinen, in unserem Kalender nicht eindeutig finden."
          : "thank you for your message. We could not clearly find the appointment you mean in our calendar.",
        de ? "Bitte nennen Sie uns das Datum und die Uhrzeit des Termins sowie die Adresse. Antworten Sie dafür einfach auf diese E-Mail." : "Please tell us the date and time of the appointment and the address. Simply reply to this e-mail.", "", bye(L)].join("\n") };
      case "decline":
        return { role: "customer", subject: de ? "Ihre Anfrage" : "Your enquiry", body: [hello(f.name, L), "", de
          ? "vielen Dank für Ihre Nachricht. Wir arbeiten in den Bereichen Heizung, Sanitär und Elektro; Ihr Anliegen gehört leider nicht dazu. Deshalb haben wir keinen Termin eingeplant."
          : "thank you for your message. We work in heating, plumbing and electrical; unfortunately your request is not one of these. We have therefore not scheduled an appointment.", "", bye(L)].join("\n") };
      case "moved":
        return { role: "customer", subject: (de ? "Ihr Termin ist verschoben: neu " : "Your appointment has been moved: now ") + slot, body: [hello(f.name, L), "", de
          ? "wie gewünscht haben wir Ihren Termin verschoben. Er war " + old + " geplant. Neu kommt " + tech.name + " " + slot + " zu Ihnen."
          : "as requested we have moved your appointment. It was planned " + old + ". " + tech.name + " will now come to you " + slot + ".", "", CHANGE[L], "", bye(L)].join("\n") };
      case "tech_moved":
        return { role: "tech", subject: (de ? "Termin verschoben: neu " : "Appointment moved: now ") + slot, body: [de ? "Hallo " + tech.name + "," : "Hello " + tech.name + ",", "", de ? "ein Termin wurde nach Freigabe durch das Büro verschoben:" : "an appointment was moved after approval by the office:", "",
          job([[de ? "Bisher" : "Before", fmtDay(f.oldDate, L) + ", " + fmtWindow(f.oldWin, L) + (f.oldTech && f.oldTech !== f.tech ? " (" + techOf(f.oldTech).name + ")" : "")], [de ? "Neu" : "Now", fmtDay(f.date, L) + ", " + fmtWindow(f.win, L)], [de ? "Anliegen" : "Request", topic], [de ? "Kunde" : "Customer", f.name], [de ? "Adresse" : "Address", f.address], [de ? "Telefon" : "Phone", f.phone]]),
          "", de ? "Viele Grüße\nBüro, " + BUSINESS.de : "Regards\nOffice, " + BUSINESS.en].join("\n") };
      case "cancelled":
        return { role: "customer", subject: de ? "Ihr Termin ist abgesagt" : "Your appointment is cancelled", body: [hello(f.name, L), "", de
          ? "wie gewünscht haben wir Ihren Termin " + old + " abgesagt. Wenn Sie einen neuen Termin brauchen, antworten Sie einfach auf diese E-Mail."
          : "as requested we have cancelled your appointment " + old + ". If you need a new appointment, simply reply to this e-mail.", "", bye(L)].join("\n") };
      case "tech_cancelled":
        return { role: "tech", subject: (de ? "Termin abgesagt: " : "Appointment cancelled: ") + fmtDay(f.oldDate, L) + ", " + fmtWindow(f.oldWin, L), body: [de ? "Hallo " + tech.name + "," : "Hello " + tech.name + ",", "", de ? "ein Termin wurde nach Freigabe durch das Büro abgesagt; das Zeitfenster ist wieder frei:" : "an appointment was cancelled after approval by the office; the window is free again:", "",
          job([[de ? "Termin" : "Appointment", fmtDay(f.oldDate, L) + ", " + fmtWindow(f.oldWin, L)], [de ? "Anliegen" : "Request", topic], [de ? "Kunde" : "Customer", f.name], [de ? "Adresse" : "Address", f.address]]),
          "", de ? "Viele Grüße\nBüro, " + BUSINESS.de : "Regards\nOffice, " + BUSINESS.en].join("\n") };
      case "rejected":
        return { role: "customer", subject: de ? "Ihr Termin bleibt bestehen" : "Your appointment stays as it is", body: [hello(f.name, L), "", de
          ? "vielen Dank für Ihre Nachricht. Die gewünschte Änderung können wir leider nicht umsetzen" + (f.reason ? " (" + f.reason + ")" : "") + ". Ihr Termin " + old + " bleibt bestehen."
          : "thank you for your message. Unfortunately we cannot make the change you asked for" + (f.reason ? " (" + f.reason + ")" : "") + ". Your appointment " + old + " stays as it is.",
        de ? "Bitte rufen Sie uns an, wenn wir gemeinsam eine andere Lösung suchen sollen." : "Please call us if we should look for another solution together.", "", bye(L)].join("\n") };
      case "reminder":
        return { role: "customer", subject: (de ? "Erinnerung: Ihr Termin morgen, " : "Reminder: your appointment tomorrow, ") + fmtDay(f.date, L), body: [hello(f.name, L), "", de
          ? "wir möchten Sie freundlich an Ihren Termin erinnern: Morgen, " + slot.replace(/^am /, "") + ", kommt " + tech.name + " zu Ihnen" + (f.topic ? " (" + f.topic + ")" : "") + "."
          : "this is a friendly reminder of your appointment: tomorrow, " + slot.replace(/^on /, "") + ", " + tech.name + " will come to you" + (f.topic ? " (" + f.topic + ")" : "") + ".",
        de ? "Bitte sorgen Sie dafür, dass in diesem Zeitfenster jemand zu Hause ist." : "Please make sure someone is at home during this window.", "", CHANGE[L], "", bye(L)].join("\n") };
      default:
        return null;
    }
  }

  // ---- The reminder job: daily at 9:00 Europe/Berlin, for every appointment of the following day -------------------------
  var RUN_MINUTES = 9 * 60;
  function nextRun(now) {
    var runDay = now.minutes < RUN_MINUTES ? now.day : dayPlus(now.day, 1);
    return { runDay: runDay, dueDay: dayPlus(runDay, 1) };
  }
  function mask(email) {
    var m = /^([^@])([^@]*)@(.+)$/.exec(String(email || ""));
    return m ? m[1] + "•••@" + m[3] : "";
  }

  return {
    BUSINESS: BUSINESS, DAYS: DAYS, WINDOWS: WINDOWS, TRADES: TRADES, TECHS: TECHS, REQUIRED: REQUIRED, SIGNALS: SIGNALS, SIGNAL_IDS: SIGNAL_IDS,
    SEVERITY_LABEL: SEVERITY_LABEL, MISSING_LABEL: MISSING_LABEL, WHY: WHY, ROLE: ROLE, KINDS: KINDS, FIXED: FIXED, PREPARE: PREPARE, DAY_RE: DAY_RE,
    berlinNow: berlinNow, dayPlus: dayPlus, dayDiff: dayDiff, weekday: weekday, isWorking: isWorking, workingDays: workingDays, winOf: winOf, techOf: techOf, works: works, techsFor: techsFor,
    seedCalendar: seedCalendar, seedDay: seedDay, sortAppts: sortAppts,
    signalsIn: signalsIn, severityOf: severityOf, severityReason: severityReason, tradeIn: tradeIn, intentIn: intentIn,
    parseWishes: parseWishes, halfIn: halfIn, missingOf: missingOf, freeSlots: freeSlots, chooseSlot: chooseSlot, findAppointment: findAppointment,
    fmtDay: fmtDay, fmtWindow: fmtWindow, fmtSlot: fmtSlot, topicOf: topicOf, mailFor: mailFor, fillBody: fillBody, EXAMPLE_BODIES: EXAMPLE_BODIES, nextRun: nextRun, mask: mask, squash: squash
  };
});
