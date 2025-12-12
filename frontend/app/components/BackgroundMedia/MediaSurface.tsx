// MediaSurface.tsx
import { useEffect, useRef } from "react";
import VimeoVideo from "./surfaces/VimeoVideo";
import HLSVideo from "./surfaces/HLSVideo";

type Props = {
  vimeoSrc?: string;
  previewSrc?: string;
  hlsSrc?: string;
  controls: boolean;
  autoPlay: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  variant: "full" | "preview";
  onNativePlaybackStart?: () => void;
};

export default function MediaSurface({
  vimeoSrc,
  previewSrc,
  hlsSrc,
  controls,
  autoPlay,
  iframeRef,
  variant,
  onNativePlaybackStart,
}: Props) {
  // Priority: HLS > native video > Vimeo
  // HLS provides adaptive quality - perfect for mobile (will auto-select lower quality)
  const usingHLS = Boolean(hlsSrc) && !controls
  const usingNative = !usingHLS && Boolean(previewSrc) && (!controls || !vimeoSrc);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const name = `MediaSurface(${variant})`;

  // Shared centering
  const containerClass =
    "absolute inset-0 flex bg-black items-center justify-center " +
    (variant === "preview" ? "h-screen md:h-full" : "");
  // Always use w-full h-full on large screens (lg+) to ensure full coverage
  const mediaClass =
    variant === "preview"
      ? "w-full h-full"
      : "w-full aspect-video md:aspect-auto md:w-full md:h-full lg:!w-full lg:!h-full";

  useEffect(() => {
    // Skip autoplay handling for HLS (HLSVideo component handles it)
    if (usingHLS) return;
    if (!usingNative) return;
    const video = videoRef.current;
    if (!video) return;

    // Wait for video to be ready before attempting autoplay
    const attemptPlay = () => {
      if (!autoPlay) return;
      const playPromise = video.play();
      if (typeof playPromise?.catch === "function") {
        playPromise.catch(() => {
          // Autoplay might be blocked; ignore to avoid console noise.
        });
      }
    };

    // If video is already loaded, play immediately
    if (video.readyState >= 3) {
      attemptPlay();
    } else {
      // Otherwise wait for canplay event
      const handleCanPlay = () => {
        attemptPlay();
      };
      video.addEventListener("canplay", handleCanPlay, { once: true });
      return () => {
        video.removeEventListener("canplay", handleCanPlay);
      };
    }
  }, [usingHLS, usingNative, previewSrc, autoPlay]);

  const handleNativeStart = () => {
    onNativePlaybackStart?.();
  };

  return (
    <div
      ref={containerRef}
      className={containerClass}
      data-variant={variant}
      data-source={usingHLS ? "hls" : usingNative ? "native" : "vimeo"}
    >
      {usingHLS ? (
        <HLSVideo
          key={hlsSrc}
          hlsSrc={hlsSrc!}
          fallbackSrc={previewSrc}
          autoPlay={autoPlay}
          muted={true}
          loop={true}
          className={mediaClass}
          onPlay={handleNativeStart}
          onPlaying={handleNativeStart}
        />
      ) : usingNative ? (
        <video
          key={previewSrc}
          ref={videoRef}
          className={`${mediaClass} object-cover`}
          src={previewSrc}
          muted
          loop
          playsInline
          preload="auto"
          autoPlay={autoPlay}
          onPlay={handleNativeStart}
          onPlaying={handleNativeStart}
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
