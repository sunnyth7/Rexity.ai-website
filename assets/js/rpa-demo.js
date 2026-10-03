/* rpa-demo.js — the sandbox agent of the demo "Vom Posteingang zum Auftrag" on /automation/rpa (Sprint 42; loaded
   with defer by scripts/pages/30-services.mjs after assets/js/tool-kit.js and assets/js/rpa-agent-core.js).
   Shell markup: scripts/pages/lib-services/rpa-demo.mjs. Functions: docs/RPA_DEMO_API.md.

   The sandbox. A fictional business with three fictional servicemen and a calendar of the next ten working days,
   partly filled with fictional appointments. It belongs to this visitor and lives in this browser: one localStorage
   entry ("rexity_rpa_demo": calendar, approvals, outbox, log, a random session id, whether an address is waiting
   for confirmation or confirmed, and then that address in masked form only), 7 days, removed by "Demo zurücksetzen".
   Every decision (severity, required details, serviceman, slot, which appointment a change request means, every
   date, every mail template) is the fixed code of assets/js/rpa-agent-core.js.

   Three flows.
   1 Neue Anfrage      read and check -> availability -> calendar -> mail to the customer, copy to the serviceman.
                       A required detail missing: the agent books nothing, writes the question back and waits; a small
                       form supplies the details "as if the customer had answered", then the flow goes on.
   2 Termin verschieben / stornieren   the agent finds the appointment, proposes the change and puts it under
                       "Freigaben". Nothing changes until the visitor presses "Freigeben" (or "Ablehnen").
   3 Erinnerungslauf   the panel shows what the daily 9:00 job sends next; "Lauf jetzt ansehen" draws those mails.

   Requests. A ready-made example makes none. An own text: one POST { action: "read" } (bot check: Cloudflare
   Turnstile, visible, never on localhost). E-mail: every mail is drawn on screen. Real mail goes only to the
   visitor's own address after the signed link was confirmed (subscribe -> status -> send); this script sends a
   session id and the facts of a mail, never a recipient. The one address field of the page is the visitor's own.

   Waiting for the visitor (founder, 3 Oct 2026): each place where the flow waits is a [data-rd-wait] block with one
   instruction line ("Bitte drücken Sie „…“, um ….") and one button; the block that is a current waiting state
   carries data-rd-on and its button the filled accent style, everything else is quiet. A busy button cannot be
   pressed twice. Focus moves to the next required control when the agent stops; the instruction is announced in
   the live region. Nothing advances by itself where a person decides.
   Text from a function or the visitor is written with textContent only, never as HTML. */
