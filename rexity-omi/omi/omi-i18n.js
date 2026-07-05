/* omi-i18n.js — bilingual EN/DE capsule for the Rexity Omi page.
   ------------------------------------------------------------------
   Single source of truth: localStorage 'rexity_lang' ('en' | 'de').
   Lives in BOTH the parent shell (index.html) and the iframe body
   (it-page-anim.html). Cross-frame sync rides the native 'storage'
   event (fires in the *other* same-origin documents, not the one that
   wrote the value), so the parent's toggle reaches the iframe and the
   iframe reaches the parent without any postMessage plumbing.

   What it translates:
     1. [data-lang="de|en"] elements  -> shown/hidden (banner + cookie).
     2. .lang-toggle / cookie button  -> label flips to the OTHER lang.
     3. Text nodes whose trimmed value matches the DICT             -> swapped.
     4. SPECIAL selectors (GSAP SplitText quote)                    -> textContent swap.
     5. Dispatches window 'rexity:languagechange' {detail:{lang}}   -> chatbot listens.

   It only ever touches strings it owns (exact trimmed match), stores the
   original on first swap, and is fully idempotent + reversible. It does
   NOT alter structure, CSS, fonts, or the off-white theme — only text. */
(function () {
  var KEY = 'rexity_lang';

  // EN -> DE for the real Rexity content spine. Keys are the EXACT
  // trimmed text of a single text node. Placeholder/Workspace-IT debt
  // (team bios, testimonials, case-study bodies, device-mgmt copy) is
  // intentionally excluded — it should be rewritten as real content
  // before translation, not faithfully translated as-is.
  var DICT = {
    // ---- Hero ----
    'Software built for ambitious teams.':
      'Software, die ambitionierte Teams voranbringt.',
    'Behind every great digital solution is a team that understands your business. Our engineering-led approach combines deep expertise with a focus on production-grade software that helps your team stay ahead of change.':
      'Hinter jeder guten digitalen Lösung steht ein Team, das Ihr Unternehmen versteht. Unser technisch geführter Ansatz verbindet tiefes Fachwissen mit produktionsreifer Software, die Ihrem Team hilft, dem Wandel stets einen Schritt voraus zu sein.',
    'We take the time to understand your goals and constraints, tailoring digital workspaces and automations that work for your people, not against them.':
      'Wir nehmen uns die Zeit, Ihre Ziele und Rahmenbedingungen zu verstehen, und gestalten digitale Arbeitsplätze und Automatisierungen, die für Ihre Mitarbeitenden arbeiten – nicht gegen sie.',
    'With Rexity Labs you gain more than a vendor — you gain a partner who helps you build a defensible, EU-compliant digital foundation for the long term.':
      'Mit Rexity Labs gewinnen Sie mehr als einen Dienstleister – Sie gewinnen einen Partner, der mit Ihnen ein belastbares, EU-konformes digitales Fundament für die Zukunft aufbaut.',
    'Our team’s experience, technical depth, and forward-thinking mindset ensure your systems continue to evolve in line with your business ambitions.':
      'Die Erfahrung, technische Kompetenz und Weitsicht unseres Teams sorgen dafür, dass sich Ihre Systeme im Takt Ihrer unternehmerischen Ambitionen weiterentwickeln.',
    'Let’s Talk.': 'Sprechen wir.',

    // ---- Section intro ----
    'Digital workspaces and automation, end to end.':
      'Digitale Arbeitsplätze und Automatisierung – durchgängig.',
    'IT Solutions built to support your business today and ready for tomorrow.':
      'IT-Lösungen, die Ihr Unternehmen heute unterstützen und für morgen bereit sind.',

    // ---- Service cards: headings + subheadings ----
    'Website Development': 'Website-Entwicklung',
    'Business websites and SaaS platforms, backend + frontend, smart chatbots included':
      'Business-Websites und SaaS-Plattformen, Backend + Frontend, inklusive intelligenter Chatbots',
    'Mobile Apps.': 'Mobile Apps.',
    'iOS and Android apps designed in Figma, engineered to last (Kotlin / Swift / React Native)':
      'iOS- und Android-Apps, in Figma gestaltet, langlebig entwickelt (Kotlin / Swift / React Native)',
    'Business Process Automation': 'Geschäftsprozess-Automatisierung',
    'VoIP7 cloud receptionist, WhatsApp for Business, internal workflow automations':
      'VoIP-Cloud-Rezeption, WhatsApp for Business, interne Workflow-Automatisierungen',
    'Voice & WhatsApp automation.': 'Sprach- & WhatsApp-Automatisierung.',
    'Phone and WhatsApp assistants that answer calls and enquiries around the clock — DSGVO-compliant, EU-hosted':
      'Telefon- und WhatsApp-Assistenten, die Anrufe und Anfragen rund um die Uhr beantworten — DSGVO-konform, EU-gehostet',
    'Testing & Support.': 'Testing & Support.',
    'End-to-end QA, device and platform coverage, post-launch monitoring':
      'Durchgängige QA, Geräte- und Plattformabdeckung, Monitoring nach dem Launch',
    'SEO & Video Marketing': 'SEO & Video-Marketing',
    'Technical SEO that compounds + video marketing at scale (avatars, realistic shots, shorts)':
      'Technisches SEO mit Langzeitwirkung + Video-Marketing in großem Stil (Avatare, realistische Aufnahmen, Shorts)',

    // ---- Service card CTAs (Workspace-IT labels kept, translated faithfully) ----
    'Streamline Your Devices': 'Mehr erfahren',
    'Manage Your Applications': 'Mehr erfahren',
    'Optimise Your Resources': 'Mehr erfahren',
    'Transform Your Operations': 'Mehr erfahren',
    'Identify Issues': 'Mehr erfahren',
    'Proactive Updates': 'Mehr erfahren',

    // ---- Stats ----
    'Numbers That Earn Trust.': 'Zahlen, die Vertrauen schaffen.',
    'Teams across Germany and the EU rely on our engineering to keep their operations running smoothly and securely. Each partnership is built on trust, expertise, and measurable results.':
      'Unternehmen in Deutschland und der EU verlassen sich auf unsere Arbeit, damit ihr Betrieb reibungslos und sicher läuft. Jede Partnerschaft beruht auf Vertrauen, Expertise und messbaren Ergebnissen.',
    'Service lines': 'Leistungsbereiche',
    'Production apps in app stores': 'Produktiv-Apps in den App-Stores',
    'Audit-logged, EU-hosted': 'Audit-protokolliert, EU-gehostet',
    'Let’s talk.': 'Sprechen wir.',

    // ---- Values ----
    'Outcomes over output.': 'Ergebnisse statt Output.',
    'At Rexity Labs, every engagement starts with understanding your business and the people behind it. You’ll always have a knowledgeable, approachable IT expert who is invested in helping your team succeed.':
      'Bei Rexity Labs beginnt jedes Projekt damit, Ihr Unternehmen und die Menschen dahinter zu verstehen. Sie haben jederzeit eine kompetente, nahbare Ansprechperson, die am Erfolg Ihres Teams interessiert ist.',
    'By building strong working relationships, we stay proactive anticipating needs, responding quickly, and adapting as priorities evolve. When challenges arise, that understanding allows us to deliver effective, tailored solutions.':
      'Durch enge Zusammenarbeit bleiben wir proaktiv: Wir antizipieren Bedarfe, reagieren schnell und passen uns an, wenn sich Prioritäten ändern. Treten Herausforderungen auf, ermöglicht uns dieses Verständnis wirksame, maßgeschneiderte Lösungen.',
    'It’s this personal, partnership driven approach that enables us to provide managed IT services that make a real difference.':
      'Genau dieser persönliche, partnerschaftliche Ansatz erlaubt es uns, Services zu liefern, die einen echten Unterschied machen.',
    'Senior, small, embedded.': 'Senior, kompakt, eingebunden.',
    'At Rexity Labs, we don’t wait for problems to happen we act before they impact your business. By continuously monitoring your systems, we can identify risks early and take swift action to prevent disruption.':
      'Bei Rexity Labs warten wir nicht, bis Probleme entstehen – wir handeln, bevor sie Ihr Geschäft beeinträchtigen. Durch kontinuierliches Monitoring erkennen wir Risiken früh und steuern schnell gegen, um Störungen zu vermeiden.',
    'Every challenge is an opportunity to improve. Our team uses lessons learned to develop solutions that are tailored, reliable, and designed to keep your IT running smoothly.':
      'Jede Herausforderung ist eine Chance, besser zu werden. Unser Team nutzt das Gelernte, um Lösungen zu entwickeln, die maßgeschneidert, verlässlich und auf einen reibungslosen Betrieb ausgelegt sind.',
    'With vigilant, proactive IT management, we ensure your infrastructure is secure, efficient, and always ready to support your business goals. Proactive Innovation helps you stay ahead, minimise risk, and get the most from your technology.':
      'Mit aufmerksamem, proaktivem Management sorgen wir dafür, dass Ihre Infrastruktur sicher, effizient und jederzeit bereit ist, Ihre Ziele zu unterstützen. Proaktive Innovation hält Sie vorn, minimiert Risiken und holt das Maximum aus Ihrer Technologie.',
    'Results, not buzzwords.': 'Ergebnisse, keine Buzzwords.',
    'Great ideas come from different perspectives. At Rexity Labs, we believe that inclusivity drives innovation and that benefits every customer we work with.':
      'Gute Ideen entstehen aus unterschiedlichen Perspektiven. Bei Rexity Labs sind wir überzeugt, dass Vielfalt Innovation antreibt – und davon profitiert jede Kundin und jeder Kunde.',
    'Our diverse team brings a range of experiences and insights that shape creative, practical IT solutions. By working collaboratively, we find better ways to solve challenges and deliver results that truly fit each organisation.':
      'Unser vielfältiges Team bringt ein breites Spektrum an Erfahrungen und Sichtweisen ein, die kreative, praxistaugliche Lösungen formen. In enger Zusammenarbeit finden wir bessere Wege, Herausforderungen zu lösen und Ergebnisse zu liefern, die wirklich passen.',
    'We’re committed to building a workplace where everyone feels heard, valued, and empowered to make an impact. That same inclusive mindset extends to how we work with our clients, listening, adapting, and creating solutions together that make a real difference.':
      'Wir bauen bewusst ein Umfeld, in dem sich alle gehört, wertgeschätzt und befähigt fühlen, etwas zu bewegen. Dieselbe offene Haltung prägt die Arbeit mit unseren Kund:innen: zuhören, anpassen und gemeinsam Lösungen schaffen, die einen echten Unterschied machen.',

    // ---- Team (real: Sunny only) ----
    'The Team Behind Rexity Labs.': 'Das Team hinter Rexity Labs.',
    'Experts from multiple disciplines, working together to keep your IT secure, efficient, and aligned with your business goals.':
      'Expert:innen aus mehreren Disziplinen, die zusammenarbeiten, damit Ihre IT sicher, effizient und auf Ihre Ziele ausgerichtet bleibt.',
    'Sunny Thakur.': 'Sunny Thakur.',
    'Founder & CEO.': 'Gründer & CEO.',
    'Sunny Thakur is the founder of Rexity Labs. He leads the company’s technology-first approach — building websites, apps, WhatsApp and phone automation, and video for ambitious teams. With a background spanning product, engineering and go-to-market, Sunny focuses on shipping production-grade software that is DSGVO-compliant, EU-hosted, and built to last.':
      'Sunny Thakur ist der Gründer von Rexity Labs. Er verantwortet den technologiegetriebenen Ansatz des Unternehmens – Websites, Apps, WhatsApp- und Telefon-Automatisierung sowie Video für ambitionierte Teams. Mit einem Hintergrund über Produkt, Engineering und Go-to-Market hinweg konzentriert sich Sunny darauf, produktionsreife Software auszuliefern, die DSGVO-konform, EU-gehostet und auf Langlebigkeit gebaut ist.',
    'Book a call': 'Termin buchen',

    // ---- Case study spine ----
    'Selected work.': 'Ausgewählte Arbeiten.',
    'How We Helped': 'So haben wir geholfen',
    'Services Provided': 'Erbrachte Leistungen',
    'Watch the Interview': 'Interview ansehen',
    'Learn More': 'Mehr erfahren',
    'Clevr — built for people who love to host.':
      'Clevr — gemacht für alle, die gerne Gastgeber sind.',
    'LevelKraft is an app Rexity Labs built for language learners. It prepares people for the German TELC and Goethe exams, from A1 all the way to C2.':
      'LevelKraft ist eine App, die Rexity Labs für Sprachlernende entwickelt hat. Sie bereitet auf die deutschen TELC- und Goethe-Prüfungen vor, von A1 bis C2.',
    'Inside the app: full-length practice tests, instant feedback on speaking and writing, and short daily sessions that quietly adapt to each learner’s weak spots — calm, focused, no clutter.':
      'In der App: vollständige Übungstests, sofortiges Feedback zu Sprechen und Schreiben und kurze tägliche Einheiten, die sich unaufdringlich an die Schwächen jedes Lernenden anpassen — ruhig, fokussiert, ohne Ballast.',
    'Clevr is an app Rexity Labs built for party planners. Hosting usually means juggling five different chats and apps; Clevr brings it all into one place.':
      'Clevr ist eine App, die Rexity Labs für Partyplaner entwickelt hat. Eine Feier zu organisieren bedeutet meist, fünf verschiedene Chats und Apps zu jonglieren; Clevr bündelt alles an einem Ort.',
    'Shared invites, food and drink polls, a collaborative playlist, expense splitting, games and a group chat. Plan, invite, celebrate — without the coordination chaos.':
      'Gemeinsame Einladungen, Abstimmungen zu Essen und Getränken, eine geteilte Playlist, Kostenteilung, Spiele und ein Gruppenchat. Planen, einladen, feiern — ohne Organisations-Chaos.',
    'Fresh&Save is an app Rexity Labs built around the family kitchen — a shared food inventory that fights waste and the dreaded double-buy.':
      'Fresh&Save ist eine App, die Rexity Labs rund um die Familienküche entwickelt hat — ein gemeinsamer Lebensmittelvorrat gegen Verschwendung und Doppelkäufe.',
    'See what’s in the kitchen at a glance, plan meals, save recipes, and keep one live shopping list the whole family shares, so nothing expires and nothing’s forgotten.':
      'Die Küche auf einen Blick sehen, Mahlzeiten planen, Rezepte speichern und eine gemeinsame Einkaufsliste für die ganze Familie führen, damit nichts verdirbt und nichts vergessen wird.',

    // ---- Stack ----
    'Built on a proven technology stack': 'Auf einem erprobten Technologie-Stack gebaut',
    'We build on best-in-class cloud, compute, database and deployment platforms — the infrastructure behind everything we deliver.':
      'Wir bauen auf erstklassige Cloud-, Rechen-, Datenbank- und Deployment-Plattformen — die Infrastruktur hinter allem, was wir liefern.',

    // ---- Contact ----
    'Talk to Rexity Labs.': 'Sprechen Sie mit Rexity Labs.',
    'Share your details and one of our IT specialists will be in touch.':
      'Hinterlassen Sie Ihre Daten – eine:r unserer Spezialist:innen meldet sich bei Ihnen.',
    'GDPR Policy': 'DSGVO-Hinweis'
  };

  // GSAP SplitText wraps the case-study quote word-by-word, so it can't be
  // matched as one text node. Handle it at the element level instead.
  var QUOTE_EN = '“At Rexity Labs, we measure our success by what clients actually ship. A website, an app, a WhatsApp assistant, a phone assistant — we build it to be fast, EU-compliant and genuinely useful, then we stay until it works in the real world.”';
  var QUOTE_DE = '„Bei Rexity Labs messen wir unseren Erfolg daran, was unsere Kund:innen tatsächlich live bringen. Eine Website, eine App, ein WhatsApp-Assistent, ein Telefon-Assistent – wir bauen es schnell, EU-konform und wirklich nützlich und bleiben dann an Bord, bis es in der Praxis funktioniert.“';
  var QUOTE_SEL = '#headline-4933-88, .type-fade-reveal';

  function getStored() {
    try { var v = localStorage.getItem(KEY); return v === 'de' || v === 'en' ? v : null; } catch (e) { return null; }
  }
  function setStored(lang) { try { localStorage.setItem(KEY, lang); } catch (e) {} }
  function detect() {
    var s = getStored();
    if (s) return s;
    return (navigator.language || '').toLowerCase().indexOf('de') === 0 ? 'de' : 'en';
  }

  // --- text-node dictionary swap (idempotent + reversible) ---
  function swapTextNodes(lang) {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      var orig = n.__i18nOrig != null ? n.__i18nOrig : n.nodeValue;
      var trimmed = orig.trim();
      if (!trimmed) continue;
      var de = DICT[trimmed];
      if (!de) continue;                 // not a string we own
      n.__i18nOrig = orig;               // remember the exact original (with whitespace)
      if (lang === 'de') {
        var lead = orig.match(/^\s*/)[0];
        var trail = orig.match(/\s*$/)[0];
        n.nodeValue = lead + de + trail;
      } else {
        n.nodeValue = orig;
      }
    }
  }

  // --- [data-lang] show/hide (banner + cookie spans) ---
  function swapDataLang(lang) {
    var els = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var want = el.getAttribute('data-lang');
      el.style.display = (want === lang) ? '' : 'none';
    }
  }

  // --- toggle button labels show the language you'd switch TO ---
  function swapToggleLabels(lang) {
    var other = lang === 'de' ? 'EN' : 'DE';
    var btns = document.querySelectorAll('.lang-toggle, #rexity-omi-cookie-lang');
    for (var i = 0; i < btns.length; i++) btns[i].textContent = other;
  }

  // --- case-study split quote (element-level) ---
  function swapQuote(lang) {
    var els = document.querySelectorAll(QUOTE_SEL);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      // Only touch the element that actually holds the quote text.
      var current = (el.textContent || '').replace(/\s+/g, ' ').trim();
      var looksLikeQuote = /measure our success|messen wir unseren Erfolg/.test(current);
      if (!looksLikeQuote) continue;
      el.textContent = (lang === 'de') ? QUOTE_DE : QUOTE_EN;
    }
  }

  function applyToDoc(lang) {
    try { swapDataLang(lang); } catch (e) {}
    try { swapToggleLabels(lang); } catch (e) {}
    try { swapTextNodes(lang); } catch (e) {}
    try { swapQuote(lang); } catch (e) {}
    try { document.documentElement.setAttribute('lang', lang); } catch (e) {}
  }

  // Reach a same-origin child iframe directly — the 'storage' event covers
  // cross-frame sync, but poking the frame too removes any timing/flakiness.
  function pokeFrames(lang) {
    var frames = document.querySelectorAll('iframe');
    for (var i = 0; i < frames.length; i++) {
      try {
        var w = frames[i].contentWindow;
        if (w && typeof w.rexityApplyLang === 'function') w.rexityApplyLang(lang);
      } catch (e) { /* cross-origin or not ready — storage event will cover it */ }
    }
  }

  // Public: change language everywhere (this frame + siblings + chatbot).
  function setLang(lang) {
    lang = lang === 'de' ? 'de' : 'en';
    setStored(lang);                       // triggers 'storage' in the other frame
    applyToDoc(lang);
    pokeFrames(lang);
    try {
      window.dispatchEvent(new CustomEvent('rexity:languagechange', { detail: { lang: lang } }));
    } catch (e) {}
  }
  function toggle() { setLang(getStored() === 'de' ? 'en' : 'de'); }

  window.rexitySetLang = setLang;
  window.rexityToggleLang = toggle;
  window.rexityApplyLang = applyToDoc;   // apply-only (no persist/dispatch) — used by parent poke
  window.rexityGetLang = detect;

  // Cross-frame: the OTHER document wrote rexity_lang -> mirror it here.
  window.addEventListener('storage', function (e) {
    if (e.key !== KEY || !e.newValue) return;
    var lang = e.newValue === 'de' ? 'de' : 'en';
    applyToDoc(lang);
    try { window.dispatchEvent(new CustomEvent('rexity:languagechange', { detail: { lang: lang } })); } catch (err) {}
  });

  // Initial apply. Re-apply a few times to catch late content:
  // GSAP SplitText (the quote) and the marquee clones land after load.
  function boot() {
    var lang = detect();
    applyToDoc(lang);
    var delays = [400, 1200, 2500];
    delays.forEach(function (d) { setTimeout(function () { applyToDoc(detect()); }, d); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  window.addEventListener('load', function () { applyToDoc(detect()); });
})();
