"use client"

/**
 * AIAssistantChat - Reusable AI Chat Component
 *
 * A floating chat widget that connects to an AI assistant via webhook.
 * Features:
 * - Collapsible floating UI with RGB glow animation
 * - Dark theme with glassmorphism effects
 * - Automatic scroll to latest message
 * - Error handling and loading states
 * - Fully customizable via props
 *
 * @example
 * ```tsx
 * <AIAssistantChat
 *   apiEndpoint="/api/chat"
 *   assistantName="My AI Assistant"
 *   welcomeMessage="Hi! How can I help you today?"
 *   placeholder="Type your question..."
 *   helpText="I'm here to assist you with your questions."
 * />
 * ```
 */

import type React from "react"
import { useEffect, useRef, useState } from "react"

export interface AIAssistantChatProps {
  /** API endpoint to send messages to (e.g., "/api/chat") */
  apiEndpoint: string

  /** Display name of the assistant (e.g., "Maintenance Assistant") */
  assistantName?: string

  /** Initial welcome message from the bot */
  welcomeMessage?: string

  /** Placeholder text for the input field */
  placeholder?: string

  /** Help text shown below the chat messages */
  helpText?: string

  /** Button text for collapsed state */
  collapsedButtonText?: string

  /** Whether to start collapsed (default: true) */
  startCollapsed?: boolean

  /** Custom error message */
  errorMessage?: string

  /** Position of the chat widget */
  position?: {
    right?: number
    bottom?: number
    left?: number
    top?: number
  }

  /** Custom styles for the chat box */
  customStyles?: {
    primaryColor?: string
    backgroundColor?: string
    textColor?: string
  }
}

type Msg = { from: "user" | "bot"; text: string }

export default function AIAssistantChat({
  apiEndpoint,
  assistantName = "AI Assistant",
  welcomeMessage = "Hi there! How can I help you today?",
  placeholder = "Type your question…",
  helpText = "I'm here to assist you with your questions.",
  collapsedButtonText = "Chat with Assistant",
  startCollapsed = true,
  errorMessage = "Error encountered. Please check the info provided and try again in sometime.",
  position = { right: 16, bottom: 16 },
  customStyles = {},
}: AIAssistantChatProps) {
  const [open, setOpen] = useState(!startCollapsed)
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "bot",
      text: welcomeMessage,
    },
  ])
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [msgs, open])

  async function send() {
    const t = text.trim()
    if (!t || busy) return

    setText("")
    setMsgs((m) => [...m, { from: "user", text: t }])
    setBusy(true)

    try {
      const r = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain, application/json;q=0.9, */*;q=0.1",
        },
        body: JSON.stringify({ message: t }),
        cache: "no-store",
      })

      let reply = (await r.text()) || ""
      if (!r.ok) throw new Error("upstream")

      // Try to parse JSON response and extract message
      if (reply.trim().startsWith("{")) {
        try {
          const j = JSON.parse(reply)
          reply =
            (typeof j.output === "string" && j.output) ||
            (typeof j.reply === "string" && j.reply) ||
            (typeof j.message === "string" && j.message) ||
            (typeof j.text === "string" && j.text) ||
            JSON.stringify(j)
        } catch {
          /* keep raw text */
        }
      }

      setMsgs((m) => [...m, { from: "bot", text: reply.trim() }])
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: errorMessage }])
    } finally {
      setBusy(false)
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") send()
  }

  // Styles
  const box: React.CSSProperties = {
    position: "fixed",
    ...position,
    width: 360,
    maxHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    background: customStyles.backgroundColor || "rgba(0,0,0,0.25)",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(6px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    zIndex: 40,
  }

  const headWrap: React.CSSProperties = {
    background: customStyles.primaryColor || "#000",
    color: customStyles.textColor || "#fff",
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontWeight: 600,
  }

  const body: React.CSSProperties = {
    background: "#2b2b2b",
    color: "#eaeaea",
    padding: 12,
    overflowY: "auto",
    gap: 10,
    display: "flex",
    flexDirection: "column",
    flex: 1,
  }

  const msg: React.CSSProperties = {
    fontSize: 14,
    lineHeight: 1.35,
    padding: "10px 12px",
    borderRadius: 12,
    maxWidth: "85%",
    wordWrap: "break-word",
  }

  const user: React.CSSProperties = { ...msg, alignSelf: "flex-end", background: "#3a3a3a" }
  const bot: React.CSSProperties = {
    ...msg,
    alignSelf: "flex-start",
    background: "#1f1f1f",
    border: "1px solid rgba(255,255,255,0.06)",
  }

  const hint: React.CSSProperties = { color: "#c9c9c9", fontSize: 12, padding: "0 12px 8px" }

  const foot: React.CSSProperties = {
    background: "#2b2b2b",
    padding: 10,
    display: "flex",
    gap: 8,
    alignItems: "center",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  }

  const input: React.CSSProperties = {
    flex: 1,
    background: "#dcdcdc",
    color: "#111",
    border: "none",
    borderRadius: 10,
    padding: "10px 12px",
    outline: "none",
  }

  const btn: React.CSSProperties = {
    background: "#fff",
    color: "#111",
    border: "none",
    padding: "10px 14px",
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
    opacity: busy ? 0.6 : 1,
  }

  const capsule: React.CSSProperties = {
    position: "fixed",
    ...position,
    zIndex: 40,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 9999,
    background: "rgba(10,10,12,0.9)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(6px)",
    cursor: "pointer",
    userSelect: "none",
    animation: "rgbGlow 3.5s linear infinite",
  }

  const capsuleIcon: React.CSSProperties = {
    width: 18,
    height: 18,
    display: "inline-block",
  }

  const collapseBtn: React.CSSProperties = {
    background: "transparent",
    color: "#fff",
    border: "none",
    fontSize: 18,
    lineHeight: 1,
    opacity: 0.8,
    cursor: "pointer",
  }

  return (
    <>
      <style>{`
        @keyframes rgbGlow {
          0%   { box-shadow: 0 0 22px 2px rgba(59,130,246,.35); }
          25%  { box-shadow: 0 0 22px 2px rgba(139,92,246,.35); }
          50%  { box-shadow: 0 0 22px 2px rgba(236,72,153,.35); }
          75%  { box-shadow: 0 0 22px 2px rgba(16,185,129,.35); }
          100% { box-shadow: 0 0 22px 2px rgba(59,130,246,.35); }
        }
        .capsule-hover:hover { filter: brightness(1.1); }
      `}</style>

      {open ? (
        <div style={box} role="region" aria-label={`${assistantName} chat`}>
          <div style={headWrap}>
            <span>{assistantName}</span>
            <button aria-label="Collapse chat" title="Collapse" style={collapseBtn} onClick={() => setOpen(false)}>
              —
            </button>
          </div>

          <div ref={listRef} style={body}>
            {msgs.map((m, i) => (
              <div key={i} style={m.from === "user" ? user : bot}>
                {m.text}
              </div>
            ))}
          </div>

          <div style={hint}>{helpText}</div>

          <div style={foot}>
            <input
              style={input}
              placeholder={placeholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
              aria-label="Your message"
            />
            <button style={btn} onClick={send} disabled={busy}>
              Send
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Open chat"
          style={capsule}
          className="capsule-hover"
          onClick={() => setOpen(true)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" style={capsuleIcon} aria-hidden="true">
            <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4.5 3.5A1 1 0 0 1 3 19v-1H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          </svg>
          <span style={{ fontWeight: 600 }}>{collapsedButtonText}</span>
        </button>
      )}
    </>
  )
}
