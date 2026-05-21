const pillars = [
  {
    title: 'Understand intent',
    description:
      'We surface issues that fit your current stack, experience level, and learning goals instead of throwing a wall of links at you.',
  },
  {
    title: 'Respect the work',
    description:
      'Every issue is treated like a real collaboration opportunity, with context that helps you decide what to contribute next.',
  },
  {
    title: 'Move with clarity',
    description:
      'Fresh issues, bookmarks, and profile progress stay connected so you always know what changed and what is ready now.',
  },
]

const steps = [
  {
    title: 'Discover',
    description:
      'Search open source issues using your stack, difficulty preferences, and the kind of work you want to practice.',
  },
  {
    title: 'Bookmark',
    description:
      'Save interesting issues and mark them as planned, submitted, or merged so your progress is always visible.',
  },
  {
    title: 'Track',
    description:
      'Watch your profile update with contribution activity, GitHub history, and a clean overview of your journey.',
  },
]

function AboutGlyph({ kind }) {
  if (kind === 'discover') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#2D6A4F]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="M20 20l-3.5-3.5" />
        <path d="M8.5 11h5" />
        <path d="M11 8.5v5" />
      </svg>
    )
  }

  if (kind === 'bookmark') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#2D6A4F]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 4.75A1.75 1.75 0 0 1 8.75 3h6.5A1.75 1.75 0 0 1 17 4.75V21l-5-3-5 3V4.75Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#2D6A4F]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v18" />
      <path d="M4.5 14.5c2.4-1.7 4.2-2.5 7.5-2.5s5.1.8 7.5 2.5" />
      <path d="M6 18c1.3-1 2.9-1.5 6-1.5s4.7.5 6 1.5" />
      <circle cx="12" cy="8.5" r="2.2" />
    </svg>
  )
}

