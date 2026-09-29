/**
 * Structured Artist Bio component and parser.
 * Converts plain-text artist bios (with headers, bullet points, celebrity work, and value props)
 * into an engaging, structured visual presentation.
 *
 * Importers/Callers: `src/app/(frontend)/artists/[slug]/page.tsx`.
 * Affected APIs: Next.js App Router artist profile page.
 * Schemas: `artists` collection (`bio` field).
 * User instruction: "see this artist bio https://www.artistora.com/artists/rr-s-makeovers-114 the bio does look like paragrpah it should be well structure what we can do aboout it?"
 */

import React from 'react'

export interface BioSection {
  title: string
  type: 'highlights' | 'features' | 'experience' | 'general'
  items: string[]
  paragraphs: string[]
}

export interface ParsedBio {
  intro: string[]
  sections: BioSection[]
  closing: { title?: string; subtitle?: string } | null
  isStructured: boolean
  raw: string
}

/**
 * Intelligent parser that extracts narrative intros, celebrity & industry highlights,
 * why choose features, and closing signatures from plain-text artist bios.
 */
export function parseStructuredBio(bio: string): ParsedBio {
  if (!bio || !bio.trim()) {
    return { intro: [], sections: [], closing: null, isStructured: false, raw: '' }
  }

  const cleanBio = bio.trim()
  const rawBlocks = cleanBio
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean)

  const isHeader = (line: string): boolean => {
    const trimmed = line.trim()
    if (trimmed.length > 90) return false
    if (trimmed.endsWith(':') || trimmed.endsWith('?')) return true
    if (
      /^(✨|🎬|🏆|🌟|👑|📸|🎨|💼)\s+(Celebrity|Industry|Web Series|Film|Work|Experience|Projects|Portfolio|Awards)/i.test(
        trimmed,
      )
    )
      return true
    if (
      /^(Why Choose|About|Highlights|Experience|Celebrity|Services & Specialities|Specializations|Work Includes|Key Highlights)/i.test(
        trimmed,
      )
    )
      return true
    return false
  }

  const isBullet = (line: string): boolean => {
    const trimmed = line.trim()
    return /^([•\-*]|💄|💇‍♀️|💇|✨|🧴|💎|❤️|🎬|🏆|🌟|👑|📸|🎨|💼|💡|🎯|🔹|👉|✅|✔️)\s*/.test(trimmed)
  }

  const cleanBullet = (line: string): string => {
    return line
      .replace(/^([•\-*]|💄|💇‍♀️|💇|✨|🧴|💎|❤️|🎬|🏆|🌟|👑|📸|🎨|💼|💡|🎯|🔹|👉|✅|✔️)\s*/, '')
      .trim()
  }

  const intro: string[] = []
  const sections: BioSection[] = []
  let closing: { title?: string; subtitle?: string } | null = null

  let currentSection: BioSection | null = null
  let hasMetFirstHeader = false

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i]
    const lines = block
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length === 0) continue
    const firstLine = lines[0]

    // Check for closing signature block at the very end
    if (
      i >= rawBlocks.length - 2 &&
      lines.length <= 2 &&
      (block.toLowerCase().includes('elegance') ||
        block.toLowerCase().includes('confidence') ||
        block.includes('–') ||
        block.includes('—')) &&
      !isHeader(firstLine)
    ) {
      if (lines.length === 2) {
        closing = { title: lines[0].replace(/^[✨🌟💎\s]+/, ''), subtitle: lines[1] }
        continue
      }
    }

    if (isHeader(firstLine)) {
      hasMetFirstHeader = true
      if (currentSection) {
        sections.push(currentSection)
      }

      let secType: BioSection['type'] = 'general'
      const titleLower = firstLine.toLowerCase()
      if (
        titleLower.includes('celebrity') ||
        titleLower.includes('work includes') ||
        titleLower.includes('client') ||
        titleLower.includes('notable')
      ) {
        secType = 'highlights'
      } else if (
        titleLower.includes('why choose') ||
        titleLower.includes('feature') ||
        titleLower.includes('reason') ||
        titleLower.includes('guarantee')
      ) {
        secType = 'features'
      } else if (
        titleLower.includes('experience') ||
        titleLower.includes('series') ||
        titleLower.includes('film') ||
        titleLower.includes('shoot')
      ) {
        secType = 'experience'
      }

      currentSection = {
        title: firstLine.replace(/[:?]+$/, '').trim(),
        type: secType,
        items: [],
        paragraphs: [],
      }

      const remainingLines = lines.slice(1)
      for (const line of remainingLines) {
        if (isBullet(line)) {
          currentSection.items.push(cleanBullet(line))
        } else {
          currentSection.paragraphs.push(line)
        }
      }
    } else if (!hasMetFirstHeader) {
      intro.push(block)
    } else if (currentSection) {
      const hasBullets = lines.some((l) => isBullet(l))
      const allShort = lines.every((l) => l.length < 85)

      if (hasBullets || (allShort && currentSection.type === 'highlights')) {
        for (const line of lines) {
          currentSection.items.push(cleanBullet(line))
        }
      } else {
        currentSection.paragraphs.push(block)
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection)
  }

  const isStructured = sections.length > 0 || intro.length > 1 || Boolean(closing)

  return {
    intro,
    sections,
    closing,
    isStructured,
    raw: bio,
  }
}

