const CONTAINER = 'mx-auto max-w-6xl px-4! md:px-6!'

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4! flex items-center gap-3! text-[0.7rem] font-semibold tracking-[0.3em] text-brand uppercase">
      <span aria-hidden="true" className="h-px w-8 bg-brand/50" />
      {children}
    </p>
  )
}

export default function BookingPolicyPage() {
  return (
    <>
      {/* ── Page Hero ── */}
      <section className="border-b border-line/70 bg-white/60">
        <div className={`${CONTAINER} py-12! md:py-16!`}>
          <Eyebrow>Important Information Before Booking</Eyebrow>
          <h1 className="font-display text-4xl! leading-[1.15] font-semibold text-ink md:text-5xl!">
            Booking Policy
          </h1>
          <p className="mt-6! max-w-2xl! text-[0.95rem] leading-relaxed text-ink-soft">
            By booking a mehndi session through Artistora, you agree to the following terms and conditions.
          </p>
        </div>
      </section>

      {/* ── Policy Content ── */}
      <section className="py-16! md:py-24!">
        <div className="mx-auto max-w-3xl! px-4! md:px-6!">
          <div className="flex flex-col gap-9! rounded-[2rem] border border-line bg-white px-6! py-10! shadow-soft md:px-10! md:py-12!">
            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                Booking Confirmation
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                Bookings are confirmed once the date, occasion, and details are discussed and agreed upon.
                Verbal or written confirmation through WhatsApp, phone, or the booking form serves as confirmation.
                A booking is considered final only after both parties have acknowledged the schedule and scope of work.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                Payment &amp; Cancellation
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                A non-refundable deposit may be required to secure your booking for high-demand dates.
                Full payment is due on or before the day of the service unless otherwise agreed.
                Cancellations made at least 48 hours in advance may be rescheduled subject to availability.
                Late cancellations or no-shows may result in forfeiture of the deposit and affect future booking eligibility.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                Service Area
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                Home service is available across Ahmedabad and select surrounding areas.
                Locations outside the usual service area may be accommodated at an additional travel charge — please check availability before booking.
                For events outside the city, separate travel and accommodation arrangements must be discussed in advance.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                Timing
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                The artist will arrive at the agreed location at the scheduled time.
                Clients are requested to ensure the space is ready and the client is prepared at the time of arrival.
                Delays on the client&apos;s side may affect the service duration and design coverage.
                Extended sessions beyond the agreed time may incur additional charges.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                Contact
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                For any questions, changes, or clarifications regarding your booking, please reach out to our support team at{' '}
                <a
                  href="tel:+917405387720"
                  className="font-semibold text-brand-deep underline decoration-gold/60 underline-offset-4 transition-colors duration-200 hover:text-brand"
                >
                  +91 74053 87720
                </a>{' '}
                or email{' '}
                <a
                  href="mailto:bookings@artistora.com"
                  className="font-semibold text-brand-deep underline decoration-gold/60 underline-offset-4 transition-colors duration-200 hover:text-brand"
                >
                  bookings@artistora.com
                </a>
                . We are happy to assist you.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
