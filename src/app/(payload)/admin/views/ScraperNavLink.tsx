'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ScraperNavLink() {
  const pathname = usePathname()
  const isActive = pathname === '/admin/scraper'

  return (
    <Link
      href="/admin/scraper"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        margin: '4px 8px',
        borderRadius: '6px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: isActive ? '600' : '400',
        color: isActive ? '#ec6783' : 'inherit',
        background: isActive ? '#fdeeee' : 'transparent',
      }}
    >
      <span>🔍</span>
      <span>Scraper</span>
    </Link>
  )
}
