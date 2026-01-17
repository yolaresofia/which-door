// MediaSurface.tsx
import { useEffect, useRef, useCallback, useState } from "react";
import VimeoVideo from "./surfaces/VimeoVideo";

type Props = {
  vimeoSrc?: string;
  previewSrc?: string;
  controls: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  variant: "full" | "preview";
  onNativePlaybackStart?: () => void;
};

export default function MediaSurface({
  vimeoSrc,
  previewSrc,
  controls,
  iframeRef,
  variant,
  onNativePlaybackStart,
}: Props) {
  // Use native video for previews, Vimeo for full with controls
  const usingNative = Boolean(previewSrc) && (!controls || !vimeoSrc);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
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

  const handleNativeStart = useCallback(() => {
    if (isMountedRef.current) {
      onNativePlaybackStart?.();
    }
  }, [onNativePlaybackStart]);

  // Called when video has loaded enough data to play
  const handleCanPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isMountedRef.current) return;

    // Explicitly call play() - autoPlay attribute alone doesn't work reliably on mobile
    video.play().catch(() => {});
  }, []);

  // Debug state for visual overlay
  const [debugInfo, setDebugInfo] = useState({
    readyState: 0,
    networkState: 0,
    paused: true,
    buffered: '0',
    currentTime: 0,
    error: '',
    src: previewSrc?.slice(-30) || 'none',
  });

  // Update debug info periodically
  useEffect(() => {
    if (!usingNative) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video) {
        // Get buffered amount
        let bufferedEnd = 0;
        if (video.buffered.length > 0) {
          bufferedEnd = video.buffered.end(video.buffered.length - 1);
        }
        setDebugInfo({
          readyState: video.readyState,
          networkState: video.networkState,
          paused: video.paused,
          buffered: bufferedEnd.toFixed(1) + 's',
          currentTime: Math.round(video.currentTime * 10) / 10,
          error: video.error?.message || '',
          src: previewSrc?.slice(-30) || 'none',
        });
      }
    }, 500);
    return () => clearInterval(interval);
  }, [usingNative, previewSrc]);

  return (
    <div
      ref={containerRef}
      className={containerClass}
      data-variant={variant}
      data-source={usingNative ? "native" : "vimeo"}
    >
      {/* Debug overlay - remove after fixing */}
      {usingNative && (
        <div className="absolute bottom-24 left-4 z-50 bg-black/80 text-white text-xs p-2 rounded max-w-[250px] break-all">
          <div>src: {debugInfo.src}</div>
          <div>ready: {debugInfo.readyState} | net: {debugInfo.networkState}</div>
          <div>paused: {debugInfo.paused ? 'YES' : 'NO'} | buf: {debugInfo.buffered}</div>
          <div>time: {debugInfo.currentTime}</div>
          {debugInfo.error && <div className="text-red-400">err: {debugInfo.error}</div>}
        </div>
      )}
      {usingNative ? (
        <video
          key={previewSrc}
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
          autoPlay
          onCanPlay={handleCanPlay}
          onPlay={handleNativeStart}
          onPlaying={handleNativeStart}
          onCanPlayThrough={handleNativeStart}
        />
      ) : (
        <VimeoVideo
          iframeRef={iframeRef}
          vimeoSrc={vimeoSrc}
          autoPlay
          muted={!controls}
          fillMode={variant === "preview" ? "contain" : "cover"}
          className={mediaClass}
        />
      )}
    </div>
  );
}
