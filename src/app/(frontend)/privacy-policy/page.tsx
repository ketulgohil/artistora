import SectionHeading from '@/components/SectionHeading'

export default function PrivacyPolicyPage() {
  return (
    <section className="section-space">
      <div className="max-w-3xl mx-auto px-4">
        <SectionHeading
          title="Privacy Policy"
          subtitle="How We Handle Your Information"
        />
        <div className="text-gray-600 leading-relaxed space-y-4">
          <p>
            Shiva Mehndi Art respects your privacy. This policy outlines how we
            collect, use, and protect your information when you use our website
            or services.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">
            Information We Collect
          </h2>
          <p>
            We may collect personal information such as your name, phone number,
            email address, and event details when you fill out our booking form
            or contact us through the website. We also collect non-personal data
            such as browser type and usage patterns to improve our website
            experience.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">
            How We Use It
          </h2>
          <p>
            Your information is used solely to respond to your inquiries,
            confirm bookings, provide the mehndi services you request, and
            improve our offerings. We do not sell or share your data with third
            parties for marketing purposes.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">
            Data Protection
          </h2>
          <p>
            We take reasonable precautions to protect your personal information
            using industry-standard security measures. However, no method of
            transmission over the internet or electronic storage is 100%
            secure. We encourage you to take steps to protect your own
            information as well.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">
            Third-Party Services
          </h2>
          <p>
            We may use third-party service providers, such as payment
            processors and analytics tools, to support our website and business
            operations. These third parties have their own privacy policies and
            may collect data necessary to perform their functions. We encourage
            you to review their policies for more information.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">Contact</h2>
          <p>
            If you have questions about this policy or how your data is
            handled, please contact us at{' '}
            <a
              href="mailto:bhumichanpura1234@gmail.com"
              className="text-[var(--color-brand)] hover:underline"
            >
              bhumichanpura1234@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
