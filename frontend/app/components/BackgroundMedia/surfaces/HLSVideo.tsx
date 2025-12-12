'use client'

import { useEffect, useRef, useState } from 'react'
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
 * - Handles source changes without remounting
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
  const [currentSrc, setCurrentSrc] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const retryCountRef = useRef<number>(0)
  const maxRetries = 3

  // Detect mobile on mount
  useEffect(() => {
    setIsMobile(window.innerWidth < 1024)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // If source hasn't changed, don't reinitialize
    if (currentSrc === hlsSrc && hlsRef.current) {
      console.log('🔄 HLS source unchanged, skipping reload')
      return
    }

    console.log('🎬 Loading new HLS source:', hlsSrc)
    setCurrentSrc(hlsSrc)

    // Safari has native HLS support
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

    if (isSafari && video.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('🍎 Using Safari native HLS support')

      // Clean up any existing hls.js instance
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }

      video.src = hlsSrc

      // Track native video errors
      const handleVideoError = () => {
        const error = video.error
        if (error) {
          const errorMsg = `Safari HLS Error (code ${error.code}): ${error.message}`
          console.error(errorMsg)
          setError(errorMsg)

          // Try fallback on error
          if (fallbackSrc) {
            console.log('🔄 Falling back to MP4')
            video.src = fallbackSrc
            setError(null)
          }
        }
      }

      video.addEventListener('error', handleVideoError)

      // Attempt autoplay for Safari
      if (autoPlay) {
        const playPromise = video.play()
        if (playPromise) {
          playPromise.catch((error) => {
            console.warn('Safari autoplay blocked:', error)
            setError(`Autoplay blocked: ${error.message}`)
          })
        }
      }

      return () => {
        video.removeEventListener('error', handleVideoError)
      }
    }

    // Use hls.js for other browsers
    if (Hls.isSupported()) {
      console.log('🎬 Using hls.js for HLS playback')

      // Destroy existing instance if changing sources
      if (hlsRef.current) {
        console.log('🧹 Cleaning up previous hls.js instance')
        hlsRef.current.destroy()
        hlsRef.current = null
      }

      const isMobile = window.innerWidth < 1024

      const hls = new Hls({
        // INCREASED buffer sizes for stability
        maxBufferLength: isMobile ? 20 : 30, // Mobile: 20s, Desktop: 30s
        maxMaxBufferLength: isMobile ? 40 : 60, // Mobile: 40s, Desktop: 60s
        maxBufferSize: isMobile ? 30 * 1000 * 1000 : 60 * 1000 * 1000, // Mobile: 30MB, Desktop: 60MB
        maxBufferHole: 0.5,

        // Enable adaptive bitrate
        abrEwmaDefaultEstimate: isMobile ? 1000000 : 2000000, // Mobile: 1Mbps, Desktop: 2Mbps estimate
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7,

        // Auto-select best starting quality
        startLevel: -1,

        // Enable workers for better performance
        enableWorker: true,
        lowLatencyMode: false,

        // Backoff settings for retry
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 4,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 4,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,

        // Debug in development
        debug: process.env.NODE_ENV === 'development',
      })

      hlsRef.current = hls

      // Load the HLS source
      hls.loadSource(hlsSrc)
      hls.attachMedia(video)

      // HLS Events
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ HLS manifest parsed, ready to play')
        retryCountRef.current = 0 // Reset retry count on success

        // Mobile optimization: force lower quality on mobile
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
        const errorInfo = {
          type: data.type,
          details: data.details,
          fatal: data.fatal,
          url: data.url,
          response: data.response,
          reason: data.reason,
          retryCount: retryCountRef.current,
        }

        console.error('HLS Error Details:', errorInfo)

        // Set error message for mobile UI
        if (data.fatal) {
          setError(`HLS ${data.type}: ${data.details} (Retry ${retryCountRef.current}/${maxRetries})`)
        }

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('🔄 Fatal network error, trying to recover...')

              if (retryCountRef.current < maxRetries) {
                retryCountRef.current++
                const backoffDelay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 5000)
                console.log(`⏳ Retrying in ${backoffDelay}ms (attempt ${retryCountRef.current}/${maxRetries})`)

                setTimeout(() => {
                  if (hlsRef.current) {
                    hls.startLoad()
                  }
                }, backoffDelay)
              } else {
                console.error('💥 Max retries reached, falling back to MP4')
                setError('Network error: Max retries. Using fallback.')
                hls.destroy()
                if (fallbackSrc) {
                  video.src = fallbackSrc
                  setError(null) // Clear error on fallback
                } else {
                  setError('Network error: No fallback available')
                }
                retryCountRef.current = 0
              }
              break

            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('🔄 Fatal media error, trying to recover...')

              if (retryCountRef.current < maxRetries) {
                retryCountRef.current++
                hls.recoverMediaError()
              } else {
                console.error('💥 Max media error retries reached, falling back to MP4')
                setError('Media error: Max retries. Using fallback.')
                hls.destroy()
                if (fallbackSrc) {
                  video.src = fallbackSrc
                  setError(null) // Clear error on fallback
                } else {
                  setError('Media error: No fallback available')
                }
                retryCountRef.current = 0
              }
              break

            default:
              console.error('💥 Unrecoverable HLS error, falling back to MP4')
              setError(`Unrecoverable error: ${data.details}`)
              hls.destroy()
              if (fallbackSrc) {
                video.src = fallbackSrc
                setError(null) // Clear error on fallback
              } else {
                setError(`Fatal error: ${data.details}. No fallback.`)
              }
              retryCountRef.current = 0
              break
          }
        }
      })

      // Log quality switches (useful for debugging)
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level]
        console.log(`🎯 Quality switched to: ${level?.height}p @ ${Math.round(level?.bitrate / 1000)}kbps`)
      })

      // Log buffer events for debugging
      if (process.env.NODE_ENV === 'development') {
        hls.on(Hls.Events.BUFFER_APPENDED, () => {
          const buffered = video.buffered
          if (buffered.length > 0) {
            const bufferEnd = buffered.end(buffered.length - 1)
            const bufferLength = bufferEnd - video.currentTime
            console.log(`📊 Buffer: ${bufferLength.toFixed(1)}s`)
          }
        })
      }

      return () => {
        if (hlsRef.current) {
          console.log('🧹 Cleaning up HLS instance')
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
  }, [hlsSrc, fallbackSrc, autoPlay, currentSrc])

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className={`${className} object-cover`}
        muted={muted}
        loop={loop}
        playsInline
        preload="auto"
        autoPlay={autoPlay}
        data-hls-video="true"
        onLoadStart={onLoadStart}
        onCanPlay={onCanPlay}
        onPlay={onPlay}
        onPlaying={onPlaying}
      />

      {/* Mobile Error UI */}
      {error && isMobile && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 text-white p-4 text-sm font-mono z-50">
          <div className="font-bold mb-1">⚠️ Video Error (Mobile)</div>
          <div className="text-xs opacity-90">{error}</div>
          <div className="text-xs opacity-75 mt-2">
            URL: {hlsSrc.split('/').pop()}
          </div>
          {fallbackSrc && (
            <div className="text-xs opacity-75">
              Fallback: {fallbackSrc.split('/').pop()}
            </div>
          )}
        </div>
      )}

      {/* Desktop Error UI (less obtrusive) */}
      {error && !isMobile && (
        <div className="absolute top-4 right-4 bg-red-600/80 text-white px-3 py-2 text-xs font-mono rounded z-50 max-w-xs">
          <div className="font-bold">⚠️ Video Error</div>
          <div className="opacity-90 mt-1">{error}</div>
        </div>
      )}
    </div>
  )
}
