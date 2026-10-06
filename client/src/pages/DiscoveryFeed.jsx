import { useEffect, useMemo, useRef, useState } from 'react'
import AiAssistantModal from '../components/AiAssistantModal'

const RAW_API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '')
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, '')
const ISSUES_PER_PAGE = 10

function DiscoveryFeed({
  user,
  bookmarks,
  onNavigate,
  onToggleBookmark,
}) {
  const [issues, setIssues] = useState([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [maxFetchedPage, setMaxFetchedPage] = useState(1)
  const [selectedAiIssue, setSelectedAiIssue] = useState(null)
  const [feedStatus, setFeedStatus] = useState({
    loading: true,
    error: '',
    total: 0,
  })
  const sentinelRef = useRef(null)
  const isFetchingRef = useRef(false)

  const preferredStack = useMemo(() => {
    if (user?.stack?.length) return user.stack
    return ['React', 'Node.js']
  }, [user])

  function buildFeedQuery(page, filter) {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(ISSUES_PER_PAGE))

    const userStackStr = (user?.stack || []).join(',')
    if (userStackStr) {
      params.set('userStack', userStackStr)
    }
    if (user?.experienceLevel) {
      params.set('userLevel', user.experienceLevel)
    }

    const normalized = normalizeFilterValue(filter)
    if (normalized && normalized !== 'all') {
      if (['beginner', 'intermediate', 'advanced'].includes(normalized)) {
        params.set('complexity', normalized)
      } else {
        params.set('stack', filter)
      }
    }

    return params.toString()
  }

  const filteredIssues = useMemo(() => {
    if (activeFilter === 'All') return issues

    return issues.filter((issue) => issueMatchesFilter(issue, activeFilter))
  }, [activeFilter, issues])

  const availableFilterOptions = useMemo(() => {
    const difficulties = ['Beginner', 'Intermediate', 'Advanced']
    const popularStacks = ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Go', 'Rust']

    // Include user's preferred stacks first
    const userStacks = (user?.stack || []).map((s) => formatFilterLabel(s)).filter(Boolean)

    // Collect any other stacks from currently loaded issues
    const seenStacks = new Set()
    issues.forEach((issue) => {
      ;(issue.stacks || []).forEach((st) => seenStacks.add(formatFilterLabel(st)))
      if (issue.repo?.language) seenStacks.add(formatFilterLabel(issue.repo.language))
    })

    const combinedStacks = Array.from(
      new Set([...userStacks, ...popularStacks, ...seenStacks])
    ).filter(Boolean)

    return ['All', ...difficulties, ...combinedStacks]
  }, [user, issues])

  const totalPages = Math.max(
    1,
    Math.ceil((feedStatus.total || 0) / ISSUES_PER_PAGE),
  )
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const visibleIssues = useMemo(() => {
    const start = (safeCurrentPage - 1) * ISSUES_PER_PAGE
    return filteredIssues.slice(start, start + ISSUES_PER_PAGE)
  }, [safeCurrentPage, filteredIssues])

  function selectPresetFilter(filter) {
    if (filter === activeFilter) return
    setActiveFilter(filter)
    setCurrentPage(1)
    setMaxFetchedPage(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const controller = new AbortController()
    let isCancelled = false
    const PREFETCH_PAGES = 2 // number of extra pages to prefetch in background

    async function fetchPage(page) {
      if (!page || page < 1) return { issues: [], total: 0 }
      try {
        const query = buildFeedQuery(page, activeFilter)
        const res = await fetch(`${API_BASE_URL}/api/issues?${query}`, {
          signal: controller.signal,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Could not load issues')
        return data
      } catch (err) {
        if (err.name === 'AbortError') throw err
        return { issues: [], total: 0 }
      }
    }

    async function fetchIssues() {
      setFeedStatus((current) => ({ ...current, loading: true, error: '' }))
      setCurrentPage(1)
      setMaxFetchedPage(1)

      try {
        // Fetch first page and render immediately
        const firstData = await fetchPage(1)
        if (isCancelled) return

        const allIssues = [...(firstData.issues || [])]
        const total = typeof firstData.total === 'number' ? firstData.total : allIssues.length
        setIssues(allIssues)
        setFeedStatus({ loading: false, error: '', total })
        setMaxFetchedPage(1)

        // Prefetch background pages for smooth scrolling
        const pageSize = ISSUES_PER_PAGE
        const totalPages = Math.max(1, Math.ceil(total / pageSize))
        const lastPrefetchPage = Math.min(totalPages, 1 + PREFETCH_PAGES)

        if (lastPrefetchPage > 1) {
          const promises = []
          for (let p = 2; p <= lastPrefetchPage; p++) {
            promises.push(
              fetchPage(p).then((d) => {
                if (isCancelled) return
                if (d?.issues?.length) {
                  setIssues((prev) => {
                    const seen = new Set(prev.map(getIssueId))
                    const uniqueNew = d.issues.filter((it) => !seen.has(getIssueId(it)))
                    return [...prev, ...uniqueNew]
                  })
                  setMaxFetchedPage((prevPage) => Math.max(prevPage, p))
                }
              }),
            )
          }

          Promise.all(promises).catch(() => {})
        }
      } catch (error) {
        if (error.name !== 'AbortError' && !isCancelled) {
          setFeedStatus({
            loading: false,
            error:
              error.message ||
              'Could not reach the issue feed. Check that the backend is running.',
            total: 0,
          })
        }
      }
    }

    fetchIssues()

    return () => {
      isCancelled = true
      controller.abort()
    }
  }, [activeFilter, user?.stack, user?.experienceLevel])

  // IntersectionObserver to implement scroll pagination (loads next page when sentinel visible)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          // load next page when sentinel is visible
          const nextPage = maxFetchedPage + 1
          const totalPagesFromStatus = Math.max(1, Math.ceil((feedStatus.total || 0) / ISSUES_PER_PAGE))

          if (isFetchingRef.current) return
          if (nextPage > totalPagesFromStatus) return

          isFetchingRef.current = true

          const query = buildFeedQuery(nextPage, activeFilter)
          fetch(`${API_BASE_URL}/api/issues?${query}`)
            .then((r) => r.json())
            .then((d) => {
              if (d?.issues?.length) {
                setIssues((prev) => {
                  const seen = new Set(prev.map(getIssueId))
                  const uniqueNew = d.issues.filter((it) => !seen.has(getIssueId(it)))
                  return [...prev, ...uniqueNew]
                })
                setMaxFetchedPage((prev) => Math.max(prev, nextPage))
              }
            })
            .catch(() => {})
            .finally(() => {
              isFetchingRef.current = false
            })
        })
      },
      {
        root: null,
        rootMargin: '300px',
        threshold: 0.1,
      },
    )

    const el = sentinelRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
      observer.disconnect()
    }
  }, [maxFetchedPage, feedStatus.total, activeFilter, user?.stack, user?.experienceLevel])

  // Page change handler: if requested page isn't fetched yet, fetch it first
  async function handlePageChange(page) {
    if (page < 1) return

    // If we've already fetched this page, just change the page
    if (page <= maxFetchedPage) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Otherwise fetch the required page and then navigate to it
    try {
      isFetchingRef.current = true
      const query = buildFeedQuery(page, activeFilter)
      const res = await fetch(`${API_BASE_URL}/api/issues?${query}`)
      const data = await res.json()
      if (data?.issues?.length) {
        setIssues((prev) => {
          const seen = new Set(prev.map(getIssueId))
          const uniqueNew = data.issues.filter((it) => !seen.has(getIssueId(it)))
          return [...prev, ...uniqueNew]
        })
        setMaxFetchedPage((prev) => Math.max(prev, page))
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch {
      // ignore fetch errors for pagination
    } finally {
      isFetchingRef.current = false
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#1A1A18] antialiased">
      <nav className="sticky top-0 z-20 border-b border-[#1A1A18]/10 bg-[#F7F5F0]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
          <p className="[font-family:Georgia,serif] text-xl italic tracking-normal">
            Qurate
          </p>

          <div className="flex items-center gap-5 text-sm font-medium sm:gap-8">
            <button className="font-bold text-[#1A1A18]">Feed</button>
            <button
              onClick={() => onNavigate('discover')}
              className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]"
            >
              Discover
            </button>
            <button
              onClick={() => onNavigate('bookmarks')}
              className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]"
            >
              Bookmarks
            </button>
            <button
              onClick={() => onNavigate('contributed-works')}
              className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]"
            >
              Works
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]"
            >
              Profile
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto w-full max-w-6xl border-x border-[#1A1A18]/10 px-6 py-8 sm:px-8">
        <header className="mb-8">
          <h1 className="[font-family:Georgia,serif] text-3xl font-normal tracking-normal sm:text-4xl">
            Good morning, {firstName(user)}.
          </h1>
          <p className="mt-2 text-sm font-medium text-[#1A1A18]/70">
            {feedStatus.loading
              ? 'Loading open-source issues across every level...'
              : activeFilter === 'All'
              ? `${filteredIssues.length} of ${feedStatus.total} issues shown (sorted for your stack & level). Your preference: ${formatStack(preferredStack)}.`
              : `${filteredIssues.length} of ${feedStatus.total} issues found matching "${activeFilter}". Your preference: ${formatStack(preferredStack)}.`}
          </p>
        </header>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 flex-wrap gap-2">
            {availableFilterOptions.map((filter) => {
              const selected = activeFilter === filter

              return (
                <button
                  key={filter}
                  onClick={() => selectPresetFilter(filter)}
                  className={`h-8 rounded-full border px-4 text-xs font-semibold transition ${
                    selected
                      ? 'border-[#1A1A18] bg-[#1A1A18] text-[#F7F5F0]'
                      : 'border-[#1A1A18]/15 bg-white/45 text-[#1A1A18]/75 hover:border-[#2D6A4F] hover:text-[#2D6A4F]'
                  }`}
                >
                  {filter}
                </button>
              )
            })}
          </div>
        </div>

        {feedStatus.error && (
          <p className="rounded-md border border-red-700/20 bg-red-700/10 px-4 py-3 text-sm font-medium text-red-800">
            {feedStatus.error}
          </p>
        )}

        <div className="space-y-5 pb-12">
          {feedStatus.loading &&
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-lg border border-[#1A1A18]/10 bg-white/45"
              />
            ))}

          {!feedStatus.loading &&
            !feedStatus.error &&
            visibleIssues.map((issue, index) => (
              <IssueCard
                key={issue._id || issue.github_id}
                issue={issue}
                index={index}
                user={user}
                isBookmarked={bookmarks.some(
                  (bookmark) => getIssueId(bookmark) === getIssueId(issue),
                )}
                onToggleBookmark={onToggleBookmark}
                onOpenAi={setSelectedAiIssue}
              />
            ))}

          {!feedStatus.loading &&
            !feedStatus.error &&
            (feedStatus.total || 0) > ISSUES_PER_PAGE && (
              <PaginationControls
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}

          {/* Sentinel for scroll-based pagination */}
          <div ref={sentinelRef} className="h-6 w-full" aria-hidden="true" />

          {!feedStatus.loading &&
            !feedStatus.error &&
            filteredIssues.length === 0 && (
              <div className="rounded-lg border border-[#1A1A18]/10 bg-white/45 px-5 py-12 text-center">
                <h2 className="[font-family:Georgia,serif] text-2xl">
                  No issues found.
                </h2>
                <p className="mt-2 text-sm font-medium text-[#1A1A18]/60">
                  Try another filter or sync issues from the backend.
                </p>
              </div>
            )}
        </div>
      </section>

      {selectedAiIssue && (
        <AiAssistantModal
          issue={selectedAiIssue}
          user={user}
          onClose={() => setSelectedAiIssue(null)}
        />
      )}
    </main>
  )
}

