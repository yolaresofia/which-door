'use client'

import { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react'
import { useBackgroundMedia, type Media } from '../context/BackgroundMediaContext'
import { useSequencedReveal } from '../utils/useSequencedReveal'
import { useFadeOutNavigation } from '../utils/useFadeOutNavigation'
import { REVEAL_HIDDEN_STYLE } from '../utils/useRevealAnimation'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const bg =
  'https://cdn.sanity.io/files/xerhtqd5/production/fd65929092659391a7ab01598986142c310343da.mp4'
const previewPoster =
  'https://cdn.sanity.io/images/xerhtqd5/production/5545ae57d11b58790ec87eecc368987ef1d095ac-3024x1596.jpg'
const mobilePreviewUrl =
  'https://cdn.sanity.io/files/xerhtqd5/production/fd65929092659391a7ab01598986142c310343da.mp4'

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const { setBackground } = useBackgroundMedia()

  // ─────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────
  const [fontLoaded, setFontLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // ─────────────────────────────────────────────────────────────
  // REFS
  // ─────────────────────────────────────────────────────────────
  const contentRef = useRef<HTMLElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const hasSetInitialBgRef = useRef(false)

  // ─────────────────────────────────────────────────────────────
  // ABOUT PAGE MEDIA
  // ─────────────────────────────────────────────────────────────
  const aboutMedia: Media = useMemo(
    () => ({
      id: 'about',
      videoSrc: bg,
      previewUrl: bg,
      mobilePreviewUrl: mobilePreviewUrl,
      previewPoster: previewPoster,
      bgColor: '#000',
    }),
    []
  )

  // ─────────────────────────────────────────────────────────────
  // FADE-OUT NAVIGATION
  // ─────────────────────────────────────────────────────────────
  const { fadeOutAndNavigate } = useFadeOutNavigation(mainRef, {
    selector: '[data-reveal]',
    isMobile,
    saveVideo: false, // No longer needed - global background persists
  })

  // ─────────────────────────────────────────────────────────────
  // SET BACKGROUND ON MOUNT
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasSetInitialBgRef.current) return
    hasSetInitialBgRef.current = true

    setBackground(aboutMedia)
  }, [aboutMedia, setBackground])

  // ─────────────────────────────────────────────────────────────
  // DESKTOP REVEAL ANIMATION
  // ─────────────────────────────────────────────────────────────
  const { start } = useSequencedReveal(contentRef, {
    target: '[data-reveal]',
    duration: 0.8,
    ease: 'power2.out',
    from: { opacity: 0, y: 20, scale: 0.98 },
    to: { opacity: 1, y: 0, scale: 1 },
    autoStart: false,
    stagger: {
      each: 0.08,
      from: 'start',
      ease: 'power2.inOut',
    },
  })

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Hide content immediately on mount (prevent FOUC)
  useLayoutEffect(() => {
    if (!contentRef.current) return
    const items = contentRef.current.querySelectorAll('[data-reveal]')
    gsap.set(items, { opacity: 0, y: 20, scale: 0.98 })
  }, [])

  // Mobile animation
  useEffect(() => {
    if (!isMobile || !contentRef.current) return

    const timeoutId = setTimeout(() => {
      const items = contentRef.current?.querySelectorAll('[data-reveal]')
      if (items && items.length > 0) {
        gsap.set(items, { opacity: 0, y: 20 })
        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          stagger: { each: 0.08, from: 'start' },
        })
      }
    }, 50)

    return () => clearTimeout(timeoutId)
  }, [isMobile])

  // Font loading + animation trigger (desktop)
  useEffect(() => {
    if (isMobile) return
    if (fontLoaded) return

    let cancelled = false
    let timeoutId: NodeJS.Timeout

    const triggerAnimation = () => {
      if (cancelled) return
      setFontLoaded(true)
      requestAnimationFrame(() => start())
    }

    if (typeof window !== 'undefined' && 'fonts' in document) {
      const fonts = (document as any).fonts
      if (fonts?.ready) {
        fonts.ready
          .then(() => {
            Promise.race([
              fonts.load('normal 1em Neue').catch(() => null),
              new Promise((resolve) => setTimeout(resolve, 500)),
            ]).then(() => {
              if (!cancelled) triggerAnimation()
            })
          })
          .catch(() => {
            if (!cancelled) timeoutId = setTimeout(triggerAnimation, 100)
          })
      } else {
        timeoutId = setTimeout(triggerAnimation, 100)
      }
    } else {
      timeoutId = setTimeout(triggerAnimation, 100)
    }

    const safetyTimeout = setTimeout(() => {
      if (!cancelled && !fontLoaded) triggerAnimation()
    }, 1000)

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
      clearTimeout(safetyTimeout)
    }
  }, [start, fontLoaded, isMobile])

  // Expose fade-out for header navigation
  useGSAP(() => {
    if (isMobile) return
    ;(window as any).__aboutFadeOut = fadeOutAndNavigate
    return () => {
      delete (window as any).__aboutFadeOut
    }
  }, { dependencies: [isMobile, fadeOutAndNavigate] })

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <main
      ref={mainRef}
      className="relative min-h-screen w-full overflow-hidden text-white flex items-center justify-center md:block"
    >
      {/* NO local background - uses GlobalBackgroundMedia from layout */}

      {/* Content */}
      <section
        ref={contentRef}
        className="relative z-10 mx-auto w-full px-6 md:px-12 pt-0 md:pt-32"
      >
        <div data-reveal style={REVEAL_HIDDEN_STYLE}>
          <p className="text-lg md:text-2xl leading-5 md:leading-7 md:text-left">
            We are a group of documentary filmmakers, war photographers, disaster relief workers, and
            climate activists that have spent the past 15 years in over 150 countries disrupting the
            aid and development industry. Humpback whale mating season in Tonga, spoken word poets in
            off strip Las Vegas, bedouin kitesurfers in the Sinai Desert, hunting lava in Iceland,
            yoga in Mogadishu. We showed the world of aid and development something different. Now
            we&apos;re here to do the same in the commercial industry. We&apos;re bringing our lens, our
            stranger than fiction TRUE stories, to the world of commercial content. Creative
            non-fiction storytelling for the commercial and branded universe. Welcome to our world.
          </p>
        </div>
      </section>
    </main>
  )
}
