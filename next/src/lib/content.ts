export const SITE_CONFIG = {
  name: "Rexity Labs",
  email: "hello@rexity.ai",
  legalName: "Rexity Labs UG (haftungsbeschränkt)",
  hrb: "HRB 213911",
  court: "Amtsgericht Lüneburg",
  founder: "Sunny Thakur",
};

export const NAV_PILLARS = [
  {
    slug: "web",
    href: "/web",
    title: { de: "Web & Apps", en: "Web & Apps" },
    desc: { de: "Websites, SaaS-Plattformen und mobile Apps", en: "Websites, SaaS platforms, and mobile applications" },
    children: [
      { href: "/web/web-design", label: { de: "Webdesign", en: "Web Design" }, desc: { de: "Wireframes bis Figma-Designsystem", en: "Wireframes to Figma design systems" } },
      { href: "/web/web-development", label: { de: "Web-Entwicklung", en: "Web Development" }, desc: { de: "Performantes Next.js & React-Frontend", en: "High-performance Next.js & React frontend" } },
      { href: "/web/saas", label: { de: "SaaS-Plattformen", en: "SaaS Platforms" }, desc: { de: "Skalierbare Cloud-Software mit Auth", en: "Scalable cloud software with auth & APIs" } },
      { href: "/web/mobile-apps", label: { de: "Mobile Apps", en: "Mobile Apps" }, desc: { de: "Native iOS & Android Anwendungen", en: "Native iOS & Android applications" } },
      { href: "/web/dashboards", label: { de: "Dashboards", en: "Dashboards" }, desc: { de: "KPI-, Ops- und Datenansichten", en: "KPI, operations and data reporting" } },
    ],
  },
  {
    slug: "automation",
    href: "/automation",
    title: { de: "Automatisierung", en: "Automation" },
    desc: { de: "KI-Agenten, WhatsApp, Voice & RPA", en: "AI agents, WhatsApp, Voice & RPA" },
    children: [
      { href: "/automation/rpa", label: { de: "RPA & Prozessautomatisierung", en: "RPA & Process Automation" }, desc: { de: "Workflows zwischen CRM, E-Mail & Tools", en: "Workflows across CRM, email & tools" } },
      { href: "/automation/whatsapp", label: { de: "WhatsApp-Agenten", en: "WhatsApp Agents" }, desc: { de: "Autonome Lead-Qualifizierung & Buchung", en: "Autonomous lead intake & booking" } },
      { href: "/automation/voice", label: { de: "Voice-Agenten", en: "Voice Agents" }, desc: { de: "Cloud-Empfang rund um die Uhr", en: "24/7 cloud receptionist & intake" } },
      { href: "/automation/chatbots", label: { de: "Website-Chatbots", en: "Website Chatbots" }, desc: { de: "RAG-Antworten aus Ihrer Wissensbasis", en: "RAG responses from your knowledge base" } },
    ],
  },
  {
    slug: "marketing",
    href: "/marketing",
    title: { de: "Digitales Marketing", en: "Digital Marketing" },
    desc: { de: "SEO, Content & KI-Videoproduktion", en: "SEO, content & AI video production" },
    children: [
      { href: "/marketing/seo", label: { de: "SEO", en: "SEO" }, desc: { de: "Technisches SEO & Suchmaschinenranking", en: "Technical SEO & search engine rankings" } },
      { href: "/marketing/content", label: { de: "Content & Social", en: "Content & Social" }, desc: { de: "Content-Maschine für B2B & B2C", en: "Structured content engine for B2B & B2C" } },
      { href: "/marketing/video", label: { de: "KI-Videomarketing", en: "AI Video Marketing" }, desc: { de: "Avatare & Short-Form Creatives", en: "AI avatars & short-form video creatives" } },
    ],
  },
  {
    slug: "testing-support",
    href: "/testing-support",
    title: { de: "Testing & Support", en: "Testing & Support" },
    desc: { de: "Automatisierte Tests & verlässlicher Betrieb", en: "Automated testing & dependable maintenance" },
    children: [
      { href: "/testing-support", label: { de: "Automatisierte E2E-Tests", en: "Automated E2E Testing" }, desc: { de: "Releases ohne Regressionsfehler", en: "Releases without regressions" } },
      { href: "/testing-support", label: { de: "DSGVO-Compliance Audit", en: "GDPR Compliance Audit" }, desc: { de: "Revisionssichere Datenschutz-Prüfung", en: "Auditable data protection verification" } },
      { href: "/testing-support", label: { de: "SLA & Wartung", en: "SLA & Maintenance Support" }, desc: { de: "Direkter Support durch Senior-Entwickler", en: "Direct SLA support by senior engineers" } },
    ],
  },
];

