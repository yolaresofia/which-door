'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import BackgroundMedia from '../components/BackgroundMedia/BackgroundMedia'
import { useSequencedReveal } from '../utils/useSequencedReveal'
import { usePageTransitionVideo } from '../utils/usePageTransitionVideo'
import { useCrossfadeMedia } from '../utils/useCrossfadeMedia'
import { gsap } from 'gsap'

const bg =
  'https://cdn.sanity.io/files/xerhtqd5/production/5068305fa81bd755e7c0dd4f119c8e2b995a8813.mp4'
const previewPoster =
  'https://cdn.sanity.io/images/xerhtqd5/production/99945ce01a04899a2742da8865740039d7513b57-3024x1964.png'

export default function AboutPage() {
  const router = useRouter()
  const { saveVideoState, getPreviousVideoState } = usePageTransitionVideo()

  const [fontLoaded, setFontLoaded] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const contentRef = useRef<HTMLElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const animationRef = useRef<gsap.core.Tween | null>(null)
  const hasTransitionedRef = useRef(false)

  const targetVideo = useMemo(() => ({
    id: 'about',
    videoSrc: bg,
    previewUrl: bg,
    previewPoster: previewPoster,
    bgColor: '#000',
  }), [])

  // Check for previous video state to determine initial state
  const previousVideo = getPreviousVideoState()
  const initialVideo = previousVideo || targetVideo

  const { setSlotRef, slotMedia, crossfadeTo } = useCrossfadeMedia(initialVideo, { duration: 0.6 })

  // Desktop animation - EXACT SAME as ProjectsLanding
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

    console.log('📹 About: Transitioning from previous page video')
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

  // Font loading - EXACT SAME as ProjectsLanding
  useEffect(() => {
    let cancelled = false
    let timeoutId: NodeJS.Timeout

    const triggerAnimation = () => {
      if (cancelled) return
      setFontLoaded(true)
      // Start with RAF to ensure DOM is ready
      if (!isMobile) {
        requestAnimationFrame(() => {
          start()
        })
      }
    }

    if ('fonts' in document && (document as any).fonts?.ready) {
      ;(document as any).fonts.ready.then(() => {
        ;(document as any).fonts.load('normal 1em Neue').then(
          () => {
            if (!cancelled) triggerAnimation()
          },
          () => {
            if (!cancelled) triggerAnimation()
          }
        )
      })
    } else {
      timeoutId = setTimeout(triggerAnimation, 100)
    }

    const safetyTimeout = setTimeout(() => {
      if (!cancelled && !fontLoaded) {
        triggerAnimation()
      }
    }, 3000)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      clearTimeout(safetyTimeout)
    }
  }, [start, fontLoaded, isMobile])

  // Fade-out animation function - EXACT SAME as ProjectsLanding with extra safety
  const fadeOutAndNavigate = useCallback((url: string) => {
    if (isNavigating) return

    console.log('🎬 About: Starting fade-out animation...')
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

    // Fade out content - EXACT SAME animation
    if (contentRef.current) {
      const items = contentRef.current.querySelectorAll('[data-reveal]')

      console.log('🎬 About: Found items to animate:', items.length)

      if (items.length === 0) {
        console.warn('⚠️ About: No items found with [data-reveal], navigating immediately')
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
          console.log('▶️ About: Animation started')
        },
        onComplete: () => {
          console.log('✅ About: Animation complete, navigating to:', url)
          // Small safety delay to ensure animation is fully visible
          setTimeout(() => {
            router.push(url)
          }, 50)
        }
      })
    } else {
      console.warn('⚠️ About: contentRef not found, navigating immediately')
      // Fallback
      router.push(url)
    }
  }, [isNavigating, router, slotMedia, saveVideoState])

  // Expose fade-out function globally for header navigation
  useEffect(() => {
    if (isMobile) return

    // Make fade-out function available globally
    (window as any).__aboutFadeOut = fadeOutAndNavigate

    return () => {
      console.log('🔧 About: Cleaning up __aboutFadeOut function')
      delete (window as any).__aboutFadeOut
    }
  }, [isMobile, fadeOutAndNavigate])

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
      
      {/* Content with animation - EXACT SAME structure as ProjectsLanding */}
      <section 
        ref={contentRef}
        className="relative z-10 mx-auto w-full px-6 md:px-12 pt-0 md:pt-32"
      >
        <div
          data-reveal
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
