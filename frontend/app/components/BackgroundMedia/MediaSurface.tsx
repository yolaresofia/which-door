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

  // // Handle autoplay when video is ready or source changes
  // useEffect(() => {
  //   if (!usingNative || !autoPlay) return;
  //   const video = videoRef.current;
  //   if (!video) return;

  //   // Track if source changed
  //   const sourceChanged = lastSrcRef.current !== previewSrc;
  //   lastSrcRef.current = previewSrc;

  //   // Play attempt with aggressive retry for mobile
  //   const attemptPlay = (retryCount = 0) => {
  //     // Check if still mounted before playing
  //     if (!isMountedRef.current) return;
  //     if (!video.paused) return;

  //     // Ensure muted for autoplay policy (required for mobile)
  //     video.muted = true;
  //     video.playsInline = true;

  //     // Force attributes on the video element
  //     video.setAttribute('muted', '');
  //     video.setAttribute('playsinline', '');
  //     video.setAttribute('autoplay', '');

  //     const playPromise = video.play();
  //     if (playPromise?.then) {
  //       playPromise
  //         .then(() => {
  //           // Success - video is playing
  //         })
  //         .catch(() => {
  //           // Aggressive retry - mobile browsers are finnicky
  //           // Increase max retries and use exponential backoff
  //           if (retryCount < 5 && isMountedRef.current) {
  //             const delay = Math.min(100 * Math.pow(1.5, retryCount), 500);
  //             setTimeout(() => attemptPlay(retryCount + 1), delay);
  //           }
  //         });
  //     }
  //   };

  //   // If source changed, the video element's src attribute will update automatically
  //   // DON'T call video.load() as it interrupts playback on mobile
  //   // The browser will handle loading the new source when src changes

  //   // Try to play when ready
  //   const handleCanPlay = () => {
  //     if (isMountedRef.current) {
  //       attemptPlay();
  //     }
  //   };

  //   const handleLoadedData = () => {
  //     if (isMountedRef.current) {
  //       attemptPlay();
  //     }
  //   };

  //   video.addEventListener("canplay", handleCanPlay);
  //   video.addEventListener("loadeddata", handleLoadedData);

  //   // If already ready, try now
  //   if (video.readyState >= 3) {
  //     attemptPlay();
  //   } else if (video.readyState >= 1) {
  //     // HAVE_METADATA - try to play, browser will buffer
  //     attemptPlay();
  //   } else if (sourceChanged && previewSrc) {
  //     // For source changes, wait a frame then try to play
  //     requestAnimationFrame(() => {
  //       if (isMountedRef.current) {
  //         attemptPlay();
  //       }
  //     });
  //   } else {
  //     // Initial load - try immediately, the video element has autoPlay attribute
  //     requestAnimationFrame(() => {
  //       if (isMountedRef.current) {
  //         attemptPlay();
  //       }
  //     });
  //   }

  //   // Also try playing on visibility change (mobile safari quirk)
  //   const handleVisibilityChange = () => {
  //     if (document.visibilityState === 'visible' && isMountedRef.current) {
  //       attemptPlay();
  //     }
  //   };

  //   // And on page show (for bfcache)
  //   const handlePageShow = () => {
  //     if (isMountedRef.current) {
  //       attemptPlay();
  //     }
  //   };

  //   // Fallback: try playing on first user interaction (touch/click anywhere)
  //   // This handles cases where autoplay is blocked until user gesture
  //   const handleUserInteraction = () => {
  //     if (isMountedRef.current && video.paused) {
  //       attemptPlay();
  //     }
  //     // Remove after first attempt to avoid repeated calls
  //     document.removeEventListener('touchstart', handleUserInteraction);
  //     document.removeEventListener('click', handleUserInteraction);
  //   };

  //   document.addEventListener('visibilitychange', handleVisibilityChange);
  //   window.addEventListener('pageshow', handlePageShow);
  //   document.addEventListener('touchstart', handleUserInteraction, { passive: true, once: true });
  //   document.addEventListener('click', handleUserInteraction, { once: true });

  //   return () => {
  //     video.removeEventListener("canplay", handleCanPlay);
  //     video.removeEventListener("loadeddata", handleLoadedData);
  //     document.removeEventListener('visibilitychange', handleVisibilityChange);
  //     window.removeEventListener('pageshow', handlePageShow);
  //     document.removeEventListener('touchstart', handleUserInteraction);
  //     document.removeEventListener('click', handleUserInteraction);
  //   };
  // }, [usingNative, previewSrc, autoPlay]);

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
          className={`${mediaClass} object-cover`}
          src={previewSrc}
          muted
          loop
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          controls={false}
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
