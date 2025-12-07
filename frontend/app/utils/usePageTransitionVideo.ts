'use client'

import { useEffect, useCallback, useRef } from 'react'

export interface VideoState {
  id: string | number
  videoSrc: string
  previewUrl?: string
  vimeoUrl?: string
  previewPoster?: string
  bgColor?: string
  timestamp: number
}

const VIDEO_STORAGE_KEY = '__pageTransitionVideo'
const VIDEO_EXPIRY_MS = 5000 // Video state expires after 5 seconds

/**
 * Hook to manage video state across page transitions
 *
 * This enables smooth video crossfades when navigating between pages:
 * - On navigation start: saves current video state to sessionStorage
 * - On page mount: retrieves previous video state and crossfades to new video
 */
export function usePageTransitionVideo() {
  const hasProcessedRef = useRef(false)

  /**
   * Save current video state before navigating away
   * Call this in your fadeOutAndNavigate function
   */
  const saveVideoState = useCallback((videoState: Omit<VideoState, 'timestamp'>) => {
    if (typeof window === 'undefined') return

    const stateWithTimestamp: VideoState = {
      ...videoState,
      timestamp: Date.now()
    }

    try {
      sessionStorage.setItem(VIDEO_STORAGE_KEY, JSON.stringify(stateWithTimestamp))
    } catch (error) {
      // ignore storage errors
    }
  }, [])

  /**
   * Retrieve previous page's video state (if available and not expired)
   * Returns null if no state exists or if it has expired
   */
  const getPreviousVideoState = useCallback((): VideoState | null => {
    if (typeof window === 'undefined') return null
    if (hasProcessedRef.current) return null // Only process once per mount

    try {
      const stored = sessionStorage.getItem(VIDEO_STORAGE_KEY)
      if (!stored) return null

      const state: VideoState = JSON.parse(stored)
      const age = Date.now() - state.timestamp

      // Check if state has expired
      if (age > VIDEO_EXPIRY_MS) {
        sessionStorage.removeItem(VIDEO_STORAGE_KEY)
        return null
      }

      hasProcessedRef.current = true

      // Clear the state immediately after reading to prevent reuse
      sessionStorage.removeItem(VIDEO_STORAGE_KEY)

      return state
    } catch (error) {
      return null
    }
  }, [])

  /**
   * Clear stored video state
   * Useful for cleanup or when navigating in unexpected ways
   */
  const clearVideoState = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      sessionStorage.removeItem(VIDEO_STORAGE_KEY)
    } catch (error) {
      // ignore storage errors
    }
  }, [])

  // Auto-cleanup on unmount (safety measure)
  useEffect(() => {
    return () => {
      // Don't clear here - we want the state to persist for the next page
    }
  }, [])

  return {
    saveVideoState,
    getPreviousVideoState,
    clearVideoState,
  }
}
