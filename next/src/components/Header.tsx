"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/language-context";
import { NAV_PILLARS, SITE_CONFIG } from "@/lib/content";
import { Menu, X, Globe, ArrowRight, ChevronDown, Sparkles } from "lucide-react";

export function Header() {
  const { lang, setLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E9E4F8] bg-white/95 backdrop-blur-md transition-all">
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
          <Link
            href="/"
            className="text-sm font-medium text-[#1E1B4B]/80 hover:text-[#7C3AED] transition-colors"
          >
            {t({ de: "Startseite", en: "Home" })}
          </Link>

          {/* "Leistungen" Dropdown Trigger */}
          <div
            className="relative"
            onMouseEnter={() => setServicesDropdownOpen(true)}
            onMouseLeave={() => setServicesDropdownOpen(false)}
          >
            <button
              onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1E1B4B]/80 hover:text-[#7C3AED] transition-colors py-2 focus:outline-none"
              type="button"
            >
              <span>{t({ de: "Leistungen", en: "Services" })}</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${servicesDropdownOpen ? "rotate-180 text-[#7C3AED]" : ""}`} />
            </button>

            {/* Dropdown Panel (2-Column Layout with 4 Pillars & 12 Sub-services) */}
            {servicesDropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[740px] rounded-3xl border border-[#E9E4F8] bg-white p-6 shadow-2xl z-50 grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-150">
                {NAV_PILLARS.map((pillar) => (
                  <div key={pillar.slug} className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#E9E4F8] pb-1.5">
                      <Link
                        href={pillar.href}
                        onClick={() => setServicesDropdownOpen(false)}
                        className="text-sm font-extrabold text-[#1E1B4B] hover:text-[#7C3AED] transition-colors flex items-center gap-1.5"
                      >
                        {pillar.slug === "automation" && <Sparkles className="h-3.5 w-3.5 text-[#7C3AED]" />}
                        <span>{t(pillar.title)}</span>
                      </Link>
                    </div>

                    <div className="space-y-1.5">
                      {pillar.children.map((child, idx) => (
                        <Link
                          key={idx}
                          href={child.href}
                          onClick={() => setServicesDropdownOpen(false)}
                          className="block rounded-xl p-2 hover:bg-[#F6F3FC] transition-colors group/item"
                        >
                          <div className="text-xs font-bold text-[#1E1B4B] group-hover/item:text-[#7C3AED] transition-colors">
                            {t(child.label)}
                          </div>
                          <div className="text-[11px] text-[#6B6690] line-clamp-1">
                            {t(child.desc)}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/work"
            className="text-sm font-medium text-[#1E1B4B]/80 hover:text-[#7C3AED] transition-colors"
          >
            {t({ de: "Arbeiten", en: "Work" })}
          </Link>

          <Link
            href="/services"
            className="text-sm font-medium text-[#1E1B4B]/80 hover:text-[#7C3AED] transition-colors"
          >
            {t({ de: "Übersicht", en: "Overview" })}
          </Link>
        </nav>

        {/* Right side: Language Switcher & Primary CTA */}
        <div className="hidden lg:flex items-center gap-3.5">
          <button
            onClick={() => setLang(lang === "de" ? "en" : "de")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E9E4F8] bg-[#F6F3FC] px-3 py-1.5 text-xs font-semibold text-[#1E1B4B] hover:border-[#7C3AED] transition-colors shadow-2xs"
            type="button"
            aria-label="Language Switcher"
          >
            <Globe className="h-3.5 w-3.5 text-[#7C3AED]" />
            <span className={lang === "de" ? "text-[#7C3AED] font-bold" : "text-[#6B6690]"}>DE</span>
            <span className="text-[#E9E4F8]">/</span>
            <span className={lang === "en" ? "text-[#7C3AED] font-bold" : "text-[#6B6690]"}>EN</span>
          </button>

          <a
            href={`mailto:${SITE_CONFIG.email}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#7C3AED] px-4.5 py-2 text-xs font-bold text-white hover:bg-[#5B21B6] hover:bg-gradient-to-r hover:from-[#7C3AED] hover:to-[#4F46E5] transition-all shadow-xs"
          >
            <span>{t({ de: "Kontakt", en: "Get in Touch" })}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setLang(lang === "de" ? "en" : "de")}
            className="inline-flex items-center gap-1 rounded-full border border-[#E9E4F8] bg-[#F6F3FC] px-2.5 py-1 text-xs font-semibold text-[#1E1B4B]"
            type="button"
          >
            <span className={lang === "de" ? "text-[#7C3AED] font-bold" : "text-gray-400"}>DE</span>
            <span className="text-gray-300">/</span>
            <span className={lang === "en" ? "text-[#7C3AED] font-bold" : "text-gray-400"}>EN</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-[#1E1B4B] hover:bg-[#F6F3FC] focus:outline-none"
            aria-label="Toggle Menu"
            type="button"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer with Accordion */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E9E4F8] bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl max-h-[85vh] overflow-y-auto">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-xl px-3 py-2 text-base font-bold text-[#1E1B4B] hover:bg-[#F6F3FC]"
          >
            {t({ de: "Startseite", en: "Home" })}
          </Link>

          {/* Mobile Accordion for Leistungen */}
          <div className="space-y-1">
            <button
              onClick={() => setActiveAccordion(activeAccordion === "services" ? null : "services")}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-base font-bold text-[#1E1B4B] hover:bg-[#F6F3FC]"
            >
              <span>{t({ de: "Leistungen (17 Routen)", en: "Services (17 Routes)" })}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${activeAccordion === "services" ? "rotate-180 text-[#7C3AED]" : ""}`} />
            </button>

            {activeAccordion === "services" && (
              <div className="pl-3 pr-1 py-2 space-y-4 bg-[#F6F3FC] rounded-2xl border border-[#E9E4F8]">
                {NAV_PILLARS.map((pillar) => (
                  <div key={pillar.slug} className="space-y-2">
                    <Link
                      href={pillar.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-extrabold text-[#7C3AED] block px-2"
                    >
                      {t(pillar.title)}
                    </Link>
                    <div className="space-y-1">
                      {pillar.children.map((child, idx) => (
                        <Link
                          key={idx}
                          href={child.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block rounded-lg px-2 py-1.5 text-xs text-[#1E1B4B] hover:bg-white font-medium"
                        >
                          {t(child.label)}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/work"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-xl px-3 py-2 text-base font-bold text-[#1E1B4B] hover:bg-[#F6F3FC]"
          >
            {t({ de: "Arbeiten", en: "Work" })}
          </Link>

          <Link
            href="/services"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-xl px-3 py-2 text-base font-bold text-[#1E1B4B] hover:bg-[#F6F3FC]"
          >
            {t({ de: "Leistungen (Übersicht)", en: "All Services (Index)" })}
          </Link>

          <div className="pt-3 border-t border-[#E9E4F8]">
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-3 text-sm font-bold text-white shadow-xs"
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
