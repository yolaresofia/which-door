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

  // Shared centering
  const containerClass =
    "absolute inset-0 flex bg-black items-center justify-center " +
    (variant === "preview" ? "h-screen md:h-full" : "");
  // Always use w-full h-full on large screens (lg+) to ensure full coverage
  const mediaClass =
    variant === "preview"
      ? "w-full h-full"
      : "w-full aspect-video md:aspect-auto md:w-full md:h-full lg:!w-full lg:!h-full";

  // Force autoplay when video source changes or component mounts
  useEffect(() => {
    if (!usingNative || !autoPlay) return;
    const video = videoRef.current;
    if (!video) return;

    // Attempt to play the video
    const attemptPlay = () => {
      // Only try to play if video is paused
      if (video.paused) {
        const playPromise = video.play();
        if (typeof playPromise?.catch === "function") {
          playPromise.catch(() => {
            // Autoplay might be blocked; ignore to avoid console noise.
          });
        }
      }
    };

    // If video is already loaded enough, play immediately
    if (video.readyState >= 2) {
      attemptPlay();
    }

    // Also listen for various ready events to catch all cases
    const handleCanPlay = () => attemptPlay();
    const handleLoadedData = () => attemptPlay();

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadeddata", handleLoadedData);

    // For mobile Safari, sometimes we need to wait a tick
    const timeoutId = setTimeout(attemptPlay, 100);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadeddata", handleLoadedData);
      clearTimeout(timeoutId);
    };
  }, [usingNative, previewSrc, autoPlay]);

  const handleNativeStart = () => {
    onNativePlaybackStart?.();
  };

  // Check if video is already playing when component mounts (cached videos)
  useEffect(() => {
    if (!usingNative) return;
    const video = videoRef.current;
    if (!video) return;

    // If video is already playing (e.g., from cache), signal immediately
    if (!video.paused && video.readyState >= 3) {
      onNativePlaybackStart?.();
    }
  }, [usingNative, previewSrc, onNativePlaybackStart]);

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