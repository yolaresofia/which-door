'use client'

import { useState } from 'react'
import { projects } from '../components/constants'

export default function ProjectsPage() {
  const [hovered, setHovered] = useState<number | null>(null)
  const activeIndex = hovered ?? 0
  const bg = projects[activeIndex]?.videoURL

  return (
    <main
      className="min-h-screen w-full bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <section className="min-h-screen w-full pt-20 grid place-items-center">
        <ul className="flex flex-wrap justify-center gap-20">
          {projects.map((p, i) => {
            const isActive = activeIndex === i
            const dimOthers = activeIndex !== i

            return (
              <li
                key={p.title}
                className={`transition-opacity duration-200 ${
                  dimOthers ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <button
                  type="button"
                  className="text-left group outline-none"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                >
                  <h3
                    className={`max-w-[16ch] md:max-w-[12ch] leading-tight font-semibold text-2xl transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-white/90'
                    }`}
                  >
                    {p.title}
                  </h3>
                  <p
                    className={`text-base transition-colors duration-200 ${
                      isActive ? 'text-white/90' : 'text-white/70'
                    }`}
                  >
                    {p.director}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}
