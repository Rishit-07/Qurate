import { useState, useEffect, useRef } from 'react'

/**
 * GrokBotMascot Component
 * Harmonized with Qurate's core color palette:
 * - Amber (#F6C15E) -> Coral (#E76F51) -> Jade (#2A9D8F) -> Brand Emerald (#2D6A4F) -> Mint (#52B788).
 * - Floor shadow in soft emerald/mint tones.
 * - Continuous floating & breathing physics.
 * - Blinking, winking, and blushing reactions.
 * - Active radar sweep during search and reading nod during typing.
 */
export default function GrokBotMascot({
  cursorPos = { x: 0, y: 0 },
  state = 'idle', // 'idle' | 'typing' | 'searching' | 'speaking'
  size = 94,
  interactive = true,
  speechText = '',
  className = '',
}) {
  const [blinkState, setBlinkState] = useState('open') // 'open' | 'blink' | 'wink'
  const [showSpeech, setShowSpeech] = useState(false)
  const [speechIndex, setSpeechIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isBouncing, setIsBouncing] = useState(false)
  const [sparkles, setSparkles] = useState([])
  const botRef = useRef(null)

  const wittyQuips = [
    'I see where you’re moving that cursor!',
    'Ready to dive into some open-source code?',
    'Tracking your cursor with quantum precision.',
    'Ask me anything about GitHub repositories!',
    'Let’s find some high-impact issues to solve.',
    'Click me again — I’m full of open-source wisdom.',
  ]

  // Periodic natural blinking with occasional playful winks
  useEffect(() => {
    let blinkTimer
    let blinkTimeout

    function triggerBlinkCycle() {
      const isWink = Math.random() < 0.28
      setBlinkState(isWink ? 'wink' : 'blink')

      blinkTimeout = setTimeout(() => {
        setBlinkState('open')
        if (!isWink && Math.random() < 0.22) {
          setTimeout(() => {
            setBlinkState('blink')
            setTimeout(() => setBlinkState('open'), 120)
          }, 140)
        }
      }, 150)

      const nextDelay = 2600 + Math.random() * 2600
      blinkTimer = setTimeout(triggerBlinkCycle, nextDelay)
    }

    blinkTimer = setTimeout(triggerBlinkCycle, 2800)
    return () => {
      clearTimeout(blinkTimer)
      clearTimeout(blinkTimeout)
    }
  }, [])

  // Calculate eye offsets and body tilt from cursor position
  let eyeOffsetX = 0
  let eyeOffsetY = 0
  let bodyTilt = 0
  let isCloseToCursor = false

  if (botRef.current) {
    const rect = botRef.current.getBoundingClientRect()
    const botCenterX = rect.left + rect.width / 2
    const botCenterY = rect.top + rect.height / 2

    const dx = cursorPos.x - botCenterX
    const dy = cursorPos.y - botCenterY
    const dist = Math.hypot(dx, dy)
    isCloseToCursor = dist < 120

    if (state === 'typing') {
      eyeOffsetX = 0
      eyeOffsetY = 4.5
      bodyTilt = 1.5
    } else if (state === 'searching') {
      eyeOffsetX = 0
      eyeOffsetY = 0
      bodyTilt = 0
    } else if (dist > 0) {
      const angle = Math.atan2(dy, dx)
      const maxOffset = 8
      const clampedDist = Math.min(dist / 90, 1)
      eyeOffsetX = Math.cos(angle) * maxOffset * clampedDist
      eyeOffsetY = Math.sin(angle) * maxOffset * clampedDist

      bodyTilt = Math.max(-12, Math.min(12, (dx / (window.innerWidth || 1200)) * 24))
    }
  }

  const currentSpeech = speechText || wittyQuips[speechIndex]

  function handleBotClick() {
    setIsBouncing(true)
    setTimeout(() => setIsBouncing(false), 550)

    // Spawn 6 colorful brand-themed sparkle particles
    const brandColors = ['#F6C15E', '#E76F51', '#2A9D8F', '#2D6A4F', '#52B788']
    const newSparkles = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      angle: (i / 6) * 360,
      distance: 28 + Math.random() * 18,
      size: 5 + Math.random() * 4,
      color: brandColors[i % brandColors.length],
    }))
    setSparkles(newSparkles)
    setTimeout(() => setSparkles([]), 800)

    setShowSpeech(true)
    setSpeechIndex((prev) => (prev + 1) % wittyQuips.length)
    setTimeout(() => setShowSpeech(false), 4200)
  }

  return (
    <div
      ref={botRef}
      onClick={interactive ? handleBotClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative inline-flex flex-col items-center select-none ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      title="Grok Bot - Watching your cursor (Click to interact)"
    >
      {/* Self-contained CSS animations */}
      <style>{`
        @keyframes grokFloatBob {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-7px);
          }
        }
        @keyframes grokFloorShadow {
          0%, 100% {
            transform: translateX(-50%) scale(1);
            opacity: 0.65;
          }
          50% {
            transform: translateX(-50%) scale(1.18);
            opacity: 0.35;
          }
        }
        @keyframes grokJellyPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.04);
          }
        }
        @keyframes grokRadarScan {
          0% {
            transform: translate(-7px, 0px);
          }
          25% {
            transform: translate(0px, -4px);
          }
          50% {
            transform: translate(7px, 0px);
          }
          75% {
            transform: translate(0px, 4px);
          }
          100% {
            transform: translate(-7px, 0px);
          }
        }
        @keyframes grokTypingReading {
          0%, 100% {
            transform: translate(-3.5px, 4.5px);
          }
          50% {
            transform: translate(3.5px, 4.5px);
          }
        }
        @keyframes grokTypingNod {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(2.5px);
          }
        }
        @keyframes grokSpringSquish {
          0% {
            transform: scale(1, 1);
          }
          25% {
            transform: scale(1.22, 0.78);
          }
          50% {
            transform: scale(0.85, 1.18);
          }
          75% {
            transform: scale(1.06, 0.95);
          }
          100% {
            transform: scale(1, 1);
          }
        }
        @keyframes grokBeamSweep {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes grokSparkleFly {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(0.6);
          }
          100% {
            opacity: 0;
            transform: translate(var(--dx), var(--dy)) scale(1.2);
          }
        }
      `}</style>

      {/* Speech Bubble */}
      {showSpeech && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-40 whitespace-nowrap rounded-2xl border border-[#1A1A18]/15 bg-[#1A1A18] px-4 py-2 text-xs font-semibold text-[#F7F5F0] shadow-2xl animate-fadeIn">
          {currentSpeech}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-b border-r border-[#1A1A18]/15 bg-[#1A1A18]" />
        </div>
      )}

      {/* Burst Sparkle Particles on Click */}
      {sparkles.map((sp) => {
        const rad = (sp.angle * Math.PI) / 180
        const dx = `${Math.cos(rad) * sp.distance}px`
        const dy = `${Math.sin(rad) * sp.distance}px`
        return (
          <div
            key={sp.id}
            className="pointer-events-none absolute z-30 rounded-full"
            style={{
              top: '50%',
              left: '50%',
              width: sp.size,
              height: sp.size,
              backgroundColor: sp.color,
              boxShadow: `0 0 8px ${sp.color}`,
              '--dx': dx,
              '--dy': dy,
              animation: 'grokSparkleFly 0.75s ease-out forwards',
            }}
          />
        )
      })}

      {/* Ambient Floor Shadow with Dynamic Breathe Pulsing (Harmonized with Emerald Palette) */}
      <div
        className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 h-5 w-4/5 rounded-full blur-md"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(45, 106, 79, 0.45) 0%, rgba(82, 183, 136, 0.25) 45%, transparent 75%)',
          animation: 'grokFloorShadow 3.2s ease-in-out infinite',
        }}
      />

      {/* Floating Container (sine wave bobbing + spring physics) */}
      <div
        className="relative w-full h-full"
        style={{
          animation: isBouncing
            ? 'grokSpringSquish 0.55s ease-out'
            : state === 'typing'
            ? 'grokTypingNod 1.2s ease-in-out infinite'
            : 'grokFloatBob 3.2s ease-in-out infinite',
          transition: 'transform 0.15s ease-out',
        }}
      >
        {/* Main Multi-color Cloud Mascot SVG */}
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full filter drop-shadow-md transition-transform duration-200 ease-out"
          style={{
            transform: `rotate(${bodyTilt}deg) scale(${isHovered ? 1.06 : 1})`,
          }}
        >
          <defs>
            {/* Multi-Stop Seamless Gradient harmonized with app palette */}
            <linearGradient id="grokCloudGradient" x1="12%" y1="12%" x2="88%" y2="88%">
              <stop offset="0%" stopColor="#F6C15E" />   {/* Warm Golden Amber */}
              <stop offset="25%" stopColor="#E76F51" />  {/* Warm Terracotta / Coral */}
              <stop offset="50%" stopColor="#2A9D8F" />  {/* Vibrant Jade Teal */}
              <stop offset="76%" stopColor="#2D6A4F" />  {/* Signature Qurate Forest Emerald */}
              <stop offset="100%" stopColor="#52B788" /> {/* Fresh Mint */}
            </linearGradient>

            {/* Soft 3D Lighting Dome Overlay */}
            <radialGradient id="grokDomeGlow" cx="36%" cy="32%" r="62%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
            </radialGradient>

            {/* Searching Radar Sweep Beam Gradient (Mint/Emerald) */}
            <linearGradient id="grokRadarBeam" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#52B788" stopOpacity="0.3" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>

            {/* Eye shadow filter */}
            <filter id="eyeShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* 6-Lobed Organic Cloud Body with Gentle Breathing */}
          <g style={{ transformOrigin: '60px 60px', animation: 'grokJellyPulse 4s ease-in-out infinite' }}>
            {/* Lobe 1: Top-Left (Golden Amber) */}
            <circle cx="49" cy="41" r="21" fill="url(#grokCloudGradient)" />
            {/* Lobe 2: Top-Right (Coral Terracotta) */}
            <circle cx="71" cy="41" r="21" fill="url(#grokCloudGradient)" />
            {/* Lobe 3: Right (Jade Teal) */}
            <circle cx="83" cy="61" r="21" fill="url(#grokCloudGradient)" />
            {/* Lobe 4: Bottom-Right (Forest Emerald) */}
            <circle cx="71" cy="80" r="21" fill="url(#grokCloudGradient)" />
            {/* Lobe 5: Bottom-Left (Deep Emerald Pine) */}
            <circle cx="49" cy="80" r="21" fill="url(#grokCloudGradient)" />
            {/* Lobe 6: Left (Fresh Mint) */}
            <circle cx="37" cy="61" r="21" fill="url(#grokCloudGradient)" />
            {/* Central Body Core */}
            <circle cx="60" cy="60" r="27" fill="url(#grokCloudGradient)" />

            {/* Soft 3D Volume Overlay */}
            <circle cx="60" cy="60" r="38" fill="url(#grokDomeGlow)" />

            {/* Dynamic Radar Sweep Aura during Search */}
            {state === 'searching' && (
              <circle
                cx="60"
                cy="60"
                r="36"
                fill="url(#grokRadarBeam)"
                className="opacity-70"
                style={{
                  transformOrigin: '60px 60px',
                  animation: 'grokBeamSweep 2s linear infinite',
                }}
              />
            )}
          </g>

          {/* Cute Rosy Cheeks (blush when cursor is close or hovered) */}
          <g
            className="transition-opacity duration-300 ease-out"
            style={{ opacity: isHovered || isCloseToCursor ? 0.75 : 0.2 }}
          >
            <circle cx="41" cy="65" r="5" fill="#E76F51" filter="blur(2px)" />
            <circle cx="79" cy="65" r="5" fill="#E76F51" filter="blur(2px)" />
          </g>

          {/* Two Vertical White Pill Eyes with Advanced Expression Dynamics */}
          <g
            filter="url(#eyeShadow)"
            style={{
              transformOrigin: '60px 58px',
              animation:
                state === 'searching'
                  ? 'grokRadarScan 1.6s ease-in-out infinite'
                  : state === 'typing'
                  ? 'grokTypingReading 1.8s ease-in-out infinite'
                  : 'none',
              transform:
                state === 'searching' || state === 'typing'
                  ? undefined
                  : `translate(${eyeOffsetX}px, ${eyeOffsetY}px) scale(${isCloseToCursor || isHovered ? 1.12 : 1})`,
              transition: 'transform 0.08s ease-out',
            }}
          >
            {/* Left Eye */}
            <rect
              x="50.5"
              y="49"
              width="8"
              height="18"
              rx="4"
              ry="4"
              fill="#FFFFFF"
              className="transition-transform duration-100 ease-out"
              style={{
                transformOrigin: '54.5px 58px',
                transform:
                  blinkState === 'blink'
                    ? 'scaleY(0.08)'
                    : 'scaleY(1)',
              }}
            />

            {/* Right Eye (winks on wink state, blinks on blink state) */}
            <rect
              x="61.5"
              y="49"
              width="8"
              height="18"
              rx="4"
              ry="4"
              fill="#FFFFFF"
              className="transition-transform duration-100 ease-out"
              style={{
                transformOrigin: '65.5px 58px',
                transform:
                  blinkState === 'blink' || blinkState === 'wink'
                    ? 'scaleY(0.08)'
                    : 'scaleY(1)',
              }}
            />
          </g>

          {/* Orbiting Micro Sparkle Star (idle companion) */}
          <g className="animate-spin" style={{ transformOrigin: '60px 60px', animationDuration: '9s' }}>
            <circle cx="95" cy="35" r="2.2" fill="#FFFFFF" opacity="0.9" filter="drop-shadow(0 0 3px #52B788)" />
          </g>
        </svg>
      </div>
    </div>
  )
}
