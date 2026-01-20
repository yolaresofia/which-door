// components/background-media/hooks/useVimeoController.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeUrl } from "../utils";

// Lazy load Vimeo player - it's 50KB+ and only needed for full variant with controls
type VimeoPlayer = import("@vimeo/player").default;
let PlayerPromise: Promise<typeof import("@vimeo/player").default> | null = null;

function getPlayer() {
  if (!PlayerPromise) {
    PlayerPromise = import("@vimeo/player").then((m) => m.default);
  }
  return PlayerPromise;
}

type Options = {
  vimeoSrc?: string; // full URL
  controls: boolean;
};

export function useVimeoController({ vimeoSrc, controls }: Options) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<VimeoPlayer | null>(null);

  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(!controls);
  const [ready, setReady] = useState(false);

  const normalizedSrc = useMemo(() => normalizeUrl(vimeoSrc) ?? undefined, [vimeoSrc]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let destroyed = false;

    // Clean up existing player
    if (playerRef.current) {
      playerRef.current.unload().catch(() => {});
      playerRef.current = null;
    }

    // Lazy load and initialize Vimeo player
    getPlayer().then((Player) => {
      if (destroyed) return;

      const player = new Player(iframe, {
        dnt: true,
        // playsinline here is accepted by PlayerOptions; but if your types complain, it's harmless to keep:
        // @ts-ignore
        playsinline: true,
      });

      playerRef.current = player;
      setReady(false);

      player.on("loaded", async () => {
        if (destroyed) return;
        try {
          const [d] = await Promise.all([
            player.getDuration(),
            player.getVideoWidth().catch(() => undefined),
            player.getVideoHeight().catch(() => undefined),
            player.getVolume().catch(() => undefined),
            player.getLoop().catch(() => undefined),
          ]);
          setDuration(d || 0);
          setReady(true);

          await player.setLoop(true);
          await player.setVolume(!controls ? 0 : 1);
        } catch (e) {
          // ignore load errors
        }
      });

      player.on("timeupdate", (data: any) => {
        if (typeof data?.seconds === "number") setCurrent(data.seconds);
      });

      player.on("play", () => {
        setPlaying(true);
      });
      player.on("pause", () => {
        setPlaying(false);
      });

      player.on("error", (e: any) => {
        const message: string | undefined = typeof e?.message === "string" ? e.message : undefined;
        if (
          e?.name === "TypeError" &&
          message &&
          message.includes("reading 'includes'")
        ) {
          return;
        }
      });
    });

    return () => {
      destroyed = true;
      if (playerRef.current) {
        playerRef.current.unload().catch(() => {});
        playerRef.current = null;
      }
    };
  }, [normalizedSrc, controls, vimeoSrc]); // re-init when URL or settings change

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    (async () => {
      try {
        await p.setVolume(muted ? 0 : 1);
      } catch {}
    })();
  }, [muted]);

  const progressPct = duration ? (current / duration) * 100 : 0;
  const remaining = Math.max(duration - current, 0);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pause();
    else p.play().catch(() => {});
  };

  const toggleMute = () => setMuted((m) => !m);

  const seekToRatio = (ratio: number) => {
    if (!isFinite(duration) || duration <= 0) return;
    const clamped = Math.min(1, Math.max(0, ratio));
    const target = clamped * duration;
    const p = playerRef.current;
    if (p) p.setCurrentTime(target).catch(() => {});
  };

  return {
    duration,
    current,
    remaining,
    progressPct,
    playing,
    muted,
    ready,
    togglePlay,
    toggleMute,
    seekToRatio,
    iframeRef,
  };
}
