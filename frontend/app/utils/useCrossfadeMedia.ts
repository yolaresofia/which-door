'use client'

import { useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

export type Media = {
  id: string | number;
  imageSrc?: string;
  videoSrc?: string;
  previewUrl?: string;
  hlsUrl?: string; // HLS (.m3u8) URL for adaptive streaming
  vimeoUrl?: string;
  bgColor?: string;
  previewPoster?: string;
  previewPosterLQIP?: string; // Low Quality Image Placeholder
};

export function useCrossfadeMedia(initial: Media, opts?: { duration?: number, waitForLoad?: boolean }) {
  const D = opts?.duration ?? 0.45
  const waitForLoad = opts?.waitForLoad ?? true // Wait for video load by default
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

  const [slots, setSlots] = useState<[Media | null, Media | null]>([initial, null])
  const [currentSlot, setCurrentSlot] = useState<0 | 1>(0)

  const slotRefs = useRef<[HTMLDivElement | null, HTMLDivElement | null]>([null, null])
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  /**
   * Wait for video element in the target slot to be ready to play
   */
  const waitForVideoReady = useCallback((slotEl: HTMLDivElement): Promise<void> => {
    return new Promise((resolve) => {
      try {
        // Find video element in the slot
        const videoEl = slotEl.querySelector('video')
        if (!videoEl) {
          // No video found, resolve immediately
          resolve()
          return
        }

        // Check if video is already ready
        if (videoEl.readyState >= 3) { // HAVE_FUTURE_DATA or higher
          console.log('✅ Video already loaded')
          resolve()
          return
        }

        console.log('⏳ Waiting for video to load...')

        let resolved = false
        let timeoutId: NodeJS.Timeout | null = null

        const handleReady = () => {
          if (resolved) return
          resolved = true
          cleanup()
          console.log('✅ Video ready to play')
          resolve()
        }

        const cleanup = () => {
          videoEl.removeEventListener('canplay', handleReady)
          videoEl.removeEventListener('loadeddata', handleReady)
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
        }

        // Listen for video ready events
        videoEl.addEventListener('canplay', handleReady, { once: true })
        videoEl.addEventListener('loadeddata', handleReady, { once: true })

        // Safety timeout: proceed after 3 seconds even if video isn't ready
        timeoutId = setTimeout(() => {
          if (resolved) return
          console.log('⏰ Video load timeout, proceeding with crossfade')
          handleReady()
        }, 3000)

      } catch (error) {
        console.warn('Error waiting for video:', error)
        resolve() // Resolve anyway to prevent blocking
      }
    })
  }, [])

  const crossfadeTo = useCallback(
    (next: Media) => {
      const shown = slots[currentSlot]
      if (shown && (shown.id ?? shown.videoSrc ?? shown.imageSrc) === (next.id ?? next.videoSrc ?? next.imageSrc)) return

      const from = currentSlot
      const to = (currentSlot === 0 ? 1 : 0) as 0 | 1

      // CRITICAL: Cancel any in-flight animations before starting new transition
      if (tlRef.current) {
        tlRef.current.kill()
        tlRef.current = null
      }

      // Put next media into the hidden slot (no remount of visible slot)
      setSlots((prev) => {
        const copy: [Media | null, Media | null] = [...prev] as any
        copy[to] = next
        return copy
      })

      // Run the fade after the slot receives content on next paint
      requestAnimationFrame(async () => {
        const fromEl = slotRefs.current[from]
        const toEl = slotRefs.current[to]
        if (!fromEl || !toEl) return

        // Wait for video to load if enabled
        if (waitForLoad) {
          await waitForVideoReady(toEl)
        }

        // Kill in-flight tweens and set start states
        gsap.killTweensOf([fromEl, toEl])
        gsap.set(toEl, { autoAlpha: 0, scale: 1.01 })

        if (prefersReduced) {
          gsap.set(fromEl, { autoAlpha: 0 })
          gsap.set(toEl, { autoAlpha: 1, scale: 1 })
          setCurrentSlot(to)
          // Optionally free the old slot's media
          setSlots((prev) => {
            const copy: [Media | null, Media | null] = [...prev] as any
            copy[from] = null
            return copy
          })
          return
        }

        const tl = gsap.timeline({ defaults: { overwrite: 'auto', ease: 'power2.out' } })
        tl.to(toEl,   { autoAlpha: 1, scale: 1, duration: D }, 0)
          .to(fromEl, { autoAlpha: 0,           duration: D }, 0)
          .add(() => {
            setCurrentSlot(to)
            // Free the now-hidden slot's media to save decode/CPU
            setSlots((prev) => {
              const copy: [Media | null, Media | null] = [...prev] as any
              copy[from] = null
              return copy
            })
          })

        tlRef.current = tl
      })
    },
    [currentSlot, slots, D, prefersReduced, waitForLoad, waitForVideoReady]
  )

  useGSAP(() => {
    return () => {
      tlRef.current?.kill();
    };
  }, [])

  return {
    // which slot is visible
    currentSlot,
    // assign these to your two absolutely stacked wrappers
    setSlotRef: (i: 0 | 1) => (el: HTMLDivElement | null) => (slotRefs.current[i] = el),
    // the media in each slot
    slotMedia: slots,
    // call to request a new background
    crossfadeTo,
  }
}
