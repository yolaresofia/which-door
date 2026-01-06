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
  const playAttemptRef = useRef<number>(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Shared centering
  const containerClass =
    "absolute inset-0 flex bg-black items-center justify-center " +
    (variant === "preview" ? "h-screen md:h-full" : "");
  // Always use w-full h-full on large screens (lg+) to ensure full coverage
  const mediaClass =
    variant === "preview"
      ? "w-full h-full"
      : "w-full aspect-video md:aspect-auto md:w-full md:h-full lg:!w-full lg:!h-full";

  const handleNativeStart = useCallback(() => {
    onNativePlaybackStart?.();
  }, [onNativePlaybackStart]);

  // Ref callback that sets up autoplay when video element is mounted
  const videoRefCallback = useCallback((video: HTMLVideoElement | null) => {
    // Cleanup previous listeners if any
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    videoRef.current = video;

    if (!video || !autoPlay) return;

    // Reset play attempt counter
    playAttemptRef.current = 0;

    // Attempt to play the video
    const attemptPlay = () => {
      if (!video || !video.paused) return;

      // For iOS: ensure video attributes are set correctly before playing
      video.muted = true;
      video.playsInline = true;

      const playPromise = video.play();
      if (typeof playPromise?.then === "function") {
        playPromise
          .then(() => {
            // Successfully started playing
            handleNativeStart();
          })
          .catch(() => {
            // Autoplay might be blocked; try again after a short delay
            // iOS sometimes needs multiple attempts
            const currentAttempt = ++playAttemptRef.current;
            if (currentAttempt <= 3) {
              setTimeout(() => {
                if (playAttemptRef.current === currentAttempt && video.paused) {
                  attemptPlay();
                }
              }, 200 * currentAttempt);
            }
          });
      }
    };

    // Event handlers
    const handleCanPlay = () => attemptPlay();
    const handleLoadedData = () => attemptPlay();
    const handleLoadedMetadata = () => attemptPlay();

    // Add event listeners
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    // If video is already loaded enough, play immediately
    if (video.readyState >= 2) {
      attemptPlay();
    }

    // For mobile Safari, sometimes we need to wait a tick
    const timeoutId = setTimeout(attemptPlay, 100);
    // Additional delayed attempt for iOS
    const iosTimeoutId = setTimeout(attemptPlay, 500);

    // Store cleanup function
    cleanupRef.current = () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      clearTimeout(timeoutId);
      clearTimeout(iosTimeoutId);
    };
  }, [autoPlay, handleNativeStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

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
          key={previewSrc} // Force remount on source change for iOS
          ref={videoRefCallback}
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