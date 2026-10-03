/* automation-check.js — /automatisierungs-check only (loaded with defer by scripts/pages/30-services.mjs, after
   assets/js/tool-kit.js and assets/js/automation-rule.js). Markup: scripts/pages/lib-services/automation-check-tool.mjs.

   Sprint 41: a short guided conversation instead of a long form. One screen at a time:
     1. Ihr Betrieb            industry (free text, suggestions) and team size
     2. Was kostet Sie Zeit?   one field for several tasks, comma separated, turned into chips (1 to 6); suggestions
                               for the typed industry from the rule file's static list
     3. one screen per task    how often, minutes per run, people (steppers), does it run the same, where the
                               information arrives (several), a short description (optional)
     4. Ihr Stundensatz        optional; the notice about the analysis; the bot check; "Auswerten"
   "Auswerten" sends the entries to POST /api/automation-check (action "analyse"). The answer carries the result (the
   figures are the rule file's, the texts a language model's or the rule-based library's) and a ticket. The result
   shows the yearly estimate as a range, one card per task, where we would start, "So rechnen wir" and the call to
   action: the booking window (its note field is filled with one reference line the visitor can read and change),
   "Rückruf gewünscht" (name and phone, action "callback") and the plan by e-mail (action "report", double opt-in).

   Storage: the entries, the result and the ticket are kept in sessionStorage (key rexity_auto_check) so that a
   reload or coming back from the booking window does not lose them; they are gone when the tab is closed. Nothing
   else is stored in the browser.
   The bot check (Cloudflare Turnstile, visible, never on localhost) is loaded when the last screen is shown, or when
   a form of a restored result is touched; the one widget sits where the visitor is (last screen, then the result).

   Accessibility: every field has a label, choices are fieldsets with a legend, errors are announced (role="alert")
   and focus goes to the field in question; every screen change moves focus to its heading; a polite live region
   announces the result. The bands carry a word, never colour alone. Reduced motion: no smooth scroll.
   Text a visitor typed and text of the analysis are written with textContent only. */
