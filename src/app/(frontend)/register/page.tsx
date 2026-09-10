'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: 'Ahmedabad',
    bio: '',
    startingPrice: '',
    role: 'customer' as 'customer' | 'artist',
  })
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [error, setError] = useState('')
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

  const isCustomer = form.role === 'customer'

  const handleRoleChange = (role: 'customer' | 'artist') => {
    setForm((previous) => ({ ...previous, role }))
    setError('')
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photo must be under 5MB')
      return
    }
    setProfilePhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('email', form.email)
      formData.append('password', form.password)
      formData.append('role', form.role)
      if (form.phone) formData.append('phone', form.phone)
      if (form.city) formData.append('city', form.city)
      if (form.role === 'artist') {
        formData.append('bio', form.bio)
        formData.append('startingPrice', form.startingPrice)
        if (profilePhoto) formData.append('profilePhoto', profilePhoto)
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')

      if (form.role === 'artist') {
        router.push('/dashboard')
      } else {
        router.push('/')
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <section className="py-16! md:py-24!">
        <div className="mx-auto max-w-lg! px-4! md:px-6! text-center text-ink-soft">
          Checking...
        </div>
      </section>
    )
  }

  return (
    <section className="py-16! md:py-24!">
      <div className="mx-auto max-w-lg! px-4! md:px-6!">
        {/* Card */}
        <div className="rounded-3xl border border-line bg-white p-8! shadow-soft md:p-10!">
          {/* Header */}
          <div className="mb-8! text-center">
            <p className="mb-3! flex items-center justify-center gap-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">
              <span aria-hidden="true" className="h-px w-9 bg-gradient-to-r from-transparent to-brand/60" />
              Join Us
              <span aria-hidden="true" className="h-px w-9 bg-gradient-to-l from-transparent to-brand/60" />
            </p>
            <h1 className="font-display text-2xl! font-semibold text-ink md:text-3xl!">
              Create Your Account
            </h1>
            <p className="mt-2! text-sm text-ink-soft">
              Join Artistora as a customer or artist
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6! rounded-xl border border-red-200 bg-red-50 px-4! py-3! text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5!">
            {/* Role toggle — two side-by-side cards */}
            <div>
              <label className="mb-2! block text-sm font-medium text-ink-soft">I am registering as a...</label>
              <div role="radiogroup" aria-label="Account Type" className="grid grid-cols-2 gap-3!">
                {/* Customer Option */}
                <label
                  onClick={() => handleRoleChange('customer')}
                  className={`group relative flex flex-col justify-between rounded-2xl p-4! md:p-5! text-left transition-all duration-200 cursor-pointer ${
                    isCustomer
                      ? 'border-2 border-brand bg-brand/5 shadow-[0_4px_16px_rgba(236,103,131,0.12)] ring-1 ring-brand/30'
                      : 'border-2 border-line bg-white hover:border-brand/40 hover:bg-cream/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value="customer"
                    checked={isCustomer}
                    onChange={() => handleRoleChange('customer')}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between">
                    <div
                      className={`mb-3! flex h-10! w-10! items-center justify-center rounded-xl transition-colors duration-200 ${
                        isCustomer
                          ? 'bg-brand text-white shadow-sm'
                          : 'bg-cream-deep text-ink-muted group-hover:text-brand'
                      }`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>

                    {/* Radio indicator circle */}
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                        isCustomer
                          ? 'border-brand bg-brand text-white'
                          : 'border-line bg-white group-hover:border-brand/40'
                      }`}
                    >
                      {isCustomer && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                  </div>

                  <div>
                    <span
                      className={`block text-sm font-bold transition-colors ${
                        isCustomer ? 'text-brand-deep' : 'text-ink group-hover:text-brand-deep'
                      }`}
                    >
                      Customer
                    </span>
                    <span className="mt-1! block text-xs leading-relaxed text-ink-muted">
                      Browse &amp; book verified artists
                    </span>
                  </div>
                </label>

                {/* Artist Option */}
                <label
                  onClick={() => handleRoleChange('artist')}
                  className={`group relative flex flex-col justify-between rounded-2xl p-4! md:p-5! text-left transition-all duration-200 cursor-pointer ${
                    !isCustomer
                      ? 'border-2 border-brand bg-brand/5 shadow-[0_4px_16px_rgba(236,103,131,0.12)] ring-1 ring-brand/30'
                      : 'border-2 border-line bg-white hover:border-brand/40 hover:bg-cream/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value="artist"
                    checked={!isCustomer}
                    onChange={() => handleRoleChange('artist')}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between">
                    <div
                      className={`mb-3! flex h-10! w-10! items-center justify-center rounded-xl transition-colors duration-200 ${
                        !isCustomer
                          ? 'bg-brand text-white shadow-sm'
                          : 'bg-cream-deep text-ink-muted group-hover:text-brand'
                      }`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 19l7-7 3 3-7 7-3-3z" />
                        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                        <path d="M2 2l7.586 7.586" />
                        <circle cx="11" cy="11" r="2" />
                      </svg>
                    </div>

                    {/* Radio indicator circle */}
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                        !isCustomer
                          ? 'border-brand bg-brand text-white'
                          : 'border-line bg-white group-hover:border-brand/40'
                      }`}
                    >
                      {!isCustomer && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                  </div>

                  <div>
                    <span
                      className={`block text-sm font-bold transition-colors ${
                        !isCustomer ? 'text-brand-deep' : 'text-ink group-hover:text-brand-deep'
                      }`}
                    >
                      Artist
                    </span>
                    <span className="mt-1! block text-xs leading-relaxed text-ink-muted">
                      List your services &amp; get bookings
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Artist Info Banner */}
            {!isCustomer && (
              <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4! text-xs leading-relaxed text-ink-soft">
                <div className="flex items-center gap-2! font-semibold text-brand-deep">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Artist Membership
                </div>
                <p className="mt-1.5! text-ink-muted">
                  You’ll get an artist dashboard to showcase your portfolio, set starting rates, list your styles, and receive direct WhatsApp/phone client inquiries.
                </p>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="mb-1.5! block text-sm font-medium text-ink-soft">
                {isCustomer ? 'Full Name *' : 'Artist / Business Name *'}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder={isCustomer ? 'e.g. Priya Patel' : 'e.g. Priya.s Art Studio'}
                required
                className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5! block text-sm font-medium text-ink-soft">Email Address *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="e.g. priya@email.com"
                required
                className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5! block text-sm font-medium text-ink-soft">Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Artist optional Phone & City fields */}
            {!isCustomer && (
              <>
                <div className="grid grid-cols-1 gap-4! sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5! block text-sm font-medium text-ink-soft">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="e.g. 9876543210"
                      required
                      className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5! block text-sm font-medium text-ink-soft">City *</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      placeholder="e.g. Ahmedabad"
                      required
                      className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>

                {/* Profile Photo */}
                <div>
                  <label className="mb-1.5! block text-sm font-medium text-ink-soft">Profile Photo *</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer items-center gap-4! rounded-xl border-2 border-dashed border-line bg-cream/30 p-4! transition-colors hover:border-brand/50 hover:bg-brand/5"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="h-16! w-16! rounded-full object-cover ring-2 ring-brand/20" />
                    ) : (
                      <div className="flex h-16! w-16! items-center justify-center rounded-full bg-cream-deep text-ink-muted">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {profilePhoto ? 'Change photo' : 'Upload profile photo'}
                      </p>
                      <p className="text-xs text-ink-muted">JPG, PNG. Max 5MB.</p>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="mb-1.5! block text-sm font-medium text-ink-soft">Bio / About You *</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell customers about your experience, style, and what makes you unique..."
                    required
                    rows={3}
                    className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
                  />
                  <p className="mt-1! text-xs text-ink-muted">Min 20 characters. A good bio gets 3x more booking requests.</p>
                </div>

                {/* Starting Price */}
                <div>
                  <label className="mb-1.5! block text-sm font-medium text-ink-soft">Starting Price (₹) *</label>
                  <input
                    type="number"
                    value={form.startingPrice}
                    onChange={(e) => setForm((p) => ({ ...p, startingPrice: e.target.value }))}
                    placeholder="e.g. 5000"
                    required
                    min={0}
                    className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  <p className="mt-1! text-xs text-ink-muted">Your starting price shown to customers. You can change this later.</p>
                </div>
              </>
            )}

            {/* Submit */}
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
                  Creating Account...
                </>
              ) : isCustomer ? (
                'Create Customer Account'
              ) : (
                'Register as Artist'
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-6! text-center text-sm text-ink-soft">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-brand underline decoration-gold/60 underline-offset-4 hover:text-brand-deep">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
