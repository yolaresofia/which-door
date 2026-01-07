// utils/useSequencedReveal.ts
import { useRef, useCallback, useEffect } from 'react'
import { gsap } from 'gsap'

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
 */
export function useSequencedReveal(
  containerRef: React.RefObject<HTMLElement | null>,
  {
    target = '[data-reveal]',
    duration = 0.8,
    ease = 'power2.out',
    from = { opacity: 0, y: 20, scale: 0.98 },
    to = { opacity: 1, y: 0, scale: 1 },
    autoStart = true,
    stagger,
  }: SeqOpts = {}
) {
  const hasRunRef = useRef(false)
  const contextRef = useRef<gsap.Context | null>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const prefersReducedRef = useRef(false)

  // Check reduced motion preference once on mount
  useEffect(() => {
    prefersReducedRef.current =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  }, [])

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

    // Skip animation for reduced motion preference
    if (prefersReducedRef.current) {
      hasRunRef.current = true
      // Just show elements immediately
      const items = containerRef.current.querySelectorAll(target)
      items.forEach(item => {
        const el = item as HTMLElement
        el.style.opacity = '1'
        el.style.transform = 'none'
      })
      return
    }

    hasRunRef.current = true

    // Create GSAP context scoped to container
    contextRef.current = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(target)
      if (!items.length) return

      // Set initial state with GPU acceleration hints
      gsap.set(items, {
        ...from,
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        force3D: true,
      })

      // Create timeline
      timelineRef.current = gsap.timeline({
        defaults: { ease, force3D: true },
        onComplete: () => {
          // Clean up will-change after animation for performance
          gsap.set(items, { willChange: 'auto', clearProps: 'backfaceVisibility' })
        },
      })

      timelineRef.current.to(items, {
        ...to,
        duration,
        stagger: stagger ?? {
          each: 0.08,
          from: 'start',
          ease: 'power2.inOut',
        },
        overwrite: 'auto',
      })
    }, containerRef)
  }, [containerRef, target, duration, ease, from, to, stagger])

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
