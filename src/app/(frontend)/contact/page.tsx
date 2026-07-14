'use server'

import SectionHeading from '@/components/SectionHeading'
import { getSiteSettings } from '@/lib/payload'

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 4l-10 8L2 4" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ArrowUpRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  )
}

export default async function ContactPage() {
  const settings = (await getSiteSettings()) as any

  const businessName = settings.businessName || 'Shiva Mehndi Art'
  const phone = settings.phone || '+91 8469662012'
  const email = settings.email || ''
  const address = settings.address || ''
  const bookingUrl = settings.bookingFormUrl || ''
  const whatsappNumber = settings.whatsappNumber || '918469662012'
  const googleMapUrl = settings.googleMapUrl || ''

  const mapSrc = googleMapUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d29388.253119139237!2d72.538!3d23.036!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e84f6b1f7c1b7%3A0x1e8f8f8f8f8f8f8f!2sChandlodiya%2C%20Ahmedabad!5e0!3m2!1sen!2sin!4v1'

  const bookingInfo = [
    'Your event date',
    'Location in Ahmedabad',
    'Occasion type',
    'Approximate number of people',
    'Preferred mehndi style',
  ]

  return (
    <section className="section-space">
      <div className="max-w-7xl mx-auto px-4!">
        <SectionHeading title="Contact" subtitle="Book Your Mehndi Session" />

        <div className="contact-hero-panel">
          <div className="contact-panel text-left">
            <p className="eyebrow">Book Mehndi Artist In Ahmedabad</p>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              Reach out for bridal mehndi, festive bookings, events, and classes.
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mt-3!">
              Whether you are planning a wedding, engagement, baby shower, family event, or want to know more about mehndi classes, Shiva Mehndi Art makes it easy to book a professional mehndi artist in Ahmedabad through direct call, WhatsApp, or the booking form. The studio is based in Chandlodiya and regularly serves nearby areas like Gota, Ghatlodiya, Sola, and Science City along with home service across Ahmedabad.
            </p>

            {bookingUrl && (
              <div className="contact-prompt mt-5!">
                <strong className="text-[var(--color-text-primary)]">For a faster reply, share:</strong>
                <span className="block text-sm text-[var(--color-text-muted)] mt-1!">{bookingInfo.join(', ')}.</span>
              </div>
            )}

            <div className="space-y-3! mt-6!">
              <div className="contact-info-card">
                <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--color-surface)] flex items-center justify-center" style={{ color: 'var(--color-brand)' }}>
                  <PhoneIcon />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Phone</p>
                  <a href={`tel:${phone}`} className="font-semibold" style={{ color: 'var(--color-brand)' }}>{phone}</a>
                </div>
              </div>

              {email && (
                <div className="contact-info-card">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--color-surface)] flex items-center justify-center" style={{ color: 'var(--color-brand)' }}>
                    <MailIcon />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Email</p>
                    <a href={`mailto:${email}`} className="text-sm font-semibold" style={{ color: 'var(--color-brand)' }}>{email}</a>
                  </div>
                </div>
              )}

              <div className="contact-info-card">
                <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--color-surface)] flex items-center justify-center" style={{ color: 'var(--color-brand)' }}>
                  <MapPinIcon />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Address</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{address}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3! mt-6!">
              {bookingUrl && (
                <a className="btn-brand" href={bookingUrl} target="_blank" rel="noreferrer">
                  Open Booking Form
                </a>
              )}
              <a className="btn-outline-brand" href={`tel:${phone}`}>
                Call Directly
              </a>
            </div>
          </div>

          <div className="space-y-4!">
            <div className="contact-info-card flex-col! items-start">
              <p className="eyebrow">Service Reach</p>
              <h3 className="font-semibold text-[var(--color-text-primary)]">Home service available across Ahmedabad.</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Bookings can be discussed for bridal sessions, engagement functions, baby showers, festive appointments, and other special events in Chandlodiya, Gota, Ghatlodiya, Sola, Science City, and other areas with home service across Ahmedabad.
              </p>
            </div>
            <div className="contact-info-card flex-col! items-start">
              <p className="eyebrow">Also Available</p>
              <h3 className="font-semibold text-[var(--color-text-primary)]">Offline mehndi classes for learners.</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                If you are interested in learning mehndi, you can also use this page to ask about class details and guidance for offline classes in Chandlodiya, Ahmedabad, especially if you are looking for a nearby class from Gota, Ghatlodiya, Sola, or Science City.
              </p>
            </div>
          </div>
        </div>

        <div className="contact-form-section mt-12!">
          <div className="text-center mb-6!">
            <p className="eyebrow">Booking Form</p>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Send your inquiry directly from the website.</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2! max-w-2xl mx-auto">
              Fill out the booking form below. Your responses will be saved securely and can be reviewed for availability and follow-up.
            </p>
          </div>
          <div className="map-card">
            <iframe
              title="Shiva Mehndi Art booking form"
              src={bookingUrl}
              loading="lazy"
              style={{ minHeight: '800px', border: 0, width: '100%' }}
            />
          </div>
          <div className="contact-form-note">
            <p>After submitting the form, you will see a confirmation message. We will then contact you on call or WhatsApp to discuss availability and booking details.</p>
            <p className="mt-1!">After your form is submitted, you can also continue here for confirmation details:</p>
            <a href="/thank-you" className="inline-flex items-center gap-1! font-semibold underline mt-1!" style={{ color: 'var(--color-brand)' }}>
              https://www.shivamehndiart.com/thank-you
              <ArrowUpRightIcon />
            </a>
          </div>
        </div>

        <div className="map-card mt-12!">
          <iframe
            title={`${businessName} location`}
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="contact-panel mt-12!">
          <p className="eyebrow">WhatsApp</p>
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Chat on WhatsApp</h3>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl mx-auto mt-2! mb-6!">
            Prefer to message directly? Reach out on WhatsApp for quick queries, availability checks, or to discuss your mehndi design preferences.
          </p>
          <div className="flex flex-wrap gap-3! justify-center">
            <a className="btn-brand" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">
              Message on WhatsApp
            </a>
            <a className="btn-outline-brand" href={`tel:${phone}`}>
              Call {phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
