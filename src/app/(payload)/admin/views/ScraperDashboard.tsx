'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Gutter, Button } from '@payloadcms/ui'

const SERVICES = [
  { value: 'mehndi', label: 'Mehndi', icon: '🪷', queries: ['mehndi artist', 'henna artist', 'bridal mehndi'] },
  { value: 'photography', label: 'Photography', icon: '📸', queries: ['wedding photographer', 'photography studio'] },
  { value: 'makeup', label: 'Makeup', icon: '💄', queries: ['bridal makeup artist', 'makeup studio'] },
  { value: 'decor', label: 'Decor', icon: '🎪', queries: ['wedding decorator', 'wedding decoration'] },
  { value: 'music', label: 'Music / DJ', icon: '🎵', queries: ['wedding DJ', 'wedding band'] },
]

const SOURCES = [
  { value: 'google_maps', label: 'Google Maps', icon: '🗺️' },
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'justdial', label: 'Justdial', icon: '📱' },
  { value: 'sulekha', label: 'Sulekha', icon: '🟠' },
  { value: 'wedmegood', label: 'WedMeGood', icon: '💒' },
  { value: 'weddingwire', label: 'WeddingWire', icon: '💍' },
]

export default function ScraperDashboard() {
  const [selectedService, setSelectedService] = useState('')
  const [selectedSource, setSelectedSource] = useState('google_maps')
  const [customQuery, setCustomQuery] = useState('')
  const [maxResults, setMaxResults] = useState(50)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [recentJobs, setRecentJobs] = useState<any[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)

  const getQuery = () => {
    if (customQuery) return customQuery
    const service = SERVICES.find(s => s.value === selectedService)
    return service?.queries[0] || 'artist'
  }

  const loadRecentJobs = useCallback(async () => {
    setLoadingJobs(true)
    try {
      const res = await fetch('/api/outreach/scrape')
      const data = await res.json()
      setRecentJobs(data.docs || [])
    } catch {}
    setLoadingJobs(false)
  }, [])

  useEffect(() => { loadRecentJobs() }, [loadRecentJobs])

  const handleScrape = async () => {
    if (!selectedService && !customQuery) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/outreach/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: selectedSource,
          query: getQuery(),
          city: 'Ahmedabad',
          category: selectedService || undefined,
          maxResults,
        }),
      })
      const data = await res.json()
      setResult(data)
      setTimeout(loadRecentJobs, 2000)
    } catch {
      setResult({ error: 'Failed to start scrape' })
    } finally {
      setLoading(false)
    }
  }

  const handleRunAll = async (service: string) => {
    setLoading(true)
    setResult(null)
    const svc = SERVICES.find(s => s.value === service)
    if (!svc) return
    const results: any[] = []
    for (const src of SOURCES) {
      for (const query of svc.queries) {
        try {
          const res = await fetch('/api/outreach/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: src.value, query, city: 'Ahmedabad', category: service, maxResults }),
          })
          results.push({ source: src.value, query, ...(await res.json()) })
        } catch {
          results.push({ source: src.value, query, error: 'Failed' })
        }
      }
    }
    setResult({ multiJob: true, results, totalJobs: results.length })
    loadRecentJobs()
    setLoading(false)
  }

  return (
    <Gutter>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
          🔍 Artist Scraper
        </h1>
        <p style={{ color: 'var(--theme-elevation-500)', margin: 0 }}>
          Discover artists from Google Maps, Instagram, Justdial, and more
        </p>
      </div>

      {/* Service Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
          Service Category
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
          {SERVICES.map(s => (
            <button
              key={s.value}
              onClick={() => setSelectedService(s.value)}
              style={{
                padding: '12px',
                border: `2px solid ${selectedService === s.value ? 'var(--theme-elevation-150)' : 'var(--theme-elevation-100)'}`,
                borderRadius: 'var(--border-radius)',
                background: selectedService === s.value ? 'var(--theme-elevation-50)' : 'transparent',
                cursor: 'pointer',
                fontWeight: selectedService === s.value ? 600 : 400,
                textAlign: 'left',
                color: 'var(--theme-text)',
                fontSize: '14px',
              }}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Source Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
          Source Platform
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SOURCES.map(s => (
            <button
              key={s.value}
              onClick={() => setSelectedSource(s.value)}
              style={{
                padding: '6px 14px',
                border: `2px solid ${selectedSource === s.value ? 'var(--theme-elevation-150)' : 'var(--theme-elevation-100)'}`,
                borderRadius: 'var(--border-radius)',
                background: selectedSource === s.value ? 'var(--theme-elevation-50)' : 'transparent',
                cursor: 'pointer',
                fontWeight: selectedSource === s.value ? 600 : 400,
                fontSize: '13px',
                color: 'var(--theme-text)',
              }}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Query */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
          Search Query
        </label>
        <input
          type="text"
          value={customQuery}
          onChange={e => setCustomQuery(e.target.value)}
          placeholder={selectedService ? SERVICES.find(s => s.value === selectedService)?.queries[0] : 'e.g., mehndi artist'}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--border-radius)',
            fontSize: '14px',
            boxSizing: 'border-box',
            background: 'var(--theme-elevation-0)',
            color: 'var(--theme-text)',
          }}
        />
      </div>

      {/* Max Results */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
          Max Results: {maxResults}
        </label>
        <input
          type="range"
          min="10"
          max="200"
          step="10"
          value={maxResults}
          onChange={e => setMaxResults(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <Button
          buttonStyle="primary"
          onClick={handleScrape}
          disabled={loading || (!selectedService && !customQuery)}
        >
          {loading ? '⏳ Scraping...' : `🔍 Scrape ${SOURCES.find(s => s.value === selectedSource)?.label}`}
        </Button>
        {selectedService && (
          <Button
            buttonStyle="secondary"
            onClick={() => handleRunAll(selectedService)}
            disabled={loading}
          >
            {loading ? '⏳ Running All...' : '🚀 Run All Sources'}
          </Button>
        )}
      </div>

      {/* Result Banner */}
      {result && (
        <div style={{
          marginBottom: '24px',
          padding: '12px 16px',
          borderRadius: 'var(--border-radius)',
          background: result.error ? 'var(--theme-error-50)' : 'var(--theme-success-50, #e8f5e9)',
          border: `1px solid ${result.error ? 'var(--theme-error-500)' : 'var(--theme-success-500, #4caf50)'}`,
          color: result.error ? 'var(--theme-error-500)' : 'var(--theme-success-500, #4caf50)',
        }}>
          {result.error ? '❌ Scrape Failed' : result.multiJob ? `✅ Launched ${result.totalJobs} scrape jobs` : `✅ Job #${result.jobId} started`}
        </div>
      )}

      {/* Recent Jobs */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Recent Scrape Jobs</h2>
          <Button
            buttonStyle="secondary"
            size="small"
            onClick={loadRecentJobs}
          >
            🔄 Refresh
          </Button>
        </div>

        {loadingJobs ? (
          <p style={{ color: 'var(--theme-elevation-500)' }}>Loading...</p>
        ) : recentJobs.length === 0 ? (
          <div style={{ padding: '12px 16px', borderRadius: 'var(--border-radius)', background: 'var(--theme-elevation-50)', border: '1px solid var(--theme-elevation-100)', color: 'var(--theme-elevation-500)' }}>
            ℹ️ No scrape jobs yet. Run your first scrape above!
          </div>
        ) : (
          <div style={{ border: '1px solid var(--theme-elevation-100)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--theme-elevation-100)', background: 'var(--theme-elevation-50)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>Source</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>Query</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600 }}>Found</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600 }}>New</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job: any) => (
                  <tr key={job.id} style={{ borderBottom: '1px solid var(--theme-elevation-50)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      {SOURCES.find(s => s.value === job.source)?.icon} {SOURCES.find(s => s.value === job.source)?.label || job.source}
                    </td>
                    <td style={{ padding: '10px 12px' }}>{job.searchQuery}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: 'var(--border-radius)',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: job.status === 'completed' ? 'var(--theme-success-100)' : job.status === 'failed' ? 'var(--theme-error-100)' : 'var(--theme-elevation-100)',
                        color: job.status === 'completed' ? 'var(--theme-success-500)' : job.status === 'failed' ? 'var(--theme-error-500)' : 'var(--theme-elevation-600)',
                      }}>
                        {job.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{job.resultsFound || 0}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--theme-success-500)' }}>
                      {job.newArtists || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Gutter>
  )
}
