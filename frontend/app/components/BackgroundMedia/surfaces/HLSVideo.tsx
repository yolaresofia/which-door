'use client'

import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

type Props = {
  hlsSrc: string
  fallbackSrc?: string
  autoPlay: boolean
  muted: boolean
  loop?: boolean
  className?: string
  onLoadStart?: () => void
  onCanPlay?: () => void
  onPlay?: () => void
  onPlaying?: () => void
}

/**
 * HLS Video Player with adaptive bitrate streaming
 *
 * Features:
 * - Automatic quality switching based on bandwidth
 * - Safari native HLS support (no JS needed)
 * - hls.js for Chrome/Firefox/Edge
 * - Fallback to MP4 if HLS not supported
 * - Mobile-optimized with bandwidth detection
 */
export default function HLSVideo({
  hlsSrc,
  fallbackSrc,
  autoPlay,
  muted,
  loop = true,
  className = '',
  onLoadStart,
  onCanPlay,
  onPlay,
  onPlaying,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Safari has native HLS support
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

    if (isSafari && video.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('🍎 Using Safari native HLS support')
      video.src = hlsSrc

      // Attempt autoplay for Safari
      if (autoPlay) {
        const playPromise = video.play()
        if (playPromise) {
          playPromise.catch((error) => {
            console.warn('Safari autoplay blocked:', error)
          })
        }
      }
      return
    }

    // Use hls.js for other browsers
    if (Hls.isSupported()) {
      console.log('🎬 Using hls.js for HLS playback')

      const hls = new Hls({
        // Optimize for background videos
        maxBufferLength: 10, // Keep buffer small for faster start
        maxMaxBufferLength: 20,
        maxBufferSize: 5 * 1000 * 1000, // 5MB
        maxBufferHole: 0.5,

        // Enable adaptive bitrate
        abrEwmaDefaultEstimate: 500000, // Start with 500kbps estimate
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7,

        // Prioritize loading speed over quality for background videos
        startLevel: -1, // Auto-select best starting quality

        // Enable manifests with low latency
        enableWorker: true,
        lowLatencyMode: false,

        // Debug (remove in production if needed)
        debug: process.env.NODE_ENV === 'development',
      })

      hlsRef.current = hls

      // Load the HLS source
      hls.loadSource(hlsSrc)
      hls.attachMedia(video)

      // HLS Events
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ HLS manifest parsed, ready to play')

        // Mobile optimization: force lower quality on mobile
        const isMobile = window.innerWidth < 1024
        if (isMobile && hls.levels.length > 0) {
          // Find the lowest quality level (best for mobile)
          const lowestLevel = 0
          hls.currentLevel = lowestLevel
          console.log(`📱 Mobile detected, forcing quality level: ${lowestLevel}`)
        }

        if (autoPlay) {
          const playPromise = video.play()
          if (playPromise) {
            playPromise.catch((error) => {
              console.warn('HLS autoplay blocked:', error)
            })
          }
        }
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error Details:', {
          type: data.type,
          details: data.details,
          fatal: data.fatal,
          url: data.url,
          response: data.response,
          reason: data.reason,
        })

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('🔄 Fatal network error, trying to recover...')
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('🔄 Fatal media error, trying to recover...')
              hls.recoverMediaError()
              break
            default:
              console.error('💥 Unrecoverable HLS error, falling back to MP4')
              hls.destroy()
              // Use fallback MP4 if available
              if (fallbackSrc) {
                video.src = fallbackSrc
              }
              break
          }
        }
      })

      // Log quality switches (useful for debugging)
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level]
        console.log(`🎯 Quality switched to: ${level?.height}p @ ${Math.round(level?.bitrate / 1000)}kbps`)
      })

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy()
          hlsRef.current = null
        }
      }
    } else {
      // HLS not supported, use fallback MP4
      console.warn('⚠️ HLS not supported, using fallback MP4')
      if (fallbackSrc) {
        video.src = fallbackSrc
      }
    }
  }, [hlsSrc, fallbackSrc, autoPlay])

  return (
    <video
      ref={videoRef}
      className={`${className} object-cover`}
      muted={muted}
      loop={loop}
      playsInline
      preload="auto"
      autoPlay={autoPlay}
      onLoadStart={onLoadStart}
      onCanPlay={onCanPlay}
      onPlay={onPlay}
      onPlaying={onPlaying}
    />
  )
}
