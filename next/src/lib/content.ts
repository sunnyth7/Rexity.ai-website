export const SITE_CONFIG = {
  name: "Rexity Labs",
  email: "hello@rexity.ai",
  legalName: "Rexity Labs UG (haftungsbeschränkt)",
  hrb: "HRB 213911",
  court: "Amtsgericht Lüneburg",
  founder: "Sunny Thakur",
};

export const NAV_LINKS = [
  { href: "/web", label: { de: "Web & Apps", en: "Web & Apps" } },
  { href: "/automation", label: { de: "Automatisierung", en: "Automation" } },
  { href: "/marketing", label: { de: "Marketing", en: "Marketing" } },
  { href: "/work", label: { de: "Arbeiten", en: "Work" } },
  { href: "/services", label: { de: "Leistungen", en: "Services" } },
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
  badge: {
    de: "AI-Native Software Studio · EU-Gehostet",
    en: "AI-Native Software Studio · EU-Hosted",
  },
  promise: {
    de: "Verstehen. Bauen. Automatisieren.",
    en: "Understand. Build. Automate.",
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

export const PROCESS_CONTENT = {
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

export const SERVICES_CONTENT = [
  {
    id: "web-app",
    href: "/web",
    title: {
      de: "Web & App Entwicklung",
      en: "Web & App Development",
    },
    desc: {
      de: "Moderne Websites, SaaS-Plattformen und mobile Anwendungen für iOS & Android. Schnelles Frontend, stabiles Backend.",
      en: "Modern websites, SaaS platforms, and mobile apps for iOS & Android. Blazing fast frontend and scalable backend.",
    },
    tags: ["Next.js", "React Native", "UI/UX Figma", "SaaS Architecture"],
  },
  {
    id: "ai-agents",
    href: "/automation",
    title: {
      de: "AI Agents (Chat, WhatsApp, Voice)",
      en: "AI Agents (Chat, WhatsApp, Voice)",
    },
    desc: {
      de: "Intelligente Assistenten, die Kundenanfragen beantworten, Leads qualifizieren und Prozesse autonom vorbereiten.",
      en: "Intelligent assistants that answer customer questions, qualify leads, and prepare workflows autonomously.",
    },
    tags: ["RAG Databank", "WhatsApp Bot", "Voice Intake", "EU Data Zone"],
  },
  {
    id: "automations",
    href: "/automation",
    title: {
      de: "Geschäftsprozess-Automatisierung & RPA",
      en: "Business Process Automation & RPA",
    },
    desc: {
      de: "Verbindung von CRM, Buchhaltung, WhatsApp und internen Tools zur Eliminierung manueller Dateneingaben.",
      en: "Connecting your CRM, accounting, messaging, and internal databases to eliminate manual data entry.",
    },
    tags: ["Workflow Mapping", "CRM Sync", "n8n / Zapier", "Audit Logs"],
  },
  {
    id: "testing-support",
    href: "/testing-support",
    title: {
      de: "Testing, QA & Maintenance Support",
      en: "Testing, QA & Maintenance Support",
    },
    desc: {
      de: "Revisionssichere Qualitätssicherung, automatisierte Tests und verlässlicher Langzeit-Support für Ihre Software.",
      en: "Production-grade QA, automated end-to-end testing, and dependable long-term maintenance support.",
    },
    tags: ["End-to-End Testing", "Performance Audits", "DSGVO Checks", "SLA Support"],
  },
  {
    id: "marketing",
    href: "/marketing",
    title: {
      de: "Digital Marketing & Content Workflows",
      en: "Digital Marketing & Content Workflows",
    },
    desc: {
      de: "Technisches SEO, KI-gestützte Videoproduktion und datenbasierte Akquise-Pipelinedesigns.",
      en: "Technical SEO audits, AI-assisted video workflows, and structured digital acquisition pipelines.",
    },
    tags: ["Technical SEO", "AI Video Scripts", "Content Maps", "Conversion Design"],
  },
];

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
