'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const BOOKING_URL = '/get-quote'
const WHATSAPP_URL = 'https://wa.me/917405387720'

interface NavLink {
  to: string
  label: string
  icon: (props: { className?: string }) => React.ReactNode
  badge?: string
}

const mainNavLinks: NavLink[] = [
  {
    to: '/',
    label: 'Home',
    icon: ({ className }) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: '/artists',
    label: 'Verified Artists',
    badge: 'Popular',
    icon: ({ className }) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    to: '/services',
    label: 'Services Offered',
    icon: ({ className }) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    to: '/portfolio',
    label: 'Portfolio Gallery',
    icon: ({ className }) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    to: '/how-it-works',
    label: 'How It Works',
    icon: ({ className }) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    to: '/contact',
    label: 'Contact Us',
    icon: ({ className }) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
]

export default function Header() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isHiddenOnScroll, setIsHiddenOnScroll] = useState(false)
  const [user, setUser] = useState<{ id: number; name: string; email?: string; role: string } | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  // Fetch authenticated session status
  const checkAuth = useCallback(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) return null
        return r.json()
      })
      .then((d) => {
        if (d?.user) setUser(d.user)
        else setUser(null)
      })
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth, pathname])

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      setUser(null)
      setIsOpen(false)
      window.location.href = '/'
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  // Smart auto-hide on scroll for mobile
  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const isMobile = window.innerWidth <= 1023

      setIsScrolled(currentScrollY > 20)

      if (!isMobile || isOpen) {
        setIsHiddenOnScroll(false)
        lastScrollY = currentScrollY
        return
      }

      if (currentScrollY <= 20) {
        setIsHiddenOnScroll(false)
      } else if (currentScrollY > lastScrollY && currentScrollY > 90) {
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

  // Reset scroll & close drawer on route change
  useEffect(() => {
    setIsOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  // Body scroll locking & keyboard escape handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const isActive = (to: string) => {
    if (to === '/') return pathname === '/'
    return pathname.startsWith(to)
  }

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-50 transition-all duration-300">
        <div
          className={`border-b border-brand/10 bg-[rgba(253,238,238,0.88)] backdrop-blur-xl transition-all duration-300 ${
            isScrolled ? 'shadow-[0_10px_30px_rgba(4,34,75,0.08)] bg-[rgba(253,238,238,0.96)]' : ''
          } ${isHiddenOnScroll ? '-translate-y-full' : 'translate-y-0'}`}
        >
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-3.5! py-2! sm:px-4! md:px-6!" aria-label="Main Navigation">
            {/* ── Brand Logo & Title ── */}
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2! sm:gap-2.5! group"
              onClick={() => setIsOpen(false)}
              aria-label="Artistora Home"
            >
              <Image
                src="/artistora/logo-icon-transparent.png"
                alt="Artistora Lotus Mark"
                width={56}
                height={56}
                className="h-9! w-auto shrink-0 object-contain transition-transform duration-300 group-hover:scale-105 sm:h-10! md:h-11!"
                priority
              />
              <span className="flex min-w-0 flex-col leading-tight">
                <strong className="font-display text-lg! font-bold tracking-tight text-brand-deep sm:text-xl! md:text-2xl!">
                  Artistora
                </strong>
                <small className="hidden text-[0.56rem] font-bold tracking-[0.2em] text-brand uppercase sm:block md:text-[0.62rem]">
                  Ahmedabad&apos;s Verified Artists
                </small>
              </span>
            </Link>

            {/* ── Desktop Nav Links (Visible on lg+) ── */}
            <div className="hidden items-center gap-1! lg:flex">
              <ul className="flex items-center gap-1!">
                {mainNavLinks.map((item) => {
                  const active = isActive(item.to)
                  return (
                    <li key={item.to}>
                      <Link
                        href={item.to}
                        className={`relative rounded-full px-3.5! py-2! text-[0.92rem] font-semibold transition-all duration-200 ${
                          active
                            ? 'bg-brand/12 text-brand-deep shadow-xs font-bold'
                            : 'text-ink-soft hover:bg-brand/8 hover:text-brand'
                        }`}
                      >
                        {item.label}
                        {item.badge && (
                          <span className="ml-1.5 rounded-full bg-brand/15 px-1.5! py-0.5! text-[0.6rem] font-bold text-brand uppercase">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>

              {/* Desktop Right CTAs */}
              <div className="ml-4! flex items-center gap-3!">
                <Link
                  href={BOOKING_URL}
                  className="inline-flex min-h-[42px] cursor-pointer items-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-5! py-2! text-xs font-bold text-white shadow-[0_4px_14px_rgba(236,103,131,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(236,103,131,0.4)] active:scale-98"
                >
                  Get Free Quote
                </Link>

                {user ? (
                  user.role === 'artist' ? (
                    <Link
                      className="inline-flex min-h-[42px] cursor-pointer items-center rounded-full border border-brand/30 bg-white px-4! py-2! text-xs font-bold text-brand-deep transition-all duration-200 hover:border-brand hover:bg-brand/5"
                      href="/dashboard"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <Link
                      className="inline-flex min-h-[42px] cursor-pointer items-center rounded-full border border-brand/30 bg-white px-4! py-2! text-xs font-bold text-brand-deep transition-all duration-200 hover:border-brand hover:bg-brand/5"
                      href="/my-bookings"
                    >
                      My Bookings
                    </Link>
                  )
                ) : (
                  <Link
                    className="inline-flex min-h-[42px] cursor-pointer items-center rounded-full border border-brand/30 bg-white px-4! py-2! text-xs font-bold text-brand-deep transition-all duration-200 hover:border-brand hover:bg-brand/5"
                    href="/login"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>

            {/* ── Mobile & Tablet Quick Actions (< lg) ── */}
            <div className="flex items-center gap-2! lg:hidden">
              {/* Quick Direct "Get Quote" Pill Button for high-converting mobile taps */}
              <Link
                href={BOOKING_URL}
                className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5! rounded-full bg-gradient-to-r from-brand to-brand-dark px-3.5! py-1.5! text-xs font-bold text-white shadow-[0_3px_10px_rgba(236,103,131,0.3)] transition-all duration-200 active:scale-95"
                aria-label="Get Free Quote"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>Get Quote</span>
              </Link>

              {/* Accessible Touch-Optimized Hamburger Button (>=44x44px hit area) */}
              <button
                className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-brand/20 bg-white/80 text-brand-deep shadow-xs transition-colors hover:bg-white active:scale-95"
                type="button"
                aria-expanded={isOpen}
                aria-controls="mobile-navigation-drawer"
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setIsOpen((o) => !o)}
              >
                <div className="relative h-4 w-5 flex flex-col justify-between">
                  <span
                    className={`block h-0.5 w-5 rounded-full bg-brand-deep transition-all duration-300 origin-center ${
                      isOpen ? 'translate-y-1.5 rotate-45' : ''
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-5 rounded-full bg-brand-deep transition-all duration-300 ${
                      isOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-5 rounded-full bg-brand-deep transition-all duration-300 origin-center ${
                      isOpen ? '-translate-y-2 -rotate-45' : ''
                    }`}
                  />
                </div>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* ── Mobile Navigation Sheet / Drawer (< lg) ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" id="mobile-navigation-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation Drawer">
          {/* Backdrop Blur Overlay with Dismiss On Click */}
          <div
            className="fixed inset-0 bg-coal/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in Drawer Container */}
          <div className="fixed top-0 right-0 bottom-0 flex w-full max-w-xs sm:max-w-sm flex-col justify-between bg-gradient-to-b from-cream via-cream to-cream-deep p-5! shadow-2xl transition-transform duration-300">
            {/* ── Drawer Header ── */}
            <div className="flex items-center justify-between border-b border-brand/15 pb-4!">
              <Link href="/" className="flex items-center gap-2!" onClick={() => setIsOpen(false)}>
                <Image
                  src="/artistora/logo-icon-transparent.png"
                  alt="Artistora"
                  width={40}
                  height={40}
                  className="h-8! w-auto object-contain"
                />
                <div>
                  <strong className="font-display text-lg! font-bold text-brand-deep">Artistora</strong>
                  <div className="flex items-center gap-1.5!">
                    <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
                    <span className="text-[0.65rem] font-semibold text-ink-soft">Ahmedabad, Gujarat</span>
                  </div>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-brand/20 bg-white/80 text-brand-deep transition-colors hover:bg-white active:scale-95"
                aria-label="Close menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* ── Drawer Navigation Links (Scrollable Body) ── */}
            <div className="my-auto flex-1 overflow-y-auto py-4!">
              {/* User Session Banner (if logged in) */}
              {user && (
                <div className="mb-4! rounded-2xl border border-brand/20 bg-white/80 p-3.5! shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5!">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-xs font-bold text-white shadow-xs">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-brand-deep">{user.name || 'User'}</p>
                        <span className="inline-block rounded-full bg-brand/10 px-2! py-0.5! text-[0.62rem] font-bold text-brand uppercase">
                          {user.role === 'artist' ? 'Artist Partner' : 'Customer'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="cursor-pointer text-[0.72rem] font-bold text-ink-muted hover:text-brand"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Navigation List */}
              <nav aria-label="Mobile Menu Links">
                <p className="mb-2! px-2! text-[0.65rem] font-bold tracking-[0.2em] text-gold uppercase">
                  Menu
                </p>
                <ul className="flex flex-col gap-1!">
                  {mainNavLinks.map((item) => {
                    const active = isActive(item.to)
                    const IconComponent = item.icon
                    return (
                      <li key={item.to}>
                        <Link
                          href={item.to}
                          onClick={() => setIsOpen(false)}
                          className={`flex min-h-[44px] items-center justify-between rounded-xl px-3.5! py-2.5! text-sm font-semibold transition-all ${
                            active
                              ? 'bg-brand/12 text-brand-deep font-bold shadow-xs'
                              : 'text-ink-soft hover:bg-white/60 hover:text-brand active:bg-brand/5'
                          }`}
                        >
                          <div className="flex items-center gap-3!">
                            <IconComponent className={active ? 'text-brand' : 'text-ink-muted'} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="rounded-full bg-brand/15 px-2! py-0.5! text-[0.62rem] font-bold text-brand uppercase">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              {/* Customer Quick Links: Track Booking */}
              <div className="mt-4! border-t border-brand/15 pt-3.5!">
                <Link
                  href="/my-bookings"
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-[44px] items-center justify-between rounded-xl border border-brand/20 bg-white/70 px-3.5! py-2.5! text-xs font-bold text-brand-deep shadow-xs transition-colors hover:bg-white"
                >
                  <div className="flex items-center gap-2.5!">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-brand">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Track My Bookings / Quotes</span>
                  </div>
                  <span className="text-[0.65rem] text-brand font-bold">&rarr;</span>
                </Link>
              </div>

              {/* Artist Portal Card */}
              <div className="mt-3.5! rounded-2xl border border-brand/20 bg-gradient-to-r from-brand-deep to-coal p-3.5! text-white shadow-lift">
                <p className="text-[0.68rem] font-bold text-gold uppercase tracking-wider">For Artists</p>
                <p className="mt-0.5! text-xs text-cream/80">List your services &amp; grow bookings in Gujarat.</p>
                <div className="mt-3! flex gap-2!">
                  {user?.role === 'artist' ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 rounded-full bg-cream py-2! text-center text-xs font-bold text-brand-deep shadow-xs transition-all hover:bg-white active:scale-95"
                    >
                      Artist Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/for-artists"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 rounded-full bg-cream py-2! text-center text-xs font-bold text-brand-deep shadow-xs transition-all hover:bg-white active:scale-95"
                      >
                        Join as Artist
                      </Link>
                      <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className="rounded-full border border-cream/40 px-3.5! py-2! text-center text-xs font-semibold text-cream hover:bg-white/10"
                      >
                        Login
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── Drawer Footer: High-Converting Conversion Buttons & Contacts ── */}
            <div className="border-t border-brand/15 pt-4!">
              <div className="flex flex-col gap-2.5!">
                <a
                  href={BOOKING_URL}
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand via-brand-dark to-brand-deep px-5! py-3! text-sm font-bold text-white shadow-[0_6px_18px_rgba(236,103,131,0.35)] transition-transform duration-200 active:scale-98"
                >
                  <span>Get Free Quote</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2! rounded-full border border-green/30 bg-green/10 px-5! py-2.5! text-xs font-bold text-green transition-colors hover:bg-green/15 active:scale-98"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span>Chat on WhatsApp</span>
                </a>
              </div>

              {/* Direct Touch Calling / Email / Social Row */}
              <div className="mt-3.5! flex items-center justify-center gap-4! text-xs text-ink-muted">
                <a href="tel:+917405387720" className="flex items-center gap-1.5! hover:text-brand" aria-label="Call +91 7405387720">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-gold">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>+91 7405387720</span>
                </a>
                <span className="text-line" aria-hidden="true">•</span>
                <a href="mailto:hello@artistora.com" className="flex items-center gap-1.5! hover:text-brand" aria-label="Email hello@artistora.com">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-gold">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 6L2 7" />
                  </svg>
                  <span>Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
