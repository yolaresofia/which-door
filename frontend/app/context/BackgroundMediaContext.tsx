'use client'

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { gsap } from 'gsap'
import { getCrossfadeConfig, getIsReducedMotion, getIsMobile } from '../utils/animationConfig'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

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

type BackgroundMediaContextType = {
  /** Set the background media. Crossfades smoothly from current. */
  setBackground: (media: Media) => void
  /** Current visible media (for reading) */
  currentMedia: Media | null
  /** Whether a crossfade is in progress */
  isTransitioning: boolean
  /** Slot refs and media for rendering - used by GlobalBackgroundMedia */
  _internal: {
    slots: [Media | null, Media | null]
    setSlotRef: (i: 0 | 1) => (el: HTMLDivElement | null) => void
    /** Signal that a video in a slot is ready to play */
    onVideoReady: (slotIndex: 0 | 1) => void
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

const BackgroundMediaContext = createContext<BackgroundMediaContextType | null>(null)

export function useBackgroundMedia() {
  const ctx = useContext(BackgroundMediaContext)
  if (!ctx) {
    throw new Error('useBackgroundMedia must be used within BackgroundMediaProvider')
  }
  return ctx
}

/** Optional version that returns null if not in provider */
export function useBackgroundMediaOptional() {
  return useContext(BackgroundMediaContext)
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

type ProviderProps = {
  children: ReactNode
  /** Initial media to show (optional - can be set by first page) */
  initialMedia?: Media
}

export function BackgroundMediaProvider({ children, initialMedia }: ProviderProps) {
  const isMobile = getIsMobile()
  const config = getCrossfadeConfig(isMobile)
  const D = config.duration

  // ─────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────
  const [slots, setSlots] = useState<[Media | null, Media | null]>([initialMedia ?? null, null])

  // ─────────────────────────────────────────────────────────────
  // REFS
  // ─────────────────────────────────────────────────────────────
  const slotRefs = useRef<[HTMLDivElement | null, HTMLDivElement | null]>([null, null])
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const visibleSlotRef = useRef<0 | 1>(0)
  const stateRef = useRef<TransitionState>('idle')
  const pendingMediaRef = useRef<Media | null>(null)
  const visibleMediaIdRef = useRef<string | number | null>(initialMedia?.id ?? null)
  const debounceTimerRef = useRef<number | null>(null)
  // Track which slot we're waiting for video ready
  const waitingForSlotRef = useRef<0 | 1 | null>(null)
  const pendingTransitionRef = useRef<{ next: Media; from: 0 | 1; to: 0 | 1 } | null>(null)

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────
  const getMediaId = useCallback((media: Media | null): string | number | null => {
    if (!media) return null
    return media.id ?? media.videoSrc ?? media.previewUrl ?? null
  }, [])

  // ─────────────────────────────────────────────────────────────
  // CORE: Run the crossfade animation (called after video is ready)
  // ─────────────────────────────────────────────────────────────
  const runCrossfade = useCallback(
    (next: Media, from: 0 | 1, to: 0 | 1) => {
      const nextId = getMediaId(next)
      const prefersReduced = getIsReducedMotion()

      const freshToEl = slotRefs.current[to]
      const freshFromEl = slotRefs.current[from]

      if (!freshToEl || !freshFromEl) {
        stateRef.current = 'idle'
        waitingForSlotRef.current = null
        pendingTransitionRef.current = null
        return
      }

      // Check for newer pending request before animating
      if (pendingMediaRef.current && getMediaId(pendingMediaRef.current) !== nextId) {
        const newer = pendingMediaRef.current
        pendingMediaRef.current = null
        waitingForSlotRef.current = null
        pendingTransitionRef.current = null
        stateRef.current = 'pending'
        executeTransition(newer)
        return
      }

      stateRef.current = 'animating'
      waitingForSlotRef.current = null
      pendingTransitionRef.current = null

      // Reduced motion: instant switch
      if (prefersReduced) {
        gsap.set(freshFromEl, { opacity: 0 })
        gsap.set(freshToEl, { opacity: 1 })
        visibleSlotRef.current = to
        visibleMediaIdRef.current = nextId

        requestAnimationFrame(() => {
          setSlots((prev) => {
            const copy: [Media | null, Media | null] = [...prev]
            copy[from] = null
            return copy
          })
        })

        stateRef.current = 'idle'
        return
      }

      // Animated crossfade
      const tl = gsap.timeline({
        defaults: { overwrite: 'auto' },
        onComplete: () => {
          if (tlRef.current === tl) {
            visibleSlotRef.current = to
            visibleMediaIdRef.current = nextId

            requestAnimationFrame(() => {
              setSlots((prev) => {
                const copy: [Media | null, Media | null] = [...prev]
                copy[from] = null
                return copy
              })
            })

            tlRef.current = null
            stateRef.current = 'idle'

            // Process pending
            if (pendingMediaRef.current) {
              const pending = pendingMediaRef.current
              pendingMediaRef.current = null
              setBackground(pending)
            }
          }
        },
      })

      // Fade in new slot
      tl.to(freshToEl, {
        opacity: 1,
        duration: D * 0.6,
        ease: 'power2.out',
      })

      // Fade out old slot (overlapping)
      tl.to(
        freshFromEl,
        {
          opacity: 0,
          duration: D * 0.5,
          ease: 'power2.in',
        },
        D * 0.3
      )

      tlRef.current = tl
    },
    [D, getMediaId]
  )

  // ─────────────────────────────────────────────────────────────
  // CORE: Execute crossfade animation (prepares slots, waits for video)
  // ─────────────────────────────────────────────────────────────
  const executeTransition = useCallback(
    async (next: Media) => {
      const nextId = getMediaId(next)

      // Already showing this media
      if (visibleMediaIdRef.current === nextId) {
        stateRef.current = 'idle'
        return
      }

      const from = visibleSlotRef.current
      const to = (from === 0 ? 1 : 0) as 0 | 1

      // Kill existing animation
      if (tlRef.current) {
        tlRef.current.eventCallback('onComplete', null)
        tlRef.current.kill()
        tlRef.current = null
      }

      const fromEl = slotRefs.current[from]
      const toEl = slotRefs.current[to]

      if (fromEl) gsap.killTweensOf(fromEl)
      if (toEl) gsap.killTweensOf(toEl)

      // ─────────────────────────────────────────────────────────────
      // FIRST MEDIA EVER: No crossfade needed, just show immediately in slot 0
      // ─────────────────────────────────────────────────────────────
      if (visibleMediaIdRef.current === null) {
        // Put media directly in slot 0 and make it visible
        setSlots((prev) => {
          const copy: [Media | null, Media | null] = [...prev]
          copy[0] = next
          return copy
        })
        visibleSlotRef.current = 0
        visibleMediaIdRef.current = nextId
        stateRef.current = 'idle'

        // Ensure slot 0 is visible
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve())
          })
        })
        const slot0El = slotRefs.current[0]
        if (slot0El) {
          gsap.set(slot0El, { opacity: 1 })
        }
        return
      }

      // ─────────────────────────────────────────────────────────────
      // CROSSFADE: Normal transition between two media
      // ─────────────────────────────────────────────────────────────

      // Ensure from slot is visible
      if (fromEl) {
        gsap.set(fromEl, { opacity: 1 })
      }

      // Load new media into target slot
      setSlots((prev) => {
        const copy: [Media | null, Media | null] = [...prev]
        copy[to] = next
        return copy
      })

      // Wait for React commit
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve())
        })
      })

      const freshToEl = slotRefs.current[to]
      const freshFromEl = slotRefs.current[from]

      if (!freshToEl || !freshFromEl) {
        stateRef.current = 'idle'
        return
      }

      // Ensure to slot starts hidden
      gsap.set(freshToEl, { opacity: 0 })

      // Check for newer pending request
      if (pendingMediaRef.current && getMediaId(pendingMediaRef.current) !== nextId) {
        const newer = pendingMediaRef.current
        pendingMediaRef.current = null
        stateRef.current = 'pending'
        executeTransition(newer)
        return
      }

      // Store transition info and wait for video ready callback
      // The video slot will call onVideoReady when canplay fires
      waitingForSlotRef.current = to
      pendingTransitionRef.current = { next, from, to }

      // Safety timeout: if video doesn't load in 2s, proceed anyway
      // This prevents getting stuck if video fails to load
      const timeoutId = setTimeout(() => {
        if (waitingForSlotRef.current === to && pendingTransitionRef.current) {
          runCrossfade(next, from, to)
        }
      }, 2000)

      // Store timeout so we can clear it when video is ready
      ;(pendingTransitionRef.current as any)._timeoutId = timeoutId
    },
    [getMediaId, runCrossfade]
  )

  // ─────────────────────────────────────────────────────────────
  // Called by GlobalBackgroundMedia when video in slot is ready
  // ─────────────────────────────────────────────────────────────
  const onVideoReady = useCallback(
    (slotIndex: 0 | 1) => {
      // Only proceed if we're waiting for this specific slot
      if (waitingForSlotRef.current !== slotIndex || !pendingTransitionRef.current) {
        return
      }

      const { next, from, to } = pendingTransitionRef.current

      // Clear safety timeout
      const timeoutId = (pendingTransitionRef.current as any)?._timeoutId
      if (timeoutId) clearTimeout(timeoutId)

      // Run the crossfade now that video is ready
      runCrossfade(next, from, to)
    },
    [runCrossfade]
  )

  // ─────────────────────────────────────────────────────────────
  // PUBLIC: setBackground (debounced, last-intent wins)
  // ─────────────────────────────────────────────────────────────
  const setBackground = useCallback(
    (next: Media) => {
      const nextId = getMediaId(next)

      // Skip if already showing
      if (visibleMediaIdRef.current === nextId) return
      if (pendingMediaRef.current && getMediaId(pendingMediaRef.current) === nextId) return

      // Clear debounce timer
      if (debounceTimerRef.current !== null) {
        cancelAnimationFrame(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      // If animating, queue as pending
      if (stateRef.current === 'animating') {
        pendingMediaRef.current = next
        return
      }

      // Debounce by one frame
      pendingMediaRef.current = next
      stateRef.current = 'pending'

      debounceTimerRef.current = requestAnimationFrame(() => {
        debounceTimerRef.current = null
        const media = pendingMediaRef.current
        pendingMediaRef.current = null
        if (media) {
          executeTransition(media)
        }
      })
    },
    [getMediaId, executeTransition]
  )

  // ─────────────────────────────────────────────────────────────
  // REF SETTER
  // ─────────────────────────────────────────────────────────────
  const setSlotRef = useCallback(
    (i: 0 | 1) => (el: HTMLDivElement | null) => {
      slotRefs.current[i] = el
    },
    []
  )

  // ─────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────────────────────────────────────
  const value: BackgroundMediaContextType = {
    setBackground,
    currentMedia: slots[visibleSlotRef.current],
    isTransitioning: stateRef.current !== 'idle',
    _internal: {
      slots,
      setSlotRef,
      onVideoReady,
    },
  }

  return (
    <BackgroundMediaContext.Provider value={value}>
      {children}
    </BackgroundMediaContext.Provider>
  )
}
