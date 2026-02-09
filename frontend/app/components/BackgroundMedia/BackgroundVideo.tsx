// BackgroundVideo.tsx
// Native <video> background: muted, looping, autoplay. No controls, no Vimeo.
"use client";

import { useRef, useEffect, useCallback, useState } from "react";

export type BackgroundVideoProps = {
  previewUrl?: string;
  mobilePreviewUrl?: string;
  bgColor?: string;
  className?: string;
  onVideoReady?: () => void;
};

export default function BackgroundVideo({
  previewUrl,
  mobilePreviewUrl,
  bgColor,
  className = "",
  onVideoReady,
}: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isMountedRef = useRef(true);
  const hasFiredReadyRef = useRef(false);

  // Detect mobile once on first client render (< 1024px)
  const isMobileRef = useRef<boolean | null>(null);
  if (isMobileRef.current === null && typeof window !== "undefined") {
    isMobileRef.current = window.innerWidth < 1024;
  }
  const isMobile = isMobileRef.current ?? false;

  // Pick the right video URL
  const effectiveUrl =
    isMobile && mobilePreviewUrl ? mobilePreviewUrl : previewUrl;

  // --- onVideoReady callback (fire once) ---
  const fireReady = useCallback(() => {
    if (hasFiredReadyRef.current || !isMountedRef.current) return;
    hasFiredReadyRef.current = true;
    onVideoReady?.();
  }, [onVideoReady]);

  // --- Video cleanup on unmount ---
  const cleanupVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.pause();
      video.onplay = null;
      video.onplaying = null;
      video.oncanplaythrough = null;
      video.oncanplay = null;
      video.onerror = null;
      video.onloadeddata = null;
      video.removeAttribute("src");
      video.load();
    } catch {
      // Video might already be in a bad state
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanupVideo();
    };
  }, [cleanupVideo]);

  // --- iOS Safari: force video.load() since it ignores preload="auto" ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveUrl) return;
    video.load();
  }, [effectiveUrl]);

  // --- Autoplay fix for iOS first-load ---
  // iOS Safari can block autoplay even on muted videos on the very first page load.
  // IntersectionObserver retries play() when visible, plus a timed retry as fallback.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveUrl) return;

    const tryPlay = () => {
      if (video.paused && video.readyState >= 2) {
        video.play().catch(() => {});
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) tryPlay();
      },
      { threshold: 0.01 }
    );
    observer.observe(video);

    // Timed retry fallback
    const retryId = window.setTimeout(tryPlay, 1000);

    return () => {
      observer.disconnect();
      window.clearTimeout(retryId);
    };
  }, [effectiveUrl]);

  // --- Fallback: fire onVideoReady after 500ms even if events don't fire ---
  useEffect(() => {
    if (hasFiredReadyRef.current) return;
    const id = window.setTimeout(fireReady, 500);
    return () => window.clearTimeout(id);
  }, [fireReady]);

  // --- Event handlers ---
  const handleCanPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isMountedRef.current) return;
    video.play().catch(() => {});
  }, []);

  const handlePlaybackStart = useCallback(() => {
    fireReady();
  }, [fireReady]);

  if (!effectiveUrl) return null;

  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <video
          key={effectiveUrl}
          ref={videoRef}
          className="h-full w-full object-cover"
          src={effectiveUrl}
          muted
          loop
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          controls={false}
          preload="auto"
          autoPlay
          onCanPlay={handleCanPlay}
          onLoadedData={handleCanPlay}
          onPlay={handlePlaybackStart}
          onPlaying={handlePlaybackStart}
          onCanPlayThrough={handlePlaybackStart}
        />
      </div>
    </div>
  );
}
