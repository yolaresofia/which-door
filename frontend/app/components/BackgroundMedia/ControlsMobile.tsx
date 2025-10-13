import { fmt } from "./utils";

type Props = {
  title?: string;
  subtitle?: string;
  current: number;
  remaining: number;
  progressPct: number;
  muted: boolean;
  onSeekRatio: (ratio: number) => void;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
};

export default function ControlsMobile(props: Props) {
  const {
    title, subtitle, current, remaining, progressPct,
    muted, onSeekRatio, onToggleMute, isFullscreen, onToggleFullscreen
  } = props;

  const handleBarClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeekRatio((e.clientX - rect.left) / rect.width);
  };

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-10 space-y-4 px-6 pb-6 text-white md:hidden"
      data-touch-toggle-ignore
    >
      <div className="flex items-start justify-between gap-4">
        {(title || subtitle) && (
          <div className="flex-1 text-left">
            {title && <div className="text-xl font-semibold leading-snug break-words">{title}</div>}
            {subtitle && <div className="text-sm text-white/80 break-words">{subtitle}</div>}
          </div>
        )}
        <div className="flex flex-none items-center gap-4 text-sm whitespace-nowrap">
          <span className="tabular-nums text-xs opacity-80">{fmt(current)} / {fmt(remaining)}</span>
          <button onClick={onToggleMute} className="underline-offset-4 decoration-white/60 hover:underline">
            {muted ? "Sound OFF" : "Sound ON"}
          </button>
          <button onClick={onToggleFullscreen} className="underline-offset-4 decoration-white/60 hover:underline">
            {isFullscreen ? "Close" : "Fullscreen"}
          </button>
        </div>
      </div>

      <div
        className="relative h-[2px] w-full cursor-pointer bg-white/40"
        onClick={handleBarClick}
        role="progressbar"
        aria-label="Video progress"
      >
        <div className="absolute inset-y-0 left-0" style={{ width: `${progressPct}%` }}>
          <div className="h-full w-full bg-white" />
        </div>
      </div>
    </div>
  );
}
