(function () {
  var STORAGE_KEY = "rexity_lang";
  var INTRO_SEEN_KEY = "rexity_intro_seen";

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
      return tagesgruss("de") + ", ich bin Rexity, Ihr virtueller Assistent. Ich helfe Ihnen gerne bei unseren Services: Web- & App-Design und Entwicklung, Digital Marketing, AI Agents, digitale Automatisierungen und Dashboards. Wie kann ich Ihnen weiterhelfen?";
    }
    return tagesgruss("en") + ", I am Rexity, your virtual assistant. I can help you with our services: Web & App Design and Development, Digital Marketing, AI Agents, Digital Automations, and Dashboards. How can I help?";
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
      footnote: "Our Rexity chatbot is powered by a modern AI agent and can make mistakes. Please contact us before drawing any conclusions — we can help you better: hello@rexity.ai.",
      loadingThink: "Rexity is thinking …",
      loadingWrite: "Rexity is writing …"
    },
    de: {
      quickQuestions: [
        "Was macht Rexity?",
        "Web- & App-Entwicklung",
        "AI Agents",
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
      introCopy: "Fragen Sie zu Web- & App-Entwicklung, Digital Marketing, AI Agents, Automatisierungen oder Dashboards.",
      placeholder: "Fragen Sie Rexity...",
      footnote: "Unser Rexity-Chatbot basiert auf einem modernen KI-Agenten und kann Fehler machen. Bitte kontaktieren Sie uns, bevor Sie Entscheidungen daraus ableiten — wir helfen Ihnen gerne besser weiter: hello@rexity.ai.",
      loadingThink: "Rexity denkt …",
      loadingWrite: "Rexity schreibt …"
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
        ? "Dazu kann ich keine Entscheidung treffen. Für Erstattungen, Richtlinien, Rechnungen oder Admin-Themen schreiben Sie bitte an hello@rexity.ai."
        : "I can’t make decisions on that. For refunds, policies, billing, or admin matters, please email hello@rexity.ai.";
    }
    if (/demo|meeting|call|requirement|requirements|termin|beratung|project|quote|proposal/i.test(text)) {
      return lang === "de"
        ? "Für Anforderungen, Demos oder ein Projektgespräch schreiben Sie bitte an hello@rexity.ai."
        : "For requirements, demos, or a project discussion, please email hello@rexity.ai.";
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

  // ---- hello@rexity.ai → clickable, pre-filled email -----------------------
  // Every appearance of the contact address in bot messages and the footnote
  // becomes a link. Clicking opens a tiny chooser (Gmail / Outlook / mail
  // app) — each target gets To, Subject and Body pre-filled in the chat
  // language. Built with DOM nodes only (never innerHTML on model output).
  var CONTACT_EMAIL = "hello@rexity.ai";

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

  function linkifyEmail(el) {
    if (!el) return;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var hits = [];
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.indexOf(CONTACT_EMAIL) > -1) hits.push(node);
    }
    hits.forEach(function (textNode) {
      var parts = textNode.nodeValue.split(CONTACT_EMAIL);
      var frag = document.createDocumentFragment();
      parts.forEach(function (part, i) {
        if (part) frag.appendChild(document.createTextNode(part));
        if (i < parts.length - 1) {
          var a = document.createElement("a");
          a.className = "rexity-chatbot__maillink";
          a.textContent = CONTACT_EMAIL;
          a.href = "mailto:" + CONTACT_EMAIL;
          a.addEventListener("click", function (e) {
            e.preventDefault();
            openMailMenu(a);
          });
          frag.appendChild(a);
        }
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

  // A "thinking" bubble: three bouncing dots (animated), shown while the
  // model works. Static markup only — never model output.
  function addThinking(container) {
    var item = document.createElement("div");
    item.className = "rexity-chatbot__message rexity-chatbot__message--bot rexity-chatbot__message--loading";
    item.setAttribute("aria-label", (activeCopy && activeCopy.loadingThink) || "…");
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
    el.textContent = text;
    linkifyBot(el);
    if (el.parentNode) el.parentNode.scrollTop = el.parentNode.scrollHeight;
  }

  // Close any open chooser when clicking elsewhere.
  document.addEventListener("click", function (e) {
    if (e.target.closest && (e.target.closest(".rexity-chatbot__maillink") || e.target.closest(".rexity-chatbot__mailmenu"))) return;
    closeMailMenus();
  }, true);

  function addMessage(container, text, type) {
    var item = document.createElement("div");
    item.className = "rexity-chatbot__message rexity-chatbot__message--" + type;
    item.textContent = text;
    if (type.indexOf("bot") > -1) linkifyBot(item);
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
            '<div class="rexity-chatbot__brand"><img src="/rexity-omi/assets/brand/rexity-labs-logo-white-160.png" alt="Rexity Labs UG"></div>',
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
    addMessage(messages, greetingText(lang), "bot");
    window.addEventListener("rexity:languagechange", function (event) {
      renderChatLanguage(event.detail && event.detail.lang);
    });

    function markIntroSeen() {
      try { window.sessionStorage.setItem(INTRO_SEEN_KEY, "true"); } catch (e) {}
    }
    function introSeen() {
      try { return window.sessionStorage.getItem(INTRO_SEEN_KEY) === "true"; } catch (e) { return true; }
    }

    pill.addEventListener("click", function () {
      markIntroSeen();
      root.classList.add("is-open");
      window.setTimeout(function () { input.focus(); }, 180);
    });

    close.addEventListener("click", function () {
      markIntroSeen();
      root.classList.remove("is-open");
      pill.focus();
    });

    // PRD launch behavior: expand once, 8-10 s after load, with the greeting
    // already in place. Once per browser session; never again after the
    // visitor closes or opens it themselves. Desktop only — auto-opening a
    // near-fullscreen panel on mobile is intrusive. Viewport is checked when
    // the timer FIRES (prerendered/background tabs report width 0 at init;
    // unknown width counts as desktop).
    function isMobileViewport() {
      var w = window.innerWidth || (window.screen && window.screen.width) || 0;
      return w > 0 && w < 640;
    }
    if (!introSeen()) {
      window.setTimeout(function () {
        if (introSeen() || root.classList.contains("is-open") || isMobileViewport()) return;
        markIntroSeen();
        root.classList.add("is-open");
      }, 9000);
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
      // Show an animated "thinking" indicator (bouncing dots), and keep it
      // visible for a minimum beat so even an instant API reply reads as a
      // considered response rather than a flash.
      var loading = addThinking(messages);
      var minWait = new Promise(function (resolve) { window.setTimeout(resolve, 850); });
      var answer;
      try {
        answer = await askApi(message, curLang, history.slice(-12));
      } catch (_error) {
        answer = localReply(message);
      }
      await minWait;
      setBotAnswer(loading, answer);
      send.disabled = false;
      input.focus();
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
