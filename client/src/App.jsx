import { useEffect, useState } from 'react'
import './App.css'
import AuthPage from './pages/AuthPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import BookmarkPage from './pages/BookmarkPage.jsx'
import DiscoverPage from './pages/DiscoverPage.jsx'
import DiscoveryFeed from './pages/DiscoveryFeed.jsx'
import Profile from './pages/Profile.jsx'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx'
import TermsPage from './pages/TermsPage.jsx'

const BOOKMARKS_STORAGE_KEY = 'qurateBookmarks'
const CONTRIBUTION_STATUS_OPTIONS = ['merged', 'submitted', 'planned']
const RAW_API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '')
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, '')

function App() {
  const [view, setView] = useState(() =>
    localStorage.getItem('qurateToken') ? 'feed' : 'auth',
  )
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('qurateUser')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [bookmarks, setBookmarks] = useState(() => {
    return readStoredBookmarks()
  })
  const [pendingBookmarkIssue, setPendingBookmarkIssue] = useState(null)
  const [bookmarkStatus, setBookmarkStatus] = useState('planned')
  const [contributionRefreshKey, setContributionRefreshKey] = useState(0)
  const [toast, setToast] = useState(null)

  // If the user has no local bookmarks but server contributions exist,
  // populate local bookmarks from the server so the Bookmarks page shows them.
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('qurateToken')
    if (!token) return
    if (bookmarks.length > 0) return

    let cancelled = false

    async function fetchServerContributions() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/contributions`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        const serverContributions = data.contributions || []
        if (cancelled || !serverContributions.length) return

        const mapped = serverContributions.map((c) => ({
          _id: String(c.issueId || `${c.repoName}::${c.issueTitle}`),
          title: c.issueTitle || '',
          repo: { name: c.repoName || '' },
          html_url: c.pullRequestUrl || '',
          bookmarkStatus: c.status || 'planned',
        }))

        setBookmarks((current) => {
          // Only set if still empty
          if (current.length > 0) return current
          return mapped
        })
      } catch {
        // ignore errors — keep bookmarks local
      }
    }

    fetchServerContributions()

    return () => {
      cancelled = true
    }
  }, [contributionRefreshKey])
  function handleLogin(userData, token) {
    localStorage.setItem('qurateToken', token)
    localStorage.setItem('qurateUser', JSON.stringify(userData))
    setUser(userData)
    setView('feed')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSignOut() {
    localStorage.removeItem('qurateToken')
    localStorage.removeItem('qurateUser')
    setUser(null)
    setView('auth')
  }

  function handleViewChange(nextView) {
    // Protect certain views from unauthenticated access
    const token = localStorage.getItem('token') || localStorage.getItem('qurateToken')
    const protectedViews = ['feed', 'discover', 'bookmarks', 'profile']
    if (protectedViews.includes(nextView) && !token) {
      setView('auth')
      setToast({ type: 'info', text: 'Sign in to access that page.' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    setView(nextView)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks))
  }, [bookmarks])

  useEffect(() => {
    const token = localStorage.getItem('qurateToken')
    if (!token || bookmarks.length === 0) return

    let cancelled = false

    async function syncBookmarksToContributions() {
      try {
        await Promise.all(
          bookmarks.map((issue) => {
            const status = issue.bookmarkStatus || 'planned'
            return fetch(`${API_BASE_URL}/api/users/contributions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                issueId: String(getIssueId(issue)),
                repoName: issue.repo?.name,
                issueTitle: issue.title,
                pullRequestUrl: issue.html_url,
                status,
              }),
            })
          }),
        )

        if (!cancelled) {
          setContributionRefreshKey((current) => current + 1)
        }
      } catch {
        // keep bookmarks local even if the sync fails; Profile can retry on the next render
      }
    }

    syncBookmarksToContributions()

    return () => {
      cancelled = true
    }
  }, [bookmarks])

  async function persistContribution(issue, status) {
    const token = localStorage.getItem('qurateToken')
    if (!token) return

    await fetch(`${API_BASE_URL}/api/users/contributions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        issueId: String(getIssueId(issue)),
        repoName: issue.repo?.name,
        issueTitle: issue.title,
        pullRequestUrl: issue.html_url,
        status,
      }),
    })

    setContributionRefreshKey((current) => current + 1)
  }

  async function updateContributionStatus(issue, status) {
    const issueId = String(getIssueId(issue))
    const token = localStorage.getItem('qurateToken')
    if (!token) return

    await fetch(`${API_BASE_URL}/api/users/contributions/${issueId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    })

    setBookmarks((current) => {
      const nextBookmarks = current.map((item) =>
        String(getIssueId(item)) === issueId
          ? { ...item, bookmarkStatus: status }
          : item,
      )
      return nextBookmarks
    })

    setContributionRefreshKey((current) => current + 1)
  }

  async function removeContribution(issue) {
    const issueId = String(getIssueId(issue))
    const token = localStorage.getItem('qurateToken')
    if (!token) return

    await fetch(`${API_BASE_URL}/api/users/contributions/${issueId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    setContributionRefreshKey((current) => current + 1)
  }

  function openBookmarkStatusPicker(issue) {
    setPendingBookmarkIssue(issue)
    setBookmarkStatus('planned')
  }

  async function confirmBookmarkStatus(status) {
    if (!pendingBookmarkIssue) return
    const issue = pendingBookmarkIssue
    const issueId = getIssueId(issue)

    setBookmarks((current) => {
      const exists = current.some((item) => getIssueId(item) === issueId)
      if (exists) return current
      const nextBookmarks = [{ ...issue, bookmarkStatus: status }, ...current]
      return nextBookmarks
    })

    await persistContribution(issue, status)
    setPendingBookmarkIssue(null)
  }

  async function toggleBookmark(issue) {
    const issueId = getIssueId(issue)

    const isBookmarked = bookmarks.some((item) => getIssueId(item) === issueId)
    if (isBookmarked) {
      setBookmarks((current) => {
        const nextBookmarks = current.filter((item) => getIssueId(item) !== issueId)
        return nextBookmarks
      })
      await removeContribution(issue)
      return
    }

    openBookmarkStatusPicker(issue)
  }

  let activeView = <AuthPage onLogin={handleLogin} onNavigate={handleViewChange} />

  if (view === 'bookmarks') {
    activeView = (
      <BookmarkPage
        bookmarks={bookmarks}
        onNavigate={handleViewChange}
        onSignOut={handleSignOut}
        onToggleBookmark={toggleBookmark}
        onUpdateBookmarkStatus={updateContributionStatus}
      />
    )
  } else if (view === 'discover') {
    activeView = (
      <DiscoverPage
        bookmarks={bookmarks}
        onNavigate={handleViewChange}
        onSignOut={handleSignOut}
        onToggleBookmark={toggleBookmark}
      />
    )
  } else if (view === 'feed') {
    activeView = (
      <DiscoveryFeed
        user={user}
        bookmarks={bookmarks}
        onNavigate={handleViewChange}
        onSignOut={handleSignOut}
        onToggleBookmark={toggleBookmark}
      />
    )
  } else if (view === 'profile') {
    activeView = (
      <Profile
        user={user}
        onNavigate={handleViewChange}
        onSignOut={handleSignOut}
        contributionRefreshKey={contributionRefreshKey}
        onUserUpdate={setUser}
      />
    )
  } else if (view === 'about') {
    activeView = <AboutPage onNavigate={handleViewChange} />
  } else if (view === 'privacy') {
    activeView = <PrivacyPolicyPage onNavigate={handleViewChange} />
  } else if (view === 'terms') {
    activeView = <TermsPage onNavigate={handleViewChange} />
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1A1A18]">
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">{activeView}</div>
        <GlobalFooter onNavigate={handleViewChange} />
      </div>
      {pendingBookmarkIssue && (
        <BookmarkStatusModal
          issue={pendingBookmarkIssue}
          status={bookmarkStatus}
          onStatusChange={setBookmarkStatus}
          onCancel={() => setPendingBookmarkIssue(null)}
          onConfirm={confirmBookmarkStatus}
          options={CONTRIBUTION_STATUS_OPTIONS}
        />
      )}

      {toast && (
        <div aria-live="polite" className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6">
          <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
            <div className={`pointer-events-auto max-w-sm w-full rounded-lg shadow-lg ring-1 ring-black/5 ${toast.type === 'info' ? 'bg-white/95 border border-[#2D6A4F]/10' : 'bg-white/95'}`}>
              <div className="p-4 text-sm font-medium text-[#1A1A18]">{toast.text}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getIssueId(issue) {
  return issue._id || issue.github_id
}

function readStoredBookmarks() {
  try {
    const savedBookmarks = localStorage.getItem(BOOKMARKS_STORAGE_KEY)
    if (!savedBookmarks) return []

    const parsed = JSON.parse(savedBookmarks)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function BookmarkStatusModal({ issue, status, onStatusChange, onCancel, onConfirm, options }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A18]/45 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#1A1A18]/10 bg-[#F7F5F0] p-6 shadow-2xl">
        <h2 className="[font-family:Georgia,serif] text-2xl font-bold text-[#1A1A18]">Set bookmark status</h2>
        <p className="mt-2 text-sm font-medium text-[#1A1A18]/65">Choose how you want to track this issue in your profile.</p>

        <div className="mt-4 rounded-xl border border-[#1A1A18]/10 bg-white/60 p-4">
          <p className="text-sm font-semibold text-[#1A1A18]">{issue.title}</p>
          <p className="mt-1 text-xs font-medium text-[#1A1A18]/55">{issue.repo?.name}</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {options.map((option) => {
            const selected = status === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => onStatusChange(option)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selected ? 'border-[#2D6A4F] bg-[#2D6A4F] text-[#F7F5F0]' : 'border-[#1A1A18]/15 bg-white/55 text-[#1A1A18]/70 hover:border-[#2D6A4F] hover:text-[#2D6A4F]'}`}
              >
                {option}
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-md border border-[#1A1A18]/15 px-4 text-sm font-semibold text-[#1A1A18]/65 transition hover:border-[#1A1A18]/25"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(status)}
            className="h-11 flex-1 rounded-md bg-[#2D6A4F] px-4 text-sm font-bold text-[#F7F5F0] transition hover:bg-[#24583F]"
          >
            Save bookmark
          </button>
        </div>
      </div>
    </div>
  )
}

