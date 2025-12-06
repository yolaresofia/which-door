'use client'

import { useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

export type Media = {
  id: string | number;
  imageSrc?: string;
  videoSrc?: string;
  previewUrl?: string;
  vimeoUrl?: string;
  bgColor?: string;
  previewPoster?: string;
};

export function useCrossfadeMedia(initial: Media, opts?: { duration?: number }) {
  const D = opts?.duration ?? 0.45
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

  const [slots, setSlots] = useState<[Media | null, Media | null]>([initial, null])
  const [currentSlot, setCurrentSlot] = useState<0 | 1>(0)

  const slotRefs = useRef<[HTMLDivElement | null, HTMLDivElement | null]>([null, null])
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  const crossfadeTo = useCallback(
    (next: Media) => {
      const shown = slots[currentSlot]
      if (shown && (shown.id ?? shown.videoSrc ?? shown.imageSrc) === (next.id ?? next.videoSrc ?? next.imageSrc)) return

      const from = currentSlot
      const to = (currentSlot === 0 ? 1 : 0) as 0 | 1

      // Put next media into the hidden slot (no remount of visible slot)
      setSlots((prev) => {
        const copy: [Media | null, Media | null] = [...prev] as any
        copy[to] = next
        return copy
      })

      // Run the fade after the slot receives content on next paint
      requestAnimationFrame(() => {
        const fromEl = slotRefs.current[from]
        const toEl = slotRefs.current[to]
        if (!fromEl || !toEl) return

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
    [currentSlot, slots, D, prefersReduced]
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
