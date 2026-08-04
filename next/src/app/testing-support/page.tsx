import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";

export default function TestingSupportPage() {
  return (
    <div className="w-full bg-white space-y-0">
      {/* Hero Section */}
      <section className="bg-white pt-12 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#7C3AED]">
          <Link href="/" className="hover:underline">Home</Link> / 
          <span className="text-[#1E1B4B] font-bold">Testing & Support</span>
        </div>

        <div className="space-y-4 max-w-3xl">
          <span className="font-mono text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
            04.1 · TESTING & QUALITY ASSURANCE
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1E1B4B]">Testing & Support</h1>
          <p className="text-xl font-semibold text-[#7C3AED]">Ausliefern, ohne die Luft anzuhalten.</p>
          <p className="text-base sm:text-lg text-[#6B6690] leading-relaxed">
            End-to-End-Testing, DSGVO-Compliance Audits und Post-Launch-Support — damit Releases sauber landen und gesund bleiben, über Geräte, Browser und OS-Versionen hinweg.
          </p>
        </div>

        <div>
          <a
            href="mailto:hello@rexity.ai"
            className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-7 py-3 text-sm font-bold text-white hover:bg-[#5B21B6] transition-all shadow-sm"
          >
            <span>Support anfragen</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* How it works (--bg-tint) */}
      <section className="bg-[#F6F3FC] py-16 px-4 sm:px-6 lg:px-8 border-y border-[#E9E4F8]">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-[#7C3AED] uppercase tracking-wider">METHODIK</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1B4B]">So funktioniert&apos;s</h2>
            <p className="text-base text-[#6B6690] max-w-2xl">
              Guter Support ist ein Kreislauf: reproduzieren, an der Wurzel beheben, verifizieren und den nächsten Fall verhindern.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[#E9E4F8] bg-white p-6 space-y-3 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-bold text-sm">1</div>
              <h3 className="text-lg font-bold text-[#1E1B4B]">Automatisierte E2E-Tests</h3>
              <p className="text-sm text-[#6B6690]">Continuous Integration Tests für kritische Nutzerpfade bei jedem Commit.</p>
            </div>

            <div className="rounded-2xl border border-[#E9E4F8] bg-white p-6 space-y-3 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-bold text-sm">2</div>
              <h3 className="text-lg font-bold text-[#1E1B4B]">DSGVO-Compliance Guard</h3>
              <p className="text-sm text-[#6B6690]">Prüfung von Datenfluss, Cookie-Einwilligungen und EU-Hosting-Standards.</p>
            </div>

            <div className="rounded-2xl border border-[#E9E4F8] bg-white p-6 space-y-3 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-bold text-sm">3</div>
              <h3 className="text-lg font-bold text-[#1E1B4B]">SLA & Express Bugfixes</h3>
              <p className="text-sm text-[#6B6690]">Garantiertes Reaktionsfenster und direkte Behebung durch Senior-Entwickler.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Included & Benefits (White) */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-3xl border border-[#E9E4F8] bg-white p-8 space-y-6 shadow-xs">
            <h2 className="text-2xl font-bold text-[#1E1B4B]">Was dazugehört</h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-[#1E1B4B] font-medium">
                <CheckCircle className="h-5 w-5 text-[#7C3AED] flex-none" />
                <span>Playwright & Cypress E2E-Testreihen</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#1E1B4B] font-medium">
                <CheckCircle className="h-5 w-5 text-[#7C3AED] flex-none" />
                <span>Datenschutz- & Log-Auditierung</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#1E1B4B] font-medium">
                <CheckCircle className="h-5 w-5 text-[#7C3AED] flex-none" />
                <span>Uptime Monitoring (99.9% SLA)</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-[#E9E4F8] bg-[#F6F3FC] p-8 space-y-6">
            <h2 className="text-2xl font-bold text-[#1E1B4B]">Was Sie bekommen</h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-[#1E1B4B] font-semibold">
                <Sparkles className="h-5 w-5 text-[#7C3AED] flex-none" />
                <span>Sorgenfreie, regressionsfreie Deployments</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#1E1B4B] font-semibold">
                <Sparkles className="h-5 w-5 text-[#7C3AED] flex-none" />
                <span>Revisionssichere Compliance-Dokumentation</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#1E1B4B] font-semibold">
                <Sparkles className="h-5 w-5 text-[#7C3AED] flex-none" />
                <span>Direkter Draht zu den Entwickelnden</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white p-8 sm:p-12 text-center space-y-4 shadow-xl">
          <h2 className="text-2xl font-bold">Benötigen Sie verlässliches Testing oder Wartung für Ihre Systeme?</h2>
          <p className="text-purple-100 max-w-lg mx-auto">
            Senden Sie uns Ihre Anforderungen. Wir bieten flexible SLA-Pakete und einmalige Audits.
          </p>
          <a
            href="mailto:hello@rexity.ai"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-[#1E1B4B] hover:bg-[#F6F3FC] transition-all"
          >
            <span>Jetzt E-Mail an hello@rexity.ai</span>
            <ArrowRight className="h-4 w-4 text-[#7C3AED]" />
          </a>
        </div>
      </section>
    </div>
  );
}
