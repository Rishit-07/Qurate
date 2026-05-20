import { useState } from 'react'
import './App.css'
import AuthPage from './pages/AuthPage.jsx'
import BookmarkPage from './pages/BookmarkPage.jsx'
import DiscoverPage from './pages/DiscoverPage.jsx'
import DiscoveryFeed from './pages/DiscoveryFeed.jsx'
import Profile from './pages/Profile.jsx'

const BOOKMARKS_STORAGE_KEY = 'qurateBookmarks'

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

  function toggleBookmark(issue) {
    setBookmarks((current) => {
      const issueId = getIssueId(issue)
      const isBookmarked = current.some((item) => getIssueId(item) === issueId)
      const nextBookmarks = isBookmarked
        ? current.filter((item) => getIssueId(item) !== issueId)
        : [issue, ...current]

      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(nextBookmarks))
      return nextBookmarks
    })
  }

  if (view === 'bookmarks') {
    return (
      <BookmarkPage
        bookmarks={bookmarks}
        onNavigate={handleViewChange}
        onSignOut={handleSignOut}
        onToggleBookmark={toggleBookmark}
      />
    )
  }

  if (view === 'discover') {
    return (
      <DiscoverPage
        bookmarks={bookmarks}
        onNavigate={handleViewChange}
        onSignOut={handleSignOut}
        onToggleBookmark={toggleBookmark}
      />
    )
  }

  if (view === 'feed') {
    return (
      <DiscoveryFeed
        user={user}
        bookmarks={bookmarks}
        onNavigate={handleViewChange}
        onSignOut={handleSignOut}
        onToggleBookmark={toggleBookmark}
      />
    )
  }

  if (view === 'profile') {
    return (
      <Profile
        onNavigate={handleViewChange}
        onSignOut={handleSignOut}
      />
    )
  }

  return <AuthPage onLogin={handleLogin} />
}

function getIssueId(issue) {
  return issue._id || issue.github_id
}

export default App
