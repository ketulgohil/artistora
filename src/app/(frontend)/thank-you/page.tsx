import Link from 'next/link'

export default function ThankYouPage() {
  return (
    <section className="relative overflow-hidden py-20! md:py-28!">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-brand-light/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -bottom-24 h-72 w-72 rounded-full bg-gold/15 blur-3xl"
      />
      <div className="relative mx-auto max-w-xl! px-4!">
        <div className="rounded-[2rem] border border-line bg-white px-6! py-14! text-center shadow-lift md:px-12!">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-brand">
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="font-display mt-7! text-3xl! leading-snug font-semibold text-ink md:text-4xl!">
            Thank You!
          </h1>
          <div
            aria-hidden="true"
            className="mx-auto mt-5! h-px w-20 bg-gradient-to-r from-transparent via-brand/70 to-transparent"
          />
          <p className="mx-auto mt-5! max-w-sm! text-[0.95rem] leading-relaxed text-ink-soft">
            Your inquiry has been received. We&apos;ll get back to you shortly to confirm the details.
          </p>
          <div className="mt-8! flex flex-wrap items-center justify-center gap-3!">
            <Link
              className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
              href="/"
            >
              Back to Home
            </Link>
            <Link
              className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full border border-brand/40 bg-transparent px-7! py-3! text-sm font-semibold text-brand-deep transition-colors duration-200 hover:border-brand hover:bg-brand/10"
              href="/portfolio"
            >
              View Portfolio
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
