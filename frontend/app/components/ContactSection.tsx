// app/components/ContactSection.tsx
"use client";

import { useLayoutEffect, useRef, useEffect } from "react";
import gsap from "gsap";
import BackgroundMedia from "./BackgroundMedia/BackgroundMedia";
import { useSequencedReveal } from "@/app/utils/useSequencedReveal";

type ContactSectionProps = {
  bgColor?: string;
  previewUrl?: string;
  showScrim?: boolean;
  showLeftGradient?: boolean;
  previewPoster?: string;
  enableAnimations?: boolean;
};

export default function ContactSection({
  bgColor,
  previewUrl,
  showScrim = false,
  showLeftGradient = false,
  previewPoster,
  enableAnimations = false,
}: ContactSectionProps) {
  const useColorOnly = !!bgColor; // color takes priority
  const desktopLinkRef = useRef<HTMLAnchorElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Desktop animation - EXACT SAME as ProjectsLanding (only when enableAnimations is true)
  const { start } = useSequencedReveal(contentRef, {
    target: '[data-reveal]',
    duration: 0.8,
    ease: 'power2.out',
    from: { opacity: 0, y: 20, scale: 0.98 },
    to: { opacity: 1, y: 0, scale: 1 },
    autoStart: false,
    stagger: {
      each: 0.08,
      from: 'start',
      ease: 'power2.inOut'
    },
  });

  // Trigger animation on mount (only if enableAnimations is true)
  useEffect(() => {
    if (!enableAnimations) return;

    // Start with RAF to ensure DOM is ready
    requestAnimationFrame(() => {
      start();
    });
  }, [start, enableAnimations]);

  useLayoutEffect(() => {
    const el = desktopLinkRef.current;
    if (!el) return;

    // Respect reduced motion
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const idea = el.querySelector(".line-idea");
      const touch = el.querySelector(".line-touch");
      if (!idea || !touch) return;

      // ensure no CSS transitions fight the timeline
      gsap.set([idea, touch], { clearProps: "transition" });

      // initial states
      gsap.set(idea, {
        autoAlpha: 1,
        yPercent: 0,
        filter: "blur(0px)",
        willChange: "transform, opacity, filter",
        backfaceVisibility: "hidden",
      });
      gsap.set(touch, {
        autoAlpha: 0,
        yPercent: 0,
        filter: "blur(6px)",
        willChange: "transform, opacity, filter",
        backfaceVisibility: "hidden",
      });

      // timeline
      tlRef.current = gsap
        .timeline({
          paused: true,
          defaults: { duration: prefersReduced ? 0.001 : 0.45, ease: "power3.inOut" },
        })
        .to(
          idea,
          {
            autoAlpha: 0,
            yPercent: -6,
            filter: "blur(6px)",
          },
          0
        )
        .to(
          touch,
          {
            autoAlpha: 1,
            yPercent: 0,
            filter: "blur(0px)",
          },
          0
        );
    }, desktopLinkRef);

    return () => {
      ctx.revert();
      tlRef.current = null;
    };
  }, []);

  const playSwap = () => tlRef.current?.play();
  const reverseSwap = () => tlRef.current?.reverse();

  return (
    <main className="relative min-h-screen w-full overflow-hidden text-white">
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 -z-10">
        {useColorOnly ? (
          <div className="h-full w-full" style={{ backgroundColor: bgColor }} />
        ) : (
          <BackgroundMedia
          variant="preview"
            previewUrl={previewUrl}
            previewPoster={previewPoster}
            className="absolute inset-0"
          />
        )}

        {showScrim && <div className="absolute inset-0 bg-black/30" />}
        {showLeftGradient && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/40 to-transparent" />
        )}
      </div>

      {/* FOREGROUND CONTENT */}
      <div ref={contentRef} className="relative min-h-screen flex flex-col pt-20">
        <div className="flex-1 grid items-center justify-items-start px-6 md:justify-items-center">
          {/* Tablet & smaller: show BOTH lines stacked, no hover */}
          <a
            href="mailto:info@whichdoor.com"
            className="block lg:hidden text-left leading-tight text-3xl md:text-6xl md:text-center"
            aria-label="Get in touch via email"
            title="Get in touch"
            data-reveal={enableAnimations ? true : undefined}
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
            // trigger the timeline
            onMouseEnter={playSwap}
            onMouseLeave={reverseSwap}
            onFocus={playSwap}
            onBlur={reverseSwap}
            data-reveal={enableAnimations ? true : undefined}
          >
            {/* NOTE: removed transition classes to avoid fighting GSAP */}
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
            <p
              className="leading-tight"
              data-reveal={enableAnimations ? true : undefined}
            >
              We exist on 5 continents, with bases in Stockholm, Barcelona, Baltimore/DC, Beirut,
              Berlin, Buenos Aires, NYC, Nairobi and Iceland.
            </p>

            <div
              className="leading-tight"
              data-reveal={enableAnimations ? true : undefined}
            >
              <p>
                For Inquiries &amp; Commissions{" "}
                <a href="mailto:info@whichdoor.com">info@whichdoor.com</a>
              </p>
              <p>
                For Job Applications &amp; Internships{" "}
                <a href="mailto:apply@whichdoor.com">apply@whichdoor.com</a>
              </p>
            </div>

            <nav
              className="leading-relaxed"
              data-reveal={enableAnimations ? true : undefined}
            >
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
