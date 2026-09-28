'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const BOOKING_URL = '/get-quote'
const WHATSAPP_URL = 'https://wa.me/917405387720'

interface LinkItem {
  label: string
  to: string
  badge?: string
}

interface NavSection {
  id: string
  title: string
  links: LinkItem[]
}

const navSections: NavSection[] = [
  {
    id: 'explore',
    title: 'Explore & Bookings',
    links: [
      { label: 'Verified Artists', to: '/artists' },
      { label: 'Services Offered', to: '/services' },
      { label: 'Portfolio Gallery', to: '/portfolio' },
      { label: 'Areas We Serve', to: '/areas' },
      { label: 'How It Works', to: '/how-it-works' },
      { label: 'Track My Bookings', to: '/my-bookings', badge: 'Live' },
    ],
  },
  {
    id: 'for-artists',
    title: 'For Artists',
    links: [
      { label: 'Join as an Artist', to: '/for-artists' },
      { label: 'Plans & Visibility', to: '/subscription' },
      { label: 'Artist Dashboard', to: '/dashboard' },
      { label: 'Artist Login', to: '/login' },
    ],
  },
  {
    id: 'trust-help',
    title: 'Trust & Help',
    links: [
      { label: 'Frequently Asked Questions', to: '/faq' },
      { label: 'Contact Support', to: '/contact' },
      { label: 'Booking Policy', to: '/booking-policy' },
      { label: 'Privacy Policy', to: '/privacy-policy' },
    ],
  },
]

function ArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-gold transition-transform duration-200 group-hover:translate-x-0.5"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 text-gold transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()
  // On mobile, keep sections collapsed by default to prevent vertical sprawl
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <footer className="relative bg-coal text-cream/80 overflow-hidden" role="contentinfo">
      <div className="mx-auto max-w-6xl px-4! pb-12! pt-10! sm:pt-14! md:px-6!">
        {/* ── Top CTA Card: High-converting luxury conversion box ── */}
        <div className="relative mb-10! overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-brand-dark to-brand-deep p-6! sm:p-8! md:p-12! text-center shadow-lift md:text-left">
          {/* Ambient Glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-brand-light/15 blur-3xl"
          />

          <div className="relative flex flex-col items-center justify-between gap-6! md:flex-row md:gap-8!">
            <div className="max-w-xl!">
              <div className="mb-2.5! inline-flex items-center gap-2! rounded-full bg-white/10 px-3.5! py-1! text-[0.68rem] font-bold tracking-[0.2em] text-cream/90 uppercase backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                Book Verified Artists
              </div>
              <h2 className="font-display text-2xl! leading-tight font-bold text-white sm:text-3xl!">
                Make your celebration unforgettable.
              </h2>
              <p className="mt-2! text-sm leading-relaxed text-cream/80">
                Discover, compare quotes, and book verified mehndi, makeup, photography &amp; decor artists across Ahmedabad.
              </p>
            </div>

            {/* CTA Buttons with >=44px touch targets */}
            <div className="flex w-full flex-col gap-3! sm:w-auto sm:flex-row">
              <a
                href={BOOKING_URL}
                className="inline-flex min-h-[46px] w-full sm:w-auto cursor-pointer items-center justify-center rounded-full bg-cream px-7! py-3! text-sm font-bold text-brand-deep shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift active:scale-98"
              >
                Get Free Quote
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[46px] w-full sm:w-auto cursor-pointer items-center justify-center gap-2! rounded-full border border-cream/35 bg-white/5 px-6! py-3! text-sm font-semibold text-cream backdrop-blur-sm transition-all duration-200 hover:border-cream/70 hover:bg-white/15 active:scale-98"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0 text-[#25d366]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>

        {/* ── Trust Micro-Bar (Highlights verified marketplace credibility) ── */}
        <div className="mb-10! grid grid-cols-1 gap-3! rounded-2xl border border-white/10 bg-white/3 p-4! sm:grid-cols-3 sm:gap-4! sm:p-5!">
          <div className="flex items-center gap-3! px-2!">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-cream">100% Verified Artists</p>
              <p className="text-[0.75rem] text-cream/50">Curated &amp; identity-checked</p>
            </div>
          </div>

          <div className="flex items-center gap-3! px-2!">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-cream">Fast Direct Quotes</p>
              <p className="text-[0.75rem] text-cream/50">Compare pricing with zero hassle</p>
            </div>
          </div>

          <div className="flex items-center gap-3! px-2!">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-cream">Ahmedabad &amp; Gujarat</p>
              <p className="text-[0.75rem] text-cream/50">Local coverage across all zones</p>
            </div>
          </div>
        </div>

        {/* ── Main Footer Structure ── */}
        <div className="grid grid-cols-1 gap-8! md:grid-cols-2 lg:grid-cols-12 lg:gap-10!">
          {/* Brand & Mission Info (Centered on Mobile/Tablet, Col 1-4 Left-Aligned on Desktop) */}
          <div className="flex flex-col items-center text-center lg:col-span-4 lg:items-start lg:text-left">
            <Link href="/" className="inline-block" aria-label="Artistora Home">
              <Image
                src="/artistora/logo-full-white.png"
                alt="Artistora"
                width={480}
                height={293}
                className="mb-3.5! h-auto w-40! rounded-lg sm:w-44!"
              />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-cream/65">
              India&apos;s curated artist marketplace — discover, compare, and book verified photography, mehndi, makeup, decor, and event artists for every celebration.
            </p>

            {/* Quick Contact Action Chips (Mobile-friendly direct touch targets) */}
            <div className="mt-5! w-full border-t border-white/10 pt-4!">
              <p className="mb-3! text-[0.68rem] font-bold tracking-[0.2em] text-gold uppercase">
                Quick Contact &amp; Connect
              </p>
              <div className="flex flex-wrap justify-center gap-2! lg:justify-start">
                <a
                  href="tel:+917405387720"
                  className="inline-flex min-h-[44px] items-center gap-2! rounded-full border border-white/12 bg-white/5 px-3.5! py-2! text-xs font-semibold text-cream transition-colors hover:border-gold/50 hover:bg-white/10 active:scale-95"
                  aria-label="Call +91 7405387720"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-gold">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>+91 7405387720</span>
                </a>

                <a
                  href="mailto:hello@artistora.com"
                  className="inline-flex min-h-[44px] items-center gap-2! rounded-full border border-white/12 bg-white/5 px-3.5! py-2! text-xs font-semibold text-cream transition-colors hover:border-gold/50 hover:bg-white/10 active:scale-95"
                  aria-label="Email hello@artistora.com"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-gold">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 6L2 7" />
                  </svg>
                  <span>hello@artistora.com</span>
                </a>

                <a
                  href="https://www.instagram.com/artistoraofficial?stkn=Z3d6azczbGFlaG81"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2! rounded-full border border-white/12 bg-white/5 px-3.5! py-2! text-xs font-semibold text-cream transition-colors hover:border-gold/50 hover:bg-white/10 active:scale-95"
                  aria-label="Visit Instagram @artistoraofficial"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-gold">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                  <span>@artistoraofficial</span>
                </a>

                <a
                  href="https://www.google.com/maps/search/?api=1&query=Ahmedabad%2C%20Gujarat%2C%20India"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2! rounded-full border border-white/12 bg-white/5 px-3.5! py-2! text-xs font-semibold text-cream transition-colors hover:border-gold/50 hover:bg-white/10 active:scale-95"
                  aria-label="Location: Ahmedabad, Gujarat"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-gold">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>Ahmedabad, Gujarat</span>
                </a>
              </div>
            </div>
          </div>

          {/* ── Navigation Columns: Accordions on Mobile (<md), Columns on Desktop (>=md) ── */}
          <div className="lg:col-span-8">
            {/* Desktop View (Visible on md and up) */}
            <div className="hidden md:grid md:grid-cols-3 md:gap-8!">
              {navSections.map((section) => (
                <nav key={section.id} aria-label={section.title}>
                  <p className="mb-4! text-[0.7rem] font-bold tracking-[0.22em] text-gold uppercase">
                    {section.title}
                  </p>
                  <ul className="flex flex-col gap-3!">
                    {section.links.map((link) => (
                      <li key={link.to}>
                        <Link
                          href={link.to}
                          className="group inline-flex items-center gap-2! text-sm text-cream/70 transition-colors duration-200 hover:text-cream"
                        >
                          <ArrowIcon />
                          <span>{link.label}</span>
                          {link.badge && (
                            <span className="rounded-full bg-brand/20 px-2! py-0.5! text-[0.65rem] font-bold text-brand-light">
                              {link.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>

            {/* Mobile View: Clean Collapsible Accordions with >=44px Hit Areas */}
            <div className="flex flex-col divide-y divide-white/10 border-y border-white/10 md:hidden">
              {navSections.map((section) => {
                const isOpen = !!openSections[section.id]
                return (
                  <div key={section.id} className="py-1!">
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className="flex min-h-[48px] w-full cursor-pointer items-center justify-between py-3! text-left text-sm font-bold tracking-wide text-cream transition-colors hover:text-gold active:bg-white/5"
                      aria-expanded={isOpen}
                      aria-controls={`footer-section-${section.id}`}
                    >
                      <span className="text-[0.85rem] font-bold text-cream tracking-wide">{section.title}</span>
                      <ChevronDownIcon open={isOpen} />
                    </button>
                    {isOpen && (
                      <ul
                        id={`footer-section-${section.id}`}
                        className="flex flex-col gap-3! pb-4! pt-1! pl-1!"
                      >
                        {section.links.map((link) => (
                          <li key={link.to}>
                            <Link
                              href={link.to}
                              className="group flex min-h-[40px] items-center gap-2.5! text-sm text-cream/70 transition-colors duration-200 hover:text-white"
                            >
                              <ArrowIcon />
                              <span>{link.label}</span>
                              {link.badge && (
                                <span className="rounded-full bg-brand/20 px-2! py-0.5! text-[0.65rem] font-bold text-brand-light">
                                  {link.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Artist Invitation Callout Banner */}
            <div className="mt-8! rounded-2xl border border-gold/20 bg-gradient-to-r from-coal to-brand-deep/60 p-4.5! sm:p-5!">
              <div className="flex flex-col items-start justify-between gap-3! sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold text-gold uppercase tracking-wider">Are you a professional artist?</p>
                  <p className="text-xs text-cream/70 mt-0.5!">Join Artistora to receive verified bookings &amp; expand your client reach.</p>
                </div>
                <Link
                  href="/for-artists"
                  className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5! rounded-full bg-white/10 px-4! py-2! text-xs font-bold text-cream transition-all hover:bg-gold hover:text-coal active:scale-95"
                >
                  <span>Join as Artist</span>
                  <ArrowIcon />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Legal Bar ── */}
      <div className="border-t border-white/10 bg-coal/90 py-5!">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3! px-4! text-center text-xs text-cream/50 sm:flex-row sm:text-left md:px-6!">
          <p>
            &copy; {year} Artistora. All rights reserved. Crafted for celebrations across Gujarat.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4! text-xs">
            <Link href="/privacy-policy" className="transition-colors hover:text-cream">
              Privacy Policy
            </Link>
            <span className="text-cream/20" aria-hidden="true">•</span>
            <Link href="/booking-policy" className="transition-colors hover:text-cream">
              Booking Policy
            </Link>
            <span className="text-cream/20" aria-hidden="true">•</span>
            <Link href="/faq" className="transition-colors hover:text-cream">
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
