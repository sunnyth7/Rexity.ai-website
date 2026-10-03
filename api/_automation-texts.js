// api/_automation-texts.js — the rule-based texts of the Automatisierungs-Check (Sprint 41) and the guard for a
// model's wording. Required by api/automation-check.js. The file name starts with "_": no route.
//
// Two jobs:
//   1. A small library of generic but correct texts per kind of task (offers, appointments, invoices, enquiries,
//      reminders, data entry, reporting, other): what an automation takes over, what stays with the team, what it
//      needs, two questions for the call. They are the analysis when no model answers, and they replace any single
//      field of a model's answer that the guard rejects.
//   2. The guard: a text of the model is used only if it has no number that is not in the visitor's own entries, no
//      percentage, no money, no promise, no vendor or product name, no statement about legal matters, no wording
//      about replacing people or jobs, no markup or link, and keeps its length.
// Nothing here is a statistic, a client name or a promise. The kind of a task comes from
// assets/js/automation-rule.js taskType().

const RULE = require("../assets/js/automation-rule.js");
const T = (de, en) => ({ de, en });

const LIB = {
  offers: {
    steps: [
      T("Die Angaben aus der Anfrage übernehmen und einen Angebotsentwurf aus Ihren Vorlagen vorbereiten.", "Take the details from the enquiry and prepare a draft quote from your templates."),
      T("Fehlende Angaben per Rückfrage beim Kunden anfordern.", "Ask the customer for missing details."),
      T("Den Entwurf zur Freigabe vorlegen und erst danach versenden.", "Present the draft for approval and send it only afterwards.")
    ],
    stays: T("Kalkulation, Sonderfälle und die Freigabe jedes Angebots bleiben bei Ihnen.", "Costing, special cases and the approval of every quote stay with you."),
    needs: ["mailbox", "form", "software", "files"],
    questions: [
      T("Woraus setzen sich Ihre Angebote zusammen: feste Positionen oder Kalkulation je Auftrag?", "What are your quotes made of: fixed items or costing per order?"),
      T("In welchem Programm entstehen Ihre Angebote heute?", "Which program do you write your quotes in today?")
    ]
  },
  appointments: {
    steps: [
      T("Terminwünsche entgegennehmen und mit den freien Zeiten in Ihrem Kalender abgleichen.", "Take appointment requests and match them with the free times in your calendar."),
      T("Den Termin eintragen und eine Bestätigung senden.", "Enter the appointment and send a confirmation."),
      T("Vor dem Termin erinnern und Absagen oder Verschiebungen aufnehmen.", "Send a reminder before the appointment and record cancellations or changes.")
    ],
    stays: T("Ausnahmen und Termine, die eine Absprache brauchen, bleiben bei Ihrem Team.", "Exceptions and appointments that need an agreement stay with your team."),
    needs: ["calendar", "mailbox", "form", "phone"],
    questions: [
      T("Welcher Kalender ist bei Ihnen maßgeblich?", "Which calendar is the authoritative one in your business?"),
      T("Welche Termine dürfen ohne Rücksprache vergeben werden?", "Which appointments may be given out without checking back?")
    ]
  },
  invoices: {
    steps: [
      T("Eingehende Rechnungen und Belege erkennen und die wichtigsten Angaben auslesen.", "Recognise incoming invoices and receipts and read out the key details."),
      T("Die Belege nach Ihrem Schema benennen und ablegen.", "Name and file the documents by your scheme."),
      T("Die Angaben für die Buchhaltung bereitstellen und Auffälliges zur Prüfung vorlegen.", "Provide the details for accounting and present anything unusual for review.")
    ],
    stays: T("Die sachliche Prüfung und die Freigabe von Zahlungen bleiben bei Ihnen.", "Checking the content and approving payments stay with you."),
    needs: ["mailbox", "files", "accounting"],
    questions: [
      T("Wie kommen Rechnungen heute an: als Datei, auf Papier oder beides?", "How do invoices arrive today: as a file, on paper or both?"),
      T("Wohin sollen die Belege am Ende gelangen?", "Where should the documents end up?")
    ]
  },
  enquiries: {
    steps: [
      T("Eingehende Anfragen lesen, das Anliegen erkennen und einen Vorgang anlegen.", "Read incoming enquiries, recognise the concern and create a record."),
      T("Wiederkehrende Fragen aus Ihren eigenen Inhalten beantworten oder einen Antwortentwurf schreiben.", "Answer recurring questions from your own content or write a draft reply."),
      T("Alles Übrige mit den nötigen Angaben an die richtige Person weitergeben.", "Pass everything else on to the right person with the details needed.")
    ],
    stays: T("Beratung, Sonderfälle und alles, was eine Entscheidung braucht, bleiben bei Ihrem Team.", "Advice, special cases and anything that needs a decision stay with your team."),
    needs: ["mailbox", "form", "phone"],
    questions: [
      T("Welche Fragen wiederholen sich am häufigsten?", "Which questions repeat most often?"),
      T("Wer soll eine Anfrage bekommen, die nicht automatisch beantwortet werden kann?", "Who should get an enquiry that cannot be answered automatically?")
    ]
  },
  reminders: {
    steps: [
      T("Fällige Termine oder offene Posten aus Ihren Daten ermitteln.", "Find due dates or open items in your data."),
      T("Die Erinnerung zum richtigen Zeitpunkt mit Ihrem Text versenden.", "Send the reminder at the right time with your wording."),
      T("Antworten zuordnen und offene Fälle zur Nachverfolgung vorlegen.", "Match the replies and present open cases for follow-up.")
    ],
    stays: T("Kulanz und das Gespräch im Einzelfall bleiben bei Ihnen.", "Goodwill and the conversation in an individual case stay with you."),
    needs: ["calendar", "software", "accounting", "mailbox"],
    questions: [
      T("Aus welchem Programm stammen die fälligen Termine oder offenen Posten?", "Which program holds the due dates or open items?"),
      T("Auf welchem Weg sollen die Erinnerungen ankommen?", "By which channel should the reminders arrive?")
    ]
  },
  dataentry: {
    steps: [
      T("Die Angaben aus E-Mails, Formularen oder Dateien auslesen.", "Read the details out of e-mails, forms or files."),
      T("Die Angaben prüfen und in Ihre Liste oder Ihr Programm übertragen.", "Check the details and transfer them into your list or program."),
      T("Unklare oder unvollständige Fälle zur Prüfung vorlegen.", "Present unclear or incomplete cases for review.")
    ],
    stays: T("Die Kontrolle der unklaren Fälle bleibt bei Ihrem Team.", "Checking the unclear cases stays with your team."),
    needs: ["files", "software", "mailbox"],
    questions: [
      T("In welches Programm oder welche Liste werden die Angaben eingetragen?", "Which program or list are the details entered into?"),
      T("Hat dieses Programm eine Schnittstelle oder einen Import?", "Does that program have an interface or an import?")
    ]
  },
  reporting: {
    steps: [
      T("Die Zahlen aus Ihren Quellen regelmäßig zusammentragen.", "Gather the figures from your sources at regular intervals."),
      T("Daraus die Übersicht in Ihrer gewohnten Form erstellen.", "Build the overview from them in the form you are used to."),
      T("Die Übersicht zum festen Zeitpunkt bereitstellen oder versenden.", "Provide or send the overview at the fixed time.")
    ],
    stays: T("Die Bewertung der Zahlen und die Entscheidungen daraus bleiben bei Ihnen.", "Assessing the figures and the decisions that follow stay with you."),
    needs: ["files", "software"],
    questions: [
      T("Aus welchen Quellen stammen die Zahlen?", "Which sources do the figures come from?"),
      T("Wer braucht die Übersicht, und wie oft?", "Who needs the overview, and how often?")
    ]
  },
  other: {
    steps: [
      T("Die Angaben erfassen, mit denen die Aufgabe beginnt.", "Capture the details the task starts with."),
      T("Die wiederkehrenden Schritte nach Ihrem festen Ablauf ausführen.", "Carry out the recurring steps by your fixed process."),
      T("Das Ergebnis zur Kontrolle vorlegen und Ausnahmen an Ihr Team geben.", "Present the result for checking and hand exceptions to your team.")
    ],
    stays: T("Ausnahmen und Entscheidungen bleiben bei Ihrem Team.", "Exceptions and decisions stay with your team."),
    needs: [],
    questions: [
      T("Welche Schritte hat die Aufgabe heute, vom Auslöser bis zum Ergebnis?", "Which steps does the task have today, from the trigger to the result?"),
      T("Welche Programme sind daran beteiligt?", "Which programs are involved?")
    ]
  }
};
// band "none": what would be needed first, from the visitor's own answers
const FIRST = {
  analog: T("Die Angaben zuerst digital erfassen, zum Beispiel über ein Formular statt auf Papier oder am Telefon.", "Capture the details digitally first, for example through a form instead of on paper or by phone."),
  same: T("Den Ablauf in feste Schritte bringen, damit eine Software ihm folgen kann.", "Bring the process into fixed steps so that software can follow it."),
  rare: T("Prüfen, ob sich der Aufwand bei dieser Häufigkeit lohnt.", "Check whether the effort is worthwhile at this frequency."),
  talk: T("Den Ablauf gemeinsam Schritt für Schritt aufschreiben und die wiederkehrenden Teile bestimmen.", "Write the process down together step by step and identify the recurring parts.")
};
const STAYS_NONE = T("Bis dahin bleibt die Aufgabe vollständig bei Ihrem Team.", "Until then the task stays with your team entirely.");
const CHANNEL_NEED = { email: "mailbox", phone: "phone", form: "form", software: "software", paper: "files" };

