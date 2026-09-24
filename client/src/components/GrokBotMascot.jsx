import { useState, useEffect, useRef } from 'react'

/**
 * GrokBotMascot Component
 * Faithful implementation of the colorful 6-lobed organic cloud mascot with
 * multi-color gradient (amber/yellow -> coral -> pink/magenta -> purple -> sky blue)
 * and two vertical white pill-shaped capsule eyes that track the cursor in real-time.
 */
export default function GrokBotMascot({
  cursorPos = { x: 0, y: 0 },
  state = 'idle', // 'idle' | 'typing' | 'searching' | 'speaking'
  size = 92,
  interactive = true,
  speechText = '',
  className = '',
}) {
  const [isBlinking, setIsBlinking] = useState(false)
  const [showSpeech, setShowSpeech] = useState(false)
  const [speechIndex, setSpeechIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const botRef = useRef(null)

  const wittyQuips = [
    'I see where you’re moving that cursor!',
    'Ready to dive into some open-source code?',
    'Ask me anything about GitHub repositories.',
    'Tracking your cursor with quantum precision.',
    'Let’s find some high-impact issues to solve.',
  ]

  // Natural blinking interval
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 150)
    }, 3200 + Math.random() * 2400)

    return () => clearInterval(blinkInterval)
  }, [])

  // Calculate eye offsets and body tilt from cursor position
  let eyeOffsetX = 0
  let eyeOffsetY = 0
  let bodyTilt = 0

  if (botRef.current) {
    const rect = botRef.current.getBoundingClientRect()
    const botCenterX = rect.left + rect.width / 2
    const botCenterY = rect.top + rect.height / 2

    const dx = cursorPos.x - botCenterX
    const dy = cursorPos.y - botCenterY
    const distance = Math.hypot(dx, dy)

    if (state === 'typing') {
      // Look downwards towards the input box
      eyeOffsetX = 0
      eyeOffsetY = 4.5
      bodyTilt = 1.5
    } else if (state === 'searching') {
      eyeOffsetX = 0
      eyeOffsetY = 0
      bodyTilt = 0
    } else if (distance > 0) {
      const angle = Math.atan2(dy, dx)
      const maxOffset = 7.5
      const clampedDist = Math.min(distance / 80, 1)
      eyeOffsetX = Math.cos(angle) * maxOffset * clampedDist
      eyeOffsetY = Math.sin(angle) * maxOffset * clampedDist

      // Subtle tilt toward cursor
      bodyTilt = Math.max(-10, Math.min(10, (dx / (window.innerWidth || 1200)) * 18))
    }
  }

  const currentSpeech = speechText || wittyQuips[speechIndex]

  function handleBotClick() {
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 250)
    setShowSpeech(true)
    setSpeechIndex((prev) => (prev + 1) % wittyQuips.length)
    setTimeout(() => setShowSpeech(false), 4000)
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
      title="Grok Bot - Click to interact"
    >
      {/* Speech Bubble */}
      {showSpeech && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-40 whitespace-nowrap rounded-2xl border border-[#1A1A18]/15 bg-[#1A1A18] px-4 py-2 text-xs font-semibold text-[#F7F5F0] shadow-2xl animate-fadeIn">
          {currentSpeech}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-b border-r border-[#1A1A18]/15 bg-[#1A1A18]" />
        </div>
      )}

      {/* Soft Ambient Floor Glow / Shadow (as in reference image) */}
      <div
        className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 h-5 w-4/5 rounded-full blur-md transition-all duration-300"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(110, 61, 244, 0.45) 0%, rgba(61, 120, 245, 0.3) 45%, transparent 75%)',
          opacity: isHovered || state === 'searching' ? 0.95 : 0.65,
          transform: `translateX(-50%) scale(${isHovered ? 1.15 : 1})`,
        }}
      />

      {/* Main Multi-color Cloud Mascot */}
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full filter drop-shadow-md transition-transform duration-200 ease-out"
        style={{
          transform: `rotate(${bodyTilt}deg) scale(${isClicked ? 0.92 : isHovered ? 1.05 : 1})`,
        }}
      >
        <defs>
          {/* Multi-Stop Seamless Gradient matching the mascot */}
          <linearGradient id="grokCloudGradient" x1="12%" y1="12%" x2="88%" y2="88%">
            <stop offset="0%" stopColor="#F8C757" />   {/* Golden Yellow / Amber (Top-Left) */}
            <stop offset="24%" stopColor="#F1685F" />  {/* Coral Orange (Top-Right) */}
            <stop offset="46%" stopColor="#E43A94" />  {/* Magenta / Pink (Far Right) */}
            <stop offset="70%" stopColor="#713CE8" />  {/* Royal Purple / Violet (Bottom) */}
            <stop offset="92%" stopColor="#3C7DF6" />  {/* Electric Blue (Bottom-Left) */}
            <stop offset="100%" stopColor="#55B2F8" /> {/* Sky Blue / Cyan (Left) */}
          </linearGradient>

          {/* Soft 3D Lighting Dome Overlay */}
          <radialGradient id="grokDomeGlow" cx="36%" cy="32%" r="62%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
          </radialGradient>

          {/* Eye shadow filter */}
          <filter id="eyeShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* 6-Lobed Organic Cloud Body */}
        <g>
          {/* Lobe 1: Top-Left (Yellow-Amber) */}
          <circle cx="49" cy="41" r="21" fill="url(#grokCloudGradient)" />
          {/* Lobe 2: Top-Right (Coral-Orange) */}
          <circle cx="71" cy="41" r="21" fill="url(#grokCloudGradient)" />
          {/* Lobe 3: Right (Pink-Magenta) */}
          <circle cx="83" cy="61" r="21" fill="url(#grokCloudGradient)" />
          {/* Lobe 4: Bottom-Right (Purple-Violet) */}
          <circle cx="71" cy="80" r="21" fill="url(#grokCloudGradient)" />
          {/* Lobe 5: Bottom-Left (Blue-Violet) */}
          <circle cx="49" cy="80" r="21" fill="url(#grokCloudGradient)" />
          {/* Lobe 6: Left (Cyan-Blue) */}
          <circle cx="37" cy="61" r="21" fill="url(#grokCloudGradient)" />
          {/* Central Body Core to seamlessly weld all lobes */}
          <circle cx="60" cy="60" r="27" fill="url(#grokCloudGradient)" />

          {/* Soft 3D Volume Overlay */}
          <circle cx="60" cy="60" r="38" fill="url(#grokDomeGlow)" />
        </g>

        {/* Two Vertical White Pill Eyes (Exact match to reference image) */}
        <g
          filter="url(#eyeShadow)"
          className="transition-transform duration-75 ease-out"
          style={{
            transform: isBlinking
              ? 'scaleY(0.08)'
              : state === 'searching'
              ? 'translate(0px, 0px)'
              : `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`,
            transformOrigin: '60px 58px',
          }}
        >
          {/* Left Vertical Pill Eye */}
          <rect
            x="50.5"
            y="49"
            width="8"
            height="18"
            rx="4"
            ry="4"
            fill="#FFFFFF"
          />

          {/* Right Vertical Pill Eye */}
          <rect
            x="61.5"
            y="49"
            width="8"
            height="18"
            rx="4"
            ry="4"
            fill="#FFFFFF"
          />
        </g>
      </svg>
    </div>
  )
}
