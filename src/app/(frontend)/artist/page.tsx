import 'server-only'

import Link from 'next/link'
import SectionHeading from '@/components/SectionHeading'
import { getSiteSettings } from '@/lib/payload'

export default async function ArtistPage() {
  const settings = (await getSiteSettings()) as any
  const businessName = settings.businessName || 'Shiva Mehndi Art'
  const founderName = settings.founderName || 'Bhumi Chanpura'
  const bookingUrl = settings.bookingFormUrl || ''

  const highlights = [
    {
      label: 'Experience',
      value: 'Professional Artist',
      text: 'Serving bridal and event clients across Ahmedabad with a 5.0 Google rating and 114+ reviews.',
    },
    {
      label: 'Teaching',
      value: 'Class Instructor',
      text: 'Conducts offline mehndi classes for beginners, covering basics to bridal-ready practice.',
    },
    {
      label: 'Specialization',
      value: 'Bridal & Events',
      text: 'Specializes in bridal, engagement, Arabic, Khafif, and festive mehndi with home service availability.',
    },
  ]

  const qualityTags = [
    'Clean Detailing',
    'Balanced Composition',
    'Elegant Finishing',
    'Photo-Ready Designs',
    'Calm & Comfortable Setup',
    'Consistent Quality',
  ]

  return (
    <>
      <section className="section-space">
        <div className="max-w-7xl mx-auto px-4!">
          <SectionHeading
            title="About the Artist"
            subtitle={`Meet ${founderName}`}
          />

          <div className="artist-story-hero">
            <div className="artist-image-wrap">
              <img
                src="/api/media/file/Bhumi.webp"
                alt={`${founderName} — Founder of ${businessName}`}
                width={1200}
                height={1600}
                className="artist-image"
                loading="eager"
              />
            </div>
            <div className="artist-page-copy">
              <h3 className="text-2xl md:text-3xl mb-4!" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                {founderName} &mdash; Founder of {businessName}
              </h3>
              <p className="leading-relaxed mb-4!" style={{ color: 'var(--color-text-secondary)' }}>
                {founderName} is the mehndi artist behind {businessName},
                based in Chandlodiya, Ahmedabad. With a focus on clean
                detailing, balanced composition, and elegant finishing, she
                has built a reputation for bridal mehndi that reads beautifully
                both in person and in photographs.
              </p>
              <p className="leading-relaxed mb-6!" style={{ color: 'var(--color-text-secondary)' }}>
                Her work spans bridal mehndi, engagement mehndi, baby showers,
                festive events, and offline mehndi classes for learners who
                want structured, in-person guidance. Every design is approached
                with patience and precision, making each booking feel personal
                and thoughtfully handled.
              </p>
              <div className="artist-quality-list flex flex-wrap gap-3!">
                {qualityTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-muted)',
                      fontSize: '0.85rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: 999,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-space" style={{ background: 'var(--color-surface)' }}>
        <div className="max-w-7xl mx-auto px-4!">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6!">
            {highlights.map((item) => (
              <article
                key={item.label}
                className="artist-highlight-card"
                style={{ background: 'white', border: '1px solid var(--color-border)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
              >
                <p className="eyebrow">{item.label}</p>
                <h3 className="text-xl mb-3!" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{item.value}</h3>
                <p className="leading-relaxed text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="max-w-7xl mx-auto px-4!">
          <div
            className="classes-link-panel"
            style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}
          >
            <div className="classes-link-copy">
              <p className="eyebrow">Book Your Session</p>
              <h2 className="text-2xl md:text-3xl mb-4!" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                Ready to work with {founderName} for your next celebration?
              </h2>
              <p className="mb-6!" style={{ color: 'var(--color-text-muted)' }}>
                Whether you are planning a bridal booking, an engagement event,
                a baby shower, or want to learn mehndi through structured
                classes, reach out to check availability and discuss your vision.
              </p>
              <p className="classes-inline-links flex items-center gap-3! text-sm">
                <Link href="/bridal-mehndi" className="font-medium" style={{ color: 'var(--color-brand)' }}>Explore bridal mehndi</Link>
                <span style={{ color: 'var(--color-border)' }}>/</span>
                <Link href="/classes" className="font-medium" style={{ color: 'var(--color-brand)' }}>Mehndi classes in Ahmedabad</Link>
                <span style={{ color: 'var(--color-border)' }}>/</span>
                <Link href="/contact" className="font-medium" style={{ color: 'var(--color-brand)' }}>Contact &amp; availability</Link>
              </p>
            </div>
            <div className="classes-link-actions flex flex-wrap gap-3!">
              <a
                className="btn btn-brand"
                href={bookingUrl}
                target="_blank"
                rel="noreferrer"
              >
                Book {businessName}
              </a>
              <Link className="btn btn-outline-brand" href="/portfolio">
                View Portfolio
              </Link>
              <Link className="btn btn-outline-soft" href="/contact">
                Ask a Question
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
