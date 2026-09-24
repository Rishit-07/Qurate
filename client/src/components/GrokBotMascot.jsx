import { useState, useEffect, useRef } from 'react'

/**
 * GrokBotMascot Component
 * Interactive robotic companion whose eyes, head tilt, and expression react to cursor movement,
 * typing state, and search queries.
 */
export default function GrokBotMascot({
  cursorPos = { x: 0, y: 0 },
  state = 'idle', // 'idle' | 'typing' | 'searching' | 'speaking'
  size = 72,
  interactive = true,
  speechText = '',
}) {
  const [isBlinking, setIsBlinking] = useState(false)
  const [showSpeech, setShowSpeech] = useState(false)
  const [speechIndex, setSpeechIndex] = useState(0)
  const botRef = useRef(null)

  const wittyQuips = [
    'Scanning repositories at the speed of thought.',
    'Ask me what to build — I dare you.',
    'Looking for issues with zero merge conflicts.',
    'Following your cursor like a precision laser.',
    'Let’s find some open source code to conquer.',
  ]

  // Periodic blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 160)
    }, 3800 + Math.random() * 2000)

    return () => clearInterval(blinkInterval)
  }, [])

  // Calculate eye pupil offset based on cursor position relative to the bot
  let pupilOffsetX = 0
  let pupilOffsetY = 0
  let headTilt = 0

  if (botRef.current) {
    const rect = botRef.current.getBoundingClientRect()
    const botCenterX = rect.left + rect.width / 2
    const botCenterY = rect.top + rect.height / 2

    const dx = cursorPos.x - botCenterX
    const dy = cursorPos.y - botCenterY
    const distance = Math.hypot(dx, dy)

    if (state === 'typing') {
      // Look downwards towards the input box
      pupilOffsetX = 0
      pupilOffsetY = 4
      headTilt = 4
    } else if (distance > 0) {
      const angle = Math.atan2(dy, dx)
      const maxOffset = 5.5
      const clampedDist = Math.min(distance / 50, 1)
      pupilOffsetX = Math.cos(angle) * maxOffset * clampedDist
      pupilOffsetY = Math.sin(angle) * maxOffset * clampedDist

      // Subtle head tilt toward cursor
      headTilt = Math.max(-8, Math.min(8, (dx / window.innerWidth) * 16))
    }
  }

  const currentSpeech = speechText || wittyQuips[speechIndex]

  function handleBotClick() {
    setShowSpeech(true)
    setSpeechIndex((prev) => (prev + 1) % wittyQuips.length)
    setTimeout(() => setShowSpeech(false), 4200)
  }

  return (
    <div
      ref={botRef}
      onClick={interactive ? handleBotClick : undefined}
      className={`relative inline-flex flex-col items-center select-none ${
        interactive ? 'cursor-pointer' : ''
      }`}
      style={{ width: size, height: size }}
      title="Grok Bot - Click to interact"
    >
      {/* Speech Bubble */}
      {showSpeech && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap rounded-xl border border-[#1A1A18]/15 bg-[#1A1A18] px-3.5 py-1.5 text-xs font-semibold text-[#F7F5F0] shadow-xl animate-fadeIn">
          {currentSpeech}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-b border-r border-[#1A1A18]/15 bg-[#1A1A18]" />
        </div>
      )}

      {/* SVG Robotic Mascot */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full filter drop-shadow-md transition-transform duration-150 ease-out"
        style={{ transform: `rotate(${headTilt}deg)` }}
      >
        <defs>
          {/* Metallic Body Gradient */}
          <linearGradient id="grokHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2A2A28" />
            <stop offset="50%" stopColor="#1A1A18" />
            <stop offset="100%" stopColor="#111110" />
          </linearGradient>

          {/* Visor Glass Gradient */}
          <linearGradient id="grokVisorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B130E" />
            <stop offset="100%" stopColor="#050806" />
          </linearGradient>

          {/* Neon Pupil Glow */}
          <radialGradient id="grokEyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#52B788" />
            <stop offset="60%" stopColor="#2D6A4F" />
            <stop offset="100%" stopColor="#1B4332" />
          </radialGradient>

          {/* Searching Beam Gradient */}
          <linearGradient id="grokScanBeam" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="#52B788" stopOpacity="0.8" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Antenna */}
        <line x1="50" y1="18" x2="50" y2="8" stroke="#1A1A18" strokeWidth="3" strokeLinecap="round" />
        <circle
          cx="50"
          cy="6"
          r="4.5"
          fill={state === 'searching' ? '#52B788' : '#2D6A4F'}
          className={state === 'searching' ? 'animate-ping' : ''}
        />
        <circle cx="50" cy="6" r="3.5" fill="#74C69D" />

        {/* Outer Head Chassis */}
        <rect
          x="14"
          y="18"
          width="72"
          height="64"
          rx="18"
          fill="url(#grokHeadGrad)"
          stroke="#3E3E3A"
          strokeWidth="2.5"
        />

        {/* Subtle Head Highlight */}
        <path
          d="M 22 22 Q 50 18 78 22"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Visor Area */}
        <rect
          x="22"
          y="30"
          width="56"
          height="34"
          rx="10"
          fill="url(#grokVisorGrad)"
          stroke="#2D6A4F"
          strokeWidth="1.5"
          className="transition-colors duration-300"
        />

        {/* Searching Scanner Sweep */}
        {state === 'searching' && (
          <rect
            x="24"
            y="32"
            width="52"
            height="30"
            rx="8"
            fill="url(#grokScanBeam)"
            className="animate-pulse"
          />
        )}

        {/* Left Eye & Pupil */}
        <g
          className="transition-transform duration-75 ease-out"
          style={{
            transform: isBlinking
              ? 'scaleY(0.1)'
              : `translate(${pupilOffsetX}px, ${pupilOffsetY}px)`,
            transformOrigin: '38px 47px',
          }}
        >
          {/* Eye Socket */}
          <circle cx="38" cy="47" r="7" fill="#0E2319" />
          {/* Glowing Pupil */}
          <circle cx="38" cy="47" r="5" fill="url(#grokEyeGlow)" />
          {/* Pupil Catchlight */}
          <circle cx="36" cy="45" r="1.8" fill="#D8F3DC" />
        </g>

        {/* Right Eye & Pupil */}
        <g
          className="transition-transform duration-75 ease-out"
          style={{
            transform: isBlinking
              ? 'scaleY(0.1)'
              : `translate(${pupilOffsetX}px, ${pupilOffsetY}px)`,
            transformOrigin: '62px 47px',
          }}
        >
          {/* Eye Socket */}
          <circle cx="62" cy="47" r="7" fill="#0E2319" />
          {/* Glowing Pupil */}
          <circle cx="62" cy="47" r="5" fill="url(#grokEyeGlow)" />
          {/* Pupil Catchlight */}
          <circle cx="60" cy="45" r="1.8" fill="#D8F3DC" />
        </g>

        {/* Mouth / Voice Waveform */}
        {state === 'speaking' ? (
          <g className="animate-pulse">
            <line x1="36" y1="72" x2="36" y2="76" stroke="#52B788" strokeWidth="2" strokeLinecap="round" />
            <line x1="43" y1="70" x2="43" y2="78" stroke="#52B788" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="69" x2="50" y2="79" stroke="#74C69D" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="57" y1="70" x2="57" y2="78" stroke="#52B788" strokeWidth="2" strokeLinecap="round" />
            <line x1="64" y1="72" x2="64" y2="76" stroke="#52B788" strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : (
          /* Subtle Robot Smile Line */
          <path
            d="M 40 73 Q 50 76 60 73"
            stroke="#3E3E3A"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Ear Bolts */}
        <rect x="10" y="42" width="4" height="14" rx="2" fill="#3E3E3A" />
        <rect x="86" y="42" width="4" height="14" rx="2" fill="#3E3E3A" />
      </svg>

      {/* State Glow Badge */}
      <span
        className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition ${
          state === 'searching'
            ? 'bg-[#2D6A4F] text-white shadow-sm'
            : state === 'typing'
            ? 'bg-[#2D6A4F]/15 text-[#2D6A4F]'
            : 'bg-[#1A1A18]/10 text-[#1A1A18]/60'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            state === 'searching'
              ? 'animate-ping bg-white'
              : state === 'typing'
              ? 'bg-[#2D6A4F]'
              : 'bg-[#1A1A18]/40'
          }`}
        />
        {state === 'searching'
          ? 'Thinking'
          : state === 'typing'
          ? 'Listening'
          : 'Grok Bot'}
      </span>
    </div>
  )
}
