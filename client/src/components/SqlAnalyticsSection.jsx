import { useState, useEffect } from 'react'

const RAW_API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '')
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, '')

export default function SqlAnalyticsSection() {
  const [leaderboard, setLeaderboard] = useState([])
  const [repositories, setRepositories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchSqlData() {
      try {
        setLoading(true)
        const [resLeaderboard, resRepos] = await Promise.all([
          fetch(`${API_BASE_URL}/api/analytics/sql/leaderboard`),
          fetch(`${API_BASE_URL}/api/analytics/sql/repositories`),
        ])
        const dataLeaderboard = await resLeaderboard.json()
        const dataRepos = await resRepos.json()

        if (dataLeaderboard.leaderboard) setLeaderboard(dataLeaderboard.leaderboard)
        if (dataRepos.repositories) setRepositories(dataRepos.repositories)
      } catch (err) {
        setError(err.message || 'Failed to load relational SQL analytics.')
      } finally {
        setLoading(false)
      }
    }
    fetchSqlData()
  }, [])

  return (
    <div className="mt-8 rounded-xl border border-[#1A1A18]/10 bg-white/70 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1A1A18]/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="[font-family:Georgia,serif] text-xl font-bold text-[#1A1A18]">
              Relational SQL Analytics
            </h2>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-800">
              SQL JOINs & PK/FK Schema
            </span>
          </div>
          <p className="mt-1 text-xs text-[#1A1A18]/55">
            Querying SQLite relational database with multi-table <code className="rounded bg-black/5 px-1 py-0.5 font-mono">LEFT JOIN</code> and <code className="rounded bg-black/5 px-1 py-0.5 font-mono">INNER JOIN</code> operations.
          </p>
        </div>
      </div>

      {loading && (
        <div className="py-8 text-center text-xs text-[#1A1A18]/50">
          Loading relational queries...
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md border border-red-700/20 bg-red-700/10 p-3 text-xs text-red-800">
          {error}
        </div>
      )}

      {!loading && (
        <div className="mt-6 space-y-6">
          {/* Contributor Leaderboard via SQL JOIN */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A18]/60">
              🏆 Contributor Leaderboard (SQL Multi-Table JOIN)
            </h3>
            <div className="mt-3 overflow-x-auto rounded-lg border border-[#1A1A18]/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F5F0] text-[#1A1A18]/70">
                  <tr>
                    <th className="px-4 py-2.5 font-bold">User (PK)</th>
                    <th className="px-4 py-2.5 font-bold">Experience</th>
                    <th className="px-4 py-2.5 font-bold">Total PRs</th>
                    <th className="px-4 py-2.5 font-bold">Merged PRs</th>
                    <th className="px-4 py-2.5 font-bold">Active Repositories (FK Joined)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A18]/10 bg-white">
                  {leaderboard.map((row) => (
                    <tr key={row.user_id} className="hover:bg-[#F7F5F0]/50 transition">
                      <td className="px-4 py-3 font-semibold text-[#1A1A18]">
                        @{row.username}
                      </td>
                      <td className="px-4 py-3 capitalize text-[#1A1A18]/70">
                        {row.experience_level}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-[#1A1A18]">
                        {row.total_contributions}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-[#2D6A4F]">
                        {row.merged_prs}
                      </td>
                      <td className="px-4 py-3 text-[#1A1A18]/60">
                        {row.active_repositories || 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Repository Aggregate Stats via SQL GROUP BY and JOIN */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A18]/60">
              📦 Tracked Repositories (SQL GROUP BY & Aggregation)
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {repositories.map((repo) => (
                <div
                  key={repo.repo_id}
                  className="rounded-lg border border-[#1A1A18]/10 bg-white p-4 shadow-sm"
                >
                  <p className="truncate font-mono text-xs font-bold text-[#1A1A18]">
                    {repo.repo_name}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#1A1A18]/60">
                    <span>{repo.primary_language}</span>
                    <span>★ {repo.stars_count?.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 border-t border-[#1A1A18]/5 pt-2 text-[11px] text-[#2D6A4F] font-semibold">
                    {repo.tracked_contributions} contributions tracked
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