(function () {
  "use strict";
  var K = window.RexityTool;
  var RULE = window.RexityAutomationRule;
  var doc = document;
  var root = doc.querySelector("[data-ac-root]");
  if (!K || !RULE || !root) return;
  var q = function (sel, el) { return (el || root).querySelector(sel); };
  var qa = function (sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); };
  var form = q("[data-ac-form]");
  var report = q("[data-ac-report]");
  var statusText = q("[data-ac-status]");
  var mail = q("[data-ac-mail]");
  var cbForm = q("[data-ac-callback]");
  if (!form || !report || !mail || !cbForm) return;
  var ENDPOINT = "/api/automation-check";
  var STORE_KEY = "rexity_auto_check";
  var TICKET_MS = 11 * 60 * 60 * 1000; // the ticket lives 12 hours on the server
  var LIM = RULE.LIMITS;
  var MAX = parseInt(form.getAttribute("data-ac-max"), 10) || LIM.tasks;
  var steps = {};
  qa("[data-ac-step]", form).forEach(function (s) { steps[s.getAttribute("data-ac-step")] = s; });
  var busyBox = q("[data-ac-busy]");
  var industryInput = q('[data-ac="industry"]');
  var addInput = q("[data-ac-add-input]");
  var chips = q("[data-ac-chips]");
  var suggestList = q("[data-ac-suggest-list]");
  var hourlyInput = q('[data-ac="hourly"]', steps.rate);
  var detail = steps.detail;
  var D = { count: q('[data-ac="count"]', detail), unit: q('[data-ac="unit"]', detail), minutes: q('[data-ac="minutes"]', detail), people: q('[data-ac="people"]', detail), desc: q('[data-ac="desc"]', detail) };

  var S = {
    de: {
      stepOf: function (n, i, total) { return "Schritt " + n + " von 4" + (total ? " · Aufgabe " + (i + 1) + " von " + total : ""); },
      remove: function (t) { return "„" + t + "“ entfernen"; },
      err: {
        industry: "Bitte nennen Sie Ihre Branche (mindestens zwei Zeichen).",
        team: "Bitte wählen Sie, wie viele Personen im Betrieb arbeiten.",
        tasks: "Bitte nennen Sie mindestens eine Aufgabe.",
        tasksMax: "Sechs Aufgaben sind das Maximum. Entfernen Sie eine, um eine andere aufzunehmen.",
        title: "Eine Aufgabe braucht mindestens zwei Zeichen.",
        count: "Bitte geben Sie an, wie oft die Aufgabe anfällt: eine ganze Zahl von " + LIM.count[0] + " bis " + LIM.count[1] + ".",
        minutes: "Bitte geben Sie die Minuten pro Durchgang an: eine ganze Zahl von " + LIM.minutes[0] + " bis " + LIM.minutes[1] + ".",
        people: "Bitte geben Sie an, wie viele Personen die Aufgabe erledigen: " + LIM.people[0] + " bis " + LIM.people[1] + ".",
        load: "Das wären mehr als " + (LIM.dayMinutes / 60) + " Stunden am Tag je Person. Bitte prüfen Sie Häufigkeit und Minuten.",
        same: "Bitte wählen Sie, ob die Aufgabe meist gleich abläuft.",
        channels: "Bitte wählen Sie mindestens einen Weg, auf dem die Informationen ankommen.",
        hourly: "Der Stundensatz muss zwischen " + LIM.hourly[0] + " und " + LIM.hourly[1] + " Euro liegen. Lassen Sie das Feld leer, wenn Sie keinen angeben möchten."
      },
      fail: "Die Auswertung hat gerade nicht geklappt. Bitte versuchen Sie es in einem Moment erneut.",
      botFail: "Die Sicherheitsprüfung (Schutz vor automatischen Anfragen) ist nicht durchgelaufen. Bitte versuchen Sie es noch einmal. Hilft das nicht, laden Sie die Seite neu; ein Inhaltsblocker kann die Prüfung verhindern.",
      botAsk: "Bitte bestätigen Sie kurz im eingeblendeten Feld, dass Sie kein automatisches Programm sind.",
      sub: function (v) { return v.industry + " · " + RULE.TEXT.de.team[v.team] + " · " + v.tasks.length + (v.tasks.length === 1 ? " Aufgabe" : " Aufgaben"); },
      estEur: "Geschätzte Entlastung pro Jahr", estHours: "Geschätzte Entlastung pro Jahr, in Stunden", estNone: "Derzeit keine Schätzung",
      estNoneP: "Nach der Auswertung ist keine Ihrer Aufgaben derzeit gut geeignet. Das ist ein Ergebnis, kein Fehler.",
      perYear: " pro Jahr",
      today: function (v) { return (v.tasks.length === 1 ? "Ihre Aufgabe braucht" : "Ihre " + v.tasks.length + " Aufgaben brauchen") + " heute zusammen rund " + RULE.hoursText(v.hours, "de") + " pro Jahr."; },
      done: function (v, est) { return "Auswertung fertig. " + (est ? "Geschätzte Entlastung: " + est + " pro Jahr. Schätzung auf Basis Ihrer Angaben, keine Zusage." : "Derzeit keine Schätzung."); },
      stays: "Bleibt bei Ihrem Team: ", needs: "Dafür nötig:", todayLabel: "Heute: ", estLabel: "Schätzung: ",
      figures: function (t) { return t.count + " × " + RULE.TEXT.de.unit[t.unit] + ", " + t.minutes + " Minuten, " + t.people + (t.people === 1 ? " Person" : " Personen"); },
      example: function (t, v) {
        var unit = { day: RULE.YEAR.day + " Arbeitstage", week: RULE.YEAR.week + " Arbeitswochen", month: RULE.YEAR.month + " Monate" }[t.unit];
        var s = "Beispiel aus Ihren Angaben („" + t.title + "“): " + t.count + " × " + unit + " × " + t.minutes + " Minuten × " + t.people + (t.people === 1 ? " Person" : " Personen") + " ÷ 60 = " + RULE.hoursText(t.hours, "de") + " pro Jahr. ";
        if (t.band === "none") return s + "Derzeit kaum automatisierbar: 0 %, also keine Schätzung für diese Aufgabe.";
        s += RULE.TEXT.de.badge[t.band] + ": " + Math.round(RULE.SHARE[t.band][0] * 100) + " bis " + Math.round(RULE.SHARE[t.band][1] * 100) + " % davon = " + RULE.rangeText(t.hoursLow, t.hoursHigh, "hours", "de") + ".";
        if (t.eurLow !== null) s += " Mit Ihrem Stundensatz von " + RULE.money(v.hourly, "de") + ": " + RULE.rangeText(t.eurLow, t.eurHigh, "eur", "de") + " pro Jahr.";
        return s;
      },
      bookNote: function (v) { return RULE.reference(v, "de") + ". Aufgaben: " + v.tasks.map(function (t) { return t.title; }).join(", ") + "."; },
      mailSending: "Wird gesendet …", mailBad: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      mailFail: "Die E-Mail konnte gerade nicht versendet werden. Bitte versuchen Sie es später erneut oder schreiben Sie uns an info@rexity.ai.",
      confirmH: "Bestätigungs-Mail unterwegs",
      confirmP: function (email, hours) { return "Wir haben eine E-Mail an " + email + " geschickt. Öffnen Sie den Link darin und bestätigen Sie dort den Versand; dann senden wir Ihnen den Bericht. Der Link gilt " + hours + " Stunden. Nichts angekommen? Bitte sehen Sie auch im Spam-Ordner nach."; },
      sentH: "Bericht unterwegs", sentP: function (email) { return "Der Bericht ist unterwegs an " + email + "."; },
      cbBad: "Bitte geben Sie Ihren Namen und eine Telefonnummer an, unter der wir Sie erreichen.",
      cbFail: "Ihre Rückruf-Bitte konnte gerade nicht gespeichert werden. Bitte rufen Sie uns an: +49 174 2471435.",
      cbDone: function (name) { return "Danke, " + name + ". Wir rufen Sie zu Ihrem Ergebnis zurück, in der Regel innerhalb eines Werktages."; },
      counter: function (n) { return n + " von " + LIM.desc + " Zeichen"; }
    },
    en: {
      stepOf: function (n, i, total) { return "Step " + n + " of 4" + (total ? " · task " + (i + 1) + " of " + total : ""); },
      remove: function (t) { return "Remove “" + t + "”"; },
      err: {
        industry: "Please name your industry (at least two characters).",
        team: "Please choose how many people work in the business.",
        tasks: "Please name at least one task.",
        tasksMax: "Six tasks are the maximum. Remove one to add another.",
        title: "A task needs at least two characters.",
        count: "Please state how often the task comes up: a whole number from " + LIM.count[0] + " to " + LIM.count[1] + ".",
        minutes: "Please state the minutes per run: a whole number from " + LIM.minutes[0] + " to " + LIM.minutes[1] + ".",
        people: "Please state how many people do the task: " + LIM.people[0] + " to " + LIM.people[1] + ".",
        load: "That would be more than " + (LIM.dayMinutes / 60) + " hours a day per person. Please check frequency and minutes.",
        same: "Please choose whether the task runs the same most of the time.",
        channels: "Please choose at least one way the information arrives.",
        hourly: "The hourly figure must be between " + LIM.hourly[0] + " and " + LIM.hourly[1] + " euros. Leave the field empty if you do not want to state one."
      },
      fail: "The analysis did not work just now. Please try again in a moment.",
      botFail: "The security check (protection against automated requests) did not complete. Please try once more. If that does not help, reload the page; a content blocker can prevent the check.",
      botAsk: "Please confirm briefly in the box shown that you are not an automated program.",
      sub: function (v) { return v.industry + " · " + RULE.TEXT.en.team[v.team] + " · " + v.tasks.length + (v.tasks.length === 1 ? " task" : " tasks"); },
      estEur: "Estimated time value per year", estHours: "Estimated time taken over per year", estNone: "No estimate at present",
      estNoneP: "By the analysis none of your tasks is well suited at present. That is a result, not an error.",
      perYear: " per year",
      today: function (v) { return (v.tasks.length === 1 ? "Your task takes about " : "Your " + v.tasks.length + " tasks together take about ") + RULE.hoursText(v.hours, "en") + " a year today."; },
      done: function (v, est) { return "Analysis finished. " + (est ? "Estimate: " + est + " per year. Estimate based on your entries, not a promise." : "No estimate at present."); },
      stays: "Stays with your team: ", needs: "Needed for it:", todayLabel: "Today: ", estLabel: "Estimate: ",
      figures: function (t) { return t.count + " × " + RULE.TEXT.en.unit[t.unit] + ", " + t.minutes + " minutes, " + t.people + (t.people === 1 ? " person" : " people"); },
      example: function (t, v) {
        var unit = { day: RULE.YEAR.day + " working days", week: RULE.YEAR.week + " working weeks", month: RULE.YEAR.month + " months" }[t.unit];
        var s = "Example from your entries (“" + t.title + "”): " + t.count + " × " + unit + " × " + t.minutes + " minutes × " + t.people + (t.people === 1 ? " person" : " people") + " ÷ 60 = " + RULE.hoursText(t.hours, "en") + " per year. ";
        if (t.band === "none") return s + "Hardly automatable at present: 0 %, so no estimate for this task.";
        s += RULE.TEXT.en.badge[t.band] + ": " + Math.round(RULE.SHARE[t.band][0] * 100) + " to " + Math.round(RULE.SHARE[t.band][1] * 100) + " % of that = " + RULE.rangeText(t.hoursLow, t.hoursHigh, "hours", "en") + ".";
        if (t.eurLow !== null) s += " At your hourly figure of " + RULE.money(v.hourly, "en") + ": " + RULE.rangeText(t.eurLow, t.eurHigh, "eur", "en") + " per year.";
        return s;
      },
      bookNote: function (v) { return RULE.reference(v, "en") + ". Tasks: " + v.tasks.map(function (t) { return t.title; }).join(", ") + "."; },
      mailSending: "Sending …", mailBad: "Please enter a valid e-mail address.",
      mailFail: "The e-mail could not be sent just now. Please try again later or write to info@rexity.ai.",
      confirmH: "Confirmation e-mail on its way",
      confirmP: function (email, hours) { return "We have sent an e-mail to " + email + ". Open the link in it and confirm the dispatch there; then we send you the report. The link is valid for " + hours + " hours. Nothing arrived? Please look in your spam folder as well."; },
      sentH: "Report on its way", sentP: function (email) { return "The report is on its way to " + email + "."; },
      cbBad: "Please enter your name and a phone number we can reach you on.",
      cbFail: "Your call-back request could not be stored just now. Please call us: +49 174 2471435.",
      cbDone: function (name) { return "Thank you, " + name + ". We will call you back about your result, usually within one working day."; },
      counter: function (n) { return n + " of " + LIM.desc + " characters"; }
    }
  };
  function L() { return S[K.lang()]; }
  function trim(v) { return String(v == null ? "" : v).replace(/\s+/g, " ").replace(/^\s+|\s+$/g, ""); }

  var state = {
    screen: 0, industry: "", team: null, tasks: [], hourly: "",
    result: null, ticket: null, at: 0, addHourly: null,
    mailState: "idle", mailTo: "", mailHours: 48, sending: false, busy: false, cbName: null, booked: false
  };
  function newTask(title) { return { title: title, count: "", unit: "week", minutes: "", people: "1", same: null, channels: [], desc: "" }; }

  // ---------------------------------------------------------------- session storage (this tab only)
  function save() {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, screen: state.screen, industry: state.industry, team: state.team, tasks: state.tasks, hourly: state.hourly, result: state.result, ticket: state.ticket, at: state.at, addHourly: state.addHourly, cbName: state.cbName }));
    } catch (e) { /* storage unavailable: the page works without it */ }
  }
  function restore() {
    var d;
    try { d = JSON.parse(sessionStorage.getItem(STORE_KEY) || "null"); } catch (e) { d = null; }
    if (!d || d.v !== 1 || !d.tasks || typeof d.tasks.length !== "number") return false;
    state.industry = trim(d.industry).slice(0, LIM.industry[1]);
    state.team = RULE.TEAMS.indexOf(d.team) >= 0 ? d.team : null;
    state.hourly = typeof d.hourly === "string" ? d.hourly.slice(0, 8) : "";
    state.tasks = [];
    for (var i = 0; i < d.tasks.length && i < MAX; i++) {
      var s = d.tasks[i] || {};
      var title = RULE.clean(s.title, LIM.title[1]);
      if (title.length < LIM.title[0]) continue;
      var t = newTask(title);
      t.count = String(s.count == null ? "" : s.count).slice(0, 4);
      t.unit = RULE.UNITS.indexOf(s.unit) >= 0 ? s.unit : "week";
      t.minutes = String(s.minutes == null ? "" : s.minutes).slice(0, 4);
      t.people = String(s.people == null ? "1" : s.people).slice(0, 3);
      t.same = RULE.SAME.indexOf(s.same) >= 0 ? s.same : null;
      t.channels = (s.channels && s.channels.filter ? s.channels : []).filter(function (c) { return RULE.CHANNELS.indexOf(c) >= 0; });
      t.desc = String(s.desc == null ? "" : s.desc).slice(0, LIM.desc);
      state.tasks.push(t);
    }
    if (d.result && d.result.tasks && typeof d.ticket === "string" && typeof d.at === "number" && Date.now() - d.at < TICKET_MS) {
      state.result = d.result;
      state.ticket = d.ticket;
      state.at = d.at;
      state.addHourly = typeof d.addHourly === "number" ? d.addHourly : null;
      state.cbName = typeof d.cbName === "string" ? d.cbName : null;
    }
    state.screen = typeof d.screen === "number" ? d.screen : 0;
    return true;
  }

  // ---------------------------------------------------------------- the screens
  function screens() {
    var out = ["business", "tasks"];
    for (var i = 0; i < state.tasks.length; i++) out.push(i);
    out.push("rate");
    return out;
  }
  function stepNo(s) { return s === "business" ? 1 : s === "tasks" ? 2 : s === "rate" ? 4 : 3; }
  function sectionOf(s) { return typeof s === "number" ? steps.detail : steps[s]; }
  function setError(section, msg) { var p = q("[data-ac-error]", section); if (p) p.textContent = msg || ""; }
  function mark(el) { if (el) el.setAttribute("aria-invalid", "true"); }
  function unmark(section) { qa("[aria-invalid]", section).forEach(function (el) { el.removeAttribute("aria-invalid"); }); qa("[data-invalid]", section).forEach(function (el) { el.removeAttribute("data-invalid"); }); }
  function show(index, focus) {
    var list = screens();
    state.screen = Math.max(0, Math.min(index, list.length - 1));
    var s = list[state.screen];
    var section = sectionOf(s);
    for (var k in steps) if (Object.prototype.hasOwnProperty.call(steps, k)) K.show(steps[k], steps[k] === section);
    K.show(busyBox, false);
    var n = stepNo(s);
    qa("[data-ac-prog-step]", form).forEach(function (li) {
      var i = parseInt(li.getAttribute("data-ac-prog-step"), 10);
      li.setAttribute("data-state", i < n ? "done" : i === n ? "current" : "todo");
      if (i === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    if (s === "tasks") { renderChips(); renderSuggestions(); }
    if (typeof s === "number") fillDetail(s);
    if (s === "rate") guard.load();
    setError(section, "");
    save();
    if (focus) {
      var h = q("[data-ac-step-h]", section);
      try { form.scrollIntoView({ behavior: K.reduce ? "auto" : "smooth", block: "start" }); } catch (e) { form.scrollIntoView(); }
      if (h) h.focus({ preventScroll: true });
    }
  }

  // step 1
  function fillBusiness() {
    industryInput.value = state.industry;
    qa('input[name="team"]', steps.business).forEach(function (r) { r.checked = r.value === state.team; });
    hourlyInput.value = state.hourly;
  }
  function readBusiness() {
    state.industry = trim(industryInput.value).slice(0, LIM.industry[1]);
    var picked = q('input[name="team"]:checked', steps.business);
    state.team = picked ? picked.value : null;
    if (state.industry.length < LIM.industry[0]) { mark(industryInput); return { msg: L().err.industry, el: industryInput }; }
    if (!state.team) { q('[data-ac-set="team"]', steps.business).setAttribute("data-invalid", ""); return { msg: L().err.team, el: q('input[name="team"]', steps.business) }; }
    return null;
  }
  steps.business.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-ac-industry]") : null;
    if (!b) return;
    industryInput.value = b.textContent;
    industryInput.removeAttribute("aria-invalid");
    industryInput.focus();
  });

  // step 2
  function renderChips() {
    K.fill(chips, state.tasks.map(function (t, i) {
      var li = K.el("li", "ac-chip");
      li.appendChild(K.el("span", "ac-chip__t", t.title));
      var b = K.el("button", "ac-chip__x", "×");
      b.type = "button";
      b.setAttribute("data-ac-remove", String(i));
      b.setAttribute("aria-label", L().remove(t.title));
      li.appendChild(b);
      return li;
    }));
  }
  function renderSuggestions() {
    var lg = K.lang();
    var have = {};
    state.tasks.forEach(function (t) { have[t.title.toLowerCase()] = 1; });
    var list = RULE.suggestionsFor(state.industry).filter(function (s) { return !have[s[lg].toLowerCase()]; });
    K.fill(suggestList, list.map(function (s) {
      var b = K.el("button", "ac-suggest__btn", s[lg]);
      b.type = "button";
      b.setAttribute("data-ac-suggest", "");
      b.disabled = state.tasks.length >= MAX;
      return b;
    }));
  }
  /* adds what is typed (several, comma separated); -> the number added, or -1 when the maximum stopped it */
  function addTyped(text) {
    var titles = RULE.splitTasks(text, MAX + 1);
    var added = 0;
    var stopped = false;
    for (var i = 0; i < titles.length; i++) {
      var dup = state.tasks.some(function (t) { return t.title.toLowerCase() === titles[i].toLowerCase(); });
      if (dup) continue;
      if (state.tasks.length >= MAX) { stopped = true; break; }
      state.tasks.push(newTask(titles[i]));
      added++;
    }
    renderChips();
    renderSuggestions();
    save();
    return stopped ? -1 : added;
  }
  function addFromInput() {
    var text = addInput.value;
    if (!trim(text)) return 0;
    var n = addTyped(text);
    addInput.value = "";
    addInput.removeAttribute("aria-invalid");
    setError(steps.tasks, n === -1 ? L().err.tasksMax : n === 0 && trim(text).length < LIM.title[0] ? L().err.title : "");
    return n;
  }
  steps.tasks.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-ac-remove], [data-ac-suggest], [data-ac-add]") : null;
    if (!t) return;
    if (t.hasAttribute("data-ac-add")) { addFromInput(); addInput.focus(); return; }
    if (t.hasAttribute("data-ac-suggest")) { setError(steps.tasks, addTyped(t.textContent) === -1 ? L().err.tasksMax : ""); addInput.focus(); return; }
    state.tasks.splice(parseInt(t.getAttribute("data-ac-remove"), 10), 1);
    renderChips();
    renderSuggestions();
    setError(steps.tasks, "");
    save();
    addInput.focus();
  });
  addInput.addEventListener("keydown", function (e) {
    // a comma or Enter turns what is typed into a chip; Enter in the empty field goes on to the next screen
    if (e.key === "," || e.key === ";") { if (trim(addInput.value)) { e.preventDefault(); addFromInput(); } }
    else if (e.key === "Enter" && trim(addInput.value)) { e.preventDefault(); addFromInput(); }
  });
  addInput.addEventListener("paste", function () { setTimeout(function () { if (/[,;\n]/.test(addInput.value)) addFromInput(); }, 0); });
  function readTasks() {
    if (trim(addInput.value)) addFromInput();
    if (!state.tasks.length) { mark(addInput); return { msg: L().err.tasks, el: addInput }; }
    return null;
  }

  // step 3
  function fillDetail(i) {
    var t = state.tasks[i];
    q("[data-ac-detail-title]", detail).textContent = t.title;
    q("[data-ac-detail-count]", detail).textContent = L().stepOf(3, i, state.tasks.length);
    D.count.value = t.count; D.unit.value = t.unit; D.minutes.value = t.minutes; D.people.value = t.people; D.desc.value = t.desc;
    qa('input[name="same"]', detail).forEach(function (r) { r.checked = r.value === t.same; });
    qa('input[name="channels"]', detail).forEach(function (c) { c.checked = t.channels.indexOf(c.value) >= 0; });
    unmark(detail);
    descCount();
  }
  function intOf(v, range) {
    v = trim(v);
    if (!/^\d{1,4}$/.test(v)) return null;
    var n = parseInt(v, 10);
    return n >= range[0] && n <= range[1] ? n : null;
  }
  function storeDetail(i) {
    var t = state.tasks[i];
    if (!t) return;
    t.count = trim(D.count.value); t.unit = D.unit.value; t.minutes = trim(D.minutes.value); t.people = trim(D.people.value);
    t.desc = String(D.desc.value || "").slice(0, LIM.desc);
    var same = q('input[name="same"]:checked', detail);
    t.same = same ? same.value : null;
    t.channels = qa('input[name="channels"]:checked', detail).map(function (c) { return c.value; });
  }
  function readDetail(i) {
    storeDetail(i);
    var t = state.tasks[i];
    var count = intOf(t.count, LIM.count), minutes = intOf(t.minutes, LIM.minutes), people = intOf(t.people, LIM.people);
    if (count === null) { mark(D.count); return { msg: L().err.count, el: D.count }; }
    if (minutes === null) { mark(D.minutes); return { msg: L().err.minutes, el: D.minutes }; }
    if (people === null) { mark(D.people); return { msg: L().err.people, el: D.people }; }
    if (count * minutes / { day: 1, week: 5, month: 21 }[t.unit] > LIM.dayMinutes) { mark(D.count); mark(D.minutes); return { msg: L().err.load, el: D.count }; }
    if (!t.same) { q('[data-ac-set="same"]', detail).setAttribute("data-invalid", ""); return { msg: L().err.same, el: q('input[name="same"]', detail) }; }
    if (!t.channels.length) { q('[data-ac-set="channels"]', detail).setAttribute("data-invalid", ""); return { msg: L().err.channels, el: q('input[name="channels"]', detail) }; }
    return null;
  }
  function descCount() { q("[data-ac-desc-count]", detail).textContent = L().counter(String(D.desc.value || "").length); }
  D.desc.addEventListener("input", descCount);
  detail.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-ac-inc], [data-ac-dec]") : null;
    if (!b) return;
    var name = b.getAttribute("data-ac-inc") || b.getAttribute("data-ac-dec");
    var up = b.hasAttribute("data-ac-inc");
    var el = D[name];
    var range = LIM[name];
    var v = parseInt(el.value, 10);
    var step = name === "minutes" ? 5 : 1;
    if (!isFinite(v)) v = up ? (name === "minutes" ? 5 : 1) : range[0];
    else if (name === "minutes") v = up ? (v < 5 ? 5 : Math.floor(v / 5) * 5 + 5) : (v <= 5 ? v - 1 : Math.ceil(v / 5) * 5 - 5);
    else v += up ? step : -step;
    el.value = String(Math.max(range[0], Math.min(range[1], v)));
    el.removeAttribute("aria-invalid");
  });

  // step 4
  function readRate() {
    state.hourly = trim(hourlyInput.value).replace(",", ".");
    if (state.hourly === "") return null;
    var h = /^\d{1,3}(\.\d{1,2})?$/.test(state.hourly) ? parseFloat(state.hourly) : NaN;
    if (!(h >= LIM.hourly[0] && h <= LIM.hourly[1])) { mark(hourlyInput); return { msg: L().err.hourly, el: hourlyInput }; }
    return null;
  }
  function payload() {
    return {
      industry: state.industry, team: state.team, hourly: state.hourly === "" ? null : parseFloat(state.hourly),
      tasks: state.tasks.map(function (t) { return { title: t.title, count: parseInt(t.count, 10), unit: t.unit, minutes: parseInt(t.minutes, 10), people: parseInt(t.people, 10), same: t.same, channels: t.channels, desc: trim(t.desc) }; })
    };
  }

  function validate(s) {
    var section = sectionOf(s);
    unmark(section);
    return s === "business" ? readBusiness() : s === "tasks" ? readTasks() : s === "rate" ? readRate() : readDetail(s);
  }
  function fault(section, bad) {
    setError(section, bad.msg);
    if (bad.el) bad.el.focus();
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (state.busy) return;
    var list = screens();
    var s = list[state.screen];
    var bad = validate(s);
    if (bad) { fault(sectionOf(s), bad); save(); return; }
    if (s !== "rate") { show(state.screen + 1, true); return; }
    // every screen once more before the request (entries restored from the session may be incomplete)
    for (var i = 0; i < list.length - 1; i++) {
      if (typeof list[i] === "number") fillDetail(list[i]);
      var b = validate(list[i]);
      if (b) { show(i, true); fault(sectionOf(list[i]), b); return; }
    }
    analyse();
  });
  form.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-ac-back]") : null;
    if (!b || state.busy) return;
    var s = screens()[state.screen];
    if (typeof s === "number") storeDetail(s);
    else if (s === "rate") state.hourly = trim(hourlyInput.value).replace(",", ".");
    show(state.screen - 1, true);
  });
  form.addEventListener("input", function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute("aria-invalid")) e.target.removeAttribute("aria-invalid");
  });
  form.addEventListener("change", function (e) {
    var set = e.target && e.target.closest ? e.target.closest("[data-ac-set]") : null;
    if (set) set.removeAttribute("data-invalid");
  });

  // ---------------------------------------------------------------- the bot check: one widget, where the visitor is
  var tsBox = q("[data-ac-ts]");
  // loaded when the last screen is shown or a form of the result is touched; the widget is rendered where it is visible
  var guard = K.guard({ form: null, box: tsBox, siteKey: form.getAttribute("data-ac-sitekey") || "", theme: "light", onAsk: function () {
    if (report.hasAttribute("hidden")) setError(steps.rate, L().botAsk);
    else q("[data-ac-mail-status]").textContent = L().botAsk;
  } });
  [mail, cbForm].forEach(function (f) { f.addEventListener("focusin", guard.load); f.addEventListener("pointerdown", guard.load); });
  function placeTs(where) {
    var slot = q('[data-ac-ts-slot="' + where + '"]');
    if (!slot || !tsBox || tsBox.parentNode === slot) return;
    slot.appendChild(tsBox);
    guard.relang(); // a moved widget is rendered again
  }

  // ---------------------------------------------------------------- the analysis
  function setBusy(on) {
    state.busy = on;
    K.show(busyBox, on);
    qa("[data-ac-next], [data-ac-back]", form).forEach(function (b) { b.disabled = on; });
    form.setAttribute("aria-busy", on ? "true" : "false");
  }
  function analyse() {
    var body = payload();
    body.action = "analyse";
    body.lang = K.lang();
    body.company_website = form.elements.company_website.value;
    setError(steps.rate, "");
    setBusy(true);
    guard.send(ENDPOINT, body, 50000).then(function (r) {
      setBusy(false);
      var d = r.data;
      if (r.status === 200 && d && d.ok && d.result && d.ticket) {
        state.result = d.result;
        state.ticket = d.ticket;
        state.at = Date.now();
        state.addHourly = null;
        state.mailState = "idle";
        state.cbName = null;
        state.booked = false;
        save();
        showResult(true);
        return;
      }
      if (r.status === 422 && d && d.error === "input") {
        var f = d.field;
        var idx = f === "industry" || f === "team" ? 0 : f === "tasks" || f === "title" ? 1 : f === "hourly" ? screens().length - 1 : 2 + (d.index || 0);
        show(idx, true);
        setError(sectionOf(screens()[state.screen]), (L().err[f] || d.message || L().fail));
        return;
      }
      setError(steps.rate, d && d.error === "bot_check" ? L().botFail : (d && d.message) || L().fail);
    }, function () { setBusy(false); setError(steps.rate, L().fail); });
  }

  // ---------------------------------------------------------------- the result
  /* the result as shown: the server's view, with the figures in euros when the hourly figure was added afterwards */
  function view() {
    var v = state.result;
    if (!v || state.addHourly === null || v.hourly !== null) return v;
    var r = RULE.compute({ industry: v.industry, team: v.team, hourly: state.addHourly, tasks: v.tasks.map(function (t) { return { title: t.title, count: t.count, unit: t.unit, minutes: t.minutes, people: t.people, same: t.same, channels: t.channels, desc: t.desc }; }) }, v.tasks.map(function (t) { return t.band; }));
    if (r.error) return v;
    var out = {};
    var k;
    for (k in v) if (Object.prototype.hasOwnProperty.call(v, k)) out[k] = v[k];
    out.hourly = r.hourly; out.eurLow = r.eurLow; out.eurHigh = r.eurHigh;
    out.tasks = v.tasks.map(function (t, i) {
      var c = {};
      for (var j in t) if (Object.prototype.hasOwnProperty.call(t, j)) c[j] = t[j];
      c.eurLow = r.tasks[i].eurLow; c.eurHigh = r.tasks[i].eurHigh;
      return c;
    });
    return out;
  }
  var ruleBox = q("[data-ac-rule]");
  function renderResult() {
    var v = view();
    if (!v) return;
    var lg = K.lang();
    var X = RULE.TEXT[lg];
    var none = v.hoursHigh === 0;
    q("[data-ac-sub]").textContent = L().sub(v);
    q("[data-ac-est-label]").textContent = none ? L().estNone : v.eurLow === null ? L().estHours : L().estEur;
    q("[data-ac-est]").textContent = none ? "–" : RULE.estimateText(v, lg) + L().perYear;
    q("[data-ac-today]").textContent = L().today(v) + (none ? " " + L().estNoneP : "");
    K.show(q("[data-ac-addrate]"), !none && v.eurLow === null);
    q("[data-ac-summary]").textContent = v.summary;
    q("[data-ac-notice]").textContent = v.notice;
    K.fill(q("[data-ac-list]"), v.tasks.map(function (t, i) {
      var li = K.el("li", "ac-item");
      li.setAttribute("data-band", t.band);
      if (v.first === i) li.setAttribute("data-first", "");
      var head = K.el("div", "ac-item__head");
      head.appendChild(K.el("p", "ac-item__band", X.badge[t.band]));
      head.appendChild(K.el("h4", "ac-item__title", t.title));
      li.appendChild(head);
      li.appendChild(K.el("p", "ac-item__sentence", X.sentence[t.band]));
      li.appendChild(K.el("p", "ac-item__sh", X.stepsHead[t.band]));
      var ul = K.el("ul", "ac-item__steps");
      t.steps.forEach(function (s) { ul.appendChild(K.el("li", "", s)); });
      li.appendChild(ul);
      var stays = K.el("p", "ac-item__stays");
      stays.appendChild(K.el("strong", "", L().stays));
      stays.appendChild(doc.createTextNode(t.stays));
      li.appendChild(stays);
      if (t.needs.length) {
        var needs = K.el("p", "ac-item__needs");
        needs.appendChild(K.el("span", "ac-item__nl", L().needs));
        t.needs.forEach(function (n) { needs.appendChild(K.el("span", "ac-need", X.need[n])); });
        li.appendChild(needs);
      }
      var fig = K.el("div", "ac-item__fig");
      var now = K.el("p", "ac-item__now");
      now.appendChild(doc.createTextNode(L().todayLabel));
      now.appendChild(K.el("strong", "", RULE.hoursText(t.hours, lg) + L().perYear));
      fig.appendChild(now);
      if (t.band !== "none") {
        var est = K.el("p", "ac-item__est");
        est.appendChild(doc.createTextNode(L().estLabel));
        est.appendChild(K.el("strong", "", RULE.estimateText(t, lg) + L().perYear));
        fig.appendChild(est);
      }
      fig.appendChild(K.el("p", "ac-item__detail", L().figures(t)));
      li.appendChild(fig);
      return li;
    }));
    q("[data-ac-first]").textContent = v.firstStep;
    // the questions we would ask in the call: the first of each task, three at most
    var qs = [];
    v.tasks.forEach(function (t) { if (t.band !== "none" && t.questions[0] && qs.length < 3) qs.push(t.questions[0]); });
    K.fill(q("[data-ac-questions]"), qs.map(function (s) { return K.el("li", "", s); }));
    K.show(q("[data-ac-questions-box]"), qs.length > 0);
    // "So rechnen wir" with one worked example from the visitor's own figures
    var ex = q("[data-ac-example]", ruleBox);
    var sample = v.tasks[v.first !== null && v.first !== undefined ? v.first : 0];
    ex.textContent = L().example(sample, v);
    K.show(ex, true);
    setMail(state.mailState);
    renderCallback();
  }
  function showResult(announce) {
    K.show(form, false);
    K.show(report, true);
    q("[data-ac-rule-slot]").appendChild(ruleBox);
    placeTs("result");
    renderResult();
    if (announce) {
      var v = view();
      statusText.textContent = L().done(v, v.hoursHigh === 0 ? "" : RULE.estimateText(v, K.lang()));
      try { report.scrollIntoView({ behavior: K.reduce ? "auto" : "smooth", block: "start" }); } catch (err) { report.scrollIntoView(); }
      q("[data-ac-title]").focus({ preventScroll: true });
    }
  }
  function showForm(index) {
    K.show(report, false);
    K.show(form, true);
    q("[data-ac-rule-home]").appendChild(ruleBox);
    K.show(q("[data-ac-example]", ruleBox), false);
    placeTs("form");
    show(index, true);
  }
  q("[data-ac-again]").addEventListener("click", function () { fillBusiness(); showForm(0); });
  q("[data-ac-how]").addEventListener("click", function (e) {
    e.preventDefault();
    ruleBox.open = true;
    try { ruleBox.scrollIntoView({ behavior: K.reduce ? "auto" : "smooth", block: "start" }); } catch (err) { ruleBox.scrollIntoView(); }
    q("summary", ruleBox).focus({ preventScroll: true });
  });
  // the hourly figure, added after the analysis: the figures in euros are computed here by the rule file
  q("[data-ac-addrate-btn]").addEventListener("click", function () {
    var input = doc.getElementById("ac-addrate");
    var err = q("[data-ac-addrate-error]");
    var raw = trim(input.value).replace(",", ".");
    var h = /^\d{1,3}(\.\d{1,2})?$/.test(raw) ? parseFloat(raw) : NaN;
    if (!(h >= LIM.hourly[0] && h <= LIM.hourly[1])) { input.setAttribute("aria-invalid", "true"); err.textContent = L().err.hourly; input.focus(); return; }
    input.removeAttribute("aria-invalid");
    err.textContent = "";
    state.addHourly = Math.round(h * 100) / 100;
    save();
    renderResult();
    var v = view();
    statusText.textContent = L().done(v, RULE.estimateText(v, K.lang()));
    q("[data-ac-title]").focus({ preventScroll: true });
  });

  // ---------------------------------------------------------------- the booking window gets one reference line
  function prefillBooking() {
    var v = view();
    var note = doc.getElementById("rx-book-message");
    if (!v || !note) return;
    if (note.value && note.value !== note.getAttribute("data-ac-prefill")) return; // the visitor wrote something: keep it
    var text = L().bookNote(v).slice(0, 1900);
    note.value = text;
    note.setAttribute("data-ac-prefill", text);
  }
  doc.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest("[data-ac-book]") : null;
    if (!b) return;
    setTimeout(prefillBooking, 60);
    if (state.booked) return;
    state.booked = true;
    try { fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "event", kind: "booking" }), keepalive: true }).catch(function () { /* a number only */ }); } catch (err) { /* nothing */ }
  }, true);

  // ---------------------------------------------------------------- "Rückruf gewünscht"
  var cbOpen = q("[data-ac-callback-open]");
  var cbStatus = q("[data-ac-callback-status]");
  var cbDone = q("[data-ac-callback-done]");
  var cbSubmit = q("[data-ac-callback-submit]");
  var cbSending = false;
  function renderCallback() {
    var done = !!state.cbName;
    K.show(cbDone, done);
    K.show(cbOpen, !done);
    if (done) { K.show(cbForm, false); q("[data-ac-callback-done-p]").textContent = L().cbDone(state.cbName); }
  }
  cbOpen.addEventListener("click", function () {
    var open = cbForm.hasAttribute("hidden");
    K.show(cbForm, open);
    cbOpen.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) doc.getElementById("ac-cb-name").focus();
  });
  cbForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (cbSending || !state.ticket) return;
    var nameEl = doc.getElementById("ac-cb-name"), phoneEl = doc.getElementById("ac-cb-phone");
    var name = trim(nameEl.value), phone = trim(phoneEl.value);
    nameEl.removeAttribute("aria-invalid"); phoneEl.removeAttribute("aria-invalid");
    var okPhone = /^[+0-9][0-9 ()\/.-]{4,38}$/.test(phone) && phone.replace(/\D/g, "").length >= 6;
    if (name.length < 2 || !okPhone) {
      var el = name.length < 2 ? nameEl : phoneEl;
      el.setAttribute("aria-invalid", "true");
      cbStatus.setAttribute("data-state", "bad");
      cbStatus.textContent = L().cbBad;
      el.focus();
      return;
    }
    cbSending = true;
    cbSubmit.disabled = true;
    cbStatus.removeAttribute("data-state");
    cbStatus.textContent = L().mailSending;
    guard.send(ENDPOINT, { action: "callback", ticket: state.ticket, hourly: state.addHourly, name: name, phone: phone, lang: K.lang() }, 30000).then(function (r) {
      cbSending = false;
      cbSubmit.disabled = false;
      var d = r.data;
      if (r.status === 200 && d && d.ok) {
        state.cbName = name;
        cbStatus.textContent = "";
        save();
        renderCallback();
        cbDone.focus();
        return;
      }
      cbStatus.setAttribute("data-state", "fail");
      cbStatus.textContent = d && d.error === "bot_check" ? L().botFail : d && d.error === "contact" ? L().cbBad : (d && d.message) || L().cbFail;
    }, function () { cbSending = false; cbSubmit.disabled = false; cbStatus.setAttribute("data-state", "fail"); cbStatus.textContent = L().cbFail; });
  });

  // ---------------------------------------------------------------- the plan by e-mail
  var mailAsk = q("[data-ac-mail-ask]");
  var mailDone = q("[data-ac-mail-done]");
  var mailStatus = q("[data-ac-mail-status]");
  var mailSubmit = q("[data-ac-mail-submit]");
  var emailInput = doc.getElementById("ac-email");
  function setMail(name, message) {
    state.mailState = name;
    mail.setAttribute("data-state", name);
    var done = name === "confirm" || name === "sent";
    K.show(mailAsk, !done);
    K.show(mailDone, done);
    mailStatus.removeAttribute("data-state");
    mailStatus.textContent = "";
    if (done) {
      q("[data-ac-mail-done-h]").textContent = name === "confirm" ? L().confirmH : L().sentH;
      q("[data-ac-mail-done-p]").textContent = name === "confirm" ? L().confirmP(state.mailTo, state.mailHours) : L().sentP(state.mailTo);
    } else if (name === "sending") {
      mailStatus.textContent = L().mailSending;
    } else if (name === "bad" || name === "fail") {
      mailStatus.setAttribute("data-state", name);
      mailStatus.textContent = message || (name === "bad" ? L().mailBad : L().mailFail);
    }
    mailSubmit.disabled = name === "sending";
  }
  mail.addEventListener("submit", function (e) {
    e.preventDefault();
    if (state.sending || !state.ticket) return;
    var email = trim(emailInput.value);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { emailInput.setAttribute("aria-invalid", "true"); setMail("bad"); emailInput.focus(); return; }
    emailInput.removeAttribute("aria-invalid");
    state.sending = true;
    setMail("sending");
    guard.send(ENDPOINT, { action: "report", ticket: state.ticket, hourly: state.addHourly, email: email, lang: K.lang() }, 30000).then(function (r) {
      state.sending = false;
      var d = r.data;
      if (r.status === 200 && d && d.ok) {
        state.mailTo = email;
        state.mailHours = d.expiresInHours || 48;
        setMail(d.status === "report_sent" ? "sent" : "confirm");
        mailDone.focus();
        return;
      }
      setMail(d && d.error === "email" ? "bad" : "fail", d && d.error === "bot_check" ? L().botFail : d && d.message);
    }, function () { state.sending = false; setMail("fail"); });
  });
  emailInput.addEventListener("input", function () { emailInput.removeAttribute("aria-invalid"); if (state.mailState === "bad" || state.mailState === "fail") setMail("idle"); });
  var mailReset = q("[data-ac-mail-reset]");
  if (mailReset) mailReset.addEventListener("click", function () { setMail("idle"); emailInput.focus(); });

  window.addEventListener("rexity:languagechange", function () {
    if (!report.hasAttribute("hidden")) renderResult();
    else {
      var s = screens()[state.screen];
      if (s === "tasks") { renderChips(); renderSuggestions(); }
      if (typeof s === "number") { storeDetail(s); fillDetail(s); }
    }
    guard.relang();
  });

  // ---------------------------------------------------------------- start
  var had = restore();
  fillBusiness();
  if (had && state.result) showResult(false);
  else show(had ? Math.min(state.screen, screens().length - 1) : 0, false);
})();