interface StructuredArtistBioProps {
  bio: string
  artistName: string
  yearsOfExperience?: number
  city?: string
}

export default function StructuredArtistBio({
  bio,
  artistName,
  yearsOfExperience,
  city,
}: StructuredArtistBioProps) {
  const parsed = parseStructuredBio(bio)

  if (!bio || !bio.trim()) return null

  return (
    <div className="flex flex-col gap-8!">
      {/* ── Intro Story / Narrative ── */}
      {parsed.intro.length > 0 && (
        <div className="flex flex-col gap-4!">
          {parsed.intro.map((p, idx) => (
            <p
              key={idx}
              className={`leading-relaxed text-ink-soft ${
                idx === 0
                  ? 'text-base! font-medium text-ink md:text-lg!'
                  : 'text-[0.95rem] md:text-base!'
              }`}
            >
              {p}
            </p>
          ))}
        </div>
      )}

      {/* ── Structured Sections Grid ── */}
      {parsed.sections.length > 0 && (
        <div className="flex flex-col gap-6!">
          {parsed.sections.map((sec, idx) => {
            if (sec.type === 'highlights') {
              return (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/5 via-cream/40 to-white p-6! shadow-soft md:p-8!"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2! border-b border-gold/20 pb-4! mb-5!">
                    <div className="flex items-center gap-2.5!">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/20 text-gold-deep shadow-xs">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </span>
                      <h3 className="font-display text-lg! font-semibold text-ink md:text-xl!">
                        {sec.title}
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1! rounded-full bg-gold/15 px-3! py-1! text-xs font-semibold text-gold-deep">
                      VIP & Celebrity Spotlight
                    </span>
                  </div>

                  {sec.paragraphs.length > 0 && (
                    <div className="mb-4! flex flex-col gap-2!">
                      {sec.paragraphs.map((p, pIdx) => (
                        <p key={pIdx} className="text-sm leading-relaxed text-ink-soft">
                          {p}
                        </p>
                      ))}
                    </div>
                  )}

                  {sec.items.length > 0 && (
                    <div className="grid gap-3! sm:grid-cols-2">
                      {sec.items.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="flex items-start gap-3! rounded-2xl border border-gold/20 bg-white/90 p-3.5! shadow-xs transition-all duration-200 hover:border-gold/50 hover:bg-white hover:shadow-soft"
                        >
                          <span className="mt-0.5! flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold-deep">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </span>
                          <span className="text-sm font-medium text-ink">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            if (sec.type === 'experience') {
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-brand/20 bg-gradient-to-br from-brand/5 via-white to-cream/20 p-6! shadow-soft md:p-8!"
                >
                  <div className="flex items-center gap-2.5! border-b border-brand/10 pb-4! mb-4!">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-brand-deep shadow-xs">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                        <line x1="7" y1="2" x2="7" y2="22" />
                        <line x1="17" y1="2" x2="17" y2="22" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <line x1="2" y1="7" x2="7" y2="7" />
                        <line x1="2" y1="17" x2="7" y2="17" />
                        <line x1="17" y1="17" x2="22" y2="17" />
                        <line x1="17" y1="7" x2="22" y2="7" />
                      </svg>
                    </span>
                    <h3 className="font-display text-lg! font-semibold text-ink md:text-xl!">
                      {sec.title}
                    </h3>
                  </div>

                  <div className="flex flex-col gap-3!">
                    {sec.paragraphs.map((p, pIdx) => (
                      <p
                        key={pIdx}
                        className="text-sm leading-relaxed text-ink-soft md:text-[0.95rem]"
                      >
                        {p}
                      </p>
                    ))}
                  </div>

                  {sec.items.length > 0 && (
                    <ul className="mt-4! flex flex-col gap-2.5!">
                      {sec.items.map((item, itemIdx) => (
                        <li
                          key={itemIdx}
                          className="flex items-start gap-2.5! text-sm font-medium text-ink"
                        >
                          <span className="mt-1! h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            }

            if (sec.type === 'features') {
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-line bg-white p-6! shadow-soft md:p-8!"
                >
                  <div className="flex items-center gap-2.5! border-b border-line pb-4! mb-5!">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand shadow-xs">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </span>
                    <h3 className="font-display text-lg! font-semibold text-ink md:text-xl!">
                      {sec.title}
                    </h3>
                  </div>

                  {sec.paragraphs.length > 0 && (
                    <div className="mb-5! flex flex-col gap-3!">
                      {sec.paragraphs.map((p, pIdx) => (
                        <p
                          key={pIdx}
                          className="text-sm leading-relaxed text-ink-soft md:text-[0.95rem]"
                        >
                          {p}
                        </p>
                      ))}
                    </div>
                  )}

                  {sec.items.length > 0 && (
                    <div className="grid gap-3! sm:grid-cols-2 lg:grid-cols-3">
                      {sec.items.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="flex items-center gap-2.5! rounded-2xl border border-line bg-cream/40 px-4! py-3! text-sm font-medium text-ink shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-white hover:shadow-soft"
                        >
                          <svg
                            className="h-4 w-4 shrink-0 text-gold"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            // General section fallback
            return (
              <div
                key={idx}
                className="rounded-3xl border border-line bg-white p-6! shadow-soft md:p-8!"
              >
                <h3 className="font-display text-lg! font-semibold text-ink md:text-xl! border-b border-line pb-4! mb-4!">
                  {sec.title}
                </h3>
                <div className="flex flex-col gap-3!">
                  {sec.paragraphs.map((p, pIdx) => (
                    <p
                      key={pIdx}
                      className="text-sm leading-relaxed text-ink-soft md:text-[0.95rem]"
                    >
                      {p}
                    </p>
                  ))}
                </div>
                {sec.items.length > 0 && (
                  <ul className="mt-4! grid gap-2! sm:grid-cols-2">
                    {sec.items.map((item, itemIdx) => (
                      <li
                        key={itemIdx}
                        className="flex items-center gap-2! text-sm font-medium text-ink"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Closing Signature / Brand Promise Quote ── */}
      {parsed.closing && (
        <div className="relative overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-r from-gold/10 via-cream to-gold/10 p-6! text-center shadow-xs md:p-7!">
          <div className="mx-auto max-w-xl!">
            <svg
              className="mx-auto mb-2! h-6 w-6 text-gold/60"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            {parsed.closing.title && (
              <p className="font-display text-base! font-bold text-brand-deep md:text-lg!">
                {parsed.closing.title}
              </p>
            )}
            {parsed.closing.subtitle && (
              <p className="mt-1! text-sm italic text-ink-soft md:text-[0.95rem]">
                &ldquo;{parsed.closing.subtitle}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
