"use client";

import React, { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { useFullscreen } from "./hooks/useFullscreen";
import { useVimeoController } from "./hooks/useVimeoController";
import MediaSurface from "./MediaSurface";
import ControlsDesktop from "./ControlsDesktop";
import ControlsMobile from "./ControlsMobile";
import { useTouchPlayToggle } from "./hooks/useTouchPlayToggle";

const POSTER_FADE_MS = 700;
const CONTROLS_IDLE_HIDE_MS = 2500;

export type BackgroundMediaProps = {
  vimeoUrl?: string;
  vimeoPreviewUrl?: string;
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
  vimeoPreviewUrl,
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

  // pick the right URL based on variant
  const selectedUrl = useMemo(
    () => (variant === "preview" ? (vimeoPreviewUrl || vimeoUrl) : vimeoUrl),
    [variant, vimeoPreviewUrl, vimeoUrl]
  );

  // previews never show custom controls (autoPlay + muted + loop)
  const effectiveControls = variant === "preview" ? false : controls;

  const {
    iframeRef,
    duration,
    current,
    remaining,
    progressPct,
    playing,
    muted,
    togglePlay,
    toggleMute,
    seekToRatio,
    ready,
  } = useVimeoController({ vimeoSrc: selectedUrl, controls: effectiveControls });

  const { isFullscreen, toggleFullscreen } = useFullscreen(containerEl);

  const [posterPhase, setPosterPhase] = useState<"shown" | "fading" | "hidden">(
    previewPoster ? "shown" : "hidden"
  );
  const [videoHasStarted, setVideoHasStarted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsHideTimerRef = useRef<number | null>(null);

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
    setPosterPhase(previewPoster ? "shown" : "hidden");
  }, [previewPoster, selectedUrl, variant]);

  useEffect(() => {
    if (videoHasStarted) return;

    const progressed = current > 0.05;
    if (variant === "preview") {
      if ((ready && progressed) || playing) {
        setVideoHasStarted(true);
      }
      return;
    }

    if (playing) setVideoHasStarted(true);
  }, [variant, ready, playing, current, videoHasStarted]);

  useEffect(() => {
    setPosterPhase((phase) => {
      if (!previewPoster) return "hidden";
      if (!videoHasStarted) return "shown";
      if (phase === "shown") return "fading";
      return phase;
    });
  }, [previewPoster, videoHasStarted]);

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

    const opts: AddEventListenerOptions = { passive: true };

    window.addEventListener("mousemove", revealControls, opts);
    window.addEventListener("mousedown", revealControls, opts);
    window.addEventListener("touchstart", revealControls, opts);
    window.addEventListener("touchmove", revealControls, opts);
    window.addEventListener("keydown", revealControls, false);

    return () => {
      clearControlsHideTimer();
      window.removeEventListener("mousemove", revealControls, opts);
      window.removeEventListener("mousedown", revealControls, opts);
      window.removeEventListener("touchstart", revealControls, opts);
      window.removeEventListener("touchmove", revealControls, opts);
      window.removeEventListener("keydown", revealControls, false);
    };
  }, [effectiveControls, isFullscreen, revealControls, clearControlsHideTimer]);

  const posterVisible = Boolean(previewPoster) && posterPhase !== "hidden";
  const posterOpacity = posterPhase === "shown" ? 1 : 0;
  const videoVisible = !previewPoster || videoHasStarted;
  const touchToggleEnabled = effectiveControls;

  useTouchPlayToggle({
    containerRef: containerEl,
    enabled: touchToggleEnabled,
    togglePlay,
  });

  return (
    <div
      ref={containerEl}
      className={`absolute inset-0 ${effectiveControls ? "" : "-z-10"} ${className}`}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      {/* video layer */}
      <div
        className="absolute inset-0 transition-opacity ease-in-out"
        style={{ opacity: videoVisible ? 1 : 0, transitionDuration: `${POSTER_FADE_MS}ms` }}
      >
        <MediaSurface
          vimeoSrc={selectedUrl}
          controls={effectiveControls}
          iframeRef={iframeRef}
          variant={variant}
        />
      </div>

      {/* blurred poster overlay */}
      {posterVisible && (
        <div
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden transition-opacity ease-in-out"
          style={{ opacity: posterOpacity, transitionDuration: `${POSTER_FADE_MS}ms` }}
        >
          <img
            src={previewPoster}
            alt=""
            className="h-full w-full object-cover transform"
            style={{
              filter: "blur(10px)",
              transform: "scale(1.05)", // hide blur edges
            }}
          />
          {/* optional gradient for legibility */}
          <div className="absolute inset-0 bg-black/10" />
        </div>
      )}

      {/* pointer capture layer to ensure cursor movement over the iframe restores controls */}
      {effectiveControls && (
        <div
          className="absolute inset-0 z-20"
          style={{
            pointerEvents: effectiveControls && isFullscreen && !controlsVisible ? "auto" : "none",
          }}
          onPointerMove={revealControls}
          onPointerDown={revealControls}
          onPointerUp={revealControls}
          aria-hidden="true"
        />
      )}

      {/* controls only for full variant */}
      {effectiveControls && (
        <>
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
