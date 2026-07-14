import 'server-only'

import Link from 'next/link'
import SectionHeading from '@/components/SectionHeading'
import { getSiteSettings } from '@/lib/payload'

export default async function HomeServiceMehndiPage() {
  const settings = (await getSiteSettings()) as any

  const businessName = settings.businessName || 'Shiva Mehndi Art'
  const bookingUrl = settings.bookingFormUrl || ''
  const phone = settings.phone || '+91 8469662012'
  const whatsappNumber = settings.whatsappNumber || '918469662012'

  const coverageAreas = [
    'Chandlodiya',
    'Ghatlodiya',
    'Gota',
    'Sola',
    'Jagatpur',
    'Ranip',
    'Vandematram',
    'Akhbarnagar',
    'Bodakdev',
    'Thaltej',
    'SG Highway',
    'Bopal',
  ]

  const howItWorks = [
    {
      step: '1',
      title: 'Share Your Details',
      text: 'Tell us your event date, occasion (bridal, engagement, baby shower, or family function), and your location in Ahmedabad.',
    },
    {
      step: '2',
      title: 'Discuss Design & Coverage',
      text: 'We talk through the mehndi style, coverage level, number of people, and any special preferences you have in mind.',
    },
    {
      step: '3',
      title: 'Confirm Your Booking',
      text: 'Once the date, timing, and pricing are finalised, a booking advance secures your slot. We confirm everything in writing.',
    },
    {
      step: '4',
      title: 'We Come To You',
      text: 'The artist arrives at your home or venue on the scheduled day with all materials. Relax and enjoy your mehndi session.',
    },
  ]

  return (
    <section className="section-space">
      <div className="max-w-7xl mx-auto px-4!">
        <SectionHeading title="Home Service Mehndi in Ahmedabad" subtitle="Bringing Mehndi To Your Doorstep" />

        <div className="services-hero-panel mb-16!">
          <div className="services-hero-copy">
            <p className="eyebrow">Professional Mehndi At Your Location</p>
            <h1 className="text-4xl md:text-5xl leading-tight mb-4!" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
              Home service mehndi across Ahmedabad for bridal and event celebrations.
            </h1>
            <p className="text-base leading-relaxed mb-6!" style={{ color: 'var(--color-text-secondary)' }}>
              {businessName} provides home service mehndi across Ahmedabad for clients who prefer
              the comfort and convenience of getting mehndi done at their own location. Whether it&apos;s
              a bridal booking, an engagement ceremony, a baby shower, or a family function, the artist
              travels to your venue with all the necessary materials and setup.
            </p>
            <p className="classes-inline-links mb-6! flex items-center gap-3! text-sm">
              <Link href="/bridal-mehndi" className="font-medium" style={{ color: 'var(--color-brand)' }}>Explore Bridal Mehndi</Link>
              <span style={{ color: 'var(--color-border)' }}>/</span>
              <Link href="/contact" className="font-medium" style={{ color: 'var(--color-brand)' }}>Check Availability</Link>
            </p>
          </div>
          <div className="services-hero-side">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4!">
              <div className="service-quick-card" style={{ background: 'white', borderColor: 'var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <strong style={{ color: 'var(--color-brand)' }}>Bridal Home Service</strong>
                <span className="text-sm block mt-1!" style={{ color: 'var(--color-text-muted)' }}>Full bridal mehndi at your venue with premium detailing</span>
              </div>
              <div className="service-quick-card" style={{ background: 'white', borderColor: 'var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <strong style={{ color: 'var(--color-brand)' }}>Event Bookings</strong>
                <span className="text-sm block mt-1!" style={{ color: 'var(--color-text-muted)' }}>Engagement, baby shower, and family function mehndi sessions</span>
              </div>
              <div className="service-quick-card" style={{ background: 'white', borderColor: 'var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <strong style={{ color: 'var(--color-brand)' }}>Group Sessions</strong>
                <span className="text-sm block mt-1!" style={{ color: 'var(--color-text-muted)' }}>Bride, bridesmaids, family, and guests all in one session</span>
              </div>
              <div className="service-quick-card" style={{ background: 'white', borderColor: 'var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <strong style={{ color: 'var(--color-brand)' }}>Quick Setup</strong>
                <span className="text-sm block mt-1!" style={{ color: 'var(--color-text-muted)' }}>Arrive, set up, and start. Minimal disruption to your event flow</span>
              </div>
            </div>
          </div>
        </div>

        <SectionHeading title="Coverage Areas in Ahmedabad" subtitle="Where We Serve" />
        <div className="mb-16!">
          <p className="leading-relaxed mb-6! max-w-3xl mx-auto text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Home service is available across Ahmedabad. Below are the areas we regularly serve.
            For locations outside these areas, please inquire and we&apos;ll confirm availability along with any travel arrangements.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3!">
            {coverageAreas.map((area) => (
              <div
                key={area}
                className="service-promise-card text-center py-4!"
                style={{ background: 'white', borderColor: 'var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{area}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="services-split-info mb-16!">
          <div className="service-process-card" style={{ background: 'white', borderColor: 'var(--color-border)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
            <p className="eyebrow">What To Expect</p>
            <h3 className="text-xl mb-4!" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>A smooth, comfortable mehndi experience at your venue.</h3>
            <ul className="service-points">
              <li>The artist arrives at your venue at the scheduled time with all materials</li>
              <li>Setup is quick and practical, designed around the available space</li>
              <li>Timing is planned based on the number of people and design complexity</li>
              <li>Design preferences can be discussed in advance for a smooth session</li>
              <li>Clean-up is handled by the artist after the session is complete</li>
            </ul>
          </div>
          <div className="service-process-card" style={{ background: 'white', borderColor: 'var(--color-border)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
            <p className="eyebrow">Perfect For</p>
            <h3 className="text-xl mb-4!" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Any occasion that deserves beautiful mehndi.</h3>
            <ul className="service-points">
              <li>Bridal mehndi at home or wedding venue</li>
              <li>Engagement and sangeet ceremonies</li>
              <li>Baby showers and family gatherings</li>
              <li>Festival mehndi for Karwa Chauth, Diwali, Teej, and more</li>
              <li>Multi-person group bookings for weddings and events</li>
            </ul>
          </div>
        </div>

        <SectionHeading title="How It Works" subtitle="Four Simple Steps" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6! mb-16!">
          {howItWorks.map((item) => (
            <article
              key={item.step}
              className="service-promise-card text-center"
              style={{ background: 'white', borderColor: 'var(--color-border)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4!"
                style={{
                  background: 'var(--color-brand)',
                  color: '#fff',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                }}
              >
                {item.step}
              </div>
              <h3 className="text-lg mb-2!" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{item.text}</p>
            </article>
          ))}
        </div>

        <div
          className="pricing-note"
          style={{ background: 'white', borderColor: 'var(--color-border)', maxWidth: 720, boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}
        >
          <h3 className="text-2xl" style={{ color: 'var(--color-text-primary)' }}>Ready To Book Your Home Service Mehndi?</h3>
          <p className="leading-relaxed mb-6!" style={{ color: 'var(--color-text-muted)' }}>
            Share your event date, location in Ahmedabad, and design preferences. We&apos;ll
            confirm availability and provide a custom quote based on your requirements.
          </p>
          <div className="flex flex-wrap gap-3! justify-center">
            {bookingUrl && (
              <a className="btn btn-brand" href={bookingUrl} target="_blank" rel="noreferrer">
                Book A Session
              </a>
            )}
            <a
              className="btn btn-outline-brand"
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
            >
              Ask On WhatsApp
            </a>
            <Link className="btn btn-outline-brand" href="/contact">
              Contact Us
            </Link>
          </div>
        </div>

        <div className="text-center mt-12! mb-4! py-8! px-8!" style={{ background: 'var(--color-surface-alt)', borderRadius: 16, border: '1px solid var(--color-border)' }}>
          <p className="mb-4! text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Also explore our other services
          </p>
          <p className="classes-inline-links flex items-center justify-center gap-3! text-sm">
            <Link href="/bridal-mehndi" className="font-medium" style={{ color: 'var(--color-brand)' }}>Bridal Mehndi in Ahmedabad</Link>
            <span style={{ color: 'var(--color-border)' }}>/</span>
            <Link href="/classes" className="font-medium" style={{ color: 'var(--color-brand)' }}>Mehndi Classes in Ahmedabad</Link>
            <span style={{ color: 'var(--color-border)' }}>/</span>
            <Link href="/portfolio" className="font-medium" style={{ color: 'var(--color-brand)' }}>View Portfolio</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
