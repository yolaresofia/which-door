'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { useCrossfadeMedia, type Media } from './useCrossfadeMedia'
import { CrossfadeBackground } from '../components/BackgroundMedia'

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------
type VideoMode = 'background' | 'hidden'

type GlobalVideoContextValue = {
  /** Crossfade to a new background video */
  setVideo: (media: Media) => void
  /** Alias — crossfade to a new video (same as setVideo) */
  crossfadeTo: (media: Media) => void
  /** Switch between visible background and hidden (for project detail pages) */
  setMode: (mode: VideoMode) => void
  /** Current mode */
  mode: VideoMode
  /** The media currently being shown / transitioned to */
  currentMedia: Media | null
  /** Whether the active video slot has started playing */
  videoReady: boolean
  /** Manually mark video as ready (used internally by CrossfadeBackground) */
  markReady: () => void
}

const GlobalVideoContext = createContext<GlobalVideoContextValue | null>(null)

// ---------------------------------------------------------------------------
// Default blank media to initialise crossfade before any page mounts
// ---------------------------------------------------------------------------
const BLANK_MEDIA: Media = {
  id: '__blank',
  videoSrc: '',
  previewUrl: '',
  bgColor: '#000',
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function GlobalVideoProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<VideoMode>('background')
  const [videoReady, setVideoReady] = useState(false)
  const readyRef = useRef(false)

  // Current media tracking (so pages can read what's showing)
  const currentMediaRef = useRef<Media | null>(null)
  const [currentMedia, setCurrentMedia] = useState<Media | null>(null)

  const {
    setSlotRef,
    slotMedia,
    crossfadeTo: internalCrossfade,
  } = useCrossfadeMedia(BLANK_MEDIA, { duration: 0.45 })

  // Mark video ready — called by CrossfadeBackground's onVideoReady
  const markReady = useCallback(() => {
    if (readyRef.current) return
    readyRef.current = true
    setVideoReady(true)
  }, [])

  // Set video: crossfade to new media + reset ready state
  // Used on page mount to declare the page's initial video
  const setVideo = useCallback(
    (media: Media) => {
      // Skip if same media already showing
      const cur = currentMediaRef.current
      if (cur && cur.id === media.id) return

      currentMediaRef.current = media
      setCurrentMedia(media)

      // Reset video ready for the incoming video
      readyRef.current = false
      setVideoReady(false)

      internalCrossfade(media)
    },
    [internalCrossfade]
  )

  // crossfadeTo: swap video without resetting videoReady
  // Used for hover-to-crossfade where content is already visible
  const crossfadeTo = useCallback(
    (media: Media) => {
      currentMediaRef.current = media
      setCurrentMedia(media)
      internalCrossfade(media)
    },
    [internalCrossfade]
  )

  const value: GlobalVideoContextValue = {
    setVideo,
    crossfadeTo,
    setMode,
    mode,
    currentMedia,
    videoReady,
    markReady,
  }

  return (
    <GlobalVideoContext.Provider value={value}>
      {/* Persistent crossfade background — never unmounts */}
      <div
        className="fixed inset-0 z-0"
        style={{
          opacity: mode === 'hidden' ? 0 : 1,
          pointerEvents: mode === 'hidden' ? 'none' : 'auto',
          transition: 'opacity 0.4s ease-out',
        }}
      >
        <CrossfadeBackground
          slotMedia={slotMedia}
          setSlotRef={setSlotRef}
          onVideoReady={markReady}
          disablePointerEvents
        />
      </div>

      {children}
    </GlobalVideoContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useGlobalVideo(): GlobalVideoContextValue {
  const ctx = useContext(GlobalVideoContext)
  if (!ctx) {
    throw new Error('useGlobalVideo must be used within <GlobalVideoProvider>')
  }
  return ctx
}
