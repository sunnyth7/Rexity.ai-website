"use client";

import React from "react";

// Micro Visual 1: Workflow Node Graph (Automatisierung)
export function WorkflowNodeGraphVisual() {
  return (
    <div className="w-full h-24 rounded-xl bg-[#F6F3FC] border border-[#E9E4F8] p-3 flex items-center justify-between relative overflow-hidden group-hover:border-[#7C3AED]/40 transition-colors">
      <div className="flex items-center justify-between w-full relative z-10 px-2">
        {/* Node 1: Trigger */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-lg bg-[#1E1B4B] text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
            IN
          </div>
          <span className="text-[10px] font-mono text-[#6B6690]">WhatsApp</span>
        </div>

        {/* Connection Line 1 */}
        <div className="flex-1 h-0.5 mx-2 bg-[#E9E4F8] relative">
          <div className="absolute inset-0 bg-[#A78BFA] w-1/2 animate-pulse" />
        </div>

        {/* Node 2: AI Agent */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#7C3AED]">RAG Agent</span>
        </div>

        {/* Connection Line 2 */}
        <div className="flex-1 h-0.5 mx-2 bg-[#E9E4F8] relative">
          <div className="absolute inset-0 bg-[#7C3AED] w-1/2 animate-pulse [animation-delay:0.3s]" />
        </div>

        {/* Node 3: CRM / Database */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-lg bg-[#5B21B6] text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
            CRM
          </div>
          <span className="text-[10px] font-mono text-[#6B6690]">HubSpot</span>
        </div>
      </div>
    </div>
  );
}

// Micro Visual 2: Browser & Mobile Frames (Web & Apps)
export function DeviceFramesVisual() {
  return (
    <div className="w-full h-20 rounded-xl bg-[#F6F3FC] border border-[#E9E4F8] p-3 flex items-center justify-center gap-3 relative overflow-hidden group-hover:border-[#7C3AED]/40 transition-colors">
      {/* Browser Window Frame */}
      <div className="w-28 h-14 rounded-lg bg-white border border-[#E9E4F8] shadow-xs p-1.5 flex flex-col justify-between">
        <div className="flex items-center gap-1 border-b border-[#E9E4F8] pb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span className="w-1.5 h-1.5 rounded-full bg-purple-300" />
          <span className="w-1.5 h-1.5 rounded-full bg-purple-200" />
        </div>
        <div className="space-y-1">
          <div className="h-1.5 w-3/4 rounded bg-[#7C3AED]/30" />
          <div className="h-1 w-1/2 rounded bg-[#6B6690]/20" />
        </div>
      </div>

      {/* Mobile Phone Frame */}
      <div className="w-8 h-14 rounded-lg bg-[#1E1B4B] p-1 flex flex-col justify-between items-center shadow-xs">
        <div className="w-3 h-0.5 rounded-full bg-white/40" />
        <div className="w-full h-8 rounded bg-white/10 p-0.5 space-y-0.5">
          <div className="h-1 w-2/3 rounded bg-[#A78BFA]" />
          <div className="h-1 w-full rounded bg-white/20" />
        </div>
        <div className="w-1.5 h-1.5 rounded-full border border-white/40" />
      </div>
    </div>
  );
}

// Micro Visual 3: Voice Waveform Lines
export function VoiceWaveformVisual() {
  return (
    <div className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20">
      <span className="w-0.5 h-3 bg-[#7C3AED] rounded-full animate-pulse" />
      <span className="w-0.5 h-4 bg-[#7C3AED] rounded-full animate-pulse [animation-delay:0.15s]" />
      <span className="w-0.5 h-2 bg-[#7C3AED] rounded-full animate-pulse [animation-delay:0.3s]" />
      <span className="w-0.5 h-5 bg-[#A78BFA] rounded-full animate-pulse [animation-delay:0.45s]" />
      <span className="w-0.5 h-3 bg-[#7C3AED] rounded-full animate-pulse [animation-delay:0.2s]" />
    </div>
  );
}

// Micro Visual 4: Growth Chart Ticks (Marketing)
export function GrowthChartVisual() {
  return (
    <div className="w-full h-20 rounded-xl bg-[#F6F3FC] border border-[#E9E4F8] p-3 flex items-end justify-between gap-1.5 relative overflow-hidden group-hover:border-[#7C3AED]/40 transition-colors">
      <div className="w-1/5 h-1/3 rounded-t bg-[#E9E4F8]" />
      <div className="w-1/5 h-1/2 rounded-t bg-[#7C3AED]/30" />
      <div className="w-1/5 h-2/3 rounded-t bg-[#7C3AED]/60" />
      <div className="w-1/5 h-5/6 rounded-t bg-[#7C3AED]" />
      <div className="w-1/5 h-full rounded-t bg-[#5B21B6] shadow-xs group-hover:scale-y-105 transition-transform origin-bottom" />
    </div>
  );
}

// Micro Visual 5: QA Matrix Checkmarks (Testing & Support)
export function QAMatrixVisual() {
  return (
    <div className="w-full h-20 rounded-xl bg-[#F6F3FC] border border-[#E9E4F8] p-3 flex items-center justify-around relative overflow-hidden group-hover:border-[#7C3AED]/40 transition-colors">
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-mono font-bold text-[#1E1B4B]">E2E TEST</span>
        <span className="w-5 h-5 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center text-xs font-bold">✓</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-mono font-bold text-[#1E1B4B]">DSGVO</span>
        <span className="w-5 h-5 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center text-xs font-bold">✓</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-mono font-bold text-[#1E1B4B]">SLA 99.9%</span>
        <span className="w-5 h-5 rounded-full bg-[#5B21B6]/20 text-[#5B21B6] flex items-center justify-center text-xs font-bold">✓</span>
      </div>
    </div>
  );
}
