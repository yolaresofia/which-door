// utils/useVideoReady.ts
// Hook to coordinate content reveal with video loading
import { useState, useEffect, useCallback, useRef } from 'react'

type VideoReadyOptions = {
  /** Timeout in ms before forcing ready state (prevents infinite loading) */
  timeout?: number
  /** Whether to skip waiting (e.g., for pages without video) */
  skip?: boolean
}

/**
 * Hook that tracks when a video is ready to play.
 * Use this to delay content animations until the background video has loaded.
 *
 * @example
 * const { isReady, markReady } = useVideoReady({ timeout: 3000 })
 *
 * // In BackgroundMedia, call markReady when video starts
 * // In content, wait for isReady before starting animations
 */
export function useVideoReady(options: VideoReadyOptions = {}) {
  const { timeout = 3000, skip = false } = options

  const [isReady, setIsReady] = useState(skip)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const markedRef = useRef(false)

  // Mark video as ready (called by video component)
  const markReady = useCallback(() => {
    if (markedRef.current) return
    markedRef.current = true

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setIsReady(true)
  }, [])

  // Reset ready state (useful for page transitions)
  const reset = useCallback(() => {
    markedRef.current = false
    setIsReady(skip)
  }, [skip])

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (skip || isReady) return

    timeoutRef.current = setTimeout(() => {
      if (!markedRef.current) {
        markedRef.current = true
        setIsReady(true)
      }
    }, timeout)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [skip, timeout, isReady])

  return { isReady, markReady, reset }
}
