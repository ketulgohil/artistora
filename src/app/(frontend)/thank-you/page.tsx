import Link from 'next/link'

export default function ThankYouPage() {
  return (
    <section className="thank-you-section">
      <div className="max-w-xl mx-auto px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your inquiry has been received. We&apos;ll get back to you shortly to confirm the details.
          </p>
          <div className="flex justify-center gap-4">
            <Link className="btn btn-brand" href="/">
              Back to Home
            </Link>
            <Link className="btn btn-outline-brand" href="/portfolio">
              View Portfolio
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
