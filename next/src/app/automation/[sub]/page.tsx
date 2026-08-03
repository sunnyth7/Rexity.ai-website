import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, ChevronLeft } from "lucide-react";

export function generateStaticParams() {
  return [
    { sub: "rpa" },
    { sub: "whatsapp" },
    { sub: "voice" },
    { sub: "chatbots" },
  ];
}

const subDetails: Record<string, { titleDe: string; titleEn: string; descDe: string; descEn: string }> = {
  rpa: {
    titleDe: "RPA & Prozessautomatisierung",
    titleEn: "RPA & Process Automation",
    descDe: "Automatisierung wiederkehrender Workflows zwischen CRM, Buchhaltung und E-Mail ohne manuelle Fehler.",
    descEn: "Automating recurring business workflows across CRM, accounting, and messaging to eliminate manual data entry.",
  },
  whatsapp: {
    titleDe: "WhatsApp-Agenten",
    titleEn: "WhatsApp Agents",
    descDe: "Intelligente Assistenten in WhatsApp für automatische Lead-Qualifizierung, Terminbuchung und Support.",
    descEn: "Intelligent WhatsApp assistants for automated lead qualification, scheduling, and instant customer service.",
  },
  voice: {
    titleDe: "Voice-Agenten",
    titleEn: "Voice Agents",
    descDe: "KI-Telefonassistenten für automatische Anrufannahme, Erfassung von Anliegen und strukturierte Übergabe.",
    descEn: "AI voice intake agents for automated call answering, intent capturing, and clean CRM handoff.",
  },
  chatbots: {
    titleDe: "Website-Chatbots (RAG)",
    titleEn: "Website Chatbots (RAG)",
    descDe: "Retrieval-basierte KI-Chatbots, die Antworten streng aus Ihrer freigegebenen Wissensdatenbank liefern.",
    descEn: "Retrieval-augmented AI chatbots that answer customer questions strictly from your approved knowledge databank.",
  },
};

export default async function AutomationSubPage({ params }: { params: Promise<{ sub: string }> }) {
  const { sub } = await params;
  const detail = subDetails[sub] || subDetails["rpa"];

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
      <Link href="/automation" className="inline-flex items-center gap-1 text-sm font-semibold text-[#1560BD] hover:underline">
        <ChevronLeft className="h-4 w-4" />
        <span>Zurück zu Automatisierung</span>
      </Link>

      <div className="space-y-4">
        <span className="font-mono text-xs font-bold text-[#1560BD] uppercase tracking-wider">
          AUTOMATISIERUNG · LEISTUNG {sub.toUpperCase()}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#10233F]">{detail.titleDe}</h1>
        <p className="text-lg text-[#4A5568] leading-relaxed">{detail.descDe}</p>
      </div>

      <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-6 shadow-xs">
        <h2 className="text-2xl font-bold text-[#10233F]">Was Rexity für Sie umsetzt</h2>
        <ul className="space-y-3 text-sm text-[#4A5568]">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#0FB5A6]" />
            <span>Azure OpenAI Integration in der EU-Datenregion (Germany West Central)</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#0FB5A6]" />
            <span>Schutz vor Prompt-Injections & klare Human-Handoff-Regeln</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#0FB5A6]" />
            <span>Revisionssicheres Audit-Logging für alle automatisierten Prozessschritte</span>
          </li>
        </ul>
      </div>

      <div className="rounded-3xl bg-[#FAF8F4] border border-[#E8E5DF] p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#10233F]">Möchten Sie {detail.titleDe} für Ihr Team testen?</h2>
        <a
          href="mailto:hello@rexity.ai"
          className="inline-flex items-center gap-2 rounded-full bg-[#1560BD] px-7 py-3 text-sm font-bold text-white hover:bg-[#114E9B] transition-all"
        >
          <span>Jetzt E-Mail an hello@rexity.ai</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
