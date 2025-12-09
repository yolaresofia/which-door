// app/directors/[slug]/page.tsx
'use client'

import { use, useEffect, useRef, useState, useMemo } from 'react'
import { notFound } from 'next/navigation'
import DetailView from '@/app/components/DetailView'
import { directors, projects } from '@/app/components/constants'
import { useSequencedReveal } from '@/app/utils/useSequencedReveal'
import { usePageTransitionVideo } from '@/app/utils/usePageTransitionVideo'
import { useCrossfadeMedia } from '@/app/utils/useCrossfadeMedia'
import { useFadeOutNavigation } from '@/app/utils/useFadeOutNavigation'
import BackgroundMedia from '@/app/components/BackgroundMedia/BackgroundMedia'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

export default function DirectorPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = use(params)
  const { getPreviousVideoState } = usePageTransitionVideo()

  const [fontLoaded, setFontLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const contentRef = useRef<HTMLElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const hasTransitionedRef = useRef(false)

  // Use the reusable fade-out navigation hook
  const { fadeOutAndNavigate, isNavigating } = useFadeOutNavigation(mainRef, {
    selector: '[data-reveal]',
    isMobile,
    saveVideo: true,
  })

  const item = useMemo(() => directors.find((d) => d.slug === slug), [slug])

  const itemWithLinks = useMemo(() => {
    if (!item) return null

    const slugify = (value: string) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

    const otherProjects = item.otherProjects?.map((proj) => {
      if (proj.url) return proj
      const match =
        projects.find((p) => p.name.toLowerCase() === proj.title.toLowerCase()) ||
        projects.find((p) => p.slug === slugify(proj.title))

      return {...proj, url: match ? `/projects/${match.slug}` : undefined}
    })

    return {...item, otherProjects}
  }, [item])

  const targetVideo = useMemo(() => ({
    id: itemWithLinks?.slug ?? slug,
    videoSrc: itemWithLinks?.previewUrl ?? '',
    previewUrl: itemWithLinks?.previewUrl ?? '',
    previewPoster: itemWithLinks?.previewPoster,
    bgColor: '#477AA1',
  }), [itemWithLinks, slug])

  // Check for previous video state to determine initial state
  const previousVideo = getPreviousVideoState()
  const initialVideo = previousVideo || targetVideo

  const { setSlotRef, slotMedia, crossfadeTo } = useCrossfadeMedia(initialVideo, { duration: 0.6 })

  // Enter animation
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
      ease: 'power2.inOut'
    },
  })

  // Handle incoming page transition video
  useEffect(() => {
    if (hasTransitionedRef.current || !previousVideo || isMobile) return

    hasTransitionedRef.current = true

    // Crossfade from previous video to director video after a brief delay
    const timeoutId = setTimeout(() => {
      crossfadeTo(targetVideo)
    }, 400)

    return () => clearTimeout(timeoutId)
  }, [isMobile, previousVideo, crossfadeTo, targetVideo])

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Hide content initially to prevent FOUC
  useGSAP(() => {
    if (!contentRef.current || isMobile) return

    // Set initial hidden state before animation
    const items = contentRef.current.querySelectorAll('[data-reveal]')
    gsap.set(items, { opacity: 0, y: 20, scale: 0.98 })
  }, { dependencies: [isMobile], scope: contentRef })

  // Font loading + trigger enter animation
  useEffect(() => {
    // Only run on desktop
    if (isMobile) return
    if (fontLoaded) return // Prevent re-running

    let cancelled = false
    let timeoutId: NodeJS.Timeout

    const triggerAnimation = () => {
      if (cancelled) return
      setFontLoaded(true)
      // Start with RAF to ensure DOM is ready
      requestAnimationFrame(() => {
        start()
      })
    }

    // Simplified font loading that works in production
    if (typeof window !== 'undefined' && 'fonts' in document) {
      const fonts = (document as any).fonts
      if (fonts?.ready) {
        fonts.ready.then(() => {
          // Try to load the font, but don't wait forever
          Promise.race([
            fonts.load('normal 1em Neue').catch(() => null),
            new Promise(resolve => setTimeout(resolve, 500))
          ]).then(() => {
            if (!cancelled) triggerAnimation()
          })
        }).catch(() => {
          // If fonts.ready fails, fallback to timeout
          if (!cancelled) timeoutId = setTimeout(triggerAnimation, 100)
        })
      } else {
        timeoutId = setTimeout(triggerAnimation, 100)
      }
    } else {
      timeoutId = setTimeout(triggerAnimation, 100)
    }

    // Safety timeout to ensure animation always runs
    const safetyTimeout = setTimeout(() => {
      if (!cancelled && !fontLoaded) {
        triggerAnimation()
      }
    }, 1000)

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
      clearTimeout(safetyTimeout)
    }
  }, [start, fontLoaded, isMobile])

  // Handle navigation from other pages (like clicking back to directors list)
  useEffect(() => {
    if (isMobile) return

    const handleFadeOutAndNavigate = (url: string) => {
      fadeOutAndNavigate(url, slotMedia)
    }

    // Custom event listener for navigation from anywhere
    const handleNavigationRequest = (e: CustomEvent) => {
      const url = e.detail?.url
      if (url && !isNavigating) {
        handleFadeOutAndNavigate(url)
      }
    }

    window.addEventListener('navigate-with-fade' as any, handleNavigationRequest as any)

    return () => {
      window.removeEventListener('navigate-with-fade' as any, handleNavigationRequest as any)
    }
  }, [isMobile, isNavigating, slotMedia, fadeOutAndNavigate])

  // Expose fade-out function globally for header navigation
  useGSAP(() => {
    if (isMobile) return

    const handleFadeOutAndNavigate = (url: string) => {
      fadeOutAndNavigate(url, slotMedia)
    }

    // Make fade-out function available globally
    (window as any).__directorDetailFadeOut = handleFadeOutAndNavigate

    return () => {
      delete (window as any).__directorDetailFadeOut
    }
  }, { dependencies: [isMobile, slotMedia, fadeOutAndNavigate] })

  // Check if item exists after all hooks have been called
  if (!itemWithLinks) {
    return notFound()
  }

  return (
    <main
      ref={mainRef}
      className="relative min-h-screen w-full overflow-hidden text-white"
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
              vimeoUrl={slotMedia[0].vimeoUrl}
              previewPoster={slotMedia[0].previewPoster}
              bgColor={slotMedia[0].bgColor}
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
              vimeoUrl={slotMedia[1].vimeoUrl}
              previewPoster={slotMedia[1].previewPoster}
              bgColor={slotMedia[1].bgColor}
            />
          )}
        </div>
      </div>

      {/* Content with animation */}
      <section
      ref={contentRef}
      className="relative z-10"
    >
      <DetailView item={itemWithLinks} enableAnimations={true} />
    </section>
  </main>
)
}
