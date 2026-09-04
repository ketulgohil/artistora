import Link from 'next/link'

export const metadata = {
  title: 'Artist Plans & Visibility',
  description: 'Choose how you want to grow your presence on the Artistora marketplace.',
}

const CONTAINER = 'mx-auto max-w-6xl px-4! md:px-6!'
const SECTION = 'py-16! md:py-24!'

const plans = [
  {
    name: 'Free',
    eyebrow: 'The Ahmedabad pilot',
    price: '₹0',
    suffix: 'forever',
    description: 'Everything you need to get discovered and start receiving relevant enquiries.',
    action: 'Your current starting point',
    featured: false,
    status: 'Available now',
    features: [
      'Public artist profile',
      'Portfolio up to 10 items',
      'Services, styles, and service areas',
      'Selected matching leads',
      'Direct WhatsApp conversations',
    ],
  },
  {
    name: 'Pro',
    eyebrow: 'More room to be seen',
    price: 'Planned',
    suffix: 'monthly',
    description: 'For working professionals who want a fuller profile and more opportunities to respond.',
    action: 'Join the Pro waitlist',
    featured: true,
    status: 'Planned',
    features: [
      'Everything in Free',
      'Portfolio up to 25 items',
      'Enhanced profile visibility',
      'Access to more matched leads',
      'Profile and enquiry analytics',
    ],
  },
  {
    name: 'Premium / Featured',
    eyebrow: 'Be easier to choose',
    price: 'Planned',
    suffix: 'monthly',
    description: 'For established artists ready for prominent placement across a city or service category.',
    action: 'Talk to Artistora',
    featured: false,
    status: 'Planned',
    features: [
      'Everything in Pro',
      'Portfolio up to 50 items',
      'Featured placement in discovery',
      'City and category promotion',
      'Enhanced profile highlights',
    ],
  },
]

const comparisonRows = [
  ['Public profile', 'Included', 'Included', 'Included'],
  ['Portfolio capacity', '10 items', '25 items', '50 items'],
  ['Matched lead access', 'Selected', 'More opportunities', 'Priority visibility'],
  ['Marketplace visibility', 'Standard', 'Enhanced', 'Featured placement'],
  ['Analytics', '—', 'Included', 'Included'],
  ['Payment today', 'No payment', 'Not live yet', 'Not live yet'],
]

function Check({ muted = false }: { muted?: boolean }) {
  return (
    <span
      className={`mt-0.5! flex h-5! w-5! shrink-0 items-center justify-center rounded-full ${muted ? 'bg-ink/5 text-ink-muted' : 'bg-green/10 text-green'}`}
      aria-hidden="true"
    >
      {muted ? '—' : '✓'}
    </span>
  )
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.7 5.3L5 10l5.3 1.7L12 17l1.7-5.3L19 10l-5.3-1.7L12 3Z" />
      <path d="m19 16-.8 2.2L16 19l2.2.8L19 22l.8-2.2L22 19l-2.2-.8L19 16Z" />
    </svg>
  )
}