export const ALL_17_SERVICE_LINKS = [
  { href: "/web", label: { de: "Web & Apps (Hub)", en: "Web & Apps (Hub)" } },
  { href: "/web/web-design", label: { de: "Webdesign", en: "Web Design" } },
  { href: "/web/web-development", label: { de: "Web-Entwicklung", en: "Web Development" } },
  { href: "/web/saas", label: { de: "SaaS-Plattformen", en: "SaaS Platforms" } },
  { href: "/web/mobile-apps", label: { de: "Mobile Apps", en: "Mobile Apps" } },
  { href: "/web/dashboards", label: { de: "Dashboards & Reporting", en: "Dashboards & Reporting" } },
  { href: "/automation", label: { de: "Automatisierung (Hub)", en: "Automation (Hub)" } },
  { href: "/automation/rpa", label: { de: "RPA & Prozessautomatisierung", en: "RPA & Process Automation" } },
  { href: "/automation/whatsapp", label: { de: "WhatsApp-Agenten", en: "WhatsApp Agents" } },
  { href: "/automation/voice", label: { de: "Voice-Agenten", en: "Voice Agents" } },
  { href: "/automation/chatbots", label: { de: "Website-Chatbots", en: "Website Chatbots" } },
  { href: "/marketing", label: { de: "Digitales Marketing (Hub)", en: "Digital Marketing (Hub)" } },
  { href: "/marketing/seo", label: { de: "SEO", en: "SEO" } },
  { href: "/marketing/content", label: { de: "Content & Social", en: "Content & Social" } },
  { href: "/marketing/video", label: { de: "KI-Videomarketing", en: "AI Video Marketing" } },
  { href: "/services", label: { de: "Leistungen (Übersicht)", en: "All Services (Index)" } },
  { href: "/testing-support", label: { de: "Testing & Support", en: "Testing & Support" } },
];

export const LEGAL_LINKS = [
  { href: "/impressum", label: { de: "Impressum", en: "Imprint" } },
  { href: "/datenschutz", label: { de: "Datenschutz", en: "Privacy" } },
  { href: "/agb", label: { de: "AGB", en: "Terms" } },
  { href: "/aeb", label: { de: "AEB", en: "Purchasing Terms" } },
  { href: "/barrierefreiheit", label: { de: "Barrierefreiheit", en: "Accessibility" } },
];

export const HERO_CONTENT = {
  monoTag: "EU-HOSTED · DSGVO · AZURE OPENAI",
  badge: {
    de: "AI-Native Software Studio · EU-Gehostet",
    en: "AI-Native Software Studio · EU-Hosted",
  },
  promiseLead: {
    de: "Verstehen. Bauen.",
    en: "Understand. Build.",
  },
  promiseAccent: {
    de: "Automatisieren.",
    en: "Automate.",
  },
  subline: {
    de: "Rexity entwickelt moderne Websites, intelligente KI-Agenten und nahtlose Prozessautomatisierungen für ambitionierte Teams — 100% DSGVO-konform, revisionssicher und maßgeschneidert.",
    en: "Rexity builds modern websites, intelligent AI agents, and seamless process automations for ambitious teams — 100% GDPR-compliant, audit-logged, and tailor-made.",
  },
  ctaPrimary: {
    de: "Projekt besprechen",
    en: "Book a Discovery Call",
  },
  ctaSecondary: {
    de: "Arbeiten entdecken",
    en: "Explore Our Work",
  },
};

