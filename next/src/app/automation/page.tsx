"use client";

import React from "react";
import { useLanguage } from "@/lib/language-context";
import { SITE_CONFIG } from "@/lib/content";
import { ArrowRight, Bot, MessageSquare, Workflow, PhoneCall, ShieldCheck } from "lucide-react";

export default function AutomationPage() {
  const { t } = useLanguage();

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold tracking-widest text-[#1560BD] uppercase">
          {t({ de: "Leistung · Automatisierung & KI", en: "Service · Automation & AI" })}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#10233F]">
          {t({
            de: "KI-Agenten & Prozessautomatisierung",
            en: "AI Agents & Business Process Automation",
          })}
        </h1>
        <p className="text-base sm:text-lg text-[#52637A] leading-relaxed">
          {t({
            de: "Reduzieren Sie manuelle Routinearbeit. Wir entwickeln intelligente Assistenten für Website, WhatsApp und Telefon mit revisionssicheren Audit-Logs.",
            en: "Eliminate manual routine work. We build intelligent assistants across web, WhatsApp, and phone systems with audit-logged safety.",
          })}
        </p>
      </div>

      {/* Grid of features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#1560BD]/10 text-[#1560BD] flex items-center justify-center">
            <Bot className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#10233F]">
            {t({ de: "Website Chatbots (RAG)", en: "Website Chatbots (RAG)" })}
          </h3>
          <p className="text-sm text-[#52637A] leading-relaxed">
            {t({
              de: "Antworten streng aus Ihrer freigegebenen Wissensdatenbank. Kein Halluzinieren, DSGVO-konform und EU-gehostet.",
              en: "Answers drawn strictly from your approved knowledge databank. No hallucinations, GDPR-compliant, and EU-hosted.",
            })}
          </p>
        </div>

        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#0FB5A6]/10 text-[#0FB5A6] flex items-center justify-center">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#10233F]">
            {t({ de: "WhatsApp Business Automatisierung", en: "WhatsApp Business Automation" })}
          </h3>
          <p className="text-sm text-[#52637A] leading-relaxed">
            {t({
              de: "Automatische Qualifizierung von Kundencalls, Terminbuchungen und Kundenservice direkt in WhatsApp.",
              en: "Automated qualifying of inbound leads, appointment scheduling, and support right inside WhatsApp.",
            })}
          </p>
        </div>

        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#1560BD]/10 text-[#1560BD] flex items-center justify-center">
            <Workflow className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#10233F]">
            {t({ de: "CRM & Workflow RPA", en: "CRM & Workflow RPA" })}
          </h3>
          <p className="text-sm text-[#52637A] leading-relaxed">
            {t({
              de: "Verknüpfung Ihrer bestehenden Softwaretools (n8n, Zapier, HubSpot, Salesforce) ohne doppelte Dateneingabe.",
              en: "Connecting your existing tools (n8n, Zapier, HubSpot, Salesforce) to eliminate manual copying and pasting.",
            })}
          </p>
        </div>

        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#0FB5A6]/10 text-[#0FB5A6] flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#10233F]">
            {t({ de: "Sicherheit & Human Handoff", en: "Security & Human Handoff" })}
          </h3>
          <p className="text-sm text-[#52637A] leading-relaxed">
            {t({
              de: "Schutz vor Prompt-Injections. Bei komplexen Anliegen übergibt der Agent nahtlos an Ihr menschliches Team.",
              en: "Built-in prompt-injection guardrails. For complex cases, the agent hands off cleanly to your human team.",
            })}
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="rounded-3xl bg-[#FAF8F4] border border-[#E8E5DF] p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-2xl font-bold text-[#10233F]">
          {t({ de: "Möchten Sie wiederkehrende Aufgaben automatisieren?", en: "Want to Automate Recurring Workflows?" })}
        </h2>
        <a
          href={`mailto:${SITE_CONFIG.email}`}
          className="inline-flex items-center gap-2 rounded-full bg-[#1560BD] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#114E9B] transition-all"
        >
          <span>{t({ de: "Beratung vereinbaren", en: "Schedule a Scope Call" })}</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
