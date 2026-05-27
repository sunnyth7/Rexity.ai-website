"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"
import { SERVICES, bi } from "@/lib/services"

type Status = "idle" | "submitting" | "success" | "error"

export function ContactForm() {
  const { t, locale } = useI18n()
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("submitting")
    setError(null)

    const fd = new FormData(e.currentTarget)
    const payload = {
      name: fd.get("name"),
      email: fd.get("email"),
      company: fd.get("company"),
      service: fd.get("service"),
      message: fd.get("message"),
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Something went wrong.")
      setStatus("success")
      e.currentTarget.reset()
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Something went wrong.")
    }
  }

  if (status === "success") {
    return (
      <div className="hud flex flex-col justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-8">
        <h2 className="text-2xl font-semibold text-white">{t("contact.success.title")}</h2>
        <p className="mt-3 text-white/70">{t("contact.success.body")}</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 self-start font-mono text-xs uppercase tracking-widest text-cyan-300 hover:text-white"
        >
          {t("contact.success.again")}
        </button>
      </div>
    )
  }

  const input =
    "w-full rounded-lg border border-cyan-400/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-cyan-300/60 focus:bg-black/60 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.15)]"
  const label = "mb-2 block font-mono text-[10px] uppercase tracking-widest text-cyan-300/70"

  return (
    <form
      onSubmit={onSubmit}
      className="hud space-y-4 rounded-2xl border border-cyan-400/10 bg-black/40 p-8"
    >
      <div>
        <label className={label}>// {t("contact.form.name")}</label>
        <input name="name" required maxLength={200} className={input} placeholder="Jane Doe" />
      </div>
      <div>
        <label className={label}>// {t("contact.form.email")}</label>
        <input name="email" type="email" required className={input} placeholder="jane@company.com" />
      </div>
      <div>
        <label className={label}>// {t("contact.form.company")}</label>
        <input name="company" className={input} placeholder="Acme Inc." />
      </div>
      <div>
        <label className={label}>// {t("contact.form.service")}</label>
        <select name="service" defaultValue="" className={input}>
          <option value="">{t("contact.form.serviceNone")}</option>
          {SERVICES.map((s) => (
            <option key={s.slug} value={s.slug}>
              {bi(s.title, locale)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={label}>// {t("contact.form.message")}</label>
        <textarea
          name="message"
          required
          maxLength={5000}
          rows={5}
          className={input}
          placeholder={t("contact.form.messagePh")}
        />
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-medium text-black shadow-[0_0_24px_rgba(34,211,238,0.45)] transition hover:bg-cyan-300 disabled:opacity-60"
      >
        {status === "submitting" ? t("contact.form.sending") : t("contact.form.submit")}
        <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
      </button>
    </form>
  )
}
