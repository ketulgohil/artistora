import SectionHeading from '@/components/SectionHeading'

export default function BookingPolicyPage() {
  return (
    <section className="section-space">
      <div className="max-w-3xl mx-auto px-4">
        <SectionHeading title="Booking Policy" subtitle="Important Information Before Booking" />
        <div className="text-gray-600 leading-relaxed space-y-4">
          <p>By booking a session with Shiva Mehndi Art, you agree to the following terms and conditions.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">Booking Confirmation</h2>
          <p>
            Bookings are confirmed once the date, occasion, and details are discussed and agreed upon.
            Verbal or written confirmation through WhatsApp, phone, or the booking form serves as confirmation.
            A booking is considered final only after both parties have acknowledged the schedule and scope of work.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">Payment &amp; Cancellation</h2>
          <p>
            A non-refundable deposit may be required to secure your booking for high-demand dates.
            Full payment is due on or before the day of the service unless otherwise agreed.
            Cancellations made at least 48 hours in advance may be rescheduled subject to availability.
            Late cancellations or no-shows may result in forfeiture of the deposit and affect future booking eligibility.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">Service Area</h2>
          <p>
            Home service is available across Ahmedabad and select surrounding areas.
            Locations outside the usual service area may be accommodated at an additional travel charge — please check availability before booking.
            For events outside the city, separate travel and accommodation arrangements must be discussed in advance.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">Timing</h2>
          <p>
            The artist will arrive at the agreed location at the scheduled time.
            Clients are requested to ensure the space is ready and the client is prepared at the time of arrival.
            Delays on the client&apos;s side may affect the service duration and design coverage.
            Extended sessions beyond the agreed time may incur additional charges.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">Contact</h2>
          <p>
            For any questions, changes, or clarifications regarding your booking, please reach out to us at{' '}
            <a href="tel:+919327928198" className="text-[var(--color-accent)] hover:underline">
              +91 93279 28198
            </a>{' '}
            or email{' '}
            <a href="mailto:bhumichanpura1234@gmail.com" className="text-[var(--color-accent)] hover:underline">
              bhumichanpura1234@gmail.com
            </a>
            . We are happy to assist you.
          </p>
        </div>
      </div>
    </section>
  )
}