export const PROBLEM_CONTENT = {
  monoTag: "PROBLEM IDENTIFICATION · GERMAN SMB REALITY",
  badge: {
    de: "Das Problem",
    en: "The Problem",
  },
  heading: {
    de: "Der verborgene Preis manueller Prozesse",
    en: "The Hidden Cost of Manual Work",
  },
  description: {
    de: "Wertvolle Arbeitszeit im Mittelstand geht jeden Tag durch repetitive Aufgaben, zersplitterte Tools und manuelle Kommunikation verloren.",
    en: "Valuable team hours are drained every day by repetitive tasks, fragmented software tools, and manual customer communication.",
  },
  cards: [
    {
      title: {
        de: "E-Mail & WhatsApp Überlastung",
        en: "Email & WhatsApp Bottlenecks",
      },
      desc: {
        de: "Standardfragen und Terminabsprachen blockieren das Kernteam stundenlang.",
        en: "Routine enquiries and scheduling block your core team from high-value tasks.",
      },
    },
    {
      title: {
        de: "Zersplitterte Datensysteme",
        en: "Fragmented Tool Stacks",
      },
      desc: {
        de: "Daten müssen manuell zwischen CRM, Tabellen und E-Mail-Postfächern kopiert werden.",
        en: "Data has to be copied manually between CRM, spreadsheets, and inbox tools.",
      },
    },
    {
      title: {
        de: "Fehlender 24/7 Kundenservice",
        en: "No 24/7 Intake Capacity",
      },
      desc: {
        de: "Leads nach Feierabend oder am Wochenende bleiben bis Montagunbearbeitet.",
        en: "Leads reaching out after hours or over weekends wait until Monday for a response.",
      },
    },
  ],
};

export const CASE_STUDIES = [
  {
    slug: "clevr",
    name: "Clevr",
    subtitle: {
      de: "Die Komplett-App für unvergessliche Events & Party-Planer",
      en: "The complete app for party planners & event hosts",
    },
    category: {
      de: "Mobile App & Social Engine",
      en: "Mobile App & Social Engine",
    },
    metrics: [
      { label: { de: "Features in 1 App", en: "Features in 1 App" }, value: "6 in 1" },
      { label: { de: "Orga-Aufwand", en: "Orga Work" }, value: "-75%" },
    ],
    description: {
      de: "Gastgeben heißt sonst, fünf verschiedene Apps zu jonglieren. Clevr vereint gemeinsame Einladungen, Essensabstimmungen, kollaborative Playlists, Kostenteilung und Gruppenchats in einer intuitiven Anwendung.",
      en: "Hosting usually requires juggling five different apps. Clevr combines shared invites, food/drink polls, collaborative playlists, expense splitting, and group chat into one seamless application.",
    },
    url: "https://clevr.social",
    image: "/rexity-omi/assets/it/img/app-clevr.jpg",
    logo: "/rexity-omi/assets/it/img/app-clevr-logo.png",
  },
  {
    slug: "levelkraft",
    name: "LevelKraft",
    subtitle: {
      de: "KI-gestützte Prüfungsvorbereitung für TELC & Goethe (A1–C2)",
      en: "AI-assisted TELC & Goethe exam preparation (A1–C2)",
    },
    category: {
      de: "EdTech & Voice AI",
      en: "EdTech & Voice AI",
    },
    metrics: [
      { label: { de: "Prüfungsstufen", en: "Exam Levels" }, value: "A1 – C2" },
      { label: { de: "Feedback-Tempo", en: "Feedback Speed" }, value: "< 2 Sek" },
    ],
    description: {
      de: "Vollständige Übungstests, sofortiges Feedback zu Sprechen und Schreiben sowie adaptives tägliches Training für Deutschprüfungen. Unterstützt Lernende zielgerichtet bei ihren individuellen Schwachstellen.",
      en: "Full practice tests, instant feedback on speaking and writing, and adaptive daily training for German language certificates. Helps learners target their exact weak points.",
    },
    url: "https://levelkraft.de",
    image: "/rexity-omi/assets/it/img/app-levelkraft.jpg",
    logo: "/rexity-omi/assets/it/img/app-levelkraft-logo.svg",
  },
  {
    slug: "save-and-fresh",
    name: "Save & Fresh",
    subtitle: {
      de: "Intelligente Lebensmittelverwaltung & gemeinsame Vorratsplanung",
      en: "Smart kitchen inventory & shared household meal planning",
    },
    category: {
      de: "Consumer SaaS & Household Automation",
      en: "Consumer SaaS & Household Automation",
    },
    metrics: [
      { label: { de: "Lebensmittelverlust", en: "Food Waste" }, value: "-60%" },
      { label: { de: "Sync-Geschwindigkeit", en: "Sync Speed" }, value: "Echtzeit" },
    ],
    description: {
      de: "Entwickelt gegen Lebensmittelverschwendung und Doppelkäufe. Ein gemeinsames Vorrats-Inventar für die ganze Familie: Vorräte auf einen Blick erkennen, Rezepte planen und eine synchrone Einkaufsliste führen.",
      en: "Built to fight food waste and double-buying. A shared pantry inventory for the whole household: track stored items at a glance, plan meals, and maintain a live shopping list.",
    },
    image: "/rexity-omi/assets/it/img/app-freshsave.jpg",
    logo: "/rexity-omi/assets/it/img/app-savefresh-logo.png",
  },
];

