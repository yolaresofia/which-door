import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { usePageTransitionVideo } from './usePageTransitionVideo'
import { getFadeOutConfig, GPU_HINTS } from './animationConfig'

type FadeOutOptions = {
  selector?: string
  isMobile?: boolean
  saveVideo?: boolean
  onNavigate?: () => void
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
  } = options

  const router = useRouter()
  const { saveVideoState } = usePageTransitionVideo()
  const [isNavigating, setIsNavigating] = useState(false)
  const animationRef = useRef<gsap.core.Tween | null>(null)
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
        // Save current video state if enabled
        if (saveVideo && slotMedia) {
          const currentMedia = slotMedia[0] || slotMedia[1]
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

        // Find and animate items
        const items = containerRef.current?.querySelectorAll(selector)

        if (!items || items.length === 0) {
          console.warn(`⚠️ No items found with selector "${selector}", navigating immediately`)
          router.push(url)
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
          y: -20,
          scale: 0.95,
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

        // Create the fade-out animation with error handling
        try {
          animationRef.current = gsap.to(items, {
            ...animationConfig,
            onStart: () => {
              console.log('▶️ Fade-out animation started')
            },
            onComplete: () => {
              console.log('✅ Fade-out animation complete, navigating...')
              // CRITICAL: Clean up GPU hints immediately after animation
              gsap.set(items, GPU_HINTS.clearAll())
              router.push(url)
            },
          })

          // Safety fallback: navigate after maximum duration
          const maxDuration = (animationConfig.duration + 0.3) * 1000
          navigationTimeoutRef.current = setTimeout(() => {
            console.log('⏰ Animation timeout, navigating now')
            router.push(url)
          }, maxDuration)
        } catch (error) {
          console.error('Animation error, navigating immediately:', error)
          router.push(url)
        }
      } catch (error) {
        console.error('Fatal navigation error:', error)
        // Fallback: navigate immediately on any error
        router.push(url)
        setIsNavigating(false)
      }
    },
    [isNavigating, isMobile, router, containerRef, selector, saveVideo, saveVideoState, onNavigate]
  )

  return {
    fadeOutAndNavigate,
    isNavigating,
    setIsNavigating,
  }
}
