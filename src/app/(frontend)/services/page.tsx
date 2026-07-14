import Link from 'next/link'
import { getServices, getSiteSettings, getFAQs, mediaUrl, mediaDimensions } from '@/lib/payload'
import SectionHeading from '@/components/SectionHeading'

function extractLexicalText(richText: any): string {
  if (!richText || !richText.root) return ''
  const paragraphs: string[] = []
  for (const child of richText.root.children || []) {
    if (child.children) {
      const text = child.children.map((c: any) => c.text || '').join('')
      paragraphs.push(text)
    }
  }
  return paragraphs.join('\n')
}

const serviceTags = [
  'Arabic and khafif style mehndi',
  'Festival and family function bookings',
  'Home service across Ahmedabad',
  'Offline mehndi classes for learners',
]

const promisePoints = [
  {
    title: 'Clean Detailing',
    text: 'Designs are built with attention to neat lines, balance, and finishing so they look rich both in person and in photographs.',
  },
  {
    title: 'Comfortable Experience',
    text: 'The service is handled with a calm pace and practical setup so the mehndi process feels smooth during busy occasions.',
  },
  {
    title: 'Occasion Fit',
    text: 'Design intensity and style can be adjusted based on the event, your outfit, and how bold or minimal you want the look to feel.',
  },
]

const addOns = [
  {
    title: 'Glitter & Embellishments',
    text: 'Add shimmer accents, crystals, or glitter highlights to make the design pop for evening events and receptions.',
  },
  {
    title: 'Multi-Person Bookings',
    text: 'Book for the bride, bridesmaids, family members, or guest groups with coordinated scheduling and consistent quality.',
  },
  {
    title: 'Extended Coverage',
    text: 'Choose from half-arm, full-arm, leg, or back detailing based on the event scale and how much coverage you want.',
  },
]

const serviceReviews = [
  {
    name: 'Urvika Parekh',
    source: 'Google Review',
    quote:
      'Very beautiful designs and excellent speed. I would highly recommend Bhumi for mehndi.',
  },
  {
    name: 'Rutva Krunal Prajapati',
    source: 'Google Review',
    quote:
      'They are among the best mehndi artists in Ahmedabad and made my day with beautiful, intricate work.',
  },
]

const serviceAreaNotes = [
  'Bridal bookings in Chandlodiya, Ghatlodiya, and nearby Ahmedabad areas',
  'Engagement and family event sessions with planning around your ceremony timing',
  'Home service scheduling based on location, design coverage, and guest count',
]

const planningPoints = [
  'Choose the event type and preferred design style before the call.',
  'Decide whether you need only the bride, only guests, or a mixed family booking.',
  'Share the location so arrival time and setup can be planned realistically.',
  'Keep inspiration images ready if you want a more specific bridal or Arabic direction.',
]

const bookingSteps = [
  'Share your date, occasion, and location.',
  'Discuss the design style or mehndi type you want.',
  'Confirm availability and booking details.',
  'Enjoy the mehndi session on your special day.',
]

const fallbackFaqs = [
  {
    question: 'Which mehndi services can be booked from this page?',
    answer:
      'You can inquire about bridal mehndi, engagement mehndi, baby shower bookings, family functions, Arabic style mehndi, home service appointments, and offline mehndi classes from this page.',
  },
  {
    question: 'Do you provide service outside Chandlodiya?',
    answer:
      'Yes. Shiva Mehndi Art is based in Chandlodiya and serves bookings across Ahmedabad including nearby neighborhoods like Ghatlodiya, with timing planned around the event and number of people.',
  },
  {
    question: 'What details help before confirming a booking?',
    answer:
      'It is best to share the date, occasion, area in Ahmedabad, approximate number of people, and the style or coverage level you want so the service can be planned properly.',
  },
]

