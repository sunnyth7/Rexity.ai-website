import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, ChevronLeft, Sparkles } from "lucide-react";

export function generateStaticParams() {
  return [
    { sub: "web-design" },
    { sub: "web-development" },
    { sub: "saas" },
    { sub: "mobile-apps" },
    { sub: "dashboards" },
  ];
}

const subPageData: Record<
  string,
  {
    code: string;
    titleDe: string;
    titleEn: string;
    tagDe: string;
    tagEn: string;
    leadDe: string;
    leadEn: string;
    workIntroDe: string;
    workIntroEn: string;
    steps: { de: { title: string; desc: string }; en: { title: string; desc: string } }[];
    includedDe: string[];
    includedEn: string[];
    outcomesDe: string[];
    outcomesEn: string[];
    whoDe: string;
    whoEn: string;
    stack: string[];
    faqs: { qDe: string; aDe: string; qEn: string; aEn: string }[];
  }
> = {
  "web-design": {
    code: "01.1",
    titleDe: "Webdesign & Figma UI/UX",
    titleEn: "Web Design & Figma UI/UX",
    tagDe: "Markentreu, klar und konvertierend.",
    tagEn: "Brand-true, crisp and high-converting.",
    leadDe: "Von initialen Wireframes bis zum fertigen Designsystem in Figma. Wir gestalten digitale Oberflächen, die Vertrauen schaffen, schnell laden und Besucher in Kunden verwandeln.",
    leadEn: "From initial wireframes to a polished Figma design system. We craft interfaces that build trust, load instantly, and turn visitors into long-term clients.",
    workIntroDe: "Gutes Design entsteht durch Reduktion auf das Wesentliche, klare Typografie und durchdachte Nutzerführung.",
    workIntroEn: "Great design comes from focusing on the essentials, clean typography, and thoughtful user flow.",
    steps: [
      {
        de: { title: "Wireframing & Struktur", desc: "Erstellung klarer Seitenhierarchien und Content-Konzepte." },
        en: { title: "Wireframing & Structure", desc: "Establishing crisp page hierarchies and structured layout flows." },
      },
      {
        de: { title: "Figma Designsystem", desc: "Aufbau wiederverwendbarer Komponenten, Tokens und UI-Guides." },
        en: { title: "Figma Design System", desc: "Building reusable components, color tokens, and UI guidelines." },
      },
      {
        de: { title: "Prototyping & Micro-Interaktionen", desc: "Interaktive Klick-Prototypen zur Abstimmung aller Flows." },
        en: { title: "Prototyping & Micro-Interactions", desc: "Interactive click-through prototypes validating user journeys." },
      },
    ],
    includedDe: ["Figma Design-Dateien", "Mobile- & Desktop-Layouts", "Design Tokens", "Barrierearme Kontraste"],
    includedEn: ["Figma Design Files", "Mobile & Desktop Viewports", "Design Tokens", "Accessible Contrast Rules"],
    outcomesDe: ["Hohe Conversion-Rate", "Markentreuer Gesamtauftritt", "Schnelle Übergabe an die Entwicklung"],
    outcomesEn: ["Higher Conversion Rate", "Unified Brand Presence", "Seamless Handoff to Engineering"],
    whoDe: "Für Unternehmen, die ihren Online-Auftritt professionalisieren möchten.",
    whoEn: "For businesses looking to elevate their brand appearance.",
    stack: ["Figma", "Design Tokens", "Tailwind CSS", "Inter Font"],
    faqs: [
      {
        qDe: "Erhalten wir die Figma-Dateien vollständig?",
        aDe: "Ja, alle Figma-Komponenten und Quelldateien gehören nach Abschluss 100% Ihnen.",
        qEn: "Do we get full access to the Figma files?",
        aEn: "Yes, all components, variants, and source files belong 100% to you upon completion.",
      },
    ],
  },
  "web-development": {
    code: "01.2",
    titleDe: "Web-Entwicklung",
    titleEn: "Web Development",
    tagDe: "Moderne Webarchitektur auf Next.js 15 Basis.",
    tagEn: "Modern web architecture powered by Next.js 15.",
    leadDe: "Performante Frontend- und Backend-Entwicklung mit Next.js 15, React, TypeScript und Tailwind CSS — ohne veraltetes CMS-Gewicht.",
    leadEn: "High-performance frontend and backend engineering built with Next.js 15, React, TypeScript, and Tailwind CSS — free of legacy CMS bloat.",
    workIntroDe: "Schnelligkeit, Barrierefreiheit und saubere Codebasis sind die Grundlagen unserer Entwicklung.",
    workIntroEn: "Speed, accessibility, and clean codebase architecture are the foundation of our work.",
    steps: [
      {
        de: { title: "Architektur & Setup", desc: "Einrichtung von Next.js App Router, TypeScript und Linting." },
        en: { title: "Architecture & Setup", desc: "Configuring Next.js App Router, TypeScript, and strict linting." },
      },
      {
        de: { title: "Komponenten-Entwicklung", desc: "Umsetzung der UI-Komponenten in sauberem React." },
        en: { title: "Component Engineering", desc: "Building responsive UI components in modular React." },
      },
      {
        de: { title: "Performance-Optimierung", desc: "Erreichen bester Lighthouse-Scores für Core Web Vitals." },
        en: { title: "Performance Optimization", desc: "Achieving top Lighthouse scores for Core Web Vitals." },
      },
    ],
    includedDe: ["Next.js 15 App Router", "TypeScript Typensicherheit", "SEO-Optimierung", "CI/CD Deployment"],
    includedEn: ["Next.js 15 App Router", "TypeScript Type Safety", "SEO Optimization", "CI/CD Deployment"],
    outcomesDe: ["Ladezeiten unter 1 Sekunde", "Zukunftssichere Codebasis", "Einfache Erweiterbarkeit"],
    outcomesEn: ["Sub-second Page Loads", "Future-proof Codebase", "Easy Scalability"],
    whoDe: "Für Teams, die eine schnelle, wartbare Website ohne Altlasten benötigen.",
    whoEn: "For teams needing a fast, maintainable website built to last.",
    stack: ["Next.js 15", "React", "TypeScript", "Tailwind CSS", "Vercel"],
    faqs: [
      {
        qDe: "Bauen Sie auch individuelle Integrationen?",
        aDe: "Ja, wir binden APIs, Headless CMS oder CRM-Systeme direkt an.",
        qEn: "Do you build custom API integrations?",
        aEn: "Yes, we connect third-party APIs, headless CMS systems, and CRMs directly.",
      },
    ],
  },
  saas: {
    code: "01.3",
    titleDe: "SaaS-Plattformen",
    titleEn: "SaaS Platforms",
    tagDe: "Skalierbare Cloud-Software mit System.",
    tagEn: "Scalable cloud software engineered right.",
    leadDe: "Skalierbare SaaS-Produktarchitekturen mit Benutzerverwaltung, Rollenrechten, Abrechnungsintegration und sicheren APIs.",
    leadEn: "Scalable SaaS product architectures with multi-tenant auth, role permissions, billing sync, and secure APIs.",
    workIntroDe: "SaaS-Plattformen erfordern von Tag 1 an ein sicheres Datenmodell und sauberes API-Design.",
    workIntroEn: "SaaS platforms require a secure data model and clean API architecture from day one.",
    steps: [
      {
        de: { title: "Datenmodell & Auth", desc: "Entwurf von Datenbank-Schemata und Multi-Tenant Rechteverwaltung." },
        en: { title: "Data Model & Auth", desc: "Designing database schemas and multi-tenant permission controls." },
      },
      {
        de: { title: "API & Business-Logik", desc: "Entwicklung sicherer Backend-Endpoints und Integrationen." },
        en: { title: "API & Core Logic", desc: "Building secure backend endpoints and third-party syncs." },
      },
      {
        de: { title: "Frontend & Dashboard", desc: "Verbindung von React-Dashboards mit Echtzeit-Daten." },
        en: { title: "Frontend & Dashboard", desc: "Connecting responsive React dashboards with real-time data." },
      },
    ],
    includedDe: ["Multi-Tenant Rechteverwaltung", "Stripe/Billing Anbindung", "Audit Logging", "REST/GraphQL APIs"],
    includedEn: ["Multi-Tenant Permissions", "Stripe Billing Sync", "Audit Logging", "REST/GraphQL APIs"],
    outcomesDe: ["Verlässliche Mandantentrennung", "Hohe System-Verfügbarkeit", "Revisionssichere Datenhaltung"],
    outcomesEn: ["Reliable Tenant Isolation", "High Availability", "Auditable Data Protection"],
    whoDe: "Für B2B-Startups und etablierte Unternehmen, die Cloud-Software bauen.",
    whoEn: "For B2B founders and companies launching custom software products.",
    stack: ["Next.js", "PostgreSQL", "Prisma", "Stripe", "Docker"],
    faqs: [
      {
        qDe: "Ist die Datenhaltung DSGVO-konform?",
        aDe: "Ja, alle Daten werden in der EU-Region (z.B. Azure Germany West Central) gehostet.",
        qEn: "Is the data hosting GDPR compliant?",
        aEn: "Yes, all data resides strictly within EU regions (e.g. Azure Germany West Central).",
      },
    ],
  },
  "mobile-apps": {
    code: "01.4",
    titleDe: "Mobile Apps (iOS & Android)",
    titleEn: "Mobile Apps (iOS & Android)",
    tagDe: "Flüssig, intuitiv und immer griffbereit.",
    tagEn: "Fluid, intuitive, and always at hand.",
    leadDe: "Native und cross-platform Mobile Apps mit erstklassiger Performance, Offline-Unterstützung und nativer Geräteintegration.",
    leadEn: "Native and cross-platform mobile apps engineered for fluid performance, offline support, and device integration.",
    workIntroDe: "Mobile Apps müssen ab dem ersten Touch reagieren und auch ohne Netz stabil funktionieren.",
    workIntroEn: "Mobile apps need to respond instantly and operate reliably even offline.",
    steps: [
      {
        de: { title: "UX & App-Flows", desc: "Gestaltung touch-optimierter Bildschirme und Navigationspfade." },
        en: { title: "UX & App Flows", desc: "Designing touch-optimized screens and fluid navigation paths." },
      },
      {
        de: { title: "Cross-Platform Build", desc: "Entwicklung in React Native / Flutter für iOS und Android." },
        en: { title: "Cross-Platform Build", desc: "Developing in React Native / Flutter targeting iOS & Android." },
      },
      {
        de: { title: "Store Deployment", desc: "Vorbereitung und Einreichung im Apple App Store & Google Play Store." },
        en: { title: "Store Deployment", desc: "Preparing and publishing to Apple App Store & Google Play Store." },
      },
    ],
    includedDe: ["iOS & Android Support", "Push-Benachrichtigungen", "Offline-Sync", "App Store Release"],
    includedEn: ["iOS & Android Support", "Push Notifications", "Offline Sync", "App Store Release"],
    outcomesDe: ["Hohe Nutzerbindung", "Bewertungen im 4.8+ Bereich", "Einheitliche Codebasis"],
    outcomesEn: ["High User Retention", "4.8+ Store Rating Potential", "Single Codebase"],
    whoDe: "Für Unternehmen, die ihren Service direkt auf das Smartphone ihrer Kunden bringen wollen.",
    whoEn: "For brands looking to put their service directly on customer phones.",
    stack: ["React Native", "Expo", "TypeScript", "iOS", "Android"],
    faqs: [
      {
        qDe: "Unterstützen Sie auch Push-Benachrichtigungen?",
        aDe: "Ja, inklusive Segmentierung und automatisierter Auslösung.",
        qEn: "Do you support push notifications?",
        aEn: "Yes, including user segmentation and automated trigger flows.",
      },
    ],
  },
  dashboards: {
    code: "01.5",
    titleDe: "Dashboards & Reporting",
    titleEn: "Dashboards & Reporting",
    tagDe: "Das Geschäft auf einen Blick.",
    tagEn: "See the business at a glance.",
    leadDe: "KPI-, Operations- und Reporting-Dashboards, die wichtige Kennzahlen und Prozesse übersichtlich darstellen — damit Teams auf Basis von Evidenz entscheiden.",
    leadEn: "KPI, operations and reporting dashboards that present the metrics that matter — so teams decide on evidence, not gut feel.",
    workIntroDe: "Ein Dashboard ist nur nützlich, wenn die Zahlen vertrauenswürdig sind und die Ansicht eine echte Frage beantwortet.",
    workIntroEn: "A dashboard is only useful if numbers are trustworthy and answer real operational questions.",
    steps: [
      {
        de: { title: "Metrik-Definition", desc: "Identifikation der primären KPIs und Datenquellen." },
        en: { title: "Metric Definition", desc: "Identifying primary KPIs, data tables, and live sources." },
      },
      {
        de: { title: "Visualisierung", desc: "Gestaltung klarer Diagramme, Filter und Tabellenansichten." },
        en: { title: "Visualization", desc: "Designing clean charts, filtering systems, and tabular views." },
      },
      {
        de: { title: "Echtzeit-Anbindung", desc: "Integration von WebSocket oder Intervall-Sync für Live-Daten." },
        en: { title: "Real-time Sync", desc: "Integrating WebSockets or interval polling for live metric sync." },
      },
    ],
    includedDe: ["Interaktive Filter", "CSV/PDF Export", "Rollenbasierte Ansichten", "Echtzeit-Updates"],
    includedEn: ["Interactive Filters", "CSV/PDF Export", "Role-based Views", "Real-time Updates"],
    outcomesDe: ["Volle Transparenz über Prozesse", "Schnellere Entscheidungsfindung", "Zeitersparnis beim Berichtswesen"],
    outcomesEn: ["Full Process Visibility", "Faster Decision Making", "Hours Saved on Weekly Reports"],
    whoDe: "Für Führungskräfte und Operations-Teams mit komplexen Datenströmen.",
    whoEn: "For executives and operations leaders managing complex data streams.",
    stack: ["React", "Recharts", "Tailwind CSS", "PostgreSQL"],
    faqs: [
      {
        qDe: "Können wir Dashboards als PDF exportieren?",
        aDe: "Ja, automatischer PDF- und Excel-Export ist standardmäßig integriert.",
        qEn: "Can dashboards be exported to PDF?",
        aEn: "Yes, automated PDF and Excel exports are built in by default.",
      },
    ],
  },
};

