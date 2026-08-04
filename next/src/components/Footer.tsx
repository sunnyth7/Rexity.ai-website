"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/language-context";
import { ALL_17_SERVICE_LINKS, LEGAL_LINKS, SITE_CONFIG } from "@/lib/content";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-[#1E1B4B] text-white border-t border-[#1E1B4B]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/10">
          <Link href="/" aria-label="Rexity Labs">
            <Image
              src="/rexity-omi/assets/brand/final/rexity-logo-horizontal-white.svg"
              alt={SITE_CONFIG.name}
              width={132}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
          <a
            href={`mailto:${SITE_CONFIG.email}`}
            className="text-base font-bold text-[#A78BFA] hover:text-white transition-colors"
          >
            {SITE_CONFIG.email}
          </a>
        </div>

        {/* Full Sitemap Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Column 1: Leistungen (All 17 Links) */}
          <div className="space-y-4">
            <h3 className="font-mono text-xs font-bold text-[#A78BFA] uppercase tracking-wider">
              {t({ de: "Leistungen (17 Routen)", en: "Services Sitemap (17 Routes)" })}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              {ALL_17_SERVICE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-gray-300 hover:text-white transition-colors py-0.5 line-clamp-1"
                >
                  {t(link.label)}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 2: Unternehmen */}
          <div className="space-y-4">
            <h3 className="font-mono text-xs font-bold text-[#A78BFA] uppercase tracking-wider">
              {t({ de: "Unternehmen", en: "Company" })}
            </h3>
            <div className="space-y-2 text-sm">
              <Link href="/work" className="block text-xs text-gray-300 hover:text-white transition-colors">
                {t({ de: "Arbeiten & Referenzen", en: "Work & Case Studies" })}
              </Link>
              <Link href="/services" className="block text-xs text-gray-300 hover:text-white transition-colors">
                {t({ de: "Leistungsübersicht", en: "Services Index" })}
              </Link>
              <a href={`mailto:${SITE_CONFIG.email}`} className="block text-xs text-gray-300 hover:text-white transition-colors">
                {t({ de: "Kontakt & Demo", en: "Contact & Demo" })}
              </a>
            </div>
          </div>

          {/* Column 3: Rechtliches */}
          <div className="space-y-4">
            <h3 className="font-mono text-xs font-bold text-[#A78BFA] uppercase tracking-wider">
              {t({ de: "Rechtliches", en: "Legal" })}
            </h3>
            <div className="space-y-2">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-xs text-gray-300 hover:text-white transition-colors"
                >
                  {t(link.label)}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Legal HRB Footnote Line */}
        <div className="pt-8 border-t border-white/10 text-xs text-gray-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p>
            © {SITE_CONFIG.legalName} · {SITE_CONFIG.hrb} · {SITE_CONFIG.court}.{" "}
            {t({ de: "Alle Rechte vorbehalten.", en: "All rights reserved." })}
          </p>
          <p className="font-mono text-[10px] text-[#A78BFA]">
            DSGVO-KONFORM · EU-HOSTED
          </p>
        </div>
      </div>
    </footer>
  );
}
