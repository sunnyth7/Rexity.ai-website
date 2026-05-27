export type Locale = "en" | "de"

export const LOCALES: Locale[] = ["en", "de"]

type Dict = Record<string, { en: string; de: string }>

export const t: Dict = {
  // Nav
  "nav.services": { en: "Services", de: "Leistungen" },
  "nav.about": { en: "About", de: "Über uns" },
  "nav.contact": { en: "Contact", de: "Kontakt" },
  "nav.cta": { en: "Start a project", de: "Projekt starten" },

  // Common
  "common.learnMore": { en: "Learn more", de: "Mehr erfahren" },
  "common.allServices": { en: "All services", de: "Alle Leistungen" },
  "common.backToServices": { en: "← All services", de: "← Alle Leistungen" },
  "common.otherServices": { en: "Other services", de: "Weitere Leistungen" },

  // Home
  "home.eyebrow": { en: "The AI build partner", de: "Der KI-Entwicklungspartner" },
  "home.hero.line1": { en: "Build. Automate. Grow.", de: "Bauen. Automatisieren. Wachsen." },
  "home.hero.line2": { en: "with AI.", de: "mit KI." },
  "home.hero.subtitle": {
    en: "Rexity is your end-to-end partner for websites, apps, AI automations, and AI-generated video at scale — backed by research, testing, and training so it all sticks.",
    de: "Rexity ist Ihr End-to-End-Partner für Websites, Apps, KI-Automatisierungen und KI-generierte Videos im großen Maßstab — gestützt auf Recherche, Tests und Schulungen, damit alles nachhaltig wirkt.",
  },
  "home.cta.start": { en: "Start a project", de: "Projekt starten" },
  "home.cta.explore": { en: "Explore services", de: "Leistungen entdecken" },
  "home.services.eyebrow": { en: "// What we do", de: "// Was wir tun" },
  "home.services.title": { en: "Eight services. One partner.", de: "Acht Leistungen. Ein Partner." },
  "home.process.eyebrow": { en: "// How we work", de: "// Wie wir arbeiten" },
  "home.process.title": {
    en: "Senior teams. Short cycles. Real outcomes.",
    de: "Erfahrene Teams. Kurze Zyklen. Echte Ergebnisse.",
  },
  "home.process.step1.title": { en: "Discover", de: "Entdecken" },
  "home.process.step1.body": {
    en: "We start with research and niche analysis — so we build the right thing for the right market.",
    de: "Wir starten mit Recherche und Nischen-Analyse — damit wir das Richtige für den richtigen Markt bauen.",
  },
  "home.process.step2.title": { en: "Build", de: "Entwickeln" },
  "home.process.step2.body": {
    en: "Design, engineer, and automate in tight loops. You see working software every week, not slideware.",
    de: "Design, Engineering und Automatisierung in engen Zyklen. Sie sehen jede Woche funktionierende Software, keine Folien.",
  },
  "home.process.step3.title": { en: "Grow", de: "Wachsen" },
  "home.process.step3.body": {
    en: "SEO, AI video at scale, and training to make sure the team — and the traffic — keep compounding.",
    de: "SEO, KI-Videos im großen Maßstab und Schulungen, damit das Team — und der Traffic — kontinuierlich wachsen.",
  },
  "home.finalCta.title": { en: "Have something to build?", de: "Haben Sie ein Projekt im Kopf?" },
  "home.finalCta.body": {
    en: "Tell us what you're trying to do. We'll come back with a plan, a timeline, and a price.",
    de: "Sagen Sie uns, was Sie vorhaben. Wir liefern Plan, Zeitrahmen und Preis.",
  },

  // Services index
  "services.eyebrow": { en: "// Services", de: "// Leistungen" },
  "services.title": {
    en: "Everything you need to ship, automate, and grow.",
    de: "Alles, was Sie zum Ausliefern, Automatisieren und Wachsen brauchen.",
  },
  "services.intro": {
    en: "Pick a line or combine them. We deliver as one team — research-led, engineered well, and accountable to outcomes.",
    de: "Wählen Sie eine Leistung oder kombinieren Sie sie. Wir liefern als ein Team — recherchegestützt, sauber entwickelt und ergebnisverantwortlich.",
  },

  // Service detail
  "service.deliver.eyebrow": { en: "// What we deliver", de: "// Was wir liefern" },
  "service.outcomes.eyebrow": { en: "// Outcomes", de: "// Ergebnisse" },
  "service.process.eyebrow": { en: "// Process", de: "// Vorgehen" },
  "service.stack.eyebrow": { en: "// Tech stack", de: "// Tech-Stack" },
  "service.faq.eyebrow": { en: "// Questions", de: "// Fragen" },
  "service.cta.title": { en: "Ready to scope this out?", de: "Bereit für ein erstes Scoping?" },
  "service.cta.body": {
    en: "Send us a short brief and we'll come back with a plan and a price.",
    de: "Senden Sie uns ein kurzes Briefing — wir antworten mit Plan und Preis.",
  },

  // About
  "about.eyebrow": { en: "// About", de: "// Über uns" },
  "about.title": {
    en: "We're the build partner for teams that want to ship.",
    de: "Wir sind der Entwicklungspartner für Teams, die ausliefern wollen.",
  },
  "about.intro": {
    en: "Rexity is a focused team of engineers, designers, and operators who build websites, apps, automations, and AI-generated content for businesses that need to move now.",
    de: "Rexity ist ein fokussiertes Team aus Ingenieuren, Designern und Operatoren, die Websites, Apps, Automatisierungen und KI-generierte Inhalte für Unternehmen entwickeln, die jetzt handeln müssen.",
  },
  "about.values.eyebrow": { en: "// What we believe", de: "// Woran wir glauben" },
  "about.value1.title": { en: "Outcomes over output", de: "Ergebnisse vor Output" },
  "about.value1.body": { en: "We don't bill by the slide. We measure what moved.", de: "Wir rechnen nicht nach Folien ab. Wir messen, was sich bewegt hat." },
  "about.value2.title": { en: "Senior, small, embedded", de: "Erfahren, klein, eingebettet" },
  "about.value2.body": { en: "Lean teams of operators. You talk to the people building it.", de: "Schlanke Teams von Machern. Sie sprechen direkt mit den Entwicklern." },
  "about.value3.title": { en: "AI-native, not AI-themed", de: "KI-nativ, nicht KI-Deko" },
  "about.value3.body": { en: "AI is in the workflow, not just the deck. That's how we move 10× faster.", de: "KI steckt im Workflow, nicht nur im Pitch. So sind wir 10× schneller." },
  "about.value4.title": { en: "Honest scope", de: "Ehrliches Scoping" },
  "about.value4.body": { en: "If something is a bad idea, we'll say so. If it's a great idea, we'll move on it today.", de: "Wenn etwas eine schlechte Idee ist, sagen wir das. Wenn es eine gute ist, fangen wir heute an." },
  "about.finalCta": { en: "Let's build something.", de: "Lassen Sie uns etwas bauen." },

  // Contact
  "contact.eyebrow": { en: "// Contact", de: "// Kontakt" },
  "contact.title": { en: "Let's get to work.", de: "An die Arbeit." },
  "contact.intro": {
    en: "Send a short brief. We reply within one business day with a plan, timeline, and price — not a sales call.",
    de: "Senden Sie ein kurzes Briefing. Wir antworten binnen eines Werktags mit Plan, Zeitplan und Preis — kein Verkaufsgespräch.",
  },
  "contact.email": { en: "Email", de: "E-Mail" },
  "contact.response": { en: "Response time", de: "Antwortzeit" },
  "contact.responseValue": { en: "Within 1 business day", de: "Innerhalb von 1 Werktag" },
  "contact.form.name": { en: "Name", de: "Name" },
  "contact.form.email": { en: "Email", de: "E-Mail" },
  "contact.form.company": { en: "Company", de: "Unternehmen" },
  "contact.form.service": { en: "Service of interest", de: "Gewünschte Leistung" },
  "contact.form.serviceNone": { en: "Not sure yet", de: "Noch unsicher" },
  "contact.form.message": { en: "What are you trying to build?", de: "Was möchten Sie bauen?" },
  "contact.form.messagePh": {
    en: "A short description of the project, timeline, and any constraints.",
    de: "Kurze Beschreibung des Projekts, Zeitplan und Rahmenbedingungen.",
  },
  "contact.form.submit": { en: "Send brief", de: "Briefing senden" },
  "contact.form.sending": { en: "Sending…", de: "Wird gesendet…" },
  "contact.success.title": { en: "Got it.", de: "Erhalten." },
  "contact.success.body": {
    en: "Thanks for reaching out. We'll be in touch within one business day.",
    de: "Danke für Ihre Nachricht. Wir melden uns binnen eines Werktags.",
  },
  "contact.success.again": { en: "Send another →", de: "Weitere senden →" },

  // Footer
  "footer.tagline": { en: "Build. Automate. Grow — with AI.", de: "Bauen. Automatisieren. Wachsen — mit KI." },
  "footer.services": { en: "Services", de: "Leistungen" },
  "footer.company": { en: "Company", de: "Unternehmen" },
  "footer.privacy": { en: "Privacy", de: "Datenschutz" },
  "footer.rights": { en: "All rights reserved.", de: "Alle Rechte vorbehalten." },
}

export function translate(key: string, locale: Locale): string {
  const entry = t[key]
  if (!entry) return key
  return entry[locale]
}