export const BENTO_SERVICES = [
  {
    id: "automation",
    isFlagship: true,
    href: "/automation",
    title: {
      de: "Automatisierung & KI-Agenten",
      en: "Automation & AI Agents",
    },
    tagline: {
      de: "Intelligente Assistenten & autonome Workflows",
      en: "Intelligent AI assistants & autonomous business workflows",
    },
    desc: {
      de: "Verbindung von KI-Agenten und Business-Systemen: Autonome WhatsApp-Beantwortung, Voice Intake, RAG-Chatbots und revisionssichere RPA-Abläufe.",
      en: "Connecting AI agents with enterprise tools: Autonomous WhatsApp replies, voice intake, retrieval-augmented chatbots, and audit-logged RPA workflows.",
    },
    chips: [
      { label: { de: "RPA & Prozessautomatisierung", en: "RPA & Process Automation" }, href: "/automation/rpa" },
      { label: { de: "WhatsApp-Agenten", en: "WhatsApp Agents" }, href: "/automation/whatsapp" },
      { label: { de: "Voice-Agenten", en: "Voice Agents" }, href: "/automation/voice", hasWaveform: true },
      { label: { de: "Website-Chatbots", en: "Website Chatbots" }, href: "/automation/chatbots" },
    ],
  },
  {
    id: "web",
    isFlagship: false,
    href: "/web",
    title: {
      de: "Web & Apps",
      en: "Web & Apps",
    },
    tagline: {
      de: "Digitale Produkte mit erstklassigem UI/UX",
      en: "Digital products built with senior design & stable backend",
    },
    desc: {
      de: "Von performanten Websites bis zu komplexen SaaS-Plattformen und nativen iOS/Android Apps.",
      en: "From high-conversion websites to complex SaaS platforms and mobile applications.",
    },
    chips: [
      { label: { de: "Webdesign", en: "Web Design" }, href: "/web/web-design" },
      { label: { de: "Web-Entwicklung", en: "Web Development" }, href: "/web/web-development" },
      { label: { de: "SaaS-Plattformen", en: "SaaS Platforms" }, href: "/web/saas" },
      { label: { de: "Mobile Apps", en: "Mobile Apps" }, href: "/web/mobile-apps" },
      { label: { de: "Dashboards & Reporting", en: "Dashboards & Reporting" }, href: "/web/dashboards" },
    ],
  },
  {
    id: "marketing",
    isFlagship: false,
    href: "/marketing",
    title: {
      de: "Digitales Marketing",
      en: "Digital Marketing",
    },
    tagline: {
      de: "Messbares digitales Wachstum & SEO",
      en: "Measurable digital growth & search visibility",
    },
    desc: {
      de: "Technisches SEO, KI-gestütztes Videomarketing und optimierte Content-Architekturen.",
      en: "Technical SEO audits, AI video production, and conversion-engineered content strategies.",
    },
    chips: [
      { label: { de: "SEO", en: "SEO" }, href: "/marketing/seo" },
      { label: { de: "Content & Social", en: "Content & Social" }, href: "/marketing/content" },
      { label: { de: "KI-Videomarketing", en: "AI Video Marketing" }, href: "/marketing/video" },
    ],
  },
  {
    id: "testing-support",
    isFlagship: false,
    href: "/testing-support",
    title: {
      de: "Testing & Support",
      en: "Testing & Support",
    },
    tagline: {
      de: "Revisionssichere QS & Dauerhafter Betrieb",
      en: "Production-grade QA & dependable maintenance",
    },
    desc: {
      de: "Automatisierte End-to-End Tests, DSGVO-Audits und verlässliche Wartung durch Senior-Entwickelnde.",
      en: "Automated E2E testing, GDPR compliance audits, and direct SLA maintenance support.",
    },
    chips: [
      { label: { de: "Automatisierte E2E-Tests", en: "Automated E2E Testing" }, href: "/testing-support" },
      { label: { de: "DSGVO-Compliance Audit", en: "GDPR Compliance Audit" }, href: "/testing-support" },
      { label: { de: "SLA & Wartung", en: "SLA & Maintenance" }, href: "/testing-support" },
    ],
  },
];

