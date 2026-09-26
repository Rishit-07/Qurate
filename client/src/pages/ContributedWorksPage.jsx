import { useState, useMemo } from 'react'
import {
  GitMerge,
  GitPullRequest,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  GitBranch,
  RefreshCw,
  Loader2,
  Share2,
  ChevronRight,
  Code2,
  Calendar,
  Check,
} from 'lucide-react'

function ContributedWorksPage({
  bookmarks = [],
  onNavigate,
  onSyncPullRequestStatus,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [copiedId, setCopiedId] = useState(null)
  const [syncingId, setSyncingId] = useState(null)
  const [syncNotes, setSyncNotes] = useState({})

  // Only include items where a PR has been created or merged
  const contributedItems = useMemo(() => {
    return bookmarks.filter((b) => {
      const s = b.bookmarkStatus || ''
      return (
        s === 'merged' ||
        s === 'completed' ||
        s === 'pr_created' ||
        s === 'submitted' ||
        Boolean(b.pullRequestUrl)
      )
    })
  }, [bookmarks])

  // Compute summary metrics
  const metrics = useMemo(() => {
    const merged = contributedItems.filter(
      (b) => b.bookmarkStatus === 'merged' || b.bookmarkStatus === 'completed'
    ).length
    const inReview = contributedItems.filter(
      (b) => b.bookmarkStatus === 'pr_created' || b.bookmarkStatus === 'submitted'
    ).length
    const repoSet = new Set(contributedItems.map((b) => b.repo?.name).filter(Boolean))

    return {
      total: contributedItems.length,
      merged,
      inReview,
      reposCount: repoSet.size,
    }
  }, [contributedItems])

  // Filtered list based on search and status tabs
  const filteredList = useMemo(() => {
    return contributedItems.filter((item) => {
      const s = item.bookmarkStatus || 'planned'
      const matchesFilter =
        statusFilter === 'all' ||
        (statusFilter === 'merged' && (s === 'merged' || s === 'completed')) ||
        (statusFilter === 'review' && (s === 'pr_created' || s === 'submitted'))

      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (item.title || '').toLowerCase().includes(q) ||
        (item.repo?.name || '').toLowerCase().includes(q) ||
        (item.branchName || '').toLowerCase().includes(q)

      return matchesFilter && matchesSearch
    })
  }, [contributedItems, statusFilter, searchQuery])

  // Copy PR link
  function handleCopyPRLink(item) {
    const link = item.pullRequestUrl || item.html_url || window.location.href
    navigator.clipboard?.writeText(link)
    setCopiedId(item._id || item.github_id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Live PR check
  async function handleSyncPR(item) {
    const id = item._id || item.github_id
    setSyncingId(id)
    const res = await onSyncPullRequestStatus?.(item, item.pullRequestUrl)
    setSyncingId(null)
    if (res?.success) {
      setSyncNotes((prev) => ({
        ...prev,
        [id]: res.isMerged ? 'Verified Merged on GitHub!' : `PR is currently ${res.state}`,
      }))
    } else {
      setSyncNotes((prev) => ({
        ...prev,
        [id]: res?.error || 'Could not verify PR on GitHub',
      }))
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#1A1A18] antialiased">
      {/* Sticky Navigation Bar */}
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
            <button
              onClick={() => onNavigate('bookmarks')}
              className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]"
            >
              Bookmarks
            </button>
            <button className="font-bold text-[#1A1A18]">Contributed Works</button>
            <button
              onClick={() => onNavigate('profile')}
              className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]"
            >
              Profile
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto w-full max-w-6xl border-x border-[#1A1A18]/10 px-6 py-8 sm:px-8 space-y-6">
        {/* Header Hero */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="[font-family:Georgia,serif] text-3xl font-bold tracking-tight text-[#1A1A18] sm:text-4xl">
                Contributed Works
              </h1>
              <span className="rounded-full bg-[#2D6A4F]/10 px-2.5 py-0.5 text-xs font-bold text-[#2D6A4F]">
                {metrics.total}
              </span>
            </div>
            <p className="mt-1.5 text-sm font-medium text-[#1A1A18]/65 max-w-2xl">
              Your verified open-source contributions portfolio. Displays pull requests you have generated, submitted for review, and successfully merged upstream.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#1A1A18]/10 bg-white/70 px-4 py-2 text-xs font-semibold text-[#1A1A18]/75 shadow-2xs transition hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
          >
            <span>View Public Passport</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Highlight Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1A1A18]/8 rounded-2xl border border-[#1A1A18]/10 bg-white/80 backdrop-blur-xl shadow-xs overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/60 transition">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F]">
              <GitMerge className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="[font-family:Georgia,serif] text-xl font-bold leading-none text-[#2D6A4F]">
                {metrics.merged}
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A18]/50 mt-0.5">
                Merged PRs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/60 transition">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <GitPullRequest className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="[font-family:Georgia,serif] text-xl font-bold leading-none text-purple-700">
                {metrics.inReview}
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A18]/50 mt-0.5">
                In Review
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/60 transition">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Code2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="[font-family:Georgia,serif] text-xl font-bold leading-none text-blue-700">
                {metrics.reposCount}
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A18]/50 mt-0.5">
                Repositories Touched
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/60 transition">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F]">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="[font-family:Georgia,serif] text-xl font-bold leading-none text-[#2D6A4F]">
                100%
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A18]/50 mt-0.5">
                Verified Code
              </p>
            </div>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: 'All Works', count: metrics.total },
              { id: 'merged', label: 'Merged Upstream', count: metrics.merged },
              { id: 'review', label: 'In Review / Open PRs', count: metrics.inReview },
            ].map((tab) => {
              const active = statusFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                    active
                      ? 'bg-[#2D6A4F] text-white shadow-2xs'
                      : 'text-[#1A1A18]/65 hover:bg-white/60 hover:text-[#1A1A18]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-[#1A1A18]/8 text-[#1A1A18]/60'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#1A1A18]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repository or PR title..."
              className="w-full rounded-xl border border-[#1A1A18]/15 bg-white/70 pl-8 pr-3 py-1.5 text-xs text-[#1A1A18] placeholder:text-[#1A1A18]/40 outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]/20"
            />
          </div>
        </div>

        {/* Works List */}
        <div className="space-y-4 pb-12">
          {filteredList.map((item, index) => {
            const id = item._id || item.github_id
            const isMerged =
              item.bookmarkStatus === 'merged' || item.bookmarkStatus === 'completed'
            const isSyncing = syncingId === id

            return (
              <article
                key={id}
                className="feed-card rounded-2xl border border-[#1A1A18]/10 bg-white/80 p-5 shadow-xs transition hover:border-[#2D6A4F]/40 hover:bg-white"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    {/* Top Tag Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[#1A1A18]/5 px-2 py-0.5 font-mono text-[11px] font-bold text-[#1A1A18]/70">
                        {item.repo?.name || 'open-source'}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isMerged
                            ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/25'
                            : 'bg-purple-100 text-purple-800 border-purple-200'
                        }`}
                      >
                        {isMerged ? (
                          <>
                            <GitMerge className="h-3 w-3" />
                            <span>Merged Upstream</span>
                          </>
                        ) : (
                          <>
                            <GitPullRequest className="h-3 w-3" />
                            <span>PR Generated • In Review</span>
                          </>
                        )}
                      </span>

                      {item.branchName && (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          <GitBranch className="h-2.5 w-2.5" />
                          <span>{item.branchName}</span>
                        </span>
                      )}
                    </div>

                    {/* PR Title */}
                    <h3 className="text-base sm:text-lg font-bold text-[#1A1A18] leading-snug">
                      {item.title}
                    </h3>

                    {/* GitHub Link & Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#1A1A18]/60 pt-1">
                      {item.pullRequestUrl && (
                        <a
                          href={item.pullRequestUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#2D6A4F] hover:underline"
                        >
                          <GitPullRequest className="h-3.5 w-3.5" />
                          <span>
                            {item.prNumber ? `View Pull Request #${item.prNumber}` : 'View PR on GitHub'}
                          </span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}

                      {item.html_url && item.html_url !== item.pullRequestUrl && (
                        <a
                          href={item.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#1A1A18]/50 hover:text-[#1A1A18] hover:underline"
                        >
                          <span>Original Issue</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1 sm:pt-0">
                    {/* Live Sync with GitHub */}
                    {item.pullRequestUrl && (
                      <button
                        type="button"
                        onClick={() => handleSyncPR(item)}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-1 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition shadow-2xs"
                      >
                        {isSyncing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        <span>{isSyncing ? 'Syncing...' : 'Sync PR Status'}</span>
                      </button>
                    )}

                    {/* Copy Link */}
                    <button
                      type="button"
                      onClick={() => handleCopyPRLink(item)}
                      className="inline-flex items-center gap-1 rounded-xl border border-[#1A1A18]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A18]/70 hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition shadow-2xs"
                    >
                      {copiedId === id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedId === id ? 'Copied Link!' : 'Share PR'}</span>
                    </button>
                  </div>
                </div>

                {syncNotes[id] && (
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{syncNotes[id]}</span>
                  </div>
                )}
              </article>
            )
          })}

          {filteredList.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#1A1A18]/15 bg-white/45 px-6 py-14 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F]">
                <GitPullRequest className="h-6 w-6" />
              </div>
              <h2 className="[font-family:Georgia,serif] text-xl font-bold text-[#1A1A18]">
                {contributedItems.length === 0
                  ? 'No Contributed Works Yet'
                  : 'No Contributions Match Your Filter'}
              </h2>
              <p className="mt-1 text-xs font-medium text-[#1A1A18]/60 max-w-sm mx-auto">
                {contributedItems.length === 0
                  ? 'When you generate a pull request or merge a contribution from your bookmarks, it will automatically be featured here in your portfolio.'
                  : 'Try clearing your search query or switching to All Works.'}
              </p>

              {contributedItems.length === 0 && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate('feed')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#2D6A4F] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#24583F]"
                  >
                    Find Issues on Feed
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('bookmarks')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#1A1A18]/15 bg-white px-4 py-2 text-xs font-bold text-[#1A1A18] transition hover:border-[#2D6A4F]"
                  >
                    View Roadmap
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default ContributedWorksPage
