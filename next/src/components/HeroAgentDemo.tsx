"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
import { Bot, CheckCheck, Sparkles } from "lucide-react";

export function HeroAgentDemo() {
  const { lang } = useLanguage();

  const scenarios = {
    de: {
      question: "Können Sie einen WhatsApp-Bot für unseren Kundenservice bauen?",
      statusThinking: "Rexity-Agent analysiert Anfrage...",
      answer: "Ja, absolut. Wir entwickeln DSGVO-konforme WhatsApp-Agenten mit automatischer Lead-Qualifizierung, RAG-Wissensdatenbank & CRM-Anbindung in 14–21 Tagen.",
    },
    en: {
      question: "Can you build an automated WhatsApp bot for our customer support?",
      statusThinking: "Rexity Agent analyzing request...",
      answer: "Yes, absolutely. We build GDPR-compliant WhatsApp agents with automated lead qualification, RAG databanks, & CRM sync in 14–21 days.",
    },
  };

  const current = scenarios[lang] || scenarios.de;

  const [step, setStep] = useState<"question" | "thinking" | "answering" | "complete">("question");
  const [typedAnswer, setTypedAnswer] = useState("");

  useEffect(() => {
    let isMounted = true;

    const runLoop = async () => {
      setStep("question");
      setTypedAnswer("");
      await new Promise((r) => setTimeout(r, 1200));
      if (!isMounted) return;

      setStep("thinking");
      await new Promise((r) => setTimeout(r, 1500));
      if (!isMounted) return;

      setStep("answering");
      const fullText = current.answer;
      for (let i = 1; i <= fullText.length; i++) {
        if (!isMounted) return;
        setTypedAnswer(fullText.slice(0, i));
        await new Promise((r) => setTimeout(r, 22));
      }

      setStep("complete");
      await new Promise((r) => setTimeout(r, 4500));
      if (!isMounted) return;

      runLoop();
    };

    runLoop();

    return () => {
      isMounted = false;
    };
  }, [lang, current.answer]);

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl border border-[#E9E4F8] bg-white p-4 sm:p-7 shadow-lg space-y-4 text-left font-sans transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#E9E4F8] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-[#7C3AED] text-white shadow-xs">
            <Bot className="h-5 w-5" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#A78BFA] border-2 border-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#1E1B4B]">Rexity AI Agent</span>
              <span className="rounded-full bg-[#7C3AED]/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#7C3AED] uppercase tracking-wider">
                LIVE DEMO
              </span>
            </div>
            <p className="text-xs text-[#6B6690]">
              {step === "thinking" ? (
                <span className="text-[#7C3AED] font-semibold animate-pulse">{current.statusThinking}</span>
              ) : (
                "AZURE OPENAI · EU DATA ZONE"
              )}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#6B6690]">
          <Sparkles className="h-3.5 w-3.5 text-[#7C3AED]" />
          <span>AUTONOMOUS INTAKE</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="space-y-3 min-h-[160px] sm:min-h-[140px] flex flex-col justify-center">
        {/* User Bubble */}
        <div className="flex justify-end">
          <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs bg-[#1E1B4B] text-white p-3.5 text-xs sm:text-sm shadow-xs space-y-1">
            <p className="leading-relaxed">{current.question}</p>
            <div className="flex items-center justify-end gap-1 text-[10px] text-white/70">
              <span>11:42</span>
              <CheckCheck className="h-3 w-3 text-[#A78BFA]" />
            </div>
          </div>
        </div>

        {/* Agent Reply Bubble */}
        {(step === "thinking" || step === "answering" || step === "complete") && (
          <div className="flex justify-start">
            <div className="max-w-[90%] sm:max-w-[80%] rounded-2xl rounded-tl-xs bg-[#F6F3FC] border border-[#E9E4F8] text-[#1E1B4B] p-3.5 text-xs sm:text-sm shadow-xs space-y-1.5">
              {step === "thinking" ? (
                <div className="flex items-center gap-1.5 py-1 text-[#7C3AED]">
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-bounce [animation-delay:0.4s]" />
                </div>
              ) : (
                <>
                  <p className="leading-relaxed">{typedAnswer}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-[#E9E4F8]/60 text-[10px] text-[#6B6690]">
                    <span className="font-mono font-medium text-[#7C3AED]">DSGVO Audited · 14–21d Implementation</span>
                    <span>11:42</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
