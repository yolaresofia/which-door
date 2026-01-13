'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'

/**
 * Initial hidden styles to apply via inline style prop.
 * CRITICAL: These must be applied as inline styles on elements to prevent FOUC.
 * CSS-in-JS or useLayoutEffect cannot reliably prevent the flash during SSR/hydration.
 */
export const REVEAL_HIDDEN_STYLE = {
  opacity: 0,
  transform: 'translateY(20px) scale(0.98)',
} as const

export const REVEAL_HIDDEN_STYLE_SIMPLE = {
  opacity: 0,
  transform: 'translateY(20px)',
} as const

type RevealAnimationOptions = {
  /** Whether to skip the animation (e.g., on mobile) */
  skip?: boolean
  /** Duration of each element's animation in seconds */
  duration?: number
  /** Delay before starting the animation in ms */
  delay?: number
  /** Stagger time between elements in seconds */
  stagger?: number
  /** GSAP easing function */
  ease?: string
  /** Whether to include scale in the animation */
  includeScale?: boolean
  /** Callback when animation completes */
  onComplete?: () => void
}

type RevealAnimationReturn = {
  /** Ref to attach to the container element */
  containerRef: React.RefObject<HTMLElement | null>
  /** Call this to trigger the reveal animation */
  reveal: () => void
  /** Whether the animation has completed */
  hasRevealed: boolean
  /** Call this to immediately show elements without animation */
  showImmediately: () => void
}

/**
 * Hook for managing reveal animations with proper FOUC prevention.
 *
 * USAGE:
 * 1. Apply REVEAL_HIDDEN_STYLE as inline style on elements with data-reveal
 * 2. Call reveal() when ready to animate (e.g., after video loads)
 *
 * @example
 * ```tsx
 * const { containerRef, reveal, hasRevealed } = useRevealAnimation({
 *   skip: isMobile,
 *   delay: 100,
 * })
 *
 * // In your JSX:
 * <div ref={containerRef}>
 *   <div data-reveal style={REVEAL_HIDDEN_STYLE}>Content</div>
 * </div>
 *
 * // When ready:
 * useEffect(() => {
 *   if (videoReady) reveal()
 * }, [videoReady, reveal])
 * ```
 */
export function useRevealAnimation(options: RevealAnimationOptions = {}): RevealAnimationReturn {
  const {
    skip = false,
    duration = 0.6,
    delay = 50,
    stagger = 0.08,
    ease = 'power2.out',
    includeScale = true,
    onComplete,
  } = options

  const containerRef = useRef<HTMLElement | null>(null)
  const [hasRevealed, setHasRevealed] = useState(false)
  const animationRef = useRef<gsap.core.Tween | null>(null)

  // Show elements immediately without animation
  const showImmediately = useCallback(() => {
    if (!containerRef.current) return

    const items = containerRef.current.querySelectorAll('[data-reveal], [data-mobile-reveal]')
    if (items.length === 0) return

    gsap.set(items, {
      opacity: 1,
      y: 0,
      scale: 1,
      clearProps: 'transform',
    })
    setHasRevealed(true)
  }, [])

  // Trigger reveal animation
  const reveal = useCallback(() => {
    if (skip || hasRevealed || !containerRef.current) return

    const items = containerRef.current.querySelectorAll('[data-reveal], [data-mobile-reveal]')
    if (items.length === 0) return

    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill()
    }

    const timeoutId = setTimeout(() => {
      // IMPORTANT: Do NOT call gsap.set() to reset initial state!
      // Elements already have inline styles (REVEAL_HIDDEN_STYLE).
      // Calling gsap.set() causes a redundant repaint and creates glitch.
      // Just apply GPU hints for smoother animation.
      gsap.set(items, {
        willChange: 'transform, opacity',
        force3D: true,
      })

      // Animate in - gsap.to() will animate FROM current inline styles TO target
      animationRef.current = gsap.to(items, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration,
        ease,
        stagger: {
          each: stagger,
          from: 'start',
          ease: 'power2.inOut',
        },
        overwrite: 'auto',
        onComplete: () => {
          setHasRevealed(true)
          // Clear transform and will-change for performance
          gsap.set(items, { clearProps: 'transform', willChange: 'auto' })
          onComplete?.()
        },
      })
    }, delay)

    return () => {
      clearTimeout(timeoutId)
      if (animationRef.current) {
        animationRef.current.kill()
      }
    }
  }, [skip, hasRevealed, duration, delay, stagger, ease, includeScale, onComplete])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.kill()
      }
    }
  }, [])

  // If skip is true, show immediately on mount
  useEffect(() => {
    if (skip && !hasRevealed) {
      showImmediately()
    }
  }, [skip, hasRevealed, showImmediately])

  return {
    containerRef,
    reveal,
    hasRevealed,
    showImmediately,
  }
}

