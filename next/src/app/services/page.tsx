"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { SERVICES_CONTENT, SITE_CONFIG } from "@/lib/content";
import { ArrowRight, Check } from "lucide-react";

export default function ServicesPage() {
  const { t } = useLanguage();

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold tracking-widest text-[#1560BD] uppercase">
          {t({ de: "Übersicht · Leistungen", en: "Overview · All Services" })}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#10233F]">
          {t({
            de: "Alles, was Rexity baut — auf einen Blick",
            en: "Everything Rexity Ships — In One Place",
          })}
        </h1>
        <p className="text-base sm:text-lg text-[#52637A] leading-relaxed">
          {t({
            de: "Software, Automatisierung und Wachstum für ambitionierte Teams. 100% DSGVO-konform, EU-gehostet und durchgängig produktionsreif.",
            en: "Software, automation, and digital growth built by Rexity Labs. 100% GDPR-compliant, EU-hosted, and production-grade.",
          })}
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {SERVICES_CONTENT.map((svc) => (
          <div
            key={svc.id}
            className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-6 flex flex-col justify-between hover:border-[#1560BD] transition-colors shadow-xs"
          >
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#10233F]">{t(svc.title)}</h2>
              <p className="text-base text-[#52637A] leading-relaxed">{t(svc.desc)}</p>

              <div className="pt-2 flex flex-wrap gap-2">
                {svc.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-[#FAF8F4] border border-[#E8E5DF] px-3 py-1 text-xs font-medium text-[#10233F]"
                  >
                    <Check className="h-3.5 w-3.5 text-[#0FB5A6]" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E5DF]">
              <Link
                href={svc.href}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#1560BD] hover:underline"
              >
                <span>{t({ de: "Mehr erfahren", en: "Learn More" })}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Scope CTA */}
      <div className="rounded-3xl bg-[#FAF8F4] border border-[#E8E5DF] p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-2xl font-bold text-[#10233F]">
          {t({ de: "Unschlüssig, wo Sie anfangen sollen?", en: "Not Sure Where to Start?" })}
        </h2>
        <p className="text-base text-[#52637A] max-w-xl mx-auto">
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
