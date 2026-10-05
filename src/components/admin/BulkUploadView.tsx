'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { prepareImageForUpload } from '@/lib/image-upload-helper'

interface ArtistOption {
  id: number
  displayName: string
  artistType?: string
  city?: string
  slug?: string
}

interface CategoryOption {
  id: number
  title: string
  slug: string
}

interface FileItem {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export function BulkUploadView() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [artists, setArtists] = useState<ArtistOption[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [selectedArtistId, setSelectedArtistId] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [altText, setAltText] = useState<string>('')
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  })
  const [resultMessage, setResultMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch artists and categories on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [artistsRes, catRes] = await Promise.all([
          fetch('/api/artists?limit=150&depth=0', { credentials: 'include' }),
          fetch('/api/portfolio-categories?limit=50&depth=0', { credentials: 'include' }),
        ])

        if (artistsRes.ok) {
          const data = await artistsRes.json()
          setArtists(data.docs || [])
        }
        if (catRes.ok) {
          const data = await catRes.json()
          setCategories(data.docs || [])
        }
      } catch (err) {
        console.error('Failed to load initial data for bulk upload:', err)
      }
    }
    loadData()
  }, [])

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    const newItems: FileItem[] = Array.from(selectedFiles).map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
    }))

    setFiles((prev) => [...prev, ...newItems])
    setResultMessage(null)
  }

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id)
      if (target?.preview) URL.revokeObjectURL(target.preview)
      return prev.filter((f) => f.id !== id)
    })
  }

  const clearAllFiles = () => {
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview)
    })
    setFiles([])
    setResultMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const handleUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending' || f.status === 'error')
    if (pendingFiles.length === 0) return

    setIsUploading(true)
    setResultMessage(null)
    setUploadProgress({ current: 0, total: pendingFiles.length })

    let successCount = 0
    let failedCount = 0

    // Upload 1 image at a time to prevent mobile memory spikes and HTTP 413 payload limits
    for (let i = 0; i < pendingFiles.length; i++) {
      const item = pendingFiles[i]

      // Mark current item as uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', error: undefined } : f)),
      )

      try {
        const optimized = await prepareImageForUpload(item.file)
        const formData = new FormData()
        formData.append('files', optimized)

        if (selectedArtistId) {
          formData.append('artistId', selectedArtistId)
        }
        if (selectedCategory) {
          formData.append('category', selectedCategory)
        }
        if (altText) {
          formData.append('alt', altText)
        }

        const res = await fetch('/api/admin/bulk-upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })

        let data: any = null
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          data = await res.json().catch(() => null)
        } else {
          const text = await res.text().catch(() => '')
          data = { error: text || `HTTP ${res.status}: ${res.statusText}` }
        }

        if (res.ok && data?.success) {
          successCount++
          setFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, status: 'success' } : f)),
          )
        } else {
          failedCount++
          const errorMsg =
            data?.errors?.[0]?.error ||
            data?.error ||
            (res.status === 413 ? 'Image too large for mobile upload' : 'Upload failed')
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id ? { ...f, status: 'error', error: errorMsg } : f,
            ),
          )
        }
      } catch (err: any) {
        failedCount++
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: 'error', error: err.message || 'Network error' }
              : f,
          ),
        )
      }

      setUploadProgress({
        current: i + 1,
        total: pendingFiles.length,
      })
    }

    setIsUploading(false)

    if (failedCount === 0) {
      setResultMessage({
        type: 'success',
        text: `Successfully uploaded ${successCount} image(s)${
          selectedArtistId ? ' and attached to artist portfolio!' : ' to Media collection!'
        }`,
      })
    } else {
      setResultMessage({
        type: 'error',
        text: `Uploaded ${successCount} image(s), but ${failedCount} image(s) encountered errors.`,
      })
    }
  }

  const selectedArtist = artists.find((a) => String(a.id) === selectedArtistId)

  return (
    <div
      style={{
        padding: '24px 20px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '24px',
          borderBottom: '1px solid var(--theme-elevation-150)',
          paddingBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                margin: '0 0 6px 0',
                color: 'var(--theme-elevation-800)',
              }}
            >
              ⚡ Bulk Image &amp; Portfolio Upload
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--theme-elevation-500)' }}>
              Upload multiple images simultaneously. Automatically compresses mobile photos and links them to an artist&apos;s portfolio.
            </p>
          </div>
          <Link
            href="/admin/collections/media"
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid var(--theme-elevation-250)',
              backgroundColor: 'var(--theme-elevation-100)',
              color: 'var(--theme-elevation-800)',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            ← View Media Library
          </Link>
        </div>
      </div>

      {/* Notice Banner */}
      {resultMessage && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '8px',
            marginBottom: '20px',
            backgroundColor: resultMessage.type === 'success' ? '#d4edda' : '#f8d7da',
            color: resultMessage.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${resultMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <span style={{ fontWeight: 500, fontSize: '14px' }}>{resultMessage.text}</span>
          {resultMessage.type === 'success' && selectedArtist && (
            <Link
              href={`/admin/collections/artists/${selectedArtist.id}`}
              style={{
                color: '#155724',
                fontWeight: 700,
                textDecoration: 'underline',
                fontSize: '13px',
              }}
            >
              Open {selectedArtist.displayName} Profile →
            </Link>
          )}
        </div>
      )}

      {/* Target Options Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
          backgroundColor: 'var(--theme-elevation-50)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--theme-elevation-150)',
        }}
      >
        {/* Artist Assignment Dropdown */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '6px',
              color: 'var(--theme-elevation-700)',
            }}
          >
            Assign to Artist (Optional)
          </label>
          <select
            value={selectedArtistId}
            onChange={(e) => setSelectedArtistId(e.target.value)}
            disabled={isUploading}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--theme-elevation-250)',
              backgroundColor: 'var(--theme-elevation-0)',
              color: 'var(--theme-elevation-800)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          >
            <option value="">-- General Media Upload (No Artist Binding) --</option>
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.displayName} ({artist.city || 'Ahmedabad'})
              </option>
            ))}
          </select>
          <p style={{ fontSize: '12px', color: 'var(--theme-elevation-450)', margin: '4px 0 0 0' }}>
            Selecting an artist will automatically link all images to their portfolio.
          </p>
        </div>

        {/* Category Dropdown */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '6px',
              color: 'var(--theme-elevation-700)',
            }}
          >
            Portfolio Category (Optional)
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={isUploading}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--theme-elevation-250)',
              backgroundColor: 'var(--theme-elevation-0)',
              color: 'var(--theme-elevation-800)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          >
            <option value="">-- Auto-detect from Artist Service Type --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.title}
              </option>
            ))}
          </select>
          <p style={{ fontSize: '12px', color: 'var(--theme-elevation-450)', margin: '4px 0 0 0' }}>
            Broad portfolio style categorization.
          </p>
        </div>

        {/* Custom Alt Prefix */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '6px',
              color: 'var(--theme-elevation-700)',
            }}
          >
            Alt / Caption Prefix (Optional)
          </label>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="e.g. Bridal Mehndi Collection 2026"
            disabled={isUploading}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--theme-elevation-250)',
              backgroundColor: 'var(--theme-elevation-0)',
              color: 'var(--theme-elevation-800)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <p style={{ fontSize: '12px', color: 'var(--theme-elevation-450)', margin: '4px 0 0 0' }}>
            Descriptive alt text for SEO and accessibility.
          </p>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? '#2563eb' : 'var(--theme-elevation-300)'}`,
          backgroundColor: isDragging ? 'rgba(37, 99, 235, 0.05)' : 'var(--theme-elevation-50)',
          borderRadius: '16px',
          padding: '36px 20px',
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: '24px',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={isUploading}
          style={{ display: 'none' }}
        />
        <div style={{ fontSize: '38px', marginBottom: '10px' }}>📁</div>
        <h3
          style={{
            fontSize: '17px',
            fontWeight: 600,
            margin: '0 0 6px 0',
            color: 'var(--theme-elevation-800)',
          }}
        >
          {isDragging
            ? 'Drop your images here'
            : 'Tap here or Drag & Drop Multiple Photos'}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', margin: 0 }}>
          Select multiple photos at once. JPEG, PNG, WebP, GIF, AVIF, HEIC supported.
        </p>
      </div>

      {/* Upload Progress Bar */}
      {isUploading && (
        <div
          style={{
            marginBottom: '24px',
            backgroundColor: 'var(--theme-elevation-50)',
            padding: '16px',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <span>Uploading &amp; optimizing photos...</span>
            <span>
              {uploadProgress.current} of {uploadProgress.total} completed
            </span>
          </div>
          <div
            style={{
              height: '8px',
              backgroundColor: 'var(--theme-elevation-200)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: '#2563eb',
                width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Selected Images Grid & Actions */}
      {files.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              gap: '12px',
            }}
          >
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 600,
                margin: 0,
                color: 'var(--theme-elevation-800)',
              }}
            >
              Selected Images ({files.length})
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={clearAllFiles}
                disabled={isUploading}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--theme-elevation-250)',
                  backgroundColor: 'transparent',
                  color: 'var(--theme-elevation-600)',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || files.every((f) => f.status === 'success')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  cursor:
                    isUploading || files.every((f) => f.status === 'success')
                      ? 'not-allowed'
                      : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  opacity: isUploading || files.every((f) => f.status === 'success') ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isUploading ? `Uploading (${uploadProgress.current}/${uploadProgress.total})...` : `Upload All ${files.length} Photos 🚀`}
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '12px',
            }}
          >
            {files.map((item) => (
              <div
                key={item.id}
                style={{
                  position: 'relative',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: `1px solid ${
                    item.status === 'success'
                      ? '#10b981'
                      : item.status === 'error'
                        ? '#ef4444'
                        : 'var(--theme-elevation-200)'
                  }`,
                  backgroundColor: 'var(--theme-elevation-50)',
                  aspectRatio: '1 / 1',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.preview}
                  alt={item.file.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Status Overlay */}
                {item.status === 'uploading' && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.55)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    Uploading...
                  </div>
                )}
                {item.status === 'success' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </div>
                )}
                {item.status === 'error' && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(239, 68, 68, 0.85)',
                      color: 'white',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      fontSize: '10px',
                    }}
                  >
                    {item.error || 'Failed'}
                  </div>
                )}

                {/* Remove Button */}
                {item.status !== 'uploading' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(item.id)
                    }}
                    title="Remove from batch"
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      backgroundColor: 'rgba(0, 0, 0, 0.65)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                )}

                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    padding: '3px 5px',
                    fontSize: '9px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.file.name} ({(item.file.size / 1024 / 1024).toFixed(1)}MB)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
