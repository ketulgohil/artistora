'use server'

import SectionHeading from '@/components/SectionHeading'
import {
  getSiteSettings,
  getYouTubeVideos,
  getFAQs,
} from '@/lib/payload'
import type { SiteSetting, YoutubeVideo, Faq } from '@/payload-types'

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

export default async function ClassesPage() {
  const [settings, youtubeVideos, faqs] = await Promise.all([
    getSiteSettings() as Promise<SiteSetting>,
    getYouTubeVideos() as Promise<YoutubeVideo[]>,
    getFAQs() as Promise<Faq[]>,
  ])

  const bookingUrl = settings.bookingFormUrl || ''
  const whatsappNumber = settings.whatsappNumber || '918469662012'
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`
  const youtubeUrl = settings.youtubeUrl || 'https://www.youtube.com/@ShivaMehndiArtAndClasses'

  const classTopics = [
    'Paste and cone making',
    'Traditional belts',
    'Chex',
    'Peacock',
    'Startup bunch',
    'Bridal figures',
    'Doli and elephant',
    'Bridal startup',
    'Engagement figures',
  ]

  const classHighlights = [
    {
      title: 'Basic To Advanced',
      text: 'The class is designed for learners who want to start with the fundamentals and move toward bridal-ready mehndi practice.',
    },
    {
      title: 'Certificate Provided',
      text: 'Students receive a certificate after completing the class, making it easier to build confidence and showcase learning progress.',
    },
    {
      title: 'Offline Learning',
      text: 'The classes are held in Chandlodiya, Ahmedabad, making them practical for students coming from nearby areas who want direct in-person guidance.',
    },
  ]

  const schedule = ['10:00 AM to 12:00 PM', '2:00 PM to 4:00 PM']

  const classesFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes('class') ||
      f.question.toLowerCase().includes('learn')
  )

  return (
    <div>
      {/* ── Hero ── */}
      <section className="section-space" style={{ background: 'var(--color-surface)' }}>
        <div className="max-w-7xl mx-auto px-6!">
          <div className="classes-hero-panel">
            <div>
              <p className="eyebrow">Basic To Advanced Mehndi Training</p>
              <h1 className="text-3xl md:text-4xl font-bold mb-4!" style={{ color: 'var(--color-text-primary)', lineHeight: 1.15 }}>
                Offline Mehndi Classes in Ahmedabad — Basic to Advanced Training in Chandlodiya
              </h1>
              <p className="text-base mb-6!" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                These mehndi classes in Ahmedabad are designed for learners who
                want structured offline guidance, step-by-step teaching, and
                practical practice with traditional and bridal design elements.
                If you are searching for mehndi classes in Chandlodiya or want
                a nearby mehndi class from Gota, Ghatlodiya, Sola, Jagatpur,
                Ranip, Vandematram, or Akhbarnagar, this is the dedicated
                offline training location.
              </p>
              <p className="classes-inline-links mb-6!">
                <a href="/portfolio">See design portfolio</a>
                <span> / </span>
                <a href="/contact">Contact for class details</a>
              </p>
              <div className="flex flex-wrap gap-3!">
                <a className="btn-brand" href={bookingUrl} target="_blank" rel="noreferrer">
                  Book Your Seat
                </a>
                <a className="btn-outline-brand" href={youtubeUrl} target="_blank" rel="noreferrer">
                  Subscribe on YouTube
                </a>
                <a className="btn-outline-soft" href={whatsappUrl} target="_blank" rel="noreferrer">
                  Ask On WhatsApp
                </a>
              </div>
            </div>

            <div className="classes-poster-card">
              <img
                src="/api/media/file/shivu-large.webp"
                alt="Shiva Mehndi Art classes"
                loading="lazy"
                decoding="async"
              />
              <p className="classes-poster-title">Learn Basic to Advanced Mehndi Techniques</p>
              <p className="classes-poster-note">Certificate will be provided</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Topics ── */}
      <section className="section-space">
        <div className="max-w-7xl mx-auto px-6!">
          <SectionHeading title="What You Will Learn" subtitle="Comprehensive curriculum" />
          <div className="classes-topic-grid">
            {classTopics.map((topic) => (
              <div className="classes-topic-chip" key={topic}>
                <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--color-brand)' }}>
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
                <span>{topic}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Highlights ── */}
      <section className="section-space" style={{ background: 'var(--color-surface)' }}>
        <div className="max-w-7xl mx-auto px-6!">
          <SectionHeading title="Class Benefits" subtitle="What you get" />
          <div className="classes-highlight-grid">
            {classHighlights.map((item) => (
              <article className="classes-highlight-card" key={item.title}>
                <p className="eyebrow">Class Benefit</p>
                <h3>{item.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── YouTube Videos ── */}
      <section className="section-space">
        <div className="max-w-7xl mx-auto px-6!">
          <SectionHeading
            title="Watch Class Videos"
            subtitle="Practice clips and tutorials"
          />
          <div className="youtube-grid">
            {youtubeVideos.map((v: YoutubeVideo) => (
              <div key={v.id}>
                <div className="youtube-card">
                  <iframe
                    src={`https://www.youtube.com/embed/${v.videoId}`}
                    title={v.title || 'Shiva Mehndi Art video'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full aspect-video"
                    style={{ border: 'none', display: 'block' }}
                    loading="lazy"
                  />
                  <span className="youtube-video-title">{v.title}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8!">
            <a className="btn-outline-brand" href={youtubeUrl} target="_blank" rel="noreferrer">
              Subscribe on YouTube
            </a>
          </div>
        </div>
      </section>

      {/* ── Batch Timings & Location ── */}
      <section className="section-space" style={{ background: 'var(--color-surface)' }}>
        <div className="max-w-7xl mx-auto px-6!">
          <SectionHeading
            title="Batch Timings & Location"
            subtitle="Plan your schedule"
          />
          <div className="classes-detail-grid">
            <article className="classes-detail-card">
              <p className="eyebrow">New Batches</p>
              <h3>Ongoing enrollment</h3>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Ask about the next available batch and reserve early if you want
                your preferred timing.
              </p>
            </article>

            <article className="classes-detail-card">
              <p className="eyebrow">Location</p>
              <h3>Chandlodiya, Ahmedabad</h3>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Offline mehndi classes in Chandlodiya with direct in-person
                support and guidance.
              </p>
            </article>

            <article className="classes-detail-card">
              <p className="eyebrow">Timing</p>
              <h3>Choose your batch</h3>
              <ul className="classes-timing-list">
                {schedule.map((slot) => (
                  <li key={slot}>
                    <span className="inline-flex items-center gap-2!">
                      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--color-brand)' }}>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {slot}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      {classesFaqs.length > 0 && (
        <section className="section-space">
          <div className="max-w-7xl mx-auto px-6!">
            <SectionHeading
              title="Class FAQs"
              subtitle="Common questions about classes"
            />
            <div className="faq-grid">
              {classesFaqs.map((faq: Faq) => (
                <article className="faq-card" key={faq.id}>
                  <h3>{faq.question}</h3>
                  <p>{renderLexicalText(faq.answer)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA ── */}
      <section className="section-space" style={{ background: 'var(--color-surface)' }}>
        <div className="max-w-7xl mx-auto px-6!">
          <div className="classes-link-panel">
            <div className="classes-link-copy">
              <h2 style={{ color: 'var(--color-text-primary)' }}>Ready to start your mehndi journey?</h2>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Book your seat or reach out on WhatsApp to learn more about batch
                availability and pricing.
              </p>
            </div>
            <div className="classes-link-actions">
              <a className="btn-brand" href={bookingUrl} target="_blank" rel="noreferrer">
                Reserve Your Seat
              </a>
              <a className="btn-outline-brand" href={whatsappUrl} target="_blank" rel="noreferrer">
                Ask on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
