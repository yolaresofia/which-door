import { fmt } from "./utils";

type Props = {
  title?: string;
  subtitle?: string;
  playing: boolean;
  current: number;
  remaining: number;
  progressPct: number;
  muted: boolean;
  onTogglePlay: () => void;
  onSeekRatio: (ratio: number) => void;
  onToggleMute: () => void;
  onShare?: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
};

export default function ControlsDesktop(props: Props) {
  const {
    title, subtitle, playing, current, remaining, progressPct,
    muted, onTogglePlay, onSeekRatio, onToggleMute, onShare,
    isFullscreen, onToggleFullscreen
  } = props;

  const handleBarClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeekRatio((e.clientX - rect.left) / rect.width);
  };

  return (
    <div
      className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 hidden px-6 md:px-12 text-white sm:p-6 md:block"
      data-touch-toggle-ignore
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="mr-4 min-w-0">
          {title && <div className="text-base font-semibold leading-tight truncate sm:text-2xl">{title}</div>}
          {subtitle && <div className="text-white/85 truncate text-base">{subtitle}</div>}
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-6">
          <button
            onClick={onTogglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
          >
            {playing ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div className="tabular-nums shrink-0 text-sm">{fmt(current)}</div>
          <div
            className="relative h-[2px] w-32 cursor-pointer bg-white/30 sm:w-56 md:w-80 lg:w-[32rem]"
            onClick={handleBarClick}
            role="progressbar"
            aria-label="Video progress"
          >
            <div className="absolute inset-y-0 left-0" style={{ width: `${progressPct}%` }}>
              <div className="h-full w-full bg-white/80" />
            </div>
          </div>
          <div className="tabular-nums shrink-0 text-sm">{fmt(remaining)}</div>
          <button onClick={onToggleMute} className="shrink-0 text-sm underline-offset-4 decoration-white/60 hover:underline">
            {muted ? "Sound OFF" : "Sound ON"}
          </button>
          <button onClick={() => (onShare ? onShare() : console.log("share clicked"))} className="shrink-0 text-sm underline-offset-4 decoration-white/60 hover:underline">
            Share
          </button>
          <button onClick={onToggleFullscreen} className="shrink-0 text-sm underline-offset-4 decoration-white/60 hover:underline">
            {isFullscreen ? "Close" : "Fullscreen"}
          </button>
        </div>
      </div>
    </div>
  );
}
