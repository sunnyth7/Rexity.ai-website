"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/language-context";
import { NAV_LINKS, SITE_CONFIG } from "@/lib/content";
import { Menu, X, Globe, ArrowRight } from "lucide-react";

export function Header() {
  const { lang, setLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E8E5DF] bg-[#FAF8F4]/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="Rexity Labs">
          <Image
            src="/rexity-omi/assets/brand/final/rexity-logo-horizontal.svg"
            alt={SITE_CONFIG.name}
            width={132}
            height={28}
            className="h-7 w-auto"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#10233F]/80 hover:text-[#1560BD] transition-colors"
            >
              {t(link.label)}
            </Link>
          ))}
        </nav>

        {/* Right side: Language Switcher & Primary CTA */}
        <div className="hidden lg:flex items-center gap-3.5">
          <button
            onClick={() => setLang(lang === "de" ? "en" : "de")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DF] bg-white px-3 py-1.5 text-xs font-semibold text-[#10233F] hover:border-[#1560BD] transition-colors shadow-xs"
            type="button"
            aria-label="Language Switcher"
          >
            <Globe className="h-3.5 w-3.5 text-[#1560BD]" />
            <span className={lang === "de" ? "text-[#1560BD] font-bold" : "text-[#52637A]"}>DE</span>
            <span className="text-[#E8E5DF]">/</span>
            <span className={lang === "en" ? "text-[#1560BD] font-bold" : "text-[#52637A]"}>EN</span>
          </button>

          <a
            href={`mailto:${SITE_CONFIG.email}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1560BD] px-4 py-2 text-xs font-semibold text-white hover:bg-[#114E9B] transition-all shadow-xs"
          >
            <span>{t({ de: "Kontakt", en: "Get in Touch" })}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setLang(lang === "de" ? "en" : "de")}
            className="inline-flex items-center gap-1 rounded-full border border-[#E8E5DF] bg-white px-2.5 py-1 text-xs font-semibold text-[#10233F]"
            type="button"
          >
            <span className={lang === "de" ? "text-[#1560BD]" : "text-gray-400"}>DE</span>
            <span className="text-gray-300">/</span>
            <span className={lang === "en" ? "text-[#1560BD]" : "text-gray-400"}>EN</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-[#10233F] hover:bg-[#E8E5DF]/50 focus:outline-none"
            aria-label="Toggle Menu"
            type="button"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E8E5DF] bg-[#FAF8F4] px-4 pt-3 pb-6 space-y-3 shadow-lg">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-[#10233F] hover:bg-white transition-colors"
            >
              {t(link.label)}
            </Link>
          ))}
          <div className="pt-2">
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1560BD] px-4 py-3 text-sm font-semibold text-white shadow-xs"
            >
              <span>{t({ de: "Projekt anfragen", en: "Book a Call" })}</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
