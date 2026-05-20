import { useEffect, useMemo, useState } from 'react'

function formatDate(d) {
  return d.toISOString().slice(0, 10)
}

function generateDeterministicCounts(seed, days = 365) {
  // simple LCG for deterministic pseudo-random
  let s = 0
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) | 0

  const counts = {}
  let max = 0
  for (let i = 0; i < days; i++) {
    s = (s * 1664525 + 1013904223) | 0
    const v = Math.abs(s) % 5 // 0-4 contributions
    const date = new Date()
    date.setDate(date.getDate() - (days - i - 1))
    counts[formatDate(date)] = v
    if (v > max) max = v
  }

  return { counts, max }
}

export default function Profile({ onNavigate, onSignOut }) {
  const [user, setUser] = useState(null)
  const [stacksInput, setStacksInput] = useState('')
  const [githubUser, setGithubUser] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // try server endpoint first
      try {
        const res = await fetch('/api/users/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          setLoading(false)
          return
        }
      } catch (e) {
        console.debug('Failed to fetch /api/users/me', e)
      }

      const saved = localStorage.getItem('qurateUser')
      if (saved) {
        setUser(JSON.parse(saved))
      } else {
        setUser({ username: 'Rishi', email: 'rishi@example.com', stack: ['react','node.js'], experienceLevel: 'beginner', contributions: [] })
      }
      setLoading(false)
    }

    load()
  }, [])

  const contributionData = useMemo(() => {
    if (!user) return { counts: {}, max: 0, total: 0 }

    const contribs = user.contributions || []
    if (contribs.length) {
      const counts = {}
      let max = 0
      contribs.forEach((c) => {
        const d = c.date ? formatDate(new Date(c.date)) : formatDate(new Date())
        counts[d] = (counts[d] || 0) + 1
        max = Math.max(max, counts[d])
      })
      const total = contribs.length
      return { counts, max, total }
    }

    const seed = user.email || user.username || 'anon'
    return generateDeterministicCounts(seed, 365)
  }, [user])

  function addStack() {
    if (!stacksInput.trim()) return
    const next = { ...user, stack: [...(user.stack || []), stacksInput.trim()] }
    setUser(next)
    setStacksInput('')
    localStorage.setItem('qurateUser', JSON.stringify(next))
  }

  function saveProfile() {
    localStorage.setItem('qurateUser', JSON.stringify(user))
    alert('Profile saved locally')
  }

  async function importFromGithub() {
    if (!githubUser.trim()) return alert('Enter GitHub username')
    try {
      const res = await fetch(`/api/github/contributions?username=${encodeURIComponent(githubUser.trim())}`)
      const data = await res.json()
      if (!res.ok) return alert(data.error || 'Failed to fetch from GitHub')

      // convert counts map to contributions array
      const contributions = Object.keys(data.counts).map((date) => ({ date, count: data.counts[date] }))
      const next = { ...user, contributions, github: githubUser.trim() }
      setUser(next)
      localStorage.setItem('qurateUser', JSON.stringify(next))
      alert('Imported contributions from GitHub')
    } catch (err) {
      alert('Error importing from GitHub: ' + err.message)
    }
  }

  const totalContribs = useMemo(() => {
    if (!user) return 0
    if (user.contributions && user.contributions.length) return user.contributions.length
    return Object.values(contributionData.counts || {}).reduce((a, b) => a + b, 0)
  }, [user, contributionData])

  const mergedCount = useMemo(() => {
    if (!user) return 0
    if (user.contributions && user.contributions.length) return user.contributions.filter(c => c.status === 'merged').length
    return Math.floor(totalContribs * 0.6)
  }, [user, totalContribs])

  if (loading) return <div className="p-8">Loading profile...</div>

  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#1A1A18] p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-lg border bg-white/60 p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[#EEF6EE] flex items-center justify-center text-xl font-bold">{(user.username||'R').charAt(0)}</div>
            <div>
              <h2 className="text-2xl font-semibold">{user.username}</h2>
              <p className="text-sm text-[#1A1A18]/70">{user.email}</p>
            </div>
            <div className="ml-auto">
              <button onClick={() => onNavigate('feed')} className="rounded-md border px-3 py-1">Back</button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-md border p-4 bg-white">
              <h3 className="text-sm font-semibold">Contribution activity</h3>
              <div className="mt-3">
                <div className="grid grid-cols-52 gap-1 overflow-auto py-2">
                  {/* simple heatmap: render last 52 weeks x 7 days */}
                  {(() => {
                    const cells = []
                    const dates = []
                    const today = new Date()
                    // generate 52 weeks * 7 days = 364 days
                    for (let i = 0; i < 364; i++) {
                      const d = new Date()
                      d.setDate(today.getDate() - (363 - i))
                      dates.push(formatDate(d))
                    }

                    const max = contributionData.max || 4
                    dates.forEach((dt, idx) => {
                      const v = contributionData.counts[dt] || 0
                      const intensity = v === 0 ? 'bg-white/80' : v >= max ? 'bg-[#24583F]' : `bg-[#2D6A4F]/${40 + v * 10}`
                      cells.push(
                        <div key={dt + idx} className={`h-3 w-3 rounded-sm ${intensity}`} title={`${dt}: ${v} contributions`} />
                      )
                    })

                    return cells
                  })()}
                </div>
                <div className="mt-3 flex gap-4 text-sm">
                  <div><strong>{totalContribs}</strong> total</div>
                  <div><strong>{(mergedCount / Math.max(1, totalContribs) * 100).toFixed(0)}%</strong> success rate</div>
                </div>
              </div>
            </div>

            <div className="rounded-md border p-4 bg-white">
              <h3 className="text-sm font-semibold">Profile settings</h3>
              <div className="mt-3">
                <label className="block text-xs text-[#1A1A18]/70">Your stack</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(user.stack || []).map((s, i) => (
                    <span key={s + i} className="rounded-full border px-3 py-1 text-xs">{s}</span>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <input value={stacksInput} onChange={(e) => setStacksInput(e.target.value)} className="flex-1 rounded-md border px-3 py-1" placeholder="Add stack" />
                  <button onClick={addStack} className="rounded-md bg-[#2D6A4F] px-3 py-1 text-white">Add</button>
                </div>

                <div className="mt-4">
                  <label className="block text-xs text-[#1A1A18]/70">Experience level</label>
                  <select value={user.experienceLevel || 'beginner'} onChange={(e) => setUser({...user, experienceLevel: e.target.value})} className="mt-2 rounded-md border px-3 py-1">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="mt-4">
                  <label className="block text-xs text-[#1A1A18]/70">GitHub username</label>
                  <div className="mt-2 flex gap-2">
                    <input value={githubUser} onChange={(e) => setGithubUser(e.target.value)} placeholder="github username" className="flex-1 rounded-md border px-3 py-1" />
                    <button onClick={importFromGithub} className="rounded-md border px-3 py-1">Import</button>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={saveProfile} className="rounded-md bg-[#2D6A4F] px-4 py-2 text-white">Save changes</button>
                  <button onClick={onSignOut} className="rounded-md border px-4 py-2">Sign out</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
