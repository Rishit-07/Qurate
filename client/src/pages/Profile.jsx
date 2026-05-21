import { useState, useEffect, useCallback } from 'react'

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

function ContributionHeatmap({ days, total }) {
  if (!days?.length) return null

  const monthLabels = []
  for (let w = 0; w < Math.ceil(days.length / 7); w++) {
    const day = days[w * 7]
    if (!day) continue
    const d = new Date(day.date)
    if (d.getDate() <= 7) {
      monthLabels.push({
        label: d.toLocaleString('default', { month: 'short' }),
        left:  w * 14,
      })
    }
  }

  return (
    <div>
      <div className="relative mb-1 h-4">
        {monthLabels.map((m, i) => (
          <span key={i} style={{ left: m.left }} className="absolute text-[10px] font-semibold uppercase tracking-wider text-[#1A1A18]/40">{m.label}</span>
        ))}
      </div>

      <div className="overflow-x-auto pb-2">
        <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 11px)', gridAutoFlow: 'column', gridAutoColumns: '11px', gap: '3px', width: 'max-content' }}>
          {days.map((day, i) => (
            <div
              key={i}
              title={`${day.date}: ${day.contributionCount} contribution${day.contributionCount !== 1 ? 's' : ''}`}
              style={{ width: 11, height: 11, borderRadius: 2, background: getCellColour(day.contributionCount), cursor: 'default', transition: 'opacity 0.12s' }}
              onMouseEnter={e => (e.target.style.opacity = '0.6')}
              onMouseLeave={e => (e.target.style.opacity = '1')}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#1A1A18]/45">{total?.toLocaleString()} contributions in the last year</span>
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

function readLocalBookmarkContributions() {
  try {
    const raw = localStorage.getItem('qurateBookmarks')
    if (!raw) return []

    const bookmarks = JSON.parse(raw)
    return bookmarks.map((issue) => ({
      issueId: String(issue._id || issue.github_id),
      repoName: issue.repo?.name || '',
      issueTitle: issue.title || '',
      pullRequestUrl: issue.html_url || '',
      status: issue.bookmarkStatus || 'planned',
    }))
  } catch {
    return []
  }
}

function ProfilePage({ user: initialUser, onNavigate, onSignOut, contributionRefreshKey, onUserUpdate }) {
  const [username,        setUsername]        = useState(initialUser?.username        || '')
  const [githubUsername,  setGithubUsername]  = useState(initialUser?.githubUsername  || '')
  const [email,           setEmail]           = useState(initialUser?.email           || '')
  const [stack,           setStack]           = useState(initialUser?.stack           || [])
  const [level,           setLevel]           = useState(initialUser?.experienceLevel || 'beginner')
  const [newPassword,     setNewPassword]     = useState('')

  const [saving,          setSaving]          = useState(false)
  const [saveMsg,         setSaveMsg]         = useState({ type: '', text: '' })

  const [heatmap,         setHeatmap]         = useState(null)
  const [heatLoading,     setHeatLoading]     = useState(false)
  const [heatError,       setHeatError]       = useState('')

  const [contributions,   setContributions]   = useState([])
  const [githubActivity,  setGithubActivity]  = useState([])

  function getToken() {
    return localStorage.getItem('token') || localStorage.getItem('qurateToken')
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
      })
      .catch(e => setHeatError(e.message || 'Could not load GitHub data'))
      .finally(() => setHeatLoading(false))
  }, [])

  useEffect(() => { if (initialUser?.githubUsername) fetchHeatmap(initialUser.githubUsername) }, [initialUser?.githubUsername, contributionRefreshKey]) // eslint-disable-line
  useEffect(() => { if (initialUser?.githubUsername) fetchGithubActivity(initialUser.githubUsername) }, [initialUser?.githubUsername, contributionRefreshKey]) // eslint-disable-line

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
        body:    JSON.stringify({ username, githubUsername, stack, experienceLevel: level, email, password: newPassword || undefined }),
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

  const contributionSections = groupContributionItems([
    ...githubActivity,
    ...contributions,
  ])

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

        <div className="mb-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#2D6A4F]/20 bg-[#2D6A4F]/10 text-3xl font-bold text-[#2D6A4F] [font-family:Georgia,serif]">
            {initials}
          </div>

          <div className="flex-1">
            <h1 className="[font-family:Georgia,serif] text-3xl font-bold tracking-tight text-[#1A1A18]">{username || 'Your profile'}</h1>
            <p className="mt-1 text-sm font-medium text-[#1A1A18]/55">{initialUser?.email}</p>
            {githubUsername && (
              <a href={`https://github.com/${githubUsername}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#2D6A4F] underline underline-offset-4 transition hover:text-[#24583F]">@{githubUsername} ↗</a>
            )}
          </div>

          <div className="flex gap-3">
            {statItems.map(s => (
              <div key={s.label} className="rounded-lg border border-[#1A1A18]/10 bg-white/55 px-4 py-3 text-center">
                <p className={`[font-family:Georgia,serif] text-2xl font-bold ${s.colour}`}>{s.value}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1A1A18]/45">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#1A1A18]/10 bg-white/55 px-6 py-6 shadow-sm">
          <h2 className="mb-5 [font-family:Georgia,serif] text-xl font-bold text-[#1A1A18]">Account settings</h2>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-left">
                <span className="text-sm font-medium text-[#1A1A18]/70">Display name</span>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#1A1A18]/20 bg-white/65 px-4 text-sm text-[#1A1A18] outline-none transition placeholder:text-[#1A1A18]/35 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20" placeholder="Your name" />
              </label>

              <label className="block text-left">
                <span className="text-sm font-medium text-[#1A1A18]/70">GitHub username</span>
                <input type="text" value={githubUsername} onChange={e => setGithubUsername(e.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#1A1A18]/20 bg-white/65 px-4 text-sm text-[#1A1A18] outline-none transition placeholder:text-[#1A1A18]/35 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20" placeholder="e.g. torvalds" />
              </label>
            </div>

            <label className="block text-left">
              <span className="text-sm font-medium text-[#1A1A18]/70">Experience level</span>
              <select value={level} onChange={e => setLevel(e.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#1A1A18]/20 bg-white/65 px-4 text-sm text-[#1A1A18] outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>

            <div>
              <p className="mb-2 text-sm font-medium text-[#1A1A18]/70">Your stack — click to toggle</p>
              <div className="flex flex-wrap gap-2">
                {STACK_OPTIONS.map(tech => {
                  const active = stack.includes(tech.toLowerCase())
                  return (
                    <button key={tech} type="button" onClick={() => toggleStack(tech)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${active ? 'border-[#2D6A4F] bg-[#2D6A4F]/10 text-[#2D6A4F]' : 'border-[#1A1A18]/15 bg-white/45 text-[#1A1A18]/65 hover:border-[#2D6A4F] hover:text-[#2D6A4F]'}`}>
                      {tech}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-left">
                <span className="text-sm font-medium text-[#1A1A18]/70">Email</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#1A1A18]/20 bg-white/65 px-4 text-sm text-[#1A1A18] outline-none transition placeholder:text-[#1A1A18]/35 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20" placeholder="you@example.com" />
              </label>

              <label className="block text-left">
                <span className="text-sm font-medium text-[#1A1A18]/70">New password <span className="text-xs font-normal text-[#1A1A18]/45">(leave blank to keep current)</span></span>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#1A1A18]/20 bg-white/65 px-4 text-sm text-[#1A1A18] outline-none transition placeholder:text-[#1A1A18]/35 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20" placeholder="Enter a new password" />
              </label>
            </div>

            {saveMsg.text && (
              <p className={`rounded-md border px-4 py-3 text-sm font-medium ${saveMsg.type === 'success' ? 'border-[#2D6A4F]/25 bg-[#2D6A4F]/10 text-[#2D6A4F]' : 'border-red-700/20 bg-red-700/10 text-red-800'}`}>
                {saveMsg.text}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="h-11 flex-1 rounded-md bg-[#2D6A4F] px-5 text-sm font-bold text-[#F7F5F0] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#24583F] disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
              <button type="button" onClick={onSignOut} className="h-11 rounded-md border border-[#1A1A18]/15 px-5 text-sm font-semibold text-[#1A1A18]/65 transition hover:border-red-700/30 hover:text-red-800">Sign out</button>
            </div>
          </form>
        </div>

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

          {heatmap && !heatLoading && (<ContributionHeatmap days={heatmap.days} total={heatmap.totalContributions} />)}
        </div>

        <div className="mt-6 rounded-lg border border-[#1A1A18]/10 bg-white/55 px-6 py-6 shadow-sm">
          <h2 className="mb-5 [font-family:Georgia,serif] text-xl font-bold text-[#1A1A18]">Contribution log</h2>

          {contributionSections.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-3xl">📋</p>
              <p className="mt-3 text-sm font-medium text-[#1A1A18]/50">No contributions tracked yet. Bookmark issues and mark them as you progress.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {contributionSections.map(section => (
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
                                  View PR ↗
                                </a>
                              )}
                              <span className="rounded-full bg-[#1A1A18]/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1A1A18]/55">
                                GitHub
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
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
