// app/contact/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import ContactSection from '../components/ContactSection'
import { useFadeOutNavigation } from '../utils/useFadeOutNavigation'

export default function ContactPage() {
  const [isMobile, setIsMobile] = useState(false)
  const mainRef = useRef<HTMLDivElement | null>(null)

  // Use the reusable fade-out navigation hook
  const { fadeOutAndNavigate, isNavigating } = useFadeOutNavigation(mainRef, {
    selector: '[data-reveal]',
    isMobile,
    saveVideo: false, // Contact page doesn't use video state
  })

  const bg = 'https://cdn.sanity.io/files/xerhtqd5/production/12d55cde7d28cf86f6a7a184bd19e069e1aae2f1.mp4'
  const previewPoster = 'https://cdn.sanity.io/images/xerhtqd5/production/8e56015f1f0daa6cb7dfaeee8a476dde49013404-2832x1576.jpg'

  // Detect mobile
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
    <div ref={mainRef}>
      <ContactSection
        previewUrl={bg}
        previewPoster={previewPoster}
        enableAnimations={!isMobile}
      />
    </div>
  )
}
