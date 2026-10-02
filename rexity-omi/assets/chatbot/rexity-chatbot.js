(function () {
  // Sprint 12: the widget loads its own stylesheet (same folder, same ?v=) so the
  // CSS no longer blocks the first paint of every page; the panel is built once
  // it has arrived. No auto-open: a small greeting bubble instead (desktop/tablet,
  // once per session). Hidden while the site menu or the booking modal is open (CSS).
  //
  // Sprint 25 (docs/seo/AI_OFFERS_PLAN.md §6.1): no name-and-phone gate any more, the
  // visitor writes at once; contact details are asked only when /api/chat answers with
  // handover: true (a small form in the conversation that posts to /api/lead as the old
  // gate did). AI notice (EU AI Act Art. 50, docs/seo/AI_CLAIMS.md §5) in the header and
  // as the first message; three starter questions; focus stays in the open panel.
  var SELF = document.currentScript && document.currentScript.src;
  var STORAGE_KEY = "rexity_lang";
  var INTRO_SEEN_KEY = "rexity_intro_seen";
  var LEAD_KEY = "rexity_chat_lead";
  var HANDOVER_KEY = "rexity_chat_handover"; // sessionStorage: "shown" | "sent"
  var TEST_KEY = "rexity_chat_test"; // localStorage: "1" = tester override (?chat=1)

  // ---- THE SWITCH -----------------------------------------------------------
  // Sprint 35 (founder, 2 Oct 2026: "remove WhatsApp and email from the Contact button"): the floating
  // button is the chat launcher and nothing else. It opens the chat panel directly; there is no contact
  // menu any more (WhatsApp and e-mail stay in the footer and the contact section of the page).
  // With CHAT_ENABLED = false the widget is not built at all (no floating button), unless a tester
  // opened a page with ?chat=1. To change the switch: edit the next line, bump CHATBOT_VERSION in
  // scripts/lib/shell.mjs, then npm run build (docs/CHATBOT.md).
  // Founder, 2 Oct 2026: "go, switch the chat on" (eval 78/80 on production, docs/logs/sprint-25.md).
  var CHAT_ENABLED = true;
  // Tester override (Sprint 25): opening any page with ?chat=1 enables the chat in this
  // browser (localStorage) while the switch is off; ?chat=0 clears it.
  function chatOverride() {
    try {
      var m = /[?&]chat=([01])(?:&|#|$)/.exec(window.location.search || "");
      if (m && m[1] === "1") window.localStorage.setItem(TEST_KEY, "1");
      if (m && m[1] === "0") window.localStorage.removeItem(TEST_KEY);
      return window.localStorage.getItem(TEST_KEY) === "1";
    } catch (e) {
      return /[?&]chat=1(?:&|#|$)/.test(window.location.search || "");
    }
  }
  var CHAT_ON = CHAT_ENABLED || chatOverride();

  // ---- "Open the chat" hook (Sprint 26, /automation/chatbots live demo) ----------
  // Any element with data-rexity-open-chat opens the chat panel on click — but only when
  // the chat is available (CHAT_ENABLED, or the ?chat=1 tester override) and the panel has
  // been built. Otherwise the click is left alone, so the element keeps its own behaviour:
  // the demo button is a link to /#kontakt with data-rx-open="booking" (booking modal;
  // without JavaScript the contact section). The listener sits on window in the capture
  // phase, so it runs before the booking handler of rexity.js (document, capture) and stops
  // it when the chat opens. When the chat is available, <html> gets .rexity-chat-ready, so a
  // page can hide text that only applies while the chat is off (services.css .sv-demo__off).
  var openChatHook = null;
  window.addEventListener("click", function (event) {
    var el = event.target && event.target.closest && event.target.closest("[data-rexity-open-chat]");
    if (!el || !openChatHook) return;
    event.preventDefault();
    event.stopPropagation();
    openChatHook();
  }, true);

  // The visitor's name after the hand-over form (the phone number / e-mail is never kept
  // here and never sent to /api/chat).
  // Sprint 35 (privacy audit): the stored contact (name / e-mail address / marketing opt-out) lives 30 days like
  // the chat history; an older entry, or one without a date, is removed when it is read. "Verlauf löschen" removes
  // it together with the history (clearContact), so the visitor sees the entry form again.
  var LEAD_TTL = 30 * 24 * 3600 * 1000;
  function readContact() {
    try {
      var l = JSON.parse(window.localStorage.getItem(LEAD_KEY) || "null");
      if (!l) return null;
      if (typeof l.ts !== "number" || new Date().getTime() - l.ts >= LEAD_TTL) { window.localStorage.removeItem(LEAD_KEY); return null; }
      return l;
    } catch (e) { return null; }
  }
  function clearContact() {
    try { window.localStorage.removeItem(LEAD_KEY); } catch (e) {}
  }
  function getLead() {
    var l = readContact();
    return l && typeof l.name === "string" ? { name: l.name } : null;
  }
  function saveLead(name, email, noMarketing) {
    try { window.localStorage.setItem(LEAD_KEY, JSON.stringify({ name: name, email: email || undefined, noMarketing: !!noMarketing, ts: new Date().getTime() })); } catch (e) {}
  }
  // The e-mail address from the entry form (founder, 2 Oct 2026): kept in this browser so the chat history can
  // be sent to Rexity Labs with it (/api/lead, kind "chat-transcript"). It is never sent to /api/chat.
  function getContact() {
    var l = readContact();
    return l && typeof l.email === "string" && l.email ? { email: l.email, noMarketing: !!l.noMarketing } : null;
  }
  // The e-mail address is optional (founder, 2 Oct 2026): the chat counts as started once the entry form was
  // passed, with or without an address.
  function chatStarted() { return !!readContact(); }
  // Cloudflare Turnstile (bot protection of the entry form and the hand-over form). Empty = off. The PUBLIC site key
  // is here, TURNSTILE_SECRET_KEY is in Vercel. Sprint 31: the script from challenges.cloudflare.com loads only when
  // the chat panel is open and shows one of the two forms (before, it loaded with every page for a new visitor).
  var TURNSTILE_SITE_KEY = "0x4AAAAAAFMB5KSMA-E1D8vB"; // public site key (Cloudflare account info@rexity.ai, widget "rexity.ai Website-Check und Chat")
  // Never on localhost / 127.0.0.1: the widget's host name is rexity.ai, so it cannot pass there. A local run sends
  // no token and works when the server has no TURNSTILE_SECRET_KEY.
  var BOT_OFF = !TURNSTILE_SITE_KEY || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  // One widget in `box` (explicit rendering). -> { token, reset(), remove() }. The script is loaded on first use,
  // once per page (the Website-Check and the contact form load the same file). A token is single-use and lives five
  // minutes: Turnstile renews an expired one by itself; after a submit that used it, call reset().
  function botWidget(box, language) {
    var w = { id: null, token: "", dead: false };
    function render() {
      if (w.dead || w.id !== null || !window.turnstile) return;
      box.setAttribute("data-on", "1");
      // always visible (founder, 2 Oct 2026). "flexible" = as wide as the form (at least 300 px), 65 px high; where
      // the form is narrower than 300 px (phones under about 360 px) the compact widget (150 x 140 px) is used.
      var compact = box.clientWidth > 0 && box.clientWidth < 300;
      box.classList.toggle("rexity-chatbot__gate-bot--compact", compact);
      try {
        w.id = window.turnstile.render(box, {
          sitekey: TURNSTILE_SITE_KEY, language: language, theme: "light",
          appearance: "always", size: compact ? "compact" : "flexible",
          callback: function (tk) { w.token = tk; },
          "expired-callback": function () { w.token = ""; },
          "timeout-callback": function () { w.token = ""; },
          "error-callback": function () { w.token = ""; return true; } // the widget shows its own error and retries
        });
      } catch (e) { w.id = null; }
    }
    w.reset = function () {
      w.token = "";
      try { if (w.id !== null && window.turnstile) window.turnstile.reset(w.id); } catch (e) {}
    };
    w.remove = function () {
      w.dead = true;
      w.token = "";
      try { if (w.id !== null && window.turnstile) window.turnstile.remove(w.id); } catch (e) {}
      w.id = null;
    };
    if (window.turnstile) render();
    else {
      var tries = 0;
      var poll = window.setInterval(function () {
        if (window.turnstile || w.dead || ++tries > 100) { window.clearInterval(poll); render(); }
      }, 150);
      if (!document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile/"]')) {
        var ts = document.createElement("script");
        ts.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        ts.async = true;
        ts.onerror = function () { window.clearInterval(poll); ts.remove(); };
        document.head.appendChild(ts);
      }
    }
    return w;
  }
  function handoverState() {
    try { return window.sessionStorage.getItem(HANDOVER_KEY) || ""; } catch (e) { return ""; }
  }
  function setHandoverState(v) {
    try { window.sessionStorage.setItem(HANDOVER_KEY, v); } catch (e) {}
  }

  var copy = {
    en: {
      // Sprint 25: three starter questions from what the site offers (/preise, /web/website-umzug, /automation/chatbots)
      quickQuestions: [
        "What does a website with online booking cost?",
        "How does a website move work?",
        "What does an AI chatbot cost?"
      ],
      rootLabel: "Rexity chat assistant",
      openLabel: "Chat: Questions about your project",
      closeLabel: "Minimise chat",
      panelLabel: "Chat with the AI assistant of Rexity Labs",
      quickLabel: "Suggested questions",
      messageLabel: "Message to the AI assistant",
      sendLabel: "Send message",
      pillTitle: "Ask Rexity",
      pillSubtitle: "Your virtual assistant",
      // AI notice: docs/seo/AI_CLAIMS.md §5
      noticeTitle: "AI assistant",
      noticeText: "",
      privacy: "Privacy",
      firstMessage: "Hello! Ask me about websites, apps, automation, prices or how a project works.",
      placeholder: "Your question …",
      footnote: "Answers can contain mistakes; only our written quote is binding.",
      resetLabel: "Clear history",
      // Entry form before the first message (founder, 2 Oct 2026); the notice follows docs/seo/AI_CLAIMS.md §5
      gateTitle: "Before we start",
      gateDisclaimer: "You are about to interact with our intelligent chatbot, powered by a modern AI engine. So you are chatting with an AI, not a person (notice under Art. 50 of the EU AI Act).",
      gateEmail: "E-mail address (optional)",
      gateNoMarketing: "I do not want to be contacted for marketing purposes in future.",
      gateSubmit: "Start chat",
      gatePrivacy: "The e-mail address is optional. We receive the chat history to handle your enquiry, together with your address if you give one. Your e-mail address is not sent to the AI.",
      gateError: "Please enter a valid e-mail address.",
      gateBot: "Please confirm the security check.",
      gatePlaceholder: "Please start the chat first",
      thinking: "Rexity is writing …",
      contactTitle: "Chat",
      contactSubtitle: "Questions about your project",
      formTitle: "Shall we get in touch?",
      formCopy: "Leave your name and a phone number or e-mail address; we usually reply within a day.",
      formName: "Your name",
      formContact: "Phone or e-mail",
      formNote: "Note (optional)",
      formSubmit: "Send",
      formCancel: "No thanks",
      formPrivacy: "We use your details only to contact you.",
      formError: "Please enter your name and a valid phone number or e-mail address.",
      formFail: "That did not work. Please write to info@rexity.ai or call +49 174 2471435.",
      formThanks: "Thank you, {name}. We will get back to you, usually within a day.",
      limitPlaceholder: "Conversation limit reached",
      nudgeTitle: "Questions about your project?",
      nudgeText: "Our assistant answers right away.",
      nudgeClose: "Dismiss"
    },
    de: {
      quickQuestions: [
        "Was kostet eine Website mit Online-Buchung?",
        "Wie läuft ein Website-Umzug ab?",
        "Was kostet ein KI-Chatbot?"
      ],
      rootLabel: "Rexity Chat-Assistent",
      openLabel: "Chat: Fragen zu Ihrem Projekt",
      closeLabel: "Chat minimieren",
      panelLabel: "Chat mit dem KI-Assistenten von Rexity Labs",
      quickLabel: "Vorgeschlagene Fragen",
      messageLabel: "Nachricht an den KI-Assistenten",
      sendLabel: "Nachricht senden",
      pillTitle: "Rexity fragen",
      pillSubtitle: "Ihr virtueller Assistent",
      noticeTitle: "KI-Assistent",
      noticeText: "",
      privacy: "Datenschutz",
      firstMessage: "Hallo! Fragen Sie mich zu Websites, Apps, Automatisierung, Preisen oder zum Ablauf.",
      placeholder: "Ihre Frage …",
      footnote: "Antworten können Fehler enthalten; verbindlich ist nur unser schriftliches Angebot.",
      resetLabel: "Verlauf löschen",
      gateTitle: "Bevor wir starten",
      gateDisclaimer: "Sie chatten gleich mit unserem intelligenten Chatbot, betrieben mit moderner KI-Technologie. Sie schreiben also mit einer KI, nicht mit einem Menschen (Hinweis nach Art. 50 der EU-KI-Verordnung).",
      gateEmail: "E-Mail-Adresse (optional)",
      gateNoMarketing: "Ich möchte künftig nicht zu Marketingzwecken kontaktiert werden.",
      gateSubmit: "Chat starten",
      gatePrivacy: "Die E-Mail-Adresse ist freiwillig. Wir erhalten den Chat-Verlauf, um Ihre Anfrage zu bearbeiten, und Ihre Adresse nur, wenn Sie eine angeben. Die E-Mail-Adresse wird nicht an die KI gesendet.",
      gateError: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      gateBot: "Bitte bestätigen Sie die Sicherheitsprüfung.",
      gatePlaceholder: "Bitte zuerst den Chat starten",
      thinking: "Rexity schreibt …",
      contactTitle: "Chat",
      contactSubtitle: "Fragen zu Ihrem Projekt",
      formTitle: "Sollen wir uns melden?",
      formCopy: "Hinterlassen Sie Ihren Namen und eine Telefonnummer oder E-Mail-Adresse; wir melden uns in der Regel innerhalb eines Tages.",
      formName: "Ihr Name",
      formContact: "Telefon oder E-Mail",
      formNote: "Notiz (optional)",
      formSubmit: "Senden",
      formCancel: "Nein, danke",
      formPrivacy: "Ihre Angaben nutzen wir nur, um Sie zu kontaktieren.",
      formError: "Bitte geben Sie Ihren Namen und eine gültige Telefonnummer oder E-Mail-Adresse ein.",
      formFail: "Das hat leider nicht geklappt. Schreiben Sie uns an info@rexity.ai oder rufen Sie an: +49 174 2471435.",
      formThanks: "Danke, {name}. Wir melden uns, in der Regel innerhalb eines Tages.",
      limitPlaceholder: "Gesprächsgrenze erreicht",
      nudgeTitle: "Fragen zu Ihrem Projekt?",
      nudgeText: "Unser Assistent antwortet sofort.",
      nudgeClose: "Hinweis schließen"
    }
  };

  // Offline answers: used only when /api/chat cannot be reached (network down, local static preview). Facts and
  // links as on the site (data/site-knowledge.json); no prices beyond a link to /preise. Keys are matched as
  // word stems; the most specific entry (most matching keys) wins, the overview only when nothing matches.
  var fallbackKnowledge = [
    { keys: ["saas", "plattform", "platform", "abo", "subscription", "multi-tenant", "mandant"],
      de: "Ja, wir entwickeln Web-Apps und SaaS-Plattformen mit Login, Abrechnung und Dashboards. Mehr dazu: [Web-Apps, SaaS & Dashboards](/web/saas).",
      en: "Yes, we build web apps and SaaS platforms with login, billing and dashboards. More: [Web apps, SaaS & dashboards](/web/saas)." },
    { keys: ["app", "ios", "android", "iphone", "mobile", "smartphone"],
      de: "Ja, wir entwickeln Apps für iPhone und Android aus einer gemeinsamen Codebasis. Mehr dazu: [Mobile Apps](/web/mobile-apps).",
      en: "Yes, we build apps for iPhone and Android from one codebase. More: [Mobile apps](/web/mobile-apps)." },
    { keys: ["dashboard", "reporting", "kpi", "kennzahl", "auswertung"],
      de: "Dashboards bauen wir als Teil von Web-Apps und SaaS. Mehr dazu: [Web-Apps, SaaS & Dashboards](/web/saas).",
      en: "We build dashboards as part of web apps and SaaS. More: [Web apps, SaaS & dashboards](/web/saas)." },
    { keys: ["umzug", "relaunch", "migration", "domain", "move"],
      de: "Wir ziehen Website, Domain und E-Mail um oder überführen die alte Seite in eine neue, ohne Ausfall. Mehr dazu: [Website-Relaunch & Umzug](/web/website-umzug).",
      en: "We move your website, domain and e-mail or turn the old site into a new one, without downtime. More: [Website relaunch & move](/web/website-umzug)." },
    { keys: ["handwerk", "tischler", "elektriker", "maler", "baustelle"],
      de: "Für Handwerksbetriebe bauen wir Websites mit einer Seite pro Leistung und einem Anfrageformular. Mehr dazu: [Website für Handwerker](/website-f%C3%BCr-handwerker).",
      en: "For trade businesses we build websites with one page per service and an enquiry form. More: [Website for tradespeople](/website-f%C3%BCr-handwerker)." },
    { keys: ["website", "webseite", "homepage", "webdesign", "web design", "landing", "online-shop", "internetseite"],
      de: "Wir gestalten und programmieren Websites von Hand, auf Wunsch mit Online-Buchung. Mehr dazu: [Webdesign](/web/web-design).",
      en: "We design and hand-code websites, with online booking if you need it. More: [Web design](/web/web-design)." },
    { keys: ["whatsapp"],
      de: "Wir richten WhatsApp-Business-Abläufe ein, die Fragen beantworten und Termine buchen, über die offizielle API mit Opt-in. Mehr dazu: [WhatsApp-Automatisierung](/automation/whatsapp).",
      en: "We set up WhatsApp Business flows that answer questions and book appointments, via the official API with opt-in. More: [WhatsApp automation](/automation/whatsapp)." },
    { keys: ["erinnerung", "reminder", "sms"],
      de: "Wir richten automatische Erinnerungen vor jedem Termin ein, per E-Mail, SMS oder WhatsApp. Mehr dazu: [Terminerinnerung](/automation/terminerinnerung).",
      en: "We set up automatic reminders before every appointment, by e-mail, SMS or WhatsApp. More: [Appointment reminders](/automation/terminerinnerung)." },
    { keys: ["buchung", "termin", "kurs", "booking", "appointment", "reservier"],
      de: "Wir bauen Websites mit Online-Termin- oder Kursbuchung. Ein Beispiel: [Fitnessstudio-Website](/fitnessstudio-website).",
      en: "We build websites with online appointment or class booking. An example: [gym website](/fitnessstudio-website)." },
    { keys: ["chatbot", "chat bot", "assistent", "assistant"],
      de: "Wir bauen Website-Chatbots, die aus Ihren freigegebenen Inhalten antworten und schwierige Fälle an einen Menschen übergeben. Mehr dazu: [Website-Chatbots](/automation/chatbots).",
      en: "We build website chatbots that answer from your approved content and hand difficult cases to a person. More: [Website chatbots](/automation/chatbots)." },
    { keys: ["voice", "telefon", "anruf", "phone", "call", "rexfangs"],
      de: "Unser Telefonassistent RexFangs ist in der Testphase und noch kein Angebot. Mehr dazu: [Voice-Agenten](/automation/voice).",
      en: "Our phone assistant RexFangs is in testing and not on offer yet. More: [Voice agents](/automation/voice)." },
    { keys: ["automat", "rpa", "workflow", "prozess", "process", "crm", " ki", "ai "],
      de: "Wir automatisieren wiederkehrende Handarbeit, etwa über Postfach, Kundenverwaltung und interne Tools. Mehr dazu: [RPA & Prozessautomatisierung](/automation/rpa).",
      en: "We automate repetitive manual work, for example across inbox, CRM and internal tools. More: [RPA & process automation](/automation/rpa)." },
    { keys: ["seo", "google", "ranking", "suchmaschine", "sichtbar", "visib"],
      de: "Wir machen SEO für Ihre Website und pflegen Ihr Google Unternehmensprofil. Mehr dazu: [SEO & Google Unternehmensprofil](/marketing/seo).",
      en: "We do SEO for your website and look after your Google Business Profile. More: [SEO & Google Business Profile](/marketing/seo)." },
    { keys: ["marketing", "social", "content", "video", "instagram", "kunden gewinn", "mehr kunden"],
      de: "Wir machen Sie bei Google sichtbar: mit SEO und einem gepflegten Google Unternehmensprofil. Mehr dazu: [SEO & Google Unternehmensprofil](/marketing/seo).",
      en: "We make you visible on Google: with SEO and a well-kept Google Business Profile. More: [SEO & Google Business Profile](/marketing/seo)." },
    { keys: ["test", "support", "wartung", "betreuung", "maintenance"],
      de: "Wir betreuen Websites nach dem Start: Sicherheitsupdates, Sicherungen, Monitoring und kleine Änderungen. Mehr dazu: [Website-Wartung & Betreuung](/website-wartung).",
      en: "We look after websites after launch: security updates, backups, monitoring and small changes. More: [Website maintenance & support](/website-wartung)." },
    { weight: 2, keys: ["preis", "kost", "price", "cost", "budget", "teuer", "euro", "€", "angebot", "quote"],
      de: "Unsere Einstiegspreise (netto zzgl. MwSt.) stehen auf der Seite [Preise](/preise); den Festpreis nennen wir nach einem kurzen Gespräch.",
      en: "Our starting prices (net plus VAT) are on the [pricing page](/preise); we give a fixed price after a short call." },
    { weight: 2, keys: ["dauer", "lange", "wochen", "zeitraum", "timeline", "how long", "weeks"],
      de: "Eine Website mit Buchung dauert typisch vier bis acht Wochen; Bauplan und Demo kommen innerhalb einer Woche nach dem Gespräch.",
      en: "A website with booking typically takes four to eight weeks; blueprint and demo follow within a week of the call." },
    { keys: ["kontakt", "contact", "erreich", "email", "e-mail", "anruf", "gespräch", "beratung", "demo", "meeting"],
      de: "Sie erreichen uns unter info@rexity.ai oder +49 174 2471435, oder Sie buchen ein Gespräch: [Termin buchen](/#kontakt).",
      en: "You can reach us at info@rexity.ai or +49 174 2471435, or book a call: [book a call](/#kontakt)." },
    { keys: ["wo ", "standort", "region", "celle", "hannover", "niedersachsen", "hermannsburg", "location", "where"],
      de: "Wir sitzen in Hermannsburg (Landkreis Celle) und arbeiten für Betriebe in Niedersachsen und remote in ganz Deutschland. Mehr dazu: [Niedersachsen](/niedersachsen).",
      en: "We are based in Hermannsburg (near Celle) and work for businesses in Lower Saxony and remotely across Germany. More: [Lower Saxony](/niedersachsen)." },
    { keys: ["projekt", "referenz", "beispiel", "portfolio", "work", "kunden", "example"],
      de: "Projekte sind z. B. [Body & Care Hermannsburg](/work/body-and-care) und Fahrzeugpflege Celle; alle Arbeiten: [Arbeiten](/work).",
      en: "Projects include [Body & Care Hermannsburg](/work/body-and-care) and Fahrzeugpflege Celle; all work: [projects](/work)." }
  ];
  var fallbackOverview = {
    de: "Rexity Labs aus Hermannsburg plant, baut und betreut Websites mit Online-Buchung, Apps und Automatisierung. Überblick: [Preise](/preise).",
    en: "Rexity Labs from Hermannsburg plans, builds and looks after websites with online booking, apps and automation. Overview: [pricing](/preise)."
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
    if (name === "down") {
      return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9.5l6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    if (name === "close") {
      return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>';
    }
    return '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8 9h10.5c3.3 0 5.5 2.1 5.5 5.1 0 2.1-1.1 3.8-2.9 4.6L25 25h-7.2l-3.1-5.2H13V25H8V9Zm5 4.4v2.7h5.2c.8 0 1.3-.6 1.3-1.4s-.5-1.3-1.3-1.3H13Z" fill="currentColor"/><path d="M7 7h12.5c4.4 0 7.5 2.9 7.5 7.1 0 2.9-1.5 5.3-4 6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  // The site language (DE / EN switch). The server replies in the visitor's own language.
  function detectLang() {
    if (window.rexityGetLang) {
      var l = window.rexityGetLang();
      if (l === "de" || l === "en") return l;
    }
    if (window.RexityLang === "de" || window.RexityLang === "en") return window.RexityLang;
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "de" || saved === "en") return saved;
    } catch (_error) {}
    return "de";
  }

  function localReply(message) {
    var lang = detectLang();
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
  // Every appearance of the contact address in bot messages becomes a link. Clicking
  // opens a tiny chooser (Gmail / Outlook / mail app) — each target gets To, Subject and
  // Body pre-filled in the chat language. Built with DOM nodes only (never innerHTML on
  // model output).
  var CONTACT_EMAIL = "info@rexity.ai";

  function mailPrefill(lang) {
    if (lang === "de") {
      return {
        subject: "Ich benötige mehr Informationen",
        body: "Hallo Rexity-Team,\n\nich interessiere mich für mehr Informationen zu Ihren Leistungen, zum Zeitrahmen und zu den Kosten.\n\nViele Grüße"
      };
    }
    return {
      subject: "I need more info on this topic",
      body: "Hello Rexity team,\n\nI am interested in more information about your services, timeline and costs.\n\nBest regards"
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
    var lang = detectLang();
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

  // ---- Bot answers (Sprint 15-C): plain text, "- " list lines, [label](target) links.
  // Built with DOM nodes only (createElement / textContent), never innerHTML on model
  // output: any "<b>" or "<script>" in an answer stays visible text. Same-site paths
  // open in the same tab; https links open in a new tab with rel="noopener";
  // mailto:info@rexity.ai opens the mail chooser; tel: stays a plain link; any other
  // scheme (javascript:, data:, …) is shown as text. /api/chat already validates every target.
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
    linkifyEmail(el);
  }

  // ---- The conversation is kept in the visitor's browser (founder, 2 Oct 2026) -------
  // localStorage, so the assistant still knows the context on the next page and on the next
  // visit. Entries older than 30 days are dropped; "Verlauf löschen" removes everything.
  // Messages of the last 3 hours are the current conversation (sent as `history`, counted
  // for the 20-message cap); older ones are sent as `memory` (context only).
  var LOG_KEY = "rexity_chat_log";
  var REOPEN_KEY = "rexity_chat_reopen";
  var LOG_TTL = 30 * 24 * 3600 * 1000;
  var CURRENT_WINDOW = 3 * 3600 * 1000;
  function readLog() {
    try {
      var raw = window.localStorage.getItem(LOG_KEY) || window.sessionStorage.getItem(LOG_KEY); // sessionStorage: versions before 2 Oct 2026
      var log = JSON.parse(raw || "[]");
      var now = new Date().getTime();
      var kept = Array.isArray(log) ? log.filter(function (m) {
        return m && (m.t === "bot" || m.t === "user") && typeof m.x === "string" && (!m.ts || now - m.ts < LOG_TTL);
      }) : [];
      // Sprint 35: expired entries are removed from the browser as well, not only left out
      if (raw && (!Array.isArray(log) || kept.length !== log.length)) {
        if (kept.length) window.localStorage.setItem(LOG_KEY, JSON.stringify(kept));
        else { window.localStorage.removeItem(LOG_KEY); window.localStorage.removeItem("rexity_chat_sent"); }
        window.sessionStorage.removeItem(LOG_KEY);
      }
      return kept;
    } catch (e) { return []; }
  }
  function writeLog(container) {
    try {
      var log = [];
      container.querySelectorAll(".rexity-chatbot__message").forEach(function (el) {
        if (el.classList.contains("rexity-chatbot__message--loading")) return;
        var entry = {
          t: el.classList.contains("rexity-chatbot__message--user") ? "user" : "bot",
          x: (el.getAttribute("data-raw") || el.textContent || "").slice(0, 2000),
          ts: Number(el.getAttribute("data-ts")) || new Date().getTime()
        };
        var cards = el.getAttribute("data-cards");
        if (cards) { try { entry.c = JSON.parse(cards); } catch (e) {} }
        log.push(entry);
      });
      window.localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-60)));
    } catch (e) {}
  }
  function clearLog() {
    try { window.localStorage.removeItem(LOG_KEY); } catch (e) {}
    try { window.sessionStorage.removeItem(LOG_KEY); window.sessionStorage.removeItem(HANDOVER_KEY); } catch (e) {}
  }

  // ---- Link cards: a small preview (picture, title, one line, address) for every site
  // page linked in an answer. Data comes from /api/chat (`cards`); everything is set as text.
  function cleanCards(cards) {
    if (!Array.isArray(cards)) return [];
    return cards.slice(0, 2).map(function (c) {
      if (!c || typeof c.url !== "string" || typeof c.title !== "string") return null;
      var target = linkTarget(c.url);
      if (!target || target.kind !== "site") return null;
      return {
        url: target.href,
        title: c.title.slice(0, 120),
        description: typeof c.description === "string" ? c.description.slice(0, 220) : "",
        image: typeof c.image === "string" && /^\/assets\/[\w.\/%-]+\.(?:jpe?g|png|webp)$/i.test(c.image) ? c.image : null
      };
    }).filter(Boolean);
  }
  function renderCards(el, cards) {
    var list = cleanCards(cards);
    if (!list.length) { el.removeAttribute("data-cards"); return; }
    el.setAttribute("data-cards", JSON.stringify(list));
    // The text keeps its bubble; the link boxes follow as their own grey "link message" below it.
    var text = document.createElement("div");
    text.className = "rexity-chatbot__text";
    while (el.firstChild) text.appendChild(el.firstChild);
    el.appendChild(text);
    el.classList.add("rexity-chatbot__message--links");
    var wrap = document.createElement("div");
    wrap.className = "rexity-chatbot__cards";
    list.forEach(function (c) {
      var a = document.createElement("a");
      a.className = "rexity-chatbot__card";
      a.href = c.url;
      a.setAttribute("data-rexity-chat-nav", "");
      var pic = document.createElement("span");
      pic.className = "rexity-chatbot__card-pic";
      var img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.width = 120;
      img.height = 63;
      img.src = c.image || "/assets/brand/final/rexity-mark-white.svg";
      if (!c.image) pic.className += " rexity-chatbot__card-pic--mark";
      pic.appendChild(img);
      var body = document.createElement("span");
      body.className = "rexity-chatbot__card-body";
      var title = document.createElement("strong");
      title.className = "rexity-chatbot__card-title";
      title.textContent = c.title;
      var desc = document.createElement("span");
      desc.className = "rexity-chatbot__card-desc";
      desc.textContent = c.description;
      var host = document.createElement("span");
      host.className = "rexity-chatbot__card-host";
      var shown = c.url;
      try { shown = decodeURIComponent(c.url); } catch (e) {}
      host.textContent = "rexity.ai" + (shown === "/" ? "" : shown);
      body.appendChild(title);
      if (c.description) body.appendChild(desc);
      body.appendChild(host);
      a.appendChild(pic);
      a.appendChild(body);
      wrap.appendChild(a);
    });
    el.appendChild(wrap);
  }

  // A "thinking" bubble: three bouncing dots (animated), shown while the
  // model works. Static markup only — never model output.
  function addThinking(container, label) {
    var item = document.createElement("div");
    item.className = "rexity-chatbot__message rexity-chatbot__message--bot rexity-chatbot__message--loading";
    item.setAttribute("role", "status");
    var dots = document.createElement("span");
    dots.className = "rexity-chatbot__dots";
    dots.setAttribute("aria-hidden", "true");
    dots.innerHTML = "<span></span><span></span><span></span>";
    var sr = document.createElement("span");
    sr.className = "rexity-chatbot__sr";
    sr.textContent = label || "…";
    item.appendChild(dots);
    item.appendChild(sr);
    container.appendChild(item);
    container.scrollTop = container.scrollHeight;
    return item;
  }

  // Replace a thinking bubble with the final answer + clickable links.
  function setBotAnswer(el, text, cards) {
    el.classList.remove("rexity-chatbot__message--loading");
    el.removeAttribute("role");
    el.setAttribute("data-raw", String(text || ""));
    el.setAttribute("data-ts", String(new Date().getTime()));
    renderBotText(el, text);
    renderCards(el, cards);
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

  function addMessage(container, text, type, meta) {
    var item = document.createElement("div");
    item.className = "rexity-chatbot__message rexity-chatbot__message--" + type;
    item.setAttribute("data-raw", String(text || ""));
    item.setAttribute("data-ts", String((meta && meta.ts) || new Date().getTime()));
    if (type.indexOf("bot") > -1) { renderBotText(item, text); renderCards(item, meta && meta.cards); }
    else item.textContent = text;
    container.appendChild(item);
    container.scrollTop = container.scrollHeight;
    writeLog(container);
    return item;
  }

  // Every turn goes to /api/chat (the server counts the visitor messages for the
  // 20-message cap); the last 16 in full, earlier ones shortened. Never a phone number
  // or e-mail address of the visitor: only the name after the hand-over form.
  async function askApi(message, lang, history, memory) {
    var full = history.length - 16;
    var sent = history.map(function (m, i) { return i < full ? { role: m.role, content: m.content.slice(0, 80) } : m; });
    var response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message, lang: lang, history: sent,
        memory: memory && memory.length ? memory.slice(-8).map(function (m) { return { role: m.role, content: m.content.slice(0, 400) }; }) : undefined,
        lead: getLead() || undefined
      })
    });
    if (!response.ok) throw new Error("Chat request failed");
    var data = await response.json();
    if (!data || typeof data.answer !== "string") throw new Error("Chat answer missing");
    return data;
  }

  function init() {
    if (document.querySelector(".rexity-chatbot")) return;
    var lang = detectLang();
    var activeCopy = copy[lang] || copy.en;

    var root = document.createElement("section");
    root.className = "rexity-chatbot";
    root.setAttribute("aria-label", activeCopy.rootLabel);
    var html = [
      '<div class="rexity-chatbot__nudge" role="status" hidden>',
        '<button class="rexity-chatbot__nudge-text" type="button"><strong></strong><span></span></button>',
        '<button class="rexity-chatbot__close rexity-chatbot__nudge-close" type="button">' + svgIcon("close") + '</button>',
      '</div>',
      // the launcher: opens the chat panel directly (Sprint 35: no contact menu)
      '<button class="rexity-chatbot__pill" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="rexity-chatbot-panel">',
        '<span class="rexity-chatbot__mark rexity-chatbot__mark--nav"><img src="/assets/brand/final/rexity-mark-white.svg" alt="" width="22" height="22"></span>',
        '<span class="rexity-chatbot__pill-text">',
          '<span class="rexity-chatbot__pill-title"></span>',
          '<span class="rexity-chatbot__pill-subtitle"></span>',
        '</span>',
      '</button>',
        '<div class="rexity-chatbot__panel" id="rexity-chatbot-panel" role="dialog" aria-modal="false">',
          '<div class="rexity-chatbot__hero">',
            '<div class="rexity-chatbot__top">',
              // loading="lazy": the logo is fetched only when the panel is shown (no request while closed)
              '<div class="rexity-chatbot__brand"><img src="/rexity-omi/assets/chatbot/rexity-labs-logo-white.webp" alt="Rexity Labs" width="153" height="27" loading="lazy"></div>',
              '<button class="rexity-chatbot__close rexity-chatbot__panel-close" type="button">' + svgIcon("down") + '</button>',
            '</div>',
            '<div class="rexity-chatbot__intro">',
              '<h2 class="rexity-chatbot__intro-title"></h2>',
              '<p class="rexity-chatbot__intro-copy"><span class="rexity-chatbot__notice"></span> <a class="rexity-chatbot__privacy" href="/datenschutz"></a></p>',
            '</div>',
          '</div>',
          '<div class="rexity-chatbot__messages" aria-live="polite" aria-relevant="additions"></div>',
          '<div class="rexity-chatbot__quick" role="group"></div>',
          '<form class="rexity-chatbot__form">',
            '<input class="rexity-chatbot__input" type="text" maxlength="1000" autocomplete="off" enterkeyhint="send">',
            '<button class="rexity-chatbot__send" type="submit">' + svgIcon("send") + '</button>',
          '</form>',
          '<div class="rexity-chatbot__foot"><span class="rexity-chatbot__footnote"></span> <button class="rexity-chatbot__reset" type="button"></button></div>',
        '</div>'
    ];
    root.innerHTML = html.join("");
    document.body.appendChild(root);

    var pill = root.querySelector(".rexity-chatbot__pill");
    var panel = root.querySelector(".rexity-chatbot__panel");
    var close = root.querySelector(".rexity-chatbot__panel-close");
    var quick = root.querySelector(".rexity-chatbot__quick");
    var messages = root.querySelector(".rexity-chatbot__messages");
    var form = root.querySelector(".rexity-chatbot__form");
    var input = root.querySelector(".rexity-chatbot__input");
    var send = root.querySelector(".rexity-chatbot__send");
    var nudge = root.querySelector(".rexity-chatbot__nudge");
    var nudgeText = root.querySelector(".rexity-chatbot__nudge-text");
    var nudgeClose = root.querySelector(".rexity-chatbot__nudge-close");
    var resetBtn = root.querySelector(".rexity-chatbot__reset");
    var limitReached = false;
    var gateOpen = false; // entry form shown: no message can be sent yet
    var gateBot = null; // the entry form's Turnstile widget (botWidget), once the panel was opened
    var gateBotMount = null;

    function renderChips() {
      if (!quick) return;
      quick.innerHTML = "";
      quick.setAttribute("aria-label", activeCopy.quickLabel);
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
      // starter questions only until the visitor has written something
      quick.hidden = gateOpen || !!messages.querySelector(".rexity-chatbot__message--user");
    }

    function renderChatLanguage(nextLang) {
      lang = nextLang === "de" ? "de" : "en";
      activeCopy = copy[lang] || copy.en;
      root.setAttribute("aria-label", activeCopy.rootLabel);
      pill.setAttribute("aria-label", activeCopy.openLabel);
      root.querySelector(".rexity-chatbot__pill-title").textContent = activeCopy.contactTitle;
      root.querySelector(".rexity-chatbot__pill-subtitle").textContent = activeCopy.contactSubtitle;
      panel.setAttribute("aria-label", activeCopy.panelLabel);
      close.setAttribute("aria-label", activeCopy.closeLabel);
      input.setAttribute("placeholder", gateOpen ? activeCopy.gatePlaceholder : limitReached ? activeCopy.limitPlaceholder : activeCopy.placeholder);
      input.setAttribute("aria-label", activeCopy.messageLabel);
      send.setAttribute("aria-label", activeCopy.sendLabel);
      nudgeText.querySelector("strong").textContent = activeCopy.nudgeTitle;
      nudgeText.querySelector("span").textContent = activeCopy.nudgeText;
      nudgeClose.setAttribute("aria-label", activeCopy.nudgeClose);
      root.querySelector(".rexity-chatbot__intro-title").textContent = activeCopy.noticeTitle;
      root.querySelector(".rexity-chatbot__notice").textContent = activeCopy.noticeText;
      root.querySelector(".rexity-chatbot__privacy").textContent = activeCopy.privacy;
      root.querySelector(".rexity-chatbot__footnote").textContent = activeCopy.footnote;
      resetBtn.textContent = activeCopy.resetLabel;
      renderChips();
      updateQuickCue();
      if (gateOpen) showGate(); // re-render the entry form in the new language
    }

    // Suggestions scroll sideways on narrow screens: a fade on the right edge shows there is more (B-30).
    function updateQuickCue() {
      if (!quick) return;
      quick.classList.toggle("is-end", quick.scrollLeft + quick.clientWidth >= quick.scrollWidth - 4);
    }

    renderChatLanguage(lang);
    window.addEventListener("rexity:languagechange", function (event) {
      renderChatLanguage(event.detail && event.detail.lang);
    });

    // ---- scrolling stays inside the panel (Sprint 35) ------------------------------
    // Cause of "the page scrolls behind the chat": the template's smooth-scroll library (Lenis) takes every
    // wheel event on the document, cancels it and scrolls the page itself; it leaves elements with
    // data-lenis-prevent alone. On top of that, a wheel or finger movement over a part of the panel that cannot
    // scroll (header, input row, a list at its end) is handed on to the page by the browser. So: the panel opts
    // out of Lenis, and a movement that nothing inside the panel can take is cancelled. The message list also
    // has overscroll-behavior: contain (CSS), which covers a gesture that reaches the end while it is running.
    panel.setAttribute("data-lenis-prevent", "");
    function panelCanScroll(node, dx, dy) {
      var vertical = Math.abs(dy) >= Math.abs(dx);
      for (var el = node; el && el !== root; el = el.parentNode) {
        if (el.nodeType !== 1) continue;
        var st = window.getComputedStyle(el);
        if (vertical) {
          if (!/auto|scroll/.test(st.overflowY) || el.scrollHeight <= el.clientHeight + 1) continue;
          if (dy < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
        } else {
          if (!/auto|scroll/.test(st.overflowX) || el.scrollWidth <= el.clientWidth + 1) continue;
          if (dx < 0 ? el.scrollLeft > 0 : el.scrollLeft + el.clientWidth < el.scrollWidth - 1) return true;
        }
      }
      return false;
    }
    panel.addEventListener("wheel", function (event) {
      if (event.ctrlKey || !event.cancelable) return; // ctrlKey: pinch zoom on a trackpad
      if (!panelCanScroll(event.target, event.deltaX, event.deltaY)) event.preventDefault();
    }, { passive: false });
    var touchAt = null;
    panel.addEventListener("touchstart", function (event) {
      touchAt = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
    }, { passive: true });
    panel.addEventListener("touchmove", function (event) {
      if (!touchAt || event.touches.length !== 1) return; // two fingers: zoom
      var t = event.touches[0];
      var dx = touchAt.x - t.clientX;
      var dy = touchAt.y - t.clientY;
      touchAt = { x: t.clientX, y: t.clientY };
      if ((dx || dy) && event.cancelable && !panelCanScroll(event.target, dx, dy)) event.preventDefault();
    }, { passive: false });

    // ---- the chat (switch on, or ?chat=1) ---------------------------------------
    var restored = readLog();
    if (restored.length) restored.forEach(function (m) { addMessage(messages, m.x, m.t, { ts: m.ts, cards: m.c }); });
    else if (chatStarted()) addMessage(messages, activeCopy.firstMessage, "bot"); // the entry form carries the AI notice; the greeting does not repeat it
    renderChips();
    // "Verlauf löschen": removes the saved conversation, the stored contact (name / e-mail address / opt-out) and
    // the sent-counter from this browser and starts again with the entry form
    resetBtn.addEventListener("click", function () {
      clearLog();
      clearContact();
      messages.textContent = "";
      limitReached = false;
      input.disabled = false;
      send.disabled = false;
      input.setAttribute("placeholder", activeCopy.placeholder);
      try { window.localStorage.removeItem("rexity_chat_sent"); } catch (e) {}
      if (!chatStarted()) { showGate(); return; }
      addMessage(messages, activeCopy.firstMessage, "bot");
      renderChips();
      input.focus();
    });

    // ---- entry form (founder, 2 Oct 2026): e-mail address and phone number before the first
    // message, with the AI notice. Posted to /api/lead (service "Chatbot"); the browser keeps only
    // a "done" mark, never the contact details, and they are never sent to /api/chat.
    function showGate() {
      var old = messages.querySelector(".rexity-chatbot__gate");
      if (old) old.remove();
      gateOpen = true;
      var c = activeCopy;
      input.disabled = true;
      send.disabled = true;
      input.setAttribute("placeholder", c.gatePlaceholder);
      if (quick) quick.hidden = true;
      var f = document.createElement("form");
      f.className = "rexity-chatbot__handover rexity-chatbot__gate";
      f.noValidate = true;
      f.setAttribute("aria-label", c.gateTitle);
      function para(cls, text) { var el = document.createElement("p"); el.className = cls; el.textContent = text; return el; }
      function field(type, label, auto, mode, max) {
        var lab = document.createElement("label");
        lab.className = "rexity-chatbot__handover-label";
        var span = document.createElement("span");
        span.textContent = label;
        var el = document.createElement("input");
        el.type = type;
        el.className = "rexity-chatbot__field";
        el.maxLength = max;
        el.required = false; // the address is optional (founder, 2 Oct 2026)
        el.setAttribute("autocomplete", auto);
        el.setAttribute("inputmode", mode);
        lab.appendChild(span);
        lab.appendChild(el);
        return { label: lab, input: el };
      }
      var emailF = field("email", c.gateEmail, "email", "email", 200);
      // opt-out of marketing contact, unchecked by default (founder, 2 Oct 2026)
      var optLab = document.createElement("label");
      optLab.className = "rexity-chatbot__gate-check";
      var optBox = document.createElement("input");
      optBox.type = "checkbox";
      var optTxt = document.createElement("span");
      optTxt.textContent = c.gateNoMarketing;
      optLab.appendChild(optBox);
      optLab.appendChild(optTxt);
      // the opt-out only matters when an address is given
      var syncOpt = function () { var has = !!emailF.input.value.trim(); optBox.disabled = !has; optLab.hidden = !has; if (!has) optBox.checked = false; };
      emailF.input.addEventListener("input", syncOpt);
      syncOpt();
      var botBox = document.createElement("div");
      botBox.className = "rexity-chatbot__gate-bot";
      botBox.hidden = BOT_OFF; // no widget here (localhost): do not keep its reserved place
      // the bot check is mounted when the panel is open (openChat calls gateBotMount), not with the page
      if (gateBot) gateBot.remove();
      gateBot = null;
      gateBotMount = function () { if (!BOT_OFF && !gateBot && botBox.isConnected) gateBot = botWidget(botBox, lang); };
      if (root.classList.contains("is-open")) gateBotMount();
      var trap = document.createElement("input");
      trap.type = "text";
      trap.name = "company_website";
      trap.tabIndex = -1;
      trap.autocomplete = "off";
      trap.className = "rexity-chatbot__trap";
      trap.setAttribute("aria-hidden", "true");
      var err = para("rexity-chatbot__handover-error", "");
      err.setAttribute("role", "alert");
      err.hidden = true;
      var submit = document.createElement("button");
      submit.type = "submit";
      submit.className = "rexity-chatbot__handover-submit";
      submit.textContent = c.gateSubmit;
      var priv = para("rexity-chatbot__handover-privacy", c.gatePrivacy + " ");
      var pl = document.createElement("a");
      pl.href = "/datenschutz";
      pl.textContent = c.privacy;
      priv.appendChild(pl);
      // one AI notice per place: this form carries it once (EU AI Act Art. 50, first interaction); the header only says "KI-Assistent"
      [para("rexity-chatbot__handover-title", c.gateTitle), para("rexity-chatbot__handover-copy rexity-chatbot__gate-law", c.gateDisclaimer),
        emailF.label, optLab, botBox, trap, err, submit, priv].forEach(function (n) { f.appendChild(n); });
      messages.appendChild(f);
      messages.scrollTop = Math.max(0, f.offsetTop - messages.offsetTop - 8); // show the form from its title
      f.addEventListener("submit", function (event) {
        event.preventDefault();
        var email = emailF.input.value.trim();
        var noMarketing = optBox.checked;
        var mailOk = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!mailOk) {
          err.textContent = c.gateError;
          err.hidden = false;
          emailF.input.focus();
          return;
        }
        if (!BOT_OFF && !gateBot) gateBotMount();
        var botToken = gateBot ? gateBot.token : "";
        if (!BOT_OFF && !botToken) {
          err.textContent = c.gateBot;
          err.hidden = false;
          return;
        }
        err.hidden = true;
        submit.disabled = true;
        fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // with an address: a lead as before; without one: only the bot check (kind "chat-start" stores and mails nothing)
          body: JSON.stringify(email
            ? { name: "Chat-Besucher", email: email, service: "Chatbot", message: "Chat gestartet. Kein Marketing-Kontakt gewünscht: " + (noMarketing ? "ja" : "nein"), lang: lang, turnstileToken: botToken || undefined, company_website: trap.value }
            : { kind: "chat-start", service: "Chatbot", lang: lang, turnstileToken: botToken || undefined, company_website: trap.value })
        }).then(function (r) {
          if (!r.ok) throw new Error("lead " + r.status);
          saveLead("", email, noMarketing);
          if (email) setHandoverState("sent"); // without an address the hand-over form can still ask for a contact later
          gateOpen = false;
          if (gateBot) gateBot.remove();
          gateBot = null;
          gateBotMount = null;
          f.remove();
          if (!messages.querySelector(".rexity-chatbot__message")) addMessage(messages, activeCopy.firstMessage, "bot");
          input.disabled = limitReached;
          send.disabled = limitReached;
          input.setAttribute("placeholder", limitReached ? activeCopy.limitPlaceholder : activeCopy.placeholder);
          renderChips();
          input.focus();
        }).catch(function () {
          submit.disabled = false;
          if (gateBot) gateBot.reset(); // a token is single-use: the next attempt needs a new one
          err.textContent = c.formFail;
          err.hidden = false;
          linkifyEmail(err);
        });
      });
    }
    if (!chatStarted()) showGate();

    // ---- chat history to Rexity Labs (founder, 2 Oct 2026): when the visitor leaves the page or hides the tab,
    // the conversation so far goes to /api/lead (one internal e-mail, nothing to the visitor), but only if the
    // visitor wrote something new since the last send.
    var TRANSCRIPT_SENT_KEY = "rexity_chat_sent";
    function sendTranscript() {
      if (!chatStarted()) return;
      var contact = getContact() || { email: "", noMarketing: false };
      var turns = [];
      messages.querySelectorAll(".rexity-chatbot__message").forEach(function (el) {
        if (el.classList.contains("rexity-chatbot__message--loading") || el.classList.contains("rexity-chatbot__handover-done")) return;
        turns.push({ role: el.classList.contains("rexity-chatbot__message--user") ? "user" : "assistant", content: (el.getAttribute("data-raw") || el.textContent || "").slice(0, 1500) });
      });
      var users = turns.filter(function (m) { return m.role === "user"; }).length;
      var sent = 0;
      try { sent = Number(window.localStorage.getItem(TRANSCRIPT_SENT_KEY)) || 0; } catch (e) {}
      if (users < sent) sent = 0; // history was cleared
      if (!users || users <= sent) return;
      var payload = JSON.stringify({ kind: "chat-transcript", email: contact.email || undefined, noMarketing: contact.noMarketing, transcript: turns.slice(-60), lang: lang });
      var ok = false;
      try { ok = navigator.sendBeacon && navigator.sendBeacon("/api/lead", new Blob([payload], { type: "application/json" })); } catch (e) {}
      if (!ok) { try { fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }); } catch (e) {} }
      try { window.localStorage.setItem(TRANSCRIPT_SENT_KEY, String(users)); } catch (e) {}
    }
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") sendTranscript(); });
    window.addEventListener("pagehide", sendTranscript);
    if (quick) quick.addEventListener("scroll", updateQuickCue, { passive: true });

    function markIntroSeen() {
      try { window.sessionStorage.setItem(INTRO_SEEN_KEY, "true"); } catch (e) {}
    }
    function introSeen() {
      try { return window.sessionStorage.getItem(INTRO_SEEN_KEY) === "true"; } catch (e) { return true; }
    }
    function hideNudge() { nudge.setAttribute("hidden", ""); }

    var lastFocus = null;
    function openChat() {
      markIntroSeen();
      hideNudge();
      lastFocus = document.activeElement;
      root.classList.add("is-open");
      pill.setAttribute("aria-expanded", "true");
      if (gateOpen && gateBotMount) gateBotMount();
      updateQuickCue();
      window.setTimeout(function () {
        updateQuickCue();
        messages.scrollTop = messages.scrollHeight;
        (input.disabled ? close : input).focus();
      }, 180);
    }
    function closeChat() {
      markIntroSeen();
      root.classList.remove("is-open");
      pill.setAttribute("aria-expanded", "false");
      (lastFocus && document.contains(lastFocus) && lastFocus !== document.body ? lastFocus : pill).focus();
    }

    pill.addEventListener("click", openChat); // the launcher opens the chat directly
    openChatHook = openChat; // data-rexity-open-chat (see the hook at the top)
    document.documentElement.classList.add("rexity-chat-ready");
    nudgeText.addEventListener("click", openChat);
    nudgeClose.addEventListener("click", function () {
      markIntroSeen();
      hideNudge();
    });
    close.addEventListener("click", closeChat);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" || event.key === "Esc") {
        if (root.classList.contains("is-open")) { event.preventDefault(); closeChat(); }
        else hideNudge();
        return;
      }
      // focus stays in the open panel (Tab / Shift+Tab cycle through its controls)
      if (event.key !== "Tab" || !root.classList.contains("is-open")) return;
      var focusables = Array.prototype.filter.call(
        panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])'),
        function (el) { return el.offsetParent !== null && !el.closest("[hidden]"); }
      );
      if (!focusables.length) return;
      var first = focusables[0];
      var lastEl = focusables[focusables.length - 1];
      if (!panel.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); lastEl.focus(); }
      else if (!event.shiftKey && document.activeElement === lastEl) { event.preventDefault(); first.focus(); }
    });

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
        if ((window.innerWidth || 0) >= 768) openChat();
      }
    } catch (e) {}

    // Launch behaviour (Sprint 12): never open the panel by itself. After ~12 s a
    // small greeting bubble appears next to the launcher, once per browser session,
    // not on phones (< 768 px), not while the site menu or the booking modal is
    // open. The width is checked when the timer fires.
    if (!introSeen()) {
      window.setTimeout(function () {
        var docEl = document.documentElement;
        var busy = docEl.classList.contains("rx-menu-open") || docEl.classList.contains("rx-modal-open");
        if (introSeen() || root.classList.contains("is-open") || busy || (window.innerWidth || 0) < 768) return;
        markIntroSeen();
        nudge.removeAttribute("hidden");
      }, 12000);
    }

    // ---- hand-over form (Sprint 25): only when /api/chat says handover: true ---------
    // Posts to /api/lead exactly as the old gate did (service "Chatbot"), so the founder's
    // notification keeps working. Phone or e-mail in one field; a hidden honeypot field.
    function showHandoverForm() {
      if (getLead() || handoverState() || messages.querySelector(".rexity-chatbot__handover")) return;
      setHandoverState("shown");
      var c = activeCopy;
      var f = document.createElement("form");
      f.className = "rexity-chatbot__handover";
      f.noValidate = true;
      f.setAttribute("aria-label", c.formTitle);
      var title = document.createElement("p");
      title.className = "rexity-chatbot__handover-title";
      title.textContent = c.formTitle;
      var intro = document.createElement("p");
      intro.className = "rexity-chatbot__handover-copy";
      intro.textContent = c.formCopy;
      function field(cls, type, label, auto, max) {
        var lab = document.createElement("label");
        lab.className = "rexity-chatbot__handover-label";
        var span = document.createElement("span");
        span.textContent = label;
        var el = document.createElement(type === "textarea" ? "textarea" : "input");
        if (type !== "textarea") el.type = type;
        else el.rows = 2;
        el.className = "rexity-chatbot__field " + cls;
        el.maxLength = max;
        if (auto) el.setAttribute("autocomplete", auto);
        lab.appendChild(span);
        lab.appendChild(el);
        return { label: lab, input: el };
      }
      var nameF = field("rexity-chatbot__handover-name", "text", c.formName, "name", 80);
      var contactF = field("rexity-chatbot__handover-contact", "text", c.formContact, "tel", 120);
      contactF.input.setAttribute("inputmode", "email");
      var noteF = field("rexity-chatbot__handover-note", "textarea", c.formNote, null, 500);
      var trap = document.createElement("input");
      trap.type = "text";
      trap.name = "company_website";
      trap.tabIndex = -1;
      trap.autocomplete = "off";
      trap.className = "rexity-chatbot__trap";
      trap.setAttribute("aria-hidden", "true");
      var err = document.createElement("p");
      err.className = "rexity-chatbot__handover-error";
      err.setAttribute("role", "alert");
      err.hidden = true;
      var actions = document.createElement("div");
      actions.className = "rexity-chatbot__handover-actions";
      var submit = document.createElement("button");
      submit.type = "submit";
      submit.className = "rexity-chatbot__handover-submit";
      submit.textContent = c.formSubmit;
      var cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "rexity-chatbot__handover-cancel";
      cancel.textContent = c.formCancel;
      actions.appendChild(submit);
      actions.appendChild(cancel);
      var priv = document.createElement("p");
      priv.className = "rexity-chatbot__handover-privacy";
      priv.appendChild(document.createTextNode(c.formPrivacy + " "));
      var pl = document.createElement("a");
      pl.href = "/datenschutz";
      pl.textContent = c.privacy;
      priv.appendChild(pl);
      var hoBox = document.createElement("div");
      hoBox.className = "rexity-chatbot__gate-bot";
      hoBox.hidden = BOT_OFF;
      [title, intro, nameF.label, contactF.label, noteF.label, hoBox, trap, err, actions, priv].forEach(function (n) { f.appendChild(n); });
      messages.appendChild(f);
      messages.scrollTop = messages.scrollHeight;
      // same bot check as the entry form: with TURNSTILE_SECRET_KEY set, /api/lead refuses a lead without a token
      var hoBot = BOT_OFF ? null : botWidget(hoBox, lang);

      cancel.addEventListener("click", function () {
        if (hoBot) hoBot.remove();
        f.remove();
        input.focus();
      });
      f.addEventListener("submit", function (event) {
        event.preventDefault();
        var name = nameF.input.value.trim();
        var contact = contactF.input.value.trim();
        var isMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
        var digits = contact.replace(/\D/g, "");
        var isPhone = !isMail && digits.length >= 7 && digits.length <= 15 && /^[+\d\s()\/-]+$/.test(contact);
        if (name.length < 2 || (!isMail && !isPhone)) {
          err.textContent = c.formError;
          err.hidden = false;
          (name.length < 2 ? nameF.input : contactF.input).focus();
          return;
        }
        if (hoBot && !hoBot.token) {
          err.textContent = c.gateBot;
          err.hidden = false;
          return;
        }
        err.hidden = true;
        submit.disabled = true;
        var note = noteF.input.value.trim();
        var body = {
          name: name,
          service: "Chatbot",
          message: "Kontaktwunsch aus dem KI-Chat" + (note ? ": " + note : ""),
          lang: lang,
          company_website: trap.value
        };
        if (isMail) body.email = contact;
        else body.phone = contact;
        if (hoBot) body.turnstileToken = hoBot.token;
        fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }).then(function (r) {
          if (!r.ok) throw new Error("lead " + r.status);
          saveLead(name);
          setHandoverState("sent");
          var thanks = document.createElement("div");
          thanks.className = "rexity-chatbot__message rexity-chatbot__message--bot rexity-chatbot__handover-done";
          thanks.textContent = c.formThanks.replace("{name}", name);
          if (hoBot) hoBot.remove();
          f.replaceWith(thanks);
          input.focus();
        }).catch(function () {
          submit.disabled = false;
          if (hoBot) hoBot.reset();
          err.textContent = c.formFail;
          err.hidden = false;
          linkifyEmail(err);
        });
      });
      window.setTimeout(function () { nameF.input.focus(); }, 60);
    }

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        send.click();
      }
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var message = input.value.trim();
      if (!message || limitReached || gateOpen) return;
      input.value = "";
      send.disabled = true;
      // Capture the prior conversation BEFORE adding the new turn, so the
      // model gets context (AI notice + alternating user/bot bubbles).
      var history = [];
      var memory = [];
      var nowTs = new Date().getTime();
      messages.querySelectorAll(".rexity-chatbot__message").forEach(function (el) {
        if (el.classList.contains("rexity-chatbot__message--loading") || el.classList.contains("rexity-chatbot__handover-done")) return;
        // older than 3 hours = an earlier conversation: context only, not counted for the 20-message cap
        var older = nowTs - (Number(el.getAttribute("data-ts")) || nowTs) > CURRENT_WINDOW;
        (older ? memory : history).push({
          role: el.classList.contains("rexity-chatbot__message--user") ? "user" : "assistant",
          // the raw answer, links included, so the model sees what it linked before
          content: (el.getAttribute("data-raw") || el.textContent || "").slice(0, 1500)
        });
      });
      var curLang = detectLang();
      addMessage(messages, message, "user");
      if (quick) quick.hidden = true;
      // Animated "thinking" indicator (bouncing dots), kept for a short minimum beat.
      var loading = addThinking(messages, activeCopy.thinking);
      var minWait = new Promise(function (resolve) { window.setTimeout(resolve, 600); });
      var data;
      try {
        data = await askApi(message, curLang, history, memory);
      } catch (_error) {
        data = { answer: localReply(message) };
      }
      await minWait;
      setBotAnswer(loading, data.answer, data.cards);
      send.disabled = false;
      if (data.intent === "conversation_limit") {
        limitReached = true;
        input.disabled = true;
        send.disabled = true;
        input.setAttribute("placeholder", activeCopy.limitPlaceholder);
      }
      if (data.handover) showHandoverForm();
      else if (!input.disabled) input.focus();
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

  // Chat switched off and no tester override: nothing is built (no floating button, no stylesheet).
  function start() { if (CHAT_ON) withStyles(waitForMainPage); }
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
