import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Camera,
  User,
  Mail,
  ExternalLink,
  GitMerge,
  GitPullRequest,
  Clock,
  Code2,
  ShieldCheck,
  Check,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react'

const RAW_API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '')
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, '')

const STACK_OPTIONS = [
  'React', 'Node.js', 'Python', 'Vue', 'MongoDB',
  'TypeScript', 'Express', 'PostgreSQL', 'Docker', 'GraphQL',
  'Next.js', 'Tailwind', 'Redis', 'Go', 'Rust',
]

// ── Heatmap cell colour based on contribution count ─────────────────────────
function getCellColour(count) {
  if (count === 0)  return '#E4DFD4'
  if (count <= 2)   return 'rgba(45,106,79,0.22)'
  if (count <= 5)   return 'rgba(45,106,79,0.48)'
  if (count <= 9)   return 'rgba(45,106,79,0.74)'
  return '#2D6A4F'
}

function formatFullDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('T')[0].split('-').map(Number)
  if (parts.length === 3) {
    const [y, m, d] = parts
    const dt = new Date(y, m - 1, d)
    return dt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ContributionHeatmap({ days, total, selectedDay, onSelectDay }) {
  if (!days?.length) return null

  const monthLabels = []
  let lastMonth = -1
  const totalWeeks = Math.ceil(days.length / 7)

  for (let w = 0; w < totalWeeks; w++) {
    const day = days[w * 7]
    if (!day) continue
    const parts = day.date.split('T')[0].split('-').map(Number)
    const m = parts[1] - 1
    if (m !== lastMonth) {
      const dt = new Date(parts[0], m, parts[2] || 1)
      monthLabels.push({
        label: dt.toLocaleString('default', { month: 'short' }),
        left: w * 14,
      })
      lastMonth = m
    }
  }

  return (
    <div className="w-full">
      {/* Scroll container that wraps BOTH month labels and the grid */}
      <div className="overflow-x-auto pb-2">
        <div style={{ width: 'max-content' }} className="pr-6">
          {/* Month labels container, aligned 1:1 with columns */}
          <div className="relative mb-1.5 h-4 select-none">
            {monthLabels.map((m, i) => (
              <span
                key={i}
                style={{ left: m.left }}
                className="absolute text-[10px] font-semibold uppercase tracking-wider text-[#1A1A18]/45"
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid of days */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: 'repeat(7, 11px)',
              gridAutoFlow: 'column',
              gridAutoColumns: '11px',
              gap: '3px',
            }}
          >
            {days.map((day, i) => {
              const isSelected = selectedDay?.date === day.date
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectDay?.(isSelected ? null : day)}
                  title={`${day.date}: ${day.contributionCount} contribution${day.contributionCount !== 1 ? 's' : ''} (Click to view)`}
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 2,
                    background: getCellColour(day.contributionCount),
                    cursor: 'pointer',
                    transition: 'all 0.12s ease-in-out',
                    outline: isSelected ? '2px solid #2D6A4F' : 'none',
                    outlineOffset: 1,
                    transform: isSelected ? 'scale(1.3)' : 'none',
                    zIndex: isSelected ? 10 : 1,
                  }}
                  className="hover:opacity-75 focus:outline-none"
                />
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#1A1A18]/5 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#1A1A18]/60">
            {total?.toLocaleString()} contributions in the last year
          </span>
          <span className="text-[11px] text-[#1A1A18]/40">• Click any square to view day's activity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-[#1A1A18]/40">Less</span>
          {[0, 2, 5, 9, 12].map((n, i) => (
            <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: getCellColour(n) }} />
          ))}
          <span className="text-[10px] font-semibold text-[#1A1A18]/40">More</span>
        </div>
      </div>
    </div>
  )
}

function formatMonthKey(dateValue) {
  const date = new Date(dateValue)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

function groupContributionItems(items) {
  const monthGroups = new Map()

  for (const item of items) {
    const dateKey = item.date || item.createdAt || new Date().toISOString()
    const monthKey = formatMonthKey(dateKey)
    if (!monthGroups.has(monthKey)) monthGroups.set(monthKey, [])
    monthGroups.get(monthKey).push(item)
  }

  return Array.from(monthGroups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, monthItems]) => ({
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      items: groupByGithubType(monthItems.sort((a, b) => new Date(b.date) - new Date(a.date))),
    }))
}

function groupByGithubType(items) {
  const grouped = []

  for (const item of items) {
    const type = item.source === 'github' ? item.type : 'tracked'
    const repoName = item.repoName || 'Unknown repository'
    const key = item.source === 'github' ? `${type}::${monthSafeTitle(item.title)}::${repoName}` : `tracked::${item.issueTitle}::${repoName}`
    let bucket = grouped.find(entry => entry.key === key)

    if (!bucket) {
      bucket = {
        key,
        source: item.source || 'tracked',
        type,
        title: item.source === 'github' ? item.title : item.issueTitle,
        repoNames: new Set([repoName]),
        count: 1,
        commitCount: item.commitCount || 0,
        recentChange: item.recentChange || item.issueTitle || item.title || '',
        items: [item],
        date: item.date,
        pullRequestUrl: item.pullRequestUrl,
      }
      grouped.push(bucket)
    } else {
      bucket.count += 1
      bucket.repoNames.add(repoName)
      bucket.items.push(item)
      bucket.commitCount += item.commitCount || 0
      if (item.recentChange && new Date(item.date) >= new Date(bucket.date)) bucket.recentChange = item.recentChange
      if (!bucket.pullRequestUrl && item.pullRequestUrl) bucket.pullRequestUrl = item.pullRequestUrl
      if (new Date(item.date) > new Date(bucket.date)) bucket.date = item.date
    }
  }

  return grouped
}

