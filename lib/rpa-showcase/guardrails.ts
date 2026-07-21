import { z } from "zod"

import type { GuardrailTopic, Locale, ModelOutput, RagResult } from "./contracts"

const guardedTopicPatterns: Array<{ topic: GuardrailTopic; pattern: RegExp }> = [
  { topic: "pricing", pattern: /\b(price|pricing|cost|quote|angebot|preis|kosten)\b/i },
  { topic: "refund", pattern: /\b(refund|reimburse|money back|erstattung|rueckerstattung|rückerstattung)\b/i },
  { topic: "legal", pattern: /\b(legal|lawyer|liability|rechtlich|anwalt|haftung|dsgvo)\b/i },
  { topic: "billing", pattern: /\b(invoice|billing|payment|rechnung|zahlung|abbuchung)\b/i },
  { topic: "contract", pattern: /\b(contract|terms|sla|vertrag|agb|kuendigung|kündigung)\b/i },
  {
    topic: "delivery_commitment",
    pattern: /\b(guarantee|guaranteed|binding date|garantie|verbindlich|liefertermin)\b/i,
  },
]

const promptInjectionPatterns = [
  /\bignore\s+(all\s+)?previous\s+instructions\b/i,
  /\bdisregard\s+(the\s+)?system\b/i,
  /\breveal\s+(your\s+)?(system|developer)\s+prompt\b/i,
  /\bact\s+as\s+(a\s+)?(different|unrestricted)\b/i,
  /\btool\s+call\b.*\bwithout\b.*\bapproval\b/i,
  /\bignoriere\s+(alle\s+)?(vorherigen\s+)?anweisungen\b/i,
  /\bsystemprompt\b/i,
]

export const modelOutputSchema = z.object({
  intent: z.enum([
    "faq",
    "booking",
    "handoff",
    "opt_out",
    "unknown",
    "guardrail_refusal",
  ]),
  reply: z.string().min(1).max(2000),
  confidence: z.number().min(0).max(1),
  requestedTool: z
    .enum(["calendar_scan", "calendar_hold", "calendar_confirm", "handoff"])
    .optional(),
  guardrailTopic: z
    .enum(["pricing", "refund", "legal", "billing", "contract", "delivery_commitment"])
    .optional(),
})

export function detectGuardrailTopic(text: string): GuardrailTopic | null {
  return guardedTopicPatterns.find(({ pattern }) => pattern.test(text))?.topic ?? null
}

export function detectPromptInjection(text: string) {
  return promptInjectionPatterns.some((pattern) => pattern.test(text))
}

export function validateModelOutput(output: unknown) {
  return modelOutputSchema.safeParse(output)
}

export function getGuardrailRefusal(topic: GuardrailTopic, locale: Locale) {
  const suffix =
    locale === "de"
      ? "Ich kann Ihr Anliegen aber an unser Team weitergeben oder einen Rückruf vorbereiten."
      : "I can route this to our team or prepare a callback instead."

  if (locale === "de") {
    return `Das kann ich nicht verbindlich entscheiden. ${suffix}`
  }

  return `I cannot make a binding ${topic.replace("_", " ")} decision. ${suffix}`
}

export function getNoAnswerFallback(locale: Locale) {
  if (locale === "de") {
    return "Dazu habe ich in den freigegebenen Informationen keine sichere Antwort. Ich kann Sie mit unserem Team verbinden oder einen Rückruf vorbereiten."
  }

  return "I do not have a safe answer from the approved knowledge base. I can connect you with the team or prepare a callback."
}

export function applyClosedBookPolicy(
  result: RagResult,
  { minimumConfidence = 0.72 }: { minimumConfidence?: number } = {},
) {
  if (!result.answer.trim() || result.confidence < minimumConfidence) {
    return { ok: false as const, reason: "no_answer" as const }
  }

  return { ok: true as const, answer: result.answer, citations: result.citations }
}

export function coerceSafeModelOutput(output: unknown): ModelOutput {
  const parsed = validateModelOutput(output)
  if (!parsed.success) {
    return {
      intent: "handoff",
      reply: "I need to route this to the Rexity team.",
      confidence: 0,
      requestedTool: "handoff",
    }
  }

  const data = parsed.data
  if (data.confidence < 0.5) {
    return {
      intent: "handoff",
      reply: data.reply,
      confidence: data.confidence,
      requestedTool: "handoff",
    }
  }

  return data
}
