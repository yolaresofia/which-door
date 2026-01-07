// app/contact/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import ContactSection from '../components/ContactSection'
import { useFadeOutNavigation } from '../utils/useFadeOutNavigation'

export default function ContactPage() {
  // Initialize with actual value on client, false on server (will update after hydration)
  const getInitialMobileState = () => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 1024
  }
  const [isMobile, setIsMobile] = useState(getInitialMobileState)
  const mainRef = useRef<HTMLDivElement | null>(null)

  // Use the reusable fade-out navigation hook
  const { fadeOutAndNavigate, isNavigating } = useFadeOutNavigation(mainRef, {
    selector: '[data-reveal]',
    isMobile,
    saveVideo: false, // Contact page doesn't use video state
  })

  const bg = 'https://cdn.sanity.io/files/xerhtqd5/production/9cc8bf80015193aee2f4b09680e07288927485b5.mp4'
  const previewPoster = 'https://cdn.sanity.io/images/xerhtqd5/production/8e56015f1f0daa6cb7dfaeee8a476dde49013404-2832x1576.jpg'
  const mobilePreviewUrl = 'https://cdn.sanity.io/files/xerhtqd5/production/d239a71d8aa67fb9958528cf01e29451e3787e47.mp4'

  // Detect mobile - sets actual value after hydration
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Expose fade-out function globally for header navigation
  useGSAP(() => {
    if (isMobile) return

    // Make fade-out function available globally
    ;(window as any).__contactFadeOut = fadeOutAndNavigate

    return () => {
      delete (window as any).__contactFadeOut
    }
  }, { dependencies: [isMobile, fadeOutAndNavigate] })

  return (
    <div ref={mainRef} className="min-h-screen bg-black">
      <ContactSection
        previewUrl={bg}
        mobilePreviewUrl={mobilePreviewUrl}
        previewPoster={previewPoster}
        enableAnimations={!isMobile}
      />
    </div>
  )
}
