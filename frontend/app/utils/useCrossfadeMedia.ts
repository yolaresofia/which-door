'use client'

import { useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { getCrossfadeConfig, getIsReducedMotion, getIsMobile } from './animationConfig'

export type Media = {
  id: string | number
  imageSrc?: string
  videoSrc?: string
  previewUrl?: string
  mobilePreviewUrl?: string
  vimeoUrl?: string
  bgColor?: string
  previewPoster?: string
  previewPosterLQIP?: string
}

type TransitionState = 'idle' | 'pending' | 'animating'

export function useCrossfadeMedia(
  initial: Media,
  opts?: { duration?: number; waitForLoad?: boolean }
) {
  const isMobile = getIsMobile()
  const config = getCrossfadeConfig(isMobile)

  const D = opts?.duration ?? config.duration
  const prefersReduced = getIsReducedMotion()

  // ─────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────
  const [slots, setSlots] = useState<[Media | null, Media | null]>([initial, null])
  const [currentSlot, setCurrentSlot] = useState<0 | 1>(0)

  // ─────────────────────────────────────────────────────────────
  // REFS (stable across renders, no stale closure issues)
  // ─────────────────────────────────────────────────────────────
  const slotRefs = useRef<[HTMLDivElement | null, HTMLDivElement | null]>([null, null])
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  // Track which slot is the "source of truth" for visibility
  const visibleSlotRef = useRef<0 | 1>(0)

  // State machine to prevent race conditions
  const stateRef = useRef<TransitionState>('idle')

  // Queue the latest requested media (last-intent wins)
  const pendingMediaRef = useRef<Media | null>(null)

  // Track the ID of what's currently visible (avoid stale closure on slots)
  const visibleMediaIdRef = useRef<string | number | null>(
    initial.id ?? initial.videoSrc ?? null
  )

  // Debounce rapid hovers - only process after pointer settles
  const debounceTimerRef = useRef<number | null>(null)

  // Track if component is mounted
  const isMountedRef = useRef(true)

  // ─────────────────────────────────────────────────────────────
  // HELPER: Get media ID
  // ─────────────────────────────────────────────────────────────
  const getMediaId = useCallback(
    (media: Media | null): string | number | null => {
      if (!media) return null
      return media.id ?? media.videoSrc ?? media.imageSrc ?? null
    },
    []
  )

  // ─────────────────────────────────────────────────────────────
  // CORE: Execute the actual crossfade animation
  // ─────────────────────────────────────────────────────────────
  const executeTransition = useCallback(
    async (next: Media) => {
      // Abort if unmounted
      if (!isMountedRef.current) {
        stateRef.current = 'idle'
        return
      }

      const nextId = getMediaId(next)

      // Double-check we're not already showing this
      if (visibleMediaIdRef.current === nextId) {
        stateRef.current = 'idle'
        return
      }

      const from = visibleSlotRef.current
      const to = (from === 0 ? 1 : 0) as 0 | 1

      // Kill any existing animation CLEANLY
      if (tlRef.current) {
        tlRef.current.eventCallback('onComplete', null)
        tlRef.current.kill()
        tlRef.current = null
      }

      // Also kill any tweens on the slot elements
      const fromEl = slotRefs.current[from]
      const toEl = slotRefs.current[to]

      if (fromEl) gsap.killTweensOf(fromEl)
      if (toEl) gsap.killTweensOf(toEl)

      // CRITICAL: Ensure "from" slot is fully visible before we start
      if (fromEl) {
        gsap.set(fromEl, { opacity: 1, visibility: 'visible' })
      }

      // Load new media into the target slot
      setSlots((prev) => {
        const copy: [Media | null, Media | null] = [...prev]
        copy[to] = next
        return copy
      })

      // Wait for React to commit the new content
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve()
          })
        })
      })

      // Abort if unmounted during wait
      if (!isMountedRef.current) {
        stateRef.current = 'idle'
        return
      }

      // Get fresh refs after React commit
      const freshToEl = slotRefs.current[to]
      const freshFromEl = slotRefs.current[from]

      if (!freshToEl || !freshFromEl) {
        stateRef.current = 'idle'
        return
      }

      // Ensure "to" slot starts hidden but in DOM
      gsap.set(freshToEl, { opacity: 0, visibility: 'visible' })

      // Check if a newer request came in while we were waiting
      if (
        pendingMediaRef.current &&
        getMediaId(pendingMediaRef.current) !== nextId
      ) {
        const newer = pendingMediaRef.current
        pendingMediaRef.current = null
        stateRef.current = 'pending'
        executeTransition(newer)
        return
      }

      stateRef.current = 'animating'

      if (prefersReduced) {
        // Instant switch for reduced motion
        gsap.set(freshFromEl, { opacity: 0 })
        gsap.set(freshToEl, { opacity: 1 })
        visibleSlotRef.current = to
        visibleMediaIdRef.current = nextId
        setCurrentSlot(to)

        requestAnimationFrame(() => {
          if (!isMountedRef.current) return
          setSlots((prev) => {
            const copy: [Media | null, Media | null] = [...prev]
            copy[from] = null
            return copy
          })
        })

        stateRef.current = 'idle'
        return
      }

      // ─────────────────────────────────────────────────────────
      // CROSSFADE ANIMATION
      // ─────────────────────────────────────────────────────────
      const tl = gsap.timeline({
        defaults: { overwrite: 'auto' },
        onComplete: () => {
          if (tlRef.current === tl && isMountedRef.current) {
            visibleSlotRef.current = to
            visibleMediaIdRef.current = nextId
            setCurrentSlot(to)

            requestAnimationFrame(() => {
              if (!isMountedRef.current) return
              setSlots((prev) => {
                const copy: [Media | null, Media | null] = [...prev]
                copy[from] = null
                return copy
              })
            })

            tlRef.current = null
            stateRef.current = 'idle'

            // Check for pending request
            if (pendingMediaRef.current) {
              const pending = pendingMediaRef.current
              pendingMediaRef.current = null
              crossfadeTo(pending)
            }
          }
        },
      })

      // Phase 1: Fade IN the new slot
      tl.to(freshToEl, {
        opacity: 1,
        duration: D * 0.6,
        ease: 'power2.out',
      })

      // Phase 2: Fade OUT the old slot (starts overlapping)
      tl.to(
        freshFromEl,
        {
          opacity: 0,
          duration: D * 0.5,
          ease: 'power2.in',
        },
        D * 0.3 // Start fade-out earlier for smoother overlap
      )

      tlRef.current = tl
    },
    [D, prefersReduced, getMediaId]
  )

  // ─────────────────────────────────────────────────────────────
  // PUBLIC: Request a crossfade (debounced, last-intent wins)
  // ─────────────────────────────────────────────────────────────
  const crossfadeTo = useCallback(
    (next: Media) => {
      if (!isMountedRef.current) return

      const nextId = getMediaId(next)

      // Skip if already showing or pending for this media
      if (visibleMediaIdRef.current === nextId) return
      if (
        pendingMediaRef.current &&
        getMediaId(pendingMediaRef.current) === nextId
      )
        return

      // Clear any existing debounce timer
      if (debounceTimerRef.current !== null) {
        cancelAnimationFrame(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      // If currently animating, just queue this as pending (last-intent wins)
      if (stateRef.current === 'animating') {
        pendingMediaRef.current = next
        return
      }

      // Debounce: wait a frame before starting transition
      pendingMediaRef.current = next
      stateRef.current = 'pending'

      debounceTimerRef.current = requestAnimationFrame(() => {
        debounceTimerRef.current = null

        if (!isMountedRef.current) return

        const mediaToTransition = pendingMediaRef.current
        pendingMediaRef.current = null

        if (mediaToTransition) {
          executeTransition(mediaToTransition)
        }
      })
    },
    [getMediaId, executeTransition]
  )

  // ─────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────
  useGSAP(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false

      if (tlRef.current) {
        tlRef.current.eventCallback('onComplete', null)
        tlRef.current.kill()
        tlRef.current = null
      }
      if (debounceTimerRef.current !== null) {
        cancelAnimationFrame(debounceTimerRef.current)
      }

      // NAVIGATION FLICKER FIX: On unmount, ensure slot 0 is visible.
      // This prevents a flash when the next page mounts - CSS :first-child
      // will show slot 0, but if GSAP left it at opacity:0 mid-animation,
      // the next page would flash. Force a clean state.
      const slot0 = slotRefs.current[0]
      if (slot0) {
        slot0.style.opacity = '1'
      }
    }
  }, [])

  // ─────────────────────────────────────────────────────────────
  // REF SETTER (stable, sets initial visibility correctly)
  // ─────────────────────────────────────────────────────────────
  const setSlotRef = useCallback(
    (i: 0 | 1) => (el: HTMLDivElement | null) => {
      slotRefs.current[i] = el
      // CSS handles initial visibility via :first-child/:last-child
      // GSAP only animates transitions - no gsap.set() here to avoid
      // fighting with CSS and causing a flash on first paint
    },
    []
  )

  return {
    currentSlot,
    setSlotRef,
    slotMedia: slots,
    crossfadeTo,
    isTransitioning: stateRef.current !== 'idle',
  }
}
