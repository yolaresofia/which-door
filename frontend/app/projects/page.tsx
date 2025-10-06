'use client'

import { useState } from 'react'
import Link from 'next/link'
import BackgroundMedia from '../components/BackgroundMedia'
import { projects } from '../components/constants'

const getTitle = (p: any) => p.name ?? p.title ?? 'Untitled'
const getVideo = (p: any) => p.bgVideo ?? p.videoURL ?? ''
const getBgImage = (p: any) => p.bgImage ?? getVideo(p) // GIF-safe fallback

export default function ProjectsPage() {
  const [hovered, setHovered] = useState<number | null>(null)
  const activeIndex = hovered ?? 0
  const active = projects[activeIndex] ?? projects[0]

  if (!active) {
    return (
      <main className="min-h-screen grid place-items-center">
        <p>No projects yet.</p>
      </main>
    )
  }

  const title = getTitle(active)

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <BackgroundMedia
        key={active.slug ?? title}
        imageSrc={getBgImage(active)}
        videoSrc={getVideo(active)}
      />

      <section className="relative z-10 min-h-screen w-full flex md:px-12 px-4 items-center justify-center">
        <ul className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-12 gap-y-10">
          {projects.map((p, i) => {
            const isActive = activeIndex === i
            const dimOthers = activeIndex !== i
            const t = getTitle(p)

            return (
              <li
                key={p.slug ?? `${t}-${i}`}
                className={`transition-opacity duration-200 ${
                  dimOthers ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <Link href={`/projects/${p.slug}`} className="block text-left group outline-none">
                  <h3
                    className={`max-w-[20ch] leading-tight font-semibold text-2xl transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-white/90'
                    }`}
                    // hover only on the NAME triggers background swap
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    // keep keyboard friendly: focus on the link also swaps
                    onFocus={() => setHovered(i)}
                    onBlur={() => setHovered(null)}
                  >
                    {t}
                  </h3>
                  {p.director && (
                    <p
                      className={`text-base transition-colors duration-200 ${
                        isActive ? 'text-white/90' : 'text-white/70'
                      }`}
                    >
                      {p.director}
                    </p>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}
