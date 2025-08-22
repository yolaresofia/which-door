// app/contact/page.tsx
export default function ContactPage() {
    const bg =
      'https://cdn.sanity.io/images/xerhtqd5/production/5441905f27813ad31022fd3b18e8cdd2436b20f5-692x450.gif'
  
    return (
      <main
        className="min-h-screen w-full bg-cover bg-center text-white"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="min-h-screen flex flex-col pt-20">
          <div className="flex-1 grid place-items-center px-6">
            <a
              href="mailto:info@whichdoor.com"
              className="group text-center leading-tight text-7xl whitespace-nowrap inline-grid place-items-center"
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
          <footer className="w-full px-6 pb-8">
            <div className="mx-auto grid gap-8 md:grid-cols-3 text-sm md:text-base">
              <p className="leading-relaxed">
                We exist o 5 continents, with bases in Stockholm, Barcelona,
                Baltimore/DC, Beirut, Berlin, Buenos Aires, NYC, Nairobi and
                Iceland.
              </p>
              <div className="leading-relaxed">
                <p>
                  For Inquiries &amp; Commissions{' '}
                  <a
                    href="mailto:info@whichdoor.com"
                  >
                    info@whichdoor.com
                  </a>
                </p>
                <p>
                  For Job Applications &amp; Internships{' '}
                  <a
                    href="mailto:apply@whichdoor.com"
                  >
                    apply@whichdoor.com
                  </a>
                </p>
              </div>
  
              {/* Right */}
              <nav className="leading-relaxed">
                <ul className="flex gap-4 md:justify-end">
                  <li>
                    <a
                      href="https://vimeo.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Vimeo
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://youtube.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      YouTube
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://instagram.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Instagram
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </footer>
        </div>
      </main>
    )
  }
  