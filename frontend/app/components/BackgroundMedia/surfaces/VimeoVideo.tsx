import { buildVimeoEmbedUrl } from "../utils";

type Props = {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  vimeoSrc?: string;
  autoPlay: boolean;
  muted: boolean;
  fillMode?: "cover" | "contain";
};

export default function VimeoVideo({
  iframeRef,
  vimeoSrc,
  autoPlay,
  muted,
  fillMode = "cover",
}: Props) {
  const src = buildVimeoEmbedUrl(vimeoSrc, { autoplay: autoPlay, muted });
  if (!src) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[VimeoVideo] Invalid Vimeo src:", vimeoSrc);
    }
    return null;
  }

  return (
    <iframe
      ref={iframeRef}
      className={`h-full w-full ${
        fillMode === "cover" ? "object-cover" : "object-contain"
      }`}
      src={src}
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
    />
  );
}
