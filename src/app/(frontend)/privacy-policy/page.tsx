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
            Artistora respects your privacy. This policy outlines how we
            collect, use, and protect your information when you use our platform,
            website, or services.
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
                We may collect personal information such as your name, phone number,
                email address, and event details when you fill out our booking form
                or contact us through the website. We also collect non-personal data
                such as browser type and usage patterns to improve our website
                experience.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                How We Use It
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                Your information is used solely to respond to your inquiries,
                connect you with verified mehndi artists, confirm bookings, and
                improve our offerings. We do not sell or share your data with third
                parties for marketing purposes.
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
                We may use third-party service providers, such as payment
                processors and analytics tools, to support our website and business
                operations. These third parties have their own privacy policies and
                may collect data necessary to perform their functions. We encourage
                you to review their policies for more information.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink">
                Contact
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
                If you have questions about this policy or how your data is
                handled, please contact us at{' '}
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
