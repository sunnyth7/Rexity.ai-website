import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, ChevronLeft, Sparkles } from "lucide-react";

export function generateStaticParams() {
  return [
    { sub: "seo" },
    { sub: "content" },
    { sub: "video" },
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
  seo: {
    code: "03.1",
    titleDe: "SEO & Suchmaschinenoptimierung",
    titleEn: "SEO & Search Engine Optimization",
    tagDe: "Traffic, der sich aufbaut.",
    tagEn: "Traffic that compounds.",
    leadDe: "Technisches SEO, Content und Link-Strategie, die Ihre Site zu einem dauerhaften Akquise-Kanal machen — bessere Rankings bei relevanten Suchanfragen.",
    leadEn: "Technical SEO, content and link strategy that turns your site into a durable acquisition channel — higher rankings on the queries that matter.",
    workIntroDe: "Rankings folgen, wenn die technische Basis stimmt, die Inhalte zur echten Suchabsicht passen und man anhand der Daten weiter verbessert.",
    workIntroEn: "Rankings compound when technical vitals match real search intent and content is structured.",
    steps: [
      {
        de: { title: "Technisches Audit", desc: "Prüfung von Ladezeiten, Core Web Vitals und Indexierung." },
        en: { title: "Technical Audit", desc: "Auditing page speeds, Core Web Vitals, and indexation rules." },
      },
      {
        de: { title: "Keyword- & Cluster-Map", desc: "Recherche relevanter Suchbegriffe mit hoher Kaufabsicht." },
        en: { title: "Keyword & Cluster Mapping", desc: "Researching high-intent search terms and topic clusters." },
      },
      {
        de: { title: "On-Page & Struktur", desc: "Optimierung von ULRs, Heading-Strukturen und Schema-Markup." },
        en: { title: "On-Page & Structure", desc: "Optimizing URLs, heading hierarchies, and JSON-LD schema." },
      },
    ],
    includedDe: ["Technischer SEO-Check", "Keyword-Architektur", "Schema-Org Markup", "Ranking-Monitoring"],
    includedEn: ["Technical SEO Check", "Keyword Architecture", "Schema Org Markup", "Rank Tracking"],
    outcomesDe: ["Nachhaltiger organischer Traffic", "Höhere Conversions", "Mehr Autorität bei Google"],
    outcomesEn: ["Compounding Organic Traffic", "Higher Conversion Rates", "Enhanced Search Authority"],
    whoDe: "Für Unternehmen, die ihre Kundenakquise unabhängig von bezahlten Werbeanzeigen machen wollen.",
    whoEn: "For companies aiming to reduce ad dependence through organic reach.",
    stack: ["Google Search Console", "Screaming Frog", "Ahrefs", "Schema.org"],
    faqs: [
      {
        qDe: "Wie lange dauert es, bis SEO-Ergebnisse sichtbar werden?",
        aDe: "Erste technische Verbesserungen wirken sofort, spürbare Ranking-Gewinne stellen sich nach 4–8 Wochen ein.",
        qEn: "How long until SEO results show up?",
        aEn: "Technical fixes take effect immediately, while ranking gains compound over 4–8 weeks.",
      },
    ],
  },
  content: {
    code: "03.2",
    titleDe: "Content & Social Strategie",
    titleEn: "Content & Social Strategy",
    tagDe: "Dort auftauchen, wo Ihre Kunden scrollen.",
    tagEn: "Show up where your customers scroll.",
    leadDe: "Eine Content-Maschine — Artikel, Social Posts und Creatives — die Ihre Marke sichtbar und Ihre Pipeline warm hält, geplant und produziert im festen Rhythmus.",
    leadEn: "A content engine — articles, social posts and creative — that keeps your brand visible and your pipeline warm, planned and produced on a steady cadence.",
    workIntroDe: "Konsistenter, markentreuer Content schlägt gelegentliche Ausbrüche. Wir planen ihn, erstellen ihn und lernen aus dem, was ankommt.",
    workIntroEn: "Consistent, on-brand content beats occasional bursts. We plan, execute, and iterate based on performance.",
    steps: [
      {
        de: { title: "Redaktionsplan", desc: "Entwicklung eines Themen- und Veröffentlichungskalenders." },
        en: { title: "Editorial Calendar", desc: "Building a recurring topic map and publication schedule." },
      },
      {
        de: { title: "Content-Produktion", desc: "Erstellung von Fachartikeln, LinkedIn-Posts und Newslettern." },
        en: { title: "Content Production", desc: "Drafting expert articles, LinkedIn posts, and newsletter editions." },
      },
      {
        de: { title: "Performance-Analyse", desc: "Auswertung von Impressionen, Clicks und Lead-Attribution." },
        en: { title: "Performance Analysis", desc: "Tracking impressions, engagement, and direct lead attribution." },
      },
    ],
    includedDe: ["Redaktionskalender", "B2B-Artikel & Leitfäden", "Social Media Posts", "Visual Branding"],
    includedEn: ["Editorial Calendar", "B2B Articles & Guides", "Social Media Posts", "Visual Branding"],
    outcomesDe: ["Gesteigerte Markenbekanntheit", "Positionierung als Branchen-Experte", "Warme Inbound-Pipeline"],
    outcomesEn: ["Increased Brand Authority", "Industry Thought Leadership", "Warm Inbound Pipeline"],
    whoDe: "Für B2B-Unternehmen, die qualifizierte Inbound-Anfragen aufbauen wollen.",
    whoEn: "For B2B brands looking to build an inbound authority engine.",
    stack: ["Notion", "Figma", "LinkedIn", "Ghost", "Mailchimp"],
    faqs: [
      {
        qDe: "Schreiben Ihre Texter die Artikel selbst?",
        aDe: "Ja, fachlich fundierte Texte werden von erfahrenen Textern verfasst und KI-gestützt recherchiert.",
        qEn: "Do human writers create the content?",
        aEn: "Yes, articles are authored by experienced copywriters supported by AI research tools.",
      },
    ],
  },
  video: {
    code: "03.3",
    titleDe: "KI-Videomarketing",
    titleEn: "AI Video Marketing",
    tagDe: "Kampagnenreifes Video ohne Filmcrew.",
    tagEn: "Campaign-grade video without a film crew.",
    leadDe: "Marketingvideo im großen Maßstab produzieren — Avatare, realistische KI-Shots und Short-Form-Edits — für mehr markenkonforme Creatives bei gleichem Budget.",
    leadEn: "Produce marketing video at scale — avatars, realistic AI shots and short-form edits — so you get more on-brand creative for the same budget.",
    workIntroDe: "Ein kurzes, gut gemachtes Video gewinnt Aufmerksamkeit. Wir bringen Ihre Botschaft vom Skript in die Formate, die jede Plattform braucht.",
    workIntroEn: "Short, high-impact video earns attention. We format scripts into platform-ready cuts.",
    steps: [
      {
        de: { title: "Skript & Storyboard", desc: "Entwicklung prägnanter Hooks und Sprechtexte." },
        en: { title: "Script & Storyboard", desc: "Crafting tight hooks and engaging video scripts." },
      },
      {
        de: { title: "KI-Generierung", desc: "Erzeugung von Sprachspuren, Avataren und B-Roll Clips." },
        en: { title: "AI Generation", desc: "Generating synthetic voice tracks, avatars, and B-roll visuals." },
      },
      {
        de: { title: "Short-Form Cut", desc: "Schnitt im 9:16 Format mit Untertiteln für TikTok, Reels & Shorts." },
        en: { title: "Short-Form Cut", desc: "Cutting 9:16 videos with animated captions for TikTok, Reels & Shorts." },
      },
    ],
    includedDe: ["Skripterstellung", "KI-Sprecher & Avatare", "Short-Form Edits (9:16)", "Dynamische Untertitel"],
    includedEn: ["Scriptwriting", "AI Avatars & Voiceovers", "Short-Form Edits (9:16)", "Dynamic Captions"],
    outcomesDe: ["10-fache Video-Ausstoßmenge", "Hohe Retention auf Social Media", "Drastisch reduzierte Produktionskosten"],
    outcomesEn: ["10x Higher Video Output", "High Social Media Retention", "Significantly Reduced Production Cost"],
    whoDe: "Für Marketingteams, die Social Media mit hochfrequentem Video bespielen wollen.",
    whoEn: "For marketing teams wanting high-volume video content across channels.",
    stack: ["HeyGen", "ElevenLabs", "CapCut", "Premiere Pro"],
    faqs: [
      {
        qDe: "Können wir unsere eigenen Gesichter als KI-Avatar nutzen?",
        aDe: "Ja, wir können digitale Klone Ihres eigenen Teams erstellen.",
        qEn: "Can we use our own team members as avatars?",
        aEn: "Yes, we can create custom digital avatar clones of your key team members.",
      },
    ],
  },
};

export default async function MarketingSubPage({ params }: { params: Promise<{ sub: string }> }) {
  const { sub } = await params;
  const detail = subPageData[sub] || subPageData["seo"];

  return (
    <div className="w-full bg-white space-y-0">
      {/* Hero Section */}
      <section className="bg-white pt-12 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#7C3AED]">
          <Link href="/" className="hover:underline">Home</Link> / 
          <Link href="/marketing" className="hover:underline">Digitales Marketing</Link> / 
          <span className="text-[#1E1B4B] font-bold">{detail.titleDe}</span>
        </div>

        <div className="space-y-4 max-w-3xl">
          <span className="font-mono text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
            {detail.code} · MARKETING
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
            <h2 className="text-2xl font-bold">Möchten Sie Ihr Marketing mit {detail.titleDe} skalieren?</h2>
            <p className="text-purple-100 max-w-lg mx-auto">
              Senden Sie uns eine kurze Nachricht. Wir analysieren Ihre aktuelle Sichtbarkeit und schlagen Maßnahmen vor.
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
