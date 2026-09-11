'use client'

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ArtistPlaceholder from '@/components/ArtistPlaceholder'

const BarChart = lazy(() => import('recharts').then(m => ({ default: m.BarChart })))
const Bar = lazy(() => import('recharts').then(m => ({ default: m.Bar })))
const XAxis = lazy(() => import('recharts').then(m => ({ default: m.XAxis })))
const YAxis = lazy(() => import('recharts').then(m => ({ default: m.YAxis })))
const CartesianGrid = lazy(() => import('recharts').then(m => ({ default: m.CartesianGrid })))
const Tooltip = lazy(() => import('recharts').then(m => ({ default: m.Tooltip })))
const ResponsiveContainer = lazy(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })))
const PieChart = lazy(() => import('recharts').then(m => ({ default: m.PieChart })))
const Pie = lazy(() => import('recharts').then(m => ({ default: m.Pie })))
const Cell = lazy(() => import('recharts').then(m => ({ default: m.Cell })))
const FunnelChart = lazy(() => import('recharts').then(m => ({ default: m.FunnelChart })))
const Funnel = lazy(() => import('recharts').then(m => ({ default: m.Funnel })))
const LabelList = lazy(() => import('recharts').then(m => ({ default: m.LabelList })))
const LineChart = lazy(() => import('recharts').then(m => ({ default: m.LineChart })))
const Line = lazy(() => import('recharts').then(m => ({ default: m.Line })))
const Area = lazy(() => import('recharts').then(m => ({ default: m.Area })))
const AreaChart = lazy(() => import('recharts').then(m => ({ default: m.AreaChart })))

function ChartFallback() {
  return <div className="flex h-64! items-center justify-center text-sm text-ink-muted">Loading chart...</div>
}

const CONTAINER = 'mx-auto max-w-5xl! px-4! md:px-6!'
const SECTION = 'py-10! md:py-16!'

const STYLE_OPTIONS: Record<string, string[]> = {
  'photographers': ['Wedding', 'Portrait', 'Candid', 'Traditional', 'Pre-Wedding', 'Event', 'Product', 'Fashion', 'Documentary', 'Drone/Aerial'],
  'makeup-artists': ['Bridal', 'Party', 'Reception', 'Engagement', 'Editorial', 'Natural', 'Glam', 'Traditional', 'Airbrush', 'SFX'],
  'decor-event-planners': ['Floral', 'Traditional', 'Modern', 'Minimal', 'Rustic', 'Vintage', 'Bohemian', 'Royal', 'Themed', 'Outdoor'],
  'mehndi-artists': ['Bridal', 'Arabic', 'Indo-Western', 'Minimal', 'Traditional', 'Rajasthani', 'Modern', 'Floral', 'Geometric', 'Custom Design'],
}

const SERVICE_OPTIONS = [
  { slug: 'photographers', label: 'Photographers' },
  { slug: 'makeup-artists', label: 'Makeup Artists' },
  { slug: 'decor-event-planners', label: 'Decor & Event Planners' },
  { slug: 'mehndi-artists', label: 'Mehndi Artists' },
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
  priceType?: string
  startingPrice: number
  verified: boolean
  rating: number
  reviewCount: number
  styles: Array<{ style: string }>
  portfolioImages: Array<{ image: any; caption: string }>
  profilePhoto: any
  unavailableDates?: Array<{ date: string; reason?: string }>
  services?: Array<{ slug: string; title: string }>
  maxPortfolioItems?: number
}

interface BookingItem {
  id: number
  name: string
  phone: string
  email?: string
  eventType: string
  eventDate: string
  location: string
  guestCount?: number
  designStyle?: string
  message?: string
  status: string
  declineReason?: string
  createdAt: string
  quote?: any
  assignedArtists?: any[]
}

interface LeadItem {
  id: number
  customerName: string
  customerPhone?: string
  eventType: string
  eventDate: string
  eventLocation: string
  guestCount?: number
  budgetRange?: string
  designStyle?: string
  additionalNotes?: string
  referenceImages?: Array<{ image: any }>
  status: string
  createdAt: string
  myQuote?: {
    id: number
    amount: number
    priceType: string
    status: string
    createdAt: string
  } | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'bookings' | 'leads' | 'availability' | 'profile' | 'analytics'>('bookings')

