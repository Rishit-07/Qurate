function BookmarkPage({
  bookmarks,
  onNavigate,
  onToggleBookmark,
  onUpdateBookmarkStatus,
}) {
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
            <button
              onClick={() => onNavigate('discover')}
              className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]"
            >
              Discover
            </button>
            <button className="font-bold text-[#1A1A18]">Bookmarks</button>
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
            Your Issues
          </h1>
          <p className="mt-2 text-sm font-medium text-[#1A1A18]/70">
            {bookmarks.length
              ? `${bookmarks.length} saved issue${bookmarks.length === 1 ? '' : 's'} ready for you.`
              : 'Save issues from the feed and they will appear here.'}
          </p>
        </header>

        <div className="space-y-5 pb-12">
          {bookmarks.map((issue, index) => (
            <BookmarkCard
              key={getIssueId(issue)}
              issue={issue}
              index={index}
              onToggleBookmark={onToggleBookmark}
              onUpdateBookmarkStatus={onUpdateBookmarkStatus}
            />
          ))}

          {bookmarks.length === 0 && (
            <div className="rounded-lg border border-[#1A1A18]/10 bg-white/45 px-5 py-12 text-center">
              <h2 className="[font-family:Georgia,serif] text-2xl">
                No saved issues yet.
              </h2>
              <p className="mt-2 text-sm font-medium text-[#1A1A18]/60">
                Tap the heart on an issue to add it here.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function BookmarkCard({ issue, index, onToggleBookmark, onUpdateBookmarkStatus }) {
  const score = getIssueScore(issue)
  const labels = issue.labels?.slice(0, 3) || []
  const language = issue.repo?.language || issue.stacks?.[0] || 'open source'
  const status = issue.bookmarkStatus || 'planned'

  return (
    <article
      className="feed-card rounded-lg border border-[#2D6A4F]/80 bg-white/55 px-5 py-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white/75"
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
          className="heart-button liked"
          aria-label="Remove from bookmarks"
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

      <div className="mt-4 flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1A1A18]/45">
          Status
        </span>
        <select
          value={status}
          onChange={(event) => onUpdateBookmarkStatus?.(issue, event.target.value)}
          className="h-9 rounded-md border border-[#1A1A18]/15 bg-white/70 px-3 text-sm font-semibold text-[#1A1A18]/75 outline-none transition focus:border-[#2D6A4F]"
        >
          <option value="planned">Planned</option>
          <option value="submitted">Submitted</option>
          <option value="merged">Merged</option>
        </select>
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

export default BookmarkPage
