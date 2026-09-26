import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Badge } from './Badge.jsx'

/**
 * React Component Composition: AppLayout Component
 * Composes the global header, navigation bar, toast notifications,
 * content children slot, and footer.
 */
export function Layout({
  children,
  user,
  bookmarksCount = 0,
  toast = null,
  onSignOut,
}) {
  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
      isActive
        ? 'bg-[#1A1A18]/5 text-[#2D6A4F] font-semibold'
        : 'text-[#1A1A18]/65 hover:text-[#1A1A18] hover:bg-[#1A1A18]/5'
    }`

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1A1A18] flex flex-col antialiased">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg border ${
              toast.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-sky-50 text-sky-800 border-sky-200'
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}

      {/* Global Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#1A1A18]/10 bg-[#F7F5F0]/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link
              to={user ? '/feed' : '/auth'}
              className="[font-family:Georgia,serif] text-2xl italic tracking-normal text-[#1A1A18]"
            >
              Qurate
            </Link>

            {user && (
              <nav className="hidden md:flex items-center gap-1">
                <NavLink to="/feed" className={navLinkClass}>
                  Feed
                </NavLink>
                <NavLink to="/discover" className={navLinkClass}>
                  Discover
                </NavLink>
                <NavLink to="/bookmarks" className={navLinkClass}>
                  Bookmarks
                  {bookmarksCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-[#2D6A4F]/15 px-1.5 py-0.2 text-[11px] font-bold text-[#2D6A4F]">
                      {bookmarksCount}
                    </span>
                  )}
                </NavLink>
                <NavLink to="/contributed-works" className={navLinkClass}>
                  Works
                </NavLink>
                <NavLink to="/profile" className={navLinkClass}>
                  Profile
                </NavLink>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-xs font-medium text-[#1A1A18]/80 hover:text-[#1A1A18]"
                >
                  <span className="h-7 w-7 rounded-full bg-[#2D6A4F]/15 text-[#2D6A4F] flex items-center justify-center font-bold">
                    {(user.username || 'U')[0].toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">{user.username}</span>
                </Link>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="text-xs text-[#1A1A18]/60 hover:text-red-700 transition-colors px-2 py-1"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-sm font-medium">
                <Link to="/about" className="text-[#1A1A18]/65 hover:text-[#2D6A4F]">
                  About
                </Link>
                <Link
                  to="/auth"
                  className="rounded-xl bg-[#2D6A4F] px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#22543d]"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Slot */}
      <main className="flex-1 w-full">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[#1A1A18]/8 bg-white/50 py-6 text-center text-xs text-[#1A1A18]/50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} Qurate — AI Open Source Discovery Engine</div>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-[#2D6A4F]">
              About
            </Link>
            <Link to="/privacy" className="hover:text-[#2D6A4F]">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-[#2D6A4F]">
              Terms
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default Layout
