// VimeoPlayer.tsx
// Full Vimeo player with controls, poster overlay, fullscreen, and share.
// Used only on project detail pages (/projects/[slug]).
"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useFullscreen } from "./hooks/useFullscreen";
import { useVimeoController } from "./hooks/useVimeoController";
import VimeoVideo from "./surfaces/VimeoVideo";
import ControlsDesktop from "./ControlsDesktop";
import ControlsMobile from "./ControlsMobile";

const POSTER_FADE_MS = 700;
const CONTROLS_IDLE_HIDE_MS = 900;

export type VimeoPlayerProps = {
  vimeoUrl: string;
  previewPoster?: string;
  previewPosterLQIP?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  onShare?: () => void;
};

export default function VimeoPlayer({
  vimeoUrl,
  previewPoster,
  previewPosterLQIP,
  title,
  subtitle,
  className = "",
  onShare,
}: VimeoPlayerProps) {
  const containerEl = useRef<HTMLDivElement | null>(null);

  // --- Vimeo controller ---
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
  } = useVimeoController({ vimeoSrc: vimeoUrl, controls: true });

  // --- Fullscreen ---
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerEl);

  const pathname = usePathname();

  // --- Poster fade ---
  const shouldUsePoster = Boolean(previewPoster);
  const [posterPhase, setPosterPhase] = useState<"shown" | "fading" | "hidden">(
    shouldUsePoster ? "shown" : "hidden"
  );
  const [videoHasStarted, setVideoHasStarted] = useState(false);

  // Detect when Vimeo video has actually started playing
  useEffect(() => {
    if (videoHasStarted) return;
    const progressed = current > 0.05;
    if (ready && progressed && playing) {
      setVideoHasStarted(true);
    }
  }, [ready, playing, current, videoHasStarted]);

  // Fallback: mark as started after 3s if Vimeo is ready but autoplay is blocked
  useEffect(() => {
    if (videoHasStarted || !ready) return;
    const id = window.setTimeout(() => setVideoHasStarted(true), 3000);
    return () => window.clearTimeout(id);
  }, [videoHasStarted, ready]);

  // Poster phase transitions
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
    const id = window.setTimeout(() => setPosterPhase("hidden"), POSTER_FADE_MS);
    return () => window.clearTimeout(id);
  }, [posterPhase]);

  // --- Controls visibility (auto-hide in fullscreen) ---
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
    if (!isFullscreen) {
      clearControlsHideTimer();
      setControlsVisible(true);
      return;
    }

    revealControls();

    const passiveOpts: AddEventListenerOptions = { passive: true };
    const targets: EventTarget[] = [window, document];
    const events = ["pointermove", "mousemove", "mousedown", "touchstart", "touchmove"] as const;

    targets.forEach((t) => {
      events.forEach((e) => t.addEventListener(e, revealControls, passiveOpts));
    });
    document.addEventListener("keydown", revealControls);

    return () => {
      clearControlsHideTimer();
      targets.forEach((t) => {
        events.forEach((e) => t.removeEventListener(e, revealControls, passiveOpts));
      });
      document.removeEventListener("keydown", revealControls);
    };
  }, [isFullscreen, revealControls, clearControlsHideTimer]);

  // --- Share ---
  const handleShare = useCallback(async () => {
    const url = `https://www.whichdoorstudios.com${pathname ?? window.location?.pathname ?? ""}`;
    try {
      if (!navigator?.clipboard?.writeText) throw new Error("Clipboard not available");
      await navigator.clipboard.writeText(url);
    } catch {
      // no-op
    }
    onShare?.();
  }, [onShare, pathname]);

  // --- Derived state ---
  const posterVisible = shouldUsePoster && posterPhase !== "hidden";
  const posterOpacity = posterPhase === "shown" ? 1 : 0;
  const pointerTrapActive = isFullscreen && !controlsVisible;

  // Video container classes (full variant)
  const mediaClass =
    "w-full aspect-video md:aspect-auto md:w-full md:h-full lg:!w-full lg:!h-full";

  return (
    <div
      ref={containerEl}
      className={`absolute inset-0 ${className}`}
    >
      {/* Vimeo video - always visible so it can load, poster covers it */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <VimeoVideo
            iframeRef={iframeRef}
            vimeoSrc={vimeoUrl}
            autoPlay
            muted={false}
            fillMode="cover"
            className={mediaClass}
          />
        </div>
        {/* Click/tap overlay to toggle play/pause */}
        <button
          type="button"
          className="absolute inset-0 z-[5] cursor-pointer"
          onClick={togglePlay}
          aria-label={playing ? "Pause video" : "Play video"}
          data-touch-toggle-ignore
        />
      </div>

      {/* Poster overlay */}
      {posterVisible && (
        <div
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden bg-black"
          style={{
            opacity: posterOpacity,
            transition: `opacity ${POSTER_FADE_MS}ms ease-in-out`,
            willChange: posterPhase === "fading" ? "opacity" : "auto",
          }}
        >
          <Image
            src={previewPoster as string}
            alt=""
            fill
            className="object-cover"
            style={{ transform: "scale(1.05)" }}
            sizes="100vw"
            priority
            fetchPriority="high"
            placeholder={previewPosterLQIP ? "blur" : "empty"}
            blurDataURL={previewPosterLQIP}
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>
      )}

      {/* Controls */}
      <>
        {/* Pointer trap for fullscreen auto-hide */}
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
    </div>
  );
}
