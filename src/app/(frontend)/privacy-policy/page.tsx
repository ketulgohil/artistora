const CONTAINER = 'mx-auto max-w-6xl px-4! md:px-6!'

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4! flex items-center gap-3! text-[0.7rem] font-semibold tracking-[0.3em] text-brand uppercase">
      <span aria-hidden="true" className="h-px w-8 bg-brand/50" />
      {children}
    </p>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* ── Page Hero ── */}
      <section className="border-b border-line/70 bg-white/60">
        <div className={`${CONTAINER} py-12! md:py-16!`}>
          <Eyebrow>How We Handle Your Information</Eyebrow>
          <h1 className="font-display text-4xl! leading-[1.15] font-semibold text-ink md:text-5xl!">
            Privacy Policy
          </h1>
          <p className="mt-6! max-w-2xl! text-[0.95rem] leading-relaxed text-ink-soft">
            Artistora is a marketplace that helps customers discover independent
            professionals. This policy explains what information we collect and
            how we use it across our website, enquiry, booking, and artist services.
          </p>
        </div>
      </section>

      {/* ── Policy Content ── */}
      <section className="py-16! md:py-24!">
        <div className="mx-auto max-w-3xl! px-4! md:px-6!">
          <div className="flex flex-col gap-9! rounded-[2rem] border border-line bg-white px-6! py-10! shadow-soft md:px-10! md:py-12!">
            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                Information We Collect
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                We may collect your name, phone number, optional email address,
                event details, location, service preferences, budget, and messages
                when you request a quote, make a booking enquiry, contact us, or
                communicate through WhatsApp. For professionals, we may collect
                profile, portfolio, service-area, pricing, verification, and
                account information. We may also receive basic device and usage
                information needed to operate and improve the website.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                How We Use It
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                We use information to respond to enquiries, match customers with
                relevant professionals, share the details needed to prepare a
                quote, coordinate bookings, support reviews, maintain artist
                verification, prevent misuse, and improve Artistora. We do not
                sell personal information. We may share relevant details with the
                professionals a customer asks us to contact and with service
                providers that help us operate the platform.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                Data Protection
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                We take reasonable precautions to protect your personal information
                using industry-standard security measures. However, no method of
                transmission over the internet or electronic storage is 100%
                secure. We encourage you to take steps to protect your own
                information as well.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                Third-Party Services
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                We may use hosting, database, storage, email, analytics, and
                messaging providers to operate Artistora. During the current
                pilot, customers generally arrange payment directly with the
                independent professional; Artistora does not require online
                payment for every booking. If online payments or subscriptions
                are introduced, this policy and the relevant payment terms will be
                updated before that feature is used.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                Contact
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                If you have questions, want to correct your information, or want
                to ask about deletion, please contact Artistora at{' '}
                <a
                  href="mailto:gohilketul5@gmail.com"
                  className="font-semibold text-brand-deep underline decoration-gold/60 underline-offset-4 transition-colors duration-200 hover:text-brand"
                >
                  gohilketul5@gmail.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
