// utils/useSequencedReveal.ts
import { useRef, useCallback, useEffect } from 'react'
import { gsap } from 'gsap'
import {
  getSequenceConfig,
  GPU_HINTS,
  shouldSkipAnimation,
  getIsMobile,
  getIsReducedMotion,
} from './animationConfig'

type EaseLike = gsap.TweenVars['ease']

type SeqOpts = {
  target?: string
  duration?: number
  ease?: EaseLike
  from?: gsap.TweenVars
  to?: gsap.TweenVars
  autoStart?: boolean
  stagger?: number | gsap.StaggerVars
}

/**
 * Hook for staggered reveal animations.
 *
 * Best practices:
 * - Set autoStart: false and call start() manually when ready (e.g., after video loads)
 * - Elements should have initial CSS opacity: 0 or use gsap.set to hide before animation
 * - The hook auto-resets on unmount to allow re-animation on return
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - SURGICAL will-change/force3D: Only on desktop, only during animation, cleared immediately
 * - MOBILE CHEAPER BY DESIGN: No stagger, shorter duration, skip for many items
 */
export function useSequencedReveal(
  containerRef: React.RefObject<HTMLElement | null>,
  {
    target = '[data-reveal]',
    duration,
    ease = 'power2.out',
    // from is kept for API compatibility but elements use inline styles for initial state
    to = { opacity: 1, y: 0, scale: 1 },
    autoStart = true,
    stagger,
  }: SeqOpts = {}
) {
  const hasRunRef = useRef(false)
  const contextRef = useRef<gsap.Context | null>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  // Get device-aware config
  const isMobile = getIsMobile()
  const config = getSequenceConfig(isMobile)

  // Use config defaults if not explicitly provided
  const actualDuration = duration ?? (isMobile ? 0.3 : 0.8)
  const actualStagger = stagger ?? (isMobile ? 0 : config.stagger)

  // Clean up GSAP context and timeline
  const cleanup = useCallback(() => {
    timelineRef.current?.kill()
    timelineRef.current = null
    contextRef.current?.revert()
    contextRef.current = null
  }, [])

  // Start the reveal animation
  const start = useCallback(() => {
    // Prevent multiple runs
    if (hasRunRef.current) return
    if (!containerRef.current) return

    const items = gsap.utils.toArray<HTMLElement>(target, containerRef.current)
    if (!items.length) return

    // Skip animation for reduced motion preference OR too many items on mobile
    if (getIsReducedMotion() || shouldSkipAnimation(items.length, isMobile)) {
      hasRunRef.current = true
      // Just show elements immediately - no animation
      items.forEach(item => {
        item.style.opacity = '1'
        item.style.transform = 'none'
      })
      return
    }

    hasRunRef.current = true

    // Create GSAP context scoped to container
    contextRef.current = gsap.context(() => {
      // SURGICAL GPU HINTS: Only on desktop, only right before animation
      // Mobile: Skip entirely to prevent GPU memory pressure on Safari
      if (!isMobile) {
        gsap.set(items, GPU_HINTS.apply(items))
      }

      // Create timeline
      timelineRef.current = gsap.timeline({
        defaults: { ease },
        onComplete: () => {
          // CRITICAL: Clear GPU hints immediately after animation
          // Safe to clear transform - elements started with inline hidden styles
          gsap.set(items, GPU_HINTS.clearWithTransform())
        },
      })

      timelineRef.current.to(items, {
        ...to,
        duration: actualDuration,
        stagger: actualStagger,
        overwrite: 'auto',
      })
    }, containerRef)
  }, [containerRef, target, actualDuration, ease, to, actualStagger, isMobile])

  // Reset to allow re-animation
  const reset = useCallback(() => {
    cleanup()
    hasRunRef.current = false
  }, [cleanup])

  // Check if animation has run
  const hasRun = useCallback(() => hasRunRef.current, [])

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && containerRef.current) {
      // Use RAF to ensure DOM is ready
      const rafId = requestAnimationFrame(() => {
        start()
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [autoStart, start])

  // Cleanup on unmount - CRITICAL for Next.js navigation
  useEffect(() => {
    return () => {
      cleanup()
      hasRunRef.current = false
    }
  }, [cleanup])

  return { start, reset, hasRun }
}
