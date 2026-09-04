'use client'

import { useEffect, useState } from 'react'

const LOADER_KEY = 'artistora-loader-seen'
const DISPLAY_TIME = 1500

export default function BrandLoader() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return true
    return !window.sessionStorage.getItem(LOADER_KEY)
  })

  useEffect(() => {
    if (!isVisible) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    window.sessionStorage.setItem(LOADER_KEY, 'true')
    document.documentElement.classList.add('loader-active')

    const timer = window.setTimeout(
      () => setIsVisible(false),
      reducedMotion ? 450 : DISPLAY_TIME,
    )

    return () => {
      window.clearTimeout(timer)
      document.documentElement.classList.remove('loader-active')
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="brand-loader" role="status" aria-label="Loading Artistora">
      <div className="brand-loader__halo" aria-hidden="true" />
      <div className="brand-loader__content">
        <div className="brand-loader__mark-wrap">
          <span className="brand-loader__orbit" aria-hidden="true" />
          <img
            src="/artistora/logo-icon-transparent.png"
            alt=""
            width={96}
            height={96}
            className="brand-loader__mark"
          />
        </div>
        <p className="brand-loader__name">Artistora</p>
        <p className="brand-loader__tagline">Find your perfect artist</p>
        <span className="brand-loader__progress" aria-hidden="true"><span /></span>
      </div>
    </div>
  )
}
