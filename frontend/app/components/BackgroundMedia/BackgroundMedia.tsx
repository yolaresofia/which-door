// components/BackgroundMedia.tsx
"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
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
  previewPoster?: string;
  variant?: "full" | "preview";
  bgColor?: string;
  className?: string;
  controls?: boolean;
  title?: string;
  subtitle?: string;
  onShare?: () => void;
};

export default function BackgroundMedia({
  vimeoUrl,
  previewUrl,
  previewPoster,
  variant = "full",
  bgColor,
  className = "",
  controls = false,
  title,
  subtitle,
  onShare,
}: BackgroundMediaProps) {
  const containerEl = useRef<HTMLDivElement | null>(null);
  const hasPreview = Boolean(previewUrl);
  const hasVimeo = Boolean(vimeoUrl);
  const usingNativeVideo = hasPreview && (!controls || !hasVimeo);
  const baseControls = variant === "preview" ? false : controls;
  const effectiveControls = baseControls && !usingNativeVideo;
  const activeVimeoSrc = usingNativeVideo ? undefined : vimeoUrl || previewUrl;
  const activePreviewSrc = usingNativeVideo ? previewUrl : undefined;
  const activeSourceKey = usingNativeVideo ? activePreviewSrc : activeVimeoSrc;
  const shouldUsePoster = Boolean(previewPoster) && effectiveControls && !usingNativeVideo;

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
  } = useVimeoController({ vimeoSrc: activeVimeoSrc, controls: effectiveControls });

  const { isFullscreen, toggleFullscreen } = useFullscreen(containerEl);

  const [posterPhase, setPosterPhase] = useState<"shown" | "fading" | "hidden">(
    shouldUsePoster ? "shown" : "hidden"
  );
  const [videoHasStarted, setVideoHasStarted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsHideTimerRef = useRef<number | null>(null);
  const handleNativePlaybackStart = useCallback(() => {
    setVideoHasStarted(true);
  }, []);

  useEffect(() => {
    console.debug("[BackgroundMedia] props", {
      variant,
      usingNativeVideo,
      vimeoSrc: activeVimeoSrc,
      previewSrc: activePreviewSrc,
      effectiveControls,
      hasPoster: !!previewPoster,
      bgColor,
      shouldUsePoster,
    });
  }, [
    activePreviewSrc,
    activeVimeoSrc,
    bgColor,
    effectiveControls,
    previewPoster,
    shouldUsePoster,
    usingNativeVideo,
    variant,
  ]);

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

  useEffect(() => {
    setVideoHasStarted(false);
  }, [activeSourceKey]);

  useEffect(() => {
    if (usingNativeVideo) return;
    if (videoHasStarted) return;
    const progressed = current > 0.05;
    if (variant === "preview") {
      if ((ready && progressed) || playing) {
        setVideoHasStarted(true);
      }
      return;
    }
    if (playing) {
      setVideoHasStarted(true);
    }
  }, [usingNativeVideo, variant, ready, playing, current, videoHasStarted]);

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
  const videoVisible = !shouldUsePoster || videoHasStarted;
  const pointerTrapActive = effectiveControls && isFullscreen && !controlsVisible;

  // Quick container size log
  useEffect(() => {
    const el = containerEl.current;
    if (!el) return;
    const log = (ctx: string) => {
      const r = el.getBoundingClientRect();
      console.debug("[BackgroundMedia] container size", ctx, { w: r.width, h: r.height });
    };
    log("mount");
    const ro = new ResizeObserver(() => log("ResizeObserver"));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerEl}
      className={`absolute inset-0 ${effectiveControls ? "" : "-z-10"} ${className}`}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
      data-variant={variant}
      data-has-poster={!!previewPoster}
      data-visible={videoVisible}
    >
      <div
        className="absolute inset-0 transition-opacity ease-in-out"
        style={{ opacity: videoVisible ? 1 : 0, transitionDuration: `${POSTER_FADE_MS}ms` }}
      >
        <MediaSurface
          vimeoSrc={activeVimeoSrc}
          previewSrc={activePreviewSrc}
          controls={effectiveControls}
          iframeRef={iframeRef}
          variant={variant}
          onNativePlaybackStart={handleNativePlaybackStart}
        />
      </div>

      {posterVisible && (
        <div
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden transition-opacity ease-in-out"
          style={{ opacity: posterOpacity, transitionDuration: `${POSTER_FADE_MS}ms` }}
        >
          <Image
            src={previewPoster as string}
            alt=""
            fill
            className="object-cover transform"
            style={{ filter: "blur(10px)", transform: "scale(1.05)" }}
            sizes="100vw"
            priority={variant === "preview"}
          />
          <div className="absolute inset-0 bg-black/10" />
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
              onShare={onShare}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
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
              current={current}
              remaining={remaining}
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