function IssueCard({ issue, index, isBookmarked, onToggleBookmark, onOpenAi, user }) {
  const { score, reason } = computeIssueFit(issue, user)
  const muted = score <= 4
  const labels = issue.labels?.slice(0, 3) || []
  const language = issue.repo?.language || issue.stacks?.[0] || 'open source'

  return (
    <article
      className={`feed-card rounded-lg border bg-white/55 px-5 py-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2D6A4F] hover:bg-white/75 ${
        muted
          ? 'border-[#1A1A18]/10 opacity-60'
          : 'border-[#2D6A4F]/80'
      }`}
      style={{ animationDelay: `${Math.min(index * 90, 450)}ms` }}
    >
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#1A1A18]/55">
          <span aria-hidden="true">[]</span>
          <span>
            {issue.repo?.name || 'open-source-repo'} - {language}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onToggleBookmark(issue)}
          className={`heart-button ${isBookmarked ? 'liked' : ''}`}
          aria-label={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
        >
          <span aria-hidden="true">♥</span>
        </button>
      </div>

      <a
        href={issue.html_url}
        target="_blank"
        rel="noreferrer"
        className="block text-lg font-bold leading-snug text-[#1A1A18] transition hover:text-[#2D6A4F]"
      >
        {issue.title}
      </a>

      <div className="mt-3 flex flex-wrap gap-2">
        {labels.map((label) => (
          <span
            key={label}
            className="rounded-full bg-[#2D6A4F]/10 px-3 py-1 text-xs font-semibold text-[#2D6A4F]"
          >
            {label}
          </span>
        ))}
        <span className="rounded-full bg-[#1A1A18]/5 px-3 py-1 text-xs font-semibold text-[#1A1A18]/60">
          {issue.complexity || 'beginner'}
        </span>
        {issue.vectorSimilarity !== undefined && (
          <span className="rounded-full bg-indigo-100 text-indigo-800 px-2.5 py-0.5 text-xs font-bold">
            RAG Match: {(issue.vectorSimilarity * 100).toFixed(0)}%
          </span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm font-semibold text-[#1A1A18]/70">
        <span>AI fit</span>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#2D6A4F]/10">
          <div
            className={`h-full rounded-full ${
              score >= 7 ? 'bg-[#2D6A4F]' : score >= 5 ? 'bg-amber-600' : 'bg-stone-400'
            }`}
            style={{ width: `${score * 10}%` }}
          />
        </div>
        <span className={score >= 7 ? 'text-[#2D6A4F]' : score >= 5 ? 'text-amber-700' : 'text-stone-500'}>
          {score}/10
        </span>
      </div>

      <p className="mt-4 text-sm font-medium leading-6 text-[#1A1A18]/65">
        {reason}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-[#1A1A18]/10 pt-3">
        <button
          type="button"
          onClick={() => onOpenAi?.(issue)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#2D6A4F]/30 bg-[#2D6A4F]/10 px-3 py-1.5 text-xs font-bold text-[#2D6A4F] transition hover:bg-[#2D6A4F] hover:text-[#F7F5F0]"
        >
          ⚡ AI Deep Dive & Roadmap (Streaming / Multi-Step Agent)
        </button>
        <span className="text-[11px] font-medium text-[#1A1A18]/50">
          Groq AI • Ultra-Fast
        </span>
      </div>
    </article>
  )
}

function PaginationControls({ currentPage, totalPages, onPageChange }) {
  function goToPage(page) {
    onPageChange(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 pt-4"
      aria-label="Issue pages"
    >
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-10 rounded-md border border-[#1A1A18]/15 px-4 text-sm font-semibold text-[#1A1A18]/75 transition hover:border-[#2D6A4F] hover:text-[#2D6A4F] disabled:cursor-not-allowed disabled:opacity-35"
      >
        Previous
      </button>

      {/* Render a sliding window of up to 10 page buttons */}
      {(() => {
        const maxButtons = 10
        if (totalPages <= maxButtons) {
          return Array.from({ length: totalPages }).map((_, idx) => {
            const page = idx + 1
            const selected = page === currentPage
            return (
              <button
                key={page}
                type="button"
                onClick={() => goToPage(page)}
                className={`h-10 min-w-10 rounded-md border px-3 text-sm font-bold transition ${
                  selected
                    ? 'border-[#2D6A4F] bg-[#2D6A4F] text-[#F7F5F0]'
                    : 'border-[#1A1A18]/15 bg-white/45 text-[#1A1A18]/75 hover:border-[#2D6A4F] hover:text-[#2D6A4F]'
                }`}
              >
                {page}
              </button>
            )
          })
        }

        const half = Math.floor(maxButtons / 2)
        let start = currentPage - half
        let end = start + maxButtons - 1

        if (start < 1) {
          start = 1
          end = maxButtons
        }

        if (end > totalPages) {
          end = totalPages
          start = Math.max(1, totalPages - maxButtons + 1)
        }

       const buttons = []

for (
  let pageNum = start;
  pageNum <= end;
  pageNum++
) {
  const selected = pageNum === currentPage

  buttons.push(
    <button
      key={pageNum}
      type="button"
      onClick={() => goToPage(pageNum)}
      className={`h-10 min-w-10 rounded-md border px-3 text-sm font-bold transition ${
        selected
          ? 'border-[#2D6A4F] bg-[#2D6A4F] text-[#F7F5F0]'
          : 'border-[#1A1A18]/15 bg-white/45 text-[#1A1A18]/75 hover:border-[#2D6A4F] hover:text-[#2D6A4F]'
      }`}
    >
      {pageNum}
    </button>
  )
}

        return buttons
      })()}

      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-10 rounded-md border border-[#1A1A18]/15 px-4 text-sm font-semibold text-[#1A1A18]/75 transition hover:border-[#2D6A4F] hover:text-[#2D6A4F] disabled:cursor-not-allowed disabled:opacity-35"
      >
        Next
      </button>
    </nav>
  )
}

function issueMatchesFilter(issue, activeFilter) {
  const filter = normalizeFilterValue(activeFilter)

  if (['beginner', 'intermediate', 'advanced'].includes(filter)) {
    return issue.complexity === filter
  }

  const stackValues = [
    ...(issue.stacks || []),
    issue.repo?.language,
  ].map(normalizeFilterValue)

  return stackValues.includes(filter)
}

function computeIssueFit(issue, user) {
  // If the issue already has a recorded personalized fit score in MongoDB
  const latestScore = issue.fitScores?.at?.(-1)?.score
  const latestReason = issue.fitScores?.at?.(-1)?.reason
  if (latestScore && latestReason) {
    return { score: latestScore, reason: latestReason }
  }

  const issueLanguage = issue.repo?.language || issue.stacks?.[0] || 'Open source'
  const userStacks = (user?.stack || []).map(normalizeFilterValue).filter(Boolean)
  const userLevel = (user?.experienceLevel || 'beginner').toLowerCase()
  const issueComplexity = (issue.complexity || 'beginner').toLowerCase()

  const issueStacks = [
    ...(issue.stacks || []),
    issue.repo?.language,
  ].filter(Boolean).map(normalizeFilterValue)

  // 1. Tech stack match
  const hasStackMatch = userStacks.length === 0 || userStacks.some((us) => issueStacks.includes(us))

  // 2. Experience level match
  const hasLevelMatch = issueComplexity === userLevel

  let score = 3
  let reason = `${issueLanguage} only • Outside your preferred ${user?.stack?.length ? user.stack.join(', ') : 'tech'} stack.`

  if (hasStackMatch) {
    if (hasLevelMatch) {
      score = issueComplexity === 'beginner' ? 9 : 8
      reason = `${issueLanguage} match • Perfect ${issueComplexity} fit for your declared experience level.`
    } else {
      score = 7
      reason = `${issueLanguage} match • Matches your tech stack, rated ${issueComplexity} complexity.`
    }
  } else {
    score = hasLevelMatch ? 4 : 2
    reason = `${issueLanguage} repo • Outside your current ${user?.stack?.length ? user.stack.join(', ') : 'target'} stack.`
  }

  return { score, reason }
}

function firstName(user) {
  return user?.username?.split(' ')[0] || 'Rishi'
}

function formatStack(stack) {
  return stack
    .map((item) => {
      const lower = item.toLowerCase()
      if (lower === 'node.js' || lower === 'nodejs') return 'Node.js'
      return titleCase(item)
    })
    .join(' + ')
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatFilterLabel(value = '') {
  const normalized = normalizeFilterValue(value)

  if (normalized === 'javascript') return 'JavaScript'
  if (normalized === 'nodejs') return 'Node.js'
  if (normalized === 'mongodb') return 'MongoDB'
  if (normalized === 'typescript') return 'TypeScript'
  if (normalized === 'python') return 'Python'
  if (normalized === 'react') return 'React'
  if (normalized === 'vue') return 'Vue'
  if (normalized === 'go' || normalized === 'golang') return 'Go'
  if (normalized === 'rust') return 'Rust'
  if (normalized === 'docker') return 'Docker'
  if (normalized === 'graphql') return 'GraphQL'
  if (normalized === 'postgresql') return 'PostgreSQL'

  return titleCase(value)
}

function normalizeFilterValue(value = '') {
  return value.toLowerCase().replace(/\s+/g, '').replace(/\./g, '')
}

function getIssueId(issue) {
  return issue._id || issue.github_id
}

export default DiscoveryFeed
