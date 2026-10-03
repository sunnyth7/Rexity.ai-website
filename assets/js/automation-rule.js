/* automation-rule.js — the published rule of the Automatisierungs-Check (/automatisierungs-check; Sprint 39, rebuilt
   in Sprint 41). ONE file for both sides: the page loads it (window.RexityAutomationRule), api/automation-check.js
   requires it. The page prints "So rechnen wir" from the constants below
   (scripts/pages/lib-services/automation-check-tool.mjs), so page, mail and code cannot state different rules.
   No model, no network, no storage. Deterministic.

   EVERY NUMBER OF THE RESULT COMES FROM THIS FILE. The language model (api/automation-check.js) only words what an
   automation would take over and proposes a band; it never outputs hours, percentages or money.

   Input   { industry, team, tasks: [{ title, count, unit: "day" | "week" | "month", minutes, people,
             same: "yes" | "partly" | "no", channels: ["email" | "phone" | "form" | "paper" | "software"], desc? }], hourly? }
           one to six tasks
   Time    hours per year = count × (per day: 220 working days, per week: 46 working weeks, per month: 12) × minutes
           per run × people ÷ 60                                                         (count is "per person")
   Band    "full" (vollständig automatisierbar) | "partly" (teilweise) | "none" (derzeit kaum).
           With a model: the model proposes the band from the description; the code lowers "full" to "partly" when
           the visitor said the task runs differently every time (capBand).
           Without a model (ruleBand): points from the visitor's answers.
             same steps: yes 2, partly 1, no 0
             where the information arrives: only digital (e-mail, form, software) 2, digital and phone/paper 1,
             only phone/paper 0
             at least once a week (46 runs a year or more): 1
           4 or 5 points -> full, 2 or 3 -> partly, 0 or 1 -> none
   Share   the part of today's time an automation takes over, a published assumption per band:
           full 70–90 %, partly 30–50 %, none 0 %. The real share is determined in the first conversation.
   Result  hours per year × share = a range of hours; × the visitor's own hourly figure = a range of euros.
           Without an hourly figure the result states hours only. Ranges are rounded DOWN (hours: to 1 below 50,
           to 5 below 500, else to 10; euros: to 10 below 200, to 50 below 2,000, to 100 below 20,000, else to 500).
   The result is an estimate from the visitor's own figures, never a promise. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.RexityAutomationRule = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var YEAR = { day: 220, week: 46, month: 12 };
  var PER_DAY = { day: 1, week: 5, month: 21 }; // working days a period has, for the plausibility limit only
  var SHARE = { full: [0.7, 0.9], partly: [0.3, 0.5], none: [0, 0] };
  var POINTS = { same: { yes: 2, partly: 1, no: 0 }, channels: { digital: 2, mixed: 1, analog: 0 }, weekly: 1, weeklyRuns: 46, full: 4, partly: 2 };
  var LIMITS = { tasks: 6, title: [2, 60], desc: 400, industry: [2, 60], count: [1, 500], minutes: [1, 600], people: [1, 50], hourly: [1, 500], dayMinutes: 600 };
  var BANDS = ["full", "partly", "none"];
  var UNITS = ["day", "week", "month"];
  var SAME = ["yes", "partly", "no"];
  var TEAMS = ["1", "2-5", "6-20", "21+"];
  var CHANNELS = ["email", "phone", "form", "paper", "software"];
  var DIGITAL = { email: 1, form: 1, software: 1 };
  var NEEDS = ["mailbox", "calendar", "phone", "form", "software", "files", "accounting"];

  function isInt(v, range) { return typeof v === "number" && isFinite(v) && Math.floor(v) === v && v >= range[0] && v <= range[1]; }
  function clean(v, max) {
    return String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "").slice(0, max);
  }

  /* "Angebote schreiben, Termine bestätigen; Rechnungen ablegen" -> ["Angebote schreiben", "Termine bestätigen", …]
     separators: comma, semicolon, line break. Empty parts and repeats are dropped; each title is cut at 60 characters. */
  function splitTasks(text, max) {
    var parts = String(text == null ? "" : text).split(/[,;\n\r]+/);
    var out = [];
    var seen = {};
    for (var i = 0; i < parts.length; i++) {
      var t = clean(parts[i], LIMITS.title[1]);
      var key = t.toLowerCase();
      if (t.length < LIMITS.title[0] || seen[key]) continue;
      seen[key] = 1;
      out.push(t);
      if (out.length >= (max || LIMITS.tasks)) break;
    }
    return out;
  }

  /* -> the clean input, or { error: code, index? }.
     Codes: industry, team, tasks (none, or more than six), title, count, unit, minutes, people, load (more than ten
     hours a day per person), same, channels, hourly */
  function normalise(input) {
    if (!input || typeof input !== "object") return { error: "tasks" };
    var industry = clean(input.industry, LIMITS.industry[1]);
    if (industry.length < LIMITS.industry[0]) return { error: "industry" };
    if (TEAMS.indexOf(input.team) < 0) return { error: "team" };
    var list = input.tasks;
    if (!list || typeof list.length !== "number" || list.length < 1 || list.length > LIMITS.tasks) return { error: "tasks" };
    var tasks = [];
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (!t || typeof t !== "object") return { error: "tasks", index: i };
      var title = clean(t.title, LIMITS.title[1]);
      if (title.length < LIMITS.title[0]) return { error: "title", index: i };
      if (!isInt(t.count, LIMITS.count)) return { error: "count", index: i };
      if (UNITS.indexOf(t.unit) < 0) return { error: "unit", index: i };
      if (!isInt(t.minutes, LIMITS.minutes)) return { error: "minutes", index: i };
      if (!isInt(t.people, LIMITS.people)) return { error: "people", index: i };
      if (t.count * t.minutes / PER_DAY[t.unit] > LIMITS.dayMinutes) return { error: "load", index: i };
      if (SAME.indexOf(t.same) < 0) return { error: "same", index: i };
      if (!t.channels || typeof t.channels.length !== "number") return { error: "channels", index: i };
      var channels = [];
      for (var c = 0; c < CHANNELS.length; c++) {
        for (var k = 0; k < t.channels.length; k++) if (t.channels[k] === CHANNELS[c]) { channels.push(CHANNELS[c]); break; }
      }
      if (!channels.length || channels.length !== t.channels.length) return { error: "channels", index: i };
      if (t.desc !== undefined && t.desc !== null && typeof t.desc !== "string") return { error: "desc", index: i };
      tasks.push({ title: title, count: t.count, unit: t.unit, minutes: t.minutes, people: t.people, same: t.same, channels: channels, desc: clean(t.desc, LIMITS.desc) });
    }
    var hourly = null;
    if (input.hourly !== undefined && input.hourly !== null && input.hourly !== "") {
      if (typeof input.hourly !== "number" || !isFinite(input.hourly) || input.hourly < LIMITS.hourly[0] || input.hourly > LIMITS.hourly[1]) return { error: "hourly" };
      hourly = Math.round(input.hourly * 100) / 100;
    }
    return { industry: industry, team: input.team, tasks: tasks, hourly: hourly };
  }

  function runsPerYear(t) { return t.count * YEAR[t.unit]; }
  function hoursPerYear(t) { return t.count * YEAR[t.unit] * t.minutes * t.people / 60; }
  function channelKind(t) {
    var d = 0;
    for (var i = 0; i < t.channels.length; i++) if (DIGITAL[t.channels[i]]) d++;
    return d === t.channels.length ? "digital" : d === 0 ? "analog" : "mixed";
  }
  function points(t) { return POINTS.same[t.same] + POINTS.channels[channelKind(t)] + (runsPerYear(t) >= POINTS.weeklyRuns ? POINTS.weekly : 0); }
  /* the band without a model: from the visitor's answers only */
  function ruleBand(t) { var p = points(t); return p >= POINTS.full ? "full" : p >= POINTS.partly ? "partly" : "none"; }
  /* a model's band, limited by the visitor's own answer: "runs differently every time" is never "full" */
  function capBand(band, t) { return BANDS.indexOf(band) < 0 ? ruleBand(t) : band === "full" && t.same === "no" ? "partly" : band; }

  function stepOf(v, money) {
    if (money) return v < 200 ? 10 : v < 2000 ? 50 : v < 20000 ? 100 : 500;
    return v < 50 ? 1 : v < 500 ? 5 : 10;
  }
  function roundDown(v, money) { var s = stepOf(v, money); return Math.floor((v + 1e-9) / s) * s; }

  /* -> the figures of the result, or { error, index? } (see normalise).
     bands: one band per task (from the model, already limited by capBand), or nothing: ruleBand for every task */
  function compute(input, bands) {
    var n = normalise(input);
    if (n.error) return n;
    var tasks = [];
    var sum = { hours: 0, low: 0, high: 0 };
    var counts = { full: 0, partly: 0, none: 0 };
    for (var i = 0; i < n.tasks.length; i++) {
      var t = n.tasks[i];
      var band = bands && BANDS.indexOf(bands[i]) >= 0 ? capBand(bands[i], t) : ruleBand(t);
      var h = hoursPerYear(t);
      var low = h * SHARE[band][0];
      var high = h * SHARE[band][1];
      sum.hours += h; sum.low += low; sum.high += high;
      counts[band]++;
      tasks.push({
        index: i, title: t.title, count: t.count, unit: t.unit, minutes: t.minutes, people: t.people, same: t.same, channels: t.channels, desc: t.desc,
        band: band, points: points(t), hours: Math.round(h),
        hoursLow: roundDown(low, false), hoursHigh: roundDown(high, false),
        eurLow: n.hourly === null ? null : roundDown(low * n.hourly, true), eurHigh: n.hourly === null ? null : roundDown(high * n.hourly, true)
      });
    }
    var order = tasks.filter(function (x) { return x.band !== "none"; }).sort(function (a, b) {
      return (BANDS.indexOf(a.band) - BANDS.indexOf(b.band)) || (b.hours - a.hours) || (a.index - b.index);
    }).map(function (x) { return x.index; });
    return {
      industry: n.industry, team: n.team, hourly: n.hourly, tasks: tasks, counts: counts,
      hours: Math.round(sum.hours),
      hoursLow: roundDown(sum.low, false), hoursHigh: roundDown(sum.high, false),
      eurLow: n.hourly === null ? null : roundDown(sum.low * n.hourly, true), eurHigh: n.hourly === null ? null : roundDown(sum.high * n.hourly, true),
      order: order, first: order.length ? order[0] : null
    };
  }

  /* ---- words and number formats, the same on the page and in the mails ---- */
  var TEXT = {
    de: {
      badge: { full: "Vollständig automatisierbar", partly: "Teilweise automatisierbar", none: "Derzeit kaum automatisierbar" },
      sentence: {
        full: "Diese Aufgabe können wir vollständig für Sie automatisieren.",
        partly: "Diese Aufgabe können wir teilweise für Sie automatisieren.",
        none: "Diese Aufgabe lässt sich nach Ihren Angaben derzeit kaum automatisieren: Der Ablauf wechselt oder die Informationen kommen nicht digital an."
      },
      stepsHead: { full: "Was die Automatisierung übernimmt", partly: "Was die Automatisierung übernimmt", none: "Was zuerst nötig wäre" },
      unit: { day: "pro Tag", week: "pro Woche", month: "pro Monat" },
      same: { yes: "Ja, fast immer", partly: "Teils", no: "Jedes Mal anders" },
      team: { "1": "Nur ich", "2-5": "2 bis 5 Personen", "6-20": "6 bis 20 Personen", "21+": "Mehr als 20 Personen" },
      channel: { email: "E-Mail", phone: "Telefon", form: "Formular", paper: "Papier", software: "Software" },
      need: { mailbox: "Postfach", calendar: "Kalender", phone: "Telefonanlage", form: "Website-Formular", software: "Branchensoftware", files: "Tabellen/Dateien", accounting: "Buchhaltung" },
      estimate: "Schätzung auf Basis Ihrer Angaben, keine Zusage.",
      perYear: "pro Jahr", hoursToday: "heute", noRange: "keine Schätzung"
    },
    en: {
      badge: { full: "Fully automatable", partly: "Partly automatable", none: "Hardly automatable at present" },
      sentence: {
        full: "We can automate this task fully for you.",
        partly: "We can automate this task partly for you.",
        none: "By your entries this task can hardly be automated at present: the process changes or the information does not arrive digitally."
      },
      stepsHead: { full: "What the automation takes over", partly: "What the automation takes over", none: "What would be needed first" },
      unit: { day: "per day", week: "per week", month: "per month" },
      same: { yes: "Yes, almost always", partly: "Partly", no: "Different every time" },
      team: { "1": "Just me", "2-5": "2 to 5 people", "6-20": "6 to 20 people", "21+": "More than 20 people" },
      channel: { email: "E-mail", phone: "Phone", form: "Form", paper: "Paper", software: "Software" },
      need: { mailbox: "Mailbox", calendar: "Calendar", phone: "Phone system", form: "Website form", software: "Industry software", files: "Spreadsheets/files", accounting: "Accounting" },
      estimate: "Estimate based on your entries, not a promise.",
      perYear: "per year", hoursToday: "today", noRange: "no estimate"
    }
  };
  function lg(lang) { return lang === "en" ? "en" : "de"; }
  function int(n, lang) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, lang === "en" ? "," : "."); }
  function money(n, lang) { return lang === "en" ? "€" + int(n, lang) : int(n, lang) + " €"; }
  function hoursText(h, lang) { return int(h, lang) + (lang === "en" ? (h === 1 ? " hour" : " hours") : (h === 1 ? " Stunde" : " Stunden")); }
  /* "4.000–7.000 €" / "€4,000–7,000"; "120–155 Stunden"; equal ends are written once */
  function rangeText(low, high, kind, lang) {
    var L = lg(lang);
    var span = low === high ? int(low, L) : int(low, L) + "–" + int(high, L);
    if (kind === "eur") return L === "en" ? "€" + span : span + " €";
    return span + (L === "en" ? (high === 1 ? " hour" : " hours") : (high === 1 ? " Stunde" : " Stunden"));
  }
  /* the range of one task or of the whole result, in euros when an hourly figure was entered, else in hours */
  function estimateText(x, lang) {
    return x.eurLow === null || x.eurLow === undefined ? rangeText(x.hoursLow, x.hoursHigh, "hours", lang) : rangeText(x.eurLow, x.eurHigh, "eur", lang);
  }
  /* one line for the booking note and our notification: "Automatisierungs-Check: 3 Aufgaben, Schätzung 4.000–7.000 € pro Jahr" */
  function reference(r, lang) {
    var L = lg(lang);
    var n = r.tasks.length;
    return L === "de"
      ? "Automatisierungs-Check: " + n + (n === 1 ? " Aufgabe" : " Aufgaben") + ", Schätzung " + estimateText(r, L) + " pro Jahr"
      : "Automation check: " + n + (n === 1 ? " task" : " tasks") + ", estimate " + estimateText(r, L) + " per year";
  }
  function pct(v) { return String(Math.round(v * 100)); }
  /* the formula and the assumptions as sentences ("So rechnen wir"), from the constants above */
  function ruleLines(lang) {
    var de = lg(lang) === "de";
    var S = SHARE;
    return de ? [
      "Stunden pro Jahr = Häufigkeit × Minuten pro Durchgang × Zahl der Personen ÷ 60. Aus „pro Tag“ werden " + YEAR.day + " Arbeitstage im Jahr und aus „pro Woche“ " + YEAR.week + " Arbeitswochen (Urlaub und Feiertage sind abgezogen), aus „pro Monat“ " + YEAR.month + " Monate.",
      "Anteil, den eine Automatisierung übernimmt (unsere Annahme je Einstufung): vollständig automatisierbar " + pct(S.full[0]) + " bis " + pct(S.full[1]) + " % der Zeit, teilweise automatisierbar " + pct(S.partly[0]) + " bis " + pct(S.partly[1]) + " %, derzeit kaum automatisierbar 0 %. Den tatsächlichen Anteil ermitteln wir im ersten Gespräch an Ihrem Ablauf.",
      "Schätzung pro Jahr = Stunden pro Jahr × Anteil × Ihr Stundensatz, als Spanne von–bis und abgerundet. Ohne Stundensatz nennen wir Stunden statt Euro. Die Gesamtspanne bilden wir aus den ungerundeten Werten der Aufgaben; sie kann deshalb leicht von der Summe der gerundeten Einzelwerte abweichen.",
      "Die Kosten einer Umsetzung sind in der Schätzung nicht abgezogen. Sie ist keine Zusage."
    ] : [
      "Hours per year = frequency × minutes per run × number of people ÷ 60. “Per day” becomes " + YEAR.day + " working days a year and “per week” " + YEAR.week + " working weeks (leave and public holidays are deducted), “per month” " + YEAR.month + " months.",
      "Share an automation takes over (our assumption per rating): fully automatable " + pct(S.full[0]) + " to " + pct(S.full[1]) + " % of the time, partly automatable " + pct(S.partly[0]) + " to " + pct(S.partly[1]) + " %, hardly automatable at present 0 %. We determine the actual share in the first conversation, on your process.",
      "Estimate per year = hours per year × share × your hourly figure, as a range from–to and rounded down. Without an hourly figure we state hours instead of euros. The total range is built from the tasks' unrounded values; it can therefore differ slightly from the sum of the rounded single values.",
      "The cost of a build is not deducted in the estimate. It is not a promise."
    ];
  }

  /* ---- suggestions: industries and typical recurring tasks (a static list; nothing here is a statistic) ---- */
  function B(de, en) { return { de: de, en: en }; }
  var GENERAL = [B("Anfragen beantworten", "Answering enquiries"), B("Angebote schreiben", "Writing quotes"), B("Termine bestätigen", "Confirming appointments"), B("Rechnungen ablegen", "Filing invoices"), B("Zahlungserinnerungen senden", "Sending payment reminders"), B("Daten in Listen übertragen", "Copying data into lists")];
  var INDUSTRIES = [
    { name: B("Handwerk", "Trades"), match: /handwerk|elektr|sanit|heizung|maler|tischler|schreiner|dachdeck|bau|install|trade|plumb|paint|roof|carpent/i,
      tasks: [B("Anfragen beantworten", "Answering enquiries"), B("Angebote schreiben", "Writing quotes"), B("Termine abstimmen", "Arranging appointments"), B("Rechnungen schreiben", "Writing invoices"), B("Material bestellen", "Ordering material"), B("Stundenzettel erfassen", "Recording time sheets")] },
    { name: B("Praxis", "Practice"), match: /praxis|arzt|ärzt|zahn|physio|therap|heilprakt|practice|doctor|dent|clinic/i,
      tasks: [B("Termine bestätigen", "Confirming appointments"), B("Terminerinnerungen senden", "Sending appointment reminders"), B("Rezeptanfragen bearbeiten", "Handling prescription requests"), B("Anrufe annehmen", "Taking calls"), B("Befunde ablegen", "Filing reports"), B("Absagen nachbesetzen", "Refilling cancelled slots")] },
    { name: B("Büro und Dienstleistung", "Office and services"), match: /büro|buero|dienstleist|agentur|beratung|consult|office|service|agency/i,
      tasks: GENERAL },
    { name: B("Einzelhandel und Online-Shop", "Retail and online shop"), match: /handel|shop|laden|geschäft|retail|store|e-commerce|versand/i,
      tasks: [B("Kundenfragen beantworten", "Answering customer questions"), B("Bestellungen erfassen", "Recording orders"), B("Retouren bearbeiten", "Handling returns"), B("Lagerbestand pflegen", "Maintaining stock lists"), B("Rechnungen ablegen", "Filing invoices"), B("Lieferanten anschreiben", "Writing to suppliers")] },
    { name: B("Gastronomie und Hotel", "Restaurants and hotels"), match: /gastro|restaurant|hotel|café|cafe|pension|catering|imbiss/i,
      tasks: [B("Reservierungen bestätigen", "Confirming reservations"), B("Anfragen für Feiern beantworten", "Answering event enquiries"), B("Dienstpläne schreiben", "Writing staff rotas"), B("Bestellungen bei Lieferanten", "Ordering from suppliers"), B("Rechnungen ablegen", "Filing invoices"), B("Bewertungen beantworten", "Replying to reviews")] },
    { name: B("Fitness und Studio", "Fitness and studios"), match: /fitness|studio|yoga|sport|gym|kurs|tanz|pilates/i,
      tasks: [B("Probetrainings vereinbaren", "Arranging trial sessions"), B("Kursanmeldungen bestätigen", "Confirming class bookings"), B("Mitgliederfragen beantworten", "Answering member questions"), B("Zahlungserinnerungen senden", "Sending payment reminders"), B("Kündigungen bearbeiten", "Handling cancellations"), B("Kursplan aktualisieren", "Updating the class schedule")] },
    { name: B("Kfz und Werkstatt", "Garages and car services"), match: /kfz|auto|werkstatt|aufbereitung|reifen|garage|car|vehicle|workshop/i,
      tasks: [B("Werkstatttermine vergeben", "Booking workshop appointments"), B("Kostenvoranschläge schreiben", "Writing cost estimates"), B("Kunden über Fertigstellung informieren", "Telling customers the car is ready"), B("Teile bestellen", "Ordering parts"), B("Rechnungen schreiben", "Writing invoices"), B("An Prüftermine erinnern", "Reminding of inspection dates")] },
    { name: B("Immobilien und Hausverwaltung", "Property and facility management"), match: /immobil|hausverwalt|makler|verwaltung|property|real estate|estate/i,
      tasks: [B("Besichtigungen abstimmen", "Arranging viewings"), B("Mieteranfragen beantworten", "Answering tenant enquiries"), B("Schadensmeldungen erfassen", "Recording damage reports"), B("Handwerker beauftragen", "Commissioning tradespeople"), B("Abrechnungen vorbereiten", "Preparing statements"), B("Unterlagen ablegen", "Filing documents")] },
    { name: B("Steuer, Recht und Beratung", "Tax, legal and advisory"), match: /steuer|kanzlei|recht|anwalt|notar|tax|law|legal|account/i,
      tasks: [B("Unterlagen anfordern", "Requesting documents"), B("Fristen überwachen", "Tracking deadlines"), B("Termine abstimmen", "Arranging appointments"), B("Mandantenfragen beantworten", "Answering client questions"), B("Belege ablegen", "Filing receipts"), B("Rechnungen schreiben", "Writing invoices")] }
  ];
  /* the task suggestions for a typed industry (free text); the general list when nothing matches */
  function suggestionsFor(industry) {
    var s = String(industry == null ? "" : industry);
    for (var i = 0; i < INDUSTRIES.length; i++) if (INDUSTRIES[i].match.test(s)) return INDUSTRIES[i].tasks;
    return GENERAL;
  }

  /* the kind of a task, from its name and description: picks the rule-based texts (api/_automation-texts.js) */
  var TYPES = [
    ["reminders", /erinner|mahn|zahlungserinn|nachfass|remind|dunning|follow[- ]?up/i],
    ["appointments", /termin|reservier|buchung|besichtig|probetraining|kalender|appointment|booking|reservation|schedule|viewing/i],
    ["offers", /angebot|kostenvoranschl|offert|quote|quotation|estimate|proposal/i],
    ["invoices", /rechnung|beleg|buchhalt|abrechn|quittung|invoice|receipt|bookkeep|billing|statement/i],
    ["enquiries", /anfrage|anruf|e-?mail|kundenfrage|mieteranfrage|mitgliederfrage|mandantenfrage|frage|bewertung|rückfrage|enquir|inquir|question|call|review|request/i],
    ["dataentry", /erfass|übertrag|eintrag|eingeb|pfleg|ableg|abtipp|liste|tabelle|stammdaten|stundenzettel|bestell|data entry|record|copy|enter|maintain|filing|file|order/i],
    ["reporting", /bericht|auswert|report|statistik|übersicht|kennzahl|plan\b|dienstplan|kursplan|summary|overview|rota/i]
  ];
  function taskType(t) {
    // the name decides; the description only when the name says nothing
    var texts = [String((t && t.title) || ""), String((t && t.desc) || "")];
    for (var k = 0; k < texts.length; k++) {
      for (var i = 0; i < TYPES.length; i++) if (TYPES[i][1].test(texts[k])) return TYPES[i][0];
    }
    return "other";
  }

  return {
    YEAR: YEAR, SHARE: SHARE, POINTS: POINTS, LIMITS: LIMITS, BANDS: BANDS, UNITS: UNITS, SAME: SAME, TEAMS: TEAMS, CHANNELS: CHANNELS, NEEDS: NEEDS, TEXT: TEXT,
    INDUSTRIES: INDUSTRIES, GENERAL: GENERAL,
    clean: clean, splitTasks: splitTasks, normalise: normalise, compute: compute, hoursPerYear: hoursPerYear, runsPerYear: runsPerYear, channelKind: channelKind,
    points: points, ruleBand: ruleBand, capBand: capBand, roundDown: roundDown, int: int, money: money, hoursText: hoursText, rangeText: rangeText,
    estimateText: estimateText, reference: reference, ruleLines: ruleLines, suggestionsFor: suggestionsFor, taskType: taskType
  };
});
