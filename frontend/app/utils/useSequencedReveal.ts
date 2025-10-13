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
  /** Optional: pass a custom stagger to avoid many concurrent tweens */
  stagger?: number | gsap.StaggerVars
}

export function useSequencedReveal(
  containerRef: React.RefObject<HTMLElement | null>,
  {
    target = '[data-reveal]',
    duration = 0.1,
    gap = 0,
    ease = 'power3.out',
    from = { opacity: 0, y: 40 },
    to   = { opacity: 1, y: 0 },
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

      gsap.set(items, { willChange: 'transform,opacity', backfaceVisibility: 'hidden' })

      const tl = gsap.timeline({
        defaults: { ease },
        onComplete: () => { gsap.set(items, { willChange: 'auto' }) },
      })

      tl.fromTo(
        items,
        { ...from, force3D: true },
        {
          ...to,
          force3D: true,
          autoRound: false,
          duration,
          // If caller provided stagger, use it. Else sequential by each:
          stagger: stagger ?? { each: duration + gap, from: 0 },
          overwrite: 'auto',
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