(function () {
  "use strict";
  var K = window.RexityTool;
  var C = window.RexityRpaCore;
  var doc = document;
  var root = doc.querySelector("[data-rd]");
  if (!K || !C || !root || !window.fetch) return;
  var q = function (sel, el) { return (el || root).querySelector(sel); };
  var qa = function (sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); };
  var form = q("[data-rd-form]");
  var text = doc.getElementById("rd-text");
  var examplesNode = q("[data-rd-examples]");
  if (!form || !text || !examplesNode) return;
  var EXAMPLES;
  try { EXAMPLES = JSON.parse(examplesNode.textContent); } catch (e) { return; }
  var MAX = parseInt(root.getAttribute("data-rd-max"), 10) || 1500;
  var MIN = parseInt(root.getAttribute("data-rd-min"), 10) || 20;
  var API = "/api/rpa-demo";
  var KEY = "rexity_rpa_demo";
  var LIFE_MS = 7 * 86400000;
  var STEP_MS = 700;
  var errorBox = q("[data-rd-error]");
  var statusText = q("[data-rd-status]");
  var countBox = q("[data-rd-count]");
  var kindBox = q("[data-rd-kind]");
  var badge = q("[data-rd-badge]");
  var tsBox = q("[data-rd-ts]");
  var runBox = q("[data-rd-run]");
  var runTitle = q("[data-rd-run-title]");
  var runState = q("[data-rd-run-state]");
  var stepsBox = q("[data-rd-steps]");
  var sourceBox = q("[data-rd-source]");
  var afterBox = q("[data-rd-after]");
  var tabs = qa("[data-rd-example]");
  var ptabs = qa("[data-rd-tab]");
  var startBtn = q('[data-rd-main="start"]');
  var runBtn = q('[data-rd-main="run"]');
  var resetBtn = q('[data-rd-main="reset"]');

  // ---------------------------------------------------------------- texts
  var TXT = {
    de: {
      state: { idle: "wartet", active: "läuft …", done: "fertig", stopped: "gestoppt", details: "wartet auf Rückmeldung", approval: "wartet auf Freigabe", rejected: "abgelehnt" },
      ownKind: "Ihr eigener Text",
      count: function (n) { return n + " / " + String(MAX).replace(/\B(?=(\d{3})+(?!\d))/g, "."); },
      press: function (label, what) { return "Bitte drücken Sie „" + label + "“, um " + what + "."; },
      start: "E-Mail an den Agenten übergeben", startWhat: "sie lesen, prüfen und einplanen zu lassen", busy: "Der Agent arbeitet …",
      startLater: "Der Agent wartet gerade auf Sie (siehe unten). Sie können trotzdem eine weitere E-Mail übergeben.",
      short: "Bitte fügen Sie eine E-Mail mit mindestens " + MIN + " Zeichen ein oder wählen Sie eines der Beispiele.",
      network: "Der Agent ist gerade nicht erreichbar. Bitte prüfen Sie Ihre Internetverbindung; die Beispiele funktionieren weiterhin.",
      botFail: "Die Sicherheitsprüfung (Schutz vor automatischen Anfragen) ist nicht durchgelaufen. Bitte versuchen Sie es noch einmal. Hilft das nicht, laden Sie die Seite neu; ein Inhaltsblocker kann die Prüfung verhindern.",
      botAsk: "Bitte bestätigen Sie kurz im Feld unter dem Text, dass Sie kein automatisches Programm sind.",
      quotaHint: " Die Beispiele funktionieren weiterhin.",
      none: "nicht genannt",
      steps: {
        read: ["Lesen und prüfen", "Angaben, Gewerk und Dringlichkeit aus der E-Mail"],
        slots: ["Verfügbarkeit prüfen", "Passender Monteur, erstes passendes Zeitfenster"],
        book: ["Kalender blockieren", "Der Termin steht im Kalender"],
        mails: ["E-Mail an den Kunden, Kopie an den Monteur", "Im Postausgang, als fertige E-Mails"],
        find: ["Termin im Kalender finden", "Nach Name, Adresse und Datum"],
        propose: ["Änderung vorschlagen", "Nach denselben Regeln wie bei einer neuen Anfrage"],
        approve: ["Freigabe durch einen Menschen", "Der Agent ändert nichts allein"]
      },
      running: { read: "Der Agent liest und prüft die E-Mail.", slots: "Der Agent prüft, welcher Monteur wann frei ist.", book: "Der Agent blockiert das Zeitfenster im Kalender.", mails: "Der Agent schreibt die E-Mails.", find: "Der Agent sucht den Termin im Kalender.", propose: "Der Agent bereitet den Vorschlag vor.", approve: "Der Agent legt den Vorschlag zur Freigabe vor." },
      field: { topic: "Anliegen", trade: "Gewerk", severity: "Dringlichkeit", name: "Name", phone: "Telefon", email: "E-Mail", address: "Adresse", wish: "Wunschtermin", old: "Bestehender Termin", intent: "Art der E-Mail", required: "Pflichtangaben" },
      intent: { new: "neue Anfrage", move: "Termin verschieben", cancel: "Termin stornieren", other: "weder Auftrag noch Terminänderung" },
      because: function (a, b) { return a + " (weil: " + b + ")"; },
      complete: "vollständig: Anliegen, Name, Kontaktweg und Adresse sind da",
      missing: function (l) { return "fehlt: " + l; },
      missingShort: { topic: "Anliegen", name: "Name", contact: "Kontaktweg", address: "Adresse" },
      stopNote: "Der Agent bucht nichts, solange Pflichtangaben fehlen. Er hat eine Rückfrage an den Kunden geschrieben (siehe Postausgang) und wartet auf die Antwort.",
      declineNote: "Das Anliegen gehört nicht zu Heizung, Sanitär oder Elektro. Der Agent hat keinen Termin eingeplant und dem Kunden eine Absage geschrieben (siehe Postausgang).",
      otherNote: "Der Agent erkennt weder einen Auftrag noch eine Terminänderung. Die E-Mail bleibt für das Büro im Posteingang; er schreibt nichts und bucht nichts.",
      detailsLead: "Antwort des Kunden nachtragen (Demo): Tragen Sie die fehlenden Angaben so ein, als hätte der Kunde geantwortet.",
      detailsBtn: "Angaben nachtragen und fortfahren", detailsWhat: "den Agenten mit vollständigen Angaben weiterarbeiten zu lassen",
      detailsFirst: "Bitte tragen Sie zuerst die fehlenden Angaben ein. ",
      detailsBad: "Bitte füllen Sie jedes Feld aus (mindestens 3 Zeichen; bei der Telefonnummer nur Ziffern, Leerzeichen und +).",
      detailLabel: { topic: "Anliegen des Kunden", name: "Name des Kunden", contact: "Telefonnummer des Kunden", address: "Adresse des Einsatzes (Straße, Hausnummer, Ort)" },
      answered: "Der Kunde hat geantwortet (Demo): Die fehlenden Angaben wurden nachgetragen.",
      candidates: "Die drei besten freien Zeitfenster", chosen: "gewählt", alt: "Alternative",
      noSlot: "Kein freies Zeitfenster in den nächsten zehn Werktagen. Der Agent bucht nichts; im echten Betrieb ginge der Vorgang an das Büro.",
      booked: "Im Kalender eingetragen", newTag: "Neu",
      mailsNote: function (n) { return n + " E-Mails stehen im Postausgang: die Bestätigung an den Kunden und die Kopie an den Monteur."; },
      openOut: "Postausgang öffnen", openCal: "Kalender öffnen", openAppr: "Zu den Freigaben",
      found: "Gefunden", ambiguous: "Mehrere Termine passen. Der Agent ändert nichts und hat beim Kunden nachgefragt, welcher Termin gemeint ist (siehe Postausgang).",
      notFound: "Im Kalender steht kein Termin, der zu Name oder Adresse passt. Der Agent ändert nichts und hat beim Kunden nachgefragt (siehe Postausgang).",
      proposeMove: "Vorschlag: Termin verschieben", proposeCancel: "Vorschlag: Termin stornieren", from: "Bisher", to: "Neu",
      cancelWhy: "Der Kunde bittet um die Absage; das Zeitfenster würde wieder frei.",
      approveNote: "Der Vorschlag liegt unter „Freigaben“. Bis ein Mensch entscheidet, bleibt der Kalender unverändert.",
      approvedNote: "Freigegeben: Der Kalender ist geändert, die E-Mails stehen im Postausgang.", rejectedNote: "Abgelehnt: Der Termin bleibt bestehen, der Kunde erhält eine Absage der Änderung.",
      run: { working: "Der Agent arbeitet.", booked: "Fertig: Der Termin ist gebucht, die E-Mails sind geschrieben.", details: "Gestoppt: Der Agent wartet auf Rückmeldung des Kunden.", approval: "Der Agent wartet auf die Freigabe durch einen Menschen.", declined: "Fertig: kein Termin, weil das Anliegen nicht zum Betrieb passt.", noslot: "Gestoppt: kein freies Zeitfenster.", unclear: "Gestoppt: Der Termin ist nicht eindeutig; der Agent hat nachgefragt.", other: "Fertig: Die E-Mail bleibt für das Büro liegen.", approved: "Fertig: freigegeben und umgesetzt.", rejected: "Fertig: abgelehnt, nichts geändert." },
      source: {
        example: "Quelle der Auswertung: vorbereitetes Beispiel. Es wurde keine Anfrage gesendet und kein Sprachmodell aufgerufen. Dringlichkeit, Monteur, Zeitfenster und Kalender entscheidet in jedem Fall fester Code.",
        model: "Quelle der Auswertung: Eine KI hat die E-Mail gelesen und die Bestätigung formuliert; das Ergebnis kann Fehler enthalten. Dringlichkeit, Monteur, Zeitfenster und alle Daten hat fester Code entschieden.",
        modelTemplate: "Quelle der Auswertung: Eine KI hat die E-Mail gelesen; das Ergebnis kann Fehler enthalten. Die E-Mails sind feste Bausteine. Dringlichkeit, Monteur, Zeitfenster und alle Daten hat fester Code entschieden.",
        rules: "Vereinfachte Auswertung: Das Sprachmodell stand für diesen Lauf nicht zur Verfügung. Die Angaben wurden nach festen Regeln aus dem Text gelesen (Telefonnummer, E-Mail-Adresse, Postleitzahl und Ort, Datums- und Dringlichkeitswörter), die E-Mails sind feste Bausteine."
      },
      cal: { time: "Zeit", free: "frei", off: "–", offLong: "arbeitet nicht", today: "heute", booked: "belegt", own: "Vom Agenten in dieser Demo gebucht" },
      appr: { empty: "Keine offenen Freigaben. Übergeben Sie dem Agenten eine E-Mail, in der ein Kunde einen Termin verschieben oder absagen möchte.", pending: "wartet auf Freigabe", approved: "freigegeben", rejected: "abgelehnt", stale: "nicht mehr möglich",
        approve: "Freigeben", approveMove: "den Termin im Kalender zu verschieben und die E-Mails schreiben zu lassen", approveCancel: "den Termin im Kalender zu entfernen und die E-Mails schreiben zu lassen",
        reject: "Ablehnen", rejectNote: "Mit „Ablehnen“ bleibt der Termin bestehen.", reason: "Kurzer Grund für die Ablehnung (optional)", rejectGo: "Ablehnung bestätigen", rejectWhat: "den Termin unverändert zu lassen und dem Kunden abzusagen", back: "Zurück",
        staleNote: "Das vorgeschlagene Zeitfenster ist inzwischen belegt oder der Termin existiert nicht mehr. Bitte übergeben Sie die E-Mail erneut.", decided: function (s, r) { return s + (r ? ": " + r : ""); } },
      out: { empty: "Noch keine E-Mails. Sobald der Agent etwas schreibt, steht es hier als fertige E-Mail.", fromLabel: "Von", from: "Beispiel-Betrieb Haustechnik (Demo)", subject: "Betreff",
        screen: "Nur auf dem Bildschirm gezeigt", sent: function (a) { return "Gesendet an Ihre bestätigte Adresse " + a; }, sending: "Wird gesendet …", failed: "Senden fehlgeschlagen; die E-Mail steht hier auf dem Bildschirm", cap: "Nicht gesendet: Kontingent erreicht. Es steht morgen wieder zur Verfügung. Entschuldigen Sie die Unannehmlichkeit.", already: "Die Erinnerung zu diesem Termin wurde bereits gesendet" },
      mail: { lead: "Die E-Mails der Demo gehen nur an Ihre eigene Adresse und erst, nachdem Sie sie über einen Link bestätigt haben. Kunde und Monteur sind Rollen: Beide E-Mails kommen bei Ihnen an.",
        label: "Ihre eigene E-Mail-Adresse", send: "Diese E-Mails an mich senden", sendWhat: "einen Bestätigungslink an Ihre eigene Adresse zu erhalten", sending: "Wird gesendet …",
        later: "Sobald der Agent die ersten E-Mails geschrieben hat, können Sie sie sich hier an Ihre eigene Adresse senden lassen.",
        consent: "Nach der Bestätigung senden wir die E-Mails dieser Demo sieben Tage lang an diese Adresse, höchstens 10 am Tag und 30 in der Woche, und speichern dafür die Adresse, die Sprache und die Termine der Demo. Jede E-Mail enthält einen Link zum Abmelden.",
        bad: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
        waiting: function (a) { return "Wir haben eine Bestätigungs-E-Mail an " + a + " gesendet. Öffnen Sie sie und drücken Sie dort „Adresse bestätigen“."; },
        check: "Bestätigung prüfen", checkWhat: "nach dem Klick in der E-Mail die Demo-E-Mails senden zu lassen", checking: "Wird geprüft …", notYet: "Die Adresse ist noch nicht bestätigt. Bitte öffnen Sie zuerst den Link in der Bestätigungs-E-Mail.",
        other: "Andere Adresse eingeben",
        confirmed: function (a, d) { return "Bestätigt: Die E-Mails dieser Demo gehen an " + a + (d ? " (bis " + d + ")" : "") + ". Neue E-Mails des Agenten werden automatisch gesendet."; },
        forget: "Adresse entfernen", forgetWhat: "die gespeicherte Adresse und die Demo-Termine auf dem Server zu löschen",
        off: "Der E-Mail-Versand der Demo steht gerade nicht zur Verfügung. Alle E-Mails sehen Sie weiterhin hier auf dem Bildschirm." },
      rem: { next: function (run, due) { return "Nächster Lauf: " + run + ", 9:00 Uhr. Er erinnert an die Termine vom " + due + "."; },
        count: function (n) { return n === 0 ? "An diesem Tag steht kein Termin im Kalender." : n === 1 ? "1 Termin an diesem Tag: 1 Erinnerung." : n + " Termine an diesem Tag: " + n + " Erinnerungen."; },
        own: "Ihre Demo-Termine", ownNone: "Sie haben in dieser Demo noch keinen Termin gebucht. Übergeben Sie dem Agenten eine neue Anfrage; ihr Termin erscheint dann hier.",
        ownLine: function (appt, when) { return appt + " – Erinnerung am " + when + " um 9:00 Uhr"; },
        ownToday: function (appt) { return appt + " – Termin ist heute: Der Lauf erinnert am Vortag, hier also nicht mehr"; },
        real: "Mit bestätigter Adresse sendet der Job die Erinnerung zu Ihren Demo-Terminen wirklich: am Vortag um 9:00 Uhr.",
        screen: "Ohne bestätigte Adresse wird die Erinnerung nur hier auf dem Bildschirm gezeigt.",
        shown: function (n) { return n === 0 ? "Der Lauf hätte nichts zu senden: kein Termin am Folgetag und kein Demo-Termin." : n === 1 ? "Der Lauf schreibt 1 Erinnerung:" : "Der Lauf schreibt " + n + " Erinnerungen:"; },
        to: "An: Kunde", again: "Lauf noch einmal ansehen" },
      log: { empty: "Noch nichts geschehen.", who: { agent: "Agent", human: "Mensch", job: "Job", system: "Demo" } },
      ev: {
        created: "Sandbox angelegt: Kalender mit erfundenen Terminen für zehn Werktage.",
        read: function (t, s) { return "E-Mail gelesen: " + t + " · Dringlichkeit: " + s; },
        ask: function (l) { return "Nicht gebucht, Rückfrage geschrieben. Es fehlt: " + l; },
        answered: "Fehlende Angaben nachgetragen (Antwort des Kunden, Demo).",
        booked: function (s, n) { return "Termin gebucht: " + s + ", Monteur " + n; },
        mails: function (n) { return n + " E-Mails geschrieben (Kunde, Kopie an den Monteur)."; },
        declined: "Kein Termin: Anliegen gehört nicht zum Betrieb. Absage geschrieben.",
        noslot: "Kein freies Zeitfenster gefunden; nichts gebucht.",
        other: "E-Mail ohne Auftrag oder Terminänderung: bleibt für das Büro liegen.",
        proposed: function (k, a) { return "Vorschlag zur Freigabe vorgelegt: " + k + " (" + a + ")"; },
        unclear: "Termin nicht eindeutig gefunden; beim Kunden nachgefragt.",
        approved: function (k) { return "Freigegeben: " + k + ". Kalender geändert, E-Mails geschrieben."; },
        rejected: function (r) { return "Abgelehnt" + (r ? " (" + r + ")" : "") + ". Kalender unverändert, Kunde informiert."; },
        preview: function (n) { return "Erinnerungslauf angesehen: " + n + " Erinnerung(en) auf dem Bildschirm."; },
        reminderSent: function (n) { return n + " Erinnerung(en) an die bestätigte Adresse gesendet."; },
        subscribed: "Bestätigungs-E-Mail angefordert.", confirmed: "Adresse bestätigt: Demo-E-Mails werden gesendet.", sent: function (n) { return n + " E-Mail(s) an die bestätigte Adresse gesendet."; }, forgotten: "Adresse entfernt; gespeicherte Daten gelöscht."
      },
      move: "Termin verschieben", cancel: "Termin stornieren",
      reset: "Demo zurücksetzen", resetDone: "Die Demo ist zurückgesetzt: neuer Kalender, leerer Postausgang, leeres Protokoll.",
      tech: "Monteur"
    },
    en: {
      state: { idle: "waiting", active: "running …", done: "done", stopped: "stopped", details: "waiting for a reply", approval: "waiting for approval", rejected: "rejected" },
      ownKind: "Your own text",
      count: function (n) { return n + " / " + String(MAX).replace(/\B(?=(\d{3})+(?!\d))/g, ","); },
      press: function (label, what) { return "Please press “" + label + "” to " + what + "."; },
      start: "Hand the e-mail to the agent", startWhat: "have it read, checked and scheduled", busy: "The agent is working …",
      startLater: "The agent is waiting for you right now (see below). You can still hand over another e-mail.",
      short: "Please paste an e-mail of at least " + MIN + " characters or choose one of the examples.",
      network: "The agent cannot be reached right now. Please check your internet connection; the examples still work.",
      botFail: "The security check (protection against automated requests) did not complete. Please try once more. If that does not help, reload the page; a content blocker can prevent the check.",
      botAsk: "Please confirm briefly in the box under the text that you are not an automated program.",
      quotaHint: " The examples still work.",
      none: "not given",
      steps: {
        read: ["Read and check", "Details, trade and urgency from the e-mail"],
        slots: ["Check availability", "A suitable serviceman, the first suitable window"],
        book: ["Block the calendar", "The appointment is in the calendar"],
        mails: ["E-mail to the customer, copy to the serviceman", "In the outbox, as finished e-mails"],
        find: ["Find the appointment in the calendar", "By name, address and date"],
        propose: ["Propose the change", "By the same rules as for a new enquiry"],
        approve: ["Approval by a person", "The agent changes nothing on its own"]
      },
      running: { read: "The agent reads and checks the e-mail.", slots: "The agent checks which serviceman is free when.", book: "The agent blocks the window in the calendar.", mails: "The agent writes the e-mails.", find: "The agent looks for the appointment in the calendar.", propose: "The agent prepares the proposal.", approve: "The agent submits the proposal for approval." },
      field: { topic: "Request", trade: "Trade", severity: "Urgency", name: "Name", phone: "Phone", email: "E-mail", address: "Address", wish: "Date asked for", old: "Existing appointment", intent: "Kind of e-mail", required: "Required details" },
      intent: { new: "new enquiry", move: "move an appointment", cancel: "cancel an appointment", other: "neither a job nor a change of appointment" },
      because: function (a, b) { return a + " (because: " + b + ")"; },
      complete: "complete: request, name, a way to reach the customer and address are there",
      missing: function (l) { return "missing: " + l; },
      missingShort: { topic: "request", name: "name", contact: "way to reach the customer", address: "address" },
      stopNote: "The agent books nothing while required details are missing. It has written a question back to the customer (see the outbox) and waits for the answer.",
      declineNote: "The request is not heating, plumbing or electrical. The agent has scheduled no appointment and written the customer a refusal (see the outbox).",
      otherNote: "The agent sees neither a job nor a change of appointment. The e-mail stays in the inbox for the office; it writes nothing and books nothing.",
      detailsLead: "Add the customer's answer (demo): enter the missing details as if the customer had replied.",
      detailsBtn: "Add the details and continue", detailsWhat: "let the agent go on with complete details",
      detailsFirst: "Please enter the missing details first. ",
      detailsBad: "Please fill in every field (at least 3 characters; for the phone number only digits, spaces and +).",
      detailLabel: { topic: "The customer's request", name: "The customer's name", contact: "The customer's phone number", address: "Address of the job (street, number, town)" },
      answered: "The customer has replied (demo): the missing details were added.",
      candidates: "The three best free windows", chosen: "chosen", alt: "alternative",
      noSlot: "No free window in the next ten working days. The agent books nothing; in a real business the matter would go to the office.",
      booked: "Entered in the calendar", newTag: "New",
      mailsNote: function (n) { return n + " e-mails are in the outbox: the confirmation to the customer and the copy to the serviceman."; },
      openOut: "Open the outbox", openCal: "Open the calendar", openAppr: "To the approvals",
      found: "Found", ambiguous: "Several appointments match. The agent changes nothing and has asked the customer which appointment is meant (see the outbox).",
      notFound: "The calendar has no appointment that matches the name or the address. The agent changes nothing and has asked the customer (see the outbox).",
      proposeMove: "Proposal: move the appointment", proposeCancel: "Proposal: cancel the appointment", from: "Before", to: "Now",
      cancelWhy: "The customer asks for the cancellation; the window would be free again.",
      approveNote: "The proposal is under “Approvals”. Until a person decides, the calendar stays as it is.",
      approvedNote: "Approved: the calendar is changed, the e-mails are in the outbox.", rejectedNote: "Rejected: the appointment stays; the customer is told that the change is not possible.",
      run: { working: "The agent is working.", booked: "Done: the appointment is booked, the e-mails are written.", details: "Stopped: the agent waits for the customer's reply.", approval: "The agent waits for approval by a person.", declined: "Done: no appointment, because the request does not fit the business.", noslot: "Stopped: no free window.", unclear: "Stopped: the appointment is not clear; the agent has asked.", other: "Done: the e-mail stays for the office.", approved: "Done: approved and carried out.", rejected: "Done: rejected, nothing changed." },
      source: {
        example: "Source of the reading: a prepared example. No request was sent and no language model was called. Urgency, serviceman, window and calendar are decided by fixed code in every case.",
        model: "Source of the reading: an AI read the e-mail and worded the confirmation; the result may contain errors. Urgency, serviceman, window and every date were decided by fixed code.",
        modelTemplate: "Source of the reading: an AI read the e-mail; the result may contain errors. The e-mails are fixed building blocks. Urgency, serviceman, window and every date were decided by fixed code.",
        rules: "Simplified reading: the language model was not available for this run. The details were read from the text by fixed rules (phone number, e-mail address, postcode and town, date and urgency words); the e-mails are fixed building blocks."
      },
      cal: { time: "Time", free: "free", off: "–", offLong: "not working", today: "today", booked: "taken", own: "Booked by the agent in this demo" },
      appr: { empty: "No open approvals. Hand the agent an e-mail in which a customer wants to move or cancel an appointment.", pending: "waiting for approval", approved: "approved", rejected: "rejected", stale: "no longer possible",
        approve: "Approve", approveMove: "move the appointment in the calendar and have the e-mails written", approveCancel: "remove the appointment from the calendar and have the e-mails written",
        reject: "Reject", rejectNote: "With “Reject” the appointment stays as it is.", reason: "Short reason for the rejection (optional)", rejectGo: "Confirm the rejection", rejectWhat: "leave the appointment unchanged and tell the customer", back: "Back",
        staleNote: "The proposed window has been taken in the meantime or the appointment no longer exists. Please hand over the e-mail again.", decided: function (s, r) { return s + (r ? ": " + r : ""); } },
      out: { empty: "No e-mails yet. As soon as the agent writes something, it appears here as a finished e-mail.", fromLabel: "From", from: "Example Building Services (demo)", subject: "Subject",
        screen: "Shown on screen only", sent: function (a) { return "Sent to your confirmed address " + a; }, sending: "Sending …", failed: "Sending failed; the e-mail is shown here on screen", cap: "Not sent: quota threshold reached. It will be restored tomorrow. Sorry for the inconvenience.", already: "The reminder for this appointment has already been sent" },
      mail: { lead: "The demo's e-mails go only to your own address, and only after you have confirmed it through a link. Customer and serviceman are roles: both e-mails arrive in your inbox.",
        label: "Your own e-mail address", send: "Send these e-mails to me", sendWhat: "receive a confirmation link at your own address", sending: "Sending …",
        later: "As soon as the agent has written the first e-mails, you can have them sent to your own address here.",
        consent: "After the confirmation we send this demo's e-mails to this address for seven days, at most 10 a day and 30 a week, and store the address, the language and the demo's appointments for that. Every e-mail contains an unsubscribe link.",
        bad: "Please enter a valid e-mail address.",
        waiting: function (a) { return "We have sent a confirmation e-mail to " + a + ". Open it and press “Confirm the address” there."; },
        check: "Check the confirmation", checkWhat: "have the demo e-mails sent after your click in the e-mail", checking: "Checking …", notYet: "The address is not confirmed yet. Please open the link in the confirmation e-mail first.",
        other: "Enter another address",
        confirmed: function (a, d) { return "Confirmed: this demo's e-mails go to " + a + (d ? " (until " + d + ")" : "") + ". New e-mails of the agent are sent automatically."; },
        forget: "Remove the address", forgetWhat: "delete the stored address and the demo's appointments on the server",
        off: "The demo cannot send e-mail right now. You still see every e-mail here on screen." },
      rem: { next: function (run, due) { return "Next run: " + run + ", 9:00. It sends reminders for the appointments of " + due + "."; },
        count: function (n) { return n === 0 ? "No appointment is in the calendar on that day." : n === 1 ? "1 appointment on that day: 1 reminder." : n + " appointments on that day: " + n + " reminders."; },
        own: "Your demo appointments", ownNone: "You have not booked an appointment in this demo yet. Hand the agent a new enquiry; its appointment then appears here.",
        ownLine: function (appt, when) { return appt + " – reminder on " + when + " at 9:00"; },
        ownToday: function (appt) { return appt + " – the appointment is today: the run reminds the day before, so not here any more"; },
        real: "With a confirmed address the job really sends the reminder for your demo appointments: the day before at 9:00.",
        screen: "Without a confirmed address the reminder is shown here on screen only.",
        shown: function (n) { return n === 0 ? "The run would have nothing to send: no appointment on the following day and no demo appointment." : n === 1 ? "The run writes 1 reminder:" : "The run writes " + n + " reminders:"; },
        to: "To: customer", again: "View the run again" },
      log: { empty: "Nothing has happened yet.", who: { agent: "Agent", human: "Person", job: "Job", system: "Demo" } },
      ev: {
        created: "Sandbox created: a calendar with invented appointments for ten working days.",
        read: function (t, s) { return "E-mail read: " + t + " · urgency: " + s; },
        ask: function (l) { return "Not booked, question written. Missing: " + l; },
        answered: "Missing details added (the customer's answer, demo).",
        booked: function (s, n) { return "Appointment booked: " + s + ", serviceman " + n; },
        mails: function (n) { return n + " e-mails written (customer, copy to the serviceman)."; },
        declined: "No appointment: the request does not fit the business. Refusal written.",
        noslot: "No free window found; nothing booked.",
        other: "E-mail without a job or a change of appointment: stays for the office.",
        proposed: function (k, a) { return "Proposal submitted for approval: " + k + " (" + a + ")"; },
        unclear: "Appointment not clearly found; asked the customer.",
        approved: function (k) { return "Approved: " + k + ". Calendar changed, e-mails written."; },
        rejected: function (r) { return "Rejected" + (r ? " (" + r + ")" : "") + ". Calendar unchanged, customer informed."; },
        preview: function (n) { return "Reminder run viewed: " + n + " reminder(s) on screen."; },
        reminderSent: function (n) { return n + " reminder(s) sent to the confirmed address."; },
        subscribed: "Confirmation e-mail requested.", confirmed: "Address confirmed: demo e-mails are being sent.", sent: function (n) { return n + " e-mail(s) sent to the confirmed address."; }, forgotten: "Address removed; stored data deleted."
      },
      move: "move the appointment", cancel: "cancel the appointment",
      reset: "Reset the demo", resetDone: "The demo is reset: a new calendar, an empty outbox, an empty log.",
      tech: "serviceman"
    }
  };
  function lang() { return K.lang(); }
  function L() { return TXT[lang()]; }

  // ---------------------------------------------------------------- small helpers
  function el(tag, cls, txt, attrs) {
    var n = K.el(tag, cls, txt);
    if (attrs) for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    return n;
  }
  function add(parent) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]); return parent; }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function nowMs() { return typeof window.__RD_NOW === "number" ? window.__RD_NOW : Date.now(); }
  function now() { return C.berlinNow(nowMs()); }
  function announce(msg) { statusText.textContent = ""; setTimeout(function () { statusText.textContent = msg; }, 30); }
  function techName(id) { var t = C.techOf(id); return t ? t.name : ""; }
  function slotText(s, short) { return C.fmtDay(s.date, lang(), short) + ", " + C.fmtWindow(s.win, lang()) + " · " + techName(s.tech); }
  function button(cls, label, attrs) {
    var b = el("button", "rd-btn " + cls, null, attrs);
    b.type = "button";
    add(b, el("span", null, label, { "data-rd-main-label": "" }));
    return b;
  }
  /* a waiting place: one instruction line directly above one button */
  function waitBlock(id, line, btn, on) {
    var w = el("div", "rd-wait", null, { "data-rd-wait": id });
    if (on) w.setAttribute("data-rd-on", "");
    add(w, el("p", "rd-do", line, { "data-rd-do": id }), btn);
    return w;
  }
  function setBusy(btn, on, label) {
    var lab = q("[data-rd-main-label]", btn);
    if (on) { btn.setAttribute("aria-disabled", "true"); btn.setAttribute("data-busy", ""); if (label && lab) { lab.setAttribute("data-rd-idle", lab.textContent); lab.textContent = label; } }
    else { btn.removeAttribute("aria-disabled"); btn.removeAttribute("data-busy"); if (lab && lab.hasAttribute("data-rd-idle")) { lab.textContent = lab.getAttribute("data-rd-idle"); lab.removeAttribute("data-rd-idle"); } }
  }
  function isBusy(btn) { return btn.getAttribute("aria-disabled") === "true"; }
  function post(body, timeoutMs) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs || 20000) : null;
    return fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined })
      .then(function (resp) { return resp.json().catch(function () { return null; }).then(function (data) { return { status: resp.status, data: data }; }); })
      .then(function (r) { if (timer) clearTimeout(timer); return r; }, function (e) { if (timer) clearTimeout(timer); throw e; });
  }

  // ---------------------------------------------------------------- the sandbox (this browser, 7 days)
  function randomHex(bytes) {
    var a = new Uint8Array(bytes);
    (window.crypto || window.msCrypto).getRandomValues(a);
    var s = "";
    for (var i = 0; i < a.length; i++) s += (a[i] < 16 ? "0" : "") + a[i].toString(16);
    return s;
  }
  function fresh() {
    var t = nowMs();
    var day = C.berlinNow(t).day;
    var days = C.workingDays(day, C.DAYS);
    var st = { v: 1, sid: randomHex(16), born: t, expires: t + LIFE_MS, day: day, until: days[days.length - 1], appts: C.seedCalendar(day), approvals: [], outbox: [], log: [], mail: { state: "none" }, n: 0 };
    st.log.push({ at: t, who: "system", ev: "created", args: [] });
    return st;
  }
  var memory = null; // when the browser refuses storage: the sandbox lives as long as the page
  var stored = false; // nothing is written to the browser before the visitor has used the demo
  function load() {
    var st = null;
    try { st = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { st = memory; }
    stored = !!(st && st.v === 1 && /^[0-9a-f]{32}$/.test(String(st.sid)) && st.expires > nowMs() && Array.isArray(st.appts));
    if (!stored) { try { localStorage.removeItem(KEY); } catch (e2) { /* nothing */ } st = fresh(); }
    return st;
  }
  function save() {
    memory = state;
    stored = true;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode: memory only */ }
  }
  /* the ten-day window moves on with the calendar: past appointments leave, new days arrive with their fictional ones */
  function roll() {
    var day = now().day;
    if (state.day === day) return;
    var days = C.workingDays(day, C.DAYS);
    state.appts = state.appts.filter(function (a) { return a.date >= day; });
    days.forEach(function (d) { if (d > state.until) state.appts = state.appts.concat(C.seedDay(d)); });
    state.until = days[days.length - 1];
    state.day = day;
    state.appts = C.sortAppts(state.appts);
    if (stored) save();
  }
  var state = load();
  var view = null; // the run on screen: { flow, steps: [{ type, state, d }], source, mailSource, outcome, fields, mail, approvalId }
  var ui = { tab: "cal", busy: false, timers: [], run: 0, mode: EXAMPLES[0].id, reject: null, mailNote: "", mailOff: false, remShown: null, poll: null };
  function log(who, ev, args) { state.log.push({ at: nowMs(), who: who, ev: ev, args: args || [] }); if (state.log.length > 80) state.log.shift(); }
  function evText(e) { var f = L().ev[e.ev]; return typeof f === "function" ? f.apply(null, e.args || []) : f || ""; }
  function nextId(p) { state.n = (state.n || 0) + 1; return p + "-" + state.sid.slice(0, 6) + "-" + state.n; }
  function exampleOf(id) { for (var i = 0; i < EXAMPLES.length; i++) if (EXAMPLES[i].id === id) return EXAMPLES[i]; return null; }
  function fixedAppt(name) { for (var i = 0; i < state.appts.length; i++) if (state.appts[i].name === name) return state.appts[i]; return null; }
  /* {OLD} and {NEW} of the two ready-made change requests, from today's calendar */
  function placeholders(ex) {
    var who = ex.id === "verschieben" ? C.FIXED.move.name : ex.id === "absagen" ? C.FIXED.cancel.name : null;
    if (!who) return { OLD: "", NEW: "" };
    var a = fixedAppt(who);
    var date = a ? a.date : C.workingDays(C.dayPlus(now().day, 1), 1)[0];
    var win = C.winOf(a ? a.win : "w2");
    var next = C.workingDays(C.dayPlus(date, 1), 2)[1];
    var de = lang() === "de";
    var short = function (d) { var p = d.split("-"); return de ? C.fmtDay(d, "de").split(",")[0] + ", " + p[2] + "." + p[1] + "." : C.fmtDay(d, "en").replace(/ \d{4}$/, ""); };
    return { OLD: short(date) + (de ? ", um " + win.from + " Uhr" : ", at " + win.from), NEW: short(next) + (de ? ", vormittags" : ", in the morning") };
  }
  function fillPlaceholders(s, p) { return s === null || s === undefined ? s : String(s).split("{OLD}").join(p.OLD).split("{NEW}").join(p.NEW); }
  function exampleText(ex) { return fillPlaceholders(ex.text[lang()], placeholders(ex)); }

  // ---------------------------------------------------------------- the inbox
  function setCount() { countBox.textContent = L().count(text.value.length); }
  function clearError() { errorBox.textContent = ""; text.removeAttribute("aria-invalid"); }
  function showError(message, focus) { errorBox.textContent = message; text.setAttribute("aria-invalid", "true"); if (focus) text.focus(); }
  function setKind() {
    var ex = exampleOf(ui.mode);
    K.show(badge, !!ex);
    var de = ex ? ex.kind.de : TXT.de.ownKind;
    var en = ex ? ex.kind.en : TXT.en.ownKind;
    kindBox.setAttribute("data-de", de);
    kindBox.setAttribute("data-en", en);
    kindBox.textContent = lang() === "en" ? en : de;
  }
  var guard = K.guard({ form: null, box: tsBox, siteKey: root.getAttribute("data-rd-sitekey") || "", theme: root.classList.contains("rd--light") ? "light" : "dark", onAsk: function () { announce(L().botAsk); } });
  var mailTsBox = q("[data-rd-ts-mail]");
  var mailGuard = K.guard({ form: null, box: mailTsBox, siteKey: root.getAttribute("data-rd-sitekey") || "", theme: root.classList.contains("rd--light") ? "light" : "dark", onAsk: function () { announce(L().botAsk); } });
  function choose(id, keepText) {
    if (ui.busy) return;
    ui.mode = id;
    var ex = exampleOf(id);
    for (var i = 0; i < tabs.length; i++) tabs[i].setAttribute("aria-pressed", tabs[i].getAttribute("data-rd-example") === id ? "true" : "false");
    if (ex) { text.value = exampleText(ex); text.readOnly = true; }
    else { if (!keepText) text.value = ""; text.readOnly = false; }
    // the bot check belongs to the own text only; its place appears with it (the visitor's own click moves the layout)
    if (guard.on) { K.show(tsBox, !ex); if (!ex) guard.load(); }
    setKind();
    setCount();
    clearError();
    if (!ex && !keepText) text.focus();
  }

  // ---------------------------------------------------------------- which button is the next one
  function pendingApprovals() { return state.approvals.filter(function (a) { return a.state === "pending"; }); }
  function waitingDetails() { return !!(view && view.outcome === "details"); }
  function refreshMain() {
    var later = waitingDetails() || pendingApprovals().length > 0;
    var block = q('[data-rd-wait="start"]');
    var line = q('[data-rd-do="start"]');
    var on = !later && !ui.busy;
    startBtn.classList.toggle("rd-btn--primary", !later);
    startBtn.classList.toggle("rd-btn--quiet", later);
    if (on) block.setAttribute("data-rd-on", ""); else block.removeAttribute("data-rd-on");
    var de = later ? TXT.de.startLater : TXT.de.press(TXT.de.start, TXT.de.startWhat);
    var en = later ? TXT.en.startLater : TXT.en.press(TXT.en.start, TXT.en.startWhat);
    line.setAttribute("data-de", de);
    line.setAttribute("data-en", en);
    line.textContent = lang() === "en" ? en : de;
    q('[data-rd-wait="run"]').setAttribute("data-rd-on", "");
    var n = pendingApprovals().length;
    var badgeA = q('[data-rd-n="appr"]');
    badgeA.textContent = n ? String(n) : "";
    K.show(badgeA, n > 0);
    var badgeO = q('[data-rd-n="out"]');
    badgeO.textContent = state.outbox.length ? String(state.outbox.length) : "";
    K.show(badgeO, state.outbox.length > 0);
  }
  function busy(on) {
    ui.busy = on;
    setBusy(startBtn, on, L().busy);
    for (var i = 0; i < tabs.length; i++) tabs[i].disabled = on;
    refreshMain();
  }

  // ---------------------------------------------------------------- tabs of the tool
  function openTab(id, focusTab) {
    ui.tab = id;
    ptabs.forEach(function (t) {
      var sel = t.getAttribute("data-rd-tab") === id;
      t.setAttribute("aria-selected", sel ? "true" : "false");
      t.tabIndex = sel ? 0 : -1;
      if (sel && focusTab) t.focus();
    });
    qa("[data-rd-panel]").forEach(function (p) { K.show(p, p.getAttribute("data-rd-panel") === id); });
  }
  ptabs.forEach(function (t, i) {
    t.addEventListener("click", function () { openTab(t.getAttribute("data-rd-tab")); });
    t.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "Home" ? -i : e.key === "End" ? ptabs.length - 1 - i : 0;
      if (!d) return;
      e.preventDefault();
      openTab(ptabs[(i + d + ptabs.length) % ptabs.length].getAttribute("data-rd-tab"), true);
    });
  });
  function linkButton(label, tab) {
    var b = button("rd-btn--link", label);
    b.addEventListener("click", function () { openTab(tab, true); try { q(".rd-tool").scrollIntoView({ behavior: K.reduce ? "auto" : "smooth", block: "nearest" }); } catch (e) { /* older browsers */ } });
    return b;
  }

  // ---------------------------------------------------------------- calendar
  function renderCalendar() {
    var box = q("[data-rd-cal]");
    clear(box);
    var T = L();
    var n = now();
    C.workingDays(n.day, C.DAYS).forEach(function (day) {
      var sec = el("section", "rd-day");
      add(sec, el("h4", "rd-day__h", C.fmtDay(day, lang()) + (day === n.day ? " (" + T.cal.today + ")" : "")));
      var table = el("table", "rd-slots");
      var head = el("tr");
      add(head, el("th", null, T.cal.time, { scope: "col" }));
      C.TECHS.forEach(function (t) { add(head, el("th", null, t.name, { scope: "col" })); });
      add(table, add(el("thead"), head));
      var body = el("tbody");
      C.WINDOWS.forEach(function (w) {
        var tr = el("tr");
        add(tr, el("th", null, w.from + "–" + w.to, { scope: "row" }));
        C.TECHS.forEach(function (t) {
          var a = null;
          for (var i = 0; i < state.appts.length; i++) { var x = state.appts[i]; if (x.tech === t.id && x.date === day && x.win === w.id) { a = x; break; } }
          var td;
          if (a) {
            td = el("td", a.src === "agent" ? "rd-cell rd-cell--new" : "rd-cell rd-cell--busy", null, { "data-rd-appt": a.id });
            if (a.src === "agent") add(td, el("span", "rd-cell__tag", T.newTag));
            add(td, el("span", "rd-cell__name", a.name || T.cal.booked));
          } else if (!C.works(t, day, w.id)) {
            td = el("td", "rd-cell rd-cell--off");
            add(td, el("span", null, T.cal.off, { "aria-hidden": "true" }), el("span", "rx-visually-hidden", T.cal.offLong));
          } else td = el("td", "rd-cell rd-cell--free", T.cal.free);
          add(tr, td);
        });
        add(body, tr);
      });
      add(table, body);
      add(sec, table);
      var own = state.appts.filter(function (a) { return a.src === "agent" && a.date === day; });
      if (own.length) {
        var list = el("ul", "rd-day__own");
        own.forEach(function (a) { add(list, el("li", null, C.fmtWindow(a.win, lang()) + " · " + techName(a.tech) + " · " + [a.name, a.address, C.topicOf(a, lang())].filter(Boolean).join(" · "))); });
        add(sec, el("p", "rd-day__ownh", T.cal.own), list);
      }
      add(box, sec);
    });
  }

  // ---------------------------------------------------------------- outbox and the visitor's own address
  function mailOf(m) { return C.mailFor(m.kind, m.facts, m.lang); }
  function statusLine(m) {
    var T = L().out;
    return m.status === "sent" ? T.sent(state.mail.address || "") : m.status === "sending" ? T.sending : m.status === "failed" ? T.failed : m.status === "cap" ? T.cap : m.status === "already" ? T.already : T.screen;
  }
  function mailCard(m) {
    var T = L();
    var mail = mailOf(m);
    var card = el("article", "rd-letter", null, { "data-rd-mail": m.id, "data-role": mail.role, "data-status": m.status });
    var head = el("div", "rd-letter__head");
    add(head, el("p", "rd-letter__role", C.ROLE[mail.role][m.lang === "en" ? "en" : "de"] + (m.toName ? " (" + m.toName + ")" : "")),
      el("p", "rd-letter__meta", T.out.fromLabel + ": " + T.out.from),
      el("p", "rd-letter__subject", T.out.subject + ": " + mail.subject));
    add(card, head, el("p", "rd-letter__body", mail.body), el("p", "rd-letter__status", statusLine(m), { "data-rd-mail-status": "" }));
    return card;
  }
  function addMail(kind, facts) {
    var m = { id: nextId("m"), kind: kind, facts: facts, lang: lang(), at: nowMs(), status: "screen", run: ui.run };
    state.outbox.push(m);
    if (state.outbox.length > 40) state.outbox.shift();
    return m.id;
  }
  function renderOutbox() {
    var T = L();
    var box = q("[data-rd-outbox]");
    clear(box);
    if (!state.outbox.length) add(box, el("p", "rd-empty", T.out.empty));
    state.outbox.slice().reverse().forEach(function (m) { add(box, mailCard(m)); });
    renderMailbox();
  }
  function renderMailbox() {
    var T = L().mail;
    var box = q("[data-rd-mailbox]");
    clear(box);
    add(box, el("p", "rd-mailbox__lead", T.lead));
    var st = state.mail.state;
    if (ui.mailOff) { add(box, el("p", "rd-note", T.off)); return; }
    if (st === "confirmed") {
      var until = state.mail.until ? C.fmtDay(C.berlinNow(state.mail.until).day, lang(), true) : "";
      add(box, el("p", "rd-mailbox__ok", T.confirmed(state.mail.address || "", until), { "data-rd-mail-state": "confirmed" }));
      var fb = button("rd-btn--quiet", T.forget, { "data-rd-forget": "" });
      fb.addEventListener("click", function () { if (!isBusy(fb)) forget(fb); });
      add(box, waitBlock("forget", L().press(T.forget, T.forgetWhat), fb, false));
      return;
    }
    if (st === "waiting") {
      add(box, el("p", "rd-mailbox__ok", T.waiting(state.mail.address || ""), { "data-rd-mail-state": "waiting" }));
      var cb = button("rd-btn--primary", T.check, { "data-rd-main": "check" });
      cb.addEventListener("click", function () { if (!isBusy(cb)) checkStatus(cb, true); });
      add(box, waitBlock("check", L().press(T.check, T.checkWhat), cb, true));
      if (ui.mailNote) add(box, el("p", "rd-note", ui.mailNote, { role: "status" }));
      var ob = button("rd-btn--link", T.other);
      ob.addEventListener("click", function () { state.mail = { state: "none" }; ui.mailNote = ""; stopPoll(); save(); renderMailbox(); var i = doc.getElementById("rd-own-mail"); if (i) i.focus(); });
      add(box, ob);
      return;
    }
    if (!state.outbox.length) { add(box, el("p", "rd-note", T.later)); return; }
    var f = el("form", "rd-own", null, { novalidate: "", "data-rd-own": "" });
    var input = el("input", "rd-own__input", null, { id: "rd-own-mail", type: "email", name: "email", autocomplete: "email", inputmode: "email", maxlength: "200", "aria-describedby": "rd-own-consent rd-own-error" });
    var sb = button("rd-btn--primary", T.send, { "data-rd-main": "mail" });
    sb.type = "submit";
    add(f, el("label", "rd-own__label", T.label, { "for": "rd-own-mail" }), input,
      el("p", "rd-own__consent", T.consent, { id: "rd-own-consent" }),
      el("p", "rd-error", ui.mailNote, { id: "rd-own-error", role: "alert", "data-rd-own-error": "" }),
      waitBlock("mail", L().press(T.send, T.sendWhat), sb, true));
    f.addEventListener("submit", function (e) { e.preventDefault(); if (!isBusy(sb)) subscribe(input, sb); });
    // the bot check of this form has its own place under it; it appears when the visitor turns to the form
    f.addEventListener("focusin", function () { if (mailGuard.on) { K.show(mailTsBox, true); mailGuard.load(); } });
    add(box, f);
  }
  function mailError(msg) { ui.mailNote = msg; var e = q("[data-rd-own-error]"); if (e) e.textContent = msg; }
  function subscribe(input, btn) {
    var T = L().mail;
    var value = input.value.replace(/^\s+|\s+$/g, "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { mailError(T.bad); input.setAttribute("aria-invalid", "true"); input.focus(); return; }
    mailError("");
    setBusy(btn, true, T.sending);
    if (mailGuard.on) { K.show(mailTsBox, true); mailGuard.load(); }
    mailGuard.send(API, { action: "subscribe", sid: state.sid, email: value, lang: lang(), company_website: form.elements.company_website.value }, 25000).then(function (r) {
      setBusy(btn, false);
      var d = r.data;
      if (r.status === 200 && d && d.ok) {
        state.mail = { state: "waiting", address: C.mask(value), since: nowMs() };
        ui.mailNote = "";
        log("human", "subscribed");
        save();
        renderMailbox();
        renderLog();
        var cb = q('[data-rd-main="check"]');
        if (cb) cb.focus();
        announce(T.waiting(state.mail.address) + " " + L().press(T.check, T.checkWhat));
        startPoll();
        return;
      }
      if (d && d.error === "mail_off") { ui.mailOff = true; renderMailbox(); renderReminders(); announce(T.off); return; }
      mailError(d && d.error === "bot_check" ? L().botFail : (d && d.message) || L().network);
      input.focus();
    }, function () { setBusy(btn, false); mailError(L().network); input.focus(); });
  }
  function stopPoll() { if (ui.poll) { clearInterval(ui.poll); ui.poll = null; } }
  function startPoll() {
    stopPoll();
    var tries = 0;
    ui.poll = setInterval(function () { if (++tries > 30 || state.mail.state !== "waiting") { stopPoll(); return; } if (!doc.hidden) checkStatus(null, false); }, 6000);
  }
  function checkStatus(btn, byHand) {
    var T = L().mail;
    if (btn) setBusy(btn, true, T.checking);
    return post({ action: "status", sid: state.sid }).then(function (r) {
      if (btn) setBusy(btn, false);
      var d = r.data;
      if (!(r.status === 200 && d && d.ok)) { if (byHand) { ui.mailNote = (d && d.message) || L().network; renderMailbox(); } return; }
      if (d.confirmed) {
        var was = state.mail.state;
        state.mail = { state: "confirmed", address: d.address, until: Date.parse(d.expiresAt) || 0 };
        ui.mailNote = "";
        stopPoll();
        if (was !== "confirmed") { log("human", "confirmed"); announce(T.confirmed(d.address, "")); }
        save();
        renderOutbox();
        renderReminders();
        renderLog();
        if (was !== "confirmed") { sendPending(); syncAppts(); }
      } else if (state.mail.state === "confirmed") {
        // expired, removed or opted out through the link in a mail: the page follows
        state.mail = { state: "none" };
        save();
        renderOutbox();
        renderReminders();
      } else if (byHand) {
        ui.mailNote = T.notYet;
        renderMailbox();
        var cb = q('[data-rd-main="check"]');
        if (cb) cb.focus();
        announce(T.notYet);
      }
    }, function () { if (btn) setBusy(btn, false); if (byHand) { ui.mailNote = L().network; renderMailbox(); } });
  }
  function forget(btn) {
    setBusy(btn, true);
    var done = function () { state.mail = { state: "none" }; stopPoll(); log("human", "forgotten"); save(); renderOutbox(); renderReminders(); renderLog(); var i = doc.getElementById("rd-own-mail"); if (i) i.focus(); };
    post({ action: "forget", sid: state.sid }).then(done, done);
  }
  /* the facts of a mail as the function wants them (it checks every one of them and renders the mail itself) */
  function itemOf(m) { return { ref: m.id, kind: m.kind, facts: m.facts }; }
  function sendMails(list) {
    if (state.mail.state !== "confirmed" || !list.length) return Promise.resolve(0);
    var chunk = list.slice(0, 4);
    var rest = list.slice(4);
    chunk.forEach(function (m) { m.status = "sending"; });
    renderOutbox();
    var fail = function () { chunk.forEach(function (m) { m.status = "failed"; }); save(); renderOutbox(); return 0; };
    return post({ action: "send", sid: state.sid, lang: chunk[0].lang, items: chunk.map(itemOf) }, 30000).then(function (r) {
      var d = r.data;
      if (!(r.status === 200 && d && d.ok && Array.isArray(d.results))) return fail();
      var sent = 0;
      chunk.forEach(function (m) {
        var res = null;
        for (var i = 0; i < d.results.length; i++) if (d.results[i].ref === m.id) res = d.results[i];
        m.status = res && res.sent ? "sent" : res && res.reason === "cap" ? "cap" : res && res.reason === "no_session" ? "screen" : "failed";
        if (res && res.sent) sent++;
      });
      if (!d.confirmed) state.mail = { state: "none" };
      if (sent) log("agent", "sent", [sent]);
      save();
      renderOutbox();
      renderLog();
      return rest.length && d.confirmed ? sendMails(rest).then(function (n) { return n + sent; }) : sent;
    }, fail);
  }
  function sendPending() { return sendMails(state.outbox.filter(function (m) { return m.status === "screen"; }).slice(-6)); }
  function syncAppts() {
    if (state.mail.state !== "confirmed") return;
    var mine = state.appts.filter(function (a) { return a.src === "agent"; }).map(function (a) { return { id: a.id, date: a.date, win: a.win, tech: a.tech, topic: C.topicOf(a, lang()) }; });
    post({ action: "sync", sid: state.sid, appts: mine }).then(function () {}, function () {});
  }

  // ---------------------------------------------------------------- approvals: a person decides
  function apprKind(a) { return a.type === "move" ? L().move : L().cancel; }
  function renderApprovals() {
    var T = L();
    var box = q("[data-rd-approvals]");
    clear(box);
    if (!state.approvals.length) { add(box, el("p", "rd-empty", T.appr.empty)); return; }
    state.approvals.slice().reverse().forEach(function (a) {
      var card = el("article", "rd-appr", null, { "data-rd-approval": a.id, "data-state": a.state });
      var top = el("div", "rd-appr__top");
      add(top, el("h4", "rd-appr__title", a.type === "move" ? T.proposeMove : T.proposeCancel), el("span", "rd-chip", T.appr[a.state], { "data-rd-appr-state": "" }));
      add(card, top, el("p", "rd-appr__who", [a.name, a.address, a.topic].filter(Boolean).join(" · ")));
      var dl = el("dl", "rd-appr__dl");
      add(dl, el("dt", null, T.from), el("dd", null, slotText(a.from)));
      if (a.to) add(dl, el("dt", null, T.to), el("dd", null, slotText(a.to)));
      add(card, dl, el("p", "rd-appr__why", a.type === "move" ? C.WHY[a.why][lang()] : T.cancelWhy));
      if (a.state === "pending") {
        if (ui.reject === a.id) {
          var input = el("input", "rd-own__input", null, { id: "rd-reason-" + a.id, type: "text", maxlength: "120", autocomplete: "off" });
          var go = button("rd-btn--primary", T.appr.rejectGo, { "data-rd-main": "reject" });
          go.addEventListener("click", function () { decide(a.id, false, input.value); });
          var back = button("rd-btn--quiet", T.appr.back);
          back.addEventListener("click", function () { ui.reject = null; renderApprovals(); var b = q('[data-rd-approval="' + a.id + '"] [data-rd-main="approve"]'); if (b) b.focus(); });
          add(card, el("label", "rd-own__label", T.appr.reason, { "for": "rd-reason-" + a.id }), input, waitBlock("reject", T.press(T.appr.rejectGo, T.appr.rejectWhat), go, true), back);
        } else {
          var ok = button("rd-btn--primary", T.appr.approve, { "data-rd-main": "approve" });
          ok.addEventListener("click", function () { decide(a.id, true); });
          var no = button("rd-btn--quiet", T.appr.reject, { "data-rd-reject": "" });
          no.addEventListener("click", function () { ui.reject = a.id; renderApprovals(); var i = doc.getElementById("rd-reason-" + a.id); if (i) i.focus(); });
          add(card, waitBlock("approve", T.press(T.appr.approve, a.type === "move" ? T.appr.approveMove : T.appr.approveCancel), ok, true), el("p", "rd-appr__alt", T.appr.rejectNote), no);
        }
      } else if (a.state === "stale") add(card, el("p", "rd-note", T.appr.staleNote));
      else if (a.reason) add(card, el("p", "rd-appr__reason", T.appr.decided(T.appr[a.state], a.reason)));
      add(box, card);
    });
  }
  /* "Freigeben" or "Ablehnen": only here the calendar changes */
  function decide(id, approve, reason) {
    var a = null;
    for (var i = 0; i < state.approvals.length; i++) if (state.approvals[i].id === id) a = state.approvals[i];
    if (!a || a.state !== "pending") return;
    var appt = null;
    for (var j = 0; j < state.appts.length; j++) if (state.appts[j].id === a.apptId) appt = state.appts[j];
    var T = L();
    var facts = { name: a.name, phone: a.phone, address: a.address, topic: a.topic, trade: a.trade, oldTech: a.from.tech, oldDate: a.from.date, oldWin: a.from.win };
    var ids = [];
    ui.reject = null;
    if (!approve) {
      a.state = "rejected";
      a.reason = String(reason || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "").slice(0, 120);
      facts.reason = a.reason;
      facts.tech = a.from.tech;
      ids.push(addMail("rejected", facts));
      log("human", "rejected", [a.reason]);
    } else {
      var taken = a.to && state.appts.some(function (x) { return x.id !== a.apptId && x.tech === a.to.tech && x.date === a.to.date && x.win === a.to.win; });
      if (!appt || taken) { a.state = "stale"; save(); renderApprovals(); refreshMain(); announce(T.appr.staleNote); return; }
      a.state = "approved";
      if (a.type === "move") {
        appt.tech = a.to.tech; appt.date = a.to.date; appt.win = a.to.win; appt.src = "agent";
        state.appts = C.sortAppts(state.appts);
        facts.tech = a.to.tech; facts.date = a.to.date; facts.win = a.to.win;
        ids.push(addMail("moved", facts), addMail("tech_moved", facts));
      } else {
        state.appts = state.appts.filter(function (x) { return x.id !== a.apptId; });
        facts.tech = a.from.tech;
        ids.push(addMail("cancelled", facts), addMail("tech_cancelled", facts));
      }
      log("human", "approved", [apprKind(a)]);
    }
    if (view && view.approvalId === a.id) {
      view.outcome = approve ? "approved" : "rejected";
      view.steps[3].state = approve ? "done" : "rejected";
      view.steps[3].d.decided = approve ? "approved" : "rejected";
      drawRun(4, undefined, true);
    }
    save();
    renderAll();
    var msg = approve ? T.approvedNote : T.rejectedNote;
    announce(msg);
    openTab("out", false);
    var next = pendingApprovals().length ? q('[data-rd-main="approve"]') : startBtn;
    if (pendingApprovals().length) openTab("appr", false);
    if (next) next.focus();
    sendMails(state.outbox.filter(function (m) { return ids.indexOf(m.id) !== -1; }));
    syncAppts();
  }

  // ---------------------------------------------------------------- the reminder run
  function remindersOf(n) {
    var run = C.nextRun(n);
    var due = state.appts.filter(function (a) { return a.date === run.dueDay; });
    var own = state.appts.filter(function (a) { return a.src === "agent" && a.date !== run.dueDay && a.date > n.day; });
    return { run: run, due: due, own: own };
  }
  function renderReminders() {
    var T = L().rem;
    var box = q("[data-rd-rem]");
    clear(box);
    var r = remindersOf(now());
    add(box, el("p", "rd-rem__next", T.next(C.fmtDay(r.run.runDay, lang()), C.fmtDay(r.run.dueDay, lang())), { "data-rd-rem-next": "" }),
      el("p", "rd-rem__count", T.count(r.due.length)));
    var mine = state.appts.filter(function (a) { return a.src === "agent"; });
    add(box, el("h4", "rd-rem__h", T.own));
    if (!mine.length) add(box, el("p", "rd-empty", T.ownNone));
    else {
      var ul = el("ul", "rd-rem__list");
      var today = now().day;
      mine.forEach(function (a) {
        var what = slotText(a) + (a.name ? " · " + a.name : "");
        // an appointment booked for today (an emergency) has no day before it on which the job could remind
        add(ul, el("li", null, a.date > today ? T.ownLine(what, C.fmtDay(C.dayPlus(a.date, -1), lang(), true)) : T.ownToday(what)));
      });
      add(box, ul);
    }
    add(box, el("p", "rd-note", ui.mailOff ? L().mail.off : state.mail.state === "confirmed" ? T.real : T.screen, { "data-rd-rem-mode": state.mail.state === "confirmed" && !ui.mailOff ? "real" : "screen" }));
    drawReminderMails();
  }
  function drawReminderMails() {
    var T = L();
    var box = q("[data-rd-rem-mails]");
    clear(box);
    if (!ui.remShown) return;
    add(box, el("p", "rd-rem__shown", T.rem.shown(ui.remShown.length), { tabindex: "-1", "data-rd-rem-shown": "" }));
    ui.remShown.forEach(function (x) { add(box, mailCard(x)); });
  }
  function viewRun() {
    if (isBusy(runBtn)) return;
    var r = remindersOf(now());
    var list = r.due.concat(r.own).slice(0, 12).map(function (a) {
      return { id: "r-" + a.id, apptId: a.id, own: a.src === "agent", kind: "reminder", lang: lang(), status: "screen", toName: a.name || "", facts: { id: a.id, tech: a.tech, date: a.date, win: a.win, topic: C.topicOf(a, lang()) } };
    });
    ui.remShown = list;
    log("job", "preview", [list.length]);
    save();
    drawReminderMails();
    renderLog();
    var head = q("[data-rd-rem-shown]");
    if (head) head.focus();
    announce(L().rem.shown(list.length));
    // with a confirmed address: the reminders of the visitor's own demo appointments really go out, once each
    var mine = list.filter(function (x) { return x.own; }).slice(0, 3);
    if (state.mail.state !== "confirmed" || !mine.length) return;
    setBusy(runBtn, true, L().out.sending);
    mine.forEach(function (x) { x.status = "sending"; });
    drawReminderMails();
    var end = function (results) {
      var sent = 0;
      mine.forEach(function (x) {
        var res = null;
        for (var i = 0; results && i < results.length; i++) if (results[i].ref === x.id) res = results[i];
        x.status = res && res.sent ? "sent" : res && res.reason === "already" ? "already" : res && res.reason === "cap" ? "cap" : "failed";
        if (res && res.sent) sent++;
      });
      if (sent) log("job", "reminderSent", [sent]);
      setBusy(runBtn, false);
      save();
      drawReminderMails();
      renderLog();
    };
    post({ action: "sync", sid: state.sid, appts: state.appts.filter(function (a) { return a.src === "agent"; }).map(function (a) { return { id: a.id, date: a.date, win: a.win, tech: a.tech, topic: C.topicOf(a, lang()) }; }) })
      .then(function () { return post({ action: "send", sid: state.sid, lang: lang(), items: mine.map(function (x) { return { ref: x.id, kind: "reminder", facts: { id: x.apptId } }; }) }, 30000); })
      .then(function (r) { end(r.data && r.data.ok ? r.data.results : null); }, function () { end(null); });
  }

  // ---------------------------------------------------------------- log
  function renderLog() {
    var T = L();
    var box = q("[data-rd-log]");
    clear(box);
    if (!state.log.length) { add(box, el("li", "rd-empty", T.log.empty)); return; }
    state.log.slice().reverse().forEach(function (e) {
      var li = el("li", "rd-log__one", null, { "data-who": e.who });
      var c = C.berlinNow(e.at);
      var hh = Math.floor(c.minutes / 60);
      var mm = c.minutes % 60;
      add(li, el("span", "rd-log__time", C.fmtDay(c.day, lang(), true) + " " + (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm),
        el("span", "rd-log__who", T.log.who[e.who] || e.who), el("span", "rd-log__text", evText(e)));
      add(box, li);
    });
  }
  function renderAll() { renderCalendar(); renderApprovals(); renderOutbox(); renderReminders(); renderLog(); refreshMain(); }

  // ---------------------------------------------------------------- the agent's run
  function stopTimers() { for (var i = 0; i < ui.timers.length; i++) clearTimeout(ui.timers[i]); ui.timers = []; }
  function row(dl, k, v) { add(dl, el("dt", null, k), el("dd", null, v)); }
  var draw = {
    read: function (d, T) {
      var f = d.f;
      var box = el("div", "rd-body");
      var dl = el("dl", "rd-facts");
      row(dl, T.field.intent, T.intent[f.intent]);
      row(dl, T.field.topic, f.topic || T.none);
      row(dl, T.field.trade, C.TRADES[f.trade][lang()]);
      var sev = C.severityOf(f.signals, d.text);
      var sevNode = el("dd", null, T.because(C.SEVERITY_LABEL[sev.level][lang()], C.severityReason(sev, lang())), { "data-rd-sev": sev.level });
      add(dl, el("dt", null, T.field.severity), sevNode);
      row(dl, T.field.name, f.name || T.none);
      row(dl, T.field.phone, f.phone || T.none);
      row(dl, T.field.email, f.email || T.none);
      row(dl, T.field.address, f.address || T.none);
      if (f.intent !== "new") row(dl, T.field.old, f.old || T.none);
      if (f.intent !== "cancel") row(dl, T.field.wish, f.wish || T.none);
      if (f.intent === "new") {
        var miss = C.missingOf(f);
        add(dl, el("dt", null, T.field.required), el("dd", miss.length ? "rd-miss" : "rd-okay", miss.length ? T.missing(miss.map(function (m) { return T.missingShort[m]; }).join(", ")) : T.complete, { "data-rd-required": miss.length ? "missing" : "complete" }));
      }
      add(box, dl);
      if (d.note) add(box, el("p", "rd-note", T[d.note]));
      if (d.answered) add(box, el("p", "rd-note rd-note--ok", T.answered));
      if (d.form) add(box, detailsForm(d.form, T));
      return box;
    },
    slots: function (d, T) {
      var box = el("div", "rd-body");
      if (!d.result || !d.result.chosen) { add(box, el("p", "rd-note", T.noSlot)); return box; }
      add(box, el("p", "rd-body__h", T.candidates));
      var ol = el("ol", "rd-cands");
      d.result.candidates.forEach(function (s, i) {
        var li = el("li", i === 0 ? "rd-cand rd-cand--chosen" : "rd-cand");
        add(li, el("span", "rd-cand__slot", slotText(s)), el("span", i === 0 ? "rd-chip rd-chip--ok" : "rd-chip rd-chip--quiet", i === 0 ? T.chosen : T.alt));
        add(ol, li);
      });
      add(box, ol, el("p", "rd-why", C.WHY[d.result.why][lang()], { "data-rd-why": d.result.why }));
      return box;
    },
    book: function (d, T) {
      var box = el("div", "rd-body");
      var a = d.appt;
      var card = el("div", "rd-entry");
      add(card, el("p", "rd-entry__when", slotText(a)), el("p", "rd-entry__what", [a.name, a.address, C.topicOf(a, lang())].filter(Boolean).join(" · ")));
      add(box, el("p", "rd-body__h", T.booked), card, linkButton(T.openCal, "cal"));
      return box;
    },
    mails: function (d, T) {
      var box = el("div", "rd-body");
      add(box, el("p", "rd-body__p", T.mailsNote(d.ids.length)), linkButton(T.openOut, "out"));
      return box;
    },
    find: function (d, T) {
      var box = el("div", "rd-body");
      if (d.state === "found") {
        var a = d.hits[0];
        var card = el("div", "rd-entry");
        add(card, el("p", "rd-entry__when", slotText(a)), el("p", "rd-entry__what", [a.name, a.address, C.topicOf(a, lang())].filter(Boolean).join(" · ")));
        add(box, el("p", "rd-body__h", T.found), card);
      } else {
        add(box, el("p", "rd-note", d.state === "ambiguous" ? T.ambiguous : T.notFound));
        if (d.state === "ambiguous") { var ul = el("ul", "rd-cands"); d.hits.forEach(function (a) { add(ul, el("li", "rd-cand", slotText(a) + " · " + a.name)); }); add(box, ul); }
        add(box, linkButton(T.openOut, "out"));
      }
      return box;
    },
    propose: function (d, T) {
      var box = el("div", "rd-body");
      if (d.none) { add(box, el("p", "rd-note", T.noSlot)); return box; }
      var dl = el("dl", "rd-facts");
      add(box, el("p", "rd-body__h", d.type === "move" ? T.proposeMove : T.proposeCancel));
      row(dl, T.from, slotText(d.from));
      if (d.to) row(dl, T.to, slotText(d.to));
      add(box, dl, el("p", "rd-why", d.type === "move" ? C.WHY[d.why][lang()] : T.cancelWhy));
      return box;
    },
    approve: function (d, T) {
      var box = el("div", "rd-body");
      add(box, el("p", "rd-human", d.decided === "approved" ? T.approvedNote : d.decided === "rejected" ? T.rejectedNote : T.approveNote));
      add(box, linkButton(d.decided ? T.openOut : T.openAppr, d.decided ? "out" : "appr"));
      return box;
    }
  };
  function detailsForm(missing, T) {
    var f = el("form", "rd-details", null, { novalidate: "", "data-rd-details": "" });
    add(f, el("p", "rd-details__lead", T.detailsLead));
    missing.forEach(function (m) {
      var id = "rd-d-" + m;
      add(f, el("label", "rd-own__label", T.detailLabel[m], { "for": id }), el("input", "rd-own__input", null, { id: id, name: m, type: m === "contact" ? "tel" : "text", maxlength: m === "contact" ? "40" : "120", autocomplete: "off", "data-rd-detail": m }));
    });
    var btn = button("rd-btn--primary", T.detailsBtn, { "data-rd-main": "details" });
    btn.type = "submit";
    add(f, el("p", "rd-error", "", { role: "alert", "data-rd-details-error": "" }), waitBlock("details", T.detailsFirst + T.press(T.detailsBtn, T.detailsWhat), btn, true));
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (ui.busy) return;
      var got = {};
      var bad = null;
      qa("[data-rd-detail]", f).forEach(function (i) {
        var v = i.value.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
        var m = i.getAttribute("data-rd-detail");
        var ok = v.length >= 3 && (m !== "contact" || /^[+\d][\d\s/().-]{5,}$/.test(v));
        i.setAttribute("aria-invalid", ok ? "false" : "true");
        if (!ok && !bad) bad = i;
        got[m] = v;
      });
      if (bad) { q("[data-rd-details-error]", f).textContent = T.detailsBad; bad.focus(); return; }
      supply(got);
    });
    return f;
  }
  /* how many steps of the run are shown at its end: up to and including the one the agent stops at */
  function revealCount() {
    for (var k = 0; k < view.steps.length; k++) {
      if (view.steps[k].state === "idle") return k;
      if (view.steps[k].state !== "done") return k + 1;
    }
    return view.steps.length;
  }
  function stepNode(i, s, shown) {
    var T = L();
    var li = el("li", "rd-step", null, { "data-rd-step": s.type, "data-state": shown ? s.state : "idle" });
    var head = el("div", "rd-step__head");
    var txt = el("div", "rd-step__txt");
    add(txt, el("h4", "rd-step__title", T.steps[s.type][0]), el("p", "rd-step__sub", T.steps[s.type][1]));
    add(head, el("span", "rd-step__dot", String(i + 1), { "aria-hidden": "true" }), txt, el("span", "rd-step__state", T.state[shown ? s.state : "idle"], { "data-rd-state": "" }));
    add(li, head);
    if (shown && s.d) add(li, draw[s.type](s.d, T));
    return li;
  }
  /* draws the run with the first `upTo` steps revealed; `active`: the index of the step that is running;
     `final`: the agent has stopped (finished, or waiting for the visitor) */
  function drawRun(upTo, active, final) {
    if (!view) { K.show(runBox, false); return; }
    var T = L();
    K.show(runBox, true);
    clear(stepsBox);
    view.steps.forEach(function (s, i) {
      var node = stepNode(i, s, i < upTo);
      if (i === active) { node.setAttribute("data-state", "active"); q("[data-rd-state]", node).textContent = T.state.active; }
      add(stepsBox, node);
    });
    var done = !!final;
    runState.textContent = done ? T.run[view.outcome] : T.run.working;
    runBox.setAttribute("data-outcome", done ? view.outcome : "working");
    sourceBox.textContent = view.source === "example" ? T.source.example : view.source === "rules" ? T.source.rules : view.mailSource === "model" ? T.source.model : T.source.modelTemplate;
    sourceBox.setAttribute("data-source", view.source);
    K.show(sourceBox, done);
    K.show(afterBox, done && (view.outcome === "booked" || view.outcome === "approved" || view.outcome === "rejected"));
  }
  /* reveals the steps one after the other, from step `from` on; panels are redrawn when the calendar or the outbox changed */
  function play(from) {
    var run = ui.run;
    var gap = K.reduce ? 0 : STEP_MS;
    // steps after the one the agent stops at stay "wartet"
    var last = revealCount();
    function at(i) {
      if (run !== ui.run) return;
      if (i >= last) { finishRun(); return; }
      drawRun(i, i);
      announce(L().running[view.steps[i].type]);
      var done = function () {
        if (run !== ui.run) return;
        var type = view.steps[i].type;
        if (type === "book") renderCalendar();
        if (type === "mails") renderOutbox();
        at(i + 1);
      };
      if (gap) ui.timers.push(setTimeout(done, gap)); else done();
    }
    at(from);
  }
  function finishRun() {
    var T = L();
    drawRun(revealCount(), undefined, true);
    renderAll();
    busy(false);
    save();
    autoSend();
    var msg = T.run[view.outcome];
    if (view.outcome === "details") {
      var first = q("[data-rd-detail]");
      announce(msg + " " + T.detailsFirst + T.press(T.detailsBtn, T.detailsWhat));
      if (first) first.focus();
    } else if (view.outcome === "approval") {
      openTab("appr", false);
      var b = q('[data-rd-approval="' + view.approvalId + '"] [data-rd-main="approve"]');
      var a = null;
      for (var i = 0; i < state.approvals.length; i++) if (state.approvals[i].id === view.approvalId) a = state.approvals[i];
      announce(msg + " " + T.press(T.appr.approve, a && a.type === "cancel" ? T.appr.approveCancel : T.appr.approveMove));
      if (b) b.focus();
    } else {
      announce(msg);
      if (runTitle) runTitle.focus({ preventScroll: true });
    }
  }
  function idleSteps(types) { return types.map(function (t) { return { type: t, state: "idle", d: null }; }); }
  /* A reading -> the run. Everything below is fixed code (assets/js/rpa-agent-core.js): no model decides here. */
  function plan(read, source, textValue) {
    var f = read.fields;
    var T = L();
    var sev = C.severityOf(f.signals, textValue);
    view = { source: source, mailSource: read.mailSource || (read.mail ? "model" : "template"), fields: f, mail: read.mail || null, text: textValue, steps: [], outcome: "other", approvalId: null };
    log("agent", "read", [f.topic || T.none, C.SEVERITY_LABEL[sev.level][lang()]]);
    var readStep = { type: "read", state: "done", d: { f: f, text: textValue } };
    if (f.intent === "move" || f.intent === "cancel") return planChange(readStep, f);
    view.steps = [readStep].concat(idleSteps(["slots", "book", "mails"]));
    if (f.intent !== "new") { readStep.d.note = "otherNote"; view.outcome = "other"; log("agent", "other"); return; }
    if (f.trade === "other") {
      readStep.d.note = "declineNote";
      view.outcome = "declined";
      addMail("decline", { name: f.name });
      log("agent", "declined");
      return;
    }
    var missing = C.missingOf(f);
    if (missing.length) {
      readStep.state = "details";
      readStep.d.note = "stopNote";
      readStep.d.form = missing;
      view.outcome = "details";
      addMail("ask", { name: f.name, missing: missing });
      log("agent", "ask", [missing.map(function (m) { return T.missingShort[m]; }).join(", ")]);
      return;
    }
    book(f, sev, textValue);
  }
  function book(f, sev, textValue) {
    var T = L();
    var n = now();
    var result = C.chooseSlot({ severity: sev.level, trade: f.trade, wishes: f.wish ? C.parseWishes(f.wish, n.day) : [], appts: state.appts, now: n });
    view.steps[1] = { type: "slots", state: result.chosen ? "done" : "stopped", d: { result: result } };
    if (!result.chosen) { view.outcome = "noslot"; log("agent", "noslot"); return; }
    var s = result.chosen;
    var appt = { id: nextId("a"), tech: s.tech, date: s.date, win: s.win, trade: f.trade, sev: sev.level, src: "agent", name: f.name, address: f.address, phone: f.phone, topic: f.topic };
    state.appts = C.sortAppts(state.appts.concat([appt]));
    view.steps[2] = { type: "book", state: "done", d: { appt: appt } };
    var facts = { name: f.name, phone: f.phone, email: f.email, address: f.address, topic: f.topic, trade: f.trade, severity: sev.level, signal: sev.signal, tech: s.tech, date: s.date, win: s.win };
    var own = {};
    for (var k in facts) own[k] = facts[k];
    if (view.mail && view.mail.body) { own.body = view.mail.body; own.seal = view.mail.seal; }
    var ids = [addMail("confirm", own), addMail("tech", facts)];
    view.steps[3] = { type: "mails", state: "done", d: { ids: ids } };
    view.outcome = "booked";
    view.mailIds = ids;
    log("agent", "booked", [C.fmtDay(s.date, lang(), true) + ", " + C.fmtWindow(s.win, lang()), techName(s.tech)]);
    log("agent", "mails", [ids.length]);
  }
  function planChange(readStep, f) {
    var n = now();
    view.steps = [readStep].concat(idleSteps(["find", "propose", "approve"]));
    var days = f.old ? C.parseWishes(f.old, n.day).map(function (w) { return w.day; }).filter(Boolean) : [];
    var hit = C.findAppointment({ name: f.name, address: f.address, days: days }, state.appts, n.day);
    view.steps[1] = { type: "find", state: hit.state === "found" ? "done" : "stopped", d: hit };
    if (hit.state !== "found") { view.outcome = "unclear"; addMail("which", { name: f.name }); log("agent", "unclear"); return; }
    var appt = hit.hits[0];
    var from = { tech: appt.tech, date: appt.date, win: appt.win };
    var a = { id: nextId("f"), type: f.intent, apptId: appt.id, from: from, to: null, why: null, state: "pending", at: nowMs(), name: appt.name, address: appt.address, phone: appt.phone, topic: C.topicOf(appt, lang()), trade: appt.trade };
    if (f.intent === "move") {
      var result = C.chooseSlot({ severity: "normal", trade: appt.trade, wishes: f.wish ? C.parseWishes(f.wish, n.day) : [], appts: state.appts, now: n, ignore: appt.id, not: from, prefer: appt.tech });
      if (!result.chosen) { view.steps[2] = { type: "propose", state: "stopped", d: { none: true } }; view.outcome = "noslot"; log("agent", "noslot"); return; }
      a.to = { tech: result.chosen.tech, date: result.chosen.date, win: result.chosen.win };
      a.why = result.why;
    }
    state.approvals.push(a);
    if (state.approvals.length > 20) state.approvals.shift();
    view.steps[2] = { type: "propose", state: "done", d: { type: a.type, from: a.from, to: a.to, why: a.why } };
    view.steps[3] = { type: "approve", state: "approval", d: { approvalId: a.id } };
    view.outcome = "approval";
    view.approvalId = a.id;
    log("agent", "proposed", [apprKind(a), a.name || ""]);
  }
  /* the missing details arrive "as if the customer had answered": the flow goes on from step 2 */
  function supply(got) {
    var f = view.fields;
    if (got.topic) { f.topic = got.topic; if (f.trade === "other") f.trade = C.tradeIn(got.topic); }
    if (got.name) f.name = got.name;
    if (got.contact) f.phone = got.contact;
    if (got.address) f.address = got.address;
    f.missing = C.missingOf(f);
    log("human", "answered");
    stopTimers();
    ui.run++;
    busy(true);
    var readStep = view.steps[0];
    readStep.state = "done";
    readStep.d = { f: f, text: view.text, answered: true };
    if (f.trade === "other") { readStep.d.note = "declineNote"; view.outcome = "declined"; addMail("decline", { name: f.name }); log("agent", "declined"); }
    else book(f, C.severityOf(f.signals, view.text), view.text);
    play(1);
  }
  /* with a confirmed address the mails the agent has just written go out by themselves, and the job learns the appointment */
  function autoSend() {
    if (state.mail.state !== "confirmed") return;
    sendMails(state.outbox.filter(function (m) { return m.status === "screen" && m.run === ui.run; }));
    syncAppts();
  }
  function startRun(read, source, textValue) {
    stopTimers();
    ui.run++;
    roll();
    plan(read, source, textValue);
    save();
    play(source === "example" ? 0 : 1);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (ui.busy) return; // a busy button cannot be pressed twice
    clearError();
    var ex = exampleOf(ui.mode);
    var value = text.value.replace(/^\s+|\s+$/g, "");
    if (!ex && value.length < MIN) { showError(L().short, true); return; }
    stopTimers();
    busy(true);
    view = null;
    K.show(runBox, true);
    try { var r = runBox.getBoundingClientRect(); if (r.top > (window.innerHeight || 0) * 0.7) runBox.scrollIntoView({ behavior: K.reduce ? "auto" : "smooth", block: "nearest" }); } catch (err) { /* older browsers */ }
    if (ex) {
      var p = placeholders(ex);
      var src = ex.read[lang()];
      var fields = {};
      for (var k in src.fields) fields[k] = typeof src.fields[k] === "string" ? fillPlaceholders(src.fields[k], p) : Array.isArray(src.fields[k]) ? src.fields[k].slice() : src.fields[k];
      var body = C.EXAMPLE_BODIES[ex.id] ? C.EXAMPLE_BODIES[ex.id][lang()] : null; // the prepared wording of this example
      startRun({ fields: fields, mail: body ? { body: body } : null, mailSource: "template" }, "example", value);
      return;
    }
    var run = ++ui.run;
    // step 1 runs until the function answers
    view = { source: "model", steps: idleSteps(["read", "slots", "book", "mails"]), outcome: "other" };
    drawRun(0, 0);
    announce(L().running.read);
    guard.send(API, { action: "read", text: value.slice(0, MAX), lang: lang(), company_website: form.elements.company_website.value }, 30000).then(function (r) {
      if (run !== ui.run) return;
      var d = r.data;
      if (r.status === 200 && d && d.ok && d.fields) {
        ui.run--; // startRun counts again
        startRun({ fields: d.fields, mail: d.mail || null, mailSource: d.mailSource }, d.source === "model" ? "model" : "rules", value);
        return;
      }
      view = null;
      drawRun(0);
      busy(false);
      var msg = d && d.error === "bot_check" ? L().botFail : (d && d.message) || L().network;
      if (d && /^quota_/.test(String(d.error))) msg += L().quotaHint;
      showError(msg, true);
    }, function () {
      if (run !== ui.run) return;
      view = null;
      drawRun(0);
      busy(false);
      showError(L().network, true);
    });
  });
  for (var i = 0; i < tabs.length; i++) tabs[i].addEventListener("click", function (e) { choose(e.currentTarget.getAttribute("data-rd-example")); });
  text.addEventListener("input", function () { setCount(); if (errorBox.textContent) clearError(); });
  runBtn.addEventListener("click", viewRun);
  resetBtn.addEventListener("click", function () {
    if (ui.busy) return;
    var old = state.sid;
    var had = state.mail.state !== "none";
    stopTimers();
    stopPoll();
    ui.run++;
    state = fresh();
    view = null;
    ui.reject = null; ui.remShown = null; ui.mailNote = "";
    stored = false;
    try { localStorage.removeItem(KEY); } catch (err) { /* nothing */ }
    drawRun(0);
    choose(EXAMPLES[0].id, false);
    renderAll();
    openTab("cal", false);
    announce(L().resetDone);
    startBtn.focus();
    // the server's copy of a confirmed session goes with it
    if (had) post({ action: "forget", sid: old }).then(function () {}, function () {});
  });
  window.addEventListener("rexity:languagechange", function () {
    var ex = exampleOf(ui.mode);
    if (ex) text.value = exampleText(ex);
    setKind();
    setCount();
    if (view && !ui.busy) drawRun(revealCount(), undefined, true);
    renderAll();
    guard.relang();
    mailGuard.relang();
  });
  doc.addEventListener("visibilitychange", function () { if (!doc.hidden && state.mail.state === "waiting") checkStatus(null, false); });
  window.addEventListener("storage", function (e) { if (e.key === KEY && !ui.busy) { state = load(); renderAll(); } });

  // ---------------------------------------------------------------- start
  roll();
  choose(EXAMPLES[0].id, true);
  renderAll();
  // a returning visitor whose address was waiting or confirmed: ask once where it stands
  if (state.mail.state !== "none") { checkStatus(null, false); if (state.mail.state === "waiting") startPoll(); }
})();