export const PROCESS_CONTENT = {
  monoTag: "METHODOLOGY · 14-21 DAY SCOPING WINDOW",
  badge: {
    de: "Der Prozess",
    en: "Our Process",
  },
  heading: {
    de: "In 3 Schritten von der Idee zum produktiven System",
    en: "From Idea to Production in 3 Simple Steps",
  },
  steps: [
    {
      num: "01",
      title: {
        de: "Verstehen & Scopen",
        en: "Understand & Scope",
      },
      desc: {
        de: "Wir analysieren Ihre Prozesse und definieren den kleinsten Umfang, der sofort messbaren Mehrwert liefert.",
        en: "We map your workflow bottlenecks and define the crispest scope that delivers immediate, measurable value.",
      },
    },
    {
      num: "02",
      title: {
        de: "Entwickeln & Integrieren",
        en: "Design, Build & Integrate",
      },
      desc: {
        de: "Seniore Entwicklung im 14–21 Tage Zeitfenster. DSGVO-konform, EU-gehostet und vollständig getestet.",
        en: "Senior engineering completed within a 14–21 day window. Fully GDPR-compliant, EU-hosted, and tested.",
      },
    },
    {
      num: "03",
      title: {
        de: "Optimieren & Skalieren",
        en: "Optimize & Scale",
      },
      desc: {
        de: "Nach dem Launch begleiten wir Ihr System mit Monitoring, Revisionsprotokollen und kontinuierlichen Updates.",
        en: "Post-launch, we maintain performance through automated monitoring, audit logging, and iterative enhancements.",
      },
    },
  ],
};

export const STATS_CONTENT = [
  {
    value: "14–21",
    unit: { de: "Tage", en: "Days" },
    label: {
      de: "Durchschnittlicher Umsetzungszeitraum",
      en: "Average scoped implementation window",
    },
  },
  {
    value: "100%",
    unit: "",
    label: {
      de: "DSGVO-konform & EU-gehostet",
      en: "GDPR-compliant & EU-hosted operation",
    },
  },
  {
    value: "24/7",
    unit: "",
    label: {
      de: "Autonome Reaktions- & Intake-Bereitschaft",
      en: "Autonomous intake & response readiness",
    },
  },
  {
    value: "Senior",
    unit: "",
    label: {
      de: "Direkter Kontakt zu den Entwickelnden",
      en: "Direct engagement with senior builders",
    },
  },
];

export const CTA_BAND_CONTENT = {
  heading: {
    de: "Lassen Sie uns Ihr Projekt unverbindlich abstecken",
    en: "Let's scope your next project together",
  },
  subline: {
    de: "Keine versteckten Preise, kein Verkaufsdruck. Wir analysieren Ihre Anforderungen und liefern eine ehrliche Einschätzung innerhalb von 24 Stunden.",
    en: "No hidden fees, no sales pressure. We evaluate your requirements and provide an honest scoped timeline within 24 hours.",
  },
  button: {
    de: "Jetzt E-Mail an hello@rexity.ai",
    en: "Email us at hello@rexity.ai",
  },
};
