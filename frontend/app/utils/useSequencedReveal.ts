// utils/useSequencedReveal.ts
import { useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

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
    duration = 0.8,
    gap = 0,
    ease = 'power2.out',
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

      // Set will-change for performance and initial state
      gsap.set(items, {
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        force3D: true,
        ...from
      })

      const tl = gsap.timeline({
        defaults: {
          ease,
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
          stagger: stagger ?? {
            each: 0.08,
            from: 'start',
            ease: 'power2.inOut'
          },
          overwrite: 'auto',
          autoRound: false,
          force3D: true,
        }
      )

      tlRef.current = tl
    }, containerRef)

    cleanupRef.current = () => ctx.revert()
  }, [containerRef, target, duration, ease, prefersReduced, from, to, stagger])

  const reset = useCallback(() => {
    ranRef.current = false
    killAll()
  }, [])

  useGSAP(() => {
    if (autoStart) start()
    return () => killAll()
  }, [autoStart, start])

  return { start, reset, hasRun: () => ranRef.current }
}
