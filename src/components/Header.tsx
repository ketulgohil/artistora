'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const BOOKING_URL = '/book'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/artists', label: 'Artists' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/classes', label: 'Classes' },
  { to: '/my-bookings', label: 'My Bookings' },
  { to: '/contact', label: 'Contact' },
]

export default function Header() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isHiddenOnScroll, setIsHiddenOnScroll] = useState(false)
  const [user, setUser] = useState<{ id: number; name: string; role: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user) })
      .catch(() => {})
  }, [])

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
    <header className="fixed top-0 right-0 left-0 z-50">
      <div
        className={`bg-[rgba(254,246,247,0.86)] shadow-[0_10px_30px_rgba(4,34,75,0.07)] backdrop-blur-xl transition-transform duration-300 ${
          isHiddenOnScroll ? '-translate-y-full' : ''
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4! py-2! md:px-6!">
          {/* Brand */}
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5!"
            onClick={() => setIsOpen(false)}
          >
            <img
              src="/artistora/logo-icon-transparent.png"
              alt="Artistora lotus mark"
              width={64}
              height={64}
              className="h-11! w-auto shrink-0 object-contain md:h-12!"
            />
            <span className="flex min-w-0 flex-col leading-tight">
              <strong className="font-display text-xl! font-bold tracking-tight text-brand-deep md:text-2xl!">
                Artistora
              </strong>
              <small className="text-[0.58rem] font-semibold tracking-[0.2em] text-brand uppercase md:text-[0.64rem]">
                Artistora
              </small>
            </span>
          </Link>

          {/* Hamburger (mobile / tablet) */}
          <button
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-brand/15 bg-white/70 transition-colors hover:bg-white lg:hidden"
            type="button"
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => setIsOpen((o) => !o)}
          >
            <span className="relative block h-3.5 w-5">
              <span
                className={`absolute left-0 block h-0.5 w-5 rounded-full bg-brand-deep transition-all duration-300 ${
                  isOpen ? 'top-1.5 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute top-1.5 left-0 block h-0.5 w-5 rounded-full bg-brand-deep transition-all duration-300 ${
                  isOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-5 rounded-full bg-brand-deep transition-all duration-300 ${
                  isOpen ? 'top-1.5 -rotate-45' : 'top-3'
                }`}
              />
            </span>
          </button>

          {/* Desktop nav + CTA */}
          <div className="hidden items-center lg:flex">
            <ul className="flex items-center gap-1!">
              {navItems.map((item) => {
                const active = isActive(item)
                return (
                  <li key={item.to}>
                    <Link
                      href={item.to}
                      className={`relative block rounded-full px-3.5! py-2! text-[0.95rem] font-semibold transition-colors duration-200 ${
                        active
                          ? 'bg-brand/10 text-brand-deep'
                          : 'text-ink-soft hover:bg-brand/5 hover:text-brand'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
            <div className="ml-4!">
              {user ? (
                user.role === 'artist' ? (
                  <Link
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-6! py-2.5! text-sm font-semibold text-white shadow-[0_6px_18px_rgba(179,115,67,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(179,115,67,0.45)]"
                    href="/dashboard"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-6! py-2.5! text-sm font-semibold text-white shadow-[0_6px_18px_rgba(179,115,67,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(179,115,67,0.45)]"
                    href="/get-quote"
                  >
                    Get Quote
                  </Link>
                )
              ) : (
                <Link
                  className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-6! py-2.5! text-sm font-semibold text-white shadow-[0_6px_18px_rgba(179,115,67,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(179,115,67,0.45)]"
                  href="/login"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Mobile / tablet panel */}
        {isOpen && (
          <div className="border-t border-line/80 bg-[rgba(254,246,247,0.98)] backdrop-blur-xl lg:hidden">
            <div className="mx-auto max-w-6xl px-4! py-4! md:px-6!">
              <ul className="flex flex-col gap-1!">
                {navItems.map((item) => {
                  const active = isActive(item)
                  return (
                    <li key={item.to}>
                      <Link
                        href={item.to}
                        onClick={() => setIsOpen(false)}
                        className={`block rounded-xl px-4! py-3! text-[0.98rem] font-semibold transition-colors ${
                          active
                            ? 'bg-brand/10 text-brand-deep'
                            : 'text-ink-soft hover:bg-brand/5 hover:text-brand'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-4! border-t border-line/80 pt-4!">
                {user ? (
                  user.role === 'artist' ? (
                    <Link
                      className="flex w-full min-h-12 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-6! py-3! text-sm font-semibold text-white shadow-[0_6px_18px_rgba(179,115,67,0.35)] transition-transform duration-200 hover:-translate-y-0.5"
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <Link
                      className="flex w-full min-h-12 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-6! py-3! text-sm font-semibold text-white shadow-[0_6px_18px_rgba(179,115,67,0.35)] transition-transform duration-200 hover:-translate-y-0.5"
                      href="/get-quote"
                      onClick={() => setIsOpen(false)}
                    >
                      Get Quote
                    </Link>
                  )
                ) : (
                  <Link
                    className="flex w-full min-h-12 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-6! py-3! text-sm font-semibold text-white shadow-[0_6px_18px_rgba(179,115,67,0.35)] transition-transform duration-200 hover:-translate-y-0.5"
                    href="/login"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
