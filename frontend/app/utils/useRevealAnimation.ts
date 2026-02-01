'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import {
  getRevealConfig,
  GPU_HINTS,
  shouldSkipAnimation,
  getIsMobile,
} from './animationConfig'

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
  // Get device-aware defaults from config
  const isMobile = getIsMobile()
  const config = getRevealConfig(isMobile)

  const {
    skip = false,
    duration = config.duration,
    delay = 50,
    stagger = config.stagger,
    ease = config.ease,
    // includeScale is kept for API compatibility but not currently used
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

    // Check if we should skip animation (too many items on mobile, or reduced motion)
    if (shouldSkipAnimation(items.length, isMobile)) {
      gsap.set(items, {
        opacity: 1,
        y: 0,
        scale: 1,
        clearProps: 'transform',
      })
      setHasRevealed(true)
      onComplete?.()
      return
    }

    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill()
    }

    const timeoutId = setTimeout(() => {
      // SURGICAL GPU HINTS: Only apply to desktop, and only right before animation
      // Mobile: Skip GPU hints entirely - CSS transforms are sufficient
      // This prevents GPU memory pressure on mobile Safari
      if (config.useGPUHints) {
        gsap.set(items, GPU_HINTS.apply(items))
      }

      // Build stagger config (mobile: no stagger, desktop: full stagger)
      const staggerConfig = isMobile
        ? stagger // Will be 0 from config
        : {
            each: stagger,
            from: 'start' as const,
            ease: 'power2.inOut',
          }

      // Animate in - gsap.to() will animate FROM current inline styles TO target
      animationRef.current = gsap.to(items, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration,
        ease,
        stagger: staggerConfig,
        overwrite: 'auto',
        onComplete: () => {
          setHasRevealed(true)
          // CRITICAL: Clear GPU hints IMMEDIATELY after animation
          // Safe to clear transform here since these elements started with REVEAL_HIDDEN_STYLE
          gsap.set(items, GPU_HINTS.clearWithTransform())
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
  }, [skip, hasRevealed, duration, delay, stagger, ease, isMobile, config.useGPUHints, onComplete])

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
 *
 * MOBILE CHEAPER BY DESIGN:
 * - No stagger (all items animate together)
 * - Shorter durations
 * - Immediate show for many items
 * This is professional cross-device behavior, not "lowering quality"
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

  // Get device-aware configs
  const desktopConfig = getRevealConfig(false)
  const mobileConfig = getRevealConfig(true)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Desktop reveal - with GPU hints and stagger
  const revealDesktop = useCallback(() => {
    if (isMobile || desktopRevealed || !desktopContainerRef.current) return

    const items = desktopContainerRef.current.querySelectorAll('[data-reveal]')
    if (items.length === 0) return

    // SURGICAL: Apply GPU hints only to desktop, only right before animation
    gsap.set(items, GPU_HINTS.apply(items))

    gsap.to(items, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: desktopConfig.duration,
      ease: desktopConfig.ease,
      stagger: {
        each: typeof desktopConfig.stagger === 'number' ? desktopConfig.stagger : 0.08,
        from: 'start',
        ease: 'power2.inOut',
      },
      overwrite: 'auto',
      onComplete: () => {
        setDesktopRevealed(true)
        // CRITICAL: Clear GPU hints immediately
        // Safe to clear transform - elements started with REVEAL_HIDDEN_STYLE
        gsap.set(items, GPU_HINTS.clearWithTransform())
      },
    })
  }, [isMobile, desktopRevealed, desktopConfig])

  // Mobile reveal - CHEAPER BY DESIGN: no stagger, shorter duration, no GPU hints
  const revealMobile = useCallback(() => {
    if (!isMobile || mobileRevealed || !mobileContainerRef.current) return

    const items = mobileContainerRef.current.querySelectorAll('[data-mobile-reveal]')
    if (items.length === 0) return

    // Check if we should skip animation entirely (too many items)
    if (shouldSkipAnimation(items.length, true)) {
      gsap.set(items, { opacity: 1, y: 0, clearProps: 'transform' })
      setMobileRevealed(true)
      return
    }

    // MOBILE: NO GPU hints (willChange/force3D cause Safari issues)
    // NO stagger (all animate together for smoothness)
    // SHORTER duration (snappy feel)
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: mobileConfig.duration,
      ease: mobileConfig.ease,
      stagger: 0, // NO stagger on mobile
      overwrite: 'auto',
      onComplete: () => {
        setMobileRevealed(true)
        gsap.set(items, { clearProps: 'transform' })
      },
    })
  }, [isMobile, mobileRevealed, mobileConfig])

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
