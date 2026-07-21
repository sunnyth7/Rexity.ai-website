import type { Locale } from "./contracts"

export type VoiceProvider = "vapi" | "retell"

export type RecordingConsentState = "unknown" | "granted" | "denied"

export interface VoiceSessionConfig {
  assistantName: string
  locale: Locale
  recordingConsent: RecordingConsentState
}

export interface VoiceProviderEvent {
  provider: VoiceProvider
  eventId: string
  callId: string
  callerId?: string
  transcriptText?: string
  eventType:
    | "call_started"
    | "speech"
    | "tool_result"
    | "call_ended"
    | "error"
}

// S3-T1: anchored patterns. Only standalone affirmations or recording-specific
// phrases count. "no problem at all" or "yes, I have a question" are treated as
// `unknown` so they don't accidentally trigger consent change.
const YES_PATTERNS = [
  /^\s*(?:yes|yeah|yep|sure|ok(?:ay)?)[.!\s]*$/i,
  /\bi\s+(?:agree|consent)\b/i,
  /\byou\s+may\s+record\b/i,
  /\bgo\s+ahead\s+and\s+record\b/i,
  /^\s*(?:ja|jawohl|klar|gerne)[.!\s]*$/i,
  /\beinverstanden\b/i,
  /\bich\s+stimme\s+(?:zu|der\s+aufzeichnung\s+zu)\b/i,
  /\bsie\s+d(?:ü|ue)rfen\s+aufzeichnen\b/i,
]

const NO_PATTERNS = [
  /^\s*(?:no|nope|nah)[.!\s]*$/i,
  /\bi\s+(?:do\s+not|don'?t)\s+(?:consent|agree)\b/i,
  /\bdo\s+not\s+record\b/i,
  /\bplease\s+do\s+not\s+record\b/i,
  /^\s*(?:nein|niemals)[.!\s]*$/i,
  /\bnicht\s+aufzeichnen\b/i,
  /\bkeine\s+aufnahme\b/i,
  /\bich\s+m(?:ö|oe)chte\s+nicht\s+aufgezeichnet\s+werden\b/i,
]

export function getRexonaDisclosure({
  assistantName,
  locale,
}: Pick<VoiceSessionConfig, "assistantName" | "locale">) {
  if (locale === "de") {
    return `Guten Tag, mein Name ist ${assistantName}, die virtuelle Assistenz von Rexity. Ich kann Fragen zu unseren Leistungen beantworten und Termine vorbereiten. Bei komplexen Anliegen verbinde ich Sie mit unserem Team.`
  }

  return `Hi, I am ${assistantName}, Rexity's virtual assistant. I can answer questions about our services, products, demos, and appointments. For complex decisions, I will route you to the team.`
}

export function getRecordingConsentPrompt(locale: Locale) {
  if (locale === "de") {
    return "Dürfen wir dieses Gespräch zu Qualitäts- und Nachweiszwecken aufzeichnen? Wenn nicht, helfe ich gerne ohne Aufzeichnung weiter."
  }

  return "May we record this call for quality and documentation purposes? If not, I can continue without recording."
}

/**
 * S3-T1: parse recording consent only from a response to the consent prompt.
 *
 * Pass `respondingToConsentPrompt: false` when the user is mid-conversation and
 * not directly answering the consent question — the parser then returns
 * `unknown` and we do NOT change the consent state. This prevents bare "no" or
 * "yes" inside an unrelated sentence from flipping recording on or off.
 */
export function parseRecordingConsent(
  text: string,
  respondingToConsentPrompt: boolean = true,
): RecordingConsentState {
  if (!respondingToConsentPrompt) return "unknown"
  if (YES_PATTERNS.some((pattern) => pattern.test(text))) return "granted"
  if (NO_PATTERNS.some((pattern) => pattern.test(text))) return "denied"
  return "unknown"
}

export function shouldRecordCall(consent: RecordingConsentState) {
  return consent === "granted"
}

export function getNoRecordingNotice(locale: Locale) {
  if (locale === "de") {
    return "Alles klar, ich fahre ohne Aufzeichnung fort."
  }

  return "Understood, I will continue without recording."
}

export function normalizeVoiceProviderEvent(
  provider: VoiceProvider,
  payload: unknown,
): VoiceProviderEvent | null {
  if (!payload || typeof payload !== "object") return null

  const record = payload as Record<string, unknown>
  const eventId = String(record.eventId ?? record.id ?? "")
  const call =
    typeof record.call === "object" && record.call
      ? (record.call as { id?: unknown })
      : undefined
  const callId = String(record.callId ?? record.call_id ?? call?.id ?? "")
  const eventType = String(record.type ?? record.event ?? "")

  if (!eventId || !callId) return null

  return {
    provider,
    eventId,
    callId,
    callerId: record.from ? String(record.from) : undefined,
    transcriptText: record.transcript
      ? String(record.transcript)
      : record.text
        ? String(record.text)
        : undefined,
    eventType: mapVoiceEventType(eventType),
  }
}

function mapVoiceEventType(eventType: string): VoiceProviderEvent["eventType"] {
  if (/start|call_started/i.test(eventType)) return "call_started"
  if (/speech|transcript|message/i.test(eventType)) return "speech"
  if (/tool/i.test(eventType)) return "tool_result"
  if (/end|hangup|call_ended/i.test(eventType)) return "call_ended"
  return "error"
}