export default function SubscriptionPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line/70 bg-white/60">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40! right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-brand-light/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-[-12rem] left-[-8rem] h-[24rem] w-[24rem] rounded-full bg-gold/15 blur-3xl" />
        <div className={`relative ${CONTAINER} ${SECTION}`}>
          <div className="grid items-end gap-10! lg:grid-cols-[1.1fr_0.9fr] lg:gap-16!">
            <div>
              <p className="mb-5! flex items-center gap-3! text-[0.7rem] font-semibold tracking-[0.3em] text-brand uppercase">
                <span aria-hidden="true" className="h-px w-8 bg-brand/50" />
                Artist growth plans
              </p>
              <h1 className="max-w-3xl! font-display text-[2.55rem]! leading-[1.05] font-semibold tracking-[-0.03em] text-ink md:text-[4.7rem]!">
                More of the right people should find your work.
              </h1>
              <p className="mt-6! max-w-xl! text-base leading-relaxed text-ink-soft md:text-[1.05rem]">
                Artistora is starting with free onboarding. As the marketplace grows, you can choose the level of visibility, portfolio space, and insight that fits your business.
              </p>
              <div className="mt-8! flex flex-wrap gap-3!">
                <a
                  href="https://wa.me/917405387720?text=Hi%20Artistora%2C%20I%27d%20like%20to%20know%20about%20artist%20plans."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12! items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  Ask about the pilot <ArrowIcon />
                </a>
                <Link
                  href="/dashboard"
                  className="inline-flex min-h-12! items-center justify-center gap-2! rounded-full border border-brand/35 bg-white/50 px-7! py-3! text-sm font-semibold text-brand-deep transition-colors hover:border-brand hover:bg-brand/5"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md! lg:mb-2!">
              <div className="absolute -top-4! right-5! z-10 rounded-full bg-brand-deep px-4! py-2! text-[0.68rem] font-bold tracking-[0.18em] text-white uppercase shadow-lift">
                Built for local discovery
              </div>
              <div className="overflow-hidden rounded-[2rem] border border-brand/15 bg-brand-deep p-7! text-white shadow-lift md:p-9!">
                <div className="flex items-start justify-between gap-4! border-b border-white/15 pb-7!">
                  <div>
                    <p className="text-[0.68rem] font-bold tracking-[0.22em] text-gold uppercase">Your marketplace presence</p>
                    <p className="mt-3! font-display text-3xl! leading-tight">Start small.<br /><em className="font-normal text-brand-light">Grow visibly.</em></p>
                  </div>
                  <span className="flex h-11! w-11! items-center justify-center rounded-full bg-brand/20 text-brand-light"><SparkIcon /></span>
                </div>
                <div className="mt-7! space-y-4!">
                  {[
                    ['Profile', 'Your story, services, and style'],
                    ['Portfolio', 'The work clients come to see'],
                    ['Visibility', 'The reach you unlock over time'],
                  ].map(([label, value], index) => (
                    <div key={label} className="flex items-center gap-4!">
                      <span className={`flex h-9! w-9! shrink-0 items-center justify-center rounded-full text-xs font-bold ${index === 2 ? 'bg-brand text-white' : 'bg-white/10 text-brand-light'}`}>{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="mt-0.5! text-xs text-white/55">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-8! border-t border-white/15 pt-5! text-xs leading-relaxed text-white/55">No complicated setup. Your plan and verification status stay separate.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="mb-10! flex flex-wrap items-end justify-between gap-5!">
            <div>
              <p className="mb-3! text-[0.7rem] font-semibold tracking-[0.3em] text-brand uppercase">Choose your stage</p>
              <h2 className="font-display text-3xl! font-semibold tracking-tight text-ink md:text-4xl!">Plans that grow with your practice.</h2>
            </div>
            <p className="max-w-sm! text-sm leading-relaxed text-ink-soft">Paid plans are planned for a later phase. Today, every professional can join the pilot for free.</p>
          </div>

          <div className="grid gap-5! lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.name} className={`relative flex flex-col rounded-[1.7rem] border p-7! shadow-soft transition-transform duration-300 hover:-translate-y-1 md:p-8! ${plan.featured ? 'border-brand bg-brand-deep text-white shadow-lift lg:-translate-y-3!' : 'border-line bg-white text-ink'}`}>
                {plan.featured && <span className="absolute -top-3! left-7! rounded-full bg-brand px-4! py-1.5! text-[0.65rem] font-bold tracking-[0.16em] text-white uppercase">Most useful next step</span>}
                <div className="flex items-start justify-between gap-3!">
                  <div>
                    <p className={`text-[0.65rem] font-bold tracking-[0.18em] uppercase ${plan.featured ? 'text-brand-light' : 'text-brand'}`}>{plan.eyebrow}</p>
                    <h3 className="mt-3! font-display text-2xl! font-semibold">{plan.name}</h3>
                  </div>
                  <span className={`shrink-0 whitespace-nowrap rounded-full px-3! py-1! text-[0.62rem] font-bold uppercase ${plan.featured ? 'bg-white/10 text-white/75' : 'bg-cream text-ink-muted'}`}>{plan.status}</span>
                </div>
                <div className="mt-7! flex items-end gap-2!">
                  <span className="font-display text-4xl! font-semibold">{plan.price}</span>
                  <span className={`mb-1! text-xs ${plan.featured ? 'text-white/55' : 'text-ink-muted'}`}>{plan.suffix}</span>
                </div>
                <p className={`mt-4! min-h-14! text-sm leading-relaxed ${plan.featured ? 'text-white/65' : 'text-ink-soft'}`}>{plan.description}</p>
                <div className={`my-7! h-px ${plan.featured ? 'bg-white/15' : 'bg-line'}`} />
                <ul className="space-y-3!">
                  {plan.features.map((feature) => <li key={feature} className="flex gap-3! text-sm"><Check /> <span>{feature}</span></li>)}
                </ul>
                <a
                  href="https://wa.me/917405387720?text=Hi%20Artistora%2C%20I%27d%20like%20to%20discuss%20artist%20plans."
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-8! inline-flex min-h-11! items-center justify-center gap-2! rounded-full px-5! py-2.5! text-sm font-semibold transition-all ${plan.featured ? 'bg-brand text-white hover:bg-brand-dark' : 'border border-brand/35 text-brand-deep hover:border-brand hover:bg-brand/5'}`}
                >
                  {plan.action} <ArrowIcon />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line/70 bg-cream/40 py-16! md:py-20!">
        <div className={CONTAINER}>
          <div className="mx-auto max-w-2xl! text-center">
            <p className="mb-3! text-[0.7rem] font-semibold tracking-[0.3em] text-brand uppercase">At a glance</p>
            <h2 className="font-display text-3xl! font-semibold text-ink md:text-4xl!">The difference is visibility, not trust.</h2>
            <p className="mt-4! text-sm leading-relaxed text-ink-soft">Approval and verification are always handled separately by Artistora. A paid plan will never replace the trust signals customers rely on.</p>
          </div>
          <div className="mt-10! overflow-x-auto rounded-3xl border border-line bg-white shadow-soft">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-cream/50">
                  <th className="px-5! py-4! font-semibold text-ink md:px-7!">What you get</th>
                  <th className="px-5! py-4! font-semibold text-ink md:px-7!">Free</th>
                  <th className="bg-brand-deep px-5! py-4! font-semibold text-white md:px-7!">Pro</th>
                  <th className="px-5! py-4! font-semibold text-ink md:px-7!">Premium / Featured</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([label, free, pro, premium]) => (
                  <tr key={label} className="border-b border-line/70 last:border-0">
                    <th className="px-5! py-4! font-medium text-ink-soft md:px-7!">{label}</th>
                    {[free, pro, premium].map((value, index) => <td key={`${label}-${index}`} className={`px-5! py-4! md:px-7! ${index === 1 ? 'bg-brand-deep/[0.04] font-medium text-brand-deep' : 'text-ink-soft'}`}>{value}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className={`${SECTION} bg-brand-deep text-white`}>
        <div className={`${CONTAINER} text-center`}>
          <p className="text-[0.7rem] font-semibold tracking-[0.3em] text-gold uppercase">The pilot promise</p>
          <h2 className="mx-auto mt-4! max-w-2xl! font-display text-3xl! font-semibold leading-tight md:text-5xl!">First, we help you win work. Then, we earn the right to charge for reach.</h2>
          <p className="mx-auto mt-5! max-w-xl! text-sm leading-relaxed text-white/60">Join free, complete your profile, and let customers discover your work. When paid visibility launches, you will see the details before anything changes.</p>
          <div className="mt-8! flex flex-wrap justify-center gap-3!">
            <Link href="/register" className="inline-flex min-h-12! items-center justify-center gap-2! rounded-full bg-brand px-7! py-3! text-sm font-semibold text-white transition-colors hover:bg-brand-dark">Create your free profile <ArrowIcon /></Link>
            <a href="https://wa.me/917405387720?text=Hi%20Artistora%2C%20I%27m%20an%20artist%20interested%20in%20joining%20the%20pilot." target="_blank" rel="noreferrer" className="inline-flex min-h-12! items-center justify-center rounded-full border border-white/25 px-7! py-3! text-sm font-semibold text-white transition-colors hover:bg-white/10">Speak with the team</a>
          </div>
        </div>
      </section>
    </>
  )
}