const pick = (x, lang) => x[lang === "en" ? "en" : "de"];
// the needs of a task: the kind's own, then what its channels add; in the order of RULE.NEEDS, four at most
function needsOf(task, type) {
  const set = new Set(LIB[type].needs.concat(task.channels.map((c) => CHANNEL_NEED[c])));
  return RULE.NEEDS.filter((n) => set.has(n)).slice(0, 4);
}
/** The rule-based texts of one task for its band. -> { steps, stays, needs, questions } */
function taskTexts(task, band, lang) {
  const type = RULE.taskType(task);
  const lib = LIB[type];
  if (band === "none") {
    const steps = [];
    if (RULE.channelKind(task) === "analog") steps.push(pick(FIRST.analog, lang));
    if (task.same !== "yes") steps.push(pick(FIRST.same, lang));
    if (RULE.runsPerYear(task) < RULE.POINTS.weeklyRuns) steps.push(pick(FIRST.rare, lang));
    if (steps.length < 2) steps.push(pick(FIRST.talk, lang));
    return { steps: steps.slice(0, 3), stays: pick(STAYS_NONE, lang), needs: needsOf(task, type), questions: lib.questions.map((q) => pick(q, lang)) };
  }
  return { steps: lib.steps.map((s) => pick(s, lang)), stays: pick(lib.stays, lang), needs: needsOf(task, type), questions: lib.questions.map((q) => pick(q, lang)) };
}
/** Two sentences about the whole result, from its figures (computed by the rule file). */
function summaryText(result, lang) {
  const n = result.tasks.length;
  const c = result.counts;
  if (lang === "en") {
    const a = n === 1 ? "By your entries your task is rated " + RULE.TEXT.en.badge[result.tasks[0].band].toLowerCase() + "." : "Of your " + n + " tasks we rate " + c.full + " as fully and " + c.partly + " as partly automatable" + (c.none ? "; " + c.none + " can hardly be automated at present." : ".");
    return a + " Together they take about " + RULE.hoursText(result.hours, "en") + " a year today.";
  }
  const a = n === 1 ? "Ihre Aufgabe stufen wir nach Ihren Angaben so ein: " + RULE.TEXT.de.badge[result.tasks[0].band].toLowerCase() + "." : "Von Ihren " + n + " Aufgaben stufen wir " + c.full + " als vollständig und " + c.partly + " als teilweise automatisierbar ein" + (c.none ? "; " + c.none + (c.none === 1 ? " lässt" : " lassen") + " sich derzeit kaum automatisieren." : ".");
  return a + " Zusammen brauchen sie heute rund " + RULE.hoursText(result.hours, "de") + " pro Jahr.";
}
/** One sentence: the task to start with (first of the rule's order) and why. */
function firstStepText(result, lang) {
  if (result.first === null) {
    return lang === "en"
      ? "None of your tasks is well suited at present; in a conversation we look at what could change in the process."
      : "Keine Ihrer Aufgaben eignet sich derzeit gut; im Gespräch sehen wir uns an, was sich am Ablauf ändern ließe.";
  }
  const t = result.tasks[result.first];
  const best = result.order.length === 1 || result.tasks[result.order[1]].band !== t.band;
  if (lang === "en") return "We would start with “" + t.title + "”: " + (best ? "it is the task best suited to automation." : "among the best-suited tasks it takes the most time today.");
  return "Wir würden mit „" + t.title + "“ beginnen: " + (best ? "Sie ist die Aufgabe, die sich am besten eignet." : "Unter den am besten geeigneten Aufgaben braucht sie heute die meiste Zeit.");
}