export default async function ServicesPage() {
  const [services, settings, faqs] = await Promise.all([
    getServices(),
    getSiteSettings(),
    getFAQs(),
  ])

  const bookingUrl = (settings as any).bookingFormUrl || ''

  return (
    <section className="section-space">
      <div className="max-w-6xl mx-auto px-6!">
        <SectionHeading title="Services" subtitle="Crafted For Every Celebration" />

        {/* ── Hero Panel ── */}
        <div className="services-hero-panel">
          <div className="services-hero-copy">
            <p className="eyebrow">Mehndi Services In Ahmedabad</p>
            <h1 className="text-2xl md:text-3xl font-bold mb-3!" style={{ color: 'var(--color-text-primary)' }}>
              Bridal mehndi, event mehndi, and classes designed for every celebration.
            </h1>
            <p className="text-sm leading-relaxed mb-4!" style={{ color: 'var(--color-text-secondary)' }}>
              Shiva Mehndi Art offers bridal mehndi in Ahmedabad, engagement
              mehndi, baby shower mehndi, festive bookings, home service
              mehndi in Ahmedabad, and offline mehndi classes with a focus on
              elegant detail and a smooth booking experience.
            </p>
            <p className="classes-inline-links mb-4! flex items-center gap-2! text-sm">
              <Link href="/bridal-mehndi" className="font-medium">
                Explore bridal mehndi page
              </Link>
              <span>/</span>
              <Link href="/contact" className="font-medium">
                Check wedding date availability
              </Link>
            </p>
            <div className="services-tags">
              {serviceTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
          <div className="services-hero-side">
            <div className="service-quick-card">
              <strong>Home Service</strong>
              <span>Home service mehndi in Ahmedabad for bridal and event bookings</span>
            </div>
            <div className="service-quick-card">
              <strong>Classes</strong>
              <span>Offline mehndi learning support</span>
            </div>
          </div>
        </div>

        {/* ── Service Cards (alternating) ── */}
        <div className="space-y-8! mt-8! mb-8!">
          {(services as any[]).map((service: any, index: number) => (
            <article
              className={`service-card ${index % 2 === 1 ? 'reverse' : ''}`}
              key={service.id}
            >
              <div className="service-image-wrap rounded-xl! overflow-hidden">
                <img
                  src={service.image ? mediaUrl(service.image) : '/api/media/file/Bridal.webp'}
                  alt={service.title}
                  width={mediaDimensions(service.image).width}
                  height={mediaDimensions(service.image).height}
                  className="w-full min-h-[340px] object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="service-copy">
                <p className="eyebrow">Signature Mehndi Service</p>
                <h3 className="text-2xl md:text-3xl font-bold mb-3!" style={{ color: 'var(--color-text-primary)' }}>
                  {service.title}
                </h3>
                <p className="text-sm leading-relaxed mb-4!" style={{ color: 'var(--color-text-secondary)' }}>
                  {service.description}
                </p>
                {(service.points?.length > 0) && (
                  <ul className="service-points">
                    {(service.points).map((p: any, i: number) => (
                      <li key={i}>{p.point || p}</li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* ── Promise Grid ── */}
        <div className="service-promise-grid">
          {promisePoints.map((item) => (
            <article className="service-promise-card" key={item.title}>
              <p className="eyebrow">Why It Stands Out</p>
              <h3>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{item.text}</p>
            </article>
          ))}
        </div>

        {/* ── Review Snippet ── */}
        <div className="my-8!">
          <div
            className="rounded-2xl p-6 md:p-8!"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex flex-wrap justify-between items-end gap-4! mb-5!">
              <div>
                <p className="eyebrow">Client Reviews</p>
                <h3 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  What clients say after booking.
                </h3>
                <p className="text-sm mt-1!" style={{ color: 'var(--color-text-muted)' }}>
                  Small details and calm service are what clients notice most.
                </p>
              </div>
              <div
                className="min-w-[180px] px-4! py-3! rounded-xl"
                style={{ background: 'white', border: '1px solid var(--color-border)' }}
              >
                <strong className="block text-xl" style={{ color: 'var(--color-brand)' }}>5.0</strong>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Google rating with 114+ reviews</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4!">
              {serviceReviews.map((review) => (
                <article
                  key={review.name}
                  className="rounded-xl p-5!"
                  style={{ background: 'white', border: '1px solid var(--color-border)' }}
                >
                  <div className="mb-2!" style={{ color: '#f5b342', fontSize: '0.85rem' }}>
                    {'★'.repeat(5)}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {review.quote}
                  </p>
                  <div className="mt-3! pt-3!" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <strong className="block text-sm" style={{ color: 'var(--color-text-primary)' }}>{review.name}</strong>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{review.source}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* ── Services Split Info: Area + Before You Book ── */}
        <div className="services-split-info">
          <div className="service-process-card">
            <p className="eyebrow">Ahmedabad Coverage</p>
            <h3 className="text-lg font-bold mb-3!" style={{ color: 'var(--color-text-primary)' }}>
              Planning support for different event sizes and local areas.
            </h3>
            <ul className="service-points">
              {serviceAreaNotes.map((item) => (
                <li key={item} className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="service-process-card">
            <p className="eyebrow">Before You Book</p>
            <h3 className="text-lg font-bold mb-3!" style={{ color: 'var(--color-text-primary)' }}>
              A little preparation makes the inquiry much faster.
            </h3>
            <ol className="booking-flow">
              {planningPoints.map((item) => (
                <li key={item} className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{item}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Services Split Info: Booking Flow + Add-Ons ── */}
        <div className="services-split-info">
          <div className="service-process-card">
            <p className="eyebrow">How Booking Works</p>
            <h3 className="text-lg font-bold mb-3!" style={{ color: 'var(--color-text-primary)' }}>
              Simple, direct, and easy to plan.
            </h3>
            <ol className="booking-flow">
              {bookingSteps.map((step) => (
                <li key={step} className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{step}</li>
              ))}
            </ol>
          </div>
          <div className="service-process-card">
            <p className="eyebrow">What You Can Also Ask For</p>
            <h3 className="text-lg font-bold mb-3!" style={{ color: 'var(--color-text-primary)' }}>
              Flexible options for different celebrations.
            </h3>
            <ul className="service-points">
              {addOns.map((item) => (
                <li key={item.title} className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.title}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Class Callout ── */}
        <div className="class-callout">
          <div style={{ flex: 1, minWidth: 260 }}>
            <p className="eyebrow">Mehndi Classes</p>
            <h2 className="text-xl md:text-2xl font-bold mb-2!" style={{ color: 'var(--color-text-primary)' }}>
              Learning support for beginners and aspiring artists.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Offline sessions can help students improve cone control, flow,
              pattern composition, and confidence in practice with guided,
              in-person support.
            </p>
          </div>
          <div className="flex flex-wrap gap-3!">
            <a className="btn btn-brand" href="tel:+918469662012">
              Ask About Classes
            </a>
            <a className="btn btn-outline-soft" href="https://wa.me/918469662012" target="_blank" rel="noreferrer">
              WhatsApp For Details
            </a>
          </div>
        </div>

        {/* ── Pricing Note ── */}
        <div className="pricing-note">
          <p className="eyebrow">Booking Details</p>
          <h3 className="text-lg font-bold mb-2!" style={{ color: 'var(--color-text-primary)' }}>
            Plan your mehndi booking with the details that matter most.
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Clients often like to confirm service area coverage, booking lead
            time, bridal package preferences, and event requirements before
            finalizing their appointment.
          </p>
        </div>

        {/* ── FAQ ── */}
        <section className="section-space pb-0!">
          <SectionHeading title="Service FAQs" subtitle="Common Booking Questions" />
          <div className="faq-grid">
            {(faqs as any[]).length > 0 ? (
              (faqs as any[]).slice(0, 3).map((faq: any) => (
                <article className="faq-card" key={faq.id}>
                  <h3>{faq.question}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {extractLexicalText(faq.answer)}
                  </p>
                </article>
              ))
            ) : (
              fallbackFaqs.map((faq) => (
                <article className="faq-card" key={faq.question}>
                  <h3>{faq.question}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {faq.answer}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <div
          className="text-center mt-10! mb-8! py-10! px-6!"
          style={{ background: 'var(--color-surface-alt)', borderRadius: 16, border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-xl md:text-2xl font-bold mb-2!" style={{ color: 'var(--color-text-primary)' }}>
            Ready to Book Your Session?
          </h2>
          <p className="text-sm mb-5!" style={{ color: 'var(--color-text-muted)' }}>
            Reach out with your date and design preferences.
          </p>
          <div className="flex flex-wrap gap-3! justify-center">
            <a className="btn btn-dark-brand" href={bookingUrl} target="_blank" rel="noreferrer">
              Book Your Session
            </a>
            <Link className="btn btn-outline-brand" href="/portfolio">
              View Portfolio
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
