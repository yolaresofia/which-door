import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { getFadeOutConfig, GPU_HINTS } from './animationConfig'

type FadeOutOptions = {
  selector?: string
  isMobile?: boolean
  onNavigate?: () => void
}

export function useFadeOutNavigation(
  containerRef: React.RefObject<HTMLElement | null>,
  options: FadeOutOptions = {}
) {
  const {
    selector = '[data-reveal]',
    isMobile = false,
    onNavigate,
  } = options

  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const animationRef = useRef<gsap.core.Tween | null>(null)
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fadeOutAndNavigate = useCallback(
    (url: string) => {
      if (isNavigating) return

      setIsNavigating(true)

      try {
        // Disable pointer events during animation
        if (containerRef.current) {
          containerRef.current.style.pointerEvents = 'none'
        }

        try {
          onNavigate?.()
        } catch {
          // Ignore callback errors
        }

        // Find and animate items
        const items = containerRef.current?.querySelectorAll(selector)

        if (!items || items.length === 0) {
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
          stagger: 0,
        } : {
          opacity: 0,
          y: -20,
          scale: 0.95,
          duration: config.duration,
          ease: config.ease,
          stagger: config.stagger,
        }

        // SURGICAL GPU HINTS: Only apply on desktop, only right before animation
        if (!isMobile) {
          gsap.set(items, {
            ...GPU_HINTS.apply(items),
            backfaceVisibility: 'hidden',
          })
        }

        // Create the fade-out animation
        try {
          animationRef.current = gsap.to(items, {
            ...animationConfig,
            onComplete: () => {
              // Navigate immediately — do NOT clearProps, as that flashes
              // elements back to visible before the page unmounts them
              router.push(url)
            },
          })

          // Safety fallback: navigate after maximum duration
          const maxDuration = (animationConfig.duration + 0.3) * 1000
          navigationTimeoutRef.current = setTimeout(() => {
            router.push(url)
          }, maxDuration)
        } catch {
          router.push(url)
        }
      } catch {
        router.push(url)
        setIsNavigating(false)
      }
    },
    [isNavigating, isMobile, router, containerRef, selector, onNavigate]
  )

  return {
    fadeOutAndNavigate,
    isNavigating,
    setIsNavigating,
  }
}
