import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, ChevronLeft } from "lucide-react";

export function generateStaticParams() {
  return [
    { sub: "web-design" },
    { sub: "web-development" },
    { sub: "saas" },
    { sub: "mobile-apps" },
    { sub: "dashboards" },
  ];
}

const subDetails: Record<string, { titleDe: string; titleEn: string; descDe: string; descEn: string }> = {
  "web-design": {
    titleDe: "Webdesign & Figma UI/UX",
    titleEn: "Web Design & Figma UI/UX",
    descDe: "Markentreues, responsives Design von Wireframes bis zum fertigen Designsystem in Figma.",
    descEn: "Brand-true, responsive interface design from wireframes to polished Figma design systems.",
  },
  "web-development": {
    titleDe: "Web-Entwicklung",
    titleEn: "Web Development",
    descDe: "Moderne Frontend- und Backend-Entwicklung mit Next.js 15, React, TypeScript und Tailwind CSS.",
    descEn: "Modern frontend and backend engineering built with Next.js 15, React, TypeScript, and Tailwind CSS.",
  },
  saas: {
    titleDe: "SaaS-Plattformen",
    titleEn: "SaaS Platforms",
    descDe: "Skalierbare Cloud-Software mit Benutzerverwaltung, Rollenrechten und sicheren Schnittstellen.",
    descEn: "Scalable SaaS product architectures with multi-tenant auth, role permissions, and secure APIs.",
  },
  "mobile-apps": {
    titleDe: "Mobile Apps (iOS & Android)",
    titleEn: "Mobile Apps (iOS & Android)",
    descDe: "Native und cross-platform Mobile Apps mit erstklassiger Performance und Offline-Unterstützung.",
    descEn: "Native and cross-platform mobile apps engineered for fluid performance and offline support.",
  },
  dashboards: {
    titleDe: "Dashboards & Reporting",
    titleEn: "Dashboards & Reporting",
    descDe: "Übersichtliche KPI-Dashboards und Admin-Ansichten zur Überwachung Ihrer Unternehmensdaten.",
    descEn: "Clear KPI dashboards and admin views engineered for real-time operational metrics.",
  },
};

export default async function WebSubPage({ params }: { params: Promise<{ sub: string }> }) {
  const { sub } = await params;
  const detail = subDetails[sub] || subDetails["web-design"];

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
      <Link href="/web" className="inline-flex items-center gap-1 text-sm font-semibold text-[#1560BD] hover:underline">
        <ChevronLeft className="h-4 w-4" />
        <span>Zurück zu Web & Apps</span>
      </Link>

      <div className="space-y-4">
        <span className="font-mono text-xs font-bold text-[#1560BD] uppercase tracking-wider">
          WEB & APPS · LEISTUNG {sub.toUpperCase()}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#10233F]">{detail.titleDe}</h1>
        <p className="text-lg text-[#4A5568] leading-relaxed">{detail.descDe}</p>
      </div>

      <div className="rounded-3xl border border-[#E8E5DF] bg-white p-8 space-y-6 shadow-xs">
        <h2 className="text-2xl font-bold text-[#10233F]">Was wir für Sie umsetzen</h2>
        <ul className="space-y-3 text-sm text-[#4A5568]">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#0FB5A6]" />
            <span>Durchgängiges Design & Engineering im 14–21 Tage Scoping-Zeitfenster</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#0FB5A6]" />
            <span>100% DSGVO-konform, EU-gehostet und barrierearm nach BITV 2.0</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#0FB5A6]" />
            <span>Direkte Zusammenarbeit mit seniorenen Entwickelnden ohne Vertriebsdruck</span>
          </li>
        </ul>
      </div>

      <div className="rounded-3xl bg-[#FAF8F4] border border-[#E8E5DF] p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#10233F]">Haben Sie ein konkretes Anliegen zu {detail.titleDe}?</h2>
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
