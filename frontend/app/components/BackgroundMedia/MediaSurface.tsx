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
  const usingNative = Boolean(previewSrc) && (!controls || !vimeoSrc);

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
    if (!usingNative) return;
    const video = videoRef.current;
    if (!video) return;
    if (!autoPlay) return;
    const playPromise = video.play();
    if (typeof playPromise?.catch === "function") {
      playPromise.catch(() => {
        // Autoplay might be blocked; ignore to avoid console noise.
      });
    }
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
