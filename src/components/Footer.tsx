import Link from 'next/link'

const popularBookings = [
  { label: 'Bridal Mehndi Artist', to: '/bridal-mehndi' },
  { label: 'Mehndi Services', to: '/services' },
  { label: 'Mehndi Classes', to: '/classes' },
  { label: 'Portfolio Gallery', to: '/portfolio' },
]

const trustLinks = [
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Booking Policy', to: '/booking-policy' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      {/* Top CTA */}
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-10 border-b border-white/10 mb-10">
          <div>
            <p className="eyebrow" style={{ color: 'var(--color-brand)' }}>Book Your Mehndi Session</p>
            <h2 className="text-xl md:text-2xl font-bold text-white mt-1">
              Elegant designs for bridal, festive, and event celebrations.
            </h2>
          </div>
          <div className="flex gap-3 shrink-0">
            <a
              className="btn-brand"
              href="https://docs.google.com/forms/d/e/1FAIpQLSeE8i0kMqjmb8jjVLc_YgNGR8q413ZdgEXQbzNZdULpf9r8MA/viewform"
              target="_blank"
              rel="noreferrer"
            >
              Fill Booking Form
            </a>
            <a
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg no-underline border border-white/30 text-white hover:bg-white/10"
              href="https://wa.me/918469662012"
              target="_blank"
              rel="noreferrer"
            >
              Chat On WhatsApp
            </a>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <img
              src="/api/media/file/shivu-large.webp"
              alt="Shiva Mehndi Art"
              width={1890}
              height={1224}
              className="w-14 h-14 rounded-full object-cover mb-3"
            />
            <p className="text-sm text-gray-400 leading-relaxed">
              Bridal elegance, festive charm, and thoughtful mehndi artistry for every celebration in Ahmedabad.
            </p>
          </div>

          {/* Popular Bookings */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Popular Bookings</p>
            <ul className="list-none m-0 p-0 flex flex-col gap-2">
              {popularBookings.map((item) => (
                <li key={item.to}>
                  <Link href={item.to} className="text-sm no-underline text-gray-400 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Trust &amp; Policies</p>
            <ul className="list-none m-0 p-0 flex flex-col gap-2">
              {trustLinks.map((item) => (
                <li key={item.to}>
                  <Link href={item.to} className="text-sm no-underline text-gray-400 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Quick Contact</p>
            <ul className="list-none m-0 p-0 flex flex-col gap-3">
              <li>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=C-206%20Neelkanth%20Homes%2C%20Near%20Harivilla%20Flats%2C%20Gayatri%20Nagar%2C%20Chandlodiya%2C%20Ahmedabad%2C%20Gujarat%20382481"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm no-underline text-gray-400 hover:text-white transition-colors flex items-start gap-2"
                >
                  <span className="shrink-0 mt-0.5">📍</span>
                  <span>C-206 Neelkanth Homes, Chandlodiya, Ahmedabad 382481</span>
                </a>
              </li>
              <li>
                <a href="tel:+918469662012" className="text-sm no-underline text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <span>📞</span>
                  <span>+91 8469662012</span>
                </a>
              </li>
              <li>
                <a href="mailto:bhumichanpura1234@gmail.com" className="text-sm no-underline text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <span>✉️</span>
                  <span>bhumichanpura1234@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-4">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-xs text-gray-500 text-center">&copy; {year} Shiva Mehndi Art. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
