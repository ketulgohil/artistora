import 'server-only'
import Link from 'next/link'
import { getSiteSettings, getServices } from '@/lib/payload'
import SectionHeading from '@/components/SectionHeading'

export default async function BridalMehndiPage() {
  const [settings, services] = await Promise.all([
    getSiteSettings(),
    getServices(),
  ])

  const bookingUrl = (settings as any).bookingFormUrl || ''
  const whatsappNumber = ((settings as any).whatsappNumber || '918469662012').replace(/[^0-9]/g, '')
  const whatsappUrl = `https://wa.me/${whatsappNumber}`

  const bridalService = (services as any[]).find(
    (s: any) => s.slug && s.slug.includes('bridal')
  )

  const highlights = [
    {
      title: 'Intricate Detailing',
      text: 'Every design is composed with dense traditional motifs, delicate filigree, and balanced spacing that creates a rich, elegant look for your wedding day.',
    },
    {
      title: 'Premium Finish',
      text: 'Clean lines, deep color payoff, and precise finishing that photographs beautifully and stays vibrant through your wedding ceremonies.',
    },
    {
      title: 'Custom Patterns',
      text: 'Designs are tailored around your outfit, jewelry, and personal style from traditional Rajasthani to contemporary Arabic fusions.',
    },
  ]

  const bookingSteps = [
    { step: '01', title: 'Share Your Event Details', text: 'Tell us your wedding date, venue location in Ahmedabad, and the coverage you need.' },
    { step: '02', title: 'Discuss The Design', text: 'We work through your outfit, jewelry, and preferred style traditional, contemporary, or a custom blend.' },
    { step: '03', title: 'Confirm Your Booking', text: 'Once the design direction and schedule are set, a booking advance secures your date.' },
    { step: '04', title: 'Enjoy Your Bridal Mehndi', text: 'The artist arrives at your venue with everything needed for a relaxed, well-timed mehndi session.' },
  ]

  const faqs = [
    {
      q: 'How far in advance should I book bridal mehndi?',
      a: 'Booking 2-4 weeks in advance is recommended, especially during wedding season (Oct-Feb). Last-minute bookings may be accommodated if the schedule allows.',
    },
    {
      q: 'Do you provide home service for bridal mehndi in Ahmedabad?',
      a: 'Yes, bridal mehndi home service is available across Ahmedabad including Chandlodiya, Ghatlodiya, Gota, Sola, Jagatpur, and nearby areas. Travel is included within these zones.',
    },
    {
      q: 'How long does a bridal mehndi session take?',
      a: 'A full bridal design (both hands up to arms and feet) typically takes 3-5 hours depending on the complexity and coverage level chosen.',
    },
    {
      q: 'Can I book mehndi for bridesmaids and family too?',
      a: 'Yes, group bookings for the bride, bridesmaids, and family members are welcome. The session is planned with coordinated scheduling and consistent design quality.',
    },
    {
      q: 'Do you offer trial or preview sessions?',
      a: 'Design references and style discussions are done in advance. A full trial session can be arranged separately if needed. Please inquire when booking.',
    },
  ]

  return (
    <section className="section-space">
      <div className="max-w-7xl mx-auto px-4!">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8! items-center mb-16!">
          <div>
            <p className="eyebrow">Bridal Mehndi Artist Ahmedabad</p>
            <h1 className="text-4xl md:text-5xl leading-tight mb-4!" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
              Premium bridal mehndi designed around your wedding story.
            </h1>
            <p className="text-base leading-relaxed mb-6!" style={{ color: 'var(--color-text-secondary)' }}>
              Every bridal mehndi session at Shiva Mehndi Art is built around the bride&apos;s
              personality, outfit, and the scale of the wedding. From dense traditional motifs
              to light contemporary accents, the design is composed with care and finished to
              read beautifully in photographs. Based in Chandlodiya, Ahmedabad, with home
              service across the city.
            </p>
            <div className="flex flex-wrap gap-3!">
              <a className="btn btn-brand" href={bookingUrl} target="_blank" rel="noreferrer">
                Book Bridal Mehndi
              </a>
              <a className="btn btn-outline-brand" href={whatsappUrl} target="_blank" rel="noreferrer">
                Ask on WhatsApp
              </a>
            </div>
          </div>
          <div className="rounded-xl! overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <img
              src="/api/media/file/Bridal.webp"
              alt="Bridal mehndi by Shiva Mehndi Art"
              width={1400}
              height={933}
              className="w-full h-80 md:h-96 object-cover"
            />
          </div>
        </div>

        <SectionHeading title="What Makes It Special" subtitle="Bridal Mehndi Craft" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6! mb-16!">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="service-promise-card"
              style={{ background: 'white', borderColor: 'var(--color-border)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
            >
              <div className="w-10 h-0.5 mb-4!" style={{ background: 'var(--color-brand)' }} />
              <h3 className="text-xl mb-3!" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{item.text}</p>
            </article>
          ))}
        </div>

        <SectionHeading title="How Booking Works" subtitle="Simple Steps To Your Bridal Mehndi" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6! mb-16!">
          {bookingSteps.map((item) => (
            <article
              key={item.step}
              className="service-process-card"
              style={{ background: 'white', borderColor: 'var(--color-border)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
            >
              <span
                className="inline-block font-bold tracking-wider mb-2!"
                style={{ color: 'var(--color-brand)', fontSize: '0.75rem' }}
              >
                Step {item.step}
              </span>
              <h3 className="text-lg mb-2!" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{item.text}</p>
            </article>
          ))}
        </div>

        {bridalService && (
          <div className="mb-16!">
            <SectionHeading title={bridalService.title} subtitle="Service Detail" />
            <div className="max-w-3xl mx-auto text-center">
              <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{bridalService.description}</p>
              {(bridalService.points?.length > 0) && (
                <ul className="flex flex-wrap justify-center gap-4! mt-6!">
                  {(bridalService.points).map((p: any, i: number) => (
                    <li
                      key={i}
                      className="portfolio-highlight-card px-4! py-3!"
                      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                    >
                      <strong>{p.point || p}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <section>
          <SectionHeading title="Bridal Mehndi FAQs" subtitle="Common Questions" />
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6! mb-16!">
            {faqs.map((faq) => (
              <article
                key={faq.q}
                className="faq-card"
                style={{ background: 'white', borderColor: 'var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}
              >
                <h3 className="text-lg mb-2!" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{faq.q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{faq.a}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="text-center mb-4! py-12! px-8!" style={{ background: 'var(--color-surface-alt)', borderRadius: 16, border: '1px solid var(--color-border)' }}>
          <h2 className="text-2xl md:text-3xl mb-3!" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
            Ready to book your bridal mehndi?
          </h2>
          <p className="mb-6!" style={{ color: 'var(--color-text-muted)' }}>
            Share your wedding date and design preferences.
          </p>
          <div className="flex flex-wrap gap-3! justify-center">
            <a className="btn btn-dark-brand" href={bookingUrl} target="_blank" rel="noreferrer">
              Book Your Bridal Mehndi
            </a>
            <Link className="btn btn-outline-brand" href="/portfolio">
              View Bridal Portfolio
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
