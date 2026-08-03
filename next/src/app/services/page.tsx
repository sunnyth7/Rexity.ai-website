"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { SITE_CONFIG } from "@/lib/content";
import { BentoServicesGrid } from "@/components/BentoServicesGrid";
import { ArrowRight } from "lucide-react";

export default function ServicesPage() {
  const { t } = useLanguage();

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="font-mono text-xs font-bold tracking-widest text-[#1560BD] uppercase">
          01. BENTO TAXONOMY · ALL PILLARS
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#10233F]">
          {t({
            de: "Alles, was Rexity baut — auf einen Blick",
            en: "Everything Rexity Ships — In One Place",
          })}
        </h1>
        <p className="text-base sm:text-lg text-[#4A5568] leading-relaxed">
          {t({
            de: "Software, Automatisierung und Wachstum für ambitionierte Teams. 100% DSGVO-konform, EU-gehostet und durchgängig produktionsreif.",
            en: "Software, automation, and digital growth built by Rexity Labs. 100% GDPR-compliant, EU-hosted, and production-grade.",
          })}
        </p>
      </div>

      {/* Bento Grid */}
      <BentoServicesGrid />

      {/* Scope CTA */}
      <div className="rounded-3xl bg-[#FAF8F4] border border-[#E8E5DF] p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-2xl font-bold text-[#10233F]">
          {t({ de: "Unschlüssig, wo Sie anfangen sollen?", en: "Not Sure Where to Start?" })}
        </h2>
        <p className="text-base text-[#4A5568] max-w-xl mx-auto">
          {t({
            de: "Schreiben Sie uns kurz Ihr Anliegen — wir schlagen das kleinste Paket vor, das sofortigen Mehrwert bringt.",
            en: "Send us a brief overview of your process — we'll suggest the leanest scope that delivers immediate value.",
          })}
        </p>
        <a
          href={`mailto:${SITE_CONFIG.email}`}
          className="inline-flex items-center gap-2 rounded-full bg-[#1560BD] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#114E9B] transition-all"
        >
          <span>{t({ de: "Projekt besprechen", en: "Discuss Your Scope" })}</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
