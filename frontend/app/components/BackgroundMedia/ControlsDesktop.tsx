'use client'

import { useRef, useEffect } from 'react'
import { fmt } from "./utils";
import { useSequencedReveal } from '@/app/utils/useSequencedReveal'

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
};

export default function ControlsDesktop(props: Props) {
  const {
    title, subtitle, playing, current, remaining, progressPct,
    muted, onTogglePlay, onSeekRatio, onToggleMute, onShare,
    isFullscreen, onToggleFullscreen
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null)

  // Desktop animation - EXACT SAME as ProjectsLanding
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

  // Trigger animation on mount
  useEffect(() => {
    // Start with RAF to ensure DOM is ready
    requestAnimationFrame(() => {
      start()
    })
  }, [start])

  const handleBarClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeekRatio((e.clientX - rect.left) / rect.width);
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 hidden px-6 md:px-12 text-white sm:p-6 md:block"
      data-touch-toggle-ignore
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div
          className="mr-4 min-w-0"
          data-reveal
        >
          {title && <div className="text-base font-semibold leading-tight sm:text-2xl max-w-2xs">{title}</div>}
          {subtitle && <div className="text-white/85 truncate text-base">{subtitle}</div>}
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-6">
          <button
            data-reveal
            onClick={onTogglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
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
          <div
            data-reveal
            className="tabular-nums shrink-0 text-sm"
          >{fmt(current)}</div>
          <div
            data-reveal
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
            className="tabular-nums shrink-0 text-sm"
          >{fmt(remaining)}</div>
          <button
            data-reveal
            onClick={onToggleMute}
            className="shrink-0 text-sm underline-offset-4 decoration-white/60 hover:underline"
          >
            {muted ? "Sound OFF" : "Sound ON"}
          </button>
          <button
            data-reveal
            onClick={() => (onShare && onShare())}
            className="shrink-0 text-sm underline-offset-4 decoration-white/60 hover:underline"
          >
            Share
          </button>
          <button
            data-reveal
            onClick={onToggleFullscreen}
            className="shrink-0 text-sm underline-offset-4 decoration-white/60 hover:underline"
          >
            {isFullscreen ? "Close" : "Fullscreen"}
          </button>
        </div>
      </div>
    </div>
  );
}
