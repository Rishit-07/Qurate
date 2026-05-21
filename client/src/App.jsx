import { useEffect, useState } from 'react'
import './App.css'
import AuthPage from './pages/AuthPage.jsx'
import BookmarkPage from './pages/BookmarkPage.jsx'
import DiscoverPage from './pages/DiscoverPage.jsx'
import DiscoveryFeed from './pages/DiscoveryFeed.jsx'
import Profile from './pages/Profile.jsx'

const BOOKMARKS_STORAGE_KEY = 'qurateBookmarks'
const CONTRIBUTION_STATUS_OPTIONS = ['merged', 'submitted', 'planned']
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function App() {
  const [view, setView] = useState(() =>
    localStorage.getItem('qurateToken') ? 'feed' : 'auth',
  )
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('qurateUser')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [bookmarks, setBookmarks] = useState(() => {
    const savedBookmarks = localStorage.getItem(BOOKMARKS_STORAGE_KEY)
    return savedBookmarks ? JSON.parse(savedBookmarks) : []
  })
  const [pendingBookmarkIssue, setPendingBookmarkIssue] = useState(null)
  const [bookmarkStatus, setBookmarkStatus] = useState('planned')
  const [contributionRefreshKey, setContributionRefreshKey] = useState(0)

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
    setView(nextView)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(nextBookmarks))
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
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(nextBookmarks))
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
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(nextBookmarks))
        return nextBookmarks
      })
      await removeContribution(issue)
      return
    }

    openBookmarkStatusPicker(issue)
  }

  let activeView = <AuthPage onLogin={handleLogin} />

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
  }

  return (
    <>
      {activeView}
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
    </>
  )
}

function getIssueId(issue) {
  return issue._id || issue.github_id
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

export default App
