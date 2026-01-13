// components/BackgroundMedia.tsx
"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useFullscreen } from "./hooks/useFullscreen";
import { useVimeoController } from "./hooks/useVimeoController";
import MediaSurface from "./MediaSurface";
import ControlsDesktop from "./ControlsDesktop";
import ControlsMobile from "./ControlsMobile";

const POSTER_FADE_MS = 700;
const CONTROLS_IDLE_HIDE_MS = 900;

export type BackgroundMediaProps = {
  vimeoUrl?: string;
  previewUrl?: string;
  mobilePreviewUrl?: string; // Lower quality video for tablet and smaller devices
  previewPoster?: string;
  previewPosterLQIP?: string; // Low Quality Image Placeholder (base64 or URL)
  variant?: "full" | "preview";
  bgColor?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  title?: string;
  subtitle?: string;
  onShare?: () => void;
  onVideoReady?: () => void; // Called when video starts playing
};

export default function BackgroundMedia({
  vimeoUrl,
  previewUrl,
  mobilePreviewUrl,
  previewPoster,
  previewPosterLQIP,
  variant = "full",
  bgColor,
  className = "",
  controls = false,
  autoPlay: autoPlayProp,
  title,
  subtitle,
  onShare,
  onVideoReady,
}: BackgroundMediaProps) {
  const containerEl = useRef<HTMLDivElement | null>(null);

  // Detect mobile/tablet (< 1024px) for using lower quality video and posters
  // CRITICAL: Always initialize to false to prevent hydration mismatch
  // The useEffect will update this on the client after hydration completes
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobileDevice(window.innerWidth < 1024);
    // Check immediately after mount, then listen for resize
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use mobile video URL when available and on mobile/tablet
  const effectivePreviewUrl = (isMobileDevice && mobilePreviewUrl) ? mobilePreviewUrl : previewUrl;

  const hasPreview = Boolean(effectivePreviewUrl);
  const hasVimeo = Boolean(vimeoUrl);
  const usingNativeVideo = hasPreview && (!controls || !hasVimeo);
  const baseControls = variant === "preview" ? false : controls;
  const effectiveControls = baseControls && !usingNativeVideo;
  const activeVimeoSrc = usingNativeVideo ? undefined : vimeoUrl || effectivePreviewUrl;
  const activePreviewSrc = usingNativeVideo ? effectivePreviewUrl : undefined;
  const activeSourceKey = usingNativeVideo ? activePreviewSrc : activeVimeoSrc;
  // Show poster while video is loading (until video starts playing)
  // This provides a nice blurred placeholder while the video loads in the background
  // For mobile preview videos, we skip the poster to allow smooth video-to-video crossfades
  const shouldUsePoster = Boolean(previewPoster) && !usingNativeVideo && hasVimeo;
  const resolvedAutoPlay =
    typeof autoPlayProp === "boolean" ? autoPlayProp : !effectiveControls;

  const {
    iframeRef,
    current,
    remaining,
    progressPct,
    playing,
    muted,
    togglePlay,
    toggleMute,
    seekToRatio,
    ready,
  } = useVimeoController({ vimeoSrc: activeVimeoSrc, controls: effectiveControls, autoplay: resolvedAutoPlay });

  const { isFullscreen, toggleFullscreen } = useFullscreen(containerEl);

  const pathname = usePathname();

  const [posterPhase, setPosterPhase] = useState<"shown" | "fading" | "hidden">(
    shouldUsePoster ? "shown" : "hidden"
  );
  const [videoHasStarted, setVideoHasStarted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsHideTimerRef = useRef<number | null>(null);
  const handleNativePlaybackStart = useCallback(() => {
    setVideoHasStarted(true);
  }, []);

  // Notify parent when video has started playing
  useEffect(() => {
    if (videoHasStarted) {
      onVideoReady?.();
    }
  }, [videoHasStarted, onVideoReady]);

  const clearControlsHideTimer = useCallback(() => {
    if (controlsHideTimerRef.current != null) {
      window.clearTimeout(controlsHideTimerRef.current);
      controlsHideTimerRef.current = null;
    }
  }, []);

  const scheduleControlsHide = useCallback(() => {
    clearControlsHideTimer();
    if (!isFullscreen) return;
    controlsHideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, CONTROLS_IDLE_HIDE_MS);
  }, [clearControlsHideTimer, isFullscreen]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  // Reset video and poster state when source changes (but NOT on initial mount)
  // This ensures poster shows immediately for new videos, preventing black screens
  const prevSourceKeyRef = useRef<string | undefined>(undefined);
  const isInitialSourceRef = useRef(true);
  useEffect(() => {
    // Skip reset on initial mount - we want to let the video play through
    if (isInitialSourceRef.current) {
      isInitialSourceRef.current = false;
      prevSourceKeyRef.current = activeSourceKey;
      return;
    }

    // Only reset if the source actually changed (e.g., navigating to different video)
    if (prevSourceKeyRef.current !== activeSourceKey) {
      prevSourceKeyRef.current = activeSourceKey;
      setVideoHasStarted(false);
      if (shouldUsePoster) {
        setPosterPhase("shown");
      }
    }
  }, [activeSourceKey, shouldUsePoster]);

  // Handle resize changes (when switching between mobile/desktop)
  // Reset video state when screen size changes to load appropriate video
  const prevMobileRef = useRef<boolean>(isMobileDevice);
  useEffect(() => {
    // Only reset if the mobile state actually changed (e.g., resize from desktop to mobile)
    if (prevMobileRef.current !== isMobileDevice) {
      prevMobileRef.current = isMobileDevice;
      if (shouldUsePoster) {
        setPosterPhase("shown");
        setVideoHasStarted(false);
      }
    }
  }, [isMobileDevice, shouldUsePoster]);

  useEffect(() => {
    if (usingNativeVideo) return;
    if (videoHasStarted) return;
    // Wait until video is truly ready AND has progressed slightly
    // This ensures we show the blurred poster until the video actually loads
    const progressed = current > 0.05;
    if (ready && progressed && playing) {
      setVideoHasStarted(true);
    }
  }, [usingNativeVideo, ready, playing, current, videoHasStarted]);

  // Fallback: If Vimeo player is ready but video hasn't started playing after timeout,
  // mark as ready anyway so controls animate in (autoplay might be blocked by browser)
  useEffect(() => {
    if (usingNativeVideo) return;
    if (videoHasStarted) return;
    if (!ready) return;

    const timeoutId = window.setTimeout(() => {
      setVideoHasStarted(true);
    }, 2000); // 2 second fallback

    return () => window.clearTimeout(timeoutId);
  }, [usingNativeVideo, videoHasStarted, ready]);

  // Fallback for native video: mark as ready after short timeout
  // This ensures onVideoReady fires even if video events don't trigger
  // (e.g., race condition with mobile detection, or autoplay issues)
  useEffect(() => {
    if (!usingNativeVideo) return;
    if (videoHasStarted) return;

    // Short timeout - we want content to appear quickly
    const timeoutId = window.setTimeout(() => {
      setVideoHasStarted(true);
    }, 500); // 500ms fallback for native video

    return () => window.clearTimeout(timeoutId);
  }, [usingNativeVideo, videoHasStarted]);

  useEffect(() => {
    setPosterPhase((phase) => {
      if (!shouldUsePoster) return "hidden";
      if (!videoHasStarted) return "shown";
      if (phase === "shown") return "fading";
      return phase;
    });
  }, [shouldUsePoster, videoHasStarted]);

  useEffect(() => {
    if (posterPhase !== "fading") return;
    const timeout = window.setTimeout(() => setPosterPhase("hidden"), POSTER_FADE_MS);
    return () => window.clearTimeout(timeout);
  }, [posterPhase]);

  const handleShare = useCallback(async () => {
    const url = `https://www.whichdoorstudios.com${pathname ?? window.location?.pathname ?? ""}`;

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard not available");
      }
      await navigator.clipboard.writeText(url);
    } catch (error) {
      // no-op if copy fails
    }

    onShare?.();
  }, [onShare, pathname]);

  useEffect(() => {
    if (!effectiveControls) return;

    if (!isFullscreen) {
      clearControlsHideTimer();
      setControlsVisible(true);
      return;
    }

    revealControls();

    const passiveOpts: AddEventListenerOptions = { passive: true };
    const passiveTargets: EventTarget[] = [window, document];
    const passiveEvents = ["pointermove", "mousemove", "mousedown", "touchstart", "touchmove"] as const;

    passiveTargets.forEach((target) => {
      passiveEvents.forEach((eventName) => {
        target.addEventListener(eventName, revealControls, passiveOpts);
      });
    });

    document.addEventListener("keydown", revealControls);
    return () => {
      clearControlsHideTimer();
      passiveTargets.forEach((target) => {
        passiveEvents.forEach((eventName) => {
          target.removeEventListener(eventName, revealControls, passiveOpts);
        });
      });
      document.removeEventListener("keydown", revealControls);
    };
  }, [effectiveControls, isFullscreen, revealControls, clearControlsHideTimer]);

  const posterVisible = shouldUsePoster && posterPhase !== "hidden";
  const posterOpacity = posterPhase === "shown" ? 1 : 0;
  // CRITICAL: Video must ALWAYS be visible so it can load and play in the background
  // The poster (z-10) covers it until video starts, then fades out
  // Previously we hid the video which prevented it from loading at all
  const videoVisible = true;
  const pointerTrapActive = effectiveControls && isFullscreen && !controlsVisible;

  return (
    <div
      ref={containerEl}
      className={`absolute inset-0 ${className}`}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
      data-variant={variant}
      data-has-poster={!!previewPoster}
      data-visible={videoVisible}
    >
      {/* Video container - always visible so video can load, poster covers it */}
      <div className="absolute inset-0">
        <MediaSurface
          vimeoSrc={activeVimeoSrc}
          previewSrc={activePreviewSrc}
          controls={effectiveControls}
          autoPlay={resolvedAutoPlay}
          iframeRef={iframeRef}
          variant={variant}
          onNativePlaybackStart={handleNativePlaybackStart}
        />
        {/* Click/tap overlay to toggle play/pause */}
        {effectiveControls && (
          <button
            type="button"
            className="absolute inset-0 z-[5] cursor-pointer"
            onClick={togglePlay}
            aria-label={playing ? "Pause video" : "Play video"}
            data-touch-toggle-ignore
          />
        )}
      </div>

      {posterVisible && (
        <div
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden bg-black transition-opacity ease-in-out"
          style={{ opacity: posterOpacity, transitionDuration: `${POSTER_FADE_MS}ms` }}
        >
          {/* LQIP base64 placeholder - loads instantly */}
          {previewPosterLQIP && (
            <Image
              src={previewPosterLQIP}
              alt=""
              fill
              className="object-cover transform"
              style={{ filter: "blur(40px)", transform: "scale(1.12)" }}
              sizes="100vw"
              priority={true}
              quality={20}
            />
          )}
          {/* Full quality poster - loads progressively */}
          <Image
            src={previewPoster as string}
            alt=""
            fill
            className="object-cover transform"
            style={{ filter: "blur(22px)", transform: "scale(1.1)" }}
            sizes="100vw"
            priority={variant === "preview"}
            placeholder={previewPosterLQIP ? "blur" : "empty"}
            blurDataURL={previewPosterLQIP}
          />
          <div className="absolute inset-0 bg-black/10" />
          {/* Pulse overlay to indicate loading */}
          {posterPhase === "shown" && (
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                animation: "shimmer 2s infinite",
              }}
            />
          )}
        </div>
      )}

      {/* controls only for full variant */}
      {effectiveControls && (
        <>
          <div
            className="absolute inset-0 z-20"
            style={{ pointerEvents: pointerTrapActive ? "auto" : "none" }}
            onPointerMove={revealControls}
            onPointerDown={revealControls}
            onTouchStart={revealControls}
          />
          <div
            className={`transition-opacity duration-300 ease-out ${
              controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <ControlsDesktop
              title={title}
              subtitle={subtitle}
              playing={playing}
              current={current}
              remaining={remaining}
              progressPct={progressPct}
              muted={muted}
              onTogglePlay={togglePlay}
              onSeekRatio={seekToRatio}
              onToggleMute={toggleMute}
              onShare={handleShare}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              isVideoReady={videoHasStarted}
            />
          </div>
          <div
            className={`transition-opacity duration-300 ease-out ${
              controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <ControlsMobile
              title={title}
              subtitle={subtitle}
              progressPct={progressPct}
              muted={muted}
              onSeekRatio={seekToRatio}
              onToggleMute={toggleMute}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
            />
          </div>
        </>
      )}
    </div>
  );
}
