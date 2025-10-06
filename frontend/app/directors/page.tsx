'use client'

import {useEffect, useState} from 'react'
import Link from 'next/link'
import {directors} from '../components/constants'
import BackgroundMedia from '../components/BackgroundMedia'

export default function DirectorsIndexPage() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const activeIndex = hoveredIndex ?? 3
  const active = directors[activeIndex] ?? directors[0]

  useEffect(() => {
    directors.forEach((d) => {
      if (d.bgVideo && /\.gif($|\?)/i.test(d.bgVideo)) {
        const img = new Image()
        img.src = d.bgVideo
      }
    })
  }, [])

  return (
    <main className="relative min-h-dvh w-full overflow-hidden text-white">
      <BackgroundMedia imageSrc={active.bgImage} videoSrc={active.bgVideo} />

      <section className="relative min-h-dvh w-full pt-32">
        <ul className="md:pl-12 max-w-none md:space-y-2 space-y-6 px-6">
          {directors.map((d, i) => {
            const isActive = i === activeIndex
            return (
              <li
                key={d.slug}
                className={`transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-70'}`}
              >
                <Link
                  href={`/directors/${d.slug}`}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setHoveredIndex(i)}
                  onBlur={() => setHoveredIndex(null)}
                  onTouchStart={() => setHoveredIndex(i)}
                  aria-current={isActive ? 'page' : undefined}
                  className="block outline-none"
                >
                  <span
                    className={[
                      'block leading-[1.05] tracking-tight transition-all duration-200',
                      'md:text-6xl text-3xl',
                      isActive ? 'text-white' : 'text-white/80',
                    ].join(' ')}
                  >
                    {d.name}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}
