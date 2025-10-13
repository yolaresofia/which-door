import { useEffect } from "react";

type Options = {
  containerRef: React.RefObject<HTMLElement | null>;
  enabled: boolean;
  togglePlay: () => void;
};

/**
 * Adds a single-tap play/pause toggle for touch devices.
 */
export function useTouchPlayToggle({ containerRef, enabled, togglePlay }: Options) {
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    let lastTouchTime = 0;

    const handleTouchEnd = (event: TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest("[data-touch-toggle-ignore]")) {
        lastTouchTime = Date.now();
        return;
      }

      const now = Date.now();
      if (now - lastTouchTime < 250) {
        lastTouchTime = now;
        return;
      }

      lastTouchTime = now;
      togglePlay();
    };

    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [containerRef, enabled, togglePlay]);
}
