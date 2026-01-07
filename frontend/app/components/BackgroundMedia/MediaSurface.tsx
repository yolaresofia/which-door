// MediaSurface.tsx
import { useEffect, useRef } from "react";
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

  // Shared centering
  const containerClass =
    "absolute inset-0 flex bg-black items-center justify-center " +
    (variant === "preview" ? "h-screen md:h-full" : "");
  // Always use w-full h-full on large screens (lg+) to ensure full coverage
  const mediaClass =
    variant === "preview"
      ? "w-full h-full"
      : "w-full aspect-video md:aspect-auto md:w-full md:h-full lg:!w-full lg:!h-full";

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
      if (!video.paused) return;

      // Ensure muted for autoplay policy
      video.muted = true;

      const playPromise = video.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {
          // Silently fail - autoplay blocked
        });
      }
    };

    // If source changed, load and play
    if (sourceChanged && previewSrc) {
      video.load();
    }

    // Try to play when ready
    const handleCanPlay = () => attemptPlay();

    video.addEventListener("canplay", handleCanPlay);

    // If already ready, try now
    if (video.readyState >= 3) {
      attemptPlay();
    }

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [usingNative, previewSrc, autoPlay]);

  const handleNativeStart = () => {
    onNativePlaybackStart?.();
  };

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