function IllustrationCard({ title, subtitle, kind, delay }) {
  return (
    <div
      className="about-float rounded-2xl border border-[#1A1A18]/8 bg-[#F7F5F0]/75 px-4 py-4 text-center shadow-[0_10px_30px_rgba(26,26,24,0.04)]"
      style={{ animationDelay: delay }}
    >
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-[#2D6A4F]/15 bg-[#2D6A4F]/10">
        <AboutGlyph kind={kind} />
      </div>
      <p className="text-sm font-bold text-[#1A1A18]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[#1A1A18]/55">{subtitle}</p>
    </div>
  )
}

function AboutPage({ onNavigate }) {
  return (
    <main className="about-shell min-h-screen bg-[#F7F5F0] text-[#1A1A18] antialiased">
      <nav className="sticky top-0 z-20 border-b border-[#1A1A18]/10 bg-[#F7F5F0]/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="[font-family:Georgia,serif] text-xl italic tracking-normal text-[#1A1A18]"
          >
            Qurate
          </button>

          <div className="flex items-center gap-8 text-sm font-medium">
            <button
              type="button"
              onClick={() => onNavigate('auth')}
              className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]"
            >
              Home
            </button>
            <button className="font-bold text-[#1A1A18]">About</button>
            <button
              type="button"
              onClick={() => onNavigate('auth')}
              className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]"
            >
              Sign in
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto w-full max-w-6xl border-x border-[#1A1A18]/10 px-6 py-14 sm:px-8">
        <div className="grid items-center gap-14 pb-16 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div className="about-reveal">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#1A1A18]/45">
              About Qurate
            </p>
            <h1 className="mt-5 max-w-2xl [font-family:Georgia,serif] text-5xl font-bold leading-[1.04] tracking-normal text-[#1A1A18] sm:text-6xl">
              A calmer way to find
              <span className="block italic text-[#2D6A4F]">open source work.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base font-medium leading-8 text-[#1A1A18]/68 sm:text-lg">
              Qurate helps you discover issues that fit your stack, keep track of what you save, and understand your contribution progress without making the experience feel crowded or generic.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('auth')}
                className="h-12 rounded-md bg-[#2D6A4F] px-6 text-sm font-bold text-[#F7F5F0] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#24583F]"
              >
                Back to home
              </button>
              <button
                type="button"
                onClick={() => onNavigate('auth')}
                className="h-12 rounded-md border border-[#1A1A18]/15 px-6 text-sm font-semibold text-[#1A1A18]/70 transition hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
              >
                Sign in
              </button>
            </div>
          </div>

          <div className="about-illustration relative mx-auto w-full max-w-md">
            <div className="absolute inset-x-10 top-10 h-56 rounded-full bg-[#2D6A4F]/10 blur-3xl about-pulse" />
            <div className="relative rounded-[2rem] border border-[#1A1A18]/10 bg-white/55 p-8 shadow-[0_20px_60px_rgba(26,26,24,0.08)]">
              <div className="mx-auto h-44 w-full rounded-[1.5rem] border border-[#1A1A18]/8 bg-gradient-to-b from-white/65 to-[#F1EBDD] p-5">
                <div className="relative flex h-full items-end justify-center">
                  <div className="absolute left-[12%] top-3 h-16 w-12 rounded-xl border border-[#1A1A18]/8 bg-white/70 shadow-sm about-shelf" />
                  <div className="absolute right-[14%] top-6 h-14 w-10 rounded-xl border border-[#1A1A18]/8 bg-white/70 shadow-sm about-shelf" />
                  <div className="absolute left-[50%] top-0 h-18 w-14 -translate-x-1/2 rounded-xl border border-[#1A1A18]/8 bg-white/70 shadow-sm about-shelf" />
                  <div className="absolute left-[20%] top-[30%] h-px w-[26%] bg-[#A7A090]/60" />
                  <div className="absolute right-[18%] top-[34%] h-px w-[22%] bg-[#A7A090]/60" />
                  <div className="absolute left-[34%] top-[50%] h-px w-[32%] bg-[#A7A090]/60" />

                  <div className="relative flex w-[88%] justify-center">
                    <div className="about-pulse absolute -top-1 h-32 w-32 rounded-full bg-[#2D6A4F]/10 blur-2xl" />
                    <svg viewBox="0 0 320 120" className="relative h-28 w-full" aria-hidden="true">
                      <path d="M22 95c22-16 52-25 84-25 18 0 36 3 54 10 16 6 32 9 48 9 23 0 45-7 68-22" fill="none" stroke="#A7A090" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 5" />
                      <path d="M268 21c10 6 16 15 16 27 0 11-5 20-15 27" fill="none" stroke="#A7A090" strokeWidth="1.2" strokeLinecap="round" />
                      <circle cx="267" cy="21" r="4" fill="#2D6A4F" opacity="0.45" />
                      <circle cx="254" cy="75" r="4" fill="#2D6A4F" opacity="0.45" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <IllustrationCard title="Discover" subtitle="Find issues worth your time." kind="discover" delay="0ms" />
                <IllustrationCard title="Bookmark" subtitle="Save work you want to return to." kind="bookmark" delay="120ms" />
                <IllustrationCard title="Grow" subtitle="See progress collect over time." kind="grow" delay="240ms" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-t border-[#1A1A18]/10 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div className="about-reveal">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#1A1A18]/45">
              Why it exists
            </p>
            <h2 className="mt-4 max-w-lg [font-family:Georgia,serif] text-4xl font-bold leading-tight text-[#1A1A18]">
              Built for focus, not for noise.
            </h2>
            <p className="mt-5 max-w-lg text-sm font-medium leading-7 text-[#1A1A18]/66 sm:text-base">
              Open source can feel overwhelming when every issue looks the same. Qurate keeps the experience grounded, readable, and useful with a design that makes room for your decisions.
            </p>
          </div>

          <div className="grid gap-4">
            {pillars.map((pillar, index) => (
              <article
                key={pillar.title}
                className="about-card rounded-2xl border border-[#1A1A18]/10 bg-white/55 p-5 shadow-sm"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2D6A4F]/15 bg-[#2D6A4F]/10">
                    <AboutGlyph kind={index === 0 ? 'discover' : index === 1 ? 'bookmark' : 'grow'} />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2D6A4F]/75">
                    0{index + 1}
                  </p>
                </div>
                <h3 className="mt-3 text-xl font-bold text-[#1A1A18]">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#1A1A18]/65">{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>

        <section className="border-t border-[#1A1A18]/10 py-16">
          <div className="text-center about-reveal">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#1A1A18]/45">
              How it works
            </p>
            <h2 className="mt-4 [font-family:Georgia,serif] text-4xl font-bold text-[#1A1A18] sm:text-5xl">
              Simple flow, thoughtful details.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="about-step rounded-[1.5rem] border border-[#1A1A18]/10 bg-white/60 p-6"
                style={{ animationDelay: `${index * 140}ms` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#2D6A4F]/15 bg-[#2D6A4F]/10">
                  <AboutGlyph kind={index === 0 ? 'discover' : index === 1 ? 'bookmark' : 'grow'} />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1A1A18]/40">
                  0{index + 1}
                </p>
                <h3 className="mt-4 text-2xl font-bold text-[#1A1A18]">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#1A1A18]/65">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-[#1A1A18]/10 py-16">
          <div className="grid gap-6 rounded-[2rem] border border-[#1A1A18]/10 bg-white/55 p-8 shadow-sm lg:grid-cols-[1fr_1fr] lg:gap-10">
            <div className="about-reveal">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#1A1A18]/45">
                Aesthetic, but useful
              </p>
              <h2 className="mt-4 [font-family:Georgia,serif] text-4xl font-bold text-[#1A1A18]">
                Designed to feel calm and deliberate.
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                'Warm neutral surfaces',
                'Soft motion and reveals',
                'Purposeful typography',
                'Clear contribution tracking',
              ].map((item, index) => (
                <div
                  key={item}
                  className="about-chip rounded-2xl border border-[#1A1A18]/10 bg-[#F7F5F0] px-4 py-4 text-sm font-semibold text-[#1A1A18]/70"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

export default AboutPage