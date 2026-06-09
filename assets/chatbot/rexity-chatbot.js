(function () {
  var STORAGE_KEY = "rexity_lang";
  var copy = {
    en: {
      quickQuestions: [
        "What does Rexity do?",
        "Book a demo",
        "I need a website",
        "Automate my business",
        "Tell me about LevelKraft",
        "Pricing in English?"
      ],
      rootLabel: "Rexity chat assistant",
      openLabel: "Open Rexity chat",
      closeLabel: "Close chat",
      panelLabel: "Rexity chat",
      quickLabel: "Suggested questions",
      messageLabel: "Message Rexity",
      sendLabel: "Send message",
      pillTitle: "Ask Rexity",
      pillSubtitle: "Design, AI, demos",
      introTitle: "How can we help?",
      introCopy: "Ask about Rexity services, products, automation, AI systems, or booking a demo.",
      placeholder: "Ask about Rexity...",
      footnote: "The assistant answers from approved Rexity information only. Admin, refund, billing, and policy topics go to admin@rexity.ai.",
      greeting: "Hi. I can help with Rexity services, products, automation, design, development, scaling, and demos.",
      loading: "Checking Rexity knowledge..."
    },
    de: {
      quickQuestions: [
        "Was macht Rexity?",
        "Demo buchen",
        "Ich brauche eine Website",
        "Mein Business automatisieren",
        "Erzähl mir von LevelKraft",
        "Preise auf Deutsch?"
      ],
      rootLabel: "Rexity Chat-Assistent",
      openLabel: "Rexity Chat öffnen",
      closeLabel: "Chat schließen",
      panelLabel: "Rexity Chat",
      quickLabel: "Vorgeschlagene Fragen",
      messageLabel: "Nachricht an Rexity",
      sendLabel: "Nachricht senden",
      pillTitle: "Rexity fragen",
      pillSubtitle: "Design, KI, Demos",
      introTitle: "Wie können wir helfen?",
      introCopy: "Fragen Sie zu Rexity Services, Produkten, Automatisierung, KI-Systemen oder einer Demo.",
      placeholder: "Fragen Sie Rexity...",
      footnote: "Der Assistent antwortet nur auf Basis freigegebener Rexity Informationen. Admin-, Erstattungs-, Rechnungs- und Richtlinienthemen gehen an admin@rexity.ai.",
      greeting: "Hallo. Ich helfe bei Rexity Services, Produkten, Automatisierung, Design, Entwicklung, Skalierung und Demos.",
      loading: "Rexity Wissen wird geprüft..."
    }
  };

  var fallbackKnowledge = [
    {
      id: "overview",
      keys: ["rexity", "company", "what", "do", "was"],
      en: "Rexity helps teams design, develop, automate, and scale digital systems: websites, apps, SaaS interfaces, AI workflows, and growth infrastructure.",
      de: "Rexity hilft Teams dabei, digitale Systeme zu designen, zu entwickeln, zu automatisieren und zu skalieren: Websites, Apps, SaaS-Oberflächen, AI-Workflows und Wachstumsinfrastruktur."
    },
    {
      id: "design",
      keys: ["design", "website", "app", "saas", "ui", "ux"],
      en: "Design Studio covers high-end website design, app design, SaaS UI, visual systems, landing pages, and product interfaces.",
      de: "Design Studio umfasst hochwertiges Website-Design, App-Design, SaaS-UI, visuelle Systeme, Landingpages und Produktoberflächen."
    },
    {
      id: "development",
      keys: ["development", "coding", "code", "api", "backend", "frontend"],
      en: "Development Studio turns designs and ideas into production-ready websites, apps, SaaS platforms, APIs, integrations, and backend systems.",
      de: "Development Studio verwandelt Designs und Ideen in produktionsreife Websites, Apps, SaaS-Plattformen, APIs, Integrationen und Backend-Systeme."
    },
    {
      id: "automation",
      keys: ["automation", "rpa", "workflow", "crm", "process"],
      en: "Business Automation connects tools, data, messages, and decisions into reliable workflows for repeatable operations.",
      de: "Business Automation verbindet Tools, Daten, Nachrichten und Entscheidungen zu verlässlichen Workflows für wiederholbare Abläufe."
    }
  ];

  function svgIcon(name) {
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
    var t = String(text || "").toLowerCase();
    var browserLang = (navigator.language || (navigator.languages && navigator.languages[0]) || "en").toLowerCase();
    if (/(was|wie|bitte|danke|kann|können|termin|beratung|erstattung|rechnung|deutsch|preise)/i.test(t)) return "de";
    return browserLang.indexOf("de") === 0 ? "de" : "en";
  }

  function localReply(message) {
    var lang = detectLang(message);
    var text = String(message || "").toLowerCase();
    if (/refund|erstattung|billing|rechnung|policy|legal|admin|chargeback|vertrag/i.test(text)) {
      return lang === "de"
        ? "Dazu kann ich keine Entscheidung treffen. Für Erstattungen, Richtlinien, Rechnungen oder Admin-Themen schreiben Sie bitte an admin@rexity.ai."
        : "I can’t make decisions on that. For refunds, policies, billing, or admin matters, please email admin@rexity.ai.";
    }
    if (/demo|meeting|call|requirement|requirements|termin|beratung|project|quote|proposal/i.test(text)) {
      return lang === "de"
        ? "Für Anforderungen, Demos oder ein Projektgespräch schreiben Sie bitte an sunny@rexity.ai."
        : "For requirements, demos, or a project discussion, please email sunny@rexity.ai.";
    }
    var scored = fallbackKnowledge.map(function (entry) {
      var score = entry.keys.reduce(function (sum, key) {
        return sum + (text.indexOf(key) > -1 ? 1 : 0);
      }, 0);
      return { entry: entry, score: score };
    }).sort(function (a, b) { return b.score - a.score; });
    if (scored[0] && scored[0].score > 0) return scored[0].entry[lang] || scored[0].entry.en;
    return lang === "de"
      ? "Ich kann bei Rexity Services, Produkten, Design, Entwicklung, Automatisierung, AI-Systemen, Skalierung und Demo-Anfragen helfen."
      : "I can help with Rexity services, products, design, development, automation, AI systems, scaling, and demo requests.";
  }

  function addMessage(container, text, type) {
    var item = document.createElement("div");
    item.className = "rexity-chatbot__message rexity-chatbot__message--" + type;
    item.textContent = text;
    container.appendChild(item);
    container.scrollTop = container.scrollHeight;
    return item;
  }

  async function askApi(message, lang, history) {
    var response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message, lang: lang, history: history || [] })
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
      '<button class="rexity-chatbot__pill" type="button" aria-label="' + activeCopy.openLabel + '">',
        '<span class="rexity-chatbot__mark">' + svgIcon("mark") + '</span>',
        '<span class="rexity-chatbot__pill-text">',
          '<span class="rexity-chatbot__pill-title">' + activeCopy.pillTitle + '</span>',
          '<span class="rexity-chatbot__pill-subtitle">' + activeCopy.pillSubtitle + '</span>',
        '</span>',
      '</button>',
      '<div class="rexity-chatbot__panel" role="dialog" aria-modal="false" aria-label="' + activeCopy.panelLabel + '">',
        '<div class="rexity-chatbot__hero">',
          '<div class="rexity-chatbot__top">',
            '<div class="rexity-chatbot__brand">' + svgIcon("mark") + '<span>Rexity</span></div>',
            '<button class="rexity-chatbot__close" type="button" aria-label="' + activeCopy.closeLabel + '">' + svgIcon("close") + '</button>',
          '</div>',
          '<div class="rexity-chatbot__intro">',
            '<h2 class="rexity-chatbot__intro-title">' + activeCopy.introTitle + '</h2>',
            '<p class="rexity-chatbot__intro-copy">' + activeCopy.introCopy + '</p>',
          '</div>',
        '</div>',
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
      root.querySelector(".rexity-chatbot__pill-title").textContent = activeCopy.pillTitle;
      root.querySelector(".rexity-chatbot__pill-subtitle").textContent = activeCopy.pillSubtitle;
      root.querySelector(".rexity-chatbot__intro-title").textContent = activeCopy.introTitle;
      root.querySelector(".rexity-chatbot__intro-copy").textContent = activeCopy.introCopy;
      root.querySelector(".rexity-chatbot__footnote").textContent = activeCopy.footnote;
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
    addMessage(messages, activeCopy.greeting, "bot");
    window.addEventListener("rexity:languagechange", function (event) {
      renderChatLanguage(event.detail && event.detail.lang);
    });

    pill.addEventListener("click", function () {
      root.classList.add("is-open");
      window.setTimeout(function () { input.focus(); }, 180);
    });

    close.addEventListener("click", function () {
      root.classList.remove("is-open");
      pill.focus();
    });

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        send.click();
      }
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
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
          content: (el.textContent || "").slice(0, 800)
        });
      });
      var curLang = (window.rexityGetLang && window.rexityGetLang()) || lang;
      addMessage(messages, message, "user");
      var loading = addMessage(messages, activeCopy.loading, "bot rexity-chatbot__message--loading");
      try {
        loading.textContent = await askApi(message, curLang, history.slice(-6));
      } catch (_error) {
        loading.textContent = localReply(message);
      } finally {
        send.disabled = false;
        input.focus();
      }
    });
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForMainPage);
  } else {
    waitForMainPage();
  }
})();
