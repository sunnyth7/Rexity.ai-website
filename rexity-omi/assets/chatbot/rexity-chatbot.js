(function () {
  // Sprint 12: the widget loads its own stylesheet (same folder, same ?v=) so the
  // CSS no longer blocks the first paint of every page; the panel is built once
  // it has arrived. No auto-open: a small greeting bubble instead (desktop/tablet,
  // once per session). Hidden while the menu or the booking modal is open (CSS).
  var SELF = document.currentScript && document.currentScript.src;
  var STORAGE_KEY = "rexity_lang";
  var INTRO_SEEN_KEY = "rexity_intro_seen";
  var LEAD_KEY = "rexity_chat_lead";
  var CONTACT = {
    email: "info@rexity.ai",
    whatsapp: "491742471435"
  };
  function getLead() {
    try { return JSON.parse(window.localStorage.getItem(LEAD_KEY) || "null"); } catch (e) { return null; }
  }
  function saveLead(lead) {
    try { window.localStorage.setItem(LEAD_KEY, JSON.stringify(lead)); } catch (e) {}
  }

  // Time-of-day greeting per PRD: computed for Europe/Berlin regardless of
  // the visitor's timezone (client clock converted via Intl; marked
  // client-derived per PRD fallback rule).
  function berlinHour() {
    try {
      return parseInt(new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Berlin", hour: "2-digit", hour12: false
      }).format(new Date()), 10);
    } catch (e) { return new Date().getHours(); }
  }
  function tagesgruss(lang) {
    var h = berlinHour();
    if (h >= 5 && h < 11) return lang === "de" ? "Guten Morgen" : "Good morning";
    if (h >= 11 && h < 18) return lang === "de" ? "Guten Tag" : "Good afternoon";
    return lang === "de" ? "Guten Abend" : "Good evening";
  }
  function greetingText(lang) {
    if (lang === "de") {
      return tagesgruss("de") + ", ich bin Rexity, der KI-Assistent von Rexity Labs. Ich beantworte Ihre Fragen zu Websites, Apps, Automatisierung, Preisen und Ablauf und verlinke Ihnen die passende Seite. Wie kann ich Ihnen weiterhelfen?";
    }
    return tagesgruss("en") + ", I am Rexity, the AI assistant of Rexity Labs. I answer your questions about websites, apps, automation, prices and how a project works, and link you to the right page. How can I help?";
  }

  var copy = {
    en: {
      quickQuestions: [
        "What does Rexity do?",
        "Web & app development",
        "AI agents",
        "Digital automations",
        "Dashboards",
        "Book a demo"
      ],
      rootLabel: "Rexity chat assistant",
      openLabel: "Open Rexity chat",
      closeLabel: "Close chat",
      panelLabel: "Rexity chat",
      quickLabel: "Suggested questions",
      messageLabel: "Message Rexity",
      sendLabel: "Send message",
      pillTitle: "Ask Rexity",
      pillSubtitle: "Your virtual assistant",
      introTitle: "How can we help?",
      introCopy: "Ask about web & app development, digital marketing, AI agents, automations, or dashboards.",
      placeholder: "Ask about Rexity...",
      footnote: "Our Rexity chatbot is powered by a modern AI agent and can make mistakes. Please contact us before drawing any conclusions — we can help you better: info@rexity.ai.",
      loadingThink: "Rexity is thinking …",
      loadingWrite: "Rexity is writing …",
      contactTitle: "Contact us",
      contactSubtitle: "Chat · WhatsApp · Email",
      contactChat: "Chatbot",
      contactWhatsApp: "WhatsApp",
      contactEmail: "Email",
      waText: "Hi Rexity Labs, I have a question",
      mailSubject: "Enquiry via rexity.ai",
      gateTitle: "Before we chat",
      gateCopy: "Please leave your name and phone number — this keeps the assistant available for real enquiries.",
      gateName: "Your name",
      gatePhone: "Phone number",
      gateSubmit: "Start chat",
      gateError: "Please enter a valid name and phone number.",
      nudgeTitle: "Questions about your project?",
      nudgeText: "Our assistant Rexity answers right away.",
      nudgeClose: "Dismiss"
    },
    de: {
      quickQuestions: [
        "Was macht Rexity?",
        "Web- & App-Entwicklung",
        "KI-Agenten",
        "Digitale Automatisierungen",
        "Dashboards",
        "Demo buchen"
      ],
      rootLabel: "Rexity Chat-Assistent",
      openLabel: "Rexity Chat öffnen",
      closeLabel: "Chat schließen",
      panelLabel: "Rexity Chat",
      quickLabel: "Vorgeschlagene Fragen",
      messageLabel: "Nachricht an Rexity",
      sendLabel: "Nachricht senden",
      pillTitle: "Rexity fragen",
      pillSubtitle: "Ihr virtueller Assistent",
      introTitle: "Wie können wir helfen?",
      introCopy: "Fragen Sie zu Web- & App-Entwicklung, digitalem Marketing, KI-Agenten, Automatisierungen oder Dashboards.",
      placeholder: "Fragen Sie Rexity...",
      footnote: "Unser Rexity-Chatbot basiert auf einem modernen KI-Agenten und kann Fehler machen. Bitte kontaktieren Sie uns, bevor Sie Entscheidungen daraus ableiten — wir helfen Ihnen gerne besser weiter: info@rexity.ai.",
      loadingThink: "Rexity denkt …",
      loadingWrite: "Rexity schreibt …",
      contactTitle: "Kontakt",
      contactSubtitle: "Chat · WhatsApp · E-Mail",
      contactChat: "Chatbot",
      contactWhatsApp: "WhatsApp",
      contactEmail: "E-Mail",
      waText: "Hallo Rexity Labs, ich habe eine Frage",
      mailSubject: "Anfrage über rexity.ai",
      gateTitle: "Bevor wir chatten",
      gateCopy: "Bitte nennen Sie uns Ihren Namen und Ihre Telefonnummer — so bleibt der Assistent für echte Anfragen verfügbar.",
      gateName: "Ihr Name",
      gatePhone: "Telefonnummer",
      gateSubmit: "Chat starten",
      gateError: "Bitte geben Sie einen gültigen Namen und eine Telefonnummer ein.",
      nudgeTitle: "Fragen zu Ihrem Projekt?",
      nudgeText: "Unser Assistent Rexity antwortet sofort.",
      nudgeClose: "Hinweis schließen"
    }
  };

  // Offline answers: used only when /api/chat cannot be reached (network down, local static preview). Facts and
  // links as on the site (data/site-knowledge.json); no prices beyond a link to /preise. Keys are matched as
  // word stems; the most specific entry (most matching keys) wins, the overview only when nothing matches.
  var fallbackKnowledge = [
    { keys: ["saas", "plattform", "platform", "abo", "subscription", "multi-tenant", "mandant"],
      de: "Ja, wir entwickeln SaaS-Plattformen: Multi-Tenant mit Login, Abrechnung, Dashboards und dem Backend dahinter. Mehr dazu: [SaaS-Plattformen](/web/saas). Ein Beispiel ist unser eigenes Produkt [LevelKraft](/work/levelkraft).",
      en: "Yes, we build SaaS platforms: multi-tenant, with login, billing, dashboards and the backend behind them. More: [SaaS platforms](/web/saas). One example is our own product [LevelKraft](/work/levelkraft)." },
    { keys: ["app", "ios", "android", "iphone", "mobile", "smartphone"],
      de: "Ja, wir entwickeln Android- und iOS-Apps, nativ (Kotlin, Swift) oder plattformübergreifend (React Native). Mehr dazu: [Mobile Apps](/web/mobile-apps).",
      en: "Yes, we build Android and iOS apps, native (Kotlin, Swift) or cross-platform (React Native). More: [Mobile apps](/web/mobile-apps)." },
    { keys: ["dashboard", "reporting", "kpi", "kennzahl", "auswertung"],
      de: "Wir bauen KPI-, Operations- und Reporting-Dashboards, die Ihre wichtigsten Kennzahlen übersichtlich zeigen. Mehr dazu: [Dashboards & Reporting](/web/dashboards).",
      en: "We build KPI, operations and reporting dashboards that show your key figures at a glance. More: [Dashboards & reporting](/web/dashboards)." },
    { keys: ["website", "webseite", "homepage", "webdesign", "web design", "landing", "online-shop", "internetseite"],
      de: "Wir gestalten und entwickeln Websites aus einer Hand: Design, Technik und SEO-Grundlagen, auf Wunsch mit Online-Buchung. Mehr dazu: [Webdesign & Web-Entwicklung](/web/web-design) und unsere [Projekte](/work).",
      en: "We design and build websites end to end: design, engineering and SEO basics, with online booking if you need it. More: [Web design & development](/web/web-design) and our [projects](/work)." },
    { keys: ["whatsapp"],
      de: "Wir richten WhatsApp-Business-Abläufe ein, die Fragen beantworten, Anfragen vorqualifizieren und Termine buchen, über die offizielle API mit Opt-in. Mehr dazu: [WhatsApp-Agenten](/automation/whatsapp).",
      en: "We set up WhatsApp Business flows that answer questions, qualify leads and book appointments, via the official API with opt-in. More: [WhatsApp agents](/automation/whatsapp)." },
    { keys: ["buchung", "termin", "kurs", "booking", "appointment", "reservier"],
      de: "Wir bauen Websites mit Online-Termin- oder Kursbuchung, die auch nachts und am Wochenende Anfragen annehmen. Beispiele: [Fitnessstudio-Website](/fitnessstudio-website) und [Online-Terminbuchung für Kfz-Betriebe](/kfz-aufbereitung-website). Ein Gespräch mit uns: [Termin buchen](/#kontakt).",
      en: "We build websites with online appointment or class booking that take requests at night and on weekends too. Examples: [gym website](/fitnessstudio-website) and [online booking for car care](/kfz-aufbereitung-website). Talk to us: [book a call](/#kontakt)." },
    { keys: ["chatbot", "chat bot", "assistent", "assistant"],
      de: "Wir bauen Website-Chatbots wie diesen: Sie beantworten Fragen aus Ihrer eigenen Wissensbasis und übergeben komplexe Fälle an einen Menschen. Mehr dazu: [Website-Chatbots](/automation/chatbots).",
      en: "We build website chatbots like this one: they answer questions from your own knowledge base and hand complex cases to a person. More: [Website chatbots](/automation/chatbots)." },
    { keys: ["voice", "telefon", "anruf", "phone", "call", "rexfangs"],
      de: "Wir entwickeln Telefonassistenten, die Anrufe rund um die Uhr annehmen, weiterleiten und Details erfassen. Mehr dazu: [Voice-Agenten](/automation/voice). Unser eigenes Produkt RexFangs ist in der Testphase.",
      en: "We build phone assistants that answer calls around the clock, route them and capture the details. More: [Voice agents](/automation/voice). Our own product RexFangs is in testing." },
    { keys: ["automat", "rpa", "workflow", "prozess", "process", "crm", " ki", "ai "],
      de: "Wir automatisieren wiederkehrende Handarbeit, etwa über CRM, Postfach und interne Tools hinweg. Mehr dazu: [Automatisierung](/automation) und [RPA & Prozessautomatisierung](/automation/rpa).",
      en: "We automate repetitive manual work, for example across CRM, inbox and internal tools. More: [Automation](/automation) and [RPA & process automation](/automation/rpa)." },
    { keys: ["seo", "google", "ranking", "suchmaschine", "sichtbar", "visib"],
      de: "Wir kümmern uns um technisches SEO, Inhalte und Link-Strategie, damit Sie bei relevanten Suchanfragen gefunden werden. Mehr dazu: [SEO](/marketing/seo) und die [SEO-Fallstudie LevelKraft](/work/levelkraft#seo-fallstudie).",
      en: "We handle technical SEO, content and link strategy so you are found for relevant searches. More: [SEO](/marketing/seo) and the [LevelKraft SEO case study](/work/levelkraft#seo-fallstudie)." },
    { keys: ["marketing", "social", "content", "video", "instagram", "kunden gewinn", "mehr kunden"],
      de: "Wir unterstützen Sie mit SEO, Content & Social und KI-Videomarketing. Mehr dazu: [Digitales Marketing](/marketing).",
      en: "We help with SEO, content & social and AI video marketing. More: [Digital marketing](/marketing)." },
    { keys: ["test", "support", "wartung", "betreuung", "maintenance"],
      de: "Wir testen vor dem Launch über Geräte und Browser hinweg und betreuen Websites und Apps danach weiter. Mehr dazu: [Testing & Support](/testing-support) und [Betreuung](/preise#betreuung).",
      en: "We test across devices and browsers before launch and look after websites and apps afterwards. More: [Testing & support](/testing-support) and [maintenance](/preise#betreuung)." },
    { weight: 2, keys: ["preis", "kost", "price", "cost", "budget", "teuer", "euro", "€", "angebot", "quote"],
      de: "Unsere Einstiegspreise (netto zzgl. MwSt.) stehen auf der Seite [Preise](/preise). Den Festpreis für Ihr Projekt nennen wir nach einem kostenlosen Erstgespräch: [Termin buchen](/#kontakt).",
      en: "Our starting prices (net, plus VAT) are on the [pricing page](/preise). We give a fixed price for your project after a free first call: [book a call](/#kontakt)." },
    { weight: 2, keys: ["dauer", "lange", "wochen", "zeitraum", "timeline", "how long", "weeks"],
      de: "Nach dem kostenlosen Erstgespräch erhalten Sie innerhalb einer Woche Blueprint, Dokumentation und Demo. Die Umsetzung dauert für eine Website mit Buchung typisch vier bis acht Wochen.",
      en: "After the free first call you get a blueprint, documentation and a demo within one week. Building a website with booking typically takes four to eight weeks." },
    { keys: ["kontakt", "contact", "erreich", "email", "e-mail", "anruf", "gespräch", "beratung", "demo", "meeting"],
      de: "Sie erreichen uns unter info@rexity.ai oder +49 174 2471435. Ein kostenloses Erstgespräch (30 Minuten) können Sie direkt hier buchen: [Termin buchen](/#kontakt).",
      en: "You can reach us at info@rexity.ai or +49 174 2471435. Book a free 30-minute first call here: [book a call](/#kontakt)." },
    { keys: ["wo ", "standort", "region", "celle", "hannover", "niedersachsen", "hermannsburg", "location", "where"],
      de: "Wir sitzen in Hermannsburg (Südheide, Landkreis Celle) und arbeiten für Betriebe in ganz Niedersachsen und remote in ganz Deutschland. Mehr dazu: [IT-Dienstleister in Niedersachsen](/niedersachsen).",
      en: "We are based in Hermannsburg (Südheide, near Celle) and work for businesses across Lower Saxony and remotely across Germany. More: [Lower Saxony](/niedersachsen)." },
    { keys: ["projekt", "referenz", "beispiel", "portfolio", "work", "kunden", "example"],
      de: "Abgeschlossene Projekte sind z. B. [Body & Care Hermannsburg](/work/body-and-care), [Fahrzeugpflege Celle](/work/chara) und [LevelKraft](/work/levelkraft). Alle Arbeiten: [Projekte](/work).",
      en: "Completed projects include [Body & Care Hermannsburg](/work/body-and-care), [Fahrzeugpflege Celle](/work/chara) and [LevelKraft](/work/levelkraft). All work: [projects](/work)." }
  ];
  var fallbackOverview = {
    de: "Rexity Labs aus Hermannsburg entwickelt Websites, Apps, SaaS-Plattformen, Automatisierung und KI-Assistenten und hilft bei SEO und Marketing. Überblick: [Leistungen](/services), [Preise](/preise), [Termin buchen](/#kontakt).",
    en: "Rexity Labs from Hermannsburg builds websites, apps, SaaS platforms, automation and AI assistants, and helps with SEO and marketing. Overview: [services](/services), [pricing](/preise), [book a call](/#kontakt)."
  };
  var fallbackNote = {
    de: "Der KI-Assistent ist gerade nicht erreichbar, hier eine kurze Antwort: ",
    en: "The AI assistant is unavailable right now, here is a short answer: "
  };

  function svgIcon(name) {
    if (name === "wa") {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 8.5c0 4 3 7 7 7 .9 0 1.2-.6 1.2-1.2 0-.3-1.8-1.3-2.1-1.3-.5 0-.7.8-1.1.8-.8 0-3-2.2-3-3 0-.4.8-.6.8-1.1 0-.3-1-2.1-1.3-2.1-.6 0-1.2.3-1.2 1.2z" fill="currentColor"/></svg>';
    }
    if (name === "mail") {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="m4.5 7.5 7.5 5.5 7.5-5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
    }
    if (name === "send") {
      return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    if (name === "close") {
      return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>';
    }
    return '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8 9h10.5c3.3 0 5.5 2.1 5.5 5.1 0 2.1-1.1 3.8-2.9 4.6L25 25h-7.2l-3.1-5.2H13V25H8V9Zm5 4.4v2.7h5.2c.8 0 1.3-.6 1.3-1.4s-.5-1.3-1.3-1.3H13Z" fill="currentColor"/><path d="M7 7h12.5c4.4 0 7.5 2.9 7.5 7.1 0 2.9-1.5 5.3-4 6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  function detectLang(text) {
    if (window.RexityLang === "de" || window.RexityLang === "en") return window.RexityLang;
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "de" || saved === "en") return saved;
    } catch (_error) {}
    // German-first: unless the visitor explicitly switched the page to EN
    // (stored above), the chat greets and starts in German. The server then
    // follows the language the visitor actually writes in.
    return "de";
  }

  function localReply(message) {
    var lang = detectLang(message);
    var text = String(message || "").toLowerCase();
    if (/refund|erstattung|billing|rechnung|policy|legal|admin|chargeback|vertrag/i.test(text)) {
      return lang === "de"
        ? "Dazu kann ich keine Entscheidung treffen. Für Erstattungen, Richtlinien, Rechnungen oder Admin-Themen schreiben Sie bitte an info@rexity.ai."
        : "I can’t make decisions on that. For refunds, policies, billing, or admin matters, please email info@rexity.ai.";
    }
    var padded = " " + text + " ";
    var best = null, bestScore = 0;
    fallbackKnowledge.forEach(function (entry) {
      // a key counts only at the start of a word ("app" must not match "WhatsApp"); price and timeline
      // questions weigh double so "Was kostet eine Website?" gets the price answer.
      var score = entry.keys.reduce(function (sum, key) {
        var at = padded.indexOf(key), hit = false;
        while (at > -1 && !hit) { hit = !/[a-zäöüß]/.test(padded.charAt(at - 1)); at = padded.indexOf(key, at + 1); }
        return sum + (hit ? (entry.weight || 1) : 0);
      }, 0);
      if (score > bestScore) { best = entry; bestScore = score; }
    });
    return fallbackNote[lang] + ((best ? best[lang] : fallbackOverview[lang]) || fallbackOverview.de);
  }

  // ---- info@rexity.ai → clickable, pre-filled email -----------------------
  // Every appearance of the contact address in bot messages and the footnote
  // becomes a link. Clicking opens a tiny chooser (Gmail / Outlook / mail
  // app) — each target gets To, Subject and Body pre-filled in the chat
  // language. Built with DOM nodes only (never innerHTML on model output).
  var CONTACT_EMAIL = "info@rexity.ai";

  function mailPrefill(lang) {
    if (lang === "de") {
      return {
        subject: "Ich benötige mehr Informationen",
        body: "Hallo Rexity-Team,\n\nich interessiere mich für mehr Informationen zu Ihren Tools, zum Zeitrahmen, zu Kosten und Paketen — und gerne eine Demo.\n\nViele Grüße"
      };
    }
    return {
      subject: "I need more info on this topic",
      body: "Hey Rexity,\n\nI am interested in getting more info about your tools, timeline, costs etc and a demo?\n\nBest regards"
    };
  }

  function composeUrls(lang) {
    var p = mailPrefill(lang);
    var s = encodeURIComponent(p.subject);
    var b = encodeURIComponent(p.body);
    return {
      gmail: "https://mail.google.com/mail/?view=cm&fs=1&to=" + CONTACT_EMAIL + "&su=" + s + "&body=" + b,
      outlook: "https://outlook.live.com/mail/0/deeplink/compose?to=" + CONTACT_EMAIL + "&subject=" + s + "&body=" + b,
      mailto: "mailto:" + CONTACT_EMAIL + "?subject=" + s + "&body=" + b
    };
  }

  function closeMailMenus() {
    document.querySelectorAll(".rexity-chatbot__mailmenu").forEach(function (m) { m.remove(); });
  }

  function openMailMenu(anchor) {
    var existing = anchor.nextElementSibling;
    if (existing && existing.classList && existing.classList.contains("rexity-chatbot__mailmenu")) {
      existing.remove();
      return;
    }
    closeMailMenus();
    var lang = detectLang("");
    var urls = composeUrls(lang);
    var menu = document.createElement("span");
    menu.className = "rexity-chatbot__mailmenu";
    [
      ["Gmail", urls.gmail, true],
      ["Outlook", urls.outlook, true],
      [lang === "de" ? "E-Mail-App" : "Mail app", urls.mailto, false]
    ].forEach(function (item) {
      var btn = document.createElement("a");
      btn.className = "rexity-chatbot__mailmenu-btn";
      btn.textContent = item[0];
      btn.href = item[1];
      if (item[2]) { btn.target = "_blank"; btn.rel = "noopener noreferrer"; }
      btn.addEventListener("click", function () {
        window.setTimeout(closeMailMenus, 150);
      });
      menu.appendChild(btn);
    });
    anchor.insertAdjacentElement("afterend", menu);
  }

  // The contact address as a link that opens the Gmail / Outlook / mail-app chooser.
  function mailLink(label) {
    var a = document.createElement("a");
    a.className = "rexity-chatbot__maillink";
    a.textContent = label || CONTACT_EMAIL;
    a.href = "mailto:" + CONTACT_EMAIL;
    a.addEventListener("click", function (e) {
      e.preventDefault();
      openMailMenu(a);
    });
    return a;
  }

  function linkifyEmail(el) {
    if (!el) return;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var hits = [];
    var node;
    while ((node = walker.nextNode())) {
      if (node.parentNode && node.parentNode.closest && node.parentNode.closest("a")) continue;
      if (node.nodeValue && node.nodeValue.indexOf(CONTACT_EMAIL) > -1) hits.push(node);
    }
    hits.forEach(function (textNode) {
      var parts = textNode.nodeValue.split(CONTACT_EMAIL);
      var frag = document.createDocumentFragment();
      parts.forEach(function (part, i) {
        if (part) frag.appendChild(document.createTextNode(part));
        if (i < parts.length - 1) frag.appendChild(mailLink());
      });
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  // Turn bare http(s)/www URLs in a bot bubble into real clickable links.
  function linkifyUrls(el) {
    if (!el) return;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var hits = [];
    var node;
    while ((node = walker.nextNode())) {
      if (node.parentNode && node.parentNode.tagName === "A") continue;
      if (/(https?:\/\/|www\.)/i.test(node.nodeValue || "")) hits.push(node);
    }
    hits.forEach(function (tn) {
      var s = tn.nodeValue;
      var frag = document.createDocumentFragment();
      var re = /(https?:\/\/[^\s<>()]+)|(www\.[^\s<>()]+)/gi;
      var last = 0;
      var m;
      while ((m = re.exec(s))) {
        if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
        var raw = m[0];
        var trail = "";
        while (/[.,;:!?)\]]$/.test(raw)) { trail = raw.slice(-1) + trail; raw = raw.slice(0, -1); }
        var a = document.createElement("a");
        a.className = "rexity-chatbot__link";
        a.href = /^https?:\/\//i.test(raw) ? raw : "https://" + raw;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = raw;
        frag.appendChild(a);
        if (trail) frag.appendChild(document.createTextNode(trail));
        last = m.index + m[0].length;
      }
      if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
      tn.parentNode.replaceChild(frag, tn);
    });
  }

  // Apply both linkifiers to a finished bot bubble.
  function linkifyBot(el) { linkifyEmail(el); linkifyUrls(el); }

  // ---- Bot answers (Sprint 15-C): plain text, "- " list lines, [label](target) links.
  // Built with DOM nodes only (createElement / textContent), never innerHTML on model
  // output. Same-site paths open in the same tab; https links open in a new tab with
  // rel="noopener"; mailto:info@rexity.ai opens the mail chooser; tel: stays a plain
  // link; any other scheme is shown as text. /api/chat already validates every target.
  var MD_LINK_RE = /\[([^\]\n]{1,160})\]\(([^()\s]{1,300})\)/g;

  function linkTarget(target) {
    var t = String(target || "").trim();
    if (/^\/(?!\/)/.test(t) || /^#[\w-]+$/.test(t)) return { href: t, kind: "site" };
    if (/^mailto:/i.test(t)) return { href: t, kind: "mail" };
    if (/^tel:\+?[\d\s-]+$/i.test(t)) return { href: t.replace(/\s/g, ""), kind: "tel" };
    if (/^https:\/\/[^\s]+$/i.test(t)) return { href: t, kind: "external" };
    return null;
  }

  function appendInline(parent, line) {
    var last = 0;
    var m;
    MD_LINK_RE.lastIndex = 0;
    while ((m = MD_LINK_RE.exec(line))) {
      if (m.index > last) parent.appendChild(document.createTextNode(line.slice(last, m.index)));
      var label = m[1];
      var target = linkTarget(m[2]);
      if (!target) {
        parent.appendChild(document.createTextNode(label));
      } else if (target.kind === "mail" && target.href.toLowerCase().split("?")[0] === "mailto:" + CONTACT_EMAIL) {
        parent.appendChild(mailLink(label));
      } else {
        var a = document.createElement("a");
        a.className = "rexity-chatbot__link rexity-chatbot__mdlink";
        a.href = target.href;
        a.textContent = label;
        if (target.kind === "external") { a.target = "_blank"; a.rel = "noopener"; }
        if (target.kind === "site") a.setAttribute("data-rexity-chat-nav", "");
        // "Termin buchen" opens the booking modal where the page has one (rexity.js), else it scrolls to #kontakt
        if (target.href === "/#kontakt") a.setAttribute("data-rx-open", "booking");
        parent.appendChild(a);
      }
      last = m.index + m[0].length;
    }
    if (last < line.length) parent.appendChild(document.createTextNode(line.slice(last)));
  }

  // Paragraphs (lines joined with <br>, a blank line starts a new one) and "- " lists.
  function renderBotText(el, text) {
    el.textContent = "";
    var para = null;
    var list = null;
    String(text || "").replace(/\r\n?/g, "\n").split("\n").forEach(function (raw) {
      var line = raw.replace(/\s+$/, "");
      var item = /^\s*[-•]\s+(.+)$/.exec(line);
      if (item) {
        para = null;
        if (!list) {
          list = document.createElement("ul");
          list.className = "rexity-chatbot__list";
          el.appendChild(list);
        }
        var li = document.createElement("li");
        appendInline(li, item[1]);
        list.appendChild(li);
        return;
      }
      list = null;
      if (!line.trim()) { para = null; return; }
      if (!para) {
        para = document.createElement("p");
        para.className = "rexity-chatbot__p";
        el.appendChild(para);
      } else {
        para.appendChild(document.createElement("br"));
      }
      appendInline(para, line);
    });
    linkifyBot(el);
  }

  // ---- The conversation survives a click on a chat link (same browser tab) ------
  var LOG_KEY = "rexity_chat_log";
  var REOPEN_KEY = "rexity_chat_reopen";
  function readLog() {
    try {
      var log = JSON.parse(window.sessionStorage.getItem(LOG_KEY) || "[]");
      return Array.isArray(log) ? log.filter(function (m) { return m && (m.t === "bot" || m.t === "user") && typeof m.x === "string"; }) : [];
    } catch (e) { return []; }
  }
  function writeLog(container) {
    try {
      var log = [];
      container.querySelectorAll(".rexity-chatbot__message").forEach(function (el) {
        if (el.classList.contains("rexity-chatbot__message--loading")) return;
        log.push({ t: el.classList.contains("rexity-chatbot__message--user") ? "user" : "bot", x: (el.getAttribute("data-raw") || el.textContent || "").slice(0, 2000) });
      });
      window.sessionStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-30)));
    } catch (e) {}
  }

  // A "thinking" bubble: three bouncing dots (animated), shown while the
  // model works. Static markup only — never model output.
  function addThinking(container) {
    var item = document.createElement("div");
    item.className = "rexity-chatbot__message rexity-chatbot__message--bot rexity-chatbot__message--loading";
    item.setAttribute("aria-label", "…");
    var dots = document.createElement("span");
    dots.className = "rexity-chatbot__dots";
    dots.innerHTML = "<span></span><span></span><span></span>";
    item.appendChild(dots);
    container.appendChild(item);
    container.scrollTop = container.scrollHeight;
    return item;
  }

  // Replace a thinking bubble with the final answer + clickable links.
  function setBotAnswer(el, text) {
    el.classList.remove("rexity-chatbot__message--loading");
    el.removeAttribute("aria-label");
    el.setAttribute("data-raw", String(text || ""));
    renderBotText(el, text);
    if (el.parentNode) {
      el.parentNode.scrollTop = el.parentNode.scrollHeight;
      writeLog(el.parentNode);
    }
  }

  // Close any open chooser when clicking elsewhere.
  document.addEventListener("click", function (e) {
    if (e.target.closest && (e.target.closest(".rexity-chatbot__maillink") || e.target.closest(".rexity-chatbot__mailmenu"))) return;
    closeMailMenus();
  }, true);

  function addMessage(container, text, type) {
    var item = document.createElement("div");
    item.className = "rexity-chatbot__message rexity-chatbot__message--" + type;
    item.setAttribute("data-raw", String(text || ""));
    if (type.indexOf("bot") > -1) renderBotText(item, text);
    else item.textContent = text;
    container.appendChild(item);
    container.scrollTop = container.scrollHeight;
    writeLog(container);
    return item;
  }

  async function askApi(message, lang, history) {
    var response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message, lang: lang, history: history || [], lead: getLead() || undefined })
    });
    if (!response.ok) throw new Error("Chat request failed");
    var data = await response.json();
    return data.answer;
  }

  function init() {
    if (document.querySelector(".rexity-chatbot")) return;
    var lang = detectLang("");
    var activeCopy = copy[lang] || copy.en;

    var root = document.createElement("section");
    root.className = "rexity-chatbot";
    root.setAttribute("aria-label", activeCopy.rootLabel);
    root.innerHTML = [
      '<div class="rexity-chatbot__menu" hidden>',
        '<button class="rexity-chatbot__menu-item rexity-chatbot__menu-chat" type="button"><img class="rexity-chatbot__menu-mark" src="/assets/brand/final/rexity-mark-white.svg" alt="" width="20" height="20"><span></span></button>',
        '<a class="rexity-chatbot__menu-item rexity-chatbot__menu-wa" target="_blank" rel="noopener">' + svgIcon("wa") + '<span></span></a>',
        '<a class="rexity-chatbot__menu-item rexity-chatbot__menu-mail">' + svgIcon("mail") + '<span></span></a>',
      '</div>',
      '<div class="rexity-chatbot__nudge" role="status" hidden>',
        '<button class="rexity-chatbot__nudge-text" type="button"><strong></strong><span></span></button>',
        '<button class="rexity-chatbot__close rexity-chatbot__nudge-close" type="button">' + svgIcon("close") + '</button>',
      '</div>',
      '<button class="rexity-chatbot__pill" type="button" aria-label="' + activeCopy.openLabel + '">',
        '<span class="rexity-chatbot__mark rexity-chatbot__mark--nav"><img src="/assets/brand/final/rexity-mark-white.svg" alt="" width="22" height="22"></span>',
        '<span class="rexity-chatbot__pill-text">',
          '<span class="rexity-chatbot__pill-title">' + activeCopy.pillTitle + '</span>',
          '<span class="rexity-chatbot__pill-subtitle">' + activeCopy.pillSubtitle + '</span>',
        '</span>',
      '</button>',
      '<div class="rexity-chatbot__panel" role="dialog" aria-modal="false" aria-label="' + activeCopy.panelLabel + '">',
        '<div class="rexity-chatbot__hero">',
          '<div class="rexity-chatbot__top">',
            '<div class="rexity-chatbot__brand"><img src="/assets/brand/web/rexity-logo-horizontal-white.svg" alt="Rexity Labs" width="112" height="29"></div>',
            '<button class="rexity-chatbot__close" type="button" aria-label="' + activeCopy.closeLabel + '">' + svgIcon("close") + '</button>',
          '</div>',
          '<div class="rexity-chatbot__intro">',
            '<h2 class="rexity-chatbot__intro-title">' + activeCopy.introTitle + '</h2>',
            '<p class="rexity-chatbot__intro-copy">' + activeCopy.introCopy + '</p>',
          '</div>',
        '</div>',
        '<form class="rexity-chatbot__gate" novalidate>',
          '<h3 class="rexity-chatbot__gate-title"></h3>',
          '<p class="rexity-chatbot__gate-copy"></p>',
          '<input class="rexity-chatbot__gate-name" type="text" maxlength="80" autocomplete="name">',
          '<input class="rexity-chatbot__gate-phone" type="tel" maxlength="24" autocomplete="tel">',
          '<button class="rexity-chatbot__gate-submit rx-btn rx-btn--primary rx-btn--solid" type="submit"></button>',
          '<p class="rexity-chatbot__gate-error" hidden></p>',
        '</form>',
        '<div class="rexity-chatbot__quick" aria-label="' + activeCopy.quickLabel + '"></div>',
        '<div class="rexity-chatbot__messages" aria-live="polite"></div>',
        '<form class="rexity-chatbot__form">',
          '<input class="rexity-chatbot__input" type="text" maxlength="1000" autocomplete="off" placeholder="' + activeCopy.placeholder + '" aria-label="' + activeCopy.messageLabel + '">',
          '<button class="rexity-chatbot__send" type="submit" aria-label="' + activeCopy.sendLabel + '">' + svgIcon("send") + '</button>',
        '</form>',
        '<div class="rexity-chatbot__footnote">' + activeCopy.footnote + '</div>',
      '</div>'
    ].join("");

    document.body.appendChild(root);

    var pill = root.querySelector(".rexity-chatbot__pill");
    var close = root.querySelector(".rexity-chatbot__close");
    var quick = root.querySelector(".rexity-chatbot__quick");
    var messages = root.querySelector(".rexity-chatbot__messages");
    var form = root.querySelector(".rexity-chatbot__form");
    var input = root.querySelector(".rexity-chatbot__input");
    var send = root.querySelector(".rexity-chatbot__send");
    var menu = root.querySelector(".rexity-chatbot__menu");
    var menuChatBtn = root.querySelector(".rexity-chatbot__menu-chat");
    var menuWa = root.querySelector(".rexity-chatbot__menu-wa");
    var menuMail = root.querySelector(".rexity-chatbot__menu-mail");
    var gate = root.querySelector(".rexity-chatbot__gate");
    var gateTitleEl = root.querySelector(".rexity-chatbot__gate-title");
    var gateCopyEl = root.querySelector(".rexity-chatbot__gate-copy");
    var gateNameEl = root.querySelector(".rexity-chatbot__gate-name");
    var gatePhoneEl = root.querySelector(".rexity-chatbot__gate-phone");
    var gateSubmitEl = root.querySelector(".rexity-chatbot__gate-submit");
    var gateErrorEl = root.querySelector(".rexity-chatbot__gate-error");
    var nudge = root.querySelector(".rexity-chatbot__nudge");
    var nudgeText = root.querySelector(".rexity-chatbot__nudge-text");
    var nudgeClose = root.querySelector(".rexity-chatbot__nudge-close");

    // Chat is gated behind name + phone so the assistant (and its API budget)
    // is reserved for real enquiries rather than anonymous drive-by use.
    function applyGateState() {
      var lead = getLead();
      gate.hidden = !!lead;
      quick.style.display = lead ? "" : "none";
      messages.style.display = lead ? "" : "none";
      form.style.display = lead ? "" : "none";
    }

    function hideMenu() {
      menu.setAttribute("hidden", "");
    }

    function renderChatLanguage(nextLang) {
      lang = nextLang === "de" ? "de" : "en";
      activeCopy = copy[lang] || copy.en;
      root.setAttribute("aria-label", activeCopy.rootLabel);
      pill.setAttribute("aria-label", activeCopy.openLabel);
      close.setAttribute("aria-label", activeCopy.closeLabel);
      root.querySelector(".rexity-chatbot__panel").setAttribute("aria-label", activeCopy.panelLabel);
      quick.setAttribute("aria-label", activeCopy.quickLabel);
      input.setAttribute("placeholder", activeCopy.placeholder);
      input.setAttribute("aria-label", activeCopy.messageLabel);
      send.setAttribute("aria-label", activeCopy.sendLabel);
      root.querySelector(".rexity-chatbot__pill-title").textContent = activeCopy.contactTitle;
      root.querySelector(".rexity-chatbot__pill-subtitle").textContent = activeCopy.contactSubtitle;
      menuChatBtn.querySelector("span").textContent = activeCopy.contactChat;
      menuWa.querySelector("span").textContent = activeCopy.contactWhatsApp;
      menuWa.href = "https://wa.me/" + CONTACT.whatsapp + "?text=" + encodeURIComponent(activeCopy.waText);
      menuMail.querySelector("span").textContent = activeCopy.contactEmail;
      menuMail.href = "mailto:" + CONTACT.email + "?subject=" + encodeURIComponent(activeCopy.mailSubject);
      gateTitleEl.textContent = activeCopy.gateTitle;
      gateCopyEl.textContent = activeCopy.gateCopy;
      gateNameEl.setAttribute("placeholder", activeCopy.gateName);
      gatePhoneEl.setAttribute("placeholder", activeCopy.gatePhone);
      gateSubmitEl.textContent = activeCopy.gateSubmit;
      gateErrorEl.textContent = activeCopy.gateError;
      nudgeText.querySelector("strong").textContent = activeCopy.nudgeTitle;
      nudgeText.querySelector("span").textContent = activeCopy.nudgeText;
      nudgeClose.setAttribute("aria-label", activeCopy.nudgeClose);
      root.querySelector(".rexity-chatbot__intro-title").textContent = activeCopy.introTitle;
      root.querySelector(".rexity-chatbot__intro-copy").textContent = activeCopy.introCopy;
      root.querySelector(".rexity-chatbot__footnote").textContent = activeCopy.footnote;
      linkifyEmail(root.querySelector(".rexity-chatbot__footnote"));
      quick.innerHTML = "";
      activeCopy.quickQuestions.forEach(function (question) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "rexity-chatbot__chip";
        chip.textContent = question;
        chip.addEventListener("click", function () {
          input.value = question;
          form.dispatchEvent(new Event("submit", { cancelable: true }));
        });
        quick.appendChild(chip);
      });
      updateQuickCue();
    }

    activeCopy.quickQuestions.forEach(function (question) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "rexity-chatbot__chip";
      chip.textContent = question;
      chip.addEventListener("click", function () {
        input.value = question;
        form.dispatchEvent(new Event("submit", { cancelable: true }));
      });
      quick.appendChild(chip);
    });

    renderChatLanguage(lang);
    // Sprint 15-C: continue the conversation of this tab (sessionStorage) after a chat link
    var restored = readLog();
    if (restored.length) restored.forEach(function (m) { addMessage(messages, m.x, m.t); });
    else addMessage(messages, greetingText(lang), "bot");
    window.addEventListener("rexity:languagechange", function (event) {
      renderChatLanguage(event.detail && event.detail.lang);
    });

    function markIntroSeen() {
      try { window.sessionStorage.setItem(INTRO_SEEN_KEY, "true"); } catch (e) {}
    }
    function introSeen() {
      try { return window.sessionStorage.getItem(INTRO_SEEN_KEY) === "true"; } catch (e) { return true; }
    }

    // Suggestions scroll sideways: a fade on the right edge shows there is more (B-30).
    function updateQuickCue() {
      quick.classList.toggle("is-end", quick.scrollLeft + quick.clientWidth >= quick.scrollWidth - 4);
    }
    quick.addEventListener("scroll", updateQuickCue, { passive: true });

    function hideNudge() {
      nudge.setAttribute("hidden", "");
    }
    function openChat() {
      markIntroSeen();
      hideMenu();
      hideNudge();
      applyGateState();
      root.classList.add("is-open");
      updateQuickCue();
      window.setTimeout(function () {
        updateQuickCue();
        (getLead() ? input : gateNameEl).focus();
      }, 180);
    }
    function closeChat() {
      markIntroSeen();
      root.classList.remove("is-open");
      pill.focus();
    }

    pill.addEventListener("click", function () {
      hideNudge();
      if (menu.hasAttribute("hidden")) menu.removeAttribute("hidden");
      else hideMenu();
    });

    menuChatBtn.addEventListener("click", openChat);
    nudgeText.addEventListener("click", openChat);
    nudgeClose.addEventListener("click", function () {
      markIntroSeen();
      hideNudge();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" && event.key !== "Esc") return;
      if (root.classList.contains("is-open")) closeChat();
      else { hideMenu(); hideNudge(); }
    });

    menuWa.addEventListener("click", hideMenu);
    menuMail.addEventListener("click", hideMenu);

    document.addEventListener("click", function (event) {
      if (!root.contains(event.target)) hideMenu();
    });

    gate.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = gateNameEl.value.trim();
      var digits = gatePhoneEl.value.replace(/\D/g, "");
      if (name.length < 2 || digits.length < 7 || digits.length > 15) {
        gateErrorEl.hidden = false;
        return;
      }
      gateErrorEl.hidden = true;
      saveLead({ name: name, phone: gatePhoneEl.value.trim(), ts: new Date().getTime() });
      // Persist the lead server-side (Supabase Lead table) so chat access is
      // attributable; fire-and-forget, chat opens regardless.
      try {
        fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name,
            phone: gatePhoneEl.value.trim(),
            service: "Chatbot",
            message: "Chatbot-Freischaltung über das Kontakt-Widget"
          })
        }).catch(function () {});
      } catch (e) {}
      applyGateState();
      input.focus();
    });

    applyGateState();

    close.addEventListener("click", closeChat);

    // A chat link to another page reopens the chat there (desktop and tablet only: on a
    // phone the panel would cover the page the visitor asked for). A link to an anchor
    // on this page closes the panel so the target is visible.
    messages.addEventListener("click", function (event) {
      var a = event.target && event.target.closest && event.target.closest("a[data-rexity-chat-nav]");
      if (!a) return;
      var url;
      try { url = new URL(a.getAttribute("href"), window.location.href); } catch (e) { return; }
      var here = window.location.pathname.replace(/\/+$/, "") || "/";
      var there = url.pathname.replace(/\/+$/, "") || "/";
      if (there === here) { closeChat(); return; }
      try { window.sessionStorage.setItem(REOPEN_KEY, "1"); } catch (e) {}
    });
    try {
      if (window.sessionStorage.getItem(REOPEN_KEY) === "1") {
        window.sessionStorage.removeItem(REOPEN_KEY);
        if ((window.innerWidth || 0) >= 768 && getLead()) openChat();
      }
    } catch (e) {}

    // Launch behaviour (Sprint 12): never open the panel by itself. After ~12 s a
    // small greeting bubble appears next to the launcher, once per browser session,
    // not on phones (< 768 px), not while the menu, the booking modal or the
    // contact cluster is open. The width is checked when the timer fires.
    if (!introSeen()) {
      window.setTimeout(function () {
        var html = document.documentElement;
        var busy = html.classList.contains("rx-menu-open") || html.classList.contains("rx-modal-open") || !menu.hasAttribute("hidden");
        if (introSeen() || root.classList.contains("is-open") || busy || (window.innerWidth || 0) < 768) return;
        markIntroSeen();
        nudge.removeAttribute("hidden");
      }, 12000);
    }

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        send.click();
      }
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!getLead()) { applyGateState(); return; }
      var message = input.value.trim();
      if (!message) return;
      input.value = "";
      send.disabled = true;
      // Capture the prior conversation BEFORE adding the new turn, so the
      // model gets context. (greeting + alternating user/bot bubbles)
      var history = [];
      messages.querySelectorAll(".rexity-chatbot__message").forEach(function (el) {
        if (el.classList.contains("rexity-chatbot__message--loading")) return;
        history.push({
          role: el.classList.contains("rexity-chatbot__message--user") ? "user" : "assistant",
          // the raw answer, links included, so the model sees what it linked before
          content: (el.getAttribute("data-raw") || el.textContent || "").slice(0, 1500)
        });
      });
      var curLang = (window.rexityGetLang && window.rexityGetLang()) || lang;
      addMessage(messages, message, "user");
      // Show an animated "thinking" indicator (bouncing dots), and keep it
      // visible for a minimum beat so even an instant API reply reads as a
      // considered response rather than a flash.
      var loading = addThinking(messages);
      var minWait = new Promise(function (resolve) { window.setTimeout(resolve, 850); });
      var answer;
      try {
        answer = await askApi(message, curLang, history.slice(-16));
      } catch (_error) {
        answer = localReply(message);
      }
      await minWait;
      setBotAnswer(loading, answer);
      send.disabled = false;
      input.focus();
    });
  }

  function withStyles(done) {
    var ready = false;
    function go() { if (!ready) { ready = true; done(); } }
    if (document.querySelector('link[href*="rexity-chatbot.css"]') || !SELF) return go();
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = SELF.replace(/rexity-chatbot\.js/, "rexity-chatbot.css");
    link.onload = go;
    link.onerror = go;
    document.head.appendChild(link);
    window.setTimeout(go, 4000);
  }

  function loaderIsComplete() {
    var intro = document.querySelector(".intro");
    return !intro || intro.classList.contains("rexity-loader-complete") || getComputedStyle(intro).display === "none";
  }

  function waitForMainPage() {
    if (loaderIsComplete()) {
      init();
      return;
    }

    var intro = document.querySelector(".intro");
    var observer = intro && new MutationObserver(function () {
      if (loaderIsComplete()) {
        observer.disconnect();
        init();
      }
    });

    if (observer && intro) {
      observer.observe(intro, { attributes: true, attributeFilter: ["class", "style"] });
    }

    window.setTimeout(function () {
      if (observer) observer.disconnect();
      init();
    }, 3600);
  }

  function start() { withStyles(waitForMainPage); }
  // Sprint 14-G: where the template boots after the first paint and asks for it (<script id="rx-boot"
  // data-rx-chat="after">, /preise), the chat starts once the template has booted, as it did when the
  // template scripts were parser-blocking; its stylesheet then stays out of the first paint.
  function begin() {
    var boot = document.getElementById("rx-boot");
    if (boot && boot.getAttribute("data-rx-chat") === "after" && !window.RxBooted) {
      document.addEventListener("rx:booted", start, { once: true });
      return;
    }
    start();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", begin);
  } else {
    begin();
  }
})();
