// MediaSurface.tsx
import { useEffect, useRef } from "react";
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
  const autoPlay = !controls;
  const usingNative = Boolean(previewSrc) && (!controls || !vimeoSrc);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const name = `MediaSurface(${variant})`;

  // Shared centering
  const containerClass =
    "absolute inset-0 flex bg-black items-center justify-center " +
    (variant === "preview" ? "h-screen md:h-full" : "");
  const mediaClass =
    variant === "preview"
      ? "w-full h-full"
      : "w-full aspect-video md:aspect-auto md:w-full md:h-full";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    console.debug(`[${name}] mount`, {
      vimeoSrc,
      previewSrc,
      controls,
      autoPlay,
      usingNative,
      containerClass,
      mediaClass,
      ua: navigator.userAgent,
    });

    const logSizes = (ctx = "initial") => {
      const r = el.getBoundingClientRect();
      const vv = (window as any).visualViewport;
      console.debug(`[${name}] sizes (${ctx})`, {
        container: { w: r.width, h: r.height },
        innerHeight: window.innerHeight,
        visualViewportH: vv?.height,
        devicePixelRatio: window.devicePixelRatio,
      });
    };

    logSizes("mount");

    const ro = new ResizeObserver(() => logSizes("ResizeObserver"));
    ro.observe(el);

    const onResize = () => logSizes("window.resize");
    window.addEventListener("resize", onResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      console.debug(`[${name}] unmount`);
    };
  }, [autoPlay, containerClass, mediaClass, name, usingNative, vimeoSrc, previewSrc, controls]);

  // Quick viewport unit sanity
  useEffect(() => {
    const testEl = document.createElement("div");
    testEl.style.position = "absolute";
    testEl.style.height = "100svh";
    document.body.appendChild(testEl);
    const svhPx = testEl.getBoundingClientRect().height;
    testEl.style.height = "100vh";
    const vhPx = testEl.getBoundingClientRect().height;
    document.body.removeChild(testEl);
    console.debug(`[${name}] viewport-units`, { svhPx, vhPx, innerHeight: window.innerHeight });
  }, [name]);

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
          muted={true}
          fillMode={variant === "preview" ? "contain" : "cover"}
          className={mediaClass}
        />
      )}
    </div>
  );
}
