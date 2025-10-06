"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export type BackgroundMediaProps = {
  imageSrc?: string;
  videoSrc?: string;
  useVideo?: boolean;
  bgColor?: string;
  className?: string;
  controls?: boolean;
  title?: string;      // e.g., project name
  subtitle?: string;   // e.g., "Director | Brand"
  onShare?: () => void;
};

const isGif = (url?: string) => !!url && /\.gif($|\?)/i.test(url);
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${pad(m)}:${pad(sec)}`;
};

export default function BackgroundMedia({
  imageSrc,
  videoSrc,
  useVideo = true,
  bgColor,
  className = "",
  controls = false,
  title,
  subtitle,
  onShare,
}: BackgroundMediaProps) {
  const containerEl = useRef<HTMLDivElement | null>(null);
  const videoEl = useRef<HTMLVideoElement | null>(null);

  // Priority: bgColor > video > image/GIF
  const preferColor = !!bgColor;
  const showVideo = !!(useVideo && videoSrc && !isGif(videoSrc) && !preferColor);
  const useColor = preferColor;
  const bgForImage = isGif(videoSrc) ? (videoSrc as string) : imageSrc;

  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(!controls);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => setMuted(!controls), [controls]);

  // Attach video listeners when the source changes
  useEffect(() => {
    const v = videoEl.current;
    if (!v) return;

    const onLoaded = () => setDuration(v.duration || 0);
    const onTime = () => setCurrent(v.currentTime || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [videoSrc]);

  // Keep muted in sync
  useEffect(() => {
    const v = videoEl.current;
    if (!v) return;
    v.muted = muted;
  }, [muted]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenEl =
        document.fullscreenElement ??
        (document as any).webkitFullscreenElement ??
        (document as any).mozFullScreenElement ??
        (document as any).msFullscreenElement;
      setIsFullscreen(fullscreenEl === containerEl.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange" as any, handleFullscreenChange);
    document.addEventListener("mozfullscreenchange" as any, handleFullscreenChange);
    document.addEventListener("MSFullscreenChange" as any, handleFullscreenChange);

    handleFullscreenChange();

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange" as any, handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange" as any, handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange" as any, handleFullscreenChange);
    };
  }, []);

  const remaining = useMemo(() => Math.max(duration - current, 0), [duration, current]);
  const progressPct = useMemo(() => (duration ? (current / duration) * 100 : 0), [duration, current]);

  const togglePlay = () => {
    const v = videoEl.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };

  const toggleMute = () => setMuted((m) => !m);

  const seekTo = (ratio: number) => {
    const v = videoEl.current;
    if (!v || !isFinite(duration) || duration <= 0) return;
    const clamped = Math.min(1, Math.max(0, ratio));
    v.currentTime = clamped * duration;
  };

  const handleBarClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seekTo(ratio);
  };

  const toggleFullscreen = () => {
    const container = containerEl.current;
    const video = videoEl.current;
    if (!container || !video) return;

    const doc = document as any;

    if (isFullscreen) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
      else if (doc.msExitFullscreen) doc.msExitFullscreen();
      return;
    }

    if (container.requestFullscreen) {
      Promise.resolve(container.requestFullscreen()).catch(() => {
        if ((video as any).webkitEnterFullscreen) (video as any).webkitEnterFullscreen();
      });
      return;
    }

    if ((container as any).webkitRequestFullscreen) (container as any).webkitRequestFullscreen();
    else if ((container as any).mozRequestFullScreen) (container as any).mozRequestFullScreen();
    else if ((container as any).msRequestFullscreen) (container as any).msRequestFullscreen();
    else if ((video as any).webkitEnterFullscreen) (video as any).webkitEnterFullscreen();
  };

  // When controls are off, autoplay muted+loop like a classic background.
  const shouldAutoplay = !controls;

  return (
    <div ref={containerEl} className={`absolute inset-0 ${controls ? "" : "-z-10"} ${className}`}>
      {/* Background layer: color > video > image/GIF */}
      {useColor ? (
        <div className="h-full w-full" style={{ backgroundColor: bgColor }} />
      ) : showVideo ? (
        <video
          ref={videoEl}
          className="h-full w-full object-cover"
          src={videoSrc}
          autoPlay={shouldAutoplay}
          muted={muted}
          loop
          playsInline
        />
      ) : (
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${bgForImage})` }}
        />
      )}

      {/* Controls row: centered vertically (Y), spread left↔right horizontally */}
      {showVideo && controls && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4 text-white flex-wrap">
            {/* LEFT: Title + Subtitle */}
            <div className="min-w-0 mr-4">
              {title && (
                <div className="text-base sm:text-lg font-semibold leading-tight truncate">
                  {title}
                </div>
              )}
              {subtitle && (
                <div className="text-xs sm:text-sm text-white/85 truncate">
                  {subtitle}
                </div>
              )}
            </div>
            <div className="ml-auto flex items-center gap-6 min-w-0">
              <button
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
                className="shrink-0 grid place-items-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition"
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

              <div className="tabular-nums text-sm shrink-0">{fmt(current)}</div>

              <div
                className="relative h-[2px] w-32 sm:w-56 md:w-80 lg:w-[32rem] bg-white/30 cursor-pointer"
                onClick={handleBarClick}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={duration || 0}
                aria-valuenow={current}
              >
                <div className="absolute inset-y-0 left-0" style={{ width: `${progressPct}%` }}>
                  <div className="h-full w-full bg-white/80" />
                </div>
              </div>

              <div className="tabular-nums text-sm shrink-0">{fmt(remaining)}</div>

              <button
                onClick={toggleMute}
                className="text-sm hover:underline decoration-white/60 underline-offset-4 shrink-0"
              >
                {muted ? "Sound OFF" : "Sound ON"}
              </button>

              <button
                onClick={() => (onShare ? onShare() : console.log("share clicked"))}
                className="text-sm hover:underline decoration-white/60 underline-offset-4 shrink-0"
              >
                Share
              </button>

              <button
                onClick={toggleFullscreen}
                className="text-sm hover:underline decoration-white/60 underline-offset-4 shrink-0"
              >
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
