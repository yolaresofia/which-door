// app/components/ContactSection.tsx
"use client";

import BackgroundMedia from "./BackgroundMedia/BackgroundMedia";

type ContactSectionProps = {
  /** Optional solid background color (wins over video if both are provided) */
  bgColor?: string;
  /** Optional background video url (Vimeo full URL or ID) */
  vimeoPreviewUrl?: string;
  /** Overlays for readability (optional) */
  showScrim?: boolean;
  showLeftGradient?: boolean;
  previewPoster?: string; // optional poster for video preview mode
};

export default function ContactSection({
  bgColor,
  vimeoPreviewUrl,
  showScrim = false,
  showLeftGradient = false,
  previewPoster,
}: ContactSectionProps) {
  const useColorOnly = !!bgColor; // color takes priority

  return (
    <main className="relative min-h-screen w-full overflow-hidden text-white">
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 -z-10">
        {useColorOnly ? (
          <div className="h-full w-full" style={{ backgroundColor: bgColor }} />
        ) : (
          <BackgroundMedia vimeoPreviewUrl={vimeoPreviewUrl} previewPoster={previewPoster} className="absolute inset-0" />
        )}

        {/* Optional overlays above background for legibility */}
        {showScrim && <div className="absolute inset-0 bg-black/30" />}
        {showLeftGradient && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/40 to-transparent" />
        )}
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="relative min-h-screen flex flex-col pt-20">
        <div className="flex-1 grid items-center justify-items-start px-6 md:justify-items-center">
          <a
            href="mailto:info@whichdoor.com"
            className="group text-left md:text-center leading-tight md:text-7xl text-3xl whitespace-nowrap inline-grid place-items-start md:place-items-center"
            aria-label="Get in touch via email"
            title="Get in touch"
          >
            <span className="col-start-1 row-start-1 transition-all duration-300 ease-in-out group-hover:opacity-0 group-hover:translate-y-1">
              Have an idea?
            </span>
            <span className="col-start-1 row-start-1 opacity-0 translate-y-1 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none select-none">
              Get in touch.
            </span>
          </a>
        </div>

        <footer className="w-full px-6 md:px-12 pb-8">
          <div className="mx-auto grid gap-8 md:grid-cols-3 text-sm md:text-base">
            <p className="leading-tight">
              We exist on 5 continents, with bases in Stockholm, Barcelona, Baltimore/DC, Beirut,
              Berlin, Buenos Aires, NYC, Nairobi and Iceland.
            </p>

            <div className="leading-tight">
              <p>
                For Inquiries &amp; Commissions{" "}
                <a href="mailto:info@whichdoor.com">info@whichdoor.com</a>
              </p>
              <p>
                For Job Applications &amp; Internships{" "}
                <a href="mailto:apply@whichdoor.com">apply@whichdoor.com</a>
              </p>
            </div>

            <nav className="leading-relaxed">
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
