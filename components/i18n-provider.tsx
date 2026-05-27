"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { translate, type Locale } from "@/lib/i18n/dict"

type Ctx = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<Ctx | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem("rexity.locale") as Locale | null)) || null
    if (stored === "en" || stored === "de") {
      setLocaleState(stored)
      document.documentElement.lang = stored
    } else if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("de")) {
      setLocaleState("de")
      document.documentElement.lang = "de"
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem("rexity.locale", l)
      document.documentElement.lang = l
    } catch {}
  }, [])

  const tr = useCallback((key: string) => translate(key, locale), [locale])

  return <I18nContext.Provider value={{ locale, setLocale, t: tr }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider")
  return ctx
}
