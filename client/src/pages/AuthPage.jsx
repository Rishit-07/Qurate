import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'

const RAW_API_BASE =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '')
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, '')
const stackOptions = ['React', 'Node.js', 'Python', 'Vue', 'MongoDB']
const initialForm = {
  username: '',
  email: '',
  password: '',
  experienceLevel: 'beginner',
}

function AuthPage({ onLogin, onNavigate }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()

  // Route Parameters Management:
  // Reads query parameter ?mode=login or ?mode=register from URL for deep linking
  const queryMode = searchParams.get('mode')
  const [mode, setMode] = useState(() => {
    return queryMode === 'login' || queryMode === 'reset' ? queryMode : 'register'
  })

  // Synchronize route parameters with authentication mode
  useEffect(() => {
    if (queryMode && ['register', 'login', 'reset', 'change-email'].includes(queryMode)) {
      setMode(queryMode)
    }
  }, [queryMode])

  const [selectedStack, setSelectedStack] = useState(['React', 'Node.js'])
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimer = useRef(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetMsg, setResetMsg] = useState({ type: '', message: '' })
  const [changeNewEmail, setChangeNewEmail] = useState('')
  const [changeEmailMsg, setChangeEmailMsg] = useState({ type: '', message: '' })

  // GitHub Auth states
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const [githubError, setGithubError] = useState('')
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false)
  const [customGithubUser, setCustomGithubUser] = useState('')
  const [previewUser, setPreviewUser] = useState(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  // Handle OAuth code exchange if redirected from GitHub
  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) return

    let cancelled = false
    async function exchangeOAuthCode() {
      setIsGithubLoading(true)
      setGithubError('')
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/github`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'GitHub authorization failed')
        if (!cancelled) {
          onLogin(data.user, data.token)
        }
      } catch (err) {
        if (!cancelled) {
          setGithubError(err.message || 'GitHub authorization failed')
          setStatus({ type: 'error', message: err.message || 'GitHub authorization failed' })
        }
      } finally {
        if (!cancelled) {
          setIsGithubLoading(false)
          searchParams.delete('code')
          setSearchParams(searchParams, { replace: true })
        }
      }
    }

    exchangeOAuthCode()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  // Look up GitHub public user profile
  async function fetchPreview(username) {
    const clean = (username || '').trim()
    if (!clean) {
      setPreviewUser(null)
      setPreviewError('')
      return
    }
    setIsPreviewLoading(true)
    setPreviewError('')
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(clean)}`)
      if (!res.ok) {
        if (res.status === 404) throw new Error(`@${clean} not found on GitHub`)
        throw new Error('Could not find GitHub user')
      }
      const data = await res.json()
      setPreviewUser(data)
    } catch (err) {
      setPreviewUser(null)
      setPreviewError(err.message)
    } finally {
      setIsPreviewLoading(false)
    }
  }

  // Complete GitHub authentication
  async function completeGithubLogin(payload) {
    try {
      setIsGithubLoading(true)
      setGithubError('')
      const res = await fetch(`${API_BASE_URL}/api/auth/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'GitHub login failed')
      setIsGithubModalOpen(false)
      onLogin(data.user, data.token)
    } catch (err) {
      setGithubError(err.message || 'GitHub login failed')
    } finally {
      setIsGithubLoading(false)
    }
  }

  // Handle "Continue with GitHub" button click
  function handleGithubButtonClick() {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    if (clientId) {
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth`)
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user,user:email&redirect_uri=${redirectUri}`
      return
    }
    setGithubError('')
    setIsGithubModalOpen(true)
  }

  const isRegistering = mode === 'register'

  function updateForm(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handlePasswordInput(event) {
    updateForm(event)
    setIsTyping(true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => setIsTyping(false), 800)
  }

  function toggleShowPassword() {
    setShowPassword((s) => !s)
  }

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current)
    }
  }, [])

 

  function toggleStack(tech) {
    setSelectedStack((current) =>
      current.includes(tech)
        ? current.filter((item) => item !== tech)
        : [...current, tech],
    )
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setSearchParams({ mode: nextMode })
    setStatus({ type: '', message: '' })
  }


  async function handleAuthSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    setIsSubmitting(true)

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login'
    const payload = isRegistering
      ? {
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          stack: selectedStack.map((tech) => tech.toLowerCase()),
          experienceLevel: form.experienceLevel,
        }
      : {
          email: form.email.trim(),
          password: form.password,
        }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok) {
        const message =
          data.message === 'Email already exists'
            ? 'Account already exists'
            : data.message || data.error || 'Authentication failed'

        throw new Error(message)
      }

      if (isRegistering) {
        setStatus({
          type: 'success',
          message: 'Account created successfully. Please sign in.',
        })
        setMode('login')
        setForm((current) => ({ ...current, username: '', password: '' }))
      } else {
        setStatus({ type: 'success', message: 'Signed in successfully.' })
        onLogin(data.user, data.token)
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message:
          error.message ||
          'Could not reach the server. Check that the backend is running.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#1A1A18] antialiased">
      <nav className="fixed inset-x-0 top-0 z-20 border-b border-[#1A1A18]/10 bg-[#F7F5F0]/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
          <button
            type="button"
            onClick={() => onNavigate?.('auth')}
            className="[font-family:Georgia,serif] text-xl italic tracking-normal text-[#1A1A18]"
          >
            Qurate
          </button>
          <div className="flex items-center gap-8 text-sm font-medium">
            <button type="button" onClick={() => onNavigate?.('auth')} className="transition hover:text-[#2D6A4F]">
              Home
            </button>
            <button type="button" onClick={() => onNavigate?.('about')} className="transition hover:text-[#2D6A4F]">
              About
            </button>
            <button type="button" onClick={() => switchMode('login')} className="transition hover:text-[#2D6A4F]">
              Sign in
            </button>
          </div>
        </div>
      </nav>

      <section
        id="top"
        className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center border-x border-[#1A1A18]/10 px-6 pt-20 text-center"
      >
        <p className="mb-7 text-xs font-bold uppercase tracking-[0.22em] text-[#1A1A18]/55">
          Open source, made personal
        </p>

        <h1 className="max-w-3xl [font-family:Georgia,serif] text-5xl font-bold leading-[1.05] tracking-normal text-[#1A1A18] sm:text-6xl md:text-7xl">
          Find issues that match{' '}
          <span className="block italic text-[#2D6A4F]">
            your exact stack.
          </span>
        </h1>

        <p className="mt-8 max-w-xl text-base font-medium leading-7 text-[#1A1A18]/65 sm:text-lg">
          Stop searching blindly. Get GitHub issues scored by AI for your skill
          level and tech stack.
        </p>

        <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row">
          <a
            href="#auth"
            onClick={() => switchMode('register')}
            className="inline-flex h-12 min-w-40 items-center justify-center rounded-md border border-[#2D6A4F] bg-[#2D6A4F] px-6 text-sm font-semibold text-[#F7F5F0] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#24583F] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:ring-offset-2 focus:ring-offset-[#F7F5F0]"
          >
            Get started free
          </a>
          <a
            href="#auth"
            onClick={() => switchMode('login')}
            className="inline-flex h-12 min-w-32 items-center justify-center rounded-md border border-[#1A1A18]/15 px-6 text-sm font-semibold text-[#1A1A18] transition hover:-translate-y-0.5 hover:border-[#2D6A4F] hover:text-[#2D6A4F] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:ring-offset-2 focus:ring-offset-[#F7F5F0]"
          >
            Sign in
          </a>
        </div>

        <a
          href="#auth"
          className="scroll-cue group absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#1A1A18]/50 transition hover:text-[#2D6A4F]"
        >
          <span className="opacity-0 transition duration-300 group-hover:opacity-100">
            scroll to sign in
          </span>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1A1A18]/65 text-[#F7F5F0] shadow-lg transition group-hover:bg-[#2D6A4F]">
            <span className="scroll-arrow" aria-hidden="true" />
          </span>
        </a>
      </section>

      <section
        id="auth"
        className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center border-x border-t border-[#1A1A18]/10 px-6 py-20"
      >
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="[font-family:Georgia,serif] text-3xl italic tracking-normal text-[#1A1A18]">
              Qurate
            </p>
            <p className="mt-2 text-sm font-medium text-[#1A1A18]/60">
              {isRegistering ? 'Create your account' : 'Welcome back'}
            </p>
          </div>

          {mode !== 'forgot' && (
          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {isRegistering && (
              <label className="block text-left">
                <span className="text-sm font-medium text-[#1A1A18]/70">
                  Username
                </span>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={updateForm}
                  required
                  className="mt-2 h-12 w-full rounded-md border border-[#1A1A18]/20 bg-white/65 px-4 text-sm text-[#1A1A18] outline-none transition placeholder:text-[#1A1A18]/35 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
                  placeholder="Enter a username"
                />
              </label>
            )}

            <label className="block text-left">
              <span className="text-sm font-medium text-[#1A1A18]/70">
                Email
              </span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateForm}
                required
                className="mt-2 h-12 w-full rounded-md border border-[#1A1A18]/20 bg-white/65 px-4 text-sm text-[#1A1A18] outline-none transition placeholder:text-[#1A1A18]/35 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-left">
              <span className="text-sm font-medium text-[#1A1A18]/70">
                Password
              </span>
              <div className="relative mt-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handlePasswordInput}
                  required
                  minLength={6}
                  className="h-12 w-full rounded-md border border-[#1A1A18]/20 bg-white/65 px-4 pr-12 text-sm text-[#1A1A18] outline-none transition placeholder:text-[#1A1A18]/35 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
                  placeholder="Enter your password"
                />

                <button
                  type="button"
                  onClick={toggleShowPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md border border-transparent bg-white/40 text-sm text-[#1A1A18] transition ${isTyping ? 'animate-pulse scale-105' : 'hover:bg-white/60'}`}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3-11-8 1.09-2.79 2.95-5.06 5.2-6.56" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {!isRegistering && (
                <div className="mt-2 text-right">
                  <button type="button" onClick={() => switchMode('forgot')} className="text-xs font-semibold text-[#2D6A4F] underline underline-offset-2 transition hover:text-[#24583F]">Forgot password?</button>
                </div>
              )}
            </label>



            {isRegistering && (
              <>
                <div className="text-left">
                  <p className="text-sm font-medium text-[#1A1A18]/70">
                    Your stack
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {stackOptions.map((tech) => {
                      const selected = selectedStack.includes(tech)

                      return (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => toggleStack(tech)}
                          className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                            selected
                              ? 'border-[#2D6A4F] bg-[#2D6A4F]/10 text-[#2D6A4F]'
                              : 'border-[#1A1A18]/15 bg-white/45 text-[#1A1A18]/65 hover:border-[#2D6A4F] hover:text-[#2D6A4F]'
                          }`}
                        >
                          {tech}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <label className="block text-left">
                  <span className="text-sm font-medium text-[#1A1A18]/70">
                    Experience level
                  </span>
                  <select
                    name="experienceLevel"
                    value={form.experienceLevel}
                    onChange={updateForm}
                    className="mt-2 h-12 w-full rounded-md border border-[#1A1A18]/20 bg-white/65 px-4 text-sm text-[#1A1A18] outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>
              </>
            )}

            {status.message && (
              <p
                className={`rounded-md border px-4 py-3 text-sm font-medium ${
                  status.type === 'success'
                    ? 'border-[#2D6A4F]/25 bg-[#2D6A4F]/10 text-[#2D6A4F]'
                    : 'border-red-700/20 bg-red-700/10 text-red-800'
                }`}
              >
                {status.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-md bg-[#2D6A4F] px-5 text-sm font-bold text-[#F7F5F0] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#24583F] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:ring-offset-2 focus:ring-offset-[#F7F5F0] disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0"
            >
              {isSubmitting
                ? 'Please wait...'
                : isRegistering
                  ? 'Create account'
                  : 'Sign in'}
            </button>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#1A1A18]/10" /></div>
              <span className="relative bg-[#F7F5F0] px-3 text-xs font-semibold text-[#1A1A18]/45">OR</span>
            </div>

            <button
              type="button"
              disabled={isSubmitting || isGithubLoading}
              onClick={handleGithubButtonClick}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-[#1A1A18]/20 bg-white/70 px-5 text-sm font-bold text-[#1A1A18] shadow-sm transition hover:bg-white hover:border-[#1A1A18]/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGithubLoading ? (
                <svg className="h-5 w-5 animate-spin text-[#1A1A18]/70" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              )}
              {isGithubLoading ? 'Connecting to GitHub...' : 'Continue with GitHub'}
            </button>

            {githubError && (
              <p className="mt-2.5 rounded-md border border-red-700/20 bg-red-700/10 px-3.5 py-2.5 text-left text-xs font-medium text-red-800">
                {githubError}
              </p>
            )}
          </form>
          )}

          {mode === 'forgot' && (
            <div className="rounded-md border px-4 py-4 text-sm text-left">
              <p className="mb-3 text-sm">Reset your password (enter your account email and the new password).</p>
              <div>
                <label className="block text-left">
                  <span className="text-sm font-medium text-[#1A1A18]/70">Email</span>
                  <input type="email" name="email" value={form.email} onChange={updateForm} required className="mt-2 h-12 w-full rounded-md border border-[#1A1A18]/20 bg-white/65 px-4 text-sm text-[#1A1A18] outline-none transition placeholder:text-[#1A1A18]/35 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20" placeholder="you@example.com" />
                </label>
                <label className="block text-left mt-3">
                  <span className="text-sm font-medium text-[#1A1A18]/70">New password</span>
                  <input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} className="mt-2 h-12 w-full rounded-md border border-[#1A1A18]/20 bg-white/65 px-4 text-sm text-[#1A1A18] outline-none" placeholder="Enter new password" />
                </label>
                <label className="block text-left mt-3">
                  <span className="text-sm font-medium text-[#1A1A18]/70">Confirm password</span>
                  <input type="password" value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} className="mt-2 h-12 w-full rounded-md border border-[#1A1A18]/20 bg-white/65 px-4 text-sm text-[#1A1A18] outline-none" placeholder="Repeat new password" />
                </label>
                <div className="mt-3 flex gap-3">
                  <button type="button" onClick={async () => {
                    setResetMsg({ type: '', message: '' })
                    if (!form.email || !form.email.trim()) { setResetMsg({ type: 'error', message: 'Enter your email.' }); return }
                    if (!resetPassword || resetPassword.length < 6) { setResetMsg({ type: 'error', message: 'Password must be at least 6 characters.' }); return }
                    if (resetPassword !== resetConfirm) { setResetMsg({ type: 'error', message: 'Passwords do not match.' }); return }
                    setIsSubmitting(true)
                    try {
                      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email.trim(), password: resetPassword }) })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data.message || data.error || 'Reset failed')
                      setResetMsg({ type: 'success', message: data.message || 'Password reset successful. Please sign in.' })
                      setMode('login')
                      setResetPassword('')
                      setResetConfirm('')
                    } catch (err) {
                      setResetMsg({ type: 'error', message: err.message || 'Could not reset password.' })
                    } finally {
                      setIsSubmitting(false)
                    }
                  }} className="h-11 rounded-md bg-[#2D6A4F] px-4 text-sm font-semibold text-[#F7F5F0]">Reset password</button>
                  <button type="button" onClick={() => { setResetPassword(''); setResetConfirm(''); setResetMsg({ type: '', message: '' }) }} className="h-11 rounded-md border px-4 text-sm font-semibold">Clear</button>
                </div>
                {resetMsg.message && <p className={`mt-3 rounded-md border px-4 py-3 text-sm font-medium ${resetMsg.type === 'success' ? 'border-[#2D6A4F]/25 bg-[#2D6A4F]/10 text-[#2D6A4F]' : 'border-red-700/20 bg-red-700/10 text-red-800'}`}>{resetMsg.message}</p>}
              </div>

              <div className="mt-6 rounded-md border-t pt-4">
                <p className="mb-3 text-sm">Change account email (enter current email and the new email).</p>
                <label className="block text-left">
                  <span className="text-sm font-medium text-[#1A1A18]/70">Current email</span>
                  <input type="email" name="email" value={form.email} onChange={updateForm} required className="mt-2 h-12 w-full rounded-md border border-[#1A1A18]/20 bg-white/65 px-4 text-sm text-[#1A1A18] outline-none" placeholder="you@example.com" />
                </label>
                <label className="block text-left mt-3">
                  <span className="text-sm font-medium text-[#1A1A18]/70">New email</span>
                  <input type="email" value={changeNewEmail} onChange={e => setChangeNewEmail(e.target.value)} className="mt-2 h-12 w-full rounded-md border border-[#1A1A18]/20 bg-white/65 px-4 text-sm text-[#1A1A18] outline-none" placeholder="new-email@example.com" />
                </label>
                <div className="mt-3 flex gap-3">
                  <button type="button" onClick={async () => {
                    setChangeEmailMsg({ type: '', message: '' })
                    if (!form.email || !form.email.trim()) { setChangeEmailMsg({ type: 'error', message: 'Enter your current email.' }); return }
                    if (!changeNewEmail || !changeNewEmail.trim()) { setChangeEmailMsg({ type: 'error', message: 'Enter the new email.' }); return }
                    setIsSubmitting(true)
                    try {
                      const res = await fetch(`${API_BASE_URL}/api/auth/change-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email.trim(), newEmail: changeNewEmail.trim() }) })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data.message || data.error || 'Change email failed')
                      setChangeEmailMsg({ type: 'success', message: data.message || 'Email updated.' })
                      setChangeNewEmail('')
                    } catch (err) {
                      setChangeEmailMsg({ type: 'error', message: err.message || 'Could not update email.' })
                    } finally {
                      setIsSubmitting(false)
                    }
                  }} className="h-11 rounded-md bg-[#2D6A4F] px-4 text-sm font-semibold text-[#F7F5F0]">Update email</button>
                  <button type="button" onClick={() => { setChangeNewEmail(''); setChangeEmailMsg({ type: '', message: '' }) }} className="h-11 rounded-md border px-4 text-sm font-semibold">Clear</button>
                </div>
                {changeEmailMsg.message && <p className={`mt-3 rounded-md border px-4 py-3 text-sm font-medium ${changeEmailMsg.type === 'success' ? 'border-[#2D6A4F]/25 bg-[#2D6A4F]/10 text-[#2D6A4F]' : 'border-red-700/20 bg-red-700/10 text-red-800'}`}>{changeEmailMsg.message}</p>}
                <div className="mt-4">
                  <button type="button" onClick={() => onNavigate?.('auth')} className="h-11 rounded-md border border-[#1A1A18]/15 px-4 text-sm font-semibold">Back to home</button>
                </div>
              </div>
            </div>
          )}

          <p className="mt-5 text-center text-sm font-medium text-[#1A1A18]/60">
            {isRegistering ? 'Already have an account?' : 'New to Qurate?'}{' '}
            <button
              type="button"
              onClick={() => switchMode(isRegistering ? 'login' : 'register')}
              className="font-bold text-[#2D6A4F] underline underline-offset-4 transition hover:text-[#24583F]"
            >
              {isRegistering ? 'Sign in' : 'Create account'}
            </button>
          </p>
        </div>
      </section>

      {/* GitHub Connect / Quick Sign-in Modal */}
      {isGithubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A18]/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-[#1A1A18]/15 bg-[#F7F5F0] p-6 sm:p-8 shadow-2xl text-left">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setIsGithubModalOpen(false)
                setPreviewUser(null)
                setPreviewError('')
              }}
              className="absolute right-5 top-5 rounded-md p-1.5 text-[#1A1A18]/50 hover:bg-[#1A1A18]/10 hover:text-[#1A1A18] transition"
              aria-label="Close"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1A1A18] text-white">
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </div>
              <div>
                <h3 className="[font-family:Georgia,serif] text-xl font-bold text-[#1A1A18]">Connect with GitHub</h3>
                <p className="text-xs text-[#1A1A18]/60">Link your GitHub profile to personalize recommended issues and stats.</p>
              </div>
            </div>

            {/* Username Input & Lookup */}
            <div className="mt-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A18]/65">
                GitHub Username
              </label>
              <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-[#1A1A18]/40">@</span>
                  <input
                    type="text"
                    value={customGithubUser}
                    onChange={(e) => {
                      setCustomGithubUser(e.target.value)
                      setPreviewError('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        fetchPreview(customGithubUser)
                      }
                    }}
                    placeholder="e.g. torvalds or your username"
                    className="h-11 w-full rounded-md border border-[#1A1A18]/20 bg-white/80 pl-8 pr-4 text-sm text-[#1A1A18] outline-none transition placeholder:text-[#1A1A18]/35 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchPreview(customGithubUser)}
                  disabled={isPreviewLoading || !customGithubUser.trim()}
                  className="h-11 rounded-md border border-[#1A1A18]/20 bg-white px-4 text-xs font-bold text-[#1A1A18] hover:bg-[#1A1A18]/5 transition disabled:opacity-50"
                >
                  {isPreviewLoading ? 'Checking…' : 'Look up'}
                </button>
              </div>

              {/* Quick suggestions */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-xs text-[#1A1A18]/60">
                <span>Try:</span>
                {['torvalds', 'shadcn', 'yyx990803'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      setCustomGithubUser(u)
                      fetchPreview(u)
                    }}
                    className="rounded bg-white/70 border border-[#1A1A18]/10 px-2 py-0.5 text-xs font-medium text-[#2D6A4F] hover:border-[#2D6A4F] transition"
                  >
                    @{u}
                  </button>
                ))}
              </div>

              {previewError && (
                <p className="mt-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {previewError}
                </p>
              )}
            </div>

            {/* Profile Preview Card */}
            {previewUser && (
              <div className="mt-4 rounded-lg border border-[#2D6A4F]/30 bg-[#2D6A4F]/5 p-3.5 flex items-center gap-3.5">
                <img
                  src={previewUser.avatar_url}
                  alt={previewUser.login}
                  className="h-12 w-12 rounded-full border border-[#1A1A18]/10 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-bold text-[#1A1A18]">{previewUser.name || previewUser.login}</p>
                    <span className="text-[11px] font-semibold text-[#2D6A4F] bg-[#2D6A4F]/10 px-1.5 py-0.5 rounded">Verified</span>
                  </div>
                  <p className="truncate text-xs text-[#1A1A18]/60">@{previewUser.login} • {previewUser.public_repos || 0} public repos</p>
                  {previewUser.bio && <p className="truncate text-[11px] text-[#1A1A18]/50 italic mt-0.5">{previewUser.bio}</p>}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={async () => {
                  let userToLogin = previewUser
                  const username = (customGithubUser || '').trim()
                  if (!userToLogin && username) {
                    try {
                      setIsPreviewLoading(true)
                      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`)
                      if (res.ok) {
                        userToLogin = await res.json()
                        setPreviewUser(userToLogin)
                      }
                    } catch {
                      // ignore error and fallback
                    } finally {
                      setIsPreviewLoading(false)
                    }
                  }

                  const targetLogin = userToLogin?.login || username
                  if (!targetLogin) return

                  const payload = {
                    githubUsername: targetLogin,
                    githubUserData: {
                      login: targetLogin,
                      name: userToLogin?.name || targetLogin,
                      avatar_url: userToLogin?.avatar_url || 'https://avatars.githubusercontent.com/u/9919?v=4',
                      email: userToLogin?.email || `${targetLogin.toLowerCase()}@github.com`,
                    },
                  }
                  completeGithubLogin(payload)
                }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-4 text-sm font-bold text-[#F7F5F0] shadow-sm transition hover:bg-[#24583F] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGithubLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  `Sign in with @${previewUser?.login || customGithubUser.trim() || 'GitHub'}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default AuthPage
