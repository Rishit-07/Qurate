const clauses = [
  {
    title: 'Use the product responsibly',
    body:
      'Qurate is built for open source discovery and contribution tracking. Do not misuse the service, attempt to disrupt it, or use it in ways that conflict with the experience it provides.',
  },
  {
    title: 'Your account and content',
    body:
      'You are responsible for the accuracy of the information you provide, including your GitHub username, stack preferences, and bookmark labels.',
  },
  {
    title: 'Service changes',
    body:
      'We may adjust features, data refresh timing, or visual presentation as the product evolves. The app will continue to prioritize clarity and usefulness.',
  },
  {
    title: 'External services',
    body:
      'Some features depend on third-party APIs such as GitHub. Availability and data quality may vary based on those external services.',
  },
]

const promises = [
  'Keep the product focused on contribution discovery.',
  'Avoid excessive data collection.',
  'Present issue status clearly and honestly.',
  'Maintain a calm, readable experience across pages.',
]

function TermsBadge({ label }) {
  return (
    <span className="rounded-full border border-[#2D6A4F]/15 bg-[#2D6A4F]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#2D6A4F]">
      {label}
    </span>
  )
}

function TermsPage({ onNavigate }) {
  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#1A1A18] antialiased">
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
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => onNavigate('privacy')}
              className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]"
            >
              Privacy Policy
            </button>
            <button className="font-bold text-[#1A1A18]">Terms & Conditions</button>
          </div>
        </div>
      </nav>

      <section className="mx-auto w-full max-w-6xl border-x border-[#1A1A18]/10 px-6 py-14 sm:px-8">
        <div className="grid gap-14 pb-16 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div className="about-reveal">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#1A1A18]/45">
              Terms & Conditions
            </p>
            <h1 className="mt-5 max-w-2xl [font-family:Georgia,serif] text-5xl font-bold leading-[1.04] tracking-normal text-[#1A1A18] sm:text-6xl">
              Clear expectations for using Qurate.
            </h1>
            <p className="mt-7 max-w-xl text-base font-medium leading-8 text-[#1A1A18]/68 sm:text-lg">
              These terms describe how the app should be used, what you are responsible for, and how Qurate may evolve while staying centered on open source contribution discovery.
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
                onClick={() => onNavigate('privacy')}
                className="h-12 rounded-md border border-[#1A1A18]/15 px-6 text-sm font-semibold text-[#1A1A18]/70 transition hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
              >
                View privacy policy
              </button>
            </div>
          </div>

          <div className="about-illustration rounded-[2rem] border border-[#1A1A18]/10 bg-white/55 p-8 shadow-[0_20px_60px_rgba(26,26,24,0.08)]">
            <div className="rounded-[1.5rem] border border-[#1A1A18]/8 bg-gradient-to-b from-white/70 to-[#F1EBDD] p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#1A1A18]/8 bg-white/70 p-4">
                  <TermsBadge label="Responsible use" />
                  <p className="mt-4 text-sm leading-7 text-[#1A1A18]/65">
                    Use the app for discovery, bookmarking, and progress tracking rather than attempting to break or overload it.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1A1A18]/8 bg-white/70 p-4">
                  <TermsBadge label="Third-party data" />
                  <p className="mt-4 text-sm leading-7 text-[#1A1A18]/65">
                    Some screens depend on GitHub activity, repository metadata, and issue refresh data from external APIs.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#1A1A18]/8 bg-[#F7F5F0] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1A1A18]/40">
                  What we stand for
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {promises.map((promise) => (
                    <div key={promise} className="rounded-xl border border-[#1A1A18]/8 bg-white/65 px-4 py-3 text-sm leading-6 text-[#1A1A18]/70">
                      {promise}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 border-t border-[#1A1A18]/10 py-16 lg:grid-cols-2">
          {clauses.map((clause, index) => (
            <article
              key={clause.title}
              className="about-card rounded-2xl border border-[#1A1A18]/10 bg-white/55 p-6 shadow-sm"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#2D6A4F]/70">
                0{index + 1}
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#1A1A18]">{clause.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#1A1A18]/65">{clause.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default TermsPage
