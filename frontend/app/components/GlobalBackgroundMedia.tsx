'use client'

import { useRef, useEffect, useCallback, memo } from 'react'
import { useBackgroundMediaOptional, type Media } from '../context/BackgroundMediaContext'

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO SLOT COMPONENT
// Renders a single video element with iOS Safari optimizations
// ─────────────────────────────────────────────────────────────────────────────

type VideoSlotProps = {
  media: Media | null
  slotIndex: 0 | 1
  onReady: (slotIndex: 0 | 1) => void
}

const VideoSlot = memo(function VideoSlot({ media, slotIndex, onReady }: VideoSlotProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const isMountedRef = useRef(true)
  const hasSignaledReadyRef = useRef(false)

  // Detect mobile for using lower quality video
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
  const videoSrc = isMobile && media?.mobilePreviewUrl
    ? media.mobilePreviewUrl
    : media?.previewUrl || media?.videoSrc

  // Reset ready signal when media changes
  useEffect(() => {
    hasSignaledReadyRef.current = false
  }, [media?.id])

  // Signal ready immediately for color-only backgrounds (no video)
  useEffect(() => {
    if (media && !videoSrc && !hasSignaledReadyRef.current) {
      hasSignaledReadyRef.current = true
      onReady(slotIndex)
    }
  }, [media, videoSrc, onReady, slotIndex])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      const video = videoRef.current
      if (video) {
        try {
          video.pause()
          video.removeAttribute('src')
          video.load()
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }, [])

  // Force load on iOS Safari
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoSrc) return
    video.load()
  }, [videoSrc])

  const handleCanPlay = useCallback(() => {
    const video = videoRef.current
    if (!video || !isMountedRef.current) return
    video.play().catch(() => {})
    // Signal ready only once per media
    if (!hasSignaledReadyRef.current) {
      hasSignaledReadyRef.current = true
      onReady(slotIndex)
    }
  }, [onReady, slotIndex])

  // Color-only background (no video)
  if (!media || !videoSrc) {
    return (
      <div
        className="absolute inset-0"
        style={{ backgroundColor: media?.bgColor || '#000' }}
      />
    )
  }

  return (
    <div
      className="absolute inset-0"
      style={{ backgroundColor: media.bgColor || '#000' }}
    >
      <video
        ref={videoRef}
        key={videoSrc}
        className="absolute inset-0 w-full h-full object-cover"
        src={videoSrc}
        muted
        loop
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        controls={false}
        preload="auto"
        autoPlay
        onCanPlay={handleCanPlay}
        // Poster-first strategy for iOS: show poster while video loads
        poster={media.previewPoster}
      />
    </div>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL BACKGROUND MEDIA
// Persistent component that lives in layout - NEVER unmounts on navigation
// ─────────────────────────────────────────────────────────────────────────────

export default function GlobalBackgroundMedia() {
  const ctx = useBackgroundMediaOptional()

  // If no context (SSR or not wrapped), render nothing
  if (!ctx) return null

  const { _internal } = ctx
  const { slots, setSlotRef, onVideoReady } = _internal

  return (
    <div
      data-global-bg
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        backgroundColor: '#000',
        // Stacking context for compositing
        isolation: 'isolate',
        overflow: 'hidden',
        // CSS containment for performance
        contain: 'layout style paint',
      }}
    >
      {/* Slot 0 - visible by default via inline style */}
      <div
        ref={setSlotRef(0)}
        data-global-slot="0"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 1, // CSS-first: visible on first paint
        }}
      >
        {slots[0] && <VideoSlot media={slots[0]} slotIndex={0} onReady={onVideoReady} />}
      </div>

      {/* Slot 1 - hidden by default via inline style */}
      <div
        ref={setSlotRef(1)}
        data-global-slot="1"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0, // CSS-first: hidden on first paint
        }}
      >
        {slots[1] && <VideoSlot media={slots[1]} slotIndex={1} onReady={onVideoReady} />}
      </div>
    </div>
  )
}
