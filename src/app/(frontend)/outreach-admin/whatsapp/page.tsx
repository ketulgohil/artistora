'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

export default function WhatsAppAuthPage() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected' | 'error'>('loading')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/outreach/whatsapp/status')
      const data = await res.json()

      if (data.connected) {
        setStatus('connected')
        setQrCode(null)
        setMessage('WhatsApp is connected and ready to send messages.')
      } else {
        setStatus('disconnected')
        setMessage(data.message || 'WhatsApp is not connected.')
      }
    } catch {
      setStatus('error')
      setMessage('Failed to check WhatsApp status.')
    }
  }, [])

  const fetchQR = useCallback(async () => {
    try {
      const res = await fetch('/api/outreach/whatsapp/qr')
      const data = await res.json()

      if (data.qr) {
        setQrCode(data.qr)
        setMessage('Scan this QR code with your WhatsApp app.')
      } else if (data.status === 'ready') {
        setStatus('connected')
        setMessage('WhatsApp is already connected!')
      } else {
        setMessage(data.message || 'Failed to get QR code.')
      }
    } catch {
      setMessage('Failed to fetch QR code. Make sure the server is running.')
    }
  }, [])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  useEffect(() => {
    if (status === 'disconnected') {
      fetchQR()
    }
  }, [status, fetchQR])

  // Poll status every 5 seconds when connected
  useEffect(() => {
    if (status !== 'connected') return
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [status, checkStatus])

  return (
    <main className="min-h-screen bg-[var(--color-blush)]">
      {/* Header */}
      <section className="bg-[var(--color-navy)] py-10!">
        <div className="max-w-3xl mx-auto px-4!">
          <Link
            href="/admin"
            className="text-white/60! hover:text-white! text-sm! font-body mb-2! block"
          >
            ← Back to Admin
          </Link>
          <h1 className="font-display text-3xl! text-white!">WhatsApp Authentication</h1>
          <p className="text-white/70! font-body mt-1!">
            Connect your WhatsApp account to send outreach messages
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4! py-12!">
        {/* Status Card */}
        <div className="bg-white rounded-2xl! shadow-sm! p-8! text-center">
          {/* Status Indicator */}
          <div className="mb-6!">
            {status === 'loading' && (
              <div className="inline-flex items-center gap-2! text-[var(--color-ink-muted)]!">
                <svg className="animate-spin h-5! w-5!" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25!"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75!"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span className="font-body">Checking status...</span>
              </div>
            )}
            {status === 'connected' && (
              <div className="inline-flex items-center gap-2! text-green-600!">
                <span className="text-3xl!">✅</span>
                <span className="font-body font-bold! text-lg!">Connected</span>
              </div>
            )}
            {status === 'disconnected' && (
              <div className="inline-flex items-center gap-2! text-amber-600!">
                <span className="text-3xl!">📱</span>
                <span className="font-body font-bold! text-lg!">Not Connected</span>
              </div>
            )}
            {status === 'error' && (
              <div className="inline-flex items-center gap-2! text-red-600!">
                <span className="text-3xl!">❌</span>
                <span className="font-body font-bold! text-lg!">Error</span>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <p className="text-[var(--color-ink-soft)]! font-body mb-6!">{message}</p>
          )}

          {/* QR Code Display */}
          {qrCode && status === 'disconnected' && (
            <div className="mb-6!">
              <div className="bg-white p-4! rounded-xl! border-2! border-[var(--color-line)]! inline-block!">
                {/* QR code as SVG — whatsapp-web.js returns a data URL or SVG string */}
                <div
                  dangerouslySetInnerHTML={{ __html: qrCode }}
                  className="w-64! h-64!"
                />
              </div>
              <p className="text-sm! text-[var(--color-ink-muted)]! font-body mt-4!">
                Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3! justify-center!">
            {status === 'disconnected' && (
              <button onClick={fetchQR} className="btn-brand! px-6! py-3!">
                🔄 Get New QR Code
              </button>
            )}
            {status === 'connected' && (
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to disconnect WhatsApp?')) {
                    try {
                      // For now, just refresh — actual logout would need a new API endpoint
                      checkStatus()
                    } catch {
                      // Silently handle
                    }
                  }
                }}
                className="btn-outline-brand! px-6! py-3!"
              >
                Disconnect
              </button>
            )}
            <button onClick={checkStatus} className="btn-outline-soft! px-6! py-3!">
              🔄 Refresh Status
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8! pt-6! border-t! border-[var(--color-line)]! text-left!">
            <h3 className="font-display text-lg! font-bold! text-[var(--color-navy)]! mb-4!">
              How to Connect
            </h3>
            <ol className="space-y-3! text-sm! text-[var(--color-ink-soft)]! font-body! list-decimal! list-inside!">
              <li>Open <strong>WhatsApp</strong> on your phone</li>
              <li>Go to <strong>Settings</strong> → <strong>Linked Devices</strong></li>
              <li>Tap <strong>Link a Device</strong></li>
              <li>Scan the QR code shown above</li>
              <li>Wait for the status to change to ✅ Connected</li>
            </ol>
            <div className="mt-4! p-3! bg-amber-50! rounded-lg! text-sm! text-amber-700! font-body!">
              ⚠️ <strong>Note:</strong> This uses WhatsApp Web session. Keep this browser tab open
              to maintain the connection. For production, consider using the WhatsApp Business API.
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
