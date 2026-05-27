import {
  Code2,
  Smartphone,
  Workflow,
  Search,
  LineChart,
  ShieldCheck,
  Clapperboard,
  GraduationCap,
  type LucideIcon,
} from "lucide-react"
import type { Locale } from "@/lib/i18n/dict"

type Bi = { en: string; de: string }

export type Service = {
  slug: string
  code: string // HUD-style code like "SVC.01"
  icon: LucideIcon
  title: Bi
  tagline: Bi
  summary: Bi
  offerings: { en: string[]; de: string[] }
  outcomes: { en: string[]; de: string[] }
  process: { title: Bi; body: Bi }[]
  stack: string[]
  faqs: { q: Bi; a: Bi }[]
}

export const SERVICES: Service[] = [
  {
    slug: "website-development",
    code: "SVC.01",
    icon: Code2,
    title: { en: "Website Development", de: "Website-Entwicklung" },
    tagline: { en: "Sites that ship, scale, and sell.", de: "Websites, die liefern, skalieren und verkaufen." },
    summary: {
      en: "Production-grade business websites and SaaS platforms with end-to-end frontend, backend, and AI chatbot integration.",
      de: "Produktionsreife Business-Websites und SaaS-Plattformen mit End-to-End-Frontend, -Backend und integrierten KI-Chatbots.",
    },
    offerings: {
      en: ["Business websites", "SaaS platforms", "Full backend and frontend integration", "Chatbot integration"],
      de: ["Business-Websites", "SaaS-Plattformen", "Vollständige Backend- und Frontend-Integration", "Chatbot-Integration"],
    },
    outcomes: {
      en: ["Fast, SEO-ready Next.js builds", "Clean APIs and managed databases", "AI chat baked into the product surface"],
      de: ["Schnelle, SEO-fertige Next.js-Builds", "Saubere APIs und gemanagte Datenbanken", "KI-Chat direkt im Produkt"],
    },
    process: [
      { title: { en: "Discovery & wireframes", de: "Discovery & Wireframes" }, body: { en: "We map flows, content, and integrations before a pixel moves.", de: "Wir kartieren Flows, Inhalte und Integrationen, bevor ein Pixel gesetzt wird." } },
      { title: { en: "Design & build", de: "Design & Build" }, body: { en: "Componentized UI, real CMS, real database. Reviewable every week.", de: "Komponentenbasiertes UI, echtes CMS, echte Datenbank. Wöchentlich review-fähig." } },
      { title: { en: "Launch & iterate", de: "Launch & Iterieren" }, body: { en: "Ship, instrument, and improve based on real traffic.", de: "Ausliefern, messen und auf Basis echter Daten verbessern." } },
    ],
    stack: ["Next.js", "TypeScript", "Tailwind", "Prisma", "Postgres", "Vercel", "OpenAI", "Anthropic"],
    faqs: [
      { q: { en: "How long does a typical website take?", de: "Wie lange dauert eine typische Website?" }, a: { en: "Marketing sites: 2–4 weeks. SaaS platforms: 6–12 weeks for v1.", de: "Marketing-Sites: 2–4 Wochen. SaaS-Plattformen: 6–12 Wochen für v1." } },
      { q: { en: "Do you handle hosting?", de: "Übernehmen Sie das Hosting?" }, a: { en: "Yes. Vercel + Neon is our default. We can deploy anywhere.", de: "Ja. Vercel + Neon ist Standard. Wir deployen aber überall." } },
    ],
  },
  {
    slug: "apps",
    code: "SVC.02",
    icon: Smartphone,
    title: { en: "Mobile Apps", de: "Mobile Apps" },
    tagline: { en: "Native and cross-platform, built to last.", de: "Nativ und plattformübergreifend, gebaut für die Dauer." },
    summary: {
      en: "Android and iOS development across every domain — designed in Figma, engineered in Kotlin, React Native, and Next.js where it fits.",
      de: "Android- und iOS-Entwicklung in jeder Domäne — in Figma designt, in Kotlin, React Native und Next.js entwickelt, wo es passt.",
    },
    offerings: {
      en: ["Native Android (Kotlin)", "Native iOS", "Cross-platform builds", "Figma design systems"],
      de: ["Natives Android (Kotlin)", "Natives iOS", "Cross-Platform-Builds", "Figma-Designsysteme"],
    },
    outcomes: {
      en: ["App-store ready releases", "Design systems that survive v2", "Backends that don't fall over"],
      de: ["App-Store-fertige Releases", "Designsysteme, die v2 überleben", "Backends, die nicht umkippen"],
    },
    process: [
      { title: { en: "UX & prototype", de: "UX & Prototyp" }, body: { en: "Clickable Figma prototype before any code.", de: "Klickbarer Figma-Prototyp vor jedem Code." } },
      { title: { en: "Native build", de: "Native Entwicklung" }, body: { en: "Kotlin/Swift for native, React Native where it pays off.", de: "Kotlin/Swift für nativ, React Native wo es sich lohnt." } },
      { title: { en: "Store submission", de: "Store-Einreichung" }, body: { en: "Compliance, screenshots, listing copy — handled.", de: "Compliance, Screenshots, Listing-Texte — alles inklusive." } },
    ],
    stack: ["Kotlin", "Swift", "React Native", "Expo", "Figma", "Firebase", "Supabase"],
    faqs: [
      { q: { en: "Native or cross-platform?", de: "Nativ oder Cross-Platform?" }, a: { en: "Depends on the product. We'll recommend based on performance and team.", de: "Hängt vom Produkt ab. Wir empfehlen basierend auf Performance und Team." } },
    ],
  },
  {
    slug: "business-process-automation",
    code: "SVC.03",
    icon: Workflow,
    title: { en: "Business Process Automation", de: "Geschäftsprozess-Automatisierung" },
    tagline: { en: "Stop paying humans to do robot work.", de: "Keine Menschen mehr für Roboter-Arbeit bezahlen." },
    summary: {
      en: "Automate the conversations, calls, and workflows that eat your team's day — from cloud reception to WhatsApp.",
      de: "Automatisieren Sie Gespräche, Anrufe und Workflows, die Ihrem Team den Tag fressen — von Cloud-Empfang bis WhatsApp.",
    },
    offerings: {
      en: ["VoIP7 online cloud receptionist", "WhatsApp for Business automation", "Internal workflow automations"],
      de: ["VoIP7 Online-Cloud-Empfang", "WhatsApp Business-Automatisierung", "Interne Workflow-Automatisierungen"],
    },
    outcomes: {
      en: ["24/7 answer rate without 24/7 staffing", "Faster response, lower cost per ticket", "Auditable, repeatable processes"],
      de: ["24/7-Erreichbarkeit ohne 24/7-Personal", "Schnellere Reaktion, geringere Kosten pro Ticket", "Auditierbare, wiederholbare Prozesse"],
    },
    process: [
      { title: { en: "Process audit", de: "Prozess-Audit" }, body: { en: "We map what your team does manually today.", de: "Wir kartieren, was Ihr Team heute manuell erledigt." } },
      { title: { en: "Automate", de: "Automatisieren" }, body: { en: "Cloud receptionist, WhatsApp flows, CRM glue.", de: "Cloud-Empfang, WhatsApp-Flows, CRM-Verbindungen." } },
      { title: { en: "Measure & expand", de: "Messen & Ausweiten" }, body: { en: "Track time saved. Scale what works.", de: "Zeitersparnis messen. Skalieren, was funktioniert." } },
    ],
    stack: ["VoIP7", "WhatsApp Business API", "n8n", "Twilio", "Zapier", "HubSpot", "Salesforce"],
    faqs: [
      { q: { en: "Is WhatsApp automation compliant?", de: "Ist WhatsApp-Automatisierung konform?" }, a: { en: "Yes — we use the official WhatsApp Business API with opt-in flows.", de: "Ja — wir nutzen die offizielle WhatsApp Business API mit Opt-in." } },
    ],
  },
  {
    slug: "seo",
    code: "SVC.04",
    icon: Search,
    title: { en: "SEO", de: "SEO" },
    tagline: { en: "Traffic that compounds.", de: "Traffic, der sich aufbaut." },
    summary: {
      en: "Technical SEO, content, and link strategy that turns your site into a durable acquisition channel.",
      de: "Technisches SEO, Content und Link-Strategie, die Ihre Site zu einem dauerhaften Akquise-Kanal machen.",
    },
    offerings: {
      en: ["Technical SEO audits", "Content and keyword strategy", "Authority and link building"],
      de: ["Technische SEO-Audits", "Content- und Keyword-Strategie", "Authority- und Linkaufbau"],
    },
    outcomes: {
      en: ["Higher rankings on the queries that matter", "Compounding organic traffic", "Lower blended CAC over time"],
      de: ["Bessere Rankings bei relevanten Suchanfragen", "Wachsender organischer Traffic", "Niedrigere CAC über Zeit"],
    },
    process: [
      { title: { en: "Audit", de: "Audit" }, body: { en: "Crawl, ranks, gaps, opportunities.", de: "Crawl, Rankings, Lücken, Chancen." } },
      { title: { en: "Fix & publish", de: "Fixen & Publizieren" }, body: { en: "Technical fixes plus a 12-week content plan.", de: "Technische Fixes plus 12-Wochen-Content-Plan." } },
      { title: { en: "Compound", de: "Aufbauen" }, body: { en: "Earn authority through links and depth.", de: "Authority aufbauen durch Links und Tiefe." } },
    ],
    stack: ["Ahrefs", "Semrush", "Screaming Frog", "Google Search Console", "Looker Studio"],
    faqs: [
      { q: { en: "When will I see results?", de: "Wann sehe ich Ergebnisse?" }, a: { en: "Technical wins in weeks. Content-driven traffic in 3–6 months.", de: "Technische Gewinne in Wochen. Content-Traffic in 3–6 Monaten." } },
    ],
  },
  {
    slug: "research-and-analysis",
    code: "SVC.05",
    icon: LineChart,
    title: { en: "Research & Analysis", de: "Recherche & Analyse" },
    tagline: { en: "Pick the right fight before you swing.", de: "Den richtigen Kampf wählen, bevor man zuschlägt." },
    summary: {
      en: "Niche identification, preliminary studies, and decision support so you build the right thing for the right market.",
      de: "Nischen-Identifikation, Vorstudien und Entscheidungsunterstützung — damit Sie das Richtige für den richtigen Markt bauen.",
    },
    offerings: {
      en: ["Niche identification", "Preliminary market studies", "Analysis and decision support"],
      de: ["Nischen-Identifikation", "Vorab-Marktstudien", "Analyse und Entscheidungsunterstützung"],
    },
    outcomes: {
      en: ["Clarity on where to play", "Evidence-backed go/no-go calls", "A defensible point of view"],
      de: ["Klarheit, wo man spielt", "Evidenzbasierte Go/No-Go-Entscheidungen", "Eine verteidigbare Position"],
    },
    process: [
      { title: { en: "Scope", de: "Scope" }, body: { en: "Define the question we're actually answering.", de: "Die eigentliche Frage definieren." } },
      { title: { en: "Research", de: "Recherche" }, body: { en: "Desk research, customer signals, competitor teardowns.", de: "Schreibtisch-Recherche, Kundensignale, Wettbewerbsanalyse." } },
      { title: { en: "Decide", de: "Entscheiden" }, body: { en: "A short, opinionated report with recommendations.", de: "Ein kurzer, pointierter Report mit Empfehlungen." } },
    ],
    stack: ["Notion", "Perplexity", "Claude", "GPT", "SimilarWeb", "Statista"],
    faqs: [
      { q: { en: "How is this different from a consulting deck?", de: "Wie unterscheidet sich das von Berater-Folien?" }, a: { en: "Shorter, sharper, and we'll help you act on it.", de: "Kürzer, schärfer, und wir helfen Ihnen, danach zu handeln." } },
    ],
  },
  {
    slug: "testing-and-support",
    code: "SVC.06",
    icon: ShieldCheck,
    title: { en: "Testing & Support", de: "Testing & Support" },
    tagline: { en: "Ship without holding your breath.", de: "Ausliefern, ohne die Luft anzuhalten." },
    summary: {
      en: "End-to-end app testing and post-launch support so releases land cleanly and stay healthy.",
      de: "End-to-End-App-Testing und Post-Launch-Support — damit Releases sauber landen und gesund bleiben.",
    },
    offerings: {
      en: ["Functional and regression testing", "Device, OS, and platform coverage", "Post-launch monitoring and support"],
      de: ["Funktions- und Regressionstests", "Geräte-, OS- und Plattform-Abdeckung", "Post-Launch-Monitoring und Support"],
    },
    outcomes: {
      en: ["Fewer rollback fire drills", "Higher store ratings", "Predictable release cadence"],
      de: ["Weniger Rollback-Stress", "Bessere Store-Bewertungen", "Planbarer Release-Rhythmus"],
    },
    process: [
      { title: { en: "Test plan", de: "Testplan" }, body: { en: "Coverage matrix tied to your real users.", de: "Coverage-Matrix anhand echter Nutzer." } },
      { title: { en: "Execute", de: "Ausführen" }, body: { en: "Manual + automated across devices and OS versions.", de: "Manuell + automatisiert über Geräte und OS-Versionen." } },
      { title: { en: "Support", de: "Support" }, body: { en: "Ongoing monitoring and triage after launch.", de: "Laufendes Monitoring und Triage nach dem Launch." } },
    ],
    stack: ["Playwright", "Cypress", "Detox", "BrowserStack", "Sentry", "Datadog"],
    faqs: [
      { q: { en: "Can you take over an existing app?", de: "Können Sie eine bestehende App übernehmen?" }, a: { en: "Yes. We start with a 1-week audit before recommending next steps.", de: "Ja. Wir starten mit einem 1-wöchigen Audit, bevor wir nächste Schritte empfehlen." } },
    ],
  },
  {
    slug: "marketing",
    code: "SVC.07",
    icon: Clapperboard,
    title: { en: "AI Video Marketing", de: "KI-Videomarketing" },
    tagline: { en: "Marketing video at the speed of AI.", de: "Marketingvideo im Tempo der KI." },
    summary: {
      en: "Produce campaign-grade video at scale — avatars, realistic AI shots, and short-form edits — without a film crew.",
      de: "Kampagnenreife Videos im großen Maßstab — Avatare, realistische KI-Shots und Short-Form-Edits — ohne Filmcrew.",
    },
    offerings: {
      en: ["AI video marketing at scale", "Marketing video campaigns", "Digital avatar videos", "Realistic AI-generated videos", "YouTube-style short edits"],
      de: ["KI-Videomarketing im großen Maßstab", "Marketing-Videokampagnen", "Digitale Avatar-Videos", "Realistische KI-generierte Videos", "YouTube-Style Short-Edits"],
    },
    outcomes: {
      en: ["10× output for the same budget", "On-brand creative, every time", "Faster test-and-learn loops"],
      de: ["10× Output bei gleichem Budget", "Markenkonforme Creatives, jedes Mal", "Schnellere Test-and-Learn-Zyklen"],
    },
    process: [
      { title: { en: "Concept", de: "Konzept" }, body: { en: "Hooks, scripts, and shotlists tuned to the platform.", de: "Hooks, Skripte und Shotlists, abgestimmt auf die Plattform." } },
      { title: { en: "Generate", de: "Generieren" }, body: { en: "Avatars, b-roll, voiceover — produced with AI tooling.", de: "Avatare, B-Roll, Voiceover — produziert mit KI-Tools." } },
      { title: { en: "Edit & ship", de: "Schnitt & Launch" }, body: { en: "Final edits, captions, A/B variants, scheduled posting.", de: "Finaler Schnitt, Captions, A/B-Varianten, geplantes Posting." } },
    ],
    stack: ["HeyGen", "Synthesia", "Runway", "Veo", "ElevenLabs", "CapCut", "Descript"],
    faqs: [
      { q: { en: "Will it look fake?", de: "Sieht es künstlich aus?" }, a: { en: "Modern AI video is good. We mix AI with real footage where needed.", de: "Moderne KI-Videos sind gut. Wir mischen KI mit echtem Material, wenn nötig." } },
    ],
  },
  {
    slug: "trainings",
    code: "SVC.08",
    icon: GraduationCap,
    title: { en: "Trainings", de: "Schulungen" },
    tagline: { en: "Upskill your team, in weeks not quarters.", de: "Team-Upskilling in Wochen, nicht Quartalen." },
    summary: {
      en: "Hands-on programs covering GenAI fundamentals, AI for coding, and applied AI for working teams.",
      de: "Praxisorientierte Programme zu GenAI-Grundlagen, KI fürs Coden und angewandter KI für Teams.",
    },
    offerings: {
      en: ["GenAI fundamentals", "AI for coding", "Basics of AI", "Custom corporate workshops"],
      de: ["GenAI-Grundlagen", "KI fürs Coden", "Grundlagen der KI", "Maßgeschneiderte Firmen-Workshops"],
    },
    outcomes: {
      en: ["Teams that actually use AI day-to-day", "Practitioner-level fluency", "Measurable productivity lift"],
      de: ["Teams, die KI wirklich täglich nutzen", "Praktiker-Niveau", "Messbare Produktivitätssteigerung"],
    },
    process: [
      { title: { en: "Assess", de: "Bewerten" }, body: { en: "Skill baseline and target outcomes.", de: "Skill-Baseline und Zielergebnisse." } },
      { title: { en: "Train", de: "Schulen" }, body: { en: "Live sessions plus hands-on labs.", de: "Live-Sessions plus praktische Labs." } },
      { title: { en: "Embed", de: "Verankern" }, body: { en: "Playbooks and follow-up so it sticks.", de: "Playbooks und Follow-up, damit es nachhaltig wirkt." } },
    ],
    stack: ["Claude", "ChatGPT", "Cursor", "GitHub Copilot", "n8n"],
    faqs: [
      { q: { en: "Onsite or remote?", de: "Vor Ort oder remote?" }, a: { en: "Both. Most clients pick a hybrid format.", de: "Beides. Die meisten Kunden wählen ein hybrides Format." } },
    ],
  },
]

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug)
}

export function bi<T>(b: { en: T; de: T }, locale: Locale): T {
  return b[locale]
}
