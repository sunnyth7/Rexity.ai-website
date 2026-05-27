"use client"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ContactForm } from "./contact-form"
import { useI18n } from "@/components/i18n-provider"

export default function ContactPage() {
  const { t } = useI18n()
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 pt-20 pb-32">
        <div className="grid gap-16 md:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
              {t("contact.eyebrow")}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              {t("contact.title")}
            </h1>
            <p className="mt-6 text-white/60">{t("contact.intro")}</p>
            <div className="mt-12 space-y-6">
              <div className="hud rounded-lg border border-cyan-400/10 bg-black/30 p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-300/70">
                  // {t("contact.email")}
                </p>
                <p className="mt-1 text-white">hello@rexity.ai</p>
              </div>
              <div className="hud rounded-lg border border-cyan-400/10 bg-black/30 p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-300/70">
                  // {t("contact.response")}
                </p>
                <p className="mt-1 text-white">{t("contact.responseValue")}</p>
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
