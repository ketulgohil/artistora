'use client'

import React from 'react'
import Link from 'next/link'

export function BulkUploadNavLink() {
  return (
    <div style={{ padding: '8px 16px', margin: '4px 0' }}>
      <Link
        href="/admin/bulk-upload"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          color: '#2563eb',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: 600,
          border: '1px solid rgba(37, 99, 235, 0.2)',
          transition: 'all 0.15s ease',
        }}
      >
        <span style={{ fontSize: '15px' }}>⚡</span>
        <span>Bulk Image Upload</span>
      </Link>
    </div>
  )
}
