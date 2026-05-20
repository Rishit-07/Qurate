import { useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const prompts = [
  'React accessibility issues',
  'Python documentation bugs',
  'Node.js backend good first issues',
  'Vue UI polish tasks',
  'MongoDB aggregation help wanted',
]

function DiscoverPage({
  bookmarks,
  onNavigate,
  onSignOut,
  onToggleBookmark,
}) {
  const [promptIndex, setPromptIndex] = useState(0)
  const [typedPrompt, setTypedPrompt] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState({
    loading: false,
    error: '',
    searched: false,
  })

  useEffect(() => {
    const currentPrompt = prompts[promptIndex]

    if (typedPrompt.length < currentPrompt.length) {
      const timer = setTimeout(() => {
        setTypedPrompt(currentPrompt.slice(0, typedPrompt.length + 1))
      }, 62)

      return () => clearTimeout(timer)
    }

    const timer = setTimeout(() => {
      setTypedPrompt('')
      setPromptIndex((current) => (current + 1) % prompts.length)
    }, 1400)

    return () => clearTimeout(timer)
  }, [promptIndex, typedPrompt])

  async function handleSearch(event) {
    event.preventDefault()

    if (!query.trim()) return

    setStatus({ loading: true, error: '', searched: true })

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/issues/search?q=${encodeURIComponent(query.trim())}`,
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not search GitHub issues')
      }

      setResults(data.issues || [])
      setStatus({ loading: false, error: '', searched: true })
    } catch (error) {
      setStatus({
        loading: false,
        error:
          error.message ||
          'Could not reach GitHub search. Check that the backend is running.',
        searched: true,
      })
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
            <button
              onClick={() => onNavigate('feed')}
              className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]"
            >
              Feed
            </button>
            <button className="font-bold text-[#1A1A18]">Discover</button>
            <button
              onClick={() => onNavigate('bookmarks')}
              className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]"
            >
              Bookmarks
            </button>
            <button
              onClick={onSignOut}
              className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]"
            >
              Profile
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto w-full max-w-6xl border-x border-[#1A1A18]/10 px-6 py-14 sm:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="[font-family:Georgia,serif] text-5xl font-bold leading-[1.05] tracking-normal sm:text-7xl">
            What should I{' '}
            <span className="italic text-[#2D6A4F]">contribute</span> next?
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg font-medium leading-8 text-[#1A1A18]/68">
            "Open source is a conversation: every issue you solve leaves the
            project easier for the next person to enter."
          </p>

          <form onSubmit={handleSearch} className="mx-auto mt-12 max-w-4xl">
            <label className="block rounded-2xl border border-[#1A1A18]/15 bg-white/50 p-5 text-left shadow-sm transition focus-within:border-[#2D6A4F] focus-within:ring-2 focus-within:ring-[#2D6A4F]/15">
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-[#1A1A18]/45">
                Find issues
              </span>
              <div className="mt-3 flex items-start gap-4">
                <textarea
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  rows={3}
                  className="min-h-24 flex-1 resize-none bg-transparent text-2xl font-semibold leading-9 text-[#1A1A18] outline-none placeholder:text-[#1A1A18]/45"
                  placeholder={typedPrompt}
                />
                <button
                  type="submit"
                  disabled={status.loading}
                  className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#1A1A18]/15 bg-[#1A1A18] text-lg font-bold text-[#F7F5F0] transition hover:-translate-y-0.5 hover:bg-[#2D6A4F] disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Search GitHub issues"
                >
                  ↑
                </button>
              </div>
            </label>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {prompts.slice(0, 3).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setQuery(prompt)}
                className="rounded-full bg-[#1A1A18]/7 px-5 py-3 text-sm font-semibold text-[#1A1A18]/70 transition hover:bg-[#2D6A4F]/10 hover:text-[#2D6A4F]"
              >
                {prompt}
              </button>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-xl text-sm font-semibold uppercase tracking-[0.28em] text-[#1A1A18]/38">
            Try examples like docs, accessibility, backend bugs, tests
          </p>
        </div>

        <div className="mt-14 space-y-5 pb-12">
          {status.loading &&
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-lg border border-[#1A1A18]/10 bg-white/45"
              />
            ))}

          {status.error && (
            <p className="rounded-md border border-red-700/20 bg-red-700/10 px-4 py-3 text-sm font-medium text-red-800">
              {status.error}
            </p>
          )}

          {!status.loading &&
            !status.error &&
            results.map((issue, index) => (
              <DiscoverIssueCard
                key={issue._id || issue.github_id}
                issue={issue}
                index={index}
                isBookmarked={bookmarks.some(
                  (bookmark) => getIssueId(bookmark) === getIssueId(issue),
                )}
                onToggleBookmark={onToggleBookmark}
              />
            ))}

          {!status.loading &&
            !status.error &&
            status.searched &&
            results.length === 0 && (
              <div className="rounded-lg border border-[#1A1A18]/10 bg-white/45 px-5 py-12 text-center">
                <h2 className="[font-family:Georgia,serif] text-2xl">
                  No issues found.
                </h2>
                <p className="mt-2 text-sm font-medium text-[#1A1A18]/60">
                  Try a broader contribution topic.
                </p>
              </div>
            )}
        </div>
      </section>
    </main>
  )
}

function DiscoverIssueCard({ issue, index, isBookmarked, onToggleBookmark }) {
  const score = getIssueScore(issue)
  const labels = issue.labels?.slice(0, 3) || []
  const language = issue.repo?.language || issue.stacks?.[0] || 'open source'

  return (
    <article
      className="feed-card rounded-lg border border-[#2D6A4F]/70 bg-white/55 px-5 py-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white/75"
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
          <span aria-hidden="true">&#9829;</span>
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
    </article>
  )
}

function getIssueScore(issue) {
  const latestScore = issue.fitScores?.at?.(-1)?.score
  if (latestScore) return latestScore

  if (issue.complexity === 'beginner') return 8
  if (issue.complexity === 'intermediate') return 6
  return 3
}

function getIssueId(issue) {
  return issue._id || issue.github_id
}

export default DiscoverPage
