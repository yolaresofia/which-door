import { useCallback, useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { usePageTransitionVideo } from './usePageTransitionVideo'
import { getFadeOutConfig, GPU_HINTS, getIsReducedMotion } from './animationConfig'
import { usePageTransitionOptional } from '../components/PageTransitionProvider'

type FadeOutOptions = {
  selector?: string
  isMobile?: boolean
  saveVideo?: boolean
  onNavigate?: () => void
  /** Current slot media for video state persistence */
  slotMedia?: any[]
}

export function useFadeOutNavigation(
  containerRef: React.RefObject<HTMLElement | null>,
  options: FadeOutOptions = {}
) {
  const {
    selector = '[data-reveal]',
    isMobile = false,
    saveVideo = true,
    onNavigate,
    slotMedia: optionsSlotMedia,
  } = options

  const router = useRouter()
  const { saveVideoState } = usePageTransitionVideo()
  const pageTransition = usePageTransitionOptional()
  const [isNavigating, setIsNavigating] = useState(false)
  const animationRef = useRef<gsap.core.Tween | null>(null)
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const slotMediaRef = useRef<any[] | undefined>(optionsSlotMedia)

  // Keep slotMedia ref updated
  useEffect(() => {
    slotMediaRef.current = optionsSlotMedia
  }, [optionsSlotMedia])

  /**
   * Run the fade-out animation and call done() when complete.
   * This can be used as a standalone animation or as a callback for the page transition system.
   */
  const runFadeOutAnimation = useCallback(
    (done: () => void, slotMedia?: any[]) => {
      const mediaToSave = slotMedia || slotMediaRef.current

      // Save current video state if enabled
      if (saveVideo && mediaToSave) {
        const currentMedia = mediaToSave[0] || mediaToSave[1]
        if (currentMedia) {
          try {
            saveVideoState({
              id: currentMedia.id,
              videoSrc: currentMedia.videoSrc || '',
              previewUrl: currentMedia.previewUrl,
              vimeoUrl: currentMedia.vimeoUrl,
              previewPoster: currentMedia.previewPoster,
              bgColor: currentMedia.bgColor,
            })
          } catch (error) {
            console.warn('Failed to save video state:', error)
          }
        }
      }

      // Disable pointer events during animation
      if (containerRef.current) {
        containerRef.current.style.pointerEvents = 'none'
      }

      // Optional callback
      try {
        onNavigate?.()
      } catch (error) {
        console.warn('Navigation callback error:', error)
      }

      // Check for reduced motion - skip animation
      if (getIsReducedMotion()) {
        done()
        return
      }

      // Find and animate items
      const items = containerRef.current?.querySelectorAll(selector)

      if (!items || items.length === 0) {
        console.warn(`⚠️ No items found with selector "${selector}", completing immediately`)
        done()
        return
      }

      // Kill any existing animation and timeout
      if (animationRef.current) {
        animationRef.current.kill()
      }
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }

      // Get device-aware config
      const config = getFadeOutConfig(isMobile)

      // Animation configuration - MOBILE CHEAPER BY DESIGN
      // Mobile: No stagger, shorter duration, no GPU hints
      // Desktop: Full stagger, GPU hints for smoothness
      const animationConfig = isMobile ? {
        opacity: 0,
        scale: 0.95,
        duration: config.duration,
        ease: config.ease,
        stagger: 0, // NO stagger on mobile - all items fade together
      } : {
        opacity: 0,
        y: -8, // Smaller translate to avoid text blur
        scale: 0.98,
        duration: config.duration,
        ease: config.ease,
        stagger: config.stagger, // Full stagger on desktop
      }

      // SURGICAL GPU HINTS: Only apply on desktop, only right before animation
      // Mobile: Skip entirely - GPU hints cause Safari performance issues
      if (!isMobile) {
        gsap.set(items, {
          ...GPU_HINTS.apply(items),
          backfaceVisibility: 'hidden',
        })
      }

      // Create the fade-out animation
      animationRef.current = gsap.to(items, {
        ...animationConfig,
        onComplete: () => {
          // CRITICAL: Clean up GPU hints immediately after animation
          gsap.set(items, GPU_HINTS.clearAll())
          done()
        },
      })

      // Safety fallback: complete after maximum duration
      const maxDuration = (animationConfig.duration + 0.3) * 1000
      navigationTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Animation timeout, completing now')
        done()
      }, maxDuration)
    },
    [isMobile, containerRef, selector, saveVideo, saveVideoState, onNavigate]
  )

  // Register exit animation with page transition system
  useEffect(() => {
    if (pageTransition) {
      pageTransition.registerExitAnimation((done) => {
        setIsNavigating(true)
        runFadeOutAnimation(done)
      })

      return () => {
        pageTransition.unregisterExitAnimation()
      }
    }
  }, [pageTransition, runFadeOutAnimation])

  /**
   * Legacy function for backwards compatibility.
   * Fades out and navigates directly using router.push().
   */
  const fadeOutAndNavigate = useCallback(
    (url: string, slotMedia?: any[]) => {
      // Prevent duplicate navigation
      if (isNavigating) {
        console.log('⚠️ Already navigating, ignoring request')
        return
      }

      console.log(`🎬 Fading out and navigating to: ${url} (mobile: ${isMobile})`)
      setIsNavigating(true)

      try {
        runFadeOutAnimation(() => {
          router.push(url)
        }, slotMedia)
      } catch (error) {
        console.error('Fatal navigation error:', error)
        // Fallback: navigate immediately on any error
        router.push(url)
        setIsNavigating(false)
      }
    },
    [isNavigating, isMobile, router, runFadeOutAnimation]
  )

  return {
    fadeOutAndNavigate,
    runFadeOutAnimation,
    isNavigating,
    setIsNavigating,
  }
}
