"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/language-context";
import { LEGAL_LINKS, SITE_CONFIG } from "@/lib/content";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-[#E8E5DF] bg-white text-[#10233F]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#E8E5DF]">
          <Link href="/" aria-label="Rexity Labs">
            <Image
              src="/rexity-omi/assets/brand/final/rexity-logo-horizontal.svg"
              alt={SITE_CONFIG.name}
              width={120}
              height={26}
              className="h-6 w-auto"
            />
          </Link>
          <a
            href={`mailto:${SITE_CONFIG.email}`}
            className="text-sm font-semibold text-[#1560BD] hover:underline"
          >
            {SITE_CONFIG.email}
          </a>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-6">
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs sm:text-sm text-[#52637A] hover:text-[#10233F] transition-colors"
              >
                {t(link.label)}
              </Link>
            ))}
          </nav>

          <p className="text-xs text-[#52637A] leading-relaxed">
            © {SITE_CONFIG.legalName} · {SITE_CONFIG.hrb} · {SITE_CONFIG.court}.{" "}
            {t({ de: "Alle Rechte vorbehalten.", en: "All rights reserved." })}
          </p>
        </div>
      </div>
    </footer>
  );
}
