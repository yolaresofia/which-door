'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { directors } from '../components/constants'
import { useCrossfadeMedia } from '../utils/useCrossfadeMedia'
import BackgroundMedia from '../components/BackgroundMedia/BackgroundMedia'

const DEFAULT_INDEX = 3

const getMedia = (d: any, i: number) => ({
  id: d?.slug ?? i,
  videoSrc: d?.previewUrl ?? d?.vimeoUrl ?? '',
  previewUrl: d?.previewUrl ?? '',
  vimeoUrl: d?.vimeoUrl ?? '',
  previewPoster: d?.previewPoster ?? '',
  bgColor: d?.bgColor ?? '#477AA1',
})

export default function DirectorsIndexPage() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const initialIdx =
    Number.isInteger(DEFAULT_INDEX) && directors[DEFAULT_INDEX] ? DEFAULT_INDEX : 0
  const initialMedia = getMedia(directors[initialIdx], initialIdx)

  const { setSlotRef, slotMedia, crossfadeTo } = useCrossfadeMedia(initialMedia, {
    duration: 0.45,
  })

  const activeIndex = hoveredIndex ?? initialIdx

  // Handlers to request a crossfade
  const select = (i: number) => {
    const d = directors[i]
    if (!d) return
    setHoveredIndex(i)
    crossfadeTo(getMedia(d, i))
  }
  const resetToDefault = () => {
    setHoveredIndex(null)
    crossfadeTo(initialMedia)
  }

  return (
    <main className="relative min-h-dvh w-full overflow-hidden text-white">
      {/* BACKGROUND (preview variant) */}
      <div className="absolute inset-0 z-0 bg-black">
        <div
          ref={el => { setSlotRef(0)(el) }}
          className="absolute inset-0 will-change-opacity will-change-transform"
          style={{ pointerEvents: 'none' }}
        >
          {slotMedia[0] && (
            <BackgroundMedia
              variant="preview"
              previewUrl={slotMedia[0].previewUrl ?? slotMedia[0].videoSrc}
              vimeoUrl={slotMedia[0].vimeoUrl ?? slotMedia[0].videoSrc}
              previewPoster={slotMedia[0].previewPoster}
              bgColor={slotMedia[0].bgColor}
            />
          )}
        </div>
        <div
          ref={el => { setSlotRef(1)(el) }}
          className="absolute inset-0 will-change-opacity will-change-transform"
          style={{ pointerEvents: 'none' }}
        >
          {slotMedia[1] && (
            <BackgroundMedia
              variant="preview"
              previewUrl={slotMedia[1].previewUrl ?? slotMedia[1].videoSrc}
              vimeoUrl={slotMedia[1].vimeoUrl ?? slotMedia[1].videoSrc}
              previewPoster={slotMedia[1].previewPoster}
              bgColor={slotMedia[1].bgColor}
            />
          )}
        </div>
      </div>

      {/* FOREGROUND LIST */}
      <section className="relative min-h-dvh w-full pt-32">
        <ul
          className="md:pl-12 max-w-none md:space-y-2 space-y-6 px-6"
          onMouseLeave={resetToDefault}
          onTouchEnd={resetToDefault}
        >
          {directors.map((d, i) => {
            const isActive = i === activeIndex
            return (
              <li
                key={d.slug}
                className={`transition-opacity duration-200 ${
                  isActive ? 'opacity-100' : 'opacity-70'
                }`}
              >
                <Link
                  href={`/directors/${d.slug}`}
                  aria-current={isActive ? 'page' : undefined}
                  className="block outline-none"
                  onMouseEnter={() => select(i)}
                  onFocus={() => select(i)}
                  onTouchStart={() => select(i)}
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
