import { useState } from 'react'
import {
  GitBranch,
  GitPullRequest,
  GitMerge,
  Clock,
  Flame,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Sparkles,
  ChevronRight,
  Code2,
} from 'lucide-react'

export const CONTRIBUTION_STAGES = [
  { id: 'planned', label: 'Planned', desc: 'Saved to roadmap', icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'branch_created', label: 'Branch Created', desc: 'Branch initialized', icon: GitBranch, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'in_progress', label: 'Still Working', desc: 'Actively coding', icon: Flame, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'pr_created', label: 'PR Generated', desc: 'In maintainer review', icon: GitPullRequest, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { id: 'merged', label: 'PR Merged', desc: 'Merged upstream', icon: GitMerge, color: 'text-[#2D6A4F] bg-[#2D6A4F]/10 border-[#2D6A4F]/25' },
]

function BookmarkPage({
  bookmarks = [],
  onNavigate,
  onToggleBookmark,
  onUpdateBookmarkStatus,
  onSyncPullRequestStatus,
}) {
  const [filterTab, setFilterTab] = useState('all')

  const stageCounts = {
    all: bookmarks.length,
    working: bookmarks.filter(b => b.bookmarkStatus === 'branch_created' || b.bookmarkStatus === 'in_progress').length,
    review: bookmarks.filter(b => b.bookmarkStatus === 'pr_created' || b.bookmarkStatus === 'submitted').length,
    merged: bookmarks.filter(b => b.bookmarkStatus === 'merged' || b.bookmarkStatus === 'completed').length,
    planned: bookmarks.filter(b => !b.bookmarkStatus || b.bookmarkStatus === 'planned').length,
  }

  const filteredBookmarks = bookmarks.filter(b => {
    const s = b.bookmarkStatus || 'planned'
    if (filterTab === 'working') return s === 'branch_created' || s === 'in_progress'
    if (filterTab === 'review') return s === 'pr_created' || s === 'submitted'
    if (filterTab === 'merged') return s === 'merged' || s === 'completed'
    if (filterTab === 'planned') return s === 'planned'
    return true
  })

  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#1A1A18] antialiased">
      {/* Top Navbar */}
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
              onClick={() => onNavigate('works')}
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

      <section className="mx-auto w-full max-w-6xl border-x border-[#1A1A18]/10 px-6 py-8 sm:px-8 space-y-6">
        {/* Header Banner */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="[font-family:Georgia,serif] text-3xl font-normal tracking-normal sm:text-4xl">
                Contribution Roadmap
              </h1>
              <span className="rounded-full bg-[#2D6A4F]/10 px-2.5 py-0.5 text-xs font-bold text-[#2D6A4F]">
                {bookmarks.length}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-[#1A1A18]/70">
              Track your complete workflow from local git branch to active coding, PR review, and merged contributions.
            </p>
          </div>

          {/* Quick Profile Link */}
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#1A1A18]/10 bg-white/70 px-3.5 py-2 text-xs font-semibold text-[#1A1A18]/75 shadow-2xs transition hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
          >
            <span>View in Profile Passport</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-[#1A1A18]/8">
          {[
            { id: 'all', label: 'All Issues', count: stageCounts.all },
            { id: 'working', label: 'Still Working / Branches', count: stageCounts.working },
            { id: 'review', label: 'In Review / PRs', count: stageCounts.review },
            { id: 'merged', label: 'Merged Upstream', count: stageCounts.merged },
            { id: 'planned', label: 'Planned Backlog', count: stageCounts.planned },
          ].map((tab) => {
            const active = filterTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                  active
                    ? 'bg-[#2D6A4F] text-white shadow-2xs'
                    : 'text-[#1A1A18]/65 hover:bg-white/60 hover:text-[#1A1A18]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-[#1A1A18]/8 text-[#1A1A18]/60'
                }`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Issue Cards */}
        <div className="space-y-5 pb-12">
          {filteredBookmarks.map((issue, index) => (
            <BookmarkContributionCard
              key={getIssueId(issue)}
              issue={issue}
              index={index}
              onToggleBookmark={onToggleBookmark}
              onUpdateBookmarkStatus={onUpdateBookmarkStatus}
              onSyncPullRequestStatus={onSyncPullRequestStatus}
            />
          ))}

          {filteredBookmarks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#1A1A18]/15 bg-white/45 px-5 py-12 text-center">
              <h2 className="[font-family:Georgia,serif] text-xl font-bold text-[#1A1A18]">
                {filterTab === 'all' ? 'No saved issues yet.' : 'No issues found in this stage.'}
              </h2>
              <p className="mt-1 text-xs font-medium text-[#1A1A18]/60 max-w-sm mx-auto">
                {filterTab === 'all'
                  ? 'Tap the bookmark icon on any issue in the discovery feed to track it here.'
                  : 'Change your filter tab or update an issue stage above to see items here.'}
              </p>
              {filterTab === 'all' && (
                <button
                  type="button"
                  onClick={() => onNavigate('feed')}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#2D6A4F] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#24583F]"
                >
                  Browse Discovery Feed
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function BookmarkContributionCard({
  issue,
  index,
  onToggleBookmark,
  onUpdateBookmarkStatus,
  onSyncPullRequestStatus,
}) {
  const score = getIssueScore(issue)
  const labels = issue.labels?.slice(0, 3) || []
  const language = issue.repo?.language || issue.stacks?.[0] || 'open source'
  
  // Normalize status
  const rawStatus = issue.bookmarkStatus || 'planned'
  const currentStatus = rawStatus === 'submitted' ? 'pr_created' : (rawStatus === 'completed' ? 'merged' : rawStatus)

  // Local state for interactive editing of branch & PR URL
  const [branchInput, setBranchInput] = useState(issue.branchName || '')
  const [prUrlInput, setPrUrlInput] = useState(issue.pullRequestUrl || '')
  const [copiedCmd, setCopiedCmd] = useState(false)
  const [syncingPr, setSyncingPr] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState('')

  // Map stage to index for progress bar
  const stageIndex = CONTRIBUTION_STAGES.findIndex(s => s.id === currentStatus)
  const progressPercent = Math.max(10, Math.round(((stageIndex + 1) / CONTRIBUTION_STAGES.length) * 100))

  const activeStage = CONTRIBUTION_STAGES[stageIndex] || CONTRIBUTION_STAGES[0]
  const IconComponent = activeStage.icon

  // Copy git command
  function copyGitBranch() {
    const branch = branchInput.trim() || `fix/${issue.repo?.name?.split('/')?.[1] || 'issue'}-${issue.number || 'patch'}`
    navigator.clipboard?.writeText(`git checkout -b ${branch}`)
    setCopiedCmd(true)
    setTimeout(() => setCopiedCmd(false), 2000)
  }

  // Handle stage selection
  function handleSelectStage(stageId) {
    onUpdateBookmarkStatus?.(issue, stageId, {
      branchName: branchInput.trim(),
      pullRequestUrl: prUrlInput.trim(),
    })
  }

  // Handle saving branch or PR details
  function handleSaveMetadata() {
    onUpdateBookmarkStatus?.(issue, currentStatus, {
      branchName: branchInput.trim(),
      pullRequestUrl: prUrlInput.trim(),
    })
  }

  // Live GitHub PR Sync
  async function handleCheckPrStatus() {
    if (!prUrlInput.trim() && !issue.pullRequestUrl) {
      setSyncFeedback('Please paste your Pull Request URL first')
      return
    }
    setSyncingPr(true)
    setSyncFeedback('')

    const result = await onSyncPullRequestStatus?.(issue, prUrlInput.trim() || issue.pullRequestUrl)
    setSyncingPr(false)

    if (result?.success) {
      if (result.isMerged) {
        setSyncFeedback('Verified Merged on GitHub!')
      } else if (result.isOpen) {
        setSyncFeedback(`Live on GitHub (${result.state}) — In Review`)
      } else {
        setSyncFeedback(`PR Status: ${result.state}`)
      }
    } else {
      setSyncFeedback(result?.error || 'Could not verify PR on GitHub')
    }
  }

  return (
    <article
      className="feed-card rounded-2xl border border-[#1A1A18]/10 bg-white/75 p-5 shadow-xs transition hover:border-[#2D6A4F]/40 hover:bg-white"
      style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}
    >
      {/* Top Header Row */}
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#1A1A18]/60">
          <span className="rounded-md bg-[#1A1A18]/5 px-2 py-0.5 font-mono text-[11px] text-[#1A1A18]/80">
            {issue.repo?.name || 'open-source-repo'}
          </span>
          <span>•</span>
          <span className="capitalize">{language}</span>
          {issue.number && (
            <>
              <span>•</span>
              <span className="text-[#1A1A18]/45">#{issue.number}</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => onToggleBookmark(issue)}
          className="heart-button liked group/btn flex items-center gap-1 text-xs font-semibold text-[#2D6A4F] hover:text-red-600 transition"
          aria-label="Remove from bookmarks"
          title="Remove from tracked roadmap"
        >
          <span className="text-base leading-none">♥</span>
          <span className="text-[11px] text-[#1A1A18]/45 group-hover/btn:text-red-500">Tracked</span>
        </button>
      </div>

      {/* Issue Title */}
      <a
        href={issue.html_url}
        target="_blank"
        rel="noreferrer"
        className="group/link flex items-start gap-1.5 text-base sm:text-lg font-bold leading-snug text-[#1A1A18] transition hover:text-[#2D6A4F]"
      >
        <span className="line-clamp-2">{issue.title}</span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover/link:opacity-100 transition mt-1" />
      </a>

      {/* Labels & Fit */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label) => (
            <span
              key={label}
              className="rounded-lg bg-[#2D6A4F]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#2D6A4F]"
            >
              {label}
            </span>
          ))}
          <span className="rounded-lg bg-[#1A1A18]/5 px-2.5 py-0.5 text-[11px] font-semibold text-[#1A1A18]/60 capitalize">
            {issue.complexity || 'beginner'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#1A1A18]/70">
          <span className="text-[11px] text-[#1A1A18]/45">AI Fit:</span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#2D6A4F]/10">
            <div
              className="h-full rounded-full bg-[#2D6A4F]"
              style={{ width: `${score * 10}%` }}
            />
          </div>
          <span className="text-[#2D6A4F] font-bold">{score}/10</span>
        </div>
      </div>

      {/* ================================================================ */}
      {/* CONTRIBUTION LIFECYCLE STEPPER                                   */}
      {/* ================================================================ */}
      <div className="mt-5 rounded-2xl border border-[#1A1A18]/8 bg-[#FAF8F5] p-3.5 sm:p-4">
        {/* Stepper Status Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-lg border ${activeStage.color}`}>
              <IconComponent className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1A1A18]">
                Stage: {activeStage.label}
              </span>
              <span className="hidden sm:inline text-xs text-[#1A1A18]/50 ml-2">
                — {activeStage.desc}
              </span>
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold text-[#2D6A4F]">
            {progressPercent}% Complete
          </span>
        </div>

        {/* Visual Progress Bar Line */}
        <div className="relative mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[#1A1A18]/8">
          <div
            className="h-full rounded-full bg-[#2D6A4F] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 5-Stage Stepper Buttons */}
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
          {CONTRIBUTION_STAGES.map((s, idx) => {
            const isCurrent = currentStatus === s.id
            const isPassed = idx <= stageIndex
            const StageIcon = s.icon

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectStage(s.id)}
                className={`group/step relative flex flex-col items-center justify-center rounded-xl p-1.5 sm:p-2 text-center transition-all ${
                  isCurrent
                    ? 'bg-white shadow-xs border border-[#2D6A4F] text-[#2D6A4F] ring-1 ring-[#2D6A4F]/20'
                    : isPassed
                    ? 'bg-white/80 text-[#2D6A4F] hover:bg-white border border-[#1A1A18]/10'
                    : 'bg-transparent text-[#1A1A18]/45 hover:bg-white/50 hover:text-[#1A1A18]/70 border border-transparent'
                }`}
                title={`Click to mark as ${s.label}`}
              >
                <div className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg mb-1 transition ${
                  isCurrent ? 'bg-[#2D6A4F] text-white' : isPassed ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]' : 'bg-[#1A1A18]/5 text-[#1A1A18]/40'
                }`}>
                  <StageIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-tight truncate w-full">
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* ================================================================ */}
        {/* CONTEXTUAL LIFECYCLE ACTION DOCK                                 */}
        {/* ================================================================ */}
        <div className="mt-3.5 pt-3 border-t border-[#1A1A18]/8">
          {/* STAGE: BRANCH CREATED or IN PROGRESS */}
          {(currentStatus === 'branch_created' || currentStatus === 'in_progress') && (
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1A1A18]">
                  <GitBranch className="h-3.5 w-3.5 text-blue-600" />
                  <span>Working Git Branch</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyGitBranch}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#1A1A18]/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1A1A18]/75 shadow-2xs hover:bg-[#FAF8F5] transition"
                  >
                    {copiedCmd ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedCmd ? 'Copied checkout cmd!' : 'Copy git checkout'}</span>
                  </button>
                  {issue.repo?.name && (
                    <a
                      href={`https://github.com/${issue.repo.name}/compare`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-[#2D6A4F] px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs hover:bg-[#24583F] transition"
                    >
                      <span>Create PR</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={branchInput}
                    onChange={(e) => setBranchInput(e.target.value)}
                    placeholder="e.g. fix/navbar-overflow or feat/dark-mode"
                    className="w-full rounded-xl border border-[#1A1A18]/15 bg-white px-3 py-1.5 text-xs font-mono text-[#1A1A18] placeholder:text-[#1A1A18]/35 outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveMetadata}
                  className="rounded-xl border border-[#1A1A18]/15 bg-white px-3 py-1.5 text-xs font-bold text-[#1A1A18]/75 hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* STAGE: PR GENERATED (IN REVIEW) */}
          {currentStatus === 'pr_created' && (
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-800">
                  <GitPullRequest className="h-3.5 w-3.5 text-purple-600" />
                  <span>Pull Request URL</span>
                </div>
                <button
                  type="button"
                  onClick={handleCheckPrStatus}
                  disabled={syncingPr}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1 text-[11px] font-semibold text-white shadow-2xs hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {syncingPr ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  <span>{syncingPr ? 'Verifying on GitHub...' : 'Check PR Status on GitHub'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={prUrlInput}
                  onChange={(e) => setPrUrlInput(e.target.value)}
                  placeholder="https://github.com/owner/repo/pull/123"
                  className="w-full rounded-xl border border-[#1A1A18]/15 bg-white px-3 py-1.5 text-xs text-[#1A1A18] placeholder:text-[#1A1A18]/35 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/20"
                />
                <button
                  type="button"
                  onClick={handleSaveMetadata}
                  className="rounded-xl border border-[#1A1A18]/15 bg-white px-3 py-1.5 text-xs font-bold text-[#1A1A18]/75 hover:border-purple-600 hover:text-purple-600 transition"
                >
                  Save
                </button>
              </div>

              {syncFeedback && (
                <div className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-900 border border-purple-200">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  <span>{syncFeedback}</span>
                </div>
              )}
            </div>
          )}

          {/* STAGE: PR MERGED */}
          {currentStatus === 'merged' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-emerald-500/10 p-2.5 border border-emerald-600/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2D6A4F]" />
                <div>
                  <p className="text-xs font-bold text-[#2D6A4F]">
                    Pull Request Successfully Merged!
                  </p>
                  <p className="text-[11px] text-[#1A1A18]/60">
                    This contribution is counted toward your live verified profile milestones and Stack DNA.
                  </p>
                </div>
              </div>

              {prUrlInput && (
                <a
                  href={prUrlInput}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-[#2D6A4F] px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs hover:bg-[#24583F] transition shrink-0"
                >
                  <span>View Merged PR</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          )}

          {/* STAGE: PLANNED */}
          {currentStatus === 'planned' && (
            <div className="flex items-center justify-between text-xs text-[#1A1A18]/55">
              <span>Ready to start? Create a branch to begin actively coding.</span>
              <button
                type="button"
                onClick={() => handleSelectStage('branch_created')}
                className="inline-flex items-center gap-1 rounded-lg border border-[#1A1A18]/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1A1A18]/75 hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition"
              >
                <GitBranch className="h-3 w-3 text-blue-600" />
                <span>Start Branch</span>
              </button>
            </div>
          )}
        </div>
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
  return issue._id || issue.github_id || issue.id
}

export default BookmarkPage
