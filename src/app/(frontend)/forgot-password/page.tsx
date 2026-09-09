'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CONTAINER = 'mx-auto max-w-lg! px-4! md:px-6!'
const SECTION = 'py-16! md:py-24!'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [email, setEmail] = useState('')
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
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send reset link')
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

  return (
    <section className={SECTION}>
      <div className={CONTAINER}>
        <div className="rounded-3xl border border-line bg-white p-8! shadow-soft md:p-10!">
          <div className="mb-8! text-center">
            <p className="mb-3! flex items-center justify-center gap-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">
              <span aria-hidden="true" className="h-px w-9 bg-gradient-to-r from-transparent to-brand/60" />
              Password Recovery
              <span aria-hidden="true" className="h-px w-9 bg-gradient-to-l from-transparent to-brand/60" />
            </p>
            <h1 className="font-display text-2xl! font-semibold text-ink md:text-3xl!">
              Forgot Password?
            </h1>
            <p className="mt-2! text-sm text-ink-soft">
              Enter your email and we&apos;ll send you a reset link
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
                If an account with that email exists, a password reset link has been sent. Check your inbox.
              </div>
              <Link
                href="/login"
                className="inline-flex min-h-12! items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5!">
              <div>
                <label className="mb-1.5! block text-sm font-medium text-ink-soft">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="e.g. priya@email.com"
                  required
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
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
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
