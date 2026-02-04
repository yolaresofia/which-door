// app/contact/page.tsx
'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useBackgroundMedia, type Media } from '../context/BackgroundMediaContext'
import ContactSection from '../components/ContactSection'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const bg =
  'https://cdn.sanity.io/files/xerhtqd5/production/9cc8bf80015193aee2f4b09680e07288927485b5.mp4'
const previewPoster =
  'https://cdn.sanity.io/images/xerhtqd5/production/8e56015f1f0daa6cb7dfaeee8a476dde49013404-2832x1576.jpg'
const mobilePreviewUrl =
  'https://cdn.sanity.io/files/xerhtqd5/production/d239a71d8aa67fb9958528cf01e29451e3787e47.mp4'

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  const { setBackground } = useBackgroundMedia()
  const hasSetInitialBgRef = useRef(false)

  const contactMedia: Media = useMemo(
    () => ({
      id: 'contact',
      videoSrc: bg,
      previewUrl: bg,
      mobilePreviewUrl: mobilePreviewUrl,
      previewPoster: previewPoster,
      bgColor: '#000',
    }),
    []
  )

  // Set background on mount
  useEffect(() => {
    if (hasSetInitialBgRef.current) return
    hasSetInitialBgRef.current = true
    setBackground(contactMedia)
  }, [contactMedia, setBackground])

  return (
    <div className="min-h-dvh bg-black">
      {/* ContactSection now uses global background - pass useGlobalBackground to skip local bg */}
      <ContactSection useGlobalBackground />
    </div>
  )
}
