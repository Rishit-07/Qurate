import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

/**
 * Client-side Routing: ProtectedRoute Component
 * Guards authenticated application views (e.g. /feed, /discover, /bookmarks, /profile).
 * Redirects unauthenticated users to /auth with return location state preserved.
 */
export function ProtectedRoute({ children }) {
  const location = useLocation()
  const token = localStorage.getItem('token') || localStorage.getItem('qurateToken')

  if (!token) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
