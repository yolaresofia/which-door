import { useEffect, useState } from "react";

export function useFullscreen(containerEl: React.RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handle = () => {
      const fsEl =
        document.fullscreenElement ??
        (document as any).webkitFullscreenElement ??
        (document as any).mozFullScreenElement ??
        (document as any).msFullscreenElement;
      setIsFullscreen(fsEl === containerEl.current);
    };
    document.addEventListener("fullscreenchange", handle);
    document.addEventListener("webkitfullscreenchange" as any, handle);
    document.addEventListener("mozfullscreenchange" as any, handle);
    document.addEventListener("MSFullscreenChange" as any, handle);
    handle();
    return () => {
      document.removeEventListener("fullscreenchange", handle);
      document.removeEventListener("webkitfullscreenchange" as any, handle);
      document.removeEventListener("mozfullscreenchange" as any, handle);
      document.removeEventListener("MSFullscreenChange" as any, handle);
    };
  }, [containerEl]);

  const toggleFullscreen = () => {
    const el = containerEl.current;
    if (!el) return;
    const doc = document as any;

    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
      else if (doc.msExitFullscreen) doc.msExitFullscreen();
      return;
    }

    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    else if ((el as any).mozRequestFullScreen) (el as any).mozRequestFullScreen();
    else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen();
  };

  return { isFullscreen, toggleFullscreen };
}