function monthSafeTitle(title) {
  return String(title || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function pluralize(word, count) {
  return count === 1 ? word : `${word}s`
}

function getGithubGroupTitle(group) {
  const repoCount = group.repoNames.size
  const itemCount = group.count

  switch (group.type) {
    case 'push':
      return `${group.commitCount || itemCount} ${pluralize('commit', group.commitCount || itemCount)} pushed in ${repoCount} ${pluralize('repository', repoCount)}`
    case 'create':
      return `Created ${itemCount} ${pluralize('repository', itemCount)}`
    case 'pull_request':
      return `Opened ${itemCount} ${pluralize('pull request', itemCount)} in ${repoCount} ${pluralize('repository', repoCount)}`
    case 'issue':
      return `Opened ${itemCount} ${pluralize('issue', itemCount)} in ${repoCount} ${pluralize('repository', repoCount)}`
    case 'watch':
      return `Watched ${itemCount} ${pluralize('repository', itemCount)}`
    default:
      return group.title || 'GitHub activity'
  }
}

function getGithubGroupIcon(group) {
  switch (group.type) {
    case 'push': return '⇪'
    case 'create': return '◫'
    case 'pull_request': return '↗'
    case 'issue': return '!' 
    case 'watch': return '◔'
    default: return '•'
  }
}

function getGithubRecentChange(group) {
  if (group.type === 'push' && group.recentChange) {
    return `Latest commit: ${group.recentChange}`
  }

  if (group.recentChange) {
    return `Most recent change: ${group.recentChange}`
  }

  return ''
}
function GithubCommitBlock({ totalCommits, repos = [], isDayView = false }) {
  if (!repos || repos.length === 0 || totalCommits === 0) return null

  const maxCommits = Math.max(...repos.map(r => r.commits || 1), 1)
  const repoCount = repos.length

  return (
    <div className="relative pl-6 sm:pl-8">
      {/* GitHub timeline node icon */}
      <div className="absolute -left-3 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#1F2328] text-white shadow-sm ring-4 ring-[#F7F5F0]">
        <svg aria-hidden="true" height="13" viewBox="0 0 16 16" version="1.1" width="13" fill="currentColor">
          <path d="M10.5 7.75a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm1.43.75a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 1 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 1 1 0 1.5h-3.32Z" />
        </svg>
      </div>

      <div className="rounded-xl border border-[#1A1A18]/10 bg-white/75 p-4 shadow-sm transition hover:shadow">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm sm:text-base font-bold text-[#1A1A18]">
            Created {totalCommits} {totalCommits === 1 ? 'commit' : 'commits'} in {repoCount} {repoCount === 1 ? 'repository' : 'repositories'}
          </h4>
          <span className="shrink-0 rounded-full bg-[#2D6A4F]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#2D6A4F]">
            Verified
          </span>
        </div>

        {/* Repositories list with GitHub proportional bars */}
        <div className="mt-3.5 space-y-2.5">
          {repos.map((repo) => {
            const commits = repo.commits || 0
            const pct = Math.max(6, Math.round((commits / maxCommits) * 100))
            return (
              <div key={repo.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 py-1 border-b border-[#1A1A18]/5 last:border-b-0">
                <div className="flex min-w-0 items-center gap-2">
                  <a
                    href={repo.url || `https://github.com/${repo.name}`}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-xs sm:text-sm font-semibold text-[#0969da] hover:underline"
                  >
                    {repo.name}
                  </a>
                  <span className="shrink-0 text-xs font-normal text-[#1A1A18]/55">
                    {commits} {commits === 1 ? 'commit' : 'commits'}
                  </span>
                </div>
                <div className="flex w-full sm:w-44 md:w-56 shrink-0 items-center">
                  <div className="h-2 w-full rounded-full bg-[#1A1A18]/8 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#2D6A4F] transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function GithubPrBlock({ pullRequests = [] }) {
  if (!pullRequests || pullRequests.length === 0) return null
  const repoSet = new Set(pullRequests.map(p => p.repoName).filter(Boolean))
  const repoCount = repoSet.size || 1

  return (
    <div className="relative pl-6 sm:pl-8 mt-4">
      <div className="absolute -left-3 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#8250DF] text-white shadow-sm ring-4 ring-[#F7F5F0]">
        <svg aria-hidden="true" height="13" viewBox="0 0 16 16" version="1.1" width="13" fill="currentColor">
          <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.5 5.396l2.323-2.323a.75.75 0 0 1 1.06 1.06l-2.853 2.854a.75.75 0 0 1-1.06 0L6.116 4.134a.75.75 0 1 1 1.061-1.06ZM3 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm0 9.5a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm11.5-7.25a2.25 2.25 0 1 0-3 2.122V8.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 0 0 1.5h1.5A2.25 2.25 0 0 0 14.5 8.5V7.622a2.25 2.25 0 0 0 0-2.122ZM13 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
      </div>

      <div className="rounded-xl border border-[#1A1A18]/10 bg-white/75 p-4 shadow-sm">
        <h4 className="text-sm sm:text-base font-bold text-[#1A1A18]">
          Opened {pullRequests.length} pull {pullRequests.length === 1 ? 'request' : 'requests'} in {repoCount} {repoCount === 1 ? 'repository' : 'repositories'}
        </h4>
        <div className="mt-3 space-y-2">
          {pullRequests.map((pr, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  pr.state === 'MERGED' ? 'bg-purple-100 text-purple-800' : pr.state === 'CLOSED' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {pr.state}
                </span>
                <a href={pr.url} target="_blank" rel="noreferrer" className="truncate font-medium text-[#1A1A18] hover:text-[#2D6A4F] hover:underline">
                  {pr.title}
                </a>
              </div>
              <span className="shrink-0 text-xs text-[#1A1A18]/50 truncate max-w-[120px] sm:max-w-none">
                {pr.repoName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GithubIssueBlock({ issues = [] }) {
  if (!issues || issues.length === 0) return null
  const repoSet = new Set(issues.map(i => i.repoName).filter(Boolean))
  const repoCount = repoSet.size || 1

  return (
    <div className="relative pl-6 sm:pl-8 mt-4">
      <div className="absolute -left-3 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#1F2328] text-white shadow-sm ring-4 ring-[#F7F5F0]">
        <svg aria-hidden="true" height="13" viewBox="0 0 16 16" version="1.1" width="13" fill="currentColor">
          <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
        </svg>
      </div>

      <div className="rounded-xl border border-[#1A1A18]/10 bg-white/75 p-4 shadow-sm">
        <h4 className="text-sm sm:text-base font-bold text-[#1A1A18]">
          Opened {issues.length} {issues.length === 1 ? 'issue' : 'issues'} in {repoCount} {repoCount === 1 ? 'repository' : 'repositories'}
        </h4>
        <div className="mt-3 space-y-2">
          {issues.map((iss, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  iss.state === 'CLOSED' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {iss.state}
                </span>
                <a href={iss.url} target="_blank" rel="noreferrer" className="truncate font-medium text-[#1A1A18] hover:text-[#2D6A4F] hover:underline">
                  {iss.title}
                </a>
              </div>
              <span className="shrink-0 text-xs text-[#1A1A18]/50 truncate max-w-[120px] sm:max-w-none">
                {iss.repoName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TrackedActivityBlock({ items = [] }) {
  if (!items || items.length === 0) return null

  return (
    <div className="relative pl-6 sm:pl-8 mt-4">
      <div className="absolute -left-3 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#2D6A4F] text-white shadow-sm ring-4 ring-[#F7F5F0]">
        <span className="text-[11px] font-bold">✓</span>
      </div>

      <div className="rounded-xl border border-[#2D6A4F]/20 bg-white/75 p-4 shadow-sm">
        <h4 className="text-sm sm:text-base font-bold text-[#1A1A18]">
          Qurate Tracked Work ({items.length})
        </h4>
        <div className="mt-3 space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span className="rounded-full bg-[#2D6A4F]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#2D6A4F]">
                  {it.status || 'tracked'}
                </span>
                <span className="truncate font-medium text-[#1A1A18]">
                  {it.issueTitle || it.title}
                </span>
              </div>
              <span className="shrink-0 text-xs text-[#1A1A18]/50">
                {it.repoName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function readLocalBookmarkContributions() {
  try {
    const raw = localStorage.getItem('qurateBookmarks')
    if (!raw) return []

    const bookmarks = JSON.parse(raw)
    // Only include bookmarks that the user actually contributed to or marked in progress
    return bookmarks
      .filter((b) => b.bookmarkStatus === 'completed' || b.bookmarkStatus === 'in-progress' || b.contributedAt)
      .map((issue) => ({
        source: 'tracked',
        issueId: String(issue._id || issue.github_id),
        repoName: issue.repo?.name || '',
        issueTitle: issue.title || '',
        pullRequestUrl: issue.pullRequestUrl || issue.html_url || '',
        status: issue.bookmarkStatus || 'in-progress',
        date: issue.contributedAt || issue.bookmarkedAt || new Date().toISOString(),
      }))
  } catch {
    return []
  }
}

function ProfilePage({ user: initialUser, onNavigate, onSignOut, contributionRefreshKey, onUserUpdate }) {
  const [username,        setUsername]        = useState(initialUser?.username        || '')
  const [githubUsername,  setGithubUsername]  = useState(initialUser?.githubUsername  || '')       
  const [stack,           setStack]           = useState(initialUser?.stack           || [])
  const [level,           setLevel]           = useState(initialUser?.experienceLevel || 'beginner')
  const [avatar,          setAvatar]          = useState(initialUser?.avatar          || '')
  const [role,            setRole]            = useState(initialUser?.role            || 'user')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef(null)

  const [saving,          setSaving]          = useState(false)
  const [saveMsg,         setSaveMsg]         = useState({ type: '', text: '' })

  const [heatmap,         setHeatmap]         = useState(null)
  const [heatLoading,     setHeatLoading]     = useState(false)
  const [heatError,       setHeatError]       = useState('')

  const [contributions,   setContributions]   = useState([])
  const [githubActivity,  setGithubActivity]  = useState([])
  const [githubHistory,   setGithubHistory]   = useState([])
  const [selectedDay,     setSelectedDay]     = useState(null)
  const [dayDetail,       setDayDetail]       = useState(null)
  const [dayLoading,      setDayLoading]      = useState(false)

  function getToken() {
    return localStorage.getItem('token') || localStorage.getItem('qurateToken')
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      setUploadingAvatar(true)
      const res = await fetch(`${API_BASE_URL}/api/auth/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Avatar upload failed')

      setAvatar(data.avatarUrl)
      const storedUser = JSON.parse(localStorage.getItem('qurateUser') || '{}')
      const updated = { ...storedUser, avatar: data.avatarUrl }
      localStorage.setItem('qurateUser', JSON.stringify(updated))
      localStorage.setItem('user', JSON.stringify(updated))
      onUserUpdate?.(updated)
      setSaveMsg({ type: 'success', text: 'Profile avatar uploaded successfully!' })
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.message || 'Avatar upload failed' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  useEffect(() => {
    const token = getToken()
    if (!token) return
    fetch(`${API_BASE_URL}/api/users/contributions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const serverContributions = d.contributions || []
        const localContributions = readLocalBookmarkContributions()
        const merged = new Map()

        serverContributions.forEach((item) => {
          merged.set(String(item.issueId || `${item.repoName}::${item.issueTitle}`), item)
        })

        localContributions.forEach((item) => {
          merged.set(String(item.issueId || `${item.repoName}::${item.issueTitle}`), {
            ...merged.get(String(item.issueId || `${item.repoName}::${item.issueTitle}`)),
            ...item,
          })
        })

        setContributions(Array.from(merged.values()))
      })
      .catch(() => {})
  }, [contributionRefreshKey])

  // Fetch recent GitHub activity and merge into the contribution log (top)
  const fetchGithubActivity = useCallback((ghUser) => {
    if (!ghUser?.trim()) return
    const token = getToken()
    fetch(`${API_BASE_URL}/api/github/activity/${ghUser.trim()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.error) return
        const mapped = (d.items || []).map(it => ({
          source: 'github',
          issueTitle: it.title,
          repoName: it.repoName,
          pullRequestUrl: it.url,
          status: 'github',
          date: it.date,
          commitCount: it.commitCount,
          recentChange: it.recentChange,
        }))

        setGithubActivity(mapped)
      })
      .catch(() => {})
  }, [])

  const fetchHeatmap = useCallback((ghUser) => {
    if (!ghUser?.trim()) return
    const token = getToken()
    setHeatLoading(true)
    setHeatError('')
    fetch(`${API_BASE_URL}/api/github/contributions/${ghUser.trim()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setHeatmap(d)
        if (d.historyItems && Array.isArray(d.historyItems)) {
          setGithubHistory(d.historyItems)
        }
      })
      .catch(e => setHeatError(e.message || 'Could not load GitHub data'))
      .finally(() => setHeatLoading(false))
  }, [])

  useEffect(() => { if (initialUser?.githubUsername) fetchHeatmap(initialUser.githubUsername) }, [initialUser?.githubUsername, contributionRefreshKey]) // eslint-disable-line
  useEffect(() => { if (initialUser?.githubUsername) fetchGithubActivity(initialUser.githubUsername) }, [initialUser?.githubUsername, contributionRefreshKey]) // eslint-disable-line

  // Combine and deduplicate all real activity and contributions
  const allMergedContributions = useMemo(() => {
    const map = new Map()
    const all = [...githubActivity, ...githubHistory, ...contributions]
    for (const item of all) {
      if (!item.date) continue
      const dateKey = (item.date || '').slice(0, 10)
      const uniqueId = item.pullRequestUrl || item.url
        ? `${dateKey}::${item.pullRequestUrl || item.url}`
        : `${dateKey}::${item.repoName}::${item.issueTitle || item.title}`
      if (!map.has(uniqueId)) {
        map.set(uniqueId, item)
      }
    }
    return Array.from(map.values())
  }, [githubActivity, githubHistory, contributions])

  // Fetch specific day activity when a day is clicked on the heatmap
  useEffect(() => {
    if (!selectedDay || !githubUsername) {
      setDayDetail(null)
      return
    }

    if (heatmap?.dailyActivity?.[selectedDay.date]) {
      setDayDetail(heatmap.dailyActivity[selectedDay.date])
      return
    }

    if (selectedDay.contributionCount > 0) {
      setDayLoading(true)
      const token = getToken()
      fetch(`${API_BASE_URL}/api/github/day-activity/${githubUsername.trim()}?date=${selectedDay.date}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => {
          if (!d.error) setDayDetail(d)
        })
        .catch(() => {})
        .finally(() => setDayLoading(false))
    } else {
      setDayDetail({ date: selectedDay.date, totalCommits: 0, commitRepos: [], pullRequests: [], issues: [] })
    }
  }, [selectedDay, githubUsername, heatmap?.dailyActivity])

  const dayTrackedItems = useMemo(() => {
    if (!selectedDay) return []
    return contributions.filter((it) => {
      const d = (it.date || it.createdAt || '').slice(0, 10)
      return d === selectedDay.date
    })
  }, [selectedDay, contributions])

  // Filter by selected square date if clicked
  const displayedContributions = useMemo(() => {
    if (!selectedDay) return allMergedContributions
    return allMergedContributions.filter((it) => {
      const itDate = (it.date || it.createdAt || '').slice(0, 10)
      return itDate === selectedDay.date
    })
  }, [allMergedContributions, selectedDay])

  const contributionSections = useMemo(() => {
    return groupContributionItems(displayedContributions)
  }, [displayedContributions])

  function toggleStack(tech) {
    setStack(prev =>
      prev.includes(tech.toLowerCase())
        ? prev.filter(s => s !== tech.toLowerCase())
        : [...prev, tech.toLowerCase()]
    )
  }

  async function handleSave(e) {
    e.preventDefault()
    const token = getToken()
    setSaving(true)
    setSaveMsg({ type: '', text: '' })

    try {
      const res  = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ username, githubUsername, stack, experienceLevel: level }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')

      const storedUser = JSON.parse(localStorage.getItem('qurateUser') || '{}')
      const updatedUser = { ...storedUser, ...data.user }
      localStorage.setItem('qurateUser', JSON.stringify(updatedUser))
      localStorage.setItem('user', JSON.stringify(updatedUser))
      onUserUpdate?.(updatedUser)

      setSaveMsg({ type: 'success', text: 'Profile saved successfully.' })
      if (githubUsername) {
        fetchHeatmap(githubUsername)
        fetchGithubActivity(githubUsername)
      }
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.message || 'Could not save profile.' })
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg({ type: '', text: '' }), 4000)
    }
  }

  const initials = (username || '?').slice(0, 1).toUpperCase()

  const statItems = [
    { label: 'Merged',    value: contributions.filter(c => c.status === 'merged').length,    colour: 'text-[#2D6A4F]' },
    { label: 'Submitted', value: contributions.filter(c => c.status === 'submitted').length, colour: 'text-[#1A1A18]' },
    { label: 'Planned',   value: contributions.filter(c => c.status === 'planned').length,   colour: 'text-[#1A1A18]/55' },
  ]

  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#1A1A18] antialiased">

      <nav className="sticky top-0 z-20 border-b border-[#1A1A18]/10 bg-[#F7F5F0]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
          <p className="[font-family:Georgia,serif] text-xl italic tracking-normal">Qurate</p>
          <div className="flex items-center gap-5 text-sm font-medium sm:gap-8">
            <button onClick={() => onNavigate('feed')}      className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]">Feed</button>
            <button onClick={() => onNavigate('discover')}  className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]">Discover</button>
            <button onClick={() => onNavigate('bookmarks')} className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]">Bookmarks</button>
            <button className="font-bold text-[#1A1A18]">Profile</button>
          </div>
        </div>
      </nav>

      <section className="mx-auto w-full max-w-3xl border-x border-[#1A1A18]/10 px-6 py-10 sm:px-8">

        {/* Rebuilt Identity Card (21st.dev Modern Profile Architecture) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative mb-8 overflow-hidden rounded-2xl border border-[#1A1A18]/10 bg-white/75 p-6 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.03)]"
        >
          {/* Subtle ambient mesh glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#2D6A4F]/10 blur-3xl" />

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Avatar + Details */}
            <div className="flex items-center gap-5">
              {/* Avatar with dynamic ring & hover lens */}
              <div className="relative group shrink-0">
                <div className="relative h-20 w-20 sm:h-22 sm:w-22 overflow-hidden rounded-2xl border-2 border-white shadow-md ring-2 ring-[#2D6A4F]/20 transition-all duration-300 group-hover:ring-[#2D6A4F]/60">
                  {avatar ? (
                    <img
                      src={avatar.startsWith('http') ? avatar : `${API_BASE_URL}${avatar}`}
                      alt={username}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#2D6A4F]/10 [font-family:Georgia,serif] text-2xl sm:text-3xl font-bold text-[#2D6A4F]">
                      {initials}
                    </div>
                  )}

                  {/* Hover lens overlay with smooth motion */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-white opacity-0 backdrop-blur-[2px] transition-all duration-200 group-hover:opacity-100"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <>
                        <Camera className="h-5 w-5 text-white/90" />
                        <span className="text-[10px] font-semibold tracking-wide">Edit</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                {/* Active status pip */}
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#1A1A18]/10">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2D6A4F]" />
                </span>
              </div>

              {/* Identity Details */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="[font-family:Georgia,serif] text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1A18] truncate">
                    {username || 'Your profile'}
                  </h1>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    role === 'admin'
                      ? 'bg-amber-100/80 text-amber-900 border border-amber-300/60 shadow-sm'
                      : 'bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20'
                  }`}>
                    {role === 'admin' ? (
                      <>
                        <ShieldCheck className="h-3 w-3" />
                        Admin
                      </>
                    ) : (
                      <>
                        <Code2 className="h-3 w-3" />
                        Contributor
                      </>
                    )}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 text-xs sm:text-sm text-[#1A1A18]/60">
                  {initialUser?.email && (
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5 text-[#1A1A18]/40 shrink-0" />
                      <span className="truncate">{initialUser.email}</span>
                    </span>
                  )}
                  {githubUsername && (
                    <a
                      href={`https://github.com/${githubUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group/gh inline-flex items-center gap-1 font-semibold text-[#2D6A4F] transition-colors hover:text-[#24583F]"
                    >
                      <span>@{githubUsername}</span>
                      <ExternalLink className="h-3 w-3 transition-transform group-hover/gh:translate-x-0.5 group-hover/gh:-translate-y-0.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Stat Bento Counters */}
            <div className="grid grid-cols-3 gap-2.5 sm:flex sm:gap-3 shrink-0">
              {statItems.map((s, idx) => (
                <motion.div
                  key={s.label}
                  whileHover={{ y: -2, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center rounded-xl border border-[#1A1A18]/10 bg-white/60 px-4 py-2.5 shadow-sm transition hover:border-[#2D6A4F]/30 hover:bg-white"
                >
                  <div className="flex items-center gap-1">
                    {idx === 0 && <GitMerge className="h-3 w-3 text-[#2D6A4F]" />}
                    {idx === 1 && <GitPullRequest className="h-3 w-3 text-[#1A1A18]/70" />}
                    {idx === 2 && <Clock className="h-3 w-3 text-[#1A1A18]/45" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A18]/50">
                      {s.label}
                    </span>
                  </div>
                  <p className={`mt-0.5 [font-family:Georgia,serif] text-2xl font-bold ${s.colour}`}>
                    {s.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Rebuilt Account Settings Card (21st.dev Animated Form) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="rounded-2xl border border-[#1A1A18]/10 bg-white/75 p-6 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.03)]"
        >
          <div className="mb-6 flex flex-col gap-1 border-b border-[#1A1A18]/8 pb-4">
            <h2 className="[font-family:Georgia,serif] text-xl font-bold tracking-tight text-[#1A1A18]">
              Account settings
            </h2>
            <p className="text-xs text-[#1A1A18]/55">
              Manage your public identity, experience level, and preferred technologies.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Two-column Input Fields */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1A1A18]/70">
                  Display name
                </label>
                <div className="relative flex items-center">
                  <User className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#1A1A18]/40" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#1A1A18]/15 bg-white/80 pl-10 pr-4 text-sm text-[#1A1A18] shadow-sm outline-none transition placeholder:text-[#1A1A18]/30 focus:border-[#2D6A4F] focus:bg-white focus:ring-4 focus:ring-[#2D6A4F]/10"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1A1A18]/70">
                  GitHub username
                </label>
                <div className="relative flex items-center">
                  <span className="pointer-events-none absolute left-3.5 text-[#1A1A18]/40">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={e => setGithubUsername(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#1A1A18]/15 bg-white/80 pl-10 pr-4 text-sm text-[#1A1A18] shadow-sm outline-none transition placeholder:text-[#1A1A18]/30 focus:border-[#2D6A4F] focus:bg-white focus:ring-4 focus:ring-[#2D6A4F]/10"
                    placeholder="e.g. torvalds"
                  />
                </div>
              </div>
            </div>

            {/* Modern 21st.dev Segmented Slider for Experience Level */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#1A1A18]/70">
                Experience level
              </label>
              <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-[#1A1A18]/15 bg-[#1A1A18]/5 p-1">
                {['beginner', 'intermediate', 'advanced'].map((lvl) => {
                  const isSelected = level === lvl
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(lvl)}
                      className={`relative z-10 flex h-10 items-center justify-center rounded-lg text-xs font-bold capitalize transition-colors ${
                        isSelected ? 'text-[#2D6A4F]' : 'text-[#1A1A18]/65 hover:text-[#1A1A18]'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="active-level-indicator"
                          className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-[#1A1A18]/5"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}
                      <span className="relative z-20 flex items-center gap-1.5">
                        {lvl}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tech Stack Interactive Filter Chips with Counter */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A18]/70">
                  Tech stack
                </label>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#2D6A4F]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#2D6A4F]">
                  <Layers className="h-3 w-3" />
                  {stack.length} selected
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {STACK_OPTIONS.map(tech => {
                  const active = stack.includes(tech.toLowerCase())
                  return (
                    <motion.button
                      key={tech}
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => toggleStack(tech)}
                      className={`group flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                        active
                          ? 'border-[#2D6A4F] bg-[#2D6A4F]/12 text-[#2D6A4F] shadow-sm'
                          : 'border-[#1A1A18]/12 bg-white/70 text-[#1A1A18]/65 hover:border-[#2D6A4F]/40 hover:bg-white hover:text-[#1A1A18]'
                      }`}
                    >
                      {active && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#2D6A4F] text-white"
                        >
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </motion.span>
                      )}
                      <span>{tech}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Feedback Toast Notification */}
            <AnimatePresence>
              {saveMsg.text && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-sm ${
                    saveMsg.type === 'success'
                      ? 'border-[#2D6A4F]/25 bg-[#2D6A4F]/10 text-[#2D6A4F]'
                      : 'border-red-700/20 bg-red-700/10 text-red-800'
                  }`}
                >
                  {saveMsg.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2D6A4F]" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-800" />
                  )}
                  <span>{saveMsg.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] px-6 text-sm font-bold text-[#F7F5F0] shadow-md shadow-[#2D6A4F]/20 transition-all hover:bg-[#24583F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#F7F5F0]" />
                    <span>Saving changes…</span>
                  </>
                ) : (
                  <span>Save changes</span>
                )}
              </motion.button>

              <motion.button
                type="button"
                onClick={onSignOut}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[#1A1A18]/15 bg-white/70 px-5 text-sm font-semibold text-[#1A1A18]/65 shadow-sm transition hover:border-red-600/30 hover:bg-red-50/50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </motion.button>
            </div>
          </form>
        </motion.div>

        <div className="mt-6 rounded-lg border border-[#1A1A18]/10 bg-white/55 px-6 py-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="[font-family:Georgia,serif] text-xl font-bold text-[#1A1A18]">GitHub contributions</h2>
              <p className="mt-0.5 text-xs font-medium text-[#1A1A18]/50">{githubUsername ? `Live data from @${githubUsername}` : 'Add your GitHub username above and save to load your heatmap'}</p>
            </div>
            {githubUsername && (<button type="button" onClick={() => fetchHeatmap(githubUsername)} className="rounded-md border border-[#1A1A18]/15 px-3 py-1.5 text-xs font-semibold text-[#1A1A18]/60 transition hover:border-[#2D6A4F] hover:text-[#2D6A4F]">Refresh</button>)}
          </div>

          {!githubUsername && (
            <div className="py-10 text-center">
              <p className="text-3xl">🌿</p>
              <p className="mt-3 text-sm font-medium text-[#1A1A18]/50">Enter your GitHub username above, save, and your contribution history will appear here.</p>
            </div>
          )}

          {githubUsername && heatLoading && (
            <div className="space-y-2 py-4">
              {[1, 2].map(i => (<div key={i} className="h-3 w-full animate-pulse rounded bg-[#1A1A18]/8"/>))}
              <p className="mt-3 text-center text-xs font-medium text-[#1A1A18]/45">Loading GitHub data…</p>
            </div>
          )}

          {githubUsername && heatError && !heatLoading && (
            <p className="rounded-md border border-red-700/20 bg-red-700/10 px-4 py-3 text-sm font-medium text-red-800">{heatError}</p>
          )}

          {heatmap && !heatLoading && (
            <ContributionHeatmap
              days={heatmap.days}
              total={heatmap.totalContributions}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          )}
        </div>

        <div className="mt-6 rounded-lg border border-[#1A1A18]/10 bg-white/55 px-6 py-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="[font-family:Georgia,serif] text-xl font-bold text-[#1A1A18]">Contribution log</h2>
              <p className="mt-0.5 text-xs font-medium text-[#1A1A18]/50">
                {selectedDay
                  ? `Showing activity for ${formatFullDate(selectedDay.date)}`
                  : 'Live timeline of your verified commits, pull requests, and activity'}
              </p>
            </div>
            {selectedDay && (
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="rounded-md border border-[#2D6A4F]/30 bg-white/80 px-3 py-1.5 text-xs font-bold text-[#2D6A4F] shadow-sm transition hover:bg-white"
              >
                Show all months ✕
              </button>
            )}
          </div>

          {selectedDay && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2D6A4F]/25 bg-[#2D6A4F]/10 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#2D6A4F] animate-pulse" />
                <span className="text-sm font-semibold text-[#1A1A18]">
                  Selected Day: <span className="font-bold text-[#2D6A4F]">{formatFullDate(selectedDay.date)}</span>
                </span>
                <span className="rounded-full bg-[#2D6A4F]/20 px-2.5 py-0.5 text-xs font-bold text-[#2D6A4F]">
                  {selectedDay.contributionCount} contribution{selectedDay.contributionCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {selectedDay ? (
            /* ============================================================ */
            /* SINGLE DAY SELECTED VIEW                                     */
            /* ============================================================ */
            <div className="relative pl-5 sm:pl-7">
              {/* Left continuous timeline bar */}
              <div className="absolute left-2.5 sm:left-3.5 top-0 bottom-0 w-0.5 bg-[#1A1A18]/15" />

              {dayLoading ? (
                <div className="py-10 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#2D6A4F] border-t-transparent" />
                  <p className="mt-3 text-xs font-medium text-[#1A1A18]/60">Fetching verified GitHub day activity…</p>
                </div>
              ) : (
                (() => {
                  const detail = dayDetail || heatmap?.dailyActivity?.[selectedDay.date]
                  const hasCommits = detail?.commitRepos?.length > 0 && detail.totalCommits > 0
                  const hasPrs = detail?.pullRequests?.length > 0
                  const hasIssues = detail?.issues?.length > 0
                  const hasTracked = dayTrackedItems.length > 0

                  if (!hasCommits && !hasPrs && !hasIssues && !hasTracked) {
                    if (selectedDay.contributionCount > 0) {
                      return (
                        <div className="relative pl-6 sm:pl-8">
                          <div className="rounded-xl border border-[#2D6A4F]/20 bg-white/70 p-6 text-center shadow-sm">
                            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#2D6A4F]/10 text-lg">
                              🌿
                            </div>
                            <h3 className="font-semibold text-[#1A1A18]">
                              {selectedDay.contributionCount} GitHub contribution{selectedDay.contributionCount !== 1 ? 's' : ''} on {formatFullDate(selectedDay.date)}
                            </h3>
                            <p className="mt-1 text-xs text-[#1A1A18]/55">
                              Recorded in your GitHub contribution calendar for this date.
                            </p>
                            <a
                              href={`https://github.com/${githubUsername}?tab=overview&from=${selectedDay.date}&to=${selectedDay.date}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#2D6A4F] px-4 py-2 text-xs font-semibold text-[#F7F5F0] transition hover:bg-[#24583F]"
                            >
                              View on GitHub ↗
                            </a>
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div className="rounded-xl border border-[#1A1A18]/10 bg-white/40 p-6 text-center text-sm font-medium text-[#1A1A18]/50">
                        No contributions recorded on {formatFullDate(selectedDay.date)}. Click another square on the heatmap.
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-5">
                      {hasCommits && (
                        <GithubCommitBlock
                          totalCommits={detail.totalCommits}
                          repos={detail.commitRepos}
                          isDayView={true}
                        />
                      )}
                      {hasPrs && (
                        <GithubPrBlock pullRequests={detail.pullRequests} />
                      )}
                      {hasIssues && (
                        <GithubIssueBlock issues={detail.issues} />
                      )}
                      {hasTracked && (
                        <TrackedActivityBlock items={dayTrackedItems} />
                      )}
                    </div>
                  )
                })()
              )}
            </div>
          ) : (
            /* ============================================================ */
            /* MONTHLY OVERVIEW TIMELINE (DEFAULT)                          */
            /* ============================================================ */
            <div className="space-y-8">
              {heatmap?.monthlyActivity && heatmap.monthlyActivity.length > 0 ? (
                heatmap.monthlyActivity.map((month) => {
                  const monthTrackedItems = contributions.filter(c => {
                    const d = (c.date || c.createdAt || '').slice(0, 7)
                    return d === month.monthKey
                  })
                  const hasCommits = month.commitRepos?.length > 0 && month.totalCommits > 0
                  const hasPrs = month.pullRequests?.length > 0
                  const hasIssues = month.issues?.length > 0
                  const hasTracked = monthTrackedItems.length > 0

                  if (!hasCommits && !hasPrs && !hasIssues && !hasTracked) return null

                  return (
                    <div key={month.monthKey}>
                      <div className="mb-4 flex items-center gap-4">
                        <h3 className="[font-family:Georgia,serif] text-lg font-bold text-[#1A1A18]">
                          {month.monthLabel}
                        </h3>
                        <div className="h-px flex-1 bg-[#1A1A18]/10" />
                      </div>

                      <div className="relative pl-5 sm:pl-7">
                        {/* Continuous vertical timeline bar */}
                        <div className="absolute left-2.5 sm:left-3.5 top-0 bottom-0 w-0.5 bg-[#1A1A18]/15" />

                        <div className="space-y-5">
                          {hasCommits && (
                            <GithubCommitBlock
                              totalCommits={month.totalCommits}
                              repos={month.commitRepos}
                            />
                          )}
                          {hasPrs && (
                            <GithubPrBlock pullRequests={month.pullRequests} />
                          )}
                          {hasIssues && (
                            <GithubIssueBlock issues={month.issues} />
                          )}
                          {hasTracked && (
                            <TrackedActivityBlock items={monthTrackedItems} />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : contributionSections.length > 0 ? (
                /* Fallback to legacy contribution sections if monthlyActivity isn't present */
                contributionSections.map(section => (
                  <div key={section.monthKey}>
                    <div className="mb-4 flex items-center gap-4">
                      <h3 className="[font-family:Georgia,serif] text-lg font-bold text-[#1A1A18]">{section.monthLabel}</h3>
                      <div className="h-px flex-1 bg-[#1A1A18]/10" />
                    </div>

                    <div className="relative pl-5">
                      <div className="absolute left-1 top-0 bottom-0 w-px bg-[#1A1A18]/15" />
                      <div className="space-y-5">
                        {section.items.map((group) => (
                          <div key={group.key} className="relative">
                            <div className="absolute -left-5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#2B3137] text-[13px] text-white shadow-sm">
                              {getGithubGroupIcon(group)}
                            </div>

                            <div className="flex items-start gap-4 rounded-2xl border border-[#1A1A18]/8 bg-white/55 px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                              <div className="min-w-0 flex-1">
                                <p className="text-base font-semibold text-[#1A1A18]">{getGithubGroupTitle(group)}</p>
                                {getGithubRecentChange(group) && (
                                  <p className="mt-1 text-sm text-[#1A1A18]/55">{getGithubRecentChange(group)}</p>
                                )}
                                <div className="mt-2 space-y-1.5">
                                  {Array.from(group.repoNames).slice(0, 4).map(repo => (
                                    <div key={repo} className="flex items-center gap-2 text-sm text-[#1A1A18]/65">
                                      <span className="text-[#1A1A18]/35">⌂</span>
                                      <span className="truncate font-medium">{repo}</span>
                                    </div>
                                  ))}
                                  {group.repoNames.size > 4 && (
                                    <p className="text-xs font-medium text-[#1A1A18]/45">+{group.repoNames.size - 4} more repositories</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex shrink-0 flex-col items-end gap-2">
                                {group.pullRequestUrl && (
                                  <a href={group.pullRequestUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#2D6A4F] underline underline-offset-4 transition hover:text-[#24583F]">
                                    {group.type === 'pull_request' ? 'View PR ↗' : group.type === 'issue' ? 'View Issue ↗' : 'View on GitHub ↗'}
                                  </a>
                                )}
                                <span className="rounded-full bg-[#1A1A18]/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1A1A18]/55">
                                  {group.source === 'github' ? 'GitHub' : 'Tracked'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-3xl">📋</p>
                  <p className="mt-3 text-sm font-medium text-[#1A1A18]/50">No contributions tracked yet. Connect your GitHub account or start contributing.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center pb-4">
          <button
            type="button"
            onClick={onSignOut}
            className="h-11 rounded-md border border-[#1A1A18]/15 px-6 text-sm font-semibold text-[#1A1A18]/65 transition hover:border-red-700/30 hover:text-red-800"
          >
            Sign out
          </button>
        </div>

      </section>
    </main>
  )
}

export default ProfilePage