// ---- the guard --------------------------------------------------------------------------------------------------------
const VENDORS = /\b(?:google|gemini|vertex|microsoft|outlook|excel|word|office\s?365|teams|sharepoint|onedrive|copilot|power\s?automate|sap|datev|lexoffice|lexware|sevdesk|sage|zapier|make\.com|n8n|uipath|openai|chatgpt|gpt|claude|anthropic|amazon|aws|bedrock|azure|whatsapp|slack|salesforce|hubspot|pipedrive|shopify|woocommerce|wordpress|calendly|doctolib|gmail|apple|icloud|zoom|trello|asana|notion|airtable|stripe|paypal|dropbox|meta|facebook|instagram|telegram|signal|twilio|brevo|mailchimp|rexity)\b/i;
const RULES = [
  ["markup", /[<>{}\[\]`*_#|]|https?:|www\.|\S@\S|\n/],
  ["percent", /%|prozent|percent/i],
  ["money", /€|\beuro?s?\b|\beur\b|\$|\bdollars?\b|\bcents?\b|\busd\b|kostenlos|gratis|umsonst|free of charge/i],
  ["promise", /garant|guarantee|versprech|\bpromis|zusicher|\bzusage|\bspar(?:en|t|st|e)\b|einspar|ersparnis|\bsav(?:e|es|ed|ing|ings)\b|amortis|\broi\b|rentier|fehlerfrei|error-free|risikolos|risk-free|hundertprozentig|nie wieder|never again/i],
  ["legal", /dsgvo|gdpr|datenschutz|data protection|rechtssicher|rechtskonform|rechtlich|gesetz|\blegal|\blawful|\blaws?\b|compliance|compliant|konform|haftung|liabilit|steuerrecht|steuerberatung|tax advice|gobd/i],
  ["job", /ersetz|\breplac|arbeitspl(?:atz|ätze)|entlass|personalabbau|personal(?:kosten)?\s+(?:einspar|abbau|reduz)|stellen?\s+(?:streichen|abbauen|einsparen)|headcount|\bjobs?\b|überflüssig|redundan|lay-?offs?|mitarbeiter(?:innen)?\s+(?:einspar|abbau)/i],
  ["vendor", VENDORS]
];
/** Every number a visitor entered (figures and digits in their texts): the only numbers a model's text may contain. */
function allowedNumbers(input) {
  const set = new Set();
  const add = (s) => { for (const m of String(s == null ? "" : s).match(/\d+(?:[.,]\d+)?/g) || []) set.add(m.replace(",", ".")); };
  add(input.industry);
  if (input.hourly !== null && input.hourly !== undefined) add(input.hourly);
  for (const t of input.tasks) { add(t.title); add(t.desc); add(t.count); add(t.minutes); add(t.people); }
  return set;
}
/** -> null when the text may be shown, else the code of the first rule it breaks */
function violation(text, { min = 8, max = 200, numbers } = {}) {
  if (typeof text !== "string") return "type";
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length < min) return "short";
  if (s.length > max) return "long";
  for (const [code, re] of RULES) if (re.test(text)) return code;
  for (const m of s.match(/\d+(?:[.,]\d+)?/g) || []) if (!numbers || !numbers.has(m.replace(",", "."))) return "number";
  return null;
}

module.exports = { LIB, taskTexts, summaryText, firstStepText, needsOf, allowedNumbers, violation, RULES };
