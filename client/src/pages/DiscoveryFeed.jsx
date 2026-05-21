import { useEffect, useMemo, useState } from 'react'

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
  const [feedStatus, setFeedStatus] = useState({
    loading: true,
    error: '',
    total: 0,
  })

  const preferredStack = useMemo(() => {
    if (user?.stack?.length) return user.stack
    return ['react', 'node.js']
  }, [user])

  const filteredIssues = useMemo(() => {
    if (activeFilter === 'All') return issues

    return issues.filter((issue) => issueMatchesFilter(issue, activeFilter))
  }, [activeFilter, issues])

  const availableFilterOptions = useMemo(() => {
    const difficulties = ['Beginner', 'Intermediate', 'Advanced'].filter(
      (difficulty) =>
        issues.some((issue) => issue.complexity === difficulty.toLowerCase()),
    )
    const stacks = new Map()

    issues.forEach((issue) => {
      ;(issue.stacks || []).forEach((stack) => {
        const normalized = normalizeFilterValue(stack)
        stacks.set(normalized, formatFilterLabel(stack))
      })

      if (issue.repo?.language) {
        const normalizedLanguage = normalizeFilterValue(issue.repo.language)
        stacks.set(
          normalizedLanguage,
          formatFilterLabel(issue.repo.language),
        )
      }
    })

    return ['All', ...difficulties, ...stacks.values()]
  }, [issues])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredIssues.length / ISSUES_PER_PAGE),
  )
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const visibleIssues = useMemo(() => {
    const start = (safeCurrentPage - 1) * ISSUES_PER_PAGE
    return filteredIssues.slice(start, start + ISSUES_PER_PAGE)
  }, [safeCurrentPage, filteredIssues])

  function selectPresetFilter(filter) {
    setActiveFilter(filter)
    setCurrentPage(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const controller = new AbortController()

    async function fetchIssues() {
      setFeedStatus((current) => ({ ...current, loading: true, error: '' }))

      try {
        const allIssues = []
        let page = 1
        let hasMore = true
        let total = 0

        while (hasMore) {
          const response = await fetch(
            `${API_BASE_URL}/api/issues?page=${page}`,
            {
              signal: controller.signal,
            },
          )
          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Could not load issues')
          }

          allIssues.push(...(data.issues || []))
          total = data.total || allIssues.length
          hasMore = Boolean(data.hasMore)
          page += 1
        }

        setIssues(allIssues)
        setFeedStatus({
          loading: false,
          error: '',
          total,
        })
      } catch (error) {
        if (error.name !== 'AbortError') {
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

    return () => controller.abort()
  }, [])

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
              ? 'Loading open-source issues across every level.'
              : `${filteredIssues.length} of ${feedStatus.total} issues shown across all stacks. Your preference: ${formatStack(
                  preferredStack,
                )}.`}
          </p>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex flex-1 flex-wrap gap-3">
            {availableFilterOptions.map((filter) => {
              const selected = activeFilter === filter

              return (
                <button
                  key={filter}
                  onClick={() => selectPresetFilter(filter)}
                  className={`h-9 rounded-full border px-5 text-sm font-semibold transition ${
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
                isBookmarked={bookmarks.some(
                  (bookmark) => getIssueId(bookmark) === getIssueId(issue),
                )}
                onToggleBookmark={onToggleBookmark}
              />
            ))}

          {!feedStatus.loading &&
            !feedStatus.error &&
            filteredIssues.length > ISSUES_PER_PAGE && (
              <PaginationControls
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}

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
    </main>
  )
}

function IssueCard({ issue, index, isBookmarked, onToggleBookmark }) {
  const score = getIssueScore(issue)
  const muted = score <= 3
  const labels = issue.labels?.slice(0, 3) || []
  const language = issue.repo?.language || issue.stacks?.[0] || 'open source'

  return (
    <article
      className={`feed-card rounded-lg border bg-white/55 px-5 py-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2D6A4F] hover:bg-white/75 ${
        muted
          ? 'border-[#1A1A18]/10 opacity-55'
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
      </div>

      <div className="mt-6 grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm font-semibold text-[#1A1A18]/70">
        <span>AI fit</span>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#2D6A4F]/10">
          <div
            className="h-full rounded-full bg-[#2D6A4F]"
            style={{ width: `${score * 10}%` }}
          />
        </div>
        <span className="text-[#2D6A4F]">{score}/10</span>
      </div>

      <p className="mt-4 text-sm font-medium leading-6 text-[#1A1A18]/65">
        {getIssueReason(issue, score)}
      </p>
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

function getIssueScore(issue) {
  const latestScore = issue.fitScores?.at?.(-1)?.score
  if (latestScore) return latestScore

  if (issue.complexity === 'beginner') return 8
  if (issue.complexity === 'intermediate') return 6
  return 3
}

function getIssueReason(issue, score) {
  const latestReason = issue.fitScores?.at?.(-1)?.reason
  if (latestReason) return latestReason

  const language = issue.repo?.language || issue.stacks?.[0] || 'Open source'
  if (score >= 8) return `${language} match - strong scope for your current stack.`
  if (score >= 5) return `${language} match - worth reviewing before you pick it up.`
  return `${language} only - outside your current stack.`
}

function firstName(user) {
  return user?.username?.split(' ')[0] || 'Rishi'
}

function formatStack(stack) {
  return stack
    .map((item) => (item === 'node.js' ? 'Node.js' : titleCase(item)))
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

  return titleCase(value)
}

function normalizeFilterValue(value = '') {
  return value.toLowerCase().replace(/\s+/g, '').replace(/\./g, '')
}

function getIssueId(issue) {
  return issue._id || issue.github_id
}

export default DiscoveryFeed
