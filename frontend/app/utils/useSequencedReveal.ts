// utils/useSequencedReveal.ts
import { useLayoutEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'

type EaseLike = gsap.TweenVars['ease']

type SeqOpts = {
  target?: string
  duration?: number
  gap?: number
  ease?: EaseLike
  from?: gsap.TweenVars
  to?: gsap.TweenVars
  autoStart?: boolean
  stagger?: number | gsap.StaggerVars
}

export function useSequencedReveal(
  containerRef: React.RefObject<HTMLElement | null>,
  {
    target = '[data-reveal]',
    // Smoother, longer duration like doity.de
    duration = 0.8,
    gap = 0,
    // Softer, more natural easing
    ease = 'power2.out',
    // More subtle initial state - less distance, slight opacity
    from = { opacity: 0, y: 20, scale: 0.98 },
    to   = { opacity: 1, y: 0, scale: 1 },
    autoStart = true,
    stagger,
  }: SeqOpts = {}
) {
  const ranRef = useRef(false)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

  const killAll = () => {
    tlRef.current?.kill()
    tlRef.current = null
    cleanupRef.current?.()
    cleanupRef.current = null
  }

  const start = useCallback((): void => {
    if (ranRef.current || !containerRef.current || prefersReduced) return
    ranRef.current = true

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(target)
      if (!items.length) return

      // Set will-change for performance
      gsap.set(items, { 
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        // Important: don't hide completely, start at the 'from' state
        ...from
      })

      const tl = gsap.timeline({
        defaults: { 
          ease,
          // Smooth interpolation
          force3D: true,
        },
        onComplete: () => { 
          // Clean up will-change after animation
          gsap.set(items, { willChange: 'auto' }) 
        },
      })

      tl.to(
        items,
        {
          ...to,
          duration,
          // Stagger creates the sequential reveal effect
          // Using a shorter stagger amount for smoother cascading
          stagger: stagger ?? { 
            each: 0.08, // Much faster cascade like doity.de
            from: 'start',
            ease: 'power2.inOut'
          },
          overwrite: 'auto',
          // Smooth sub-pixel rendering
          autoRound: false,
        }
      )

      tlRef.current = tl
    }, containerRef)

    cleanupRef.current = () => ctx.revert()
  }, [containerRef, target, duration, gap, ease, prefersReduced, from, to, stagger])

  const reset = useCallback(() => {
    ranRef.current = false
    killAll()
  }, [])

  useLayoutEffect(() => {
    if (autoStart) start()
    return () => killAll()
  }, [autoStart, start])

  return { start, reset, hasRun: () => ranRef.current }
}