import { useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const stackOptions = ['React', 'Node.js', 'Python', 'Vue', 'MongoDB']
const initialForm = {
  username: '',
  email: '',
  password: '',
  experienceLevel: 'beginner',
}

function AuthPage({ onLogin, onNavigate }) {
  const [mode, setMode] = useState('register')
  const [selectedStack, setSelectedStack] = useState(['React', 'Node.js'])
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isRegistering = mode === 'register'

  function updateForm(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function toggleStack(tech) {
    setSelectedStack((current) =>
      current.includes(tech)
        ? current.filter((item) => item !== tech)
        : [...current, tech],
    )
  }

  function switchMode(nextMode) {
    setMode(nextMode)
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
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={updateForm}
                required
                minLength={6}
                className="mt-2 h-12 w-full rounded-md border border-[#1A1A18]/20 bg-white/65 px-4 text-sm text-[#1A1A18] outline-none transition placeholder:text-[#1A1A18]/35 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
                placeholder="Enter your password"
              />
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
          </form>

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
    </main>
  )
}

export default AuthPage
