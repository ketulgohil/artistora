'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

const CONTAINER = 'mx-auto max-w-lg! px-4! md:px-6!'
const SECTION = 'py-16! md:py-24!'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          router.replace(data.user.role === 'artist' ? '/dashboard' : '/')
        } else {
          setCheckingAuth(false)
        }
      })
      .catch(() => setCheckingAuth(false))
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <section className={SECTION}>
        <div className={CONTAINER + ' text-center text-ink-soft'}>Checking...</div>
      </section>
    )
  }

  if (!token) {
    return (
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="rounded-3xl border border-line bg-white p-8! shadow-soft md:p-10! text-center">
            <h1 className="font-display text-2xl! font-semibold text-ink">Invalid Link</h1>
            <p className="mt-3! text-sm text-ink-soft">
              This password reset link is invalid or missing a token.
            </p>
            <Link
              href="/forgot-password"
              className="mt-6! inline-flex min-h-12! items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              Request a New Link
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={SECTION}>
      <div className={CONTAINER}>
        <div className="rounded-3xl border border-line bg-white p-8! shadow-soft md:p-10!">
          <div className="mb-8! text-center">
            <p className="mb-3! flex items-center justify-center gap-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">
              <span aria-hidden="true" className="h-px w-9 bg-gradient-to-r from-transparent to-brand/60" />
              New Password
              <span aria-hidden="true" className="h-px w-9 bg-gradient-to-l from-transparent to-brand/60" />
            </p>
            <h1 className="font-display text-2xl! font-semibold text-ink md:text-3xl!">
              Reset Password
            </h1>
            <p className="mt-2! text-sm text-ink-soft">
              Enter your new password below
            </p>
          </div>

          {error && (
            <div className="mb-6! rounded-xl border border-red-200 bg-red-50 px-4! py-3! text-sm text-red-700">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="mb-6! rounded-xl border border-green-200 bg-green-50 px-4! py-3! text-sm text-green-700">
                Your password has been reset successfully! You can now log in.
              </div>
              <Link
                href="/login"
                className="inline-flex min-h-12! items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
              >
                Log In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5!">
              <div>
                <label className="mb-1.5! block text-sm font-medium text-ink-soft">New Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! pr-12! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1! text-ink-muted transition-colors hover:text-ink"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5! block text-sm font-medium text-ink-soft">Confirm Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                  placeholder="Re-enter your password"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2! inline-flex min-h-12! cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          <p className="mt-6! text-center text-sm text-ink-soft">
            Remember your password?{' '}
            <Link href="/login" className="font-semibold text-brand underline decoration-gold/60 underline-offset-4 hover:text-brand-deep">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <section className={SECTION}>
        <div className={CONTAINER + ' text-center text-ink-soft'}>Loading...</div>
      </section>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
