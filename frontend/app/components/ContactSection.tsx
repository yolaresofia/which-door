// app/components/ContactSection.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import BackgroundMedia from "./BackgroundMedia/BackgroundMedia";

type ContactSectionProps = {
  bgColor?: string;
  previewUrl?: string;
  mobilePreviewUrl?: string;
  showScrim?: boolean;
  showLeftGradient?: boolean;
  previewPoster?: string;
};

export default function ContactSection({
  bgColor,
  previewUrl,
  mobilePreviewUrl,
  showScrim = false,
  showLeftGradient = false,
  previewPoster,
}: ContactSectionProps) {
  const useColorOnly = !!bgColor;
  const desktopLinkRef = useRef<HTMLAnchorElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const hasAnimatedRef = useRef(false);

  const [isMounted, setIsMounted] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // Mark as mounted after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Run stagger animation once mounted (or when video is ready on desktop)
  useGSAP(() => {
    if (!isMounted || !contentRef.current || hasAnimatedRef.current) return;

    const items = contentRef.current.querySelectorAll('[data-reveal]');
    if (items.length === 0) return;

    // On mobile or when using color only, animate immediately
    // On desktop with video, wait for video ready
    const isMobile = window.innerWidth < 1024;
    const shouldWaitForVideo = !isMobile && !useColorOnly && !videoReady;

    if (shouldWaitForVideo) {
      // Hide content while waiting for video
      gsap.set(items, { opacity: 0, y: 20 });
      return;
    }

    hasAnimatedRef.current = true;

    // Animate in with stagger
    gsap.fromTo(
      items,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: {
          each: 0.08,
          from: "start",
        },
      }
    );
  }, { dependencies: [isMounted, videoReady, useColorOnly] });

  // Desktop hover animation for the "Have an idea?" / "Get in touch." swap
  useGSAP(() => {
    const el = desktopLinkRef.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const idea = el.querySelector(".line-idea");
    const touch = el.querySelector(".line-touch");
    if (!idea || !touch) return;

    gsap.set([idea, touch], { clearProps: "transition" });

    gsap.set(idea, {
      autoAlpha: 1,
      yPercent: 0,
      filter: "blur(0px)",
      willChange: "transform, opacity, filter",
    });
    gsap.set(touch, {
      autoAlpha: 0,
      yPercent: 0,
      filter: "blur(6px)",
      willChange: "transform, opacity, filter",
    });

    tlRef.current = gsap
      .timeline({
        paused: true,
        defaults: { duration: prefersReduced ? 0.001 : 0.45, ease: "power3.inOut" },
      })
      .to(idea, { autoAlpha: 0, yPercent: -6, filter: "blur(6px)" }, 0)
      .to(touch, { autoAlpha: 1, yPercent: 0, filter: "blur(0px)" }, 0);

    return () => {
      tlRef.current?.kill();
      tlRef.current = null;
    };
  }, []);

  const playSwap = () => tlRef.current?.play();
  const reverseSwap = () => tlRef.current?.reverse();

  const handleVideoReady = () => {
    setVideoReady(true);
  };

  return (
    <main className="relative min-h-dvh w-full overflow-hidden text-white isolate">
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 -z-10">
        {useColorOnly ? (
          <div className="h-full w-full" style={{ backgroundColor: bgColor }} />
        ) : (
          <BackgroundMedia
            variant="preview"
            previewUrl={previewUrl}
            mobilePreviewUrl={mobilePreviewUrl}
            previewPoster={previewPoster}
            className="absolute inset-0"
            onVideoReady={handleVideoReady}
          />
        )}

        {showScrim && <div className="absolute inset-0 bg-black/30" />}
        {showLeftGradient && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/40 to-transparent" />
        )}
      </div>

      {/* FOREGROUND CONTENT */}
      <div ref={contentRef} className="relative min-h-dvh flex flex-col pt-20 max-w-[1600px] mx-auto w-full">
        <div className="flex-1 grid items-center justify-items-start px-6 md:justify-items-center">
          {/* Tablet & smaller: show BOTH lines stacked, no hover */}
          <a
            href="mailto:info@whichdoor.com"
            className="block lg:hidden text-left leading-tight text-3xl md:text-6xl md:text-center"
            aria-label="Get in touch via email"
            title="Get in touch"
            data-reveal
          >
            <span className="block">Have an idea?</span>
            <span className="block mt-1 md:mt-2 opacity-90">Get in touch.</span>
          </a>

          {/* Desktop (lg+): GSAP morph/crossfade swap */}
          <a
            ref={desktopLinkRef}
            href="mailto:info@whichdoor.com"
            className="hidden lg:inline-grid text-left lg:text-center leading-tight text-3xl lg:text-7xl whitespace-nowrap place-items-start lg:place-items-center"
            aria-label="Get in touch via email"
            title="Get in touch"
            onMouseEnter={playSwap}
            onMouseLeave={reverseSwap}
            onFocus={playSwap}
            onBlur={reverseSwap}
            data-reveal
          >
            <span className="line-idea col-start-1 row-start-1">
              Have an idea?
            </span>
            <span className="line-touch col-start-1 row-start-1 pointer-events-none select-none">
              Get in touch.
            </span>
          </a>
        </div>

        <footer className="w-full px-6 md:px-12 pb-8">
          <div className="mx-auto grid gap-8 md:grid-cols-3 text-sm md:text-base">
            <p className="leading-tight" data-reveal>
              We exist on 5 continents, with bases in Stockholm, Barcelona, Baltimore/DC, Beirut,
              Berlin, Buenos Aires, NYC, Nairobi and Iceland.
            </p>

            <div className="leading-tight" data-reveal>
              <p>
                For Inquiries &amp; Commissions{" "}
                <a href="mailto:info@whichdoor.com">info@whichdoor.com</a>
              </p>
              <p>
                For Job Applications &amp; Internships{" "}
                <a href="mailto:apply@whichdoor.com">apply@whichdoor.com</a>
              </p>
            </div>

            <nav className="leading-relaxed" data-reveal>
              <ul className="flex gap-4 md:justify-end">
                <li>
                  <a href="https://vimeo.com/" target="_blank" rel="noopener noreferrer">
                    Vimeo
                  </a>
                </li>
                <li>
                  <a href="https://youtube.com/" target="_blank" rel="noopener noreferrer">
                    YouTube
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer">
                    Instagram
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </footer>
      </div>
    </main>
  );
}