function GlobalFooter({ onNavigate }) {
  return (
    <footer className="relative overflow-hidden border-t border-[#1A1A18]/10 bg-[#FAF8F3] text-[#1A1A18]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,106,79,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(198,163,100,0.08),transparent_28%)]"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-14 sm:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1.25fr] lg:items-start">
          <section className="max-w-xl space-y-5">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#1A1A18]/40">
              Qurate
            </p>
            <h2 className="max-w-md [font-family:Georgia,serif] text-3xl font-bold leading-tight tracking-normal sm:text-4xl">
              Embrace the future of open source with a smarter way to contribute.
            </h2>
          </section>

          <section className="flex flex-col items-start justify-between gap-8 lg:items-end">
            <div className="w-full max-w-3xl select-none text-left [font-family:Georgia,serif] text-[clamp(4.5rem,13vw,10rem)] font-bold leading-[0.82] tracking-[-0.08em] text-[#1A1A18]/8 sm:text-right">
              <span className="block">Qurate</span>
            </div>
          </section>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#1A1A18]/10 pt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#1A1A18]/42 sm:flex-row sm:items-center sm:justify-between">
          <p>© Qurate</p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button type="button" onClick={() => onNavigate?.('privacy')} className="transition hover:text-[#2D6A4F]">
              Privacy Policy
            </button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={() => onNavigate?.('terms')} className="transition hover:text-[#2D6A4F]">
              Terms &amp; Conditions
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default App
