// components/surfaces/VimeoVideo.tsx
import { useEffect, useRef } from "react";
import { buildVimeoEmbedUrl } from "../utils"; // keep your original import path

type Props = {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  vimeoSrc?: string;
  autoPlay: boolean;
  muted: boolean;
  fillMode?: "cover" | "contain";
  className?: string;
};

export default function VimeoVideo({
  iframeRef,
  vimeoSrc,
  autoPlay,
  muted,
  fillMode = "cover",
  className = "",
}: Props) {
  // Build base URL with only allowed flags
  const base = buildVimeoEmbedUrl(vimeoSrc, { autoplay: autoPlay, muted });
  // Append playsinline *after* (avoids tight VimeoFlags typing)
  const src = base ? `${base}${base.includes("?") ? "&" : "?"}playsinline=1` : "";

  const localRef = useRef<HTMLIFrameElement | null>(null);
  const fitClass = fillMode === "cover" ? "object-cover" : "object-contain";
  const finalClass = `${fitClass} ${className || "h-full w-full"}`;

  useEffect(() => {
    console.debug("[VimeoVideo] src", { vimeoSrc, base, finalSrc: src, autoPlay, muted });
  }, [autoPlay, base, muted, src, vimeoSrc]);

  useEffect(() => {
    const el = (iframeRef?.current ?? localRef.current) as HTMLIFrameElement | null;
    if (!el) return;
    const log = (ctx: string) => {
      const r = el.getBoundingClientRect();
      console.debug("[VimeoVideo] iframe size", ctx, { w: r.width, h: r.height, className: finalClass });
    };
    log("mount");
    const ro = new ResizeObserver(() => log("ResizeObserver"));
    ro.observe(el);
    return () => ro.disconnect();
  }, [finalClass, iframeRef]);

  if (!src) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[VimeoVideo] Invalid Vimeo src:", vimeoSrc);
    }
    return null;
  }

  return (
    <iframe
      ref={(node) => {
        if (iframeRef) (iframeRef as any).current = node;
        localRef.current = node;
      }}
      className={finalClass}
      src={src}
      allow="autoplay; fullscreen; picture-in-picture;"
      allowFullScreen
      data-fill-mode={fillMode}
    />
  );
}
