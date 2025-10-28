// app/contact/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ContactSection from '../components/ContactSection'
import { gsap } from 'gsap'

export default function ContactPage() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const mainRef = useRef<HTMLDivElement | null>(null)

  const bg = 'https://cdn.sanity.io/files/xerhtqd5/production/5068305fa81bd755e7c0dd4f119c8e2b995a8813.mp4'
  const previewPoster = 'https://cdn.sanity.io/images/xerhtqd5/production/99945ce01a04899a2742da8865740039d7513b57-3024x1964.png'

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fade-out animation function - EXACT SAME as ProjectsLanding
  const fadeOutAndNavigate = useCallback((url: string) => {
    if (isNavigating || isMobile) return

    console.log('🎬 Contact: Starting fade-out animation...')
    setIsNavigating(true)

    // Disable pointer events during animation
    if (mainRef.current) {
      mainRef.current.style.pointerEvents = 'none'
    }

    // Find all elements with data-reveal in the contact section
    const items = document.querySelectorAll('[data-reveal]')

    console.log('🎬 Contact: Found items to animate:', items.length)

    if (items.length === 0) {
      console.warn('⚠️ Contact: No items found with [data-reveal], navigating immediately')
      router.push(url)
      return
    }

    // Create the animation
    gsap.to(items, {
      opacity: 0,
      y: -30,
      scale: 0.92,
      duration: 0.7,
      ease: 'power2.in',
      stagger: {
        each: 0.05,
        from: 'start'
      },
      onStart: () => {
        console.log('▶️ Contact: Animation started')
      },
      onComplete: () => {
        console.log('✅ Contact: Animation complete, navigating to:', url)
        // Small safety delay to ensure animation is fully visible
        setTimeout(() => {
          router.push(url)
        }, 50)
      }
    })
  }, [isNavigating, isMobile, router])

  // Expose fade-out function globally for header navigation
  useEffect(() => {
    if (isMobile) return

    // Make fade-out function available globally
    ;(window as any).__contactFadeOut = fadeOutAndNavigate

    return () => {
      console.log('🔧 Contact: Cleaning up __contactFadeOut function')
      delete (window as any).__contactFadeOut
    }
  }, [isMobile, fadeOutAndNavigate])

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
