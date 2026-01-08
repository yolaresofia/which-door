// MediaSurface.tsx
import { useEffect, useRef, useCallback } from "react";
import VimeoVideo from "./surfaces/VimeoVideo";

type Props = {
  vimeoSrc?: string;
  previewSrc?: string;
  controls: boolean;
  autoPlay: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  variant: "full" | "preview";
  onNativePlaybackStart?: () => void;
};

export default function MediaSurface({
  vimeoSrc,
  previewSrc,
  controls,
  autoPlay,
  iframeRef,
  variant,
  onNativePlaybackStart,
}: Props) {
  // Use native video for previews, Vimeo for full with controls
  const usingNative = Boolean(previewSrc) && (!controls || !vimeoSrc);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSrcRef = useRef<string | undefined>(undefined);
  const isMountedRef = useRef(true);

  // Shared centering
  const containerClass =
    "absolute inset-0 flex bg-black items-center justify-center " +
    (variant === "preview" ? "h-screen md:h-full" : "");
  // Always use w-full h-full on large screens (lg+) to ensure full coverage
  const mediaClass =
    variant === "preview"
      ? "w-full h-full"
      : "w-full aspect-video md:aspect-auto md:w-full md:h-full lg:!w-full lg:!h-full";

  // Properly clean up video element on unmount to prevent "cancelled" network errors
  // This follows React best practices for media elements
  const cleanupVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    try {
      // Pause the video first
      video.pause();

      // Remove event listeners by setting null handlers
      video.onplay = null;
      video.onplaying = null;
      video.oncanplaythrough = null;
      video.oncanplay = null;
      video.onerror = null;
      video.onloadeddata = null;

      // Clear the source to stop any pending network requests
      // This prevents the "cancelled" error in the network tab
      video.removeAttribute('src');

      // Load empty to fully reset the video element
      video.load();
    } catch {
      // Silently fail - video might already be in a bad state
    }
  }, []);

  // Track mounted state and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      cleanupVideo();
    };
  }, [cleanupVideo]);

  // Handle autoplay when video is ready or source changes
  useEffect(() => {
    if (!usingNative || !autoPlay) return;
    const video = videoRef.current;
    if (!video) return;

    // Track if source changed
    const sourceChanged = lastSrcRef.current !== previewSrc;
    lastSrcRef.current = previewSrc;

    // Simple play attempt - no retries to avoid loops
    const attemptPlay = () => {
      // Check if still mounted before playing
      if (!isMountedRef.current) return;
      if (!video.paused) return;

      // Ensure muted for autoplay policy
      video.muted = true;

      const playPromise = video.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {
          // Silently fail - autoplay blocked or component unmounted
        });
      }
    };

    // If source changed, load and play
    if (sourceChanged && previewSrc) {
      video.load();
    }

    // Try to play when ready
    const handleCanPlay = () => {
      if (isMountedRef.current) {
        attemptPlay();
      }
    };

    video.addEventListener("canplay", handleCanPlay);

    // If already ready, try now
    if (video.readyState >= 3) {
      attemptPlay();
    }

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [usingNative, previewSrc, autoPlay]);

  const handleNativeStart = useCallback(() => {
    if (isMountedRef.current) {
      onNativePlaybackStart?.();
    }
  }, [onNativePlaybackStart]);

  return (
    <div
      ref={containerRef}
      className={containerClass}
      data-variant={variant}
      data-source={usingNative ? "native" : "vimeo"}
    >
      {usingNative ? (
        <video
          ref={videoRef}
          className={`${mediaClass} object-cover transition-opacity duration-700 ease-in-out`}
          src={previewSrc}
          muted
          loop
          playsInline
          preload="auto"
          autoPlay={autoPlay}
          onPlay={handleNativeStart}
          onPlaying={handleNativeStart}
          onCanPlayThrough={handleNativeStart}
        />
      ) : (
        <VimeoVideo
          iframeRef={iframeRef}
          vimeoSrc={vimeoSrc}
          autoPlay={autoPlay}
          muted={!controls}
          fillMode={variant === "preview" ? "contain" : "cover"}
          className={mediaClass}
        />
      )}
    </div>
  );
}
