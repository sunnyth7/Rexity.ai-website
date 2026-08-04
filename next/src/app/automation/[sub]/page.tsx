import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, ChevronLeft, Sparkles } from "lucide-react";

export function generateStaticParams() {
  return [
    { sub: "rpa" },
    { sub: "whatsapp" },
    { sub: "voice" },
    { sub: "chatbots" },
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
  rpa: {
    code: "02.1",
    titleDe: "RPA & Prozessautomatisierung",
    titleEn: "RPA & Process Automation",
    tagDe: "Auditierbar, wiederholbar, ohne Handarbeit.",
    tagEn: "Auditable, repeatable, hands-off.",
    leadDe: "Wir kartieren die wiederkehrende Handarbeit Ihres Teams und verwandeln sie in zuverlässige automatisierte Workflows — über CRM, Postfach und interne Tools hinweg.",
    leadEn: "We map the repetitive work your team does by hand and turn it into reliable automated workflows — across your CRM, inbox, and internal tools.",
    workIntroDe: "Automatisierung zahlt sich aus, wenn sie auf die richtige Arbeit gerichtet und genau überwacht wird.",
    workIntroEn: "Automation pays off when focused on repetitive tasks and monitored with full audit logs.",
    steps: [
      {
        de: { title: "Prozess-Audit", desc: "Kartierung aller manuellen Dateneingaben und Systemübergänge." },
        en: { title: "Process Audit", desc: "Mapping all manual data entry points and system handoffs." },
      },
      {
        de: { title: "Workflow Build", desc: "Entwicklung fehlertoleranter Integrationen mit n8n & Python." },
        en: { title: "Workflow Build", desc: "Engineering fault-tolerant syncs using n8n & Python." },
      },
      {
        de: { title: "Audit Logging", desc: "Einrichtung vollständiger Revisionsprotokolle und Alerting." },
        en: { title: "Audit Logging", desc: "Setting up complete revision logs and immediate error alerting." },
      },
    ],
    includedDe: ["n8n & Zapier Integration", "CRM & ERP Anbindung", "Fehler-Monitoring", "Human-in-the-Loop Fallbacks"],
    includedEn: ["n8n & Zapier Integration", "CRM & ERP Sync", "Error Monitoring", "Human-in-the-Loop Fallbacks"],
    outcomesDe: ["Einsparung von 15+ Stunden/Woche", "Null manuelle Übertragungsfehler", "Vollständige Revisionssicherheit"],
    outcomesEn: ["15+ Hours Saved Weekly per Team", "Zero Manual Copying Errors", "Complete Audit Compliance"],
    whoDe: "Für Operations- und Finanz-Teams mit hohem manuellem Verwaltungsaufwand.",
    whoEn: "For operations and finance teams overburdened with manual data entry.",
    stack: ["n8n", "Python", "HubSpot", "Make", "PostgreSQL"],
    faqs: [
      {
        qDe: "Was passiert, wenn eine Schnittstelle ausfällt?",
        aDe: "Der Workflow benachrichtigt Ihr Team sofort und hält den Stand im Fallback-Puffer.",
        qEn: "What happens if a third-party API fails?",
        aEn: "The workflow notifies your team instantly and holds the payload in a fallback queue.",
      },
    ],
  },
  whatsapp: {
    code: "02.2",
    titleDe: "WhatsApp-Agenten",
    titleEn: "WhatsApp Agents",
    tagDe: "Jeden Chat beantworten, Tag und Nacht.",
    tagEn: "Answer every chat, day or night.",
    leadDe: "Automatisierte WhatsApp-Business-Flows, die Leads qualifizieren, häufige Fragen beantworten und Termine buchen — über die offizielle API, mit Opt-in.",
    leadEn: "Automated WhatsApp Business flows that qualify leads, answer common questions, and book appointments — on the official API, with opt-in.",
    workIntroDe: "Jede WhatsApp-Nachricht durchläuft denselben sicheren, nachvollziehbaren Pfad. Der Assistent beantwortet, was er kann, und übergibt Sensibles direkt an Ihr Team.",
    workIntroEn: "Every WhatsApp message runs through a safe, auditable path — qualifying, answering, and handing off to humans when needed.",
    steps: [
      {
        de: { title: "API-Einrichtung", desc: "Anbindung der offiziellen Meta WhatsApp Business API." },
        en: { title: "API Setup", desc: "Connecting the official Meta WhatsApp Business API with opt-in." },
      },
      {
        de: { title: "Dialog-Design", desc: "Erstellung von Lead-Qualifizierungsfragen und FAQ-Logik." },
        en: { title: "Flow Design", desc: "Building lead qualifying questions and approved FAQ logic." },
      },
      {
        de: { title: "CRM & Calendar Sync", desc: "Direkte Buchung in Calendly / HubSpot und Benachrichtigung des Teams." },
        en: { title: "CRM & Calendar Sync", desc: "Direct booking into Calendly / HubSpot and instant team notifications." },
      },
    ],
    includedDe: ["WhatsApp Business API", "Lead-Qualifizierungs-Flows", "FAQ- & Buchungs-Automatisierung", "Human Handoff"],
    includedEn: ["WhatsApp Business API", "Lead Qualification Flows", "FAQ & Booking Automation", "Human Handoff"],
    outcomesDe: ["Sofortige Antworten nach Feierabend", "Mehr qualifizierte Leads", "DSGVO-konformes Opt-in"],
    outcomesEn: ["Instant 24/7 After-Hours Replies", "More Qualified Leads", "Fully Compliant Opt-in"],
    whoDe: "Für Unternehmen, deren Kunden bevorzugt über WhatsApp kommunizieren.",
    whoEn: "For businesses whose leads and clients already message on WhatsApp.",
    stack: ["WhatsApp Business API", "Twilio", "n8n", "Azure OpenAI", "HubSpot"],
    faqs: [
      {
        qDe: "Ist die WhatsApp-Automatisierung konform?",
        aDe: "Ja, wir nutzen ausschließlich die offizielle WhatsApp Business API mit durchgängigem Opt-in.",
        qEn: "Is WhatsApp automation compliant?",
        aEn: "Yes, we exclusively utilize the official WhatsApp Business API with end-to-end opt-in.",
      },
    ],
  },
  voice: {
    code: "02.3",
    titleDe: "Voice-Agenten",
    titleEn: "Voice Agents",
    tagDe: "Ein Empfang, der nie schläft.",
    tagEn: "A receptionist that never sleeps.",
    leadDe: "Ein Cloud-Telefonassistent, der Anrufe rund um die Uhr annimmt, weiterleitet und Details erfasst — damit keine Anfrage in der Mailbox landet.",
    leadEn: "A cloud phone assistant that answers calls, routes them, and captures details around the clock — so no enquiry goes to voicemail.",
    workIntroDe: "Jeder Anruf wird angenommen, das Richtige passiert automatisch, und alles Sensible erreicht einen Menschen mit vollem Kontext.",
    workIntroEn: "Every call gets answered, routine intake happens automatically, and sensitive calls reach a human with full context.",
    steps: [
      {
        de: { title: "Nummern-Schaltung", desc: "Einrichtung der Telefonie-Schnittstelle und Weiterleitung." },
        en: { title: "Telephony Routing", desc: "Setting up SIP trunks and phone routing rules." },
      },
      {
        de: { title: "Voice-Prompting", desc: "Trainieren der natürlichen Sprachausgabe und Erfassung von Anliegen." },
        en: { title: "Voice Prompting", desc: "Training natural speech synthesis and intent capturing." },
      },
      {
        de: { title: "CRM-Übergabe", desc: "Automatische Transkription und Strukturierung im CRM." },
        en: { title: "CRM Handoff", desc: "Automated call transcription and structured CRM logging." },
      },
    ],
    includedDe: ["24/7 Telefonannahme", "Spracherkennung & Transkription", "SMS/E-Mail Zuweisung", "Anruf-Zusammenfassung"],
    includedEn: ["24/7 Phone Reception", "Speech Recognition & Transcription", "SMS/Email Dispatch", "Call Summaries"],
    outcomesDe: ["Keine verpassten Anrufe mehr", "Entlastung der Zentrale", "Strukturierte Lead-Daten"],
    outcomesEn: ["Zero Missed Inquiries", "Relieved Front-Desk Staff", "Clean Structured Lead Data"],
    whoDe: "Für Kanzleien, Praxen und Dienstleister mit hoher telefonischer Erreichbarkeitsanforderung.",
    whoEn: "For clinics, firms, and service businesses needing constant phone availability.",
    stack: ["Twilio Voice", "Vapi", "Azure OpenAI", "Deepgram", "HubSpot"],
    faqs: [
      {
        qDe: "Klingen die Voice-Agenten natürlich?",
        aDe: "Ja, wir nutzen modernste latenzarme KI-Sprachsynthese für flüssige Gespräche auf Deutsch.",
        qEn: "Do voice agents sound natural?",
        aEn: "Yes, we deploy state-of-the-art low-latency AI speech synthesis tuned for natural conversations.",
      },
    ],
  },
  chatbots: {
    code: "02.4",
    titleDe: "Website-Chatbots (RAG)",
    titleEn: "Website Chatbots (RAG)",
    tagDe: "Der Assistent auf genau dieser Seite.",
    tagEn: "The assistant on this very site.",
    leadDe: "Ein Website-Assistent, der freigegebene Fragen aus Ihrer eigenen Wissensbasis beantwortet, Besucher führt und komplexe Fälle an einen Menschen übergibt.",
    leadEn: "A website assistant that answers approved questions from your own knowledge base, guides visitors, and hands complex cases to a human.",
    workIntroDe: "Ein Website-Assistent sollte aus Ihren Inhalten antworten, Interesse erfassen und wissen, wann er einem Menschen Platz macht.",
    workIntroEn: "A website assistant should answer strictly from approved sources and step aside for human team members.",
    steps: [
      {
        de: { title: "Knowledge Indexing", desc: "Einlesen und Vektorisieren Ihrer Dokumente & Hilfeartikel." },
        en: { title: "Knowledge Indexing", desc: "Ingesting and vectorizing your documentation & help articles." },
      },
      {
        de: { title: "RAG-Guardrails", desc: "Konfiguration strenger Schranken gegen Halluzinationen." },
        en: { title: "RAG Guardrails", desc: "Configuring strict anti-hallucination boundaries." },
      },
      {
        de: { title: "Widget Embedding", desc: "Einbindung des leichten Chatbot-Launchers auf Ihrer Website." },
        en: { title: "Widget Embedding", desc: "Embedding the lightweight launcher widget on your site." },
      },
    ],
    includedDe: ["Retrieval-Augmented Generation", "Vektor-Datenbank Index", "DSGVO-Gehostet in EU", "Human Handoff"],
    includedEn: ["Retrieval-Augmented Generation", "Vector Database Index", "GDPR EU Hosted", "Human Handoff"],
    outcomesDe: ["80% Reduktion von Support-Tickets", "Sofortige Antworten für Besucher", "Keine erfundenen Fakten"],
    outcomesEn: ["80% Reduction in Routine Tickets", "Instant Answers for Visitors", "Zero Invented Facts"],
    whoDe: "Für SaaS-Unternehmen, E-Commerce und Dienstleister mit wiederkehrenden Kundenfragen.",
    whoEn: "For SaaS companies, e-commerce brands, and service providers with recurring FAQs.",
    stack: ["Azure OpenAI", "Qdrant", "TypeScript", "Tailwind CSS"],
    faqs: [
      {
        qDe: "Erfindet der Chatbot Antworten (Halluzinationen)?",
        aDe: "Nein, durch unser RAG-System antwortet der Bot ausschließlich aus Ihren freigegebenen Dokumenten.",
        qEn: "Does the chatbot invent answers (hallucinations)?",
        aEn: "No, through strict RAG guardrails the bot responds strictly from approved source text.",
      },
    ],
  },
};

export default async function AutomationSubPage({ params }: { params: Promise<{ sub: string }> }) {
  const { sub } = await params;
  const detail = subPageData[sub] || subPageData["rpa"];

  return (
    <div className="w-full bg-white space-y-0">
      {/* Hero Section */}
      <section className="bg-white pt-12 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#7C3AED]">
          <Link href="/" className="hover:underline">Home</Link> / 
          <Link href="/automation" className="hover:underline">Automatisierung</Link> / 
          <span className="text-[#1E1B4B] font-bold">{detail.titleDe}</span>
        </div>

        <div className="space-y-4 max-w-3xl">
          <span className="font-mono text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
            {detail.code} · AUTOMATISIERUNG
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
            <h2 className="text-2xl font-bold">Möchten Sie {detail.titleDe} in Ihrem Betrieb einsetzen?</h2>
            <p className="text-purple-100 max-w-lg mx-auto">
              Senden Sie uns eine kurze Nachricht. Wir prüfen Ihre bestehenden Systeme und liefern ein konkretes Scoping.
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
