import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { usePageTransitionVideo } from './usePageTransitionVideo'

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

  const fadeOutAndNavigate = useCallback(
    (url: string, slotMedia?: any[]) => {
      if (isNavigating) return

      console.log(`🎬 Fading out and navigating to: ${url} (mobile: ${isMobile})`)
      setIsNavigating(true)

      // Save current video state if enabled
      if (saveVideo && slotMedia) {
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
      }

      // Disable pointer events during animation
      if (containerRef.current) {
        containerRef.current.style.pointerEvents = 'none'
      }

      // Optional callback
      onNavigate?.()

      // Find and animate items
      const items = containerRef.current?.querySelectorAll(selector)

      if (!items || items.length === 0) {
        console.warn(`⚠️ No items found with selector "${selector}", navigating immediately`)
        router.push(url)
        return
      }

      // Kill any existing animation
      if (animationRef.current) {
        animationRef.current.kill()
      }

      // Mobile animations: fade out with less movement
      const mobileAnimation = isMobile ? {
        opacity: 0,
        scale: 0.95,
        duration: 0.5,
        ease: 'power2.in',
        stagger: {
          each: 0.03,
          from: 'start' as const,
        },
      } : {
        opacity: 0,
        y: -30,
        scale: 0.92,
        duration: 0.7,
        ease: 'power2.in',
        stagger: {
          each: 0.05,
          from: 'start' as const,
        },
      }

      // Create the fade-out animation
      animationRef.current = gsap.to(items, {
        ...mobileAnimation,
        onStart: () => {
          console.log('▶️ Fade-out animation started')
        },
        onComplete: () => {
          console.log('✅ Fade-out animation complete, navigating...')
          // Small safety delay to ensure animation is fully visible
          setTimeout(() => {
            router.push(url)
          }, 50)
        },
      })
    },
    [isNavigating, isMobile, router, containerRef, selector, saveVideo, saveVideoState, onNavigate]
  )

  return {
    fadeOutAndNavigate,
    isNavigating,
    setIsNavigating,
  }
}
