// app/directors/[slug]/page.tsx
'use client'

import { use, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { notFound, useRouter } from 'next/navigation'
import DetailView from '@/app/components/DetailView'
import { directors, projects } from '@/app/components/constants'
import { useSequencedReveal } from '@/app/utils/useSequencedReveal'
import { usePageTransitionVideo } from '@/app/utils/usePageTransitionVideo'
import { useCrossfadeMedia } from '@/app/utils/useCrossfadeMedia'
import BackgroundMedia from '@/app/components/BackgroundMedia/BackgroundMedia'
import { gsap } from 'gsap'

export default function DirectorPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = use(params)
  const router = useRouter()
  const { saveVideoState, getPreviousVideoState } = usePageTransitionVideo()

  const [fontLoaded, setFontLoaded] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const contentRef = useRef<HTMLElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const animationRef = useRef<gsap.core.Tween | null>(null)
  const hasTransitionedRef = useRef(false)

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

    console.log('📹 DirectorDetail: Transitioning from previous page video')
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
  useEffect(() => {
    if (!contentRef.current || isMobile) return

    // Set initial hidden state before animation
    const items = contentRef.current.querySelectorAll('[data-reveal]')
    gsap.set(items, { opacity: 0, y: 20, scale: 0.98 })
  }, [isMobile])

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
        console.log('⏰ DirectorDetail: Safety timeout triggered, starting animation')
        triggerAnimation()
      }
    }, 1000)

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
      clearTimeout(safetyTimeout)
    }
  }, [start, fontLoaded, isMobile])

  // Fade-out animation function
  const fadeOutAndNavigate = useCallback((url: string) => {
    if (isNavigating) return

    console.log('🎬 DirectorDetail: Starting fade-out animation...')
    setIsNavigating(true)

    // Save current video state for the next page to use
    const currentMedia = slotMedia[0] || slotMedia[1]
    if (currentMedia) {
      saveVideoState({
        id: currentMedia.id,
        videoSrc: currentMedia.videoSrc || '',
        previewUrl: currentMedia.previewUrl,
        vimeoUrl: currentMedia.vimeoUrl,
        previewPoster: currentMedia.previewPoster,
        bgColor: currentMedia.bgColor,
      })
    }

    // Disable pointer events during animation
    if (mainRef.current) {
      mainRef.current.style.pointerEvents = 'none'
    }

    // Fade out content
    if (contentRef.current) {
      const items = contentRef.current.querySelectorAll('[data-reveal]')

      console.log('🎬 DirectorDetail: Found items to animate:', items.length)

      if (items.length === 0) {
        console.warn('⚠️ DirectorDetail: No items found with [data-reveal], navigating immediately')
        router.push(url)
        return
      }

      // Kill any existing animation
      if (animationRef.current) {
        animationRef.current.kill()
      }

      // Create the animation
      animationRef.current = gsap.to(items, {
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
          console.log('▶️ DirectorDetail: Animation started')
        },
        onComplete: () => {
          console.log('✅ DirectorDetail: Animation complete, navigating to:', url)
          // Small safety delay to ensure animation is fully visible
          setTimeout(() => {
            router.push(url)
          }, 50)
        }
      })
    } else {
      console.warn('⚠️ DirectorDetail: contentRef not found, navigating immediately')
      // Fallback
      router.push(url)
    }
  }, [isNavigating, router, slotMedia, saveVideoState])

  // Handle navigation from other pages (like clicking back to directors list)
  useEffect(() => {
    if (isMobile) return

    // Custom event listener for navigation from anywhere
    const handleNavigationRequest = (e: CustomEvent) => {
      const url = e.detail?.url
      if (url && !isNavigating) {
        fadeOutAndNavigate(url)
      }
    }

    window.addEventListener('navigate-with-fade' as any, handleNavigationRequest as any)

    return () => {
      window.removeEventListener('navigate-with-fade' as any, handleNavigationRequest as any)
    }
  }, [isMobile, isNavigating, fadeOutAndNavigate])

  // Expose fade-out function globally for header navigation
  useEffect(() => {
    if (isMobile) return

    // Make fade-out function available globally
    (window as any).__directorDetailFadeOut = fadeOutAndNavigate

    return () => {
      console.log('🔧 DirectorDetail: Cleaning up __directorDetailFadeOut function')
      delete (window as any).__directorDetailFadeOut
    }
  }, [isMobile, fadeOutAndNavigate])

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
