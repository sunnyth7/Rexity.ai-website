"use client";

import React from "react";
import { useLanguage } from "@/lib/language-context";
import { SITE_CONFIG } from "@/lib/content";
import { ArrowRight, ShieldCheck, Activity, CheckCircle, LifeBuoy } from "lucide-react";

export default function TestingSupportPage() {
  const { t } = useLanguage();

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold tracking-widest text-[#1560BD] uppercase">
          {t({ de: "Leistung · Testing & Support", en: "Service · Testing & Support" })}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#10233F]">
          {t({
            de: "Qualitätssicherung & Langzeit-Support",
            en: "Quality Assurance & Dependable Maintenance",
          })}
        </h1>
        <p className="text-base sm:text-lg text-[#52637A] leading-relaxed">
          {t({
            de: "Verlässlicher Betrieb, automatisierte End-to-End-Tests und proaktive Wartung für Ihre digitalen Systeme.",
            en: "Reliable production operations, end-to-end automated testing, and proactive maintenance for your digital stack.",
          })}
        </p>
      </div>

      {/* Grid of features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#1560BD]/10 text-[#1560BD] flex items-center justify-center">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#10233F]">
            {t({ de: "Automatisierte E2E-Tests", en: "Automated E2E Testing" })}
          </h3>
          <p className="text-sm text-[#52637A] leading-relaxed">
            {t({
              de: "Automatisierte Testsuiten vor jedem Release verhindern Regressionsfehler bei kritischen Funktionen.",
              en: "Automated test suites prior to every release prevent regressions in critical workflows.",
            })}
          </p>
        </div>

        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#0FB5A6]/10 text-[#0FB5A6] flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#10233F]">
            {t({ de: "DSGVO- & Compliance-Audits", en: "GDPR & Compliance Audits" })}
          </h3>
          <p className="text-sm text-[#52637A] leading-relaxed">
            {t({
              de: "Regelmäßige Überprüfung der Datenschutz-Konformität, Cookie-Consent-Handhabung und EU-Datenhaltung.",
              en: "Regular verification of data protection measures, consent handling, and EU server residency.",
            })}
          </p>
        </div>

        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#1560BD]/10 text-[#1560BD] flex items-center justify-center">
            <Activity className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#10233F]">
            {t({ de: "Performance & Security Monitoring", en: "Performance & Security Monitoring" })}
          </h3>
          <p className="text-sm text-[#52637A] leading-relaxed">
            {t({
              de: "Überwachung von Ladezeiten, Uptime und API-Fehlerraten für gleichbleibend hohe Systemqualität.",
              en: "Continuous tracking of core web vitals, server uptime, and API error rates to ensure high performance.",
            })}
          </p>
        </div>

        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#0FB5A6]/10 text-[#0FB5A6] flex items-center justify-center">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#10233F]">
            {t({ de: "Verlässlicher Maintenance Support", en: "Dependable Maintenance Support" })}
          </h3>
          <p className="text-sm text-[#52637A] leading-relaxed">
            {t({
              de: "Direkter Ansprechpartner ohne Callcenter-Warteschlangen. Schnelle Reaktionszeiten bei Anfragen.",
              en: "Direct communication with senior engineers without call center delays. Fast turnaround times.",
            })}
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="rounded-3xl bg-[#FAF8F4] border border-[#E8E5DF] p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-2xl font-bold text-[#10233F]">
          {t({ de: "Suchen Sie verlässlichen Software-Support?", en: "Looking for Dependable QA & Maintenance?" })}
        </h2>
        <a
          href={`mailto:${SITE_CONFIG.email}`}
          className="inline-flex items-center gap-2 rounded-full bg-[#1560BD] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#114E9B] transition-all"
        >
          <span>{t({ de: "Support anfragen", en: "Inquire Support" })}</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
