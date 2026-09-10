import Link from 'next/link'
import SectionHeading from '@/components/SectionHeading'

export const metadata = {
  title: 'Areas We Serve — Book Artists Across Ahmedabad',
  description:
    'Find verified photographers, makeup artists, mehndi artists, and event planners in your area across Ahmedabad — Satellite, Vastrapur, Bopal, Prahlad Nagar, and more.',
  alternates: {
    canonical: 'https://www.artistora.com/areas',
  },
}

const CONTAINER = 'mx-auto max-w-6xl px-4! md:px-6!'
const SECTION = 'py-16! md:py-24!'

const areas = [
  { name: 'Satellite', slug: 'satellite', highlight: 'Premium Event Hub', description: 'Top-rated artists for weddings, receptions, and corporate events in Ahmedabad\'s most sought-after locality.' },
  { name: 'Vastrapur', slug: 'vastrapur', highlight: 'Wedding Favorite', description: 'Trusted bridal mehndi, makeup, and photography artists serving the heart of Ahmedabad.' },
  { name: 'Bopal', slug: 'bopal', highlight: 'Growing Fast', description: 'New-generation artists with fresh styles for modern weddings and celebrations.' },
  { name: 'Prahlad Nagar', slug: 'prahlad-nagar', highlight: 'Corporate & Social', description: 'Professional event planners and photographers for corporate functions and social gatherings.' },
  { name: 'Thaltej', slug: 'thaltej', highlight: 'Bridal Specialists', description: 'Experienced bridal mehndi and makeup artists with home service availability.' },
  { name: 'Gota', slug: 'gota', highlight: 'Value & Quality', description: 'Affordable yet talented artists for weddings, birthdays, and festive celebrations.' },
  { name: 'South Bopal', slug: 'south-bopal', highlight: 'Premium Residential', description: 'Verified artists serving the premium residential communities with home-visit services.' },
  { name: 'Science City', slug: 'science-city', highlight: 'Event Venues', description: 'Artists available for grand events at Science City\'s banquet halls and open venues.' },
  { name: 'Shela', slug: 'shela', highlight: 'Emerging Area', description: 'Up-and-coming artists bringing fresh energy to weddings and celebrations.' },
  { name: 'Nikol', slug: 'nikol', highlight: 'Trusted Local', description: 'Reliable local artists with deep community trust and years of experience.' },
  { name: 'Vastral', slug: 'vastral', highlight: 'Budget Friendly', description: 'Quality artists at competitive prices for every occasion and budget.' },
  { name: 'Maninagar', slug: 'maninagar', highlight: 'Traditional Expertise', description: 'Traditional mehndi and makeup artists with generational skills and modern touch.' },
  { name: 'Naroda', slug: 'naroda', highlight: 'Full Service', description: 'Complete event service providers — photography, decor, makeup, and mehndi.' },
  { name: 'Chandkheda', slug: 'chandkheda', highlight: 'Festival Ready', description: 'Artists specializing in Navratri, Diwali, and festive occasion services.' },
  { name: 'Motera', slug: 'motera', highlight: 'Stadium Area', description: 'Professional photographers and event planners near the world\'s largest cricket stadium.' },
  { name: 'Sola', slug: 'sola', highlight: 'Medical Hub Area', description: 'Trusted artists serving the Sola and SG Highway corridor.' },
  { name: 'Ghodasar', slug: 'ghodasar', highlight: 'Family Favorite', description: 'Family-oriented artists for intimate weddings and home celebrations.' },
  { name: 'Isanpur', slug: 'isanpur', highlight: 'Heritage Area', description: 'Artists preserving traditional Gujarati wedding styles with a contemporary edge.' },
  { name: 'Memco', slug: 'memco', highlight: 'Industrial Hub', description: 'Professional event services for factory functions and industrial celebrations.' },
  { name: 'Daskroi', slug: 'daskroi', highlight: 'Suburban Calm', description: 'Peaceful venue artists for destination-style weddings near Ahmedabad.' },
]

export default async function AreasPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line/70 bg-white/60">
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-brand-light/20 blur-3xl" />
        <div className={`relative ${CONTAINER} py-16! md:py-24!`}>
          <div className="mx-auto max-w-3xl! text-center">
            <p className="mb-4! flex items-center justify-center gap-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">
              <span aria-hidden="true" className="h-px w-8 bg-brand/50" />
              Local Artists
              <span aria-hidden="true" className="h-px w-8 bg-brand/50" />
            </p>
            <h1 className="font-display text-[2.3rem]! leading-[1.12] font-semibold text-ink md:text-[3.2rem]!">
              Artists in Every Neighbourhood of Ahmedabad
            </h1>
            <p className="mt-5! text-[1.05rem] leading-relaxed text-ink-soft">
              Find verified photographers, makeup artists, mehndi artists, and event planners in your area. All artists offer home-visit services across Ahmedabad.
            </p>
          </div>
        </div>
      </section>

      {/* Areas Grid */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title="Choose Your Area" subtitle="We Serve All of Ahmedabad" />
          <div className="mx-auto mt-10! grid max-w-5xl! gap-4! sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((area) => (
              <Link
                key={area.slug}
                href={`/areas/${area.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-line bg-white p-5! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3!">
                  <div>
                    <h2 className="font-display text-lg! font-semibold text-ink group-hover:text-brand transition-colors">
                      {area.name}
                    </h2>
                    <span className="mt-1! inline-block rounded-full bg-brand/10 px-3! py-0.5! text-[0.65rem] font-semibold text-brand">
                      {area.highlight}
                    </span>
                  </div>
                  <svg
                    className="mt-1.5! shrink-0 text-ink-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>
                <p className="mt-3! text-sm leading-relaxed text-ink-soft">{area.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={`${SECTION} bg-cream/50`}>
        <div className={CONTAINER}>
          <div className="mx-auto max-w-3xl! text-center">
            <h2 className="font-display text-2xl! font-semibold text-ink">How It Works</h2>
            <p className="mt-3! text-sm leading-relaxed text-ink-soft">
              Choose your area → Pick a service → Get quotes from verified local artists → Book with confidence.
            </p>
            <div className="mt-8! flex flex-wrap justify-center gap-4!">
              <Link
                href="/get-quote"
                className="inline-flex min-h-12! cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
              >
                Get Free Quotes
              </Link>
              <Link
                href="/artists"
                className="inline-flex min-h-12! cursor-pointer items-center justify-center gap-2! rounded-full border border-brand/30 bg-transparent px-7! py-3! text-sm font-semibold text-brand transition-colors duration-200 hover:border-brand hover:bg-brand/5"
              >
                Browse All Artists
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`${SECTION} bg-coal`}>
        <div className={`${CONTAINER} text-center`}>
          <h2 className="font-display text-2xl! font-semibold text-white md:text-3xl!">Can&apos;t find your area?</h2>
          <p className="mx-auto mt-3! max-w-lg! text-sm leading-relaxed text-cream/60">
            We serve all of Ahmedabad. Tell us your event details and we&apos;ll match you with the best artists near you.
          </p>
          <div className="mt-8!">
            <Link
              href="/get-quote"
              className="inline-flex min-h-12! cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              Get Free Quotes
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