  const [user, setUser] = useState<UserData | null>(null)
  const [artist, setArtist] = useState<ArtistData | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile Form state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [portfolioError, setPortfolioError] = useState('')
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
    priceType: 'package',
    startingPrice: '',
    styles: [] as string[],
    services: [] as string[],
  })

  // Bookings state
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed'>('pending')
  const [declineBookingId, setDeclineBookingId] = useState<number | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Leads & Quotes state
  const [leads, setLeads] = useState<LeadItem[]>([])
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [quotingLead, setQuotingLead] = useState<LeadItem | null>(null)
  const [quoteForm, setQuoteForm] = useState({
    priceType: 'package',
    unitRate: '',
    units: '',
    amount: '',
    message: '',
    travelFee: '',
    estimatedHours: '',
    numberOfArtists: '1',
  })
  const [submittingQuote, setSubmittingQuote] = useState(false)

  // Availability state
  const [unavailableDates, setUnavailableDates] = useState<Array<{ date: string; reason?: string }>>([])
  const [bookedDates, setBookedDates] = useState<any[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [newBlockDate, setNewBlockDate] = useState('')
  const [newBlockReason, setNewBlockReason] = useState('')
  const [blockingDate, setBlockingDate] = useState(false)

  // Analytics state
  const [analytics, setAnalytics] = useState<any>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [serviceMap, setServiceMap] = useState<Record<string, number>>({})

  // Load user + artist profile
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
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

        // Fetch services to build slug->ID map
        const svcRes = await fetch('/api/services?limit=100', { credentials: 'include' })
        const svcData = await svcRes.json()
        const map: Record<string, number> = {}
        const idToSlug: Record<number, string> = {}
        for (const svc of svcData.docs || []) {
          map[svc.slug] = svc.id
          idToSlug[svc.id] = svc.slug
        }
        setServiceMap(map)

        if (data.artistProfile) {
          const artistRes = await fetch(`/api/artists?where[slug][equals]=${data.artistProfile.slug}&depth=1`, { credentials: 'include' })
          const artistData = await artistRes.json()
          const a = artistData.docs?.[0]
          if (a) {
            setArtist(a)
            const serviceSlugs = (a.services || []).map((s: any) => {
              if (typeof s === 'object' && s?.slug) return s.slug
              if (typeof s === 'number' || typeof s === 'string') return idToSlug[Number(s)]
              return null
            }).filter(Boolean)
            setForm({
              displayName: a.displayName || '',
              phone: a.phone || '',
              whatsappNumber: a.whatsappNumber || '',
              bio: a.bio || '',
              city: a.city || 'Ahmedabad',
              area: a.area || '',
              yearsOfExperience: a.yearsOfExperience?.toString() || '',
              priceType: a.priceType || 'package',
              startingPrice: a.startingPrice?.toString() || '',
              styles: a.styles?.map((s: any) => s.style) || [],
              services: serviceSlugs,
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

  // Fetch Bookings
  const fetchBookings = async () => {
    setLoadingBookings(true)
    try {
      const res = await fetch('/api/dashboard/bookings', { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setBookings(data.bookings || [])
      }
    } catch (err) {
      console.error('Failed to load bookings', err)
    } finally {
      setLoadingBookings(false)
    }
  }

  // Fetch Leads
  const fetchLeads = async () => {
    setLoadingLeads(true)
    try {
      const res = await fetch('/api/dashboard/leads', { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setLeads(data.leads || [])
      }
    } catch (err) {
      console.error('Failed to load leads', err)
    } finally {
      setLoadingLeads(false)
    }
  }

  // Fetch Availability
  const fetchAvailability = async () => {
    setLoadingAvailability(true)
    try {
      const res = await fetch('/api/dashboard/availability', { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setUnavailableDates(data.unavailableDates || [])
        setBookedDates(data.bookedDates || [])
      }
    } catch (err) {
      console.error('Failed to load availability', err)
    } finally {
      setLoadingAvailability(false)
    }
  }

  // Fetch Analytics
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true)
    try {
      const res = await fetch('/api/dashboard/analytics', { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setAnalytics(data)
      }
    } catch (err) {
      console.error('Failed to load analytics', err)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeTab === 'bookings') fetchBookings()
    if (activeTab === 'leads') fetchLeads()
    if (activeTab === 'availability') fetchAvailability()
    if (activeTab === 'analytics') fetchAnalytics()
  }, [activeTab])

  // Fetch bookings + leads on initial load for stats
  useEffect(() => {
    fetchBookings()
    fetchLeads()
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [])

  // Handle Booking Accept / Decline / Cancel / Complete
  const handleBookingAction = async (id: number, action: string, reason?: string) => {
    setActionLoading(true)
    setError('')
    try {
      const body: any = { action }
      if (action === 'decline') body.declineReason = reason
      if (action === 'cancel') {
        body.cancellationReason = reason
        body.cancelledBy = 'artist'
      }

      const res = await fetch(`/api/bookings/${id}/action`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')

      setDeclineBookingId(null)
      setDeclineReason('')
      setCancelBookingId(null)
      setCancelReason('')
      await fetchBookings()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Quote Submission
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quotingLead || !artist) return
    setSubmittingQuote(true)
    setError('')
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: quotingLead.id,
          priceType: quoteForm.priceType,
          amount: Number(quoteForm.amount),
          unitRate: quoteForm.unitRate ? Number(quoteForm.unitRate) : undefined,
          units: quoteForm.units ? Number(quoteForm.units) : undefined,
          message: quoteForm.message,
          travelFee: quoteForm.travelFee ? Number(quoteForm.travelFee) : 0,
          estimatedHours: quoteForm.estimatedHours ? Number(quoteForm.estimatedHours) : undefined,
          numberOfArtists: Number(quoteForm.numberOfArtists || 1),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit quote')

      setQuotingLead(null)
      setQuoteForm({
        priceType: 'package',
        unitRate: '',
        units: '',
        amount: '',
        message: '',
        travelFee: '',
        estimatedHours: '',
        numberOfArtists: '1',
      })
      await fetchLeads()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmittingQuote(false)
    }
  }

  // Handle Block Date
  const handleBlockDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBlockDate) return
    setBlockingDate(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/availability', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newBlockDate, reason: newBlockReason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to block date')

      setNewBlockDate('')
      setNewBlockReason('')
      await fetchAvailability()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBlockingDate(false)
    }
  }

  // Handle Unblock Date
  const handleUnblockDate = async (date: string) => {
    try {
      const res = await fetch(`/api/dashboard/availability?date=${encodeURIComponent(date)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to unblock date')
      await fetchAvailability()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Profile updates
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

  const toggleService = (slug: string) => {
    setForm((prev) => {
      const services = prev.services.includes(slug)
        ? prev.services.filter((s) => s !== slug)
        : [...prev.services, slug]
      return { ...prev, services, styles: [] }
    })
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
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.displayName,
          phone: form.phone,
          whatsappNumber: form.whatsappNumber,
          bio: form.bio,
          city: form.city,
          area: form.area,
          yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
          priceType: form.priceType,
          startingPrice: form.startingPrice ? Number(form.startingPrice) : undefined,
          styles: form.styles.map((s) => ({ style: s })),
          services: form.services.map((slug) => serviceMap[slug]).filter(Boolean),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Save failed')
      }

      const updated = await res.json()
      const idToSlug: Record<number, string> = {}
      Object.entries(serviceMap).forEach(([slug, id]) => { idToSlug[id] = slug })
      setArtist({
        ...updated.doc,
        services: form.services.map((slug) => ({ slug, title: SERVICE_OPTIONS.find(s => s.slug === slug)?.label || slug, id: serviceMap[slug] })),
      })
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
        credentials: 'include',
        body: formData,
      })

      if (!uploadRes.ok) throw new Error('Upload failed')
      const media = await uploadRes.json()

      const patchRes = await fetch(`/api/artists/${artist.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePhoto: media.doc.id }),
      })

      if (!patchRes.ok) throw new Error('Failed to update profile')

      setArtist((prev) => (prev ? { ...prev, profilePhoto: media.doc } : prev))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !artist) return

    const maxItems = artist.maxPortfolioItems ?? 10
    const currentCount = artist.portfolioImages?.length ?? 0
    if (currentCount >= maxItems) {
      setPortfolioError(`Portfolio limit reached (${maxItems} images). Delete some to add more.`)
      return
    }

    const allowed = maxItems - currentCount
    const toUpload = Array.from(files).slice(0, allowed)
    if (toUpload.length < files.length) {
      setPortfolioError(`Only ${toUpload.length} image(s) can be added (limit: ${maxItems}).`)
    } else {
      setPortfolioError('')
    }

    setUploading(true)
    try {
      const newImages = []

      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('alt', `${form.displayName} portfolio ${i + 1}`)

        const uploadRes = await fetch('/api/media', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })

        if (!uploadRes.ok) throw new Error(`Upload failed for ${file.name}`)
        const media = await uploadRes.json()
        newImages.push({ image: media.doc.id, caption: '' })
      }

      const updatedPortfolio = [...(artist.portfolioImages || []), ...newImages]

      await fetch(`/api/artists/${artist.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioImages: updatedPortfolio }),
      })

      const artistRes = await fetch(`/api/artists?where[slug][equals]=${artist.slug}&depth=2`, { credentials: 'include' })
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
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioImages: updated }),
      })

      const artistRes = await fetch(`/api/artists?where[slug][equals]=${artist.slug}&depth=2`, { credentials: 'include' })
      const artistData = await artistRes.json()
      if (artistData.docs?.[0]) setArtist(artistData.docs[0])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  if (loading) {
    return (
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="flex items-center justify-center py-20!">
            <div className="animate-spin h-8! w-8! rounded-full border-2 border-brand border-t-transparent" />
          </div>
        </div>
      </section>
    )
  }

  if (!user) return null

  if (user.role === 'artist' && !artist) {
    return (
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="mx-auto max-w-2xl! rounded-3xl border border-line bg-white p-8! text-center shadow-soft md:p-12!">
            <p className="mb-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">
              Profile setup required
            </p>
            <h1 className="font-display text-2xl! font-semibold text-ink md:text-3xl!">
              Your artist profile is not available yet
            </h1>
            <p className="mx-auto mt-4! max-w-xl text-sm leading-7 text-ink-soft">
              Your account is signed in, but it is not linked to an artist profile. Please contact Artistora support so the profile can be linked safely.
            </p>
            <div className="mt-7! flex flex-wrap justify-center gap-3!">
              <Link href="/contact" className="btn-brand">
                Contact Support
              </Link>
              <Link href="/" className="btn-outline-brand">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!artist) return null

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'pending') return b.status === 'artist_pending' || b.status === 'requested'
    if (bookingFilter === 'confirmed') return b.status === 'confirmed' || b.status === 'in_progress'
    return true
  })

  const pendingBookingsCount = bookings.filter(
    (b) => b.status === 'artist_pending' || b.status === 'requested',
  ).length

  return (
    <section className={SECTION}>
      <div className={CONTAINER}>
        {/* Header */}
        <div className="mb-8! flex flex-wrap items-center justify-between gap-4!">
          <div>
            <Eyebrow>Artist Dashboard</Eyebrow>
            <h1 className="font-display text-2xl! font-semibold text-ink md:text-3xl!">
              Welcome, {user.name}
            </h1>
            <p className="mt-1! text-sm text-ink-soft">
              Manage your incoming booking requests, calendar availability, and profile
            </p>
          </div>
          <div className="flex w-full flex-col gap-3! sm:w-auto sm:flex-row">
            <Link
              href={`/artists/${artist.slug}`}
              className="inline-flex min-h-10! w-full cursor-pointer items-center justify-center gap-2! rounded-full border border-brand/40 bg-transparent px-5! py-2.5! text-sm font-semibold text-brand-deep transition-colors duration-200 hover:border-brand hover:bg-brand/10 sm:w-auto"
            >
              View Public Profile
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              </Link>
            <Link
              href="/subscription"
              className="inline-flex min-h-10! w-full cursor-pointer items-center justify-center gap-2! rounded-full border border-brand/40 bg-brand/5 px-5! py-2.5! text-sm font-semibold text-brand-deep transition-colors duration-200 hover:border-brand hover:bg-brand/10 sm:w-auto"
            >
              Plans &amp; Visibility
            </Link>
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
                router.push('/')
                router.refresh()
              }}
              className="inline-flex min-h-10! w-full cursor-pointer items-center justify-center gap-2! rounded-full border border-line bg-white px-5! py-2.5! text-sm font-medium text-ink-soft transition-colors hover:border-red-300 hover:text-red-600 sm:w-auto"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-8! grid grid-cols-2 gap-4! md:grid-cols-4">
          {[
            {
              label: 'Pending Requests',
              value: bookings.filter((b) => b.status === 'artist_pending' || b.status === 'requested').length,
              color: 'text-brand',
              bg: 'bg-brand/5',
            },
            {
              label: 'Active Bookings',
              value: bookings.filter((b) => b.status === 'confirmed' || b.status === 'in_progress').length,
              color: 'text-green',
              bg: 'bg-green/5',
            },
            {
              label: 'New Leads',
              value: leads.filter((l) => !l.myQuote).length,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
            {
              label: 'Completed',
              value: bookings.filter((b) => b.status === 'completed').length,
              color: 'text-ink',
              bg: 'bg-cream',
            },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-2xl border border-line ${stat.bg} p-4!`}>
              <p className="text-xs font-medium text-ink-muted">{stat.label}</p>
              <p className={`mt-1! text-2xl! font-display font-semibold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Profile Completion Checklist */}
        {(() => {
          const checks = [
            { label: 'Profile photo', done: !!artist.profilePhoto },
            { label: 'Display name', done: !!artist.displayName && artist.displayName !== 'Profile coming soon' },
            { label: 'Bio', done: !!artist.bio && artist.bio !== 'Profile coming soon' && (artist.bio?.length || 0) > 20 },
            { label: 'Phone number', done: !!artist.phone && artist.phone !== '0000000000' },
            { label: 'WhatsApp number', done: !!artist.whatsappNumber },
            { label: 'City', done: !!artist.city },
            { label: 'Area / locality', done: !!artist.area },
            { label: 'Years of experience', done: !!artist.yearsOfExperience },
            { label: 'Services offered', done: !!(artist.services && artist.services.length > 0) },
            { label: 'Starting price', done: !!artist.startingPrice },
            { label: 'Portfolio images', done: !!(artist.portfolioImages && artist.portfolioImages.length > 0) },
          ]
          const completed = checks.filter((c) => c.done).length
          const total = checks.length
          const pct = Math.round((completed / total) * 100)
          const isComplete = pct === 100

          if (isComplete) return null

          return (
            <div className="mb-8! rounded-2xl border border-brand/20 bg-gradient-to-br from-white to-brand/5 p-6! shadow-soft">
              <div className="mb-4! flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg! font-semibold text-ink">Complete Your Profile</h3>
                  <p className="mt-0.5! text-sm text-ink-soft">{completed} of {total} items done — {pct}% complete</p>
                </div>
                <div className="relative h-14! w-14!">
                  <svg className="h-14! w-14! -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#f1d9dc" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="16" fill="none" stroke="#ec6783" strokeWidth="3"
                      strokeDasharray={`${pct} ${100 - pct}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs! font-bold text-brand">{pct}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6! gap-y-2! sm:grid-cols-3 lg:grid-cols-4">
                {checks.map((check) => (
                  <button
                    key={check.label}
                    onClick={() => setActiveTab('profile')}
                    type="button"
                    className="flex items-center gap-2! rounded-lg px-3! py-2! text-left text-sm transition-colors hover:bg-brand/5 cursor-pointer"
                  >
                    {check.done ? (
                      <span className="flex h-5! w-5! shrink-0 items-center justify-center rounded-full bg-green/10 text-green">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      </span>
                    ) : (
                      <span className="flex h-5! w-5! shrink-0 items-center justify-center rounded-full border-2 border-line text-ink-muted">
                        <span className="h-2! w-2! rounded-full bg-ink-muted/30" />
                      </span>
                    )}
                    <span className={check.done ? 'text-ink-soft line-through decoration-ink-muted/40' : 'text-ink'}>
                      {check.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-4! text-xs text-ink-muted">
                A complete profile helps you get more booking requests from customers.
              </p>
            </div>
          )
        })()}

        {/* Navigation Tabs */}
        <div className="mb-8! flex snap-x snap-mandatory gap-2! overflow-x-auto border-b border-line pb-4! [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`relative flex shrink-0 snap-start items-center gap-2! rounded-full px-5! py-2.5! text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-brand text-white shadow-soft'
                : 'bg-white text-ink-soft hover:bg-cream/70'
            }`}
          >
            <span>Bookings</span>
            {pendingBookingsCount > 0 && (
              <span className={`rounded-full px-2! py-0.5! text-xs ${
                activeTab === 'bookings' ? 'bg-white text-brand' : 'bg-brand text-white'
              }`}>
                {pendingBookingsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`flex shrink-0 snap-start items-center gap-2! rounded-full px-5! py-2.5! text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'leads'
                ? 'bg-brand text-white shadow-soft'
                : 'bg-white text-ink-soft hover:bg-cream/70'
            }`}
          >
            <span>Matched Leads & Quotes</span>
          </button>

          <button
            onClick={() => setActiveTab('availability')}
            className={`flex shrink-0 snap-start items-center gap-2! rounded-full px-5! py-2.5! text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'availability'
                ? 'bg-brand text-white shadow-soft'
                : 'bg-white text-ink-soft hover:bg-cream/70'
            }`}
          >
            <span>Availability Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex shrink-0 snap-start items-center gap-2! rounded-full px-5! py-2.5! text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-brand text-white shadow-soft'
                : 'bg-white text-ink-soft hover:bg-cream/70'
            }`}
          >
            <span>Profile & Portfolio</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex shrink-0 snap-start items-center gap-2! rounded-full px-5! py-2.5! text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-brand text-white shadow-soft'
                : 'bg-white text-ink-soft hover:bg-cream/70'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            <span>Analytics</span>
          </button>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="mb-6! rounded-xl border border-red-200 bg-red-50 px-4! py-3! text-sm text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 font-bold ml-4! cursor-pointer">×</button>
          </div>
        )}

        {/* TAB 1: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6!">
            {/* Filter buttons */}
            <div className="flex gap-2!">
              <button
                onClick={() => setBookingFilter('pending')}
                className={`rounded-full px-4! py-1.5! text-xs font-semibold cursor-pointer transition-colors ${
                  bookingFilter === 'pending'
                    ? 'bg-ink text-white'
                    : 'bg-white text-ink-muted border border-line'
                }`}
              >
                Pending Requests ({bookings.filter((b) => b.status === 'artist_pending' || b.status === 'requested').length})
              </button>
              <button
                onClick={() => setBookingFilter('confirmed')}
                className={`rounded-full px-4! py-1.5! text-xs font-semibold cursor-pointer transition-colors ${
                  bookingFilter === 'confirmed'
                    ? 'bg-ink text-white'
                    : 'bg-white text-ink-muted border border-line'
                }`}
              >
                Confirmed / Active ({bookings.filter((b) => b.status === 'confirmed' || b.status === 'in_progress').length})
              </button>
              <button
                onClick={() => setBookingFilter('all')}
                className={`rounded-full px-4! py-1.5! text-xs font-semibold cursor-pointer transition-colors ${
                  bookingFilter === 'all'
                    ? 'bg-ink text-white'
                    : 'bg-white text-ink-muted border border-line'
                }`}
              >
                All Bookings ({bookings.length})
              </button>
            </div>

            {loadingBookings ? (
              <div className="py-12! text-center text-ink-muted">Loading bookings...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="rounded-3xl border border-line bg-white p-8! text-center">
                <p className="text-ink-muted">No bookings in this category.</p>
              </div>
            ) : (
              <div className="space-y-4!">
                {filteredBookings.map((b) => {
                  const isPending = b.status === 'artist_pending' || b.status === 'requested'
                  const isConfirmed = b.status === 'confirmed'
                  const isInProgress = b.status === 'in_progress'
                  const isDeclined = b.status === 'declined'
                  const isCompleted = b.status === 'completed'

                  return (
                    <div
                      key={b.id}
                      className={`rounded-3xl border bg-white p-6! shadow-soft transition-all ${
                        isPending
                          ? 'border-brand/40 ring-2 ring-brand/10'
                          : isConfirmed
                            ? 'border-green/40'
                            : 'border-line'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4!">
                        <div>
                          <div className="flex items-center gap-3!">
                            <h3 className="font-display text-lg! font-semibold text-ink">{b.name}</h3>
                            <span
                              className={`rounded-full px-2.5! py-0.5! text-xs font-semibold capitalize ${
                                isPending
                                  ? 'bg-brand/10 text-brand'
                                  : isConfirmed
                                    ? 'bg-green/10 text-green'
                                    : isInProgress
                                      ? 'bg-blue-100 text-blue-800'
                                      : isCompleted
                                        ? 'bg-gray-100 text-gray-700'
                                        : 'bg-red-50 text-red-600'
                              }`}
                            >
                              {b.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="mt-1! text-xs text-ink-muted">
                            Event Date: <strong className="text-ink">{formatDate(b.eventDate)}</strong> • {b.eventType} • {b.location}
                          </p>
                        </div>

                        {/* WhatsApp / Phone CTA for Confirmed */}
                        {(isConfirmed || isInProgress) && b.phone && (
                          <div className="flex items-center gap-2!">
                            <a
                              href={`https://wa.me/91${b.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5! rounded-full bg-[#25d366] px-4! py-1.5! text-xs font-semibold text-white shadow-soft transition hover:opacity-90"
                            >
                              WhatsApp Customer
                            </a>
                            <a
                              href={`tel:${b.phone}`}
                              className="rounded-full border border-line px-3! py-1.5! text-xs font-medium text-ink hover:bg-cream"
                            >
                              Call
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="mt-4! grid gap-2! text-xs sm:grid-cols-3 bg-cream/40 p-3! rounded-2xl">
                        <div>
                          <span className="text-ink-muted">Guests: </span>
                          <strong className="text-ink">{b.guestCount || 'Not specified'}</strong>
                        </div>
                        <div>
                          <span className="text-ink-muted">Design Style: </span>
                          <strong className="text-ink">{b.designStyle || 'Artist Choice'}</strong>
                        </div>
                        {b.quote?.amount && (
                          <div>
                            <span className="text-ink-muted">Quote Amount: </span>
                            <strong className="text-brand">₹{b.quote.amount.toLocaleString('en-IN')}</strong>
                          </div>
                        )}
                      </div>

                      {b.message && (
                        <p className="mt-3! text-xs text-ink-soft bg-white border border-line/60 p-2.5! rounded-xl">
                          &quot;{b.message}&quot;
                        </p>
                      )}

                      {/* Decline Reason if declined */}
                      {isDeclined && b.declineReason && (
                        <p className="mt-2! text-xs text-red-600 bg-red-50 p-2! rounded-xl">
                          Decline Reason: {b.declineReason}
                        </p>
                      )}

                      {/* Actions for Pending Booking Requests */}
                      {isPending && (
                        <div className="mt-5! flex flex-wrap items-center gap-3! border-t border-line pt-4!">
                          <button
                            onClick={() => handleBookingAction(b.id, 'accept')}
                            disabled={actionLoading}
                            className="cursor-pointer rounded-full bg-green px-5! py-2! text-xs font-semibold text-white shadow-soft transition hover:bg-green/90 disabled:opacity-50"
                          >
                            Accept Booking
                          </button>

                          {declineBookingId === b.id ? (
                            <div className="flex flex-1 items-center gap-2!">
                              <input
                                type="text"
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                                placeholder="State reason (e.g. Schedule conflict, out of area)"
                                className="w-full rounded-xl border border-line bg-cream/50 px-3! py-1.5! text-xs outline-none focus:border-brand"
                              />
                              <button
                                onClick={() => handleBookingAction(b.id, 'decline', declineReason)}
                                disabled={actionLoading || !declineReason.trim()}
                                className="cursor-pointer whitespace-nowrap rounded-full bg-red-600 px-4! py-1.5! text-xs font-semibold text-white disabled:opacity-50"
                              >
                                Confirm Decline
                              </button>
                              <button
                                onClick={() => {
                                  setDeclineBookingId(null)
                                  setDeclineReason('')
                                }}
                                className="cursor-pointer text-xs text-ink-muted hover:text-ink"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setDeclineBookingId(b.id)
                                setDeclineReason('')
                              }}
                              disabled={actionLoading}
                              className="cursor-pointer rounded-full border border-line px-4! py-2! text-xs font-medium text-ink-muted hover:border-red-300 hover:text-red-600"
                            >
                              Decline Request
                            </button>
                          )}
                        </div>
                      )}

                      {/* Actions for Confirmed Bookings */}
                      {isConfirmed && (
                        <div className="mt-5! flex items-center gap-3! border-t border-line pt-4!">
                          <button
                            onClick={() => handleBookingAction(b.id, 'in_progress')}
                            disabled={actionLoading}
                            className="cursor-pointer rounded-full border border-brand bg-white px-4! py-1.5! text-xs font-semibold text-brand transition hover:bg-brand/10"
                          >
                            Mark In Progress
                          </button>
                          <button
                            onClick={() => handleBookingAction(b.id, 'complete')}
                            disabled={actionLoading}
                            className="cursor-pointer rounded-full bg-ink px-4! py-1.5! text-xs font-semibold text-white transition hover:bg-coal"
                          >
                            Mark Completed
                          </button>

                          {cancelBookingId === b.id ? (
                            <div className="flex flex-1 items-center gap-2!">
                              <input
                                type="text"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Reason for cancellation"
                                className="w-full rounded-xl border border-line bg-cream/50 px-3! py-1.5! text-xs outline-none focus:border-brand"
                              />
                              <button
                                onClick={() => handleBookingAction(b.id, 'cancel', cancelReason)}
                                disabled={actionLoading || !cancelReason.trim()}
                                className="cursor-pointer whitespace-nowrap rounded-full bg-red-600 px-4! py-1.5! text-xs font-semibold text-white disabled:opacity-50"
                              >
                                Confirm Cancel
                              </button>
                              <button
                                onClick={() => { setCancelBookingId(null); setCancelReason('') }}
                                className="cursor-pointer text-xs text-ink-muted hover:text-ink"
                              >
                                Back
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setCancelBookingId(b.id); setCancelReason('') }}
                              disabled={actionLoading}
                              className="cursor-pointer rounded-full border border-line px-4! py-1.5! text-xs font-medium text-red-500 hover:border-red-300 hover:bg-red-50"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      )}

                      {/* Actions for In Progress */}
                      {isInProgress && (
                        <div className="mt-5! flex items-center gap-3! border-t border-line pt-4!">
                          <button
                            onClick={() => handleBookingAction(b.id, 'complete')}
                            disabled={actionLoading}
                            className="cursor-pointer rounded-full bg-green px-4! py-1.5! text-xs font-semibold text-white transition hover:bg-green/90"
                          >
                            Mark Job Completed
                          </button>

                          {cancelBookingId === b.id ? (
                            <div className="flex flex-1 items-center gap-2!">
                              <input
                                type="text"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Reason for cancellation"
                                className="w-full rounded-xl border border-line bg-cream/50 px-3! py-1.5! text-xs outline-none focus:border-brand"
                              />
                              <button
                                onClick={() => handleBookingAction(b.id, 'cancel', cancelReason)}
                                disabled={actionLoading || !cancelReason.trim()}
                                className="cursor-pointer whitespace-nowrap rounded-full bg-red-600 px-4! py-1.5! text-xs font-semibold text-white disabled:opacity-50"
                              >
                                Confirm Cancel
                              </button>
                              <button
                                onClick={() => { setCancelBookingId(null); setCancelReason('') }}
                                className="cursor-pointer text-xs text-ink-muted hover:text-ink"
                              >
                                Back
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setCancelBookingId(b.id); setCancelReason('') }}
                              disabled={actionLoading}
                              className="cursor-pointer rounded-full border border-line px-4! py-1.5! text-xs font-medium text-red-500 hover:border-red-300 hover:bg-red-50"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MATCHED LEADS & QUOTES */}
        {activeTab === 'leads' && (
          <div className="space-y-6!">
            {loadingLeads ? (
              <div className="py-12! text-center text-ink-muted">Loading leads...</div>
            ) : leads.length === 0 ? (
              <div className="rounded-3xl border border-line bg-white p-8! text-center">
                <p className="text-ink-muted">No leads matched to your profile yet. Make sure your services and service areas are up to date!</p>
              </div>
            ) : (
              <div className="space-y-4!">
                {leads.map((lead) => (
                  <div key={lead.id} className="rounded-3xl border border-line bg-white p-6! shadow-soft">
                    <div className="flex flex-wrap items-start justify-between gap-4!">
                      <div>
                        <div className="flex items-center gap-2!">
                          <h3 className="font-display text-lg! font-semibold text-ink">{lead.eventType}</h3>
                          <span className="rounded-full bg-cream px-2.5! py-0.5! text-xs font-medium text-ink-muted">
                            Lead #{lead.id}
                          </span>
                        </div>
                        <p className="mt-1! text-xs text-ink-muted">
                          Date: <strong className="text-ink">{formatDate(lead.eventDate)}</strong> • Location: <strong className="text-ink">{lead.eventLocation}</strong>
                        </p>
                      </div>

                      {lead.myQuote ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1! rounded-full bg-green/10 px-2.5! py-0.5! text-xs font-semibold text-green">
                            Quote Sent: ₹{lead.myQuote.amount.toLocaleString('en-IN')}
                          </span>
                          <p className="text-[11px] text-ink-muted mt-0.5! capitalize">Status: {lead.myQuote.status}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setQuotingLead(lead)
                            setQuoteForm((prev) => ({
                              ...prev,
                              amount: artist.startingPrice?.toString() || '3000',
                            }))
                          }}
                          className="cursor-pointer rounded-full bg-gradient-to-r from-brand to-brand-dark px-5! py-2! text-xs font-semibold text-white shadow-soft transition hover:shadow-lift"
                        >
                          Submit Quote
                        </button>
                      )}
                    </div>

                    <div className="mt-3! grid gap-2! text-xs sm:grid-cols-3 bg-cream/40 p-3! rounded-2xl">
                      <div>
                        <span className="text-ink-muted">Guest Count: </span>
                        <strong className="text-ink">{lead.guestCount || 'Flexible'}</strong>
                      </div>
                      <div>
                        <span className="text-ink-muted">Budget Range: </span>
                        <strong className="text-ink">{lead.budgetRange || 'Open'}</strong>
                      </div>
                      <div>
                        <span className="text-ink-muted">Preferred Style: </span>
                        <strong className="text-ink">{lead.designStyle || 'Any'}</strong>
                      </div>
                    </div>

                    {lead.additionalNotes && (
                      <p className="mt-2.5! text-xs text-ink-soft">
                        Notes: &quot;{lead.additionalNotes}&quot;
                      </p>
                    )}

                    {lead.referenceImages && lead.referenceImages.length > 0 && (
                      <div className="mt-3!">
                        <p className="mb-2! text-xs font-medium text-ink-muted">Reference Design Images:</p>
                        <div className="flex flex-wrap gap-2!">
                          {lead.referenceImages.map((ref: any, i: number) => (
                            <a
                              key={i}
                              href={`/api/media/file/${ref.image?.filename || ref.image}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block h-16! w-16! overflow-hidden rounded-lg border border-line hover:border-brand transition-colors"
                            >
                              <img
                                src={`/api/media/file/${ref.image?.filename || ref.image}`}
                                alt={`Reference ${i + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quote Submission Modal */}
            {quotingLead && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4!">
                <div className="w-full max-w-lg rounded-3xl border border-line bg-white p-6! shadow-lift md:p-8!">
                  <div className="flex items-center justify-between border-b border-line pb-3!">
                    <h3 className="font-display text-lg! font-semibold text-ink">
                      Submit Quote for Lead #{quotingLead.id}
                    </h3>
                    <button
                      onClick={() => setQuotingLead(null)}
                      className="cursor-pointer text-xl text-ink-muted hover:text-ink"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleQuoteSubmit} className="mt-4! space-y-4!">
                    <div className="grid gap-4! sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-ink-soft mb-1!">Pricing Model *</label>
                        <select
                          value={quoteForm.priceType}
                          onChange={(e) => setQuoteForm({ ...quoteForm, priceType: e.target.value })}
                          className="w-full rounded-xl border border-line bg-cream/50 px-3! py-2! text-xs text-ink outline-none focus:border-brand"
                        >
                          <option value="package">Package / Fixed Rate</option>
                          <option value="hourly">Hourly Rate</option>
                          <option value="per_person">Per Person / Guest</option>
                          <option value="custom_quote">Custom Quote</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-ink-soft mb-1!">Total Quote Amount (₹) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={quoteForm.amount}
                          onChange={(e) => setQuoteForm({ ...quoteForm, amount: e.target.value })}
                          placeholder="e.g. 5000"
                          className="w-full rounded-xl border border-line bg-cream/50 px-3! py-2! text-xs text-ink outline-none focus:border-brand"
                        />
                      </div>
                    </div>

                    {(quoteForm.priceType === 'hourly' || quoteForm.priceType === 'per_person') && (
                      <div className="grid gap-4! sm:grid-cols-2 bg-cream/40 p-3! rounded-xl">
                        <div>
                          <label className="block text-xs font-medium text-ink-soft mb-1!">
                            {quoteForm.priceType === 'hourly' ? 'Rate per Hour (₹)' : 'Rate per Person (₹)'}
                          </label>
                          <input
                            type="number"
                            value={quoteForm.unitRate}
                            onChange={(e) => setQuoteForm({ ...quoteForm, unitRate: e.target.value })}
                            placeholder="e.g. 500"
                            className="w-full rounded-xl border border-line bg-white px-3! py-2! text-xs text-ink outline-none focus:border-brand"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink-soft mb-1!">
                            {quoteForm.priceType === 'hourly' ? 'Estimated Hours' : 'Guest Count'}
                          </label>
                          <input
                            type="number"
                            value={quoteForm.units}
                            onChange={(e) => setQuoteForm({ ...quoteForm, units: e.target.value })}
                            placeholder="e.g. 5"
                            className="w-full rounded-xl border border-line bg-white px-3! py-2! text-xs text-ink outline-none focus:border-brand"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4! sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-ink-soft mb-1!">Travel Fee (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={quoteForm.travelFee}
                          onChange={(e) => setQuoteForm({ ...quoteForm, travelFee: e.target.value })}
                          placeholder="e.g. 300"
                          className="w-full rounded-xl border border-line bg-cream/50 px-3! py-2! text-xs text-ink outline-none focus:border-brand"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-ink-soft mb-1!">Artists Required</label>
                        <input
                          type="number"
                          min="1"
                          value={quoteForm.numberOfArtists}
                          onChange={(e) => setQuoteForm({ ...quoteForm, numberOfArtists: e.target.value })}
                          className="w-full rounded-xl border border-line bg-cream/50 px-3! py-2! text-xs text-ink outline-none focus:border-brand"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink-soft mb-1!">Message to Customer</label>
                      <textarea
                        rows={2}
                        value={quoteForm.message}
                        onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                        placeholder="Detail what is included (e.g. Travel to venue, materials, setup time, consultation)..."
                        className="w-full rounded-xl border border-line bg-cream/50 px-3! py-2! text-xs text-ink outline-none focus:border-brand resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3! pt-2!">
                      <button
                        type="button"
                        onClick={() => setQuotingLead(null)}
                        className="rounded-full border border-line px-4! py-2! text-xs font-medium text-ink-soft cursor-pointer hover:bg-cream"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingQuote}
                        className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-6! py-2! text-xs font-semibold text-white shadow-soft cursor-pointer hover:shadow-lift disabled:opacity-50"
                      >
                        {submittingQuote ? 'Sending Quote...' : 'Send Quote'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AVAILABILITY CALENDAR */}
        {activeTab === 'availability' && (
          <div className="space-y-8!">
            {/* Block Date Form */}
            <div className="rounded-3xl border border-line bg-white p-6! shadow-soft md:p-8!">
              <h3 className="font-display text-lg! font-semibold text-ink">Block Out Unavailable Dates</h3>
              <p className="mt-1! text-xs text-ink-soft">
                Add dates when you are on leave, fully booked elsewhere, or not taking new bookings. Customers and platform cannot assign bookings on blocked dates.
              </p>

              <form onSubmit={handleBlockDate} className="mt-5! flex flex-wrap items-end gap-4!">
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1!">Select Date *</label>
                  <input
                    type="date"
                    required
                    value={newBlockDate}
                    onChange={(e) => setNewBlockDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="rounded-xl border border-line bg-cream/50 px-4! py-2.5! text-xs text-ink outline-none focus:border-brand"
                  />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-ink-soft mb-1!">Reason (optional)</label>
                  <input
                    type="text"
                    value={newBlockReason}
                    onChange={(e) => setNewBlockReason(e.target.value)}
                    placeholder="e.g. Personal leave, Out of city"
                    className="w-full rounded-xl border border-line bg-cream/50 px-4! py-2.5! text-xs text-ink outline-none focus:border-brand"
                  />
                </div>

                <button
                  type="submit"
                  disabled={blockingDate || !newBlockDate}
                  className="rounded-full bg-ink px-6! py-2.5! text-xs font-semibold text-white shadow-soft transition hover:bg-coal disabled:opacity-50 cursor-pointer"
                >
                  {blockingDate ? 'Blocking...' : 'Block Date'}
                </button>
              </form>
            </div>

            <div className="grid gap-6! md:grid-cols-2">
              {/* Blocked Dates List */}
              <div className="rounded-3xl border border-line bg-white p-6! shadow-soft">
                <h4 className="font-display text-base! font-semibold text-ink mb-4!">
                  Your Blocked Dates ({unavailableDates.length})
                </h4>
                {loadingAvailability ? (
                  <p className="text-xs text-ink-muted">Loading...</p>
                ) : unavailableDates.length === 0 ? (
                  <p className="text-xs text-ink-muted">No dates currently blocked.</p>
                ) : (
                  <div className="space-y-2! max-h-80 overflow-y-auto pr-1!">
                    {unavailableDates.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl border border-line/60 bg-cream/30 px-3.5! py-2.5! text-xs"
                      >
                        <div>
                          <strong className="text-ink">{formatDate(item.date)}</strong>
                          {item.reason && (
                            <span className="ml-2! text-ink-muted">({item.reason})</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleUnblockDate(item.date)}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirmed Booked Dates */}
              <div className="rounded-3xl border border-line bg-white p-6! shadow-soft">
                <h4 className="font-display text-base! font-semibold text-ink mb-4!">
                  Confirmed Booked Dates ({bookedDates.length})
                </h4>
                {loadingAvailability ? (
                  <p className="text-xs text-ink-muted">Loading...</p>
                ) : bookedDates.length === 0 ? (
                  <p className="text-xs text-ink-muted">No confirmed bookings yet.</p>
                ) : (
                  <div className="space-y-2! max-h-80 overflow-y-auto pr-1!">
                    {bookedDates.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl border border-green/30 bg-green/5 px-3.5! py-2.5! text-xs"
                      >
                        <div>
                          <strong className="text-ink">{formatDate(item.eventDate)}</strong>
                          <span className="ml-2! text-green font-medium">({item.eventType} - {item.customerName})</span>
                        </div>
                        <span className="rounded-full bg-green/10 px-2! py-0.5! text-[11px] font-semibold text-green">
                          Booked
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE & PORTFOLIO */}
        {activeTab === 'profile' && (
          <div className="grid gap-8! lg:grid-cols-[1fr_1.5fr]">
            {/* Left: Profile Photo + Status */}
            <div className="flex flex-col gap-6!">
              <div className="rounded-3xl border border-line bg-white p-6! shadow-soft">
                <h3 className="font-display text-lg! font-semibold text-ink">Profile Photo</h3>
                <div className="mt-4! flex flex-col items-center gap-4!">
                  <div className="relative">
                    {artist.profilePhoto ? (
                      <img
                        src={`/api/media/file/${(artist.profilePhoto as any).filename}`}
                        alt={artist.displayName}
                        className="h-28! w-28! rounded-full object-contain ring-4 ring-brand/20"
                      />
                    ) : (
                      <ArtistPlaceholder name={artist.displayName} size="sm" className="h-28! w-28! ring-4 ring-brand/20" />
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
                    <span className="text-sm text-ink-soft">Verified Badge</span>
                    {artist.verified ? (
                      <span className="inline-flex items-center gap-1! rounded-full bg-green/10 px-2.5! py-0.5! text-xs font-semibold text-green">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs text-ink-muted">Pending Verification</span>
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
                    <span className="text-xs text-brand">artistora.com/artists/{artist.slug}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Edit Form */}
            <div className="flex flex-col gap-6!">
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
                        placeholder="e.g. Vastrapur, SG Highway"
                        className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4! sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5! block text-sm font-medium text-ink-soft">Years of Exp.</label>
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
                      <label className="mb-1.5! block text-sm font-medium text-ink-soft">Pricing Model</label>
                      <select
                        value={form.priceType}
                        onChange={(e) => update('priceType', e.target.value)}
                        className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                      >
                        <option value="package">Package / Fixed</option>
                        <option value="hourly">Hourly Rate</option>
                        <option value="per_person">Per Person</option>
                        <option value="custom_quote">Custom Quote</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5! block text-sm font-medium text-ink-soft">Starting Price (₹)</label>
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

              {/* Services & Styles */}
              <div className="rounded-3xl border border-line bg-white p-6! shadow-soft md:p-7!">
                <h3 className="font-display text-lg! font-semibold text-ink">Services & Styles</h3>
                <p className="mt-1! text-sm text-ink-soft">Select the services you offer, then pick your styles</p>

                <div className="mt-4!">
                  <p className="mb-2! text-xs font-medium uppercase tracking-wide text-ink-muted">Services</p>
                  <div className="flex flex-wrap gap-2!">
                    {SERVICE_OPTIONS.map((svc) => (
                      <button
                        key={svc.slug}
                        type="button"
                        onClick={() => toggleService(svc.slug)}
                        className={`cursor-pointer rounded-full border px-4! py-2! text-sm font-medium transition-all duration-200 ${
                          form.services.includes(svc.slug)
                            ? 'border-brand bg-brand text-white'
                            : 'border-line bg-white text-ink-soft hover:border-brand/40'
                        }`}
                      >
                        {svc.label}
                      </button>
                    ))}
                  </div>
                </div>

                {form.services.length > 0 && (
                  <div className="mt-5!">
                    <p className="mb-2! text-xs font-medium uppercase tracking-wide text-ink-muted">Styles</p>
                    <div className="flex flex-wrap gap-2!">
                      {form.services.flatMap((slug) => STYLE_OPTIONS[slug] || []).map((style) => (
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
                )}
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

                {portfolioError && (
                  <p className="mt-3! rounded-xl border border-red-200 bg-red-50 px-4! py-2! text-sm text-red-700">{portfolioError}</p>
                )}

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
                {saved && <span className="text-sm text-green font-medium">Saved!</span>}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex min-h-12! cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-8! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8!">
            {loadingAnalytics ? (
              <div className="flex items-center justify-center py-20!">
                <div className="h-8! w-8! animate-spin rounded-full border-2 border-brand border-t-transparent" />
              </div>
            ) : analytics ? (
              <Suspense fallback={<ChartFallback />}>
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-4! md:grid-cols-4">
                  {[
                    { label: 'Total Earnings', value: `₹${(analytics.stats.totalEarnings || 0).toLocaleString('en-IN')}`, color: 'text-green', bg: 'bg-green/5' },
                    { label: 'Profile Views', value: analytics.stats.profileViews || 0, color: 'text-brand', bg: 'bg-brand/5' },
                    { label: 'Conversion Rate', value: `${analytics.stats.conversionRate || 0}%`, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Avg Response', value: `${analytics.stats.avgResponseHours || 0}h`, color: 'text-ink', bg: 'bg-cream' },
                  ].map((stat) => (
                    <div key={stat.label} className={`rounded-2xl border border-line ${stat.bg} p-4!`}>
                      <p className="text-xs font-medium text-ink-muted">{stat.label}</p>
                      <p className={`mt-1! text-2xl! font-display font-semibold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Revenue Trend */}
                <div className="rounded-2xl border border-line bg-white p-6!">
                  <h3 className="mb-4! text-sm font-semibold text-ink">Revenue Trend (6 Months)</h3>
                  <div className="h-72!">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.revenueByMonth}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec6783" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ec6783" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1d9dc" />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7e8aa3' }} />
                        <YAxis tick={{ fontSize: 12, fill: '#7e8aa3' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: '1px solid #f1d9dc', fontSize: 13 }}
                          formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#ec6783" strokeWidth={2} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid gap-6! md:grid-cols-2">
                  {/* Bookings by Status */}
                  <div className="rounded-2xl border border-line bg-white p-6!">
                    <h3 className="mb-4! text-sm font-semibold text-ink">Bookings by Status</h3>
                    <div className="h-64!">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(analytics.bookingsByStatus).map(([key, val]) => ({
                          name: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                          count: val as number,
                        })).filter((d) => d.count > 0)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1d9dc" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7e8aa3' }} angle={-20} textAnchor="end" height={60} />
                          <YAxis tick={{ fontSize: 12, fill: '#7e8aa3' }} allowDecimals={false} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #f1d9dc', fontSize: 13 }} />
                          <Bar dataKey="count" fill="#ec6783" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Event Types */}
                  <div className="rounded-2xl border border-line bg-white p-6!">
                    <h3 className="mb-4! text-sm font-semibold text-ink">Event Types</h3>
                    <div className="h-64!">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.eventTypes}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                            nameKey="name"
                          >
                            {analytics.eventTypes.map((_: any, i: number) => (
                              <Cell key={i} fill={['#ec6783', '#d14a68', '#04224B', '#f6a6b8', '#c77e90', '#17856b', '#7e8aa3'][i % 7]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #f1d9dc', fontSize: 13 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2! flex flex-wrap gap-3!">
                      {analytics.eventTypes.slice(0, 5).map((et: any, i: number) => (
                        <span key={et.name} className="flex items-center gap-1.5! text-xs text-ink-muted">
                          <span className="inline-block h-2.5! w-2.5! rounded-full" style={{ backgroundColor: ['#ec6783', '#d14a68', '#04224B', '#f6a6b8', '#c77e90'][i % 5] }} />
                          {et.name} ({et.value})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6! md:grid-cols-2">
                  {/* Conversion Funnel */}
                  <div className="rounded-2xl border border-line bg-white p-6!">
                    <h3 className="mb-4! text-sm font-semibold text-ink">Conversion Funnel</h3>
                    <div className="space-y-3!">
                      {[
                        { label: 'Leads Received', value: analytics.funnel.leads, pct: 100 },
                        { label: 'Quotes Sent', value: analytics.funnel.quotes, pct: analytics.funnel.leads > 0 ? Math.round((analytics.funnel.quotes / analytics.funnel.leads) * 100) : 0 },
                        { label: 'Quotes Accepted', value: analytics.funnel.accepted, pct: analytics.funnel.leads > 0 ? Math.round((analytics.funnel.accepted / analytics.funnel.leads) * 100) : 0 },
                        { label: 'Bookings Completed', value: analytics.funnel.bookings, pct: analytics.funnel.leads > 0 ? Math.round((analytics.funnel.bookings / analytics.funnel.leads) * 100) : 0 },
                      ].map((step, i) => (
                        <div key={step.label}>
                          <div className="mb-1! flex items-center justify-between text-sm">
                            <span className="text-ink-soft">{step.label}</span>
                            <span className="font-semibold text-ink">{step.value}</span>
                          </div>
                          <div className="h-3! overflow-hidden rounded-full bg-cream">
                            <div
                              className="h-full! rounded-full transition-all duration-500"
                              style={{
                                width: `${step.pct}%`,
                                backgroundColor: ['#ec6783', '#d14a68', '#04224B', '#17856b'][i],
                              }}
                            />
                          </div>
                          <p className="mt-0.5! text-right text-xs text-ink-muted">{step.pct}%</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  <div className="rounded-2xl border border-line bg-white p-6!">
                    <h3 className="mb-4! text-sm font-semibold text-ink">Rating Distribution</h3>
                    <div className="space-y-2.5!">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = analytics.ratingDistribution[star - 1] || 0
                        const total = analytics.ratingDistribution.reduce((a: number, b: number) => a + b, 0)
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0
                        return (
                          <div key={star} className="flex items-center gap-3!">
                            <span className="w-8! text-right text-sm text-ink-muted">{star}★</span>
                            <div className="h-3! flex-1 overflow-hidden rounded-full bg-cream">
                              <div
                                className="h-full! rounded-full bg-amber-400 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-8! text-sm text-ink-muted">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-4! border-t border-line pt-4! text-center">
                      <p className="text-3xl! font-display font-semibold text-ink">{analytics.stats.rating || '—'}</p>
                      <p className="text-xs text-ink-muted">{analytics.stats.reviewCount || 0} reviews</p>
                    </div>
                  </div>
                </div>

                {/* Quote Performance */}
                <div className="rounded-2xl border border-line bg-white p-6!">
                  <h3 className="mb-4! text-sm font-semibold text-ink">Quote Performance</h3>
                  <div className="grid grid-cols-3 gap-4! text-center">
                    <div>
                      <p className="text-3xl! font-display font-semibold text-brand">{analytics.stats.totalQuotes}</p>
                      <p className="text-xs text-ink-muted">Quotes Sent</p>
                    </div>
                    <div>
                      <p className="text-3xl! font-display font-semibold text-green">{analytics.stats.acceptedQuotes}</p>
                      <p className="text-xs text-ink-muted">Accepted</p>
                    </div>
                    <div>
                      <p className="text-3xl! font-display font-semibold text-ink">{analytics.stats.conversionRate || 0}%</p>
                      <p className="text-xs text-ink-muted">Win Rate</p>
                    </div>
                  </div>
                </div>
              </>
              </Suspense>
            ) : (
              <div className="rounded-2xl border border-line bg-white p-12! text-center">
                <p className="text-ink-muted">No analytics data yet. Complete bookings to see your performance insights.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
