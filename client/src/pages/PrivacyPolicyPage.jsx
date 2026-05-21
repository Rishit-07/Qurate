const sections = [
  {
    title: 'What we collect',
    body:
      'We keep the minimum needed to run Qurate well: account details, saved bookmarks, contribution status, and usage signals that help the app stay responsive and relevant.',
  },
  {
    title: 'How we use it',
    body:
      'Data is used to personalize issue recommendations, keep your bookmarks and profile synced, and show contribution activity in a way that reflects your progress.',
  },
  {
    title: 'What we do not do',
    body:
      'We do not sell your data, build advertising profiles, or use your information for anything outside the product experience you signed up for.',
  },
]

const practices = [
  'Bookmarks and profile fields stay tied to your account.',
  'GitHub activity is fetched to enrich the profile view.',
  'Issue refresh data helps the feed stay current.',
  'You can sign out at any time and clear your local session.',
]

function PolicyBadge({ label }) {
  return (
    <span className="rounded-full border border-[#2D6A4F]/15 bg-[#2D6A4F]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#2D6A4F]">
      {label}
    </span>
  )
}

function PrivacyPolicyPage({ onNavigate }) {
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
            <button className="font-bold text-[#1A1A18]">Privacy Policy</button>
            <button
              type="button"
              onClick={() => onNavigate('terms')}
              className="text-[#1A1A18]/65 transition hover:text-[#2D6A4F]"
            >
              Terms
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto w-full max-w-6xl border-x border-[#1A1A18]/10 px-6 py-14 sm:px-8">
        <div className="grid gap-14 pb-16 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div className="about-reveal">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#1A1A18]/45">
              Privacy Policy
            </p>
            <h1 className="mt-5 max-w-2xl [font-family:Georgia,serif] text-5xl font-bold leading-[1.04] tracking-normal text-[#1A1A18] sm:text-6xl">
              Your information, handled with restraint.
            </h1>
            <p className="mt-7 max-w-xl text-base font-medium leading-8 text-[#1A1A18]/68 sm:text-lg">
              Qurate is designed to help you contribute with confidence. This page explains what we collect, why we need it, and how it supports the product without drifting beyond the experience you chose.
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
                onClick={() => onNavigate('terms')}
                className="h-12 rounded-md border border-[#1A1A18]/15 px-6 text-sm font-semibold text-[#1A1A18]/70 transition hover:border-[#2D6A4F] hover:text-[#2D6A4F]"
              >
                View terms
              </button>
            </div>
          </div>

          <div className="about-illustration rounded-[2rem] border border-[#1A1A18]/10 bg-white/55 p-8 shadow-[0_20px_60px_rgba(26,26,24,0.08)]">
            <div className="rounded-[1.5rem] border border-[#1A1A18]/8 bg-gradient-to-b from-white/70 to-[#F1EBDD] p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#1A1A18]/8 bg-white/70 p-4">
                  <PolicyBadge label="Account data" />
                  <p className="mt-4 text-sm leading-7 text-[#1A1A18]/65">
                    Your username, email, and preferences keep the app personal and consistent across sessions.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1A1A18]/8 bg-white/70 p-4">
                  <PolicyBadge label="Usage data" />
                  <p className="mt-4 text-sm leading-7 text-[#1A1A18]/65">
                    We use app behavior to refresh issue data, bookmark state, and contribution summaries.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#1A1A18]/8 bg-[#F7F5F0] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1A1A18]/40">
                  Privacy at a glance
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {practices.map((practice) => (
                    <div key={practice} className="rounded-xl border border-[#1A1A18]/8 bg-white/65 px-4 py-3 text-sm leading-6 text-[#1A1A18]/70">
                      {practice}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 border-t border-[#1A1A18]/10 py-16 lg:grid-cols-3">
          {sections.map((section, index) => (
            <article
              key={section.title}
              className="about-card rounded-2xl border border-[#1A1A18]/10 bg-white/55 p-6 shadow-sm"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#2D6A4F]/70">
                0{index + 1}
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#1A1A18]">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#1A1A18]/65">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default PrivacyPolicyPage