export default async function WebSubPage({ params }: { params: Promise<{ sub: string }> }) {
  const { sub } = await params;
  const detail = subPageData[sub] || subPageData["web-design"];

  return (
    <div className="w-full bg-white space-y-0">
      {/* Hero Section */}
      <section className="bg-white pt-12 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#7C3AED]">
          <Link href="/" className="hover:underline">Home</Link> / 
          <Link href="/web" className="hover:underline">Web & Apps</Link> / 
          <span className="text-[#1E1B4B] font-bold">{detail.titleDe}</span>
        </div>

        <div className="space-y-4 max-w-3xl">
          <span className="font-mono text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
            {detail.code} · WEB & APPS
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1E1B4B]">{detail.titleDe}</h1>
          <p className="text-xl font-semibold text-[#7C3AED]">{detail.tagDe}</p>
          <p className="text-base sm:text-lg text-[#6B6690] leading-relaxed">{detail.leadDe}</p>
        </div>

        <div>
          <a
            href="mailto:hello@rexity.ai"
            className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-7 py-3 text-sm font-bold text-white hover:bg-[#5B21B6] transition-all shadow-sm"
          >
            <span>Projekt anfragen</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* How it works (--bg-tint) */}
      <section className="bg-[#F6F3FC] py-16 px-4 sm:px-6 lg:px-8 border-y border-[#E9E4F8]">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-[#7C3AED] uppercase tracking-wider">METHODIK</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1B4B]">So funktioniert&apos;s</h2>
            <p className="text-base text-[#6B6690] max-w-2xl">{detail.workIntroDe}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {detail.steps.map((st, i) => (
              <div key={i} className="rounded-2xl border border-[#E9E4F8] bg-white p-6 space-y-3 shadow-xs">
                <div className="w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>
                <h3 className="text-lg font-bold text-[#1E1B4B]">{st.de.title}</h3>
                <p className="text-sm text-[#6B6690] leading-relaxed">{st.de.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Included & Benefits (White) */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Included */}
          <div className="rounded-3xl border border-[#E9E4F8] bg-white p-8 space-y-6 shadow-xs">
            <h2 className="text-2xl font-bold text-[#1E1B4B]">Was dazugehört</h2>
            <ul className="space-y-3">
              {detail.includedDe.map((inc, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-[#1E1B4B] font-medium">
                  <CheckCircle className="h-5 w-5 text-[#7C3AED] flex-none" />
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Outcomes */}
          <div className="rounded-3xl border border-[#E9E4F8] bg-[#F6F3FC] p-8 space-y-6">
            <h2 className="text-2xl font-bold text-[#1E1B4B]">Was Sie bekommen</h2>
            <ul className="space-y-3">
              {detail.outcomesDe.map((out, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-[#1E1B4B] font-semibold">
                  <Sparkles className="h-5 w-5 text-[#7C3AED] flex-none" />
                  <span>{out}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Who it's for & Tech Stack (--bg-tint) */}
      <section className="bg-[#F6F3FC] py-16 px-4 sm:px-6 lg:px-8 border-y border-[#E9E4F8]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-[#E9E4F8] bg-white p-6 space-y-2">
            <span className="font-mono text-xs font-bold text-[#7C3AED] uppercase">FÜR WEN</span>
            <p className="text-base font-bold text-[#1E1B4B]">{detail.whoDe}</p>
          </div>

          <div className="rounded-2xl border border-[#E9E4F8] bg-white p-6 space-y-3">
            <span className="font-mono text-xs font-bold text-[#7C3AED] uppercase">TECHNOLOGIE</span>
            <div className="flex flex-wrap gap-2">
              {detail.stack.map((st, i) => (
                <span key={i} className="rounded-full border border-[#E9E4F8] bg-[#F6F3FC] px-3 py-1 text-xs font-bold text-[#1E1B4B]">
                  {st}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ & CTA (Violet Gradient Band) */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {detail.faqs.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#1E1B4B]">Häufige Fragen (FAQ)</h2>
              <div className="space-y-4">
                {detail.faqs.map((faq, i) => (
                  <div key={i} className="rounded-2xl border border-[#E9E4F8] bg-[#F6F3FC] p-6 space-y-2">
                    <h3 className="text-base font-bold text-[#1E1B4B]">{faq.qDe}</h3>
                    <p className="text-sm text-[#6B6690]">{faq.aDe}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-3xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white p-8 sm:p-12 text-center space-y-4 shadow-xl">
            <h2 className="text-2xl font-bold">Haben Sie ein konkretes Anliegen zu {detail.titleDe}?</h2>
            <p className="text-purple-100 max-w-lg mx-auto">
              Senden Sie uns eine kurze Nachricht. Wir antworten innerhalb von 24 Stunden mit einer ehrlichen Einschätzung.
            </p>
            <a
              href="mailto:hello@rexity.ai"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-[#1E1B4B] hover:bg-[#F6F3FC] transition-all"
            >
              <span>Jetzt E-Mail an hello@rexity.ai</span>
              <ArrowRight className="h-4 w-4 text-[#7C3AED]" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
