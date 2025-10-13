import VimeoVideo from "./surfaces/VimeoVideo";

type Props = {
  vimeoSrc?: string;
  controls: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  variant: "full" | "preview";
};

export default function MediaSurface({ vimeoSrc, controls, iframeRef, variant }: Props) {
  const autoPlay = !controls;
  return (
    <div
      className={`flex h-full w-full bg-black ${
        variant === "preview" ? "items-center justify-center" : ""
      }`}
    >
      <VimeoVideo
        iframeRef={iframeRef}
        vimeoSrc={vimeoSrc}
        autoPlay={autoPlay}
        muted={true}
        fillMode={variant === "preview" ? "contain" : "cover"}
      />
    </div>
  );
}
