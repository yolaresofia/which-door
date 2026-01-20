'use client'

import { useRef, useEffect, useState } from 'react'
import { fmt } from "./utils";
import { useSequencedReveal } from '@/app/utils/useSequencedReveal'
import { REVEAL_HIDDEN_STYLE } from '@/app/utils/useRevealAnimation'

type Props = {
  title?: string;
  subtitle?: string;
  playing: boolean;
  current: number;
  remaining: number;
  progressPct: number;
  muted: boolean;
  onTogglePlay: () => void;
  onSeekRatio: (ratio: number) => void;
  onToggleMute: () => void;
  onShare?: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isVideoReady?: boolean; // New prop to wait for video before animating
};

export default function ControlsDesktop(props: Props) {
  const {
    title, subtitle, playing, current, remaining, progressPct,
    muted, onTogglePlay, onSeekRatio, onToggleMute, onShare,
    isFullscreen, onToggleFullscreen, isVideoReady = false
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [shareState, setShareState] = useState<'share' | 'copied'>('share')
  const shareResetRef = useRef<number | null>(null)

  // Desktop animation - matches ProjectsLanding style
  const { start } = useSequencedReveal(containerRef, {
    target: '[data-reveal]',
    duration: 0.8,
    ease: 'power2.out',
    from: { opacity: 0, y: 20, scale: 0.98 },
    to: { opacity: 1, y: 0, scale: 1 },
    autoStart: false,
    stagger: {
      each: 0.08,
      from: 'start',
      ease: 'power2.inOut'
    },
  })

  // Elements are hidden via inline styles (REVEAL_HIDDEN_STYLE) to prevent FOUC
  // No useLayoutEffect needed - inline styles are applied synchronously during render

  // Start animation when video is ready
  useEffect(() => {
    if (!isVideoReady) return

    // Use RAF to ensure DOM is fully ready after state update
    const rafId = requestAnimationFrame(() => {
      start()
    })

    return () => cancelAnimationFrame(rafId)
  }, [isVideoReady, start])

  useEffect(() => {
    return () => {
      if (shareResetRef.current) {
        window.clearTimeout(shareResetRef.current)
        shareResetRef.current = null
      }
    }
  }, [])

  const handleBarClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeekRatio((e.clientX - rect.left) / rect.width);
  };

  const handleShareClick = () => {
    if (shareResetRef.current) {
      window.clearTimeout(shareResetRef.current)
      shareResetRef.current = null
    }
    setShareState('copied')
    shareResetRef.current = window.setTimeout(() => {
      setShareState('share')
      shareResetRef.current = null
    }, 2000)
    onShare?.()
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 hidden text-white md:block"
      data-touch-toggle-ignore
    >
      <div className="mx-auto px-6 md:px-12 flex flex-wrap items-start justify-between gap-4">
        <div
          className="mr-4 min-w-0"
          data-reveal
          style={REVEAL_HIDDEN_STYLE}
        >
          {title && <div className="text-base font-semibold leading-tight sm:text-2xl max-w-2xs">{title}</div>}
          {subtitle && <div className="text-white/85 truncate text-base">{subtitle}</div>}
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-6">
          <div data-reveal style={REVEAL_HIDDEN_STYLE} className="shrink-0">
            <button
              onClick={onTogglePlay}
              aria-label={playing ? "Pause" : "Play"}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              {playing ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
          <div
            data-reveal
            style={REVEAL_HIDDEN_STYLE}
            className="tabular-nums shrink-0 text-sm"
          >{fmt(current)}</div>
          <div
            data-reveal
            style={REVEAL_HIDDEN_STYLE}
            className="relative h-[2px] w-32 cursor-pointer bg-white/30 sm:w-56 md:w-80 lg:w-[32rem]"
            onClick={handleBarClick}
            role="progressbar"
            aria-label="Video progress"
          >
            <div className="absolute inset-y-0 left-0" style={{ width: `${progressPct}%` }}>
              <div className="h-full w-full bg-white/80" />
            </div>
          </div>
          <div
            data-reveal
            style={REVEAL_HIDDEN_STYLE}
            className="tabular-nums shrink-0 text-sm"
          >{fmt(remaining)}</div>
          <div data-reveal style={REVEAL_HIDDEN_STYLE} className="shrink-0">
            <button
              onClick={onToggleMute}
              className="text-sm underline-offset-4 decoration-white/60 hover:underline"
            >
              {muted ? "Sound OFF" : "Sound ON"}
            </button>
          </div>
          <div data-reveal style={REVEAL_HIDDEN_STYLE} className="shrink-0">
            <button
              onClick={handleShareClick}
              className="text-sm underline-offset-4 decoration-white/60 hover:underline relative"
            >
              <span className="relative inline-flex items-center justify-center h-5 min-w-[3.5rem] overflow-hidden">
                <span
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ease-out ${
                    shareState === 'share' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5'
                  }`}
                >
                  Share
                </span>
                <span
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ease-out ${
                    shareState === 'copied' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1.5'
                  }`}
                >
                  Copied!
                </span>
                <span className="opacity-0">Share</span>
              </span>
            </button>
          </div>
          <div data-reveal style={REVEAL_HIDDEN_STYLE} className="shrink-0">
            <button
              onClick={onToggleFullscreen}
              className="text-sm underline-offset-4 decoration-white/60 hover:underline"
            >
              {isFullscreen ? "Close" : "Fullscreen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
