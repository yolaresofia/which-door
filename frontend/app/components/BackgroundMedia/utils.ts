// utils.ts
export function normalizeUrl(input?: string): string | null {
  if (!input) return null;
  return input.replace(/&amp;/g, "&").trim() || null;
}

type VimeoFlags = { autoplay: boolean; muted: boolean };

export function buildVimeoEmbedUrl(input?: string, flags?: VimeoFlags): string | null {
  const normalized = normalizeUrl(input);
  if (!normalized) return null;

  // Try full URL first
  let u: URL | null = null;
  try {
    u = new URL(normalized);
  } catch {
    // Accept raw numeric IDs as a convenience
    if (/^\d+$/.test(normalized)) {
      u = new URL(`https://player.vimeo.com/video/${normalized}`);
    } else {
      return null; // Not a valid URL or ID
    }
  }

  // Append our standard params
  const autoplay = flags?.autoplay ?? false;
  const muted = flags?.muted ?? false;
  u.searchParams.set("autoplay", autoplay ? "1" : "0");
  u.searchParams.set("muted", muted ? "1" : "0");
  u.searchParams.set("loop", "1");
  u.searchParams.set("controls", "0");
  u.searchParams.set("portrait", "0");
  u.searchParams.set("title", "0");
  u.searchParams.set("byline", "0");
  u.searchParams.set("playsinline", "1");
  u.searchParams.set("dnt", "1");

  return u.toString();
}

export const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const fmtTime = (sec: number) => {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${pad(m)}:${pad(s)}`;
};

// Back-compat alias so existing imports keep working:
export { fmtTime as fmt };