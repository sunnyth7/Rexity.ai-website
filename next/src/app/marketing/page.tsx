"use client";

import React from "react";
import { useLanguage } from "@/lib/language-context";
import { SITE_CONFIG } from "@/lib/content";
import { ArrowRight, Search, Video, BarChart3, Target } from "lucide-react";

export default function MarketingPage() {
  const { t } = useLanguage();

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold tracking-widest text-[#1560BD] uppercase">
          {t({ de: "Leistung · Digital Marketing", en: "Service · Digital Marketing" })}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#10233F]">
          {t({
            de: "Messbares Digitales Wachstum & SEO",
            en: "Measurable Digital Growth & Technical SEO",
          })}
        </h1>
        <p className="text-base sm:text-lg text-[#52637A] leading-relaxed">
          {t({
            de: "Kombination aus technischer Sichtbarkeit, Content-Struktur und KI-gestützten Video-Workflows für nachhaltige Kundengewinnung.",
            en: "Combining technical search visibility, structured content architecture, and AI-assisted video workflows for predictable acquisition.",
          })}
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#1560BD]/10 text-[#1560BD] flex items-center justify-center">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#10233F]">
            {t({ de: "Technisches SEO & Audits", en: "Technical SEO & Performance Audits" })}
          </h3>
          <p className="text-sm text-[#52637A] leading-relaxed">
            {t({
              de: "Optimierung der Seitenarchitektur, Ladezeiten und Keywords für beste Auffindbarkeit in Suchmaschinen.",
              en: "Optimizing site structure, core web vitals, and target keywords for high search engine visibility.",
            })}
          </p>
        </div>

        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#0FB5A6]/10 text-[#0FB5A6] flex items-center justify-center">
            <Video className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#10233F]">
            {t({ de: "KI-Videomarketing & Avatare", en: "AI Video Marketing & Short-Form" })}
          </h3>
          <p className="text-sm text-[#52637A] leading-relaxed">
            {t({
              de: "Automatisierte Skripte, Kurzvideos und Avatarkonzepte für moderne Social-Media-Kampagnen.",
              en: "Automated video scriptwriting, short-form content, and avatar workflows tailored for modern campaigns.",
            })}
          </p>
        </div>

        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#1560BD]/10 text-[#1560BD] flex items-center justify-center">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#10233F]">
            {t({ de: "Content-Struktur & Strategie", en: "Content Strategy & Keyword Mapping" })}
          </h3>
          <p className="text-sm text-[#52637A] leading-relaxed">
            {t({
              de: "Klar strukturierter Content, der Zielgruppen genau dort abholt, wo Kaufentscheidungen getroffen werden.",
              en: "Targeted content architectures designed to educate potential clients at every decision touchpoint.",
            })}
          </p>
        </div>

        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#0FB5A6]/10 text-[#0FB5A6] flex items-center justify-center">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#10233F]">
            {t({ de: "Messbares Reporting", en: "Measurable Growth Reporting" })}
          </h3>
          <p className="text-sm text-[#52637A] leading-relaxed">
            {t({
              de: "Transparente Kennzahlen zu Conversions, Traffic-Quellen und Akquisitionskosten.",
              en: "Transparent analytics tracking conversion pipelines, organic traffic growth, and acquisition metrics.",
            })}
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="rounded-3xl bg-[#FAF8F4] border border-[#E8E5DF] p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-2xl font-bold text-[#10233F]">
          {t({ de: "Bereit für mehr digitale Sichtbarkeit?", en: "Ready to Scale Your Digital Visibility?" })}
        </h2>
        <a
          href={`mailto:${SITE_CONFIG.email}`}
          className="inline-flex items-center gap-2 rounded-full bg-[#1560BD] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#114E9B] transition-all"
        >
          <span>{t({ de: "Marketing-Audit anfragen", en: "Request Marketing Audit" })}</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
