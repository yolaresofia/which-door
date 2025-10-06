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

  const handleVideoClick: React.MouseEventHandler<HTMLVideoElement> = (e) => {
    if (!controls) return;
    e.preventDefault();
    togglePlay();
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
        <div className="flex h-full w-full items-center justify-center bg-black">
          <video
            ref={videoEl}
            className="max-h-full max-w-full object-contain md:h-full md:w-full md:object-cover"
            src={videoSrc}
            autoPlay={shouldAutoplay}
            muted={muted}
            loop
            playsInline
            onClick={handleVideoClick}
          />
        </div>
      ) : (
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${bgForImage})` }}
        />
      )}

      {/* Controls row: centered vertically (Y), spread left↔right horizontally */}
      {showVideo && controls && (
        <>
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 hidden p-4 text-white sm:p-6 md:block">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* LEFT: Title + Subtitle */}
              <div className="mr-4 min-w-0">
                {title && (
                  <div className="text-base font-semibold leading-tight truncate sm:text-lg">
                    {title}
                  </div>
                )}
                {subtitle && (
                  <div className="text-xs text-white/85 truncate sm:text-sm">
                    {subtitle}
                  </div>
                )}
              </div>
              <div className="ml-auto flex min-w-0 items-center gap-6">
                <button
                  onClick={togglePlay}
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

                <div className="tabular-nums shrink-0 text-sm">{fmt(current)}</div>

                <div
                  className="relative h-[2px] w-32 cursor-pointer bg-white/30 sm:w-56 md:w-80 lg:w-[32rem]"
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

                <div className="tabular-nums shrink-0 text-sm">{fmt(remaining)}</div>

                <button
                  onClick={toggleMute}
                  className="shrink-0 text-sm underline-offset-4 decoration-white/60 hover:underline"
                >
                  {muted ? "Sound OFF" : "Sound ON"}
                </button>

                <button
                  onClick={() => (onShare ? onShare() : console.log("share clicked"))}
                  className="shrink-0 text-sm underline-offset-4 decoration-white/60 hover:underline"
                >
                  Share
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="shrink-0 text-sm underline-offset-4 decoration-white/60 hover:underline"
                >
                  {isFullscreen ? "Close" : "Fullscreen"}
                </button>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 space-y-4 px-6 pb-6 text-white md:hidden">
            <div className="flex items-start justify-between gap-4">
              {(title || subtitle) && (
                <div className="flex-1 text-left">
                  {title && (
                    <div className="text-xl font-semibold leading-snug break-words">{title}</div>
                  )}
                  {subtitle && (
                    <div className="text-sm text-white/80 break-words">{subtitle}</div>
                  )}
                </div>
              )}
              <div className="flex flex-none items-center gap-4 text-sm whitespace-nowrap">
                <button
                  onClick={toggleMute}
                  className="underline-offset-4 decoration-white/60 hover:underline"
                >
                  {muted ? "Sound OFF" : "Sound ON"}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="underline-offset-4 decoration-white/60 hover:underline"
                >
                  {isFullscreen ? "Close" : "Fullscreen"}
                </button>
              </div>
            </div>
            <div
              className="relative h-[2px] w-full cursor-pointer bg-white/40"
              onClick={handleBarClick}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={duration || 0}
              aria-valuenow={current}
            >
              <div className="absolute inset-y-0 left-0" style={{ width: `${progressPct}%` }}>
                <div className="h-full w-full bg-white" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
