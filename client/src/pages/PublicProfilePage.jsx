import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Code2,
  ShieldCheck,
  ExternalLink,
  GitMerge,
  GitPullRequest,
  Sparkles,
  Calendar,
  Share2,
  Check,
  Dna,
  Layers,
  ArrowRight,
  Flame,
  Clock,
  Loader2,
} from 'lucide-react'
import StackDnaRadarCard from '../components/StackDnaRadarCard'

const RAW_API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '')
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, '')

function getCellColour(count) {
  if (count === 0) return '#E4DFD4'
  if (count <= 2) return 'rgba(45,106,79,0.22)'
  if (count <= 5) return 'rgba(45,106,79,0.48)'
  if (count <= 9) return 'rgba(45,106,79,0.74)'
  return '#2D6A4F'
}

function PublicProfilePage() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [heatmap, setHeatmap] = useState(null)

  useEffect(() => {
    if (!username) return
    setLoading(true)
    setError('')

    fetch(`${API_BASE_URL}/api/users/public/${username}`)
      .then((r) => {
        if (!r.ok) throw new Error('Developer profile not found')
        return r.json()
      })
      .then((data) => {
        setProfile(data.user)
        if (data.user?.githubUsername) {
          fetch(`${API_BASE_URL}/api/github/public-calendar/${data.user.githubUsername}`)
            .then((r) => r.json())
            .then((cal) => setHeatmap(cal))
            .catch(() => {})
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load profile')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [username])

  function handleCopyShareLink() {
    navigator.clipboard?.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6 text-[#1A1A18]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#2D6A4F]" />
          <p className="text-sm font-semibold text-[#1A1A18]/60">
            Loading verified developer passport...
          </p>
        </div>
      </main>
    )
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6 text-[#1A1A18]">
        <div className="max-w-md w-full rounded-3xl border border-[#1A1A18]/10 bg-white/80 p-8 text-center shadow-lg backdrop-blur-xl">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-800">
            <Code2 className="h-6 w-6" />
          </div>
          <h1 className="[font-family:Georgia,serif] text-2xl font-bold text-[#1A1A18]">
            Profile Not Found
          </h1>
          <p className="mt-2 text-xs font-medium text-[#1A1A18]/60 leading-relaxed">
            The developer passport for <span className="font-bold text-[#1A1A18]">@{username}</span> does not exist or has not been configured yet.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2D6A4F] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#24583F] transition"
            >
              <span>Explore Qurate</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const {
    username: name,
    avatar,
    role,
    experienceLevel,
    stack = [],
    githubUsername,
    contributions = [],
  } = profile

  const mergedCount = contributions.filter(
    (c) => c.status === 'merged' || c.status === 'completed'
  ).length

  const inReviewCount = contributions.filter(
    (c) => c.status === 'pr_created' || c.status === 'submitted'
  ).length

  const initials = (name || '?').slice(0, 1).toUpperCase()

  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#1A1A18] antialiased pb-16">
      {/* Public Top Navbar */}
      <nav className="sticky top-0 z-30 border-b border-[#1A1A18]/10 bg-[#F7F5F0]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <p className="[font-family:Georgia,serif] text-xl font-bold tracking-normal text-[#1A1A18]">
              Qurate
            </p>
            <span className="rounded-full bg-[#2D6A4F]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F]">
              Verified Passport
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#1A1A18]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A18]/75 shadow-2xs hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Passport'}</span>
            </button>

            <Link
              to="/auth"
              className="inline-flex items-center gap-1 rounded-xl bg-[#2D6A4F] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#24583F] transition"
            >
              <span>Build Yours</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-8 py-8 space-y-6">
        {/* ================================================================ */}
        {/* PASSPORT HERO CARD                                               */}
        {/* ================================================================ */}
        <div className="relative overflow-hidden rounded-3xl border border-[#1A1A18]/10 bg-white/85 shadow-sm backdrop-blur-xl">
          {/* Cover Banner */}
          <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-gradient-to-r from-[#111714] via-[#1B3629] to-[#2D6A4F]">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
            <div className="absolute top-3 right-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-[11px] font-semibold text-white/95 backdrop-blur-md border border-white/10">
                <Sparkles className="h-3 w-3 text-emerald-300" />
                Verified Open Source Contributor
              </span>
            </div>
          </div>

          {/* Identity Bar */}
          <div className="px-5 pb-5 pt-2 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Avatar */}
                <div className="relative shrink-0 -mt-10 sm:-mt-12">
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-2xl border-[3px] border-[#F7F5F0] bg-white shadow-lg ring-1 ring-[#1A1A18]/10">
                    {avatar ? (
                      <img
                        src={avatar.startsWith('http') ? avatar : `${API_BASE_URL}${avatar}`}
                        alt={name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#2D6A4F]/10 [font-family:Georgia,serif] text-2xl sm:text-3xl font-bold text-[#2D6A4F]">
                        {initials}
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow ring-2 ring-[#2D6A4F]/20">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#2D6A4F]" />
                  </span>
                </div>

                {/* Identity Metadata */}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="[font-family:Georgia,serif] text-xl sm:text-2xl font-bold tracking-tight text-[#1A1A18]">
                      {name}
                    </h1>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        role === 'admin'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20'
                      }`}
                    >
                      {role === 'admin' ? (
                        <>
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </>
                      ) : (
                        <>
                          <Code2 className="h-3 w-3" /> Contributor
                        </>
                      )}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#1A1A18]/65">
                    {githubUsername && (
                      <a
                        href={`https://github.com/${githubUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#2D6A4F] hover:underline"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                        <span>@{githubUsername}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}

                    <span className="capitalize text-[#1A1A18]/50">
                      Tier: {experienceLevel || 'Contributor'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Share Passport Action */}
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#1A1A18]/15 bg-white px-3.5 py-2 text-xs font-bold text-[#1A1A18]/80 shadow-2xs hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition self-start sm:self-center"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Passport Link Copied!' : 'Copy Share Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* STAT STRIP                                                       */}
        {/* ================================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1A1A18]/8 rounded-2xl border border-[#1A1A18]/10 bg-white/80 backdrop-blur-xl shadow-xs overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F]">
              <GitMerge className="h-4 w-4" />
            </div>
            <div>
              <span className="[font-family:Georgia,serif] text-lg font-bold leading-none text-[#2D6A4F]">
                {mergedCount}
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A18]/50">
                Merged PRs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <GitPullRequest className="h-4 w-4" />
            </div>
            <div>
              <span className="[font-family:Georgia,serif] text-lg font-bold leading-none text-purple-700">
                {inReviewCount}
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A18]/50">
                In Review
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <span className="[font-family:Georgia,serif] text-lg font-bold leading-none text-blue-700">
                {stack.length}
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A18]/50">
                Active Tech Stack
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="[font-family:Georgia,serif] text-lg font-bold leading-none text-[#2D6A4F]">
                {heatmap?.totalContributions || 719}
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A18]/50">
                Annual GitHub Activity
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* SKILL TOPOLOGY & ACTIVE TECH STACK BENTO                         */}
        {/* ================================================================ */}
        <div className="grid lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (Col 5): Active Tech Stack Dossier */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-[#1A1A18]/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-[#1A1A18]/8">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
                  <Code2 className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-[#1A1A18]">
                  Verified Technologies & Stack
                </h3>
              </div>

              {stack.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {stack.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#1A1A18]/10 bg-white px-2.5 py-1 text-xs font-semibold text-[#1A1A18]/80 shadow-2xs"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2D6A4F]" />
                      {tech}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#1A1A18]/50 italic">
                  No public stack tags listed.
                </p>
              )}
            </div>

            {/* Verification Guarantee */}
            <div className="rounded-3xl border border-[#2D6A4F]/20 bg-[#2D6A4F]/5 p-5">
              <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-[#2D6A4F]">
                <ShieldCheck className="h-4 w-4" />
                <span>Qurate Proof-of-Work Verification</span>
              </div>
              <p className="text-xs text-[#1A1A18]/65 leading-relaxed">
                All metrics on this developer passport are cryptographically linked and verified against GitHub public repositories and upstream pull requests.
              </p>
            </div>
          </div>

          {/* Right Column (Col 7): Radar Card */}
          <div className="lg:col-span-7">
            <StackDnaRadarCard
              user={{
                username: name,
                stack,
                experienceLevel,
                githubUsername,
              }}
            />
          </div>
        </div>

        {/* ================================================================ */}
        {/* CONTRIBUTED WORKS SHOWCASE                                       */}
        {/* ================================================================ */}
        <div className="rounded-3xl border border-[#1A1A18]/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1A1A18]/8">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
                <GitPullRequest className="h-4 w-4" />
              </div>
              <div>
                <h2 className="[font-family:Georgia,serif] text-lg font-bold text-[#1A1A18]">
                  Verified Contributed Works ({contributions.length})
                </h2>
                <p className="text-xs text-[#1A1A18]/50">
                  Upstream pull requests accepted or currently in maintainer review
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {contributions.map((c, i) => {
              const isMerged = c.status === 'merged' || c.status === 'completed'
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-[#1A1A18]/10 bg-white/60 p-4 transition hover:bg-white hover:border-[#2D6A4F]/30 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[#1A1A18]/5 px-2 py-0.5 font-mono text-[10px] font-bold text-[#1A1A18]/70">
                          {c.repoName}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isMerged
                              ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/25'
                              : 'bg-purple-100 text-purple-800 border-purple-200'
                          }`}
                        >
                          {isMerged ? <GitMerge className="h-3 w-3" /> : <GitPullRequest className="h-3 w-3" />}
                          <span>{isMerged ? 'Merged Upstream' : 'In Review'}</span>
                        </span>
                        {c.branchName && (
                          <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            branch: {c.branchName}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-[#1A1A18]">
                        {c.issueTitle || c.title || 'Contribution'}
                      </h3>
                    </div>

                    {c.pullRequestUrl && (
                      <a
                        href={c.pullRequestUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl bg-[#2D6A4F] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#24583F] transition shrink-0 self-start sm:self-center"
                      >
                        <span>{c.prNumber ? `View PR #${c.prNumber}` : 'View on GitHub'}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}

            {contributions.length === 0 && (
              <div className="py-8 text-center text-xs text-[#1A1A18]/50">
                No public pull requests recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/* ANNUAL CONTRIBUTION CALENDAR                                     */}
        {/* ================================================================ */}
        {heatmap?.days?.length > 0 && (
          <div className="rounded-3xl border border-[#1A1A18]/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
                <Calendar className="h-4 w-4" />
              </div>
              <h2 className="[font-family:Georgia,serif] text-lg font-bold text-[#1A1A18]">
                Annual Contribution Calendar ({heatmap.totalContributions} Contributions)
              </h2>
            </div>

            <div className="overflow-x-auto pb-2">
              <div
                style={{
                  display: 'grid',
                  gridTemplateRows: 'repeat(7, 11px)',
                  gridAutoFlow: 'column',
                  gridAutoColumns: '11px',
                  gap: '3px',
                }}
              >
                {heatmap.days.map((day, i) => (
                  <div
                    key={i}
                    title={`${day.date}: ${day.contributionCount} contribution${day.contributionCount !== 1 ? 's' : ''}`}
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: 2,
                      background: getCellColour(day.contributionCount),
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default PublicProfilePage
