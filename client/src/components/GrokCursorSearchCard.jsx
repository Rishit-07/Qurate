import { useState, useRef, useEffect } from 'react'
import GrokBotMascot from './GrokBotMascot'

/**
 * GrokCursorSearchCard Component
 * Harmonized with Qurate's core theme:
 * - Signature palette: Forest Emerald (#2D6A4F), Warm Charcoal (#1A1A18), Cream (#F7F5F0), and Mint (#52B788).
 * - Unified single search (no mode toggles).
 * - Animated Grok cloud mascot with real-time cursor tracking.
 * - Dynamic emerald spotlight and magnetic glowing border.
 */
export default function GrokCursorSearchCard({
  query,
  setQuery,
  onSearch,
  loading,
  placeholder,
}) {
  const cardRef = useRef(null)
  const [globalCursor, setGlobalCursor] = useState({ x: 0, y: 0 })
  const [cardMouse, setCardMouse] = useState({ x: 250, y: 100, isOver: false })
  const [isFocused, setIsFocused] = useState(false)
  const [cardTilt, setCardTilt] = useState({ rotateX: 0, rotateY: 0 })

  // Track global window cursor position for bot pupil tracking
  useEffect(() => {
    function handleWindowMouseMove(e) {
      setGlobalCursor({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleWindowMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleWindowMouseMove)
  }, [])

  // Handle local card mouse move for spotlight & magnetic border
  function handleCardMouseMove(e) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCardMouse({ x, y, isOver: true })

    // Gentle 3D parallax tilt
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const tiltX = -((y - centerY) / centerY) * 2.5
    const tiltY = ((x - centerX) / centerX) * 2.5
    setCardTilt({ rotateX: tiltX, rotateY: tiltY })
  }

  function handleCardMouseLeave() {
    setCardMouse((prev) => ({ ...prev, isOver: false }))
    setCardTilt({ rotateX: 0, rotateY: 0 })
  }

  // Determine Bot State
  const botState = loading ? 'searching' : isFocused || query.length > 0 ? 'typing' : 'idle'

  return (
    <div
      ref={cardRef}
      onMouseMove={handleCardMouseMove}
      onMouseLeave={handleCardMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${cardTilt.rotateX}deg) rotateY(${cardTilt.rotateY}deg)`,
        transition: 'transform 0.15s ease-out',
      }}
      className="relative mx-auto mt-8 max-w-4xl rounded-3xl border border-[#1A1A18]/15 bg-white/85 p-6 sm:p-8 shadow-xl backdrop-blur-md overflow-hidden text-left transition-shadow duration-300 hover:shadow-2xl"
    >
      {/* Dynamic Cursor Spotlight Background Glow (Emerald Brand Theme) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: cardMouse.isOver || isFocused ? 1 : 0,
          background: `radial-gradient(450px circle at ${cardMouse.x}px ${cardMouse.y}px, rgba(45, 106, 79, 0.14), transparent 75%)`,
        }}
      />

      {/* Magnetic Glowing Border Trail Overlay (Emerald & Mint Brand Theme) */}
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-3xl transition-opacity duration-200"
        style={{
          opacity: cardMouse.isOver || isFocused ? 1 : 0,
          background: `radial-gradient(280px circle at ${cardMouse.x}px ${cardMouse.y}px, rgba(82, 183, 136, 0.55), transparent 70%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '2px',
        }}
      />

      {/* Card Header: Unified Status Badge & Hamburger Action */}
      <div className="relative z-20 flex items-center justify-between border-b border-[#1A1A18]/10 pb-4">
        {/* Unified Search Badge in Brand Emerald */}
        <div className="flex items-center gap-2 rounded-full border border-[#2D6A4F]/20 bg-[#2D6A4F]/7 px-4 py-1.5 shadow-xs">
          <span className="inline-block h-2 w-2 rounded-full bg-[#2D6A4F] animate-pulse" />
          <span className="text-xs font-bold text-[#1A1A18] tracking-wide">
            🧠 RAG Semantic Vector Search
          </span>
          <span className="hidden sm:inline-block rounded-full bg-[#2D6A4F]/15 px-2 py-0.5 text-[10px] font-bold text-[#2D6A4F]">
            AI Embeddings + GitHub
          </span>
        </div>

        {/* Clean Menu Hamburger Icon */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1A1A18]/10 bg-white/70 text-[#1A1A18]/70 shadow-xs transition hover:bg-white hover:text-[#1A1A18]"
            title="Search options"
            aria-label="Menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {/* Prominent Center Stage: Floating Animated Grok Bot Mascot */}
      <div className="relative z-20 flex flex-col items-center justify-center pt-5 pb-4 text-center">
        <div className="transition-transform duration-300 hover:scale-105">
          <GrokBotMascot
            cursorPos={globalCursor}
            state={botState}
            size={96}
          />
        </div>
        <p className="mt-3.5 text-xs font-semibold tracking-wide text-[#1A1A18]/65">
          Grok Bot is watching your cursor • Click to interact or type anything to search & analyze
        </p>
      </div>

      {/* Main Search Input Form */}
      <form onSubmit={onSearch} className="relative z-20 mt-2 border-t border-[#1A1A18]/10 pt-4">
        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#1A1A18]/50">
              Find issues & ask Grok
            </span>
            <span className="text-[11px] font-medium text-[#1A1A18]/45">
              Press Enter ↵ to search
            </span>
          </div>

          <div className="mt-3 flex items-start gap-4">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSearch(e)
                }
              }}
              rows={3}
              className="min-h-24 flex-1 resize-none bg-transparent text-xl sm:text-2xl font-semibold leading-relaxed text-[#1A1A18] outline-none placeholder:text-[#1A1A18]/35 focus:ring-0"
              placeholder={
                placeholder || "e.g. 'React accessibility issues', 'Beginner TypeScript projects', or ask Grok directly..."
              }
            />

            {/* Brand-Themed Submit Button (Forest Emerald #2D6A4F) */}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="mt-1 flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#2D6A4F] text-lg font-bold text-[#F7F5F0] shadow-md transition hover:-translate-y-0.5 hover:bg-[#24583F] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Submit search"
            >
              {loading ? (
                <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                '↑'
              )}
            </button>
          </div>
        </label>
      </form>

      {/* Footer Info */}
      <div className="relative z-20 mt-3 flex items-center justify-between text-xs text-[#1A1A18]/45">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#2D6A4F]" />
          Cursor spotlight active
        </span>
        <span className="font-semibold text-[#2D6A4F]">
          ⚡ GitHub Search + Grok Gemini 3.6 Flash
        </span>
      </div>
    </div>
  )
}
