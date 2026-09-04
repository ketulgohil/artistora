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
            Artistora helps customers discover and contact independent artists and
            event professionals. By using the enquiry or booking flow, you agree
            to the following marketplace terms.
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
                A quote request or booking request is not a confirmed booking.
                The booking becomes confirmed only after the assigned professional
                accepts it and the customer and professional agree on the date,
                scope, location, timing, and price. Artistora may assist with
                matching and coordination, including through phone or WhatsApp.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                Payment &amp; Cancellation
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                During the current pilot, customers generally pay the professional
                directly using the method agreed between them. Artistora does not
                currently require a platform advance or hold service payments for
                every category. Any deposit, balance, cancellation charge, or
                rescheduling arrangement must be clearly agreed with the
                professional before confirmation. Artistora will record booking
                status and help resolve communication issues, but does not create
                terms that were never agreed by the parties.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                Service Area
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                Availability, travel radius, studio or home service, and travel
                charges vary by professional and category. Confirm the service
                address and any travel or accommodation charges before accepting a
                quote. Artistora currently operates primarily in Ahmedabad and
                nearby areas, subject to the professional&apos;s availability.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                Timing
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                The professional and customer should agree on arrival time, setup
                requirements, service duration, and deliverables before the booking
                is confirmed. Delays, scope changes, or additional time may affect
                the agreed price and should be discussed directly as soon as
                possible.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                Independent Professionals
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                Professionals listed on Artistora operate independently. Profiles,
                reviews, and verification signals are provided to help customers
                make informed choices, but customers should confirm the final
                service details directly with the professional. Artistora does not
                guarantee a particular creative result or replace the customer&apos;s
                agreement with the professional.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                Contact
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                For questions or changes regarding a booking, contact the
                professional first and reach Artistora at{' '}
                <a
                  href="tel:+917405387720"
                  className="font-semibold text-brand-deep underline decoration-gold/60 underline-offset-4 transition-colors duration-200 hover:text-brand"
                >
                  +91 74053 87720
                </a>{' '}
                . We can help with marketplace coordination and status questions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
