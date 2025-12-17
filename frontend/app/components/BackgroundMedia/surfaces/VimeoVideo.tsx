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
  // Always use object-cover on large screens (lg and above) to ensure full coverage without black bars
  const fitClass = fillMode === "cover" ? "object-cover" : "object-contain lg:object-cover";
  const finalClass = `${fitClass} transition-opacity duration-700 ease-in-out ${className || "h-full w-full"}`;

  if (!src) {
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