/**
 * Combined hook for pages that need both desktop (sequenced) and mobile (simple) reveal.
 * Handles the mobile detection internally and provides the right behavior for each.
 */
export function usePageRevealAnimation(options: {
  /** Callback when video is ready (desktop) */
  onVideoReady?: () => void
  /** Whether video is ready */
  videoReady?: boolean
  /** Skip mobile animation entirely (just show content) */
  skipMobileAnimation?: boolean
} = {}) {
  const { videoReady = false, skipMobileAnimation = false } = options

  const [isMobile, setIsMobile] = useState(false)
  const desktopContainerRef = useRef<HTMLElement | null>(null)
  const mobileContainerRef = useRef<HTMLElement | null>(null)
  const [desktopRevealed, setDesktopRevealed] = useState(false)
  const [mobileRevealed, setMobileRevealed] = useState(false)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Desktop reveal
  const revealDesktop = useCallback(() => {
    if (isMobile || desktopRevealed || !desktopContainerRef.current) return

    const items = desktopContainerRef.current.querySelectorAll('[data-reveal]')
    if (items.length === 0) return

    gsap.set(items, { opacity: 0, y: 20, scale: 0.98 })

    gsap.to(items, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      ease: 'power2.out',
      stagger: {
        each: 0.08,
        from: 'start',
        ease: 'power2.inOut',
      },
      onComplete: () => {
        setDesktopRevealed(true)
        gsap.set(items, { clearProps: 'transform' })
      },
    })
  }, [isMobile, desktopRevealed])

  // Mobile reveal
  const revealMobile = useCallback(() => {
    if (!isMobile || mobileRevealed || !mobileContainerRef.current) return

    const items = mobileContainerRef.current.querySelectorAll('[data-mobile-reveal]')
    if (items.length === 0) return

    gsap.set(items, { opacity: 0, y: 20 })

    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
      stagger: {
        each: 0.08,
        from: 'start',
      },
      onComplete: () => {
        setMobileRevealed(true)
        gsap.set(items, { clearProps: 'transform' })
      },
    })
  }, [isMobile, mobileRevealed])

  // Show mobile immediately without animation
  const showMobileImmediately = useCallback(() => {
    if (!mobileContainerRef.current) return

    const items = mobileContainerRef.current.querySelectorAll('[data-mobile-reveal]')
    gsap.set(items, { opacity: 1, y: 0, clearProps: 'transform' })
    setMobileRevealed(true)
  }, [])

  // Trigger desktop animation when video ready
  useEffect(() => {
    if (!isMobile && videoReady && !desktopRevealed) {
      requestAnimationFrame(revealDesktop)
    }
  }, [isMobile, videoReady, desktopRevealed, revealDesktop])

  // Trigger mobile animation shortly after mount
  useEffect(() => {
    if (!isMobile || mobileRevealed) return

    if (skipMobileAnimation) {
      showMobileImmediately()
      return
    }

    const timeoutId = setTimeout(revealMobile, 50)
    return () => clearTimeout(timeoutId)
  }, [isMobile, mobileRevealed, skipMobileAnimation, revealMobile, showMobileImmediately])

  return {
    isMobile,
    desktopContainerRef,
    mobileContainerRef,
    desktopRevealed,
    mobileRevealed,
    revealDesktop,
    revealMobile,
    showMobileImmediately,
  }
}
