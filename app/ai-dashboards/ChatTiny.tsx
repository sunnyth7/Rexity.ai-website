// app/ai-dashboards/ChatTiny.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

// Proxy that forwards to your n8n webhook
const N8N_WEBHOOK = '/api/maintenance-chat';

type Msg = { from: 'user' | 'bot'; text: string };

export default function ChatTiny() {
  const [open, setOpen] = useState(true); // <- collapsed/expanded
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'bot', text: 'Hi there! I’m Sunny, your Maintenance Assistant. How can I help you today?' },
  ]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, open]);

  // Prefer plain text; gracefully handle JSON {output|reply|message|text}
  async function send() {
    const t = text.trim();
    if (!t || busy) return;

    setText('');
    setMsgs(m => [...m, { from: 'user', text: t }]);
    setBusy(true);

    try {
      const r = await fetch(N8N_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/plain, application/json;q=0.9, */*;q=0.1',
        },
        body: JSON.stringify({ message: t }),
        cache: 'no-store',
      });

      let reply = (await r.text()) || '';
      if (!r.ok) throw new Error('upstream');

      if (reply.trim().startsWith('{')) {
        try {
          const j = JSON.parse(reply);
          reply =
            (typeof j.output === 'string' && j.output) ||
            (typeof j.reply === 'string' && j.reply) ||
            (typeof j.message === 'string' && j.message) ||
            (typeof j.text === 'string' && j.text) ||
            JSON.stringify(j);
        } catch {
          /* keep raw text */
        }
      }

      setMsgs(m => [...m, { from: 'bot', text: reply.trim() }]);
    } catch {
      setMsgs(m => [
        ...m,
        { from: 'bot', text: 'Error encountered. Please check the info provided and try again in sometime.' },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') send();
  }

  // ---------- styles ----------
  const box: React.CSSProperties = {
    position: 'fixed', right: 16, bottom: 16, width: 360, maxHeight: '70vh',
    display: 'flex', flexDirection: 'column',
    background: 'rgba(0,0,0,0.25)', borderRadius: 16, overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(6px)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)', zIndex: 40,
    animation: 'rgbGlow 8s linear infinite',
  };
  const headWrap: React.CSSProperties = {
    background: '#000', color: '#fff', padding: '10px 12px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600,
  };
  const body: React.CSSProperties = {
    background: '#2b2b2b', color: '#eaeaea', padding: 12,
    overflowY: 'auto', gap: 10, display: 'flex', flexDirection: 'column', flex: 1,
  };
  const msg: React.CSSProperties = {
    fontSize: 14, lineHeight: 1.35, padding: '10px 12px', borderRadius: 12,
    maxWidth: '85%', wordWrap: 'break-word',
  };
  const user: React.CSSProperties = { ...msg, alignSelf: 'flex-end', background: '#3a3a3a' };
  const bot: React.CSSProperties  = { ...msg, alignSelf: 'flex-start', background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.06)' };
  const hint: React.CSSProperties = { color: '#c9c9c9', fontSize: 12, padding: '0 12px 8px' };
  const foot: React.CSSProperties = { background: '#2b2b2b', padding: 10, display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' };
  const input: React.CSSProperties = { flex: 1, background: '#dcdcdc', color: '#111', border: 'none', borderRadius: 10, padding: '10px 12px', outline: 'none' };
  const btn: React.CSSProperties   = { background: '#fff', color: '#111', border: 'none', padding: '10px 14px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', opacity: busy ? 0.6 : 1 };

  // Collapsed “capsule” button with RGB glow
  const capsule: React.CSSProperties = {
    position: 'fixed', right: 16, bottom: 16, zIndex: 40,
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px', borderRadius: 9999,
    background: 'rgba(10,10,12,0.9)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(6px)',
    cursor: 'pointer', userSelect: 'none',
    animation: 'rgbGlow 3.5s linear infinite',
  };
  const capsuleIcon: React.CSSProperties = {
    width: 18, height: 18, display: 'inline-block',
  };
  const collapseBtn: React.CSSProperties = {
    background: 'transparent', color: '#fff', border: 'none',
    fontSize: 18, lineHeight: 1, opacity: 0.8, cursor: 'pointer',
  };

  return (
    <>
      {/* RGB glow animation (corners lighting) */}
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
        <div style={box} role="region" aria-label="Maintenance Assistant chat">
          <div style={headWrap}>
            <span>Maintenance Assistant</span>
            {/* Collapse / minimize */}
            <button
              aria-label="Collapse chat"
              title="Collapse"
              style={collapseBtn}
              onClick={() => setOpen(false)}
            >
              —{/* en dash as a clean minimize glyph */}
            </button>
          </div>

          <div ref={listRef} style={body}>
            {msgs.map((m, i) => (
              <div key={i} style={m.from === 'user' ? user : bot}>{m.text}</div>
            ))}
          </div>

          <div style={hint}>I’ll fetch details from SAP via your n8n flow. Keep it simple.</div>

          <div style={foot}>
            <input
              style={input}
              placeholder="Type your question…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
              aria-label="Your message"
            />
            <button style={btn} onClick={send} disabled={busy}>Send</button>
          </div>
        </div>
      ) : (
        // Collapsed capsule
        <button
          type="button"
          aria-label="Open chat"
          style={capsule}
          className="capsule-hover"
          onClick={() => setOpen(true)}
        >
          {/* tiny chat bubble svg so no extra deps */}
          <svg viewBox="0 0 24 24" fill="currentColor" style={capsuleIcon} aria-hidden="true">
            <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4.5 3.5A1 1 0 0 1 3 19v-1H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
          </svg>
          <span style={{ fontWeight: 600 }}>Chat with Assistant</span>
        </button>
      )}
    </>
  );
}
