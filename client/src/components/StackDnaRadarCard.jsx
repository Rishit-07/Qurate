import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Sparkles,
  Dna,
  RefreshCw,
  Compass,
  Zap,
  TrendingUp,
  Layers,
  Info,
  CheckCircle2,
} from 'lucide-react'

const RAW_API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '')
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, '')

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('qurateToken') || ''
}

const DEFAULT_PILLARS = [
  { key: 'frontend', label: 'Frontend', color: '#2D6A4F', score: 35, topSkills: [] },
  { key: 'backend', label: 'Backend', color: '#1D4ED8', score: 30, topSkills: [] },
  { key: 'database', label: 'Data', color: '#B45309', score: 20, topSkills: [] },
  { key: 'devops', label: 'DevOps', color: '#0F766E', score: 20, topSkills: [] },
  { key: 'ai', label: 'AI/ML', color: '#6D28D9', score: 20, topSkills: [] },
  { key: 'systems', label: 'Systems', color: '#BE123C', score: 20, topSkills: [] },
]

function getInitialDna(user) {
  const stack = Array.isArray(user?.stack) ? user.stack.map(s => String(s).toLowerCase()) : []
  const hasFrontend = stack.some(s => /react|vue|html|css|javascript|tailwind/i.test(s))
  const hasBackend = stack.some(s => /node|express|python|django|go/i.test(s))
  const hasDb = stack.some(s => /mongo|sql|postgres|redis/i.test(s))

  const cats = DEFAULT_PILLARS.map(p => {
    let score = p.score
    const topSkills = []
    if (p.key === 'frontend' && hasFrontend) {
      score += 35
      user?.stack?.forEach(s => { if (/react|vue|js|tailwind/i.test(s)) topSkills.push(s) })
    }
    if (p.key === 'backend' && hasBackend) {
      score += 30
      user?.stack?.forEach(s => { if (/node|express|python/i.test(s)) topSkills.push(s) })
    }
    if (p.key === 'database' && hasDb) {
      score += 25
      user?.stack?.forEach(s => { if (/mongo|sql|db/i.test(s)) topSkills.push(s) })
    }
    return { ...p, score: Math.min(100, score), topSkills }
  })

  return {
    categories: cats,
    archetype: hasFrontend && hasBackend ? 'Full-Stack Developer' : hasFrontend ? 'Frontend Specialist' : 'Open Source Contributor',
    description: 'Calculated from your active stack tags, bookmarked issues, and contributions.',
    overallScore: Math.round(cats.reduce((a, b) => a + b.score, 0) / cats.length),
    growthRecommendation: 'Expand your bookmarks and PRs to broaden your multi-pillar DNA footprint.',
  }
}

