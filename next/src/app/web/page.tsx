"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { SITE_CONFIG } from "@/lib/content";
import { ArrowRight, Code, Smartphone, Layout, Cpu, CheckCircle } from "lucide-react";

export default function WebPage() {
  const { t } = useLanguage();

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold tracking-widest text-[#1560BD] uppercase">
          {t({ de: "Leistung · Web & Apps", en: "Service · Web & Apps" })}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#10233F]">
          {t({
            de: "Web- & App-Entwicklung für moderne Unternehmen",
            en: "Web & App Development for Modern Companies",
          })}
        </h1>
        <p className="text-base sm:text-lg text-[#52637A] leading-relaxed">
          {t({
            de: "Von performanten Business-Websites bis zu komplexen SaaS-Plattformen und mobilen iOS/Android Apps. 100% DSGVO-konform und EU-gehostet.",
            en: "From high-performance business websites to complex SaaS platforms and mobile apps. 100% GDPR-compliant and EU-hosted.",
          })}
        </p>
      </div>

      {/* Grid of features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#1560BD]/10 text-[#1560BD] flex items-center justify-center">
            <Layout className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#10233F]">
            {t({ de: "Websites & Landingpages", en: "Websites & Landing Pages" })}
          </h3>
          <p className="text-sm text-[#52637A] leading-relaxed">
            {t({
              de: "Verwandeln Sie Besucher in Kunden. Schnelle Ladezeiten, modernes UI/UX Design und optimierte Konvertierungsraten.",
              en: "Turn visitors into customers. Lightning fast load times, modern UI/UX design, and optimized conversion pathways.",
            })}
          </p>
        </div>

        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#0FB5A6]/10 text-[#0FB5A6] flex items-center justify-center">
            <Smartphone className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#10233F]">
            {t({ de: "Mobile Apps (iOS & Android)", en: "Mobile Apps (iOS & Android)" })}
          </h3>
          <p className="text-sm text-[#52637A] leading-relaxed">
            {t({
              de: "Native und cross-platform Mobile Apps mit flüssigen Animationen, Offline-Support und sicherer API-Anbindung.",
              en: "Native and cross-platform mobile apps featuring fluid animations, offline capabilities, and secure API integrations.",
            })}
          </p>
        </div>

        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#1560BD]/10 text-[#1560BD] flex items-center justify-center">
            <Cpu className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#10233F]">
            {t({ de: "SaaS & Web-Plattformen", en: "SaaS & Custom Web Platforms" })}
          </h3>
          <p className="text-sm text-[#52637A] leading-relaxed">
            {t({
              de: "Skalierbare Webanwendungen mit Benutzerverwaltung, Rollenrechten, Zahlungsintegrationen und Dashboards.",
              en: "Scalable web applications with user management, role-based access, payment gateways, and analytics dashboards.",
            })}
          </p>
        </div>

        <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#0FB5A6]/10 text-[#0FB5A6] flex items-center justify-center">
            <Code className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#10233F]">
            {t({ de: "Moderner Tech-Stack", en: "Modern Engineering Stack" })}
          </h3>
          <p className="text-sm text-[#52637A] leading-relaxed">
            {t({
              de: "Next.js 15, React, TypeScript, Tailwind CSS, Node.js und PostgreSQL — gebaut für maximale Wartbarkeit.",
              en: "Next.js 15, React, TypeScript, Tailwind CSS, Node.js, and PostgreSQL — engineered for long-term reliability.",
            })}
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="rounded-3xl bg-[#FAF8F4] border border-[#E8E5DF] p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-2xl font-bold text-[#10233F]">
          {t({ de: "Haben Sie ein Web- oder App-Projekt?", en: "Have a Web or App Project in Mind?" })}
        </h2>
        <a
          href={`mailto:${SITE_CONFIG.email}`}
          className="inline-flex items-center gap-2 rounded-full bg-[#1560BD] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#114E9B] transition-all"
        >
          <span>{t({ de: "Jetzt Projekt anfragen", en: "Inquire Now" })}</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
