"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "de" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: <T>(obj: { de: T; en: T }) => T;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("de");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rexity_lang") as Language;
      if (saved === "de" || saved === "en") {
        setLangState(saved);
        document.documentElement.lang = saved;
      } else {
        document.documentElement.lang = "de";
      }
    } catch {
      document.documentElement.lang = "de";
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    document.documentElement.lang = newLang;
    try {
      localStorage.setItem("rexity_lang", newLang);
      window.dispatchEvent(
        new CustomEvent("rexity:languagechange", { detail: { lang: newLang } })
      );
    } catch {
      // ignore storage errors
    }
  };

  const t = <T,>(obj: { de: T; en: T }): T => {
    return obj[lang] || obj.de;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
