// BackgroundMedia.tsx
// Thin routing wrapper — delegates to BackgroundVideo or VimeoPlayer.
// All existing callers keep working without changes.
"use client";

import BackgroundVideo from "./BackgroundVideo";
import VimeoPlayer from "./VimeoPlayer";

export type BackgroundMediaProps = {
  vimeoUrl?: string;
  previewUrl?: string;
  mobilePreviewUrl?: string;
  previewPoster?: string;
  previewPosterLQIP?: string;
  variant?: "full" | "preview";
  bgColor?: string;
  className?: string;
  controls?: boolean;
  title?: string;
  subtitle?: string;
  onShare?: () => void;
  onVideoReady?: () => void;
};

export default function BackgroundMedia({
  vimeoUrl,
  previewUrl,
  mobilePreviewUrl,
  previewPoster,
  previewPosterLQIP,
  variant = "full",
  bgColor,
  className = "",
  controls = false,
  title,
  subtitle,
  onShare,
  onVideoReady,
}: BackgroundMediaProps) {
  const hasVimeo = Boolean(vimeoUrl);
  const useVimeo = controls && hasVimeo && variant !== "preview";

  if (useVimeo) {
    return (
      <VimeoPlayer
        vimeoUrl={vimeoUrl!}
        previewPoster={previewPoster}
        previewPosterLQIP={previewPosterLQIP}
        title={title}
        subtitle={subtitle}
        className={className}
        onShare={onShare}
      />
    );
  }

  // Native background video (default for all preview/landing uses)
  return (
    <BackgroundVideo
      previewUrl={previewUrl}
      mobilePreviewUrl={mobilePreviewUrl}
      bgColor={bgColor}
      className={className}
      onVideoReady={onVideoReady}
    />
  );
}