export default function StackDnaRadarCard({ user, onNavigateToSettings }) {
  const [dna, setDna] = useState(() => getInitialDna(user))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hoveredPillar, setHoveredPillar] = useState(null)
  const [selectedPillar, setSelectedPillar] = useState(null)

  const fetchDna = async () => {
    try {
      setLoading(true)
      setError('')
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }

      const res = await fetch(`${API_BASE_URL}/api/users/stack-dna`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch Stack DNA')
      if (data.stackDna) {
        setDna(data.stackDna)
      }
    } catch (err) {
      console.error('[Stack DNA]', err)
      // Keep initial client calculation on network failure
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDna()
  }, [user?.stack, user?.experienceLevel, user?.githubUsername])

  // Geometry calculations
  const width = 330
  const height = 240
  const cx = width / 2
  const cy = height / 2
  const maxRadius = 76
  const levels = [20, 40, 60, 80, 100]

  const categories = dna?.categories || []
  const count = categories.length || 6

  const pointsData = useMemo(() => {
    if (!categories.length) return []
    return categories.map((cat, i) => {
      const angle = (i * 2 * Math.PI) / count - Math.PI / 2
      const radius = (Math.max(10, Math.min(100, cat.score)) / 100) * maxRadius
      const x = cx + radius * Math.cos(angle)
      const y = cy + radius * Math.sin(angle)

      // Outer label coordinates
      const labelRadius = maxRadius + 23
      const lx = cx + labelRadius * Math.cos(angle)
      const ly = cy + labelRadius * Math.sin(angle)

      return {
        ...cat,
        index: i,
        angle,
        x,
        y,
        lx,
        ly,
      }
    })
  }, [categories, cx, cy, count, maxRadius])

  // Build SVG polygon points string
  const polygonPoints = pointsData.map(p => `${p.x},${p.y}`).join(' ')

  // Active highlighted pillar for details
  const activePillar = hoveredPillar || selectedPillar || (pointsData[0] || null)

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#1A1A18]/10 bg-white/85 p-5 shadow-sm backdrop-blur-xl transition hover:shadow-md">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#2D6A4F]/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[#1D4ED8]/5 blur-3xl" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3.5 pb-2.5 border-b border-[#1A1A18]/8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] shadow-2xs">
            <Dna className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="[font-family:Georgia,serif] text-sm sm:text-base font-bold text-[#1A1A18]">
                Stack DNA
              </h3>
              <span className="rounded-full bg-[#2D6A4F]/10 px-2 py-0.5 text-[10px] font-bold text-[#2D6A4F]">
                Topology
              </span>
            </div>
            <p className="text-[10px] text-[#1A1A18]/50">
              Multi-dimensional skill mapping across 6 architectural pillars
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchDna}
          disabled={loading}
          title="Re-calculate Stack DNA"
          className="flex h-7 w-7 items-center justify-center rounded-xl border border-[#1A1A18]/10 bg-white text-[#1A1A18]/60 transition hover:bg-[#1A1A18]/5 hover:text-[#1A1A18]"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin text-[#2D6A4F]' : ''}`} />
        </button>
      </div>

      {loading && !dna ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] animate-pulse mb-2">
            <Dna className="h-5 w-5 animate-spin" />
          </div>
          <p className="text-xs font-semibold text-[#1A1A18]">Synthesizing Developer DNA…</p>
          <p className="text-[10px] text-[#1A1A18]/45 mt-0.5">Cross-referencing bookmarks, stack, and PR activity</p>
        </div>
      ) : error ? (
        <div className="py-4 text-center">
          <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-2xl border border-red-200">
            {error}
          </p>
          <button
            onClick={fetchDna}
            className="mt-2 text-xs font-bold text-[#2D6A4F] underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Developer Archetype Banner */}
          <div className="rounded-2xl border border-[#2D6A4F]/20 bg-gradient-to-r from-[#2D6A4F]/8 via-[#2D6A4F]/4 to-transparent p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F]">
                <Sparkles className="h-3 w-3" />
                <span className="uppercase tracking-wider text-[10px]">Identified Archetype</span>
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#1A1A18]/70 shadow-2xs border border-[#1A1A18]/8">
                {dna?.overallScore || 0}% Power Index
              </span>
            </div>
            <h4 className="[font-family:Georgia,serif] text-sm sm:text-base font-bold text-[#1A1A18] mt-0.5">
              {dna?.archetype}
            </h4>
            <p className="text-[11px] text-[#1A1A18]/65 mt-0.5 leading-relaxed">
              {dna?.description}
            </p>
          </div>

          {/* Interactive Radar Visualizer */}
          <div className="relative flex justify-center py-1">
            <svg
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              className="overflow-visible select-none max-w-full"
            >
              <defs>
                <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#52B788" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.35" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Concentric Guide Web Rings */}
              {levels.map((lvl) => {
                const r = (lvl / 100) * maxRadius
                const guidePoints = Array.from({ length: count }).map((_, i) => {
                  const angle = (i * 2 * Math.PI) / count - Math.PI / 2
                  return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
                }).join(' ')

                return (
                  <polygon
                    key={lvl}
                    points={guidePoints}
                    fill="none"
                    stroke="#1A1A18"
                    strokeOpacity={lvl === 100 ? 0.16 : 0.07}
                    strokeWidth={lvl === 100 ? 1.5 : 1}
                    strokeDasharray={lvl === 100 ? undefined : '3,3'}
                  />
                )
              })}

              {/* Radial Spokes */}
              {Array.from({ length: count }).map((_, i) => {
                const angle = (i * 2 * Math.PI) / count - Math.PI / 2
                const x2 = cx + maxRadius * Math.cos(angle)
                const y2 = cy + maxRadius * Math.sin(angle)
                const isHovered = hoveredPillar?.index === i
                return (
                  <line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={x2}
                    y2={y2}
                    stroke={isHovered ? '#2D6A4F' : '#1A1A18'}
                    strokeOpacity={isHovered ? 0.45 : 0.12}
                    strokeWidth={isHovered ? 1.5 : 1}
                  />
                )
              })}

              {/* Animated Skill Polygon */}
              {polygonPoints && (
                <motion.polygon
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  points={polygonPoints}
                  fill="url(#radarFill)"
                  stroke="#2D6A4F"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              )}

              {/* Radar Vertices and Interactive Hotspots */}
              {pointsData.map((p) => {
                const isHovered = hoveredPillar?.key === p.key
                const isSelected = selectedPillar?.key === p.key

                return (
                  <g
                    key={p.key}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPillar(p)}
                    onMouseLeave={() => setHoveredPillar(null)}
                    onClick={() => setSelectedPillar(p)}
                  >
                    {/* Pulsing ring on hover/selected */}
                    {(isHovered || isSelected) && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="10"
                        fill="none"
                        stroke={p.color}
                        strokeWidth="2"
                        className="animate-ping"
                        opacity="0.6"
                      />
                    )}

                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered || isSelected ? '6' : '4.5'}
                      fill={isHovered || isSelected ? p.color : '#FFFFFF'}
                      stroke={p.color}
                      strokeWidth="2.5"
                      className="transition-all duration-200"
                      filter="url(#glow)"
                    />

                    {/* Outer Label text */}
                    <text
                      x={p.lx}
                      y={p.ly}
                      textAnchor={
                        Math.abs(p.angle + Math.PI / 2) < 0.1 || Math.abs(p.angle - Math.PI / 2) < 0.1
                          ? 'middle'
                          : p.x > cx
                          ? 'start'
                          : 'end'
                      }
                      dominantBaseline="central"
                      className={`text-[10px] font-bold transition-all duration-200 ${
                        isHovered || isSelected
                          ? 'fill-[#2D6A4F] font-extrabold'
                          : 'fill-[#1A1A18]/65'
                      }`}
                    >
                      {p.label}
                    </text>
                  </g>
                )
              })}

              {/* Center Icon */}
              <circle cx={cx} cy={cy} r="3" fill="#1A1A18" fillOpacity="0.25" />
            </svg>
          </div>

          {/* Detailed Inspector Card for Selected/Hovered Pillar */}
          {activePillar && (
            <motion.div
              key={activePillar.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-[#1A1A18]/10 bg-white/70 p-3 backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: activePillar.color }}
                  />
                  <span className="text-xs font-bold text-[#1A1A18]">
                    {activePillar.label}
                  </span>
                </div>
                <span className="[font-family:Georgia,serif] text-xs font-bold" style={{ color: activePillar.color }}>
                  {activePillar.score}%
                </span>
              </div>

              {/* Score bar */}
              <div className="h-1.5 w-full rounded-full bg-[#1A1A18]/8 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${activePillar.score}%`,
                    backgroundColor: activePillar.color,
                  }}
                />
              </div>

              {/* Top Verified Skills */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A18]/40">
                  Contributing Skills & Stacks
                </span>
                {activePillar.topSkills && activePillar.topSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {activePillar.topSkills.map((sk) => (
                      <span
                        key={sk}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#1A1A18]/8 bg-white px-2 py-0.5 text-[11px] font-semibold text-[#1A1A18]/80 shadow-2xs"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5 text-[#2D6A4F]" />
                        {sk}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-[#1A1A18]/45 italic">
                    Add technologies in settings to reinforce this pillar.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Actionable Next Steps */}
          <div className="rounded-2xl border border-[#1A1A18]/8 bg-[#F7F5F0] p-2.5 flex items-start gap-2">
            <Compass className="h-3.5 w-3.5 text-[#2D6A4F] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#1A1A18]/70 leading-relaxed">
              {dna?.growthRecommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
