'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CONTAINER = 'mx-auto max-w-4xl! px-4! md:px-6!'
const SECTION = 'py-10! md:py-16!'

const STYLE_OPTIONS = [
  'Bridal', 'Arabic', 'Indo-Western', 'Minimal', 'Traditional',
  'Rajasthani', 'Heavy Sider', 'Designer Bengle', 'Engagement', 'Baby Shower',
]

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4! flex items-center gap-3! text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand">
      <span aria-hidden="true" className="h-px w-8 bg-brand/50" />
      {children}
    </p>
  )
}

interface UserData {
  id: number
  name: string
  email: string
  role: string
}

interface ArtistData {
  id: number
  slug: string
  displayName: string
  phone: string
  whatsappNumber: string
  email: string
  bio: string
  city: string
  area: string
  yearsOfExperience: number
  startingPrice: number
  verified: boolean
  rating: number
  reviewCount: number
  styles: Array<{ style: string }>
  portfolioImages: Array<{ image: any; caption: string }>
  profilePhoto: any
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [artist, setArtist] = useState<ArtistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const portfolioInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    whatsappNumber: '',
    bio: '',
    city: 'Ahmedabad',
    area: '',
    yearsOfExperience: '',
    startingPrice: '',
    styles: [] as string[],
  })

  // Load user + artist profile
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (!data.user) {
          router.push('/login')
          return
        }
        setUser(data.user)

        if (data.user.role !== 'artist') {
          router.push('/')
          return
        }

        if (data.artistProfile) {
          // Fetch full artist data
          const artistRes = await fetch(`/api/artists?where[slug][equals]=${data.artistProfile.slug}&depth=2`)
          const artistData = await artistRes.json()
          const a = artistData.docs?.[0]
          if (a) {
            setArtist(a)
            setForm({
              displayName: a.displayName || '',
              phone: a.phone || '',
              whatsappNumber: a.whatsappNumber || '',
              bio: a.bio || '',
              city: a.city || 'Ahmedabad',
              area: a.area || '',
              yearsOfExperience: a.yearsOfExperience?.toString() || '',
              startingPrice: a.startingPrice?.toString() || '',
              styles: a.styles?.map((s: any) => s.style) || [],
            })
          }
        }
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
    setError('')
  }

  const toggleStyle = (style: string) => {
    setForm((prev) => ({
      ...prev,
      styles: prev.styles.includes(style)
        ? prev.styles.filter((s) => s !== style)
        : [...prev.styles, style],
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!artist) return
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch(`/api/artists/${artist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.displayName,
          phone: form.phone,
          whatsappNumber: form.whatsappNumber,
          bio: form.bio,
          city: form.city,
          area: form.area,
          yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
          startingPrice: form.startingPrice ? Number(form.startingPrice) : undefined,
          styles: form.styles.map((s) => ({ style: s })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Save failed')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !artist) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', `${form.displayName} profile photo`)

      const uploadRes = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) throw new Error('Upload failed')
      const media = await uploadRes.json()

      await fetch(`/api/artists/${artist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePhoto: media.doc.id }),
      })

      setArtist((prev) => prev ? { ...prev, profilePhoto: media.doc } : prev)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !artist) return

    setUploading(true)
    try {
      const newImages = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('alt', `${form.displayName} portfolio ${i + 1}`)

        const uploadRes = await fetch('/api/media', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) throw new Error(`Upload failed for ${file.name}`)
        const media = await uploadRes.json()
        newImages.push({ image: media.doc.id, caption: '' })
      }

      const updatedPortfolio = [...(artist.portfolioImages || []), ...newImages]

      await fetch(`/api/artists/${artist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioImages: updatedPortfolio }),
      })

      // Refresh artist data
      const artistRes = await fetch(`/api/artists?where[slug][equals]=${artist.slug}&depth=2`)
      const artistData = await artistRes.json()
      if (artistData.docs?.[0]) setArtist(artistData.docs[0])

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (portfolioInputRef.current) portfolioInputRef.current.value = ''
    }
  }

  const handleDeletePortfolio = async (index: number) => {
    if (!artist) return
    const updated = artist.portfolioImages.filter((_: any, i: number) => i !== index)

    try {
      await fetch(`/api/artists/${artist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioImages: updated }),
      })

      const artistRes = await fetch(`/api/artists?where[slug][equals]=${artist.slug}&depth=2`)
      const artistData = await artistRes.json()
      if (artistData.docs?.[0]) setArtist(artistData.docs[0])
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="flex items-center justify-center py-20!">
            <svg className="animate-spin h-8! w-8! text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
        </div>
      </section>
    )
  }

  if (!user || !artist) return null

  return (
    <section className={SECTION}>
      <div className={CONTAINER}>
        {/* Header */}
        <div className="mb-10! flex flex-wrap items-center justify-between gap-4!">
          <div>
            <Eyebrow>Artist Dashboard</Eyebrow>
            <h1 className="font-display text-2xl! font-semibold text-ink md:text-3xl!">
              Welcome, {user.name}
            </h1>
            <p className="mt-1! text-sm text-ink-soft">
              Manage your profile, portfolio, and business details
            </p>
          </div>
          <div className="flex gap-3!">
            <Link
              href={`/artists/${artist.slug}`}
              className="inline-flex min-h-10! cursor-pointer items-center justify-center gap-2! rounded-full border border-brand/40 bg-transparent px-5! py-2.5! text-sm font-semibold text-brand-deep transition-colors duration-200 hover:border-brand hover:bg-brand/10"
            >
              View Public Profile
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Link>
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' })
                router.push('/')
                router.refresh()
              }}
              className="inline-flex min-h-10! cursor-pointer items-center justify-center gap-2! rounded-full border border-line bg-white px-5! py-2.5! text-sm font-medium text-ink-soft transition-colors hover:border-red-300 hover:text-red-600"
            >
              Log Out
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6! rounded-xl border border-red-200 bg-red-50 px-4! py-3! text-sm text-red-700">
            {error}
          </div>
        )}

        {saved && (
          <div className="mb-6! rounded-xl border border-green-200 bg-green-50 px-4! py-3! text-sm text-green-700">
            Profile saved successfully!
          </div>
        )}

        <div className="grid gap-8! lg:grid-cols-[1fr_1.5fr]">
          {/* Left: Profile Photo + Status */}
          <div className="flex flex-col gap-6!">
            {/* Profile Photo */}
            <div className="rounded-3xl border border-line bg-white p-6! shadow-soft">
              <h3 className="font-display text-lg! font-semibold text-ink">Profile Photo</h3>
              <div className="mt-4! flex flex-col items-center gap-4!">
                <div className="relative">
                  {artist.profilePhoto ? (
                    <img
                      src={`/api/media/file/${(artist.profilePhoto as any).filename}`}
                      alt={artist.displayName}
                      className="h-28! w-28! rounded-full object-cover ring-4 ring-brand/20"
                    />
                  ) : (
                    <div className="flex h-28! w-28! items-center justify-center rounded-full bg-cream-deep ring-4 ring-brand/20">
                      <span className="font-display text-3xl! text-brand/40">
                        {artist.displayName?.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <label className="inline-flex min-h-10! cursor-pointer items-center justify-center gap-2! rounded-full border border-line bg-white px-5! py-2.5! text-sm font-medium text-ink-soft transition-colors hover:border-brand hover:text-brand">
                  {uploading ? 'Uploading...' : 'Change Photo'}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            {/* Status Card */}
            <div className="rounded-3xl border border-line bg-white p-6! shadow-soft">
              <h3 className="font-display text-lg! font-semibold text-ink">Profile Status</h3>
              <div className="mt-4! flex flex-col gap-3!">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-soft">Verified</span>
                  {artist.verified ? (
                    <span className="inline-flex items-center gap-1! rounded-full bg-green/10 px-2.5! py-0.5! text-xs font-semibold text-green">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                      Verified
                    </span>
                  ) : (
                    <span className="text-xs text-ink-muted">Pending</span>
                  )}
                </div>
                {artist.rating > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink-soft">Rating</span>
                    <span className="text-sm font-semibold text-ink">{artist.rating} ({artist.reviewCount} reviews)</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-soft">Profile URL</span>
                  <span className="text-xs text-brand">shivamehndiart.com/artists/{artist.slug}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Edit Form */}
          <div className="flex flex-col gap-6!">
            {/* Basic Info */}
            <div className="rounded-3xl border border-line bg-white p-6! shadow-soft md:p-7!">
              <h3 className="font-display text-lg! font-semibold text-ink">Business Details</h3>
              <div className="mt-5! flex flex-col gap-4!">
                <div>
                  <label className="mb-1.5! block text-sm font-medium text-ink-soft">Display Name *</label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => update('displayName', e.target.value)}
                    className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="grid gap-4! sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5! block text-sm font-medium text-ink-soft">Phone *</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      placeholder="9876543210"
                      className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5! block text-sm font-medium text-ink-soft">WhatsApp Number</label>
                    <input
                      type="tel"
                      value={form.whatsappNumber}
                      onChange={(e) => update('whatsappNumber', e.target.value)}
                      placeholder="9876543210"
                      className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5! block text-sm font-medium text-ink-soft">Bio *</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => update('bio', e.target.value)}
                    rows={3}
                    placeholder="Describe your experience, style, and what makes you unique..."
                    className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
                  />
                </div>
                <div className="grid gap-4! sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5! block text-sm font-medium text-ink-soft">City *</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                      className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5! block text-sm font-medium text-ink-soft">Area / Locality</label>
                    <input
                      type="text"
                      value={form.area}
                      onChange={(e) => update('area', e.target.value)}
                      placeholder="e.g. Chandlodiya, Vastrapur"
                      className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>
                <div className="grid gap-4! sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5! block text-sm font-medium text-ink-soft">Years of Experience</label>
                    <input
                      type="number"
                      min="0"
                      value={form.yearsOfExperience}
                      onChange={(e) => update('yearsOfExperience', e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5! block text-sm font-medium text-ink-soft">Starting Price (INR)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.startingPrice}
                      onChange={(e) => update('startingPrice', e.target.value)}
                      placeholder="e.g. 3000"
                      className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Styles */}
            <div className="rounded-3xl border border-line bg-white p-6! shadow-soft md:p-7!">
              <h3 className="font-display text-lg! font-semibold text-ink">Mehndi Styles</h3>
              <p className="mt-1! text-sm text-ink-soft">Select the styles you offer</p>
              <div className="mt-4! flex flex-wrap gap-2!">
                {STYLE_OPTIONS.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={`cursor-pointer rounded-full border px-4! py-2! text-sm font-medium transition-all duration-200 ${
                      form.styles.includes(style)
                        ? 'border-brand bg-brand text-white'
                        : 'border-line bg-white text-ink-soft hover:border-brand/40'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Portfolio */}
            <div className="rounded-3xl border border-line bg-white p-6! shadow-soft md:p-7!">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg! font-semibold text-ink">Portfolio Images</h3>
                  <p className="mt-1! text-sm text-ink-soft">Showcase your best work</p>
                </div>
                <label className="inline-flex min-h-10! cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-5! py-2.5! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-50">
                  {uploading ? 'Uploading...' : '+ Add Images'}
                  <input
                    ref={portfolioInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePortfolioUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              {artist.portfolioImages?.length > 0 ? (
                <div className="mt-5! grid grid-cols-2 gap-3! sm:grid-cols-3 md:grid-cols-4">
                  {artist.portfolioImages.map((item: any, i: number) => (
                    <div key={i} className="group relative overflow-hidden rounded-xl border border-line">
                      <img
                        src={`/api/media/file/${item.image?.filename || item.image}`}
                        alt={item.caption || `Portfolio ${i + 1}`}
                        className="aspect-[3/4] w-full object-cover"
                        loading="lazy"
                      />
                      <button
                        onClick={() => handleDeletePortfolio(i)}
                        className="absolute top-2! right-2! flex h-7! w-7! items-center justify-center rounded-full bg-coal/70 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 cursor-pointer"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5! rounded-xl border-2 border-dashed border-line bg-cream/30 p-8! text-center">
                  <p className="text-sm text-ink-muted">No portfolio images yet. Upload your best work to attract customers.</p>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3!">
              {saved && (
                <span className="text-sm text-green font-medium">Saved!</span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex min-h-12! cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-8! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
