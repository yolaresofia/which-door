// BackgroundVideo.tsx
// Native <video> background: muted, looping, autoplay. No controls, no Vimeo.
"use client";

import { useRef, useEffect, useCallback, useState } from "react";

export type BackgroundVideoProps = {
  previewUrl?: string;
  mobilePreviewUrl?: string;
  previewPoster?: string;
  bgColor?: string;
  className?: string;
  onVideoReady?: () => void;
};

export default function BackgroundVideo({
  previewUrl,
  mobilePreviewUrl,
  previewPoster,
  bgColor,
  className = "",
  onVideoReady,
}: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isMountedRef = useRef(true);
  const hasFiredReadyRef = useRef(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

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
  // If all attempts fail (e.g. Low Power Mode), poster stays visible via !videoPlaying.
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

    // Final check — if video still hasn't played after 2.5s, fire ready
    // so the UI isn't blocked waiting for a video that won't play.
    // The poster stays visible via !videoPlaying state.
    const finalCheckId = window.setTimeout(() => {
      if (video.paused && isMountedRef.current) {
        fireReady();
      }
    }, 2500);

    return () => {
      observer.disconnect();
      window.clearTimeout(retryId);
      window.clearTimeout(finalCheckId);
    };
  }, [effectiveUrl, fireReady]);

  // --- Event handlers ---
  const handleCanPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isMountedRef.current) return;
    video.play().catch(() => {});
  }, []);

  const handlePlaybackStart = useCallback(() => {
    setVideoPlaying(true);
    fireReady();
  }, [fireReady]);

  if (!effectiveUrl) return null;

  // Only use poster if it's a real URL (not empty string)
  const posterSrc = previewPoster && previewPoster.length > 1 ? previewPoster : null;

  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{ backgroundColor: bgColor || "#000" }}
    >
      <div className="absolute inset-0">
        {/* Blurred poster: always rendered behind the video. No black screen ever. */}
        {posterSrc && (
          <img
            src={posterSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: "blur(20px)", transform: "scale(1.1)" }}
          />
        )}
        {/* Video: renders on top, invisible until playing */}
        <video
          key={effectiveUrl}
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
            videoPlaying ? "opacity-100" : "opacity-0"
          }`}
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
