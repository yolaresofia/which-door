'use client'

import { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react'
import BackgroundMedia from '../components/BackgroundMedia/BackgroundMedia'
import { useSequencedReveal } from '../utils/useSequencedReveal'
import { usePageTransitionVideo } from '../utils/usePageTransitionVideo'
import { useCrossfadeMedia } from '../utils/useCrossfadeMedia'
import { useFadeOutNavigation } from '../utils/useFadeOutNavigation'
import { useVideoReady } from '../utils/useVideoReady'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

const bg =
  'https://cdn.sanity.io/files/xerhtqd5/production/fd65929092659391a7ab01598986142c310343da.mp4'
const previewPoster =
  'https://cdn.sanity.io/images/xerhtqd5/production/5545ae57d11b58790ec87eecc368987ef1d095ac-3024x1596.jpg'
const mobilePreviewUrl = 'https://cdn.sanity.io/files/xerhtqd5/production/fd65929092659391a7ab01598986142c310343da.mp4'

export default function AboutPage() {
  const { getPreviousVideoState } = usePageTransitionVideo()

  const [isMobile, setIsMobile] = useState(false)

  const contentRef = useRef<HTMLElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const hasTransitionedRef = useRef(false)
  const hasAnimatedRef = useRef(false)

  const { isReady: videoReady, markReady } = useVideoReady({
    skip: isMobile,
    timeout: 3000,
  })

  // Use the reusable fade-out navigation hook
  const { fadeOutAndNavigate, isNavigating } = useFadeOutNavigation(mainRef, {
    selector: '[data-reveal]',
    isMobile,
    saveVideo: true,
  })

  const targetVideo = useMemo(() => ({
    id: 'about',
    videoSrc: bg,
    previewUrl: bg,
    mobilePreviewUrl: mobilePreviewUrl,
    previewPoster: previewPoster,
    bgColor: '#000',
  }), [])

  // Check for previous video state to determine initial state
  const previousVideo = getPreviousVideoState()
  const initialVideo = previousVideo || targetVideo

  const { setSlotRef, slotMedia, crossfadeTo } = useCrossfadeMedia(initialVideo, { duration: 0.6 })

  // Desktop animation - simple opacity fade (no slide)
  const { start } = useSequencedReveal(contentRef, {
    target: '[data-reveal]',
    duration: 1,
    ease: 'power2.out',
    from: { opacity: 0 },
    to: { opacity: 1 },
    autoStart: false,
    stagger: 0,
  })

  // Handle incoming page transition video
  useEffect(() => {
    if (hasTransitionedRef.current || !previousVideo || isMobile) return
    hasTransitionedRef.current = true

    // Crossfade from previous video to about page video after a brief delay
    const timeoutId = setTimeout(() => {
      crossfadeTo(targetVideo)
    }, 400)

    return () => clearTimeout(timeoutId)
  }, [isMobile, previousVideo, crossfadeTo, targetVideo])

  // Detect mobile - EXACT SAME as ProjectsLanding
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // CRITICAL: Hide content immediately on mount using useLayoutEffect
  // This runs synchronously before browser paint to prevent FOUC
  useLayoutEffect(() => {
    if (!contentRef.current) return
    const items = contentRef.current.querySelectorAll('[data-reveal]')
    gsap.set(items, { opacity: 0 })
  }, []) // Empty deps - run once on mount

  // Single animation trigger — waits for video on desktop, immediate on mobile
  useEffect(() => {
    if (hasAnimatedRef.current) return
    if (!contentRef.current) return

    // Desktop: wait for video ready
    if (!isMobile && !videoReady) return

    hasAnimatedRef.current = true

    if (isMobile) {
      const items = contentRef.current.querySelectorAll('[data-reveal]')
      if (items.length > 0) {
        gsap.set(items, { opacity: 0 })
        gsap.to(items, {
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
        })
      }
    } else {
      requestAnimationFrame(() => {
        start()
      })
    }
  }, [isMobile, videoReady, start])

  // Expose fade-out function globally for header navigation
  useGSAP(() => {
    if (isMobile) return

    const handleFadeOutAndNavigate = (url: string) => {
      fadeOutAndNavigate(url, slotMedia)
    }

    // Make fade-out function available globally
    (window as any).__aboutFadeOut = handleFadeOutAndNavigate

    return () => {
      delete (window as any).__aboutFadeOut
    }
  }, { dependencies: [isMobile, slotMedia, fadeOutAndNavigate] })

  return (
    <main
      ref={mainRef}
      className="relative min-h-screen w-full overflow-hidden text-white flex items-center justify-center md:block"
    >
      {/* Background Video - Dual slot system for crossfade */}
      <div className="fixed inset-0 z-0 bg-black">
        <div
          ref={(el) => {
            setSlotRef(0)(el)
          }}
          className="absolute inset-0"
          style={{ pointerEvents: 'none' }}
        >
          {slotMedia[0] && (
            <BackgroundMedia
              variant="preview"
              previewUrl={slotMedia[0].previewUrl ?? slotMedia[0].videoSrc}
              mobilePreviewUrl={slotMedia[0].mobilePreviewUrl}
              vimeoUrl={slotMedia[0].vimeoUrl}
              previewPoster={slotMedia[0].previewPoster}
              bgColor={slotMedia[0].bgColor}
              onVideoReady={markReady}
            />
          )}
        </div>
        <div
          ref={(el) => {
            setSlotRef(1)(el)
          }}
          className="absolute inset-0"
          style={{ pointerEvents: 'none' }}
        >
          {slotMedia[1] && (
            <BackgroundMedia
              variant="preview"
              previewUrl={slotMedia[1].previewUrl ?? slotMedia[1].videoSrc}
              mobilePreviewUrl={slotMedia[1].mobilePreviewUrl}
              vimeoUrl={slotMedia[1].vimeoUrl}
              previewPoster={slotMedia[1].previewPoster}
              bgColor={slotMedia[1].bgColor}
            />
          )}
        </div>
      </div>
      
      {/* Content with animation - EXACT SAME structure as ProjectsLanding */}
      <section
        ref={contentRef}
        className="relative z-10 mx-auto w-full px-6 md:px-12 pt-0 md:pt-32"
      >
        <div
          data-reveal
          style={{ opacity: 0 }}
        >
          <p
            className="text-lg md:text-2xl leading-5 md:leading-7 md:text-left"
          >
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
