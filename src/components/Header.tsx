'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/bridal-mehndi', label: 'Bridal' },
  { to: '/classes', label: 'Classes' },
  { to: '/artist', label: 'Artist' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/contact', label: 'Contact' },
]

export default function Header() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isHiddenOnScroll, setIsHiddenOnScroll] = useState(false)

  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const isMobile = window.innerWidth <= 767.98

      if (!isMobile || isOpen) {
        setIsHiddenOnScroll(false)
        lastScrollY = currentScrollY
        return
      }

      if (currentScrollY <= 12) {
        setIsHiddenOnScroll(false)
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsHiddenOnScroll(true)
      } else if (currentScrollY < lastScrollY) {
        setIsHiddenOnScroll(false)
      }

      lastScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isOpen])

  function isActive(item: { to: string }) {
    if (item.to === '/') return pathname === '/'
    return pathname.startsWith(item.to)
  }

  return (
    <header className="site-header fixed top-0 left-0 right-0 z-50">
      <div className={`navbar-inner${isHiddenOnScroll ? ' mobile-nav-hidden' : ''}`}>
        <nav className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="header-brand" onClick={() => setIsOpen(false)}>
            <img
              src="/api/media/file/shivu-large.webp"
              alt="Shiva Mehndi Art"
              width={1890}
              height={1224}
            />
            <span className="header-brand-copy">
              <strong>Shiva Mehndi Art</strong>
              <small>Professional Mehndi Artist and Classes</small>
            </span>
          </Link>

          {/* Hamburger */}
          <button
            className="header-toggler"
            type="button"
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
            onClick={() => setIsOpen((o) => !o)}
          >
            <span className="header-toggler-icon" />
          </button>

          {/* Desktop Nav + CTA */}
          <div className={`header-panel${isOpen ? ' show' : ''}`}>
            <div className="header-nav-wrap">
              <ul className="header-nav">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <Link
                      href={item.to}
                      className={`header-nav-link${isActive(item) ? ' active' : ''}`}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="header-cta-wrap">
              <a
                className="btn-brand header-cta"
                href="https://docs.google.com/forms/d/e/1FAIpQLSeE8i0kMqjmb8jjVLc_YgNGR8q413ZdgEXQbzNZdULpf9r8MA/viewform"
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsOpen(false)}
              >
                Book Now
              </a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}
