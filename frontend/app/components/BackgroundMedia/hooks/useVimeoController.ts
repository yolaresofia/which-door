// components/background-media/hooks/useVimeoController.ts
import { useEffect, useMemo, useRef, useState } from "react";
import Player from "@vimeo/player";
import { normalizeUrl } from "../utils";

type Options = {
  /** FULL Vimeo URL you render into the iframe (keep query like h=... intact). */
  vimeoSrc?: string;
  /** When false: autoplay muted loop (background). When true: show custom controls. */
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

  // Normalize so changes like &amp;→& trigger a re-init (without ever passing it to Player()).
  const normalizedSrc = useMemo(() => normalizeUrl(vimeoSrc) ?? undefined, [vimeoSrc]);
  const autoplay = !controls;

  // Set up / tear down Player bound to our iframe element.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Clean previous instance if any
    if (playerRef.current) {
      playerRef.current.unload().catch(() => {});
      playerRef.current = null;
    }

    // Create player WITHOUT url/id -> TS constraint avoided
    const player = new Player(iframe, {
      // Intentionally no `url`/`id` here. The iframe already has the full URL.
      dnt: true,
      playsinline: true,
    });

    playerRef.current = player;
    setReady(false);

    // Events
    player.on("loaded", async () => {
      try {
        const d = await player.getDuration();
        setDuration(d || 0);
        setReady(true);

        // Ensure loop + volume states; autoplay is already in iframe URL, but we can try once
        await player.setLoop(true);
        await player.setVolume(muted ? 0 : 1);
        if (autoplay) {
          // Autoplay may still be blocked by policy; ignore rejection
          await player.play().catch(() => {});
        }
      } catch {
        // noop
      }
    });

    player.on("timeupdate", (data: any) => {
      if (typeof data?.seconds === "number") setCurrent(data.seconds);
    });

    player.on("play", () => setPlaying(true));
    player.on("pause", () => setPlaying(false));

    return () => {
      player.unload().catch(() => {});
      playerRef.current = null;
    };
    // Recreate the Player when iframe URL meaningfully changes
  }, [normalizedSrc]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep volume in sync when toggling mute
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
    // state
    duration,
    current,
    remaining,
    progressPct,
    playing,
    muted,
    ready,
    // api
    togglePlay,
    toggleMute,
    seekToRatio,
    // bind this to your <iframe ref={iframeRef} />
    iframeRef,
  };
}
