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
  Sparkles,
  TrendingUp,
  Activity,
  Settings,
  Calendar,
  RefreshCw,
  ChevronRight,
  FileText,
  ArrowUpRight,
  Dna,
} from 'lucide-react'
import StackDnaRadarCard from '../components/StackDnaRadarCard'

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
  const [activeTab,       setActiveTab]       = useState('overview')

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

  // Fetch authentic user profile from server
  useEffect(() => {
    const token = getToken()
    if (!token) return
    fetch(`${API_BASE_URL}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          if (d.user.username) setUsername(d.user.username)
          if (d.user.githubUsername) setGithubUsername(d.user.githubUsername)
          if (Array.isArray(d.user.stack)) setStack(d.user.stack)
          if (d.user.experienceLevel) setLevel(d.user.experienceLevel)
          if (d.user.avatar) setAvatar(d.user.avatar)
          if (d.user.role) setRole(d.user.role)
          onUserUpdate?.(d.user)
          localStorage.setItem('qurateUser', JSON.stringify(d.user))
          localStorage.setItem('user', JSON.stringify(d.user))
        }
      })
      .catch(() => {})
  }, [contributionRefreshKey])

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

  useEffect(() => {
    const target = (githubUsername || initialUser?.githubUsername || '').trim()
    if (target) {
      fetchHeatmap(target)
      fetchGithubActivity(target)
    }
  }, [githubUsername, initialUser?.githubUsername, contributionRefreshKey, fetchHeatmap, fetchGithubActivity])

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

  const totalMergedPRs = useMemo(() => {
    const trackedMerged = contributions.filter(c => c.status === 'merged').length
    let ghMerged = 0
    if (heatmap?.monthlyActivity) {
      for (const m of heatmap.monthlyActivity) {
        if (m.pullRequests) {
          ghMerged += m.pullRequests.filter(pr => (pr.state || '').toUpperCase() === 'MERGED').length
        }
      }
    }
    return trackedMerged + ghMerged
  }, [contributions, heatmap])

  const openPRsCount = useMemo(() => {
    const trackedSubmitted = contributions.filter(c => c.status === 'submitted').length
    let ghOpen = 0
    if (heatmap?.monthlyActivity) {
      for (const m of heatmap.monthlyActivity) {
        if (m.pullRequests) {
          ghOpen += m.pullRequests.filter(pr => (pr.state || '').toUpperCase() === 'OPEN').length
        }
      }
    }
    return trackedSubmitted + ghOpen
  }, [contributions, heatmap])

  const plannedIssuesCount = useMemo(() => {
    const trackedPlanned = contributions.filter(c => c.status === 'planned').length
    const localPlanned = readLocalBookmarkContributions().filter(c => c.status === 'planned').length
    return Math.max(trackedPlanned, localPlanned)
  }, [contributions])

  const statItems = [
    {
      label: 'Merged PRs',
      value: totalMergedPRs,
      colour: 'text-[#2D6A4F]',
      bg: 'bg-[#2D6A4F]/10',
      border: 'border-[#2D6A4F]/20',
      icon: GitMerge,
      desc: 'Verified merged pull requests',
    },
    {
      label: 'In Review',
      value: openPRsCount,
      colour: 'text-[#1D4ED8]',
      bg: 'bg-[#1D4ED8]/10',
      border: 'border-[#1D4ED8]/20',
      icon: GitPullRequest,
      desc: 'Active pull request submissions',
    },
    {
      label: 'Planned',
      value: plannedIssuesCount,
      colour: 'text-amber-800',
      bg: 'bg-amber-500/10',
      border: 'border-amber-600/20',
      icon: Clock,
      desc: 'Tracked open source roadmap',
    },
    {
      label: 'Annual Activity',
      value: heatmap?.totalContributions || 0,
      colour: 'text-[#2D6A4F]',
      bg: 'bg-[#2D6A4F]/10',
      border: 'border-[#2D6A4F]/20',
      icon: Sparkles,
      desc: 'Recorded GitHub contributions',
    },
  ]

  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#1A1A18] antialiased overflow-x-hidden w-full">

      {/* Modern Blurred Navigation Bar */}
      <nav className="sticky top-0 z-30 border-b border-[#1A1A18]/10 bg-[#F7F5F0]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <p className="[font-family:Georgia,serif] text-xl font-bold tracking-normal text-[#1A1A18]">Qurate</p>
            <span className="hidden sm:inline-block rounded-full bg-[#2D6A4F]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F]">
              Studio
            </span>
          </div>
          <div className="flex items-center gap-5 text-sm font-medium sm:gap-8">
            <button onClick={() => onNavigate('feed')}      className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]">Feed</button>
            <button onClick={() => onNavigate('discover')}  className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]">Discover</button>
            <button onClick={() => onNavigate('bookmarks')} className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]">Bookmarks</button>
            <button className="font-bold text-[#1A1A18]">Profile</button>
          </div>
        </div>
      </nav>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-8 py-8 space-y-8">

        {/* ================================================================ */}
        {/* CINEMATIC DEVELOPER PASSPORT HERO                                */}
        {/* ================================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-3xl border border-[#1A1A18]/10 bg-white/80 shadow-[0_4px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl"
        >
          {/* Architectural Mesh Cover Banner */}
          <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-gradient-to-r from-[#111714] via-[#1B3629] to-[#2D6A4F]">
            {/* Grid dot mesh overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
            <div className="absolute -bottom-8 -right-8 h-48 w-48 rounded-full bg-[#52B788]/20 blur-3xl" />
            <div className="absolute top-3 right-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-[11px] font-semibold text-white/95 backdrop-blur-md border border-white/10">
                <Sparkles className="h-3 w-3 text-emerald-300" />
                Open Source Contributor
              </span>
            </div>
          </div>

          {/* Identity Bar */}
          <div className="px-5 pb-4 pt-2 sm:px-6">
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Avatar + Personal Credentials */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Elevated Avatar Lens (Only Avatar shifts up over banner) */}
                <div className="relative group shrink-0 -mt-10 sm:-mt-12">
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-2xl border-[3px] border-[#F7F5F0] bg-white shadow-lg ring-1 ring-[#1A1A18]/10">
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

                    {/* Camera upload lens overlay */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      title="Update profile picture"
                      className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 text-white opacity-0 backdrop-blur-[2px] transition-all duration-200 group-hover:opacity-100"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <>
                          <Camera className="h-4 w-4 text-white/95" />
                          <span className="text-[10px] font-bold">Edit Photo</span>
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
                  {/* Status pip */}
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow ring-2 ring-[#2D6A4F]/20">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#2D6A4F] animate-pulse" />
                  </span>
                </div>

                {/* Identity Metadata */}
                <div className="pb-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="[font-family:Georgia,serif] text-xl sm:text-2xl font-bold tracking-tight text-[#1A1A18]">
                      {username || 'Your profile'}
                    </h1>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      role === 'admin'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
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

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#1A1A18]/65">
                    {initialUser?.email && (
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Mail className="h-3.5 w-3.5 text-[#1A1A18]/45" />
                        <span>{initialUser.email}</span>
                      </span>
                    )}
                    {githubUsername && (
                      <a
                        href={`https://github.com/${githubUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="group/gh inline-flex items-center gap-1 font-semibold text-[#2D6A4F] hover:underline"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                        <span>@{githubUsername}</span>
                        <ExternalLink className="h-2.5 w-2.5 transition-transform group-hover/gh:translate-x-0.5 group-hover/gh:-translate-y-0.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sleek Horizontal Tab Bar (Linear/Apple-style minimal tabs, single line, no wrap) */}
          <div className="border-t border-[#1A1A18]/8 px-4 sm:px-6 bg-[#FAF8F5]/80 backdrop-blur-sm">
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-2 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'overview'
                    ? 'bg-white text-[#2D6A4F] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#1A1A18]/10'
                    : 'text-[#1A1A18]/60 hover:text-[#1A1A18] hover:bg-black/[0.03]'
                }`}
              >
                <Dna className="h-3.5 w-3.5" />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('contributions')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'contributions'
                    ? 'bg-white text-[#2D6A4F] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#1A1A18]/10'
                    : 'text-[#1A1A18]/60 hover:text-[#1A1A18] hover:bg-black/[0.03]'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Contributions</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'activity'
                    ? 'bg-white text-[#2D6A4F] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#1A1A18]/10'
                    : 'text-[#1A1A18]/60 hover:text-[#1A1A18] hover:bg-black/[0.03]'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Activity</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'settings'
                    ? 'bg-white text-[#2D6A4F] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#1A1A18]/10'
                    : 'text-[#1A1A18]/60 hover:text-[#1A1A18] hover:bg-black/[0.03]'
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Unified Compact Stat Strip (Single Unified Row - Zero Repetition, Zero Clutter) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#1A1A18]/8 rounded-2xl border border-[#1A1A18]/10 bg-white/80 backdrop-blur-xl shadow-xs overflow-hidden">
          {statItems.map((s) => {
            const IconComponent = s.icon
            return (
              <div key={s.label} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/60 transition">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${s.bg} ${s.colour}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`[font-family:Georgia,serif] text-lg font-bold leading-none ${s.colour}`}>
                      {s.value}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A18]/50 truncate">
                      {s.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#1A1A18]/45 truncate mt-0.5">{s.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* ================================================================ */}
        {/* VIEW 1: PORTFOLIO & ACTIVITY WORKSPACE                           */}
        {/* ================================================================ */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* 2-Column Bento Workspace: Developer Dossier + Stack DNA Topology (Zero Scroll Overload) */}
            <div className="grid lg:grid-cols-12 gap-5 items-start">
              {/* Left Column (Col 5): Developer Dossier & GitHub Link */}
              <div className="lg:col-span-5 space-y-4">
                {/* Dossier Card */}
                <div className="rounded-3xl border border-[#1A1A18]/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-[#1A1A18]/8">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
                      <Code2 className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-[#1A1A18]">Developer Profile</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A18]/45">
                        Experience Tier
                      </span>
                      <div className="mt-1 flex items-center justify-between rounded-xl border border-[#2D6A4F]/20 bg-[#2D6A4F]/5 px-3 py-2">
                        <span className="text-xs font-bold capitalize text-[#2D6A4F]">
                          {level}
                        </span>
                        <span className="text-[11px] text-[#1A1A18]/50">
                          {level === 'beginner' && 'Getting Started'}
                          {level === 'intermediate' && 'Feature Contributor'}
                          {level === 'advanced' && 'Module Architect'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A18]/45">
                          Active Tech Stack
                        </span>
                        <span className="rounded-full bg-[#2D6A4F]/10 px-2 py-0.5 text-[10px] font-bold text-[#2D6A4F]">
                          {stack.length}
                        </span>
                      </div>
                      {stack.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {stack.map(tech => (
                            <span
                              key={tech}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#1A1A18]/10 bg-white px-2 py-0.5 text-[11px] font-semibold text-[#1A1A18]/80 shadow-2xs"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-[#2D6A4F]" />
                              {tech}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#1A1A18]/40 italic">No technologies configured yet.</p>
                      )}
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('settings')}
                        className="w-full flex items-center justify-between rounded-xl border border-[#1A1A18]/15 bg-white px-3.5 py-2 text-xs font-bold text-[#1A1A18]/75 shadow-xs transition hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
                      >
                        <span className="flex items-center gap-1.5">
                          <Settings className="h-3.5 w-3.5" />
                          <span>Customize Stack & Profile</span>
                        </span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* GitHub Sync Status Card */}
                <div className="rounded-3xl border border-[#1A1A18]/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1A1A18]/8 text-[#1A1A18]">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-bold text-[#1A1A18]">GitHub Connection</h3>
                    </div>
                    {githubUsername && (
                      <span className="flex h-2 w-2 rounded-full bg-[#2D6A4F] animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#1A1A18]/55 mb-3 leading-relaxed">
                    {githubUsername
                      ? `Syncing verified activity from @${githubUsername}.`
                      : 'Connect your GitHub handle in settings to track activity.'}
                  </p>
                  {githubUsername ? (
                    <button
                      type="button"
                      onClick={() => fetchHeatmap(githubUsername)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-[#1A1A18]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A18]/70 shadow-2xs transition hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Sync Live Heatmap</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#2D6A4F] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#24583F]"
                    >
                      <span>Connect GitHub</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column (Col 7): Stack DNA Skill Topology Radar Card */}
              <div className="lg:col-span-7">
                <StackDnaRadarCard
                  user={{ ...initialUser, username, stack, experienceLevel: level, githubUsername }}
                  onNavigateToSettings={() => setActiveTab('settings')}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ================================================================ */}
        {/* VIEW 2: CONTRIBUTIONS & HEATMAP WORKSPACE                         */}
        {/* ================================================================ */}
        {activeTab === 'contributions' && (
          <motion.div
            key="contributions-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {/* Full-Width GitHub Contribution Calendar */}
            <div className="rounded-3xl border border-[#1A1A18]/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F]">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="[font-family:Georgia,serif] text-lg font-bold text-[#1A1A18]">
                        Contribution Calendar
                      </h2>
                      <p className="text-xs text-[#1A1A18]/50">
                        {githubUsername
                          ? `Interactive annual history from @${githubUsername}`
                          : 'Add your GitHub username in settings to view your contribution heatmap'}
                      </p>
                    </div>
                  </div>

                  {githubUsername && (
                    <button
                      type="button"
                      onClick={() => fetchHeatmap(githubUsername)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#1A1A18]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A18]/65 shadow-2xs transition hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Refresh</span>
                    </button>
                  )}
                </div>

                {!githubUsername && (
                  <div className="py-12 text-center rounded-2xl border border-dashed border-[#1A1A18]/15 bg-white/40 my-2">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F]">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-[#1A1A18]">No GitHub Account Linked</p>
                    <p className="mt-1 text-xs text-[#1A1A18]/50 max-w-sm mx-auto">
                      Add your GitHub username in the Studio tab to see your verified contributions, commits, and activity stream.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#2D6A4F] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#24583F]"
                    >
                      <span>Open Settings</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {githubUsername && heatLoading && (
                  <div className="space-y-3 py-8">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-4 w-full animate-pulse rounded bg-[#1A1A18]/8" />
                    ))}
                    <p className="mt-3 text-center text-xs font-medium text-[#1A1A18]/45">
                      Syncing verified GitHub activity…
                    </p>
                  </div>
                )}

                {githubUsername && heatError && !heatLoading && (
                  <p className="rounded-2xl border border-red-700/20 bg-red-700/10 px-4 py-3 text-xs font-medium text-red-800">
                    {heatError}
                  </p>
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

            {/* Selected Day Inspector Block (or Prompt) */}
            <div className="rounded-3xl border border-[#1A1A18]/10 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1A1A18]/8">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F]">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="[font-family:Georgia,serif] text-base font-bold text-[#1A1A18]">
                      {selectedDay ? `Activity for ${formatFullDate(selectedDay.date)}` : 'Interactive Day Inspector'}
                    </h3>
                    <p className="text-xs text-[#1A1A18]/50">
                      {selectedDay
                        ? `${selectedDay.contributionCount} verified contribution${selectedDay.contributionCount !== 1 ? 's' : ''}`
                        : 'Select any cell on the calendar to view its granular commits and pull requests'}
                    </p>
                  </div>
                </div>

                {selectedDay && (
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="rounded-xl border border-[#2D6A4F]/30 bg-white px-3 py-1.5 text-xs font-bold text-[#2D6A4F] shadow-sm transition hover:bg-[#2D6A4F]/10"
                  >
                    Clear Selection ✕
                  </button>
                )}
              </div>

              {selectedDay ? (
                /* SINGLE DAY SELECTED VIEW */
                <div className="relative pl-5 sm:pl-7">
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
                              <div className="rounded-2xl border border-[#2D6A4F]/20 bg-white/70 p-6 text-center shadow-sm">
                                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F]">
                                  <Sparkles className="h-5 w-5" />
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
                                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#2D6A4F] px-4 py-2 text-xs font-semibold text-[#F7F5F0] transition hover:bg-[#24583F]"
                                >
                                  View on GitHub ↗
                                </a>
                              </div>
                            </div>
                          )
                        }
                        return (
                          <div className="rounded-2xl border border-[#1A1A18]/10 bg-white/40 p-6 text-center text-sm font-medium text-[#1A1A18]/50">
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
                <div className="py-8 text-center rounded-2xl border border-dashed border-[#1A1A18]/15 bg-white/40">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1A18]/5 text-[#1A1A18]/40">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-[#1A1A18]">Interactive Day Inspection</p>
                  <p className="mt-1 text-xs text-[#1A1A18]/50 max-w-sm mx-auto">
                    Click any active green cell on the heatmap above to inspect individual commits, pull requests, and repository milestones for that date.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('activity')}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#1A1A18]/8 px-4 py-2 text-xs font-bold text-[#1A1A18] transition hover:bg-[#1A1A18]/15"
                  >
                    <span>Browse Full Activity Stream</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ================================================================ */}
        {/* VIEW 3: FULL VERIFIED ACTIVITY STREAM                            */}
        {/* ================================================================ */}
        {activeTab === 'activity' && (
          <motion.div
            key="activity-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {/* Full-Width Section: Contribution & Activity Stream */}
            <div className="rounded-3xl border border-[#1A1A18]/10 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F]">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="[font-family:Georgia,serif] text-xl font-bold text-[#1A1A18]">
                      Verified Activity Stream
                    </h2>
                    <p className="text-xs text-[#1A1A18]/50">
                      Chronological timeline of commits, pull requests, issues, and tracked milestones across all repositories
                    </p>
                  </div>
                </div>
              </div>

              {/* MONTHLY OVERVIEW TIMELINE */}
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

                                <div className="flex items-start gap-4 rounded-2xl border border-[#1A1A18]/8 bg-white/60 px-4 py-4 shadow-2xs">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-base font-semibold text-[#1A1A18]">{getGithubGroupTitle(group)}</p>
                                    {getGithubRecentChange(group) && (
                                      <p className="mt-1 text-sm text-[#1A1A18]/55">{getGithubRecentChange(group)}</p>
                                    )}
                                    <div className="mt-2 space-y-1.5">
                                      {Array.from(group.repoNames).slice(0, 4).map(repo => (
                                        <div key={repo} className="flex items-center gap-2 text-sm text-[#1A1A18]/65">
                                          <span className="text-[#1A1A18]/35">#</span>
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
                    <div className="py-12 text-center rounded-2xl border border-dashed border-[#1A1A18]/15 bg-white/40">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1A18]/5 text-[#1A1A18]/40">
                        <FileText className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-[#1A1A18]">No activity recorded yet</p>
                      <p className="mt-1 text-xs text-[#1A1A18]/50 max-w-sm mx-auto">
                        Connect your GitHub account or start contributing to open source repositories to populate your stream.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        {/* ================================================================ */}
        {/* VIEW 2: PROFILE STUDIO & SETTINGS (21ST.DEV BENTO ARCHITECTURE) */}
        {/* ================================================================ */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="[font-family:Georgia,serif] text-2xl font-bold tracking-tight text-[#1A1A18]">
                  Developer Studio & Preferences
                </h2>
                <p className="text-xs text-[#1A1A18]/55">
                  Configure your public identity, experience level, and preferred tech stack for tailored issue curation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#1A1A18]/15 bg-white px-3.5 py-2 text-xs font-bold text-[#1A1A18]/70 shadow-2xs transition hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
              >
                <span>View Portfolio</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Gapless Bento Grid */}
              <div className="grid gap-6 md:grid-cols-12">
                {/* Card 1: Identity & Credentials (Col 7) */}
                <div className="md:col-span-7 rounded-3xl border border-[#1A1A18]/10 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#1A1A18]/8">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1A1A18]">Developer Identity</h3>
                      <p className="text-[11px] text-[#1A1A18]/45">Public profile credentials and credentials</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Avatar Upload Dropzone */}
                    <div className="flex items-center gap-4 p-3 rounded-2xl border border-[#1A1A18]/8 bg-white/60">
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl border-2 border-white bg-[#2D6A4F]/10 shadow-sm shrink-0">
                        {avatar ? (
                          <img
                            src={avatar.startsWith('http') ? avatar : `${API_BASE_URL}${avatar}`}
                            alt={username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-bold text-[#2D6A4F]">
                            {initials}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1A1A18]">Profile Picture</p>
                        <p className="text-[11px] text-[#1A1A18]/45">PNG, JPG or WebP up to 5MB</p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] hover:underline"
                        >
                          {uploadingAvatar ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Uploading…</span>
                            </>
                          ) : (
                            <>
                              <Camera className="h-3 w-3" />
                              <span>Change Photo</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#1A1A18]/65">
                        Display Name
                      </label>
                      <div className="relative flex items-center">
                        <span className="pointer-events-none absolute left-3.5 text-[#1A1A18]/40">
                          <User className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          className="h-11 w-full rounded-2xl border border-[#1A1A18]/15 bg-white/90 pl-10 pr-4 text-sm font-medium text-[#1A1A18] shadow-2xs outline-none transition placeholder:text-[#1A1A18]/30 focus:border-[#2D6A4F] focus:ring-4 focus:ring-[#2D6A4F]/10"
                          placeholder="Your full name or alias"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#1A1A18]/65">
                        GitHub Username
                      </label>
                      <div className="relative flex items-center">
                        <span className="pointer-events-none absolute left-3.5 text-[#1A1A18]/45">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                          </svg>
                        </span>
                        <input
                          type="text"
                          value={githubUsername}
                          onChange={e => setGithubUsername(e.target.value)}
                          className="h-11 w-full rounded-2xl border border-[#1A1A18]/15 bg-white/90 pl-10 pr-4 text-sm font-medium text-[#1A1A18] shadow-2xs outline-none transition placeholder:text-[#1A1A18]/30 focus:border-[#2D6A4F] focus:ring-4 focus:ring-[#2D6A4F]/10"
                          placeholder="e.g. torvalds"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-[#1A1A18]/45">
                        Synchronizes your contribution heatmap, commit frequency, and verified pull requests.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 2: Experience Tier (Col 5) */}
                <div className="md:col-span-5 rounded-3xl border border-[#1A1A18]/10 bg-white/80 p-6 shadow-sm backdrop-blur-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#1A1A18]/8">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#1A1A18]">Experience Tier</h3>
                        <p className="text-[11px] text-[#1A1A18]/45">Skill level for smart issue matching</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        { id: 'beginner', title: 'Beginner', desc: 'Starting out with good first issues' },
                        { id: 'intermediate', title: 'Intermediate', desc: 'Building features & reviewing PRs' },
                        { id: 'advanced', title: 'Advanced', desc: 'Architecting scalable modules & tooling' },
                      ].map(tier => {
                        const isSelected = level === tier.id
                        return (
                          <button
                            key={tier.id}
                            type="button"
                            onClick={() => setLevel(tier.id)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                              isSelected
                                ? 'border-[#2D6A4F] bg-[#2D6A4F]/10 shadow-2xs ring-1 ring-[#2D6A4F]/30'
                                : 'border-[#1A1A18]/10 bg-white/60 hover:bg-white hover:border-[#1A1A18]/25'
                            }`}
                          >
                            <div>
                              <p className={`text-xs font-bold ${isSelected ? 'text-[#2D6A4F]' : 'text-[#1A1A18]'}`}>
                                {tier.title}
                              </p>
                              <p className="text-[11px] text-[#1A1A18]/50 mt-0.5">{tier.desc}</p>
                            </div>
                            <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-[#2D6A4F] bg-[#2D6A4F] text-white' : 'border-[#1A1A18]/20'
                            }`}>
                              {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Tech Ecosystem / Stack Grid (Full Width) */}
              <div className="rounded-3xl border border-[#1A1A18]/10 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1A1A18]/8">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1A1A18]">Tech Stack Matrix</h3>
                      <p className="text-xs text-[#1A1A18]/50">Choose technologies to refine feed recommendations</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#2D6A4F]/10 px-3 py-1 text-xs font-bold text-[#2D6A4F]">
                    <Check className="h-3 w-3" />
                    {stack.length} technologies selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {STACK_OPTIONS.map(tech => {
                    const active = stack.includes(tech.toLowerCase())
                    return (
                      <motion.button
                        key={tech}
                        type="button"
                        whileTap={{ scale: 0.94 }}
                        onClick={() => toggleStack(tech)}
                        className={`group flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                          active
                            ? 'border-[#2D6A4F] bg-[#2D6A4F] text-white shadow-sm shadow-[#2D6A4F]/25'
                            : 'border-[#1A1A18]/12 bg-white/80 text-[#1A1A18]/70 hover:border-[#2D6A4F]/40 hover:bg-white hover:text-[#1A1A18]'
                        }`}
                      >
                        {active && <Check className="h-3 w-3 stroke-[3]" />}
                        <span>{tech}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Toast notification */}
              <AnimatePresence>
                {saveMsg.text && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-semibold shadow-sm ${
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

              {/* Command Action Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs text-[#1A1A18]/50">
                  <span className="h-2 w-2 rounded-full bg-[#2D6A4F]" />
                  <span>Changes sync live across all recommendations and feeds</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <motion.button
                    type="button"
                    onClick={onSignOut}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-[#1A1A18]/15 bg-white px-5 text-xs font-bold text-[#1A1A18]/65 shadow-2xs transition hover:border-red-600/30 hover:bg-red-50/50 hover:text-red-700"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </motion.button>

                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2D6A4F] px-8 text-xs font-bold text-[#F7F5F0] shadow-md shadow-[#2D6A4F]/20 transition-all hover:bg-[#24583F] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-[#F7F5F0]" />
                        <span>Saving…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Save Configuration</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

      </section>
    </main>
  )
}

export default ProfilePage
