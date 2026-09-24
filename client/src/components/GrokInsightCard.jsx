import { useState } from 'react'
import GrokBotMascot from './GrokBotMascot'

/**
 * GrokInsightCard Component
 * Displays Grok Bot's witty AI synthesis, issue recommendations, and tactical contributor advice.
 */
export default function GrokInsightCard({
  insight,
  query,
  onDismiss,
}) {
  const [copied, setCopied] = useState(false)

  if (!insight) return null

  const {
    wittySummary = '',
    topRecommendation = '',
    contributorTips = [],
    tacticalAdvice = '',
    modelUsed = 'gemini-3.6-flash',
  } = insight

  function handleCopy() {
    const textToCopy = `Grok Bot Analysis for "${query}":\n\n${wittySummary}\n\nTop Pick: ${topRecommendation}\n\nTactical Advice: ${tacticalAdvice}`
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-purple-500/25 bg-gradient-to-br from-white/95 via-[#F7F5F0]/95 to-purple-50/50 p-6 shadow-xl backdrop-blur-md text-left animate-fadeIn">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-purple-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-blue-200/20 blur-3xl" />

      {/* Top Header bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A18]/10 pb-4">
        <div className="flex items-center gap-3">
          <GrokBotMascot size={42} interactive={false} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="[font-family:Georgia,serif] text-lg font-bold text-[#1A1A18]">
                Grok Bot Intelligence
              </h3>
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-700">
                {modelUsed}
              </span>
            </div>
            <p className="text-xs text-[#1A1A18]/60">
              Synthesized from GitHub live search results for &ldquo;{query}&rdquo;
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-[#1A1A18]/15 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#1A1A18]/70 shadow-sm transition hover:bg-white hover:text-[#1A1A18]"
            title="Copy insights to clipboard"
          >
            {copied ? '✓ Copied' : 'Copy Breakdown'}
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg p-1.5 text-[#1A1A18]/50 transition hover:bg-[#1A1A18]/10 hover:text-[#1A1A18]"
              title="Close Grok card"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Grok Commentary */}
      <div className="relative z-10 mt-5 space-y-4">
        {wittySummary && (
          <div className="rounded-xl border border-emerald-900/10 bg-emerald-950/5 p-4">
            <p className="text-sm font-medium leading-relaxed text-[#1A1A18]/85">
              <span className="mr-1.5 font-bold text-[#2D6A4F]">Grok’s Verdict:</span>
              {wittySummary}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Recommendation */}
          {topRecommendation && (
            <div className="rounded-xl border border-[#1A1A18]/10 bg-white/70 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2D6A4F]">
                <span>🎯</span>
                <span>Top Contribution Target</span>
              </div>
              <p className="mt-2 text-sm font-semibold leading-snug text-[#1A1A18]">
                {topRecommendation}
              </p>
            </div>
          )}

          {/* Tactical Advice */}
          {tacticalAdvice && (
            <div className="rounded-xl border border-[#1A1A18]/10 bg-white/70 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2D6A4F]">
                <span>💡</span>
                <span>Tactical PR Advice</span>
              </div>
              <p className="mt-2 text-sm font-semibold leading-snug text-[#1A1A18]">
                {tacticalAdvice}
              </p>
            </div>
          )}
        </div>

        {/* Contributor Action Checklist */}
        {contributorTips && contributorTips.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#1A1A18]/50">
              Grok’s Action Checklist
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {contributorTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-full border border-[#2D6A4F]/20 bg-white/80 px-3.5 py-1 text-xs font-medium text-[#1A1A18]/80 shadow-xs"
                >
                  <span className="text-[#2D6A4F]">✓</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
