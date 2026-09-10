import Link from 'next/link'
import { notFound } from 'next/navigation'
import SectionHeading from '@/components/SectionHeading'
import type { Metadata } from 'next'

const CONTAINER = 'mx-auto max-w-6xl px-4! md:px-6!'
const SECTION = 'py-16! md:py-24!'

const areasData: Record<string, { name: string; description: string; landmarks: string[]; services: string[] }> = {
  satellite: {
    name: 'Satellite',
    description: 'Satellite is Ahmedabad\'s premium event hub, home to some of the city\'s finest banquet halls and open-air venues. Find top-rated photographers, makeup artists, and mehndi artists for weddings, receptions, and corporate events.',
    landmarks: ['Iscon Mall', 'Satellite Cross Roads', 'Jodhpur Village', 'Husain Dargah'],
    services: ['Bridal Mehndi Artists', 'Wedding Photographers', 'Makeup Artists', 'Event Planners', 'Decor Designers'],
  },
  vastrapur: {
    name: 'Vastrapur',
    description: 'Vastrapur is a wedding favourite in central Ahmedabad, known for its lakeside venues and cultural celebrations. Discover trusted bridal mehndi, makeup, and photography artists with years of experience.',
    landmarks: ['Vastrapur Lake', 'Vastrapur Lake Garden', 'Shreyas Folk Museum', 'Gujarat Vidya Pith'],
    services: ['Bridal Mehndi Artists', 'Wedding Photographers', 'Makeup Artists', 'Event Planners', 'Catering Consultants'],
  },
  bopal: {
    name: 'Bopal',
    description: 'Bopal is one of Ahmedabad\'s fastest-growing residential areas, attracting new-generation artists with fresh styles. Find modern wedding artists who blend tradition with contemporary aesthetics.',
    landmarks: ['Bopal Bridge', 'Science City Road', 'Bopal Gymkhana', 'Shreyas Railway Crossing'],
    services: ['Bridal Mehndi Artists', 'Wedding Photographers', 'Makeup Artists', 'Event Planners', 'Decor Designers'],
  },
  'prahlad-nagar': {
    name: 'Prahlad Nagar',
    description: 'Prahlad Nagar is known for its upscale banquet halls and corporate event venues. Find professional event planners, photographers, and makeup artists who specialise in grand celebrations.',
    landmarks: ['Prahlad Nagar Garden', 'One World West', 'Iscon Emporio', 'Prahlad Nagar Cross Roads'],
    services: ['Corporate Event Planners', 'Wedding Photographers', 'Makeup Artists', 'Bridal Mehndi Artists', 'Decor Designers'],
  },
  thaltej: {
    name: 'Thaltej',
    description: 'Thaltej is a prime residential area with experienced bridal specialists. Find mehndi artists and makeup artists who offer home-visit services and understand traditional Gujarati wedding rituals.',
    landmarks: ['Thaltej Cross Roads', 'SG Highway', 'Thaltej Tekra', 'Jodhpur Village'],
    services: ['Bridal Mehndi Artists', 'Makeup Artists', 'Wedding Photographers', 'Mehndi Artists', 'Event Planners'],
  },
  gota: {
    name: 'Gota',
    description: 'Gota offers quality artists at competitive prices. Perfect for weddings, birthdays, and festive celebrations without breaking the budget.',
    landmarks: ['Gota Cross Roads', 'SP Ring Road', 'Gota Bridge', 'Sattva Golf Homes'],
    services: ['Bridal Mehndi Artists', 'Wedding Photographers', 'Makeup Artists', 'Event Planners', 'Decor Designers'],
  },
  'south-bopal': {
    name: 'South Bopal',
    description: 'South Bopal is a premium residential community with verified artists who specialise in intimate home celebrations and grand events alike.',
    landmarks: ['South Bopal Road', 'Shilaj Circle', 'Ghuma Santej', 'Ambli Bopal Road'],
    services: ['Bridal Mehndi Artists', 'Wedding Photographers', 'Makeup Artists', 'Event Planners', 'Decor Designers'],
  },
  'science-city': {
    name: 'Science City',
    description: 'Science City area is known for its grand event venues and open-air celebration spaces. Find artists available for large-scale weddings and functions.',
    landmarks: ['Science City', 'Gujarat Science City', 'Science City Road', 'Sola Bridge'],
    services: ['Event Planners', 'Wedding Photographers', 'Makeup Artists', 'Bridal Mehndi Artists', 'Decor Designers'],
  },
  shela: {
    name: 'Shela',
    description: 'Shela is an emerging area attracting fresh artistic talent. Find up-and-coming artists who bring new energy and creative ideas to weddings and celebrations.',
    landmarks: ['Shela Village', 'Shela Cross Roads', 'Bopal Shela Road', 'Shela Lake'],
    services: ['Bridal Mehndi Artists', 'Wedding Photographers', 'Makeup Artists', 'Event Planners', 'Decor Designers'],
  },
  nikol: {
    name: 'Nikol',
    description: 'Nikol is home to trusted local artists with deep community connections. Find reliable professionals who have served Ahmedabad\'s families for years.',
    landmarks: ['Nikol Cross Roads', 'Naroda Road', 'Nikol Fire Station', 'Vatva GIDC'],
    services: ['Bridal Mehndi Artists', 'Wedding Photographers', 'Makeup Artists', 'Event Planners', 'Decor Designers'],
  },
  vastral: {
    name: 'Vastral',
    description: 'Vastral offers quality artists at budget-friendly prices. Perfect for families looking for talented professionals without premium pricing.',
    landmarks: ['Vastral Road', 'Vastral Gam', 'Ramol Cross Roads', 'Vastral Lake'],
    services: ['Bridal Mehndi Artists', 'Wedding Photographers', 'Makeup Artists', 'Event Planners', 'Decor Designers'],
  },
  maninagar: {
    name: 'Maninagar',
    description: 'Maninagar is a heritage area with traditional mehndi and makeup artists who bring generational skills to modern celebrations.',
    landmarks: ['Maninagar Cross Roads', 'Kankaria Lake', 'Maninagar Railway Station', 'Isanpur'],
    services: ['Bridal Mehndi Artists', 'Makeup Artists', 'Wedding Photographers', 'Event Planners', 'Mehndi Artists'],
  },
  naroda: {
    name: 'Naroda',
    description: 'Naroda offers complete event service providers who handle photography, decor, makeup, and mehndi all in one package.',
    landmarks: ['Naroda GIDC', 'Naroda Patiya', 'Naroda Road', 'Isanpur Junction'],
    services: ['Wedding Photographers', 'Event Planners', 'Makeup Artists', 'Bridal Mehndi Artists', 'Decor Designers'],
  },
  chandkheda: {
    name: 'Chandkheda',
    description: 'Chandkheda is famous for its festive celebrations. Find artists specialising in Navratri, Diwali, and other Gujarati festival services.',
    landmarks: ['Chandkheda Bus Stand', 'SG Highway', 'Chandkheda Gam', 'Motera Stadium'],
    services: ['Mehndi Artists', 'Festival Makeup Artists', 'Wedding Photographers', 'Event Planners', 'Decor Designers'],
  },
  motera: {
    name: 'Motera',
    description: 'Motera is home to the world\'s largest cricket stadium. Find professional photographers and event planners for grand celebrations in the area.',
    landmarks: ['Narendra Modi Stadium', 'Motera Cross Roads', 'Sabarmati Riverfront', 'Motera Village'],
    services: ['Wedding Photographers', 'Event Planners', 'Makeup Artists', 'Bridal Mehndi Artists', 'Decor Designers'],
  },
  sola: {
    name: 'Sola',
    description: 'Sola serves the SG Highway corridor with trusted artists who understand the needs of Ahmedabad\'s growing professional community.',
    landmarks: ['Sola Bridge', 'Sola Civil Hospital', 'SG Highway', 'Science City Road'],
    services: ['Bridal Mehndi Artists', 'Wedding Photographers', 'Makeup Artists', 'Event Planners', 'Decor Designers'],
  },
  ghodasar: {
    name: 'Ghodasar',
    description: 'Ghodasar is a family-oriented area with artists who specialise in intimate weddings and home celebrations.',
    landmarks: ['Ghodasar Cross Roads', 'Ghodasar Gam', 'Vastral Road', 'Ramol'],
    services: ['Bridal Mehndi Artists', 'Wedding Photographers', 'Makeup Artists', 'Event Planners', 'Decor Designers'],
  },
  isanpur: {
    name: 'Isanpur',
    description: 'Isanpur is a heritage area where artists preserve traditional Gujarati wedding styles while adding a contemporary edge.',
    landmarks: ['Isanpur Junction', 'Isanpur Road', 'Ghatlodia', 'Naroda'],
    services: ['Mehndi Artists', 'Makeup Artists', 'Wedding Photographers', 'Event Planners', 'Decor Designers'],
  },
  memco: {
    name: 'Memco',
    description: 'Memco is an industrial hub with professional event services for factory functions and industrial celebrations.',
    landmarks: ['Memco Cross Roads', 'Vatva GIDC', 'Nikol', 'Memco Gam'],
    services: ['Event Planners', 'Wedding Photographers', 'Makeup Artists', 'Bridal Mehndi Artists', 'Decor Designers'],
  },
  daskroi: {
    name: 'Daskroi',
    description: 'Daskroi offers a peaceful suburban setting for destination-style weddings. Find artists who bring elegance to venue celebrations.',
    landmarks: ['Daskroi Village', 'Dholera Road', 'Daskroi Taluka', 'Ahmedabad Border'],
    services: ['Wedding Photographers', 'Event Planners', 'Makeup Artists', 'Bridal Mehndi Artists', 'Decor Designers'],
  },
}

type AreaPageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: AreaPageProps): Promise<Metadata> {
  const { slug } = await params
  const area = areasData[slug]
  if (!area) return { title: 'Area Not Found' }

  return {
    title: `${area.name} Artists — Book Verified Professionals | Artistora`,
    description: `Find verified photographers, makeup artists, mehndi artists, and event planners in ${area.name}, Ahmedabad. Home-visit services available.`,
    alternates: {
      canonical: `https://www.artistora.com/areas/${slug}`,
    },
    openGraph: {
      title: `${area.name} Artists — Artistora`,
      description: `Book verified artists in ${area.name}, Ahmedabad for weddings, events, and celebrations.`,
      url: `https://www.artistora.com/areas/${slug}`,
      type: 'website',
    },
  }
}

export default async function AreaPage({ params }: AreaPageProps) {
  const { slug } = await params
  const area = areasData[slug]
  if (!area) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Artists in ${area.name}, Ahmedabad`,
    description: area.description,
    provider: {
      '@type': 'Organization',
      name: 'Artistora',
      url: 'https://www.artistora.com',
    },
    areaServed: {
      '@type': 'City',
      name: 'Ahmedabad',
      containedInPlace: {
        '@type': 'State',
        name: 'Gujarat',
      },
    },
    serviceType: area.services,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line/70 bg-white/60">
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-light/20 blur-3xl" />
        <div className={`relative ${CONTAINER} py-16! md:py-24!`}>
          <div className="mx-auto max-w-3xl! text-center">
            <p className="mb-4! flex items-center justify-center gap-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">
              <span aria-hidden="true" className="h-px w-8 bg-brand/50" />
              {area.name}, Ahmedabad
              <span aria-hidden="true" className="h-px w-8 bg-brand/50" />
            </p>
            <h1 className="font-display text-[2.3rem]! leading-[1.12] font-semibold text-ink md:text-[3.2rem]!">
              Artists in {area.name}
            </h1>
            <p className="mt-5! text-[1.05rem] leading-relaxed text-ink-soft">
              {area.description}
            </p>
            <div className="mt-8! flex flex-wrap justify-center gap-4!">
              <Link
                href="/get-quote"
                className="inline-flex min-h-12! cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
              >
                Get Quotes in {area.name}
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

      {/* Services in this area */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title={`Services Available in ${area.name}`} subtitle="What We Offer" />
          <div className="mx-auto mt-10! grid max-w-4xl! gap-4! sm:grid-cols-2 lg:grid-cols-3">
            {area.services.map((service) => (
              <div key={service} className="flex items-center gap-3! rounded-2xl border border-line bg-white p-5! shadow-soft">
                <div className="flex h-10! w-10! shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <span className="font-display text-sm! font-semibold text-ink">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local Landmarks */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title={`Near ${area.name} Landmarks`} subtitle="We Cover Your Area" />
          <div className="mx-auto mt-10! flex max-w-3xl! flex-wrap justify-center gap-3!">
            {area.landmarks.map((landmark) => (
              <span key={landmark} className="rounded-full border border-line bg-white px-5! py-2.5! text-sm font-medium text-ink-soft shadow-soft">
                📍 {landmark}
              </span>
            ))}
          </div>
          <div className="mt-8! text-center">
            <Link
              href="/get-quote"
              className="inline-flex min-h-12! cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              Get Free Quotes in {area.name}
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`${SECTION} bg-coal`}>
        <div className={`${CONTAINER} text-center`}>
          <h2 className="font-display text-2xl! font-semibold text-white md:text-3xl!">Ready to book artists in {area.name}?</h2>
          <p className="mx-auto mt-3! max-w-lg! text-sm leading-relaxed text-cream/60">
            Tell us about your event and we&apos;ll match you with the best verified artists in {area.name}.
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
