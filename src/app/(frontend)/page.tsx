'use server'

import Link from 'next/link'
import SectionHeading from '@/components/SectionHeading'
import {
  getSiteSettings,
  getServices,
  getTestimonials,
  getFAQs,
  getYouTubeVideos,
} from '@/lib/payload'
import type { SiteSetting, Service, Testimonial, Faq, YoutubeVideo } from '@/payload-types'

function renderLexicalText(data: unknown): string {
  if (!data) return ''
  if (typeof data === 'string') return data
  const obj = data as { root?: { children?: Array<{ children?: Array<{ text?: string }>; text?: string }> } }
  if (!obj.root?.children) return ''
  return obj.root.children
    .map((child) => {
      if (child.children) {
        return child.children.map((c) => c.text || '').join('')
      }
      return child.text || ''
    })
    .join('\n')
}

function Stars({ rating = 5 }: { rating?: number }) {
  return (
    <div className="stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className="w-4 h-4"
          viewBox="0 0 20 20"
          style={{ fill: i < rating ? 'var(--color-brand)' : 'rgba(109,74,48,0.18)' }}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default async function HomePage() {
  const [settings, _services, testimonials, faqs, youtubeVideos] = await Promise.all([
    getSiteSettings() as Promise<SiteSetting>,
    getServices() as Promise<Service[]>,
    getTestimonials() as Promise<Testimonial[]>,
    getFAQs() as Promise<Faq[]>,
    getYouTubeVideos() as Promise<YoutubeVideo[]>,
  ])

  const bookingUrl = settings.bookingFormUrl || ''
  const mapUrl = settings.googleMapUrl || ''
  const businessName = settings.businessName || 'Shiva Mehndi Art'
  const phone = settings.phone || '+91 8469662012'

  const signatureServices = [
    { title: 'Bridal Luxury', text: 'Intricate bridal storytelling from a bridal mehndi artist focused on refined detailing, symmetry, and a premium finish for your wedding day.' },
    { title: 'Arabic & Khafif', text: 'Light, stylish, camera-friendly patterns for festive events, engagement ceremonies, and modern celebrations.' },
    { title: 'Baby Shower & Events', text: 'Warm, graceful mehndi for milestones, private functions, and family occasions across Ahmedabad.' },
    { title: 'Mehndi Classes', text: 'Mehndi classes in Ahmedabad for learners who want to build confidence in linework, motifs, composition, and finishing.' },
  ]

  const trustStats = [
    { value: '200+', label: 'Portfolio Photos' },
    { value: 'Offline', label: 'Classes Available' },
    { value: 'Across', label: 'Ahmedabad Home Service' },
    { value: 'Studio', label: 'Based In Chandlodiya' },
  ]

  const galleryImages = ['Bridal.webp', 'Baby_shower.webp', 'engagement.webp', 'deveshaa.webp']

  return (
    <>
      {/* ── Hero Section ── */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto px-6!">
          <div className="hero-split">
            <div className="hero-content">
              <p className="eyebrow">Professional Mehndi Artist Ahmedabad</p>
              <h1>Bridal mehndi artist in Ahmedabad for elegant events and modern celebrations.</h1>
              <p className="hero-text">
                {businessName} is a professional mehndi artist Ahmedabad
                clients book for bridal mehndi, engagement mehndi, baby shower
                mehndi, festive designs, and mehndi classes in Ahmedabad that
                feel polished, graceful, and beautifully personal.
              </p>
              <div className="hero-actions">
                <a
                  className="btn-brand"
                  href={bookingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Book Bridal Mehndi
                </a>
                <Link className="btn-outline-brand" href="/portfolio">
                  View Portfolio
                </Link>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-image-frame">
                <img
                  src="/api/media/file/Bridal.webp"
                  alt="Bridal mehndi artist work in Ahmedabad by Shiva Mehndi Art"
                  width={1400}
                  height={933}
                  className="w-full h-auto"
                  loading="eager"
                />
              </div>
              <div className="hero-floating-card review-card">
                <strong>114+</strong>
                <span>happy reviews</span>
              </div>
              <div className="hero-floating-card service-card-mini">
                <strong>Home Service</strong>
                <span>Across Ahmedabad</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="stats-strip">
        <div className="max-w-7xl mx-auto px-6!">
          <div className="stats-grid">
            {trustStats.map((item) => (
              <article className="stat-card" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Signature Services ── */}
      <section className="section-space">
        <div className="max-w-7xl mx-auto px-6!">
          <SectionHeading title="Signature Experiences" subtitle="What Clients Book" />
          <div className="signature-grid">
            {signatureServices.map((service) => (
              <article className="signature-card" key={service.title}>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Classes Link Section ── */}
      <section className="section-space">
        <div className="max-w-7xl mx-auto px-6!">
          <div className="classes-link-panel">
            <div className="classes-link-copy">
              <p className="eyebrow">Mehndi Classes In Ahmedabad</p>
              <h2>Learn basic to advanced mehndi techniques with guided offline practice.</h2>
              <p>
                Explore the dedicated classes page for batch timings, topics
                covered, certificate details, and how to reserve your seat for
                mehndi classes in Ahmedabad.
              </p>
              <p className="classes-inline-links">
                <Link href="/bridal-mehndi">Bridal Mehndi in Ahmedabad</Link>
                <span>/</span>
                <Link href="/classes">Mehndi Classes in Ahmedabad</Link>
                <span>/</span>
                <Link href="/home-service-mehndi-in-ahmedabad">Home Service Mehndi in Ahmedabad</Link>
              </p>
            </div>
            <div className="classes-link-actions">
              <Link className="btn-brand" href="/classes">
                Explore Mehndi Classes
              </Link>
              <a
                className="btn-outline-brand"
                href={bookingUrl}
                target="_blank"
                rel="noreferrer"
              >
                Book A Class Seat
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gallery Preview ── */}
      <section className="section-space">
        <div className="max-w-7xl mx-auto px-6!">
          <SectionHeading title="Gallery Preview" subtitle="Designs In Focus" />
          <div className="gallery-preview-grid">
            {galleryImages.map((img) => (
              <figure className="gallery-preview-card" key={img}>
                <img
                  src={`/api/media/file/${img}`}
                  alt="Mehndi design by Shiva Mehndi Art"
                  width={600}
                  height={800}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              </figure>
            ))}
          </div>
          <div className="text-center mt-8!">
            <Link className="btn-dark-brand" href="/portfolio">
              Explore Full Portfolio
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="section-space">
        <div className="max-w-7xl mx-auto px-6!">
          <SectionHeading title="Google Reviews" subtitle="Client Love" />
          <div className="testimonial-grid">
            {testimonials.slice(0, 6).map((t: Testimonial) => (
              <article className="testimonial-card" key={t.id}>
                <p className="testimonial-quote">&ldquo;{t.text}&rdquo;</p>
                <Stars rating={t.rating || 5} />
                <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t.name}</p>
              </article>
            ))}
          </div>
          <div className="text-center mt-8!">
            <a
              className="btn-outline-brand"
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open Google Business Profile
            </a>
          </div>
        </div>
      </section>

      {/* ── YouTube Showcase ── */}
      <section className="section-space">
        <div className="max-w-7xl mx-auto px-6!">
          <div className="youtube-panel">
            <div className="youtube-copy">
              <p className="eyebrow">YouTube</p>
              <h2>Watch latest mehndi videos and subscribe for new uploads.</h2>
              <p>
                See class practice clips, bridal detailing, and short design tutorials from Shiva Mehndi Art.
              </p>
              <a
                className="btn-brand"
                href="https://www.youtube.com/@ShivaMehndiArtAndClasses"
                target="_blank"
                rel="noreferrer"
              >
                Subscribe On YouTube
              </a>
            </div>
            <div className="youtube-grid">
              {youtubeVideos.slice(0, 3).map((v: YoutubeVideo) => (
                <a
                  className="youtube-card"
                  href={`https://www.youtube.com/watch?v=${v.videoId}`}
                  key={v.id}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="youtube-thumb">
                    <img
                      src={`https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`}
                      alt={v.title || 'Shiva Mehndi Art YouTube video'}
                      width={480}
                      height={360}
                      loading="lazy"
                    />
                    <span className="youtube-play-badge">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff4242" aria-hidden="true" focusable="false">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Watch
                    </span>
                  </span>
                  <span className="youtube-video-title">{v.title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section-space">
        <div className="max-w-7xl mx-auto px-6!">
          <SectionHeading title="Frequently Asked Questions" subtitle="Quick Answers" />
          <div className="faq-grid">
            {faqs.slice(0, 6).map((faq: Faq) => (
              <article className="faq-card" key={faq.id}>
                <h3>{faq.question}</h3>
                <p>{renderLexicalText(faq.answer)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Local Trust Signals ── */}
      <section className="section-space">
        <div className="max-w-7xl mx-auto px-6!">
          <div className="classes-link-panel" style={{ background: 'linear-gradient(150deg, rgba(45,31,20,0.95), rgba(45,31,20,0.98))', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="classes-link-copy">
              <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.55)' }}>Local Trust Signals</p>
              <h2 style={{ color: '#fff' }}>Based in Chandlodiya and serving bookings across Ahmedabad.</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                {businessName} keeps the business name, phone number, address, and map reference consistent across the site so local searchers can connect the website with the Google Business Profile and local map listing.
              </p>
              <p className="classes-inline-links" style={{ color: 'rgba(255,255,255,0.55)' }}>
                <span>{businessName}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
                <span>{phone}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
                <span>Chandlodiya, Ahmedabad</span>
              </p>
            </div>
            <div className="classes-link-actions">
              <a
                className="btn-brand"
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                View Map Location
              </a>
              <Link
                className="btn-outline-brand"
                href="/contact"
                style={{ borderColor: 'rgba(255,255,255,0.25)', color: '#fff', background: 'rgba(255,255,255,0.08)' }}
              >
                See Contact Details
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
