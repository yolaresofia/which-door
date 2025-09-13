'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Arrow from './Arrow';

type ImageType = { url: string; alt?: string };

type Props = {
  images: ImageType[];
  isOpen: boolean;
  onClose: () => void;
  backgroundColor?: string;
  initialIndex?: number;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
};

const OVERLAY_FADE_MS = 300;
const IMAGE_FADE_MS = 200;

export default function ImageLightbox({
  images,
  isOpen,
  onClose,
  backgroundColor = '#477AA1',
  initialIndex = 0,
  currentIndex,
  onIndexChange,
}: Props) {
  const isControlled = typeof currentIndex === 'number' && typeof onIndexChange === 'function';

  // SSR-safe portal mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Index state
  const [displayIndex, setDisplayIndex] = useState<number>(
    isControlled ? (currentIndex as number) : initialIndex
  );
  const [uncontrolledIndex, setUncontrolledIndex] = useState<number>(initialIndex);
  const activeIndex = isControlled ? (currentIndex as number) : uncontrolledIndex;

  // Anim state
  const [isFading, setIsFading] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Mount/unmount + starting index + scroll lock
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;

    if (isOpen && images.length > 0) {
      setShouldRender(true);

      if (isControlled) setDisplayIndex(currentIndex!);
      else {
        setUncontrolledIndex(initialIndex);
        setDisplayIndex(initialIndex);
      }

      const { overflow } = document.body.style;
      document.body.style.overflow = 'hidden';

      requestAnimationFrame(() => setOverlayVisible(true));

      setIsFading(true);
      t = setTimeout(() => setIsFading(false), IMAGE_FADE_MS);

      return () => {
        document.body.style.overflow = overflow;
        if (t) clearTimeout(t);
      };
    } else if (!isOpen && shouldRender) {
      setOverlayVisible(false);
      t = setTimeout(() => setShouldRender(false), OVERLAY_FADE_MS);
      return () => t && clearTimeout(t);
    }
  }, [isOpen, images.length, isControlled, currentIndex, initialIndex, shouldRender]);

  // Crossfade on index change
  useEffect(() => {
    if (!isOpen) return;
    if (activeIndex === displayIndex) return;

    setIsFading(true);
    const t = setTimeout(() => {
      setDisplayIndex(activeIndex);
      setIsFading(false);
    }, IMAGE_FADE_MS);

    return () => clearTimeout(t);
  }, [activeIndex, displayIndex, isOpen]);

  // Stable index setter (FIX)
  const setNextIndex = useCallback(
    (next: number) => {
      if (isControlled) onIndexChange!(next);
      else setUncontrolledIndex(next);
    },
    [isControlled, onIndexChange]
  );

  // Navigation (include setNextIndex in deps) (FIX)
  const goToNext = useCallback(() => {
    if (!images.length) return;
    const next = (activeIndex + 1) % images.length;
    setNextIndex(next);
  }, [activeIndex, images.length, setNextIndex]);

  const goToPrev = useCallback(() => {
    if (!images.length) return;
    const prev = (activeIndex - 1 + images.length) % images.length;
    setNextIndex(prev);
  }, [activeIndex, images.length, setNextIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, goToPrev, goToNext, onClose]);

  // Prevent wheel/touch scroll behind
  useEffect(() => {
    if (!isOpen) return;
    const prevent = (e: Event) => e.preventDefault();
    window.addEventListener('wheel', prevent, { passive: false });
    window.addEventListener('touchmove', prevent, { passive: false });
    return () => {
      window.removeEventListener('wheel', prevent as any);
      window.removeEventListener('touchmove', prevent as any);
    };
  }, [isOpen]);

  // Preload adjacent images
  useEffect(() => {
    if (!isOpen || images.length < 2) return;
    const idxs = [activeIndex, (activeIndex + 1) % images.length, (activeIndex - 1 + images.length) % images.length];
    idxs.forEach((i) => {
      const u = images[i]?.url;
      if (u) {
        const img = new Image();
        img.src = u;
      }
    });
  }, [isOpen, activeIndex, images]);

  if (!mounted || !shouldRender || images.length === 0) return null;
  const current = images[displayIndex];

  const content = (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-4 transition-opacity duration-300 ${
        overlayVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor }}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-8 right-8 text-base font-sans text-white z-50 cursor-pointer"
        aria-label="Close"
      >
        Close [x]
      </button>

      {/* Desktop arrows (white) */}
      <div className="hidden md:block">
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-8 top-1/2 -translate-y-1/2 z-50 cursor-pointer text-white"
              aria-label="Previous"
            >
              <Arrow direction="left" className="w-8 h-8 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-8 top-1/2 -translate-y-1/2 z-50 cursor-pointer text-white"
              aria-label="Next"
            >
              <Arrow direction="right" className="w-8 h-8 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Image */}
      <div
        className={`w-full max-w-5xl aspect-[16/9] bg-center bg-no-repeat bg-contain transition-opacity duration-200 ${
          isFading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ backgroundImage: `url(${current.url})` }}
        role="img"
        aria-label={current.alt || ''}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Mobile arrows (white) */}
      {images.length > 1 && (
        <div
          className="flex md:hidden justify-center gap-8 mt-4 z-50 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={goToPrev} className="cursor-pointer" aria-label="Previous">
            <Arrow direction="left" className="w-6 h-6 text-white" />
          </button>
          <button onClick={goToNext} className="cursor-pointer" aria-label="Next">
            <Arrow direction="right" className="w-6 h-6 text-white" />
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
