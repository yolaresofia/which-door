// components/background-media/hooks/useVimeoController.ts
import { useEffect, useMemo, useRef, useState } from "react";
import Player from "@vimeo/player";
import { normalizeUrl } from "../utils";

type Options = {
  vimeoSrc?: string; // full URL
  controls: boolean;
};

export function useVimeoController({ vimeoSrc, controls }: Options) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<Player | null>(null);

  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(!controls);
  const [ready, setReady] = useState(false);

  const normalizedSrc = useMemo(() => normalizeUrl(vimeoSrc) ?? undefined, [vimeoSrc]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    if (playerRef.current) {
      playerRef.current.unload().catch(() => {});
      playerRef.current = null;
    }

    const player = new Player(iframe, {
      dnt: true,
      // playsinline here is accepted by PlayerOptions; but if your types complain, it’s harmless to keep:
      // @ts-ignore
      playsinline: true,
    });

    playerRef.current = player;
    setReady(false);

    const autoplay = !controls;
    console.debug("[useVimeoController] init", { vimeoSrc, normalizedSrc, controls, autoplay });

    player.on("loaded", async () => {
      try {
        const [d, vw, vh, vol, loop] = await Promise.all([
          player.getDuration(),
          player.getVideoWidth().catch(() => undefined),
          player.getVideoHeight().catch(() => undefined),
          player.getVolume().catch(() => undefined),
          player.getLoop().catch(() => undefined),
        ]);
        setDuration(d || 0);
        setReady(true);
        console.debug("[useVimeoController] loaded", {
          duration: d,
          intrinsic: { width: vw, height: vh, ar: vw && vh ? vw / vh : undefined },
          volume: vol,
          loop,
        });

        await player.setLoop(true);
        await player.setVolume(controls ? 1 : 0);
        if (autoplay) {
          await player.play().catch((err) => {
            console.warn("[useVimeoController] autoplay blocked", err?.name || err);
          });
        }
      } catch (e) {
        console.warn("[useVimeoController] loaded handler error", e);
      }
    });

    player.on("timeupdate", (data: any) => {
      if (typeof data?.seconds === "number") setCurrent(data.seconds);
    });

    player.on("play", () => {
      setPlaying(true);
      console.debug("[useVimeoController] play");
    });
    player.on("pause", () => {
      setPlaying(false);
      console.debug("[useVimeoController] pause");
    });

    player.on("error", (e: any) => console.error("[useVimeoController] player error", e));

    return () => {
      player.unload().catch(() => {});
      playerRef.current = null;
      console.debug("[useVimeoController] teardown");
    };
  }, [normalizedSrc, controls, vimeoSrc]); // re-init when URL or control mode changes

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    (async () => {
      try {
        await p.setVolume(muted ? 0 : 1);
        console.debug("[useVimeoController] setVolume", { muted });
      } catch {}
    })();
  }, [muted]);

  const progressPct = duration ? (current / duration) * 100 : 0;
  const remaining = Math.max(duration - current, 0);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pause();
    else p.play().catch((err) => console.warn("[useVimeoController] play reject", err));
  };

  const toggleMute = () => setMuted((m) => !m);

  const seekToRatio = (ratio: number) => {
    if (!isFinite(duration) || duration <= 0) return;
    const clamped = Math.min(1, Math.max(0, ratio));
    const target = clamped * duration;
    const p = playerRef.current;
    if (p) p.setCurrentTime(target).catch((err) => console.warn("[useVimeoController] seek reject", err));
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
