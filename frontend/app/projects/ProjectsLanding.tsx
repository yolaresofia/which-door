'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import BackgroundMedia from '../components/BackgroundMedia'
import { projects } from '../components/constants'
import { useCrossfadeMedia } from '../utils/useCrossfadeMedia'
import { useSequencedReveal } from '../utils/useSequencedReveal'

const getTitle = (p: any) => p?.name ?? p?.title ?? 'Untitled'
const getPreview = (p: any) => p?.previewUrl ?? ''
const getVimeo = (p: any) => p?.vimeoUrl ?? ''
const getPoster = (p: any) => p?.previewPoster ?? ''
const getBgColor = (p: any) => p?.bgColor ?? '#000'

export default function ProjectsLanding() {
  const first = projects[0]
  const initial = {
    id: first?.slug ?? 0,
    videoSrc: getPreview(first) || getVimeo(first),
    previewUrl: getPreview(first),
    vimeoUrl: getVimeo(first),
    previewPoster: getPoster(first),
    bgColor: getBgColor(first),
  }

  const { setSlotRef, slotMedia, crossfadeTo } = useCrossfadeMedia(initial, { duration: 0.45 })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const select = (i: number) => {
    if (i === selectedIndex) return
    setSelectedIndex(i)
    const project = projects[i]
    crossfadeTo({
      id: project?.slug ?? i,
      videoSrc: getPreview(project) || getVimeo(project),
      previewUrl: getPreview(project),
      vimeoUrl: getVimeo(project),
      previewPoster: getPoster(project),
      bgColor: getBgColor(project),
    })
  }

  const listRef = useRef<HTMLUListElement | null>(null)
  const { start } = useSequencedReveal(listRef, {
    target: '[data-reveal]',
    duration: 0.22,
    ease: 'power4.out',
    from: { opacity: 0, y: 18 },
    to: { autoAlpha: 1, y: 0 },
    autoStart: false,
    stagger: { amount: 0.3, from: 0 },
  })

  useEffect(() => {
    let cancelled = false
    const go = () => {
      if (cancelled) return
      const raf = requestAnimationFrame(() => start())
      ;(go as any)._raf = raf
    }

    if ('fonts' in document && (document as any).fonts?.ready) {
      ;(document as any).fonts.ready.then(go)
    } else {
      go()
    }

    return () => {
      cancelled = true
      if ((go as any)._raf) cancelAnimationFrame((go as any)._raf)
    }
  }, [start])

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0 bg-black">
        <div
          ref={(el) => {
            setSlotRef(0)(el)
          }}
          className="absolute inset-0"
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
          ref={(el) => {
            setSlotRef(1)(el)
          }}
          className="absolute inset-0"
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

      <section className="relative z-10 min-h-screen w-full flex md:px-12 px-4 items-center justify-center">
        <ul
          ref={listRef}
          className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-12 gap-y-10"
        >
          {projects.map((project, index) => {
            const title = getTitle(project)
            const isHighlighted = selectedIndex === index
            const dimOthers = !isHighlighted

            return (
              <li
                key={project?.slug ?? `${title}-${index}`}
                className={`transition-opacity duration-200 ${dimOthers ? 'opacity-30' : 'opacity-100'}`}
                style={{ contain: 'layout paint style' }}
              >
                <Link href={`/projects/${project?.slug}`} className="block text-left group outline-none" data-reveal>
                  <h3
                    className={`max-w-[20ch] leading-tight font-semibold text-2xl transition-colors duration-200 will-change-transform ${
                      isHighlighted ? 'text-white' : 'text-white/90'
                    }`}
                    style={{ backfaceVisibility: 'hidden' }}
                    onMouseEnter={() => select(index)}
                    onFocus={() => select(index)}
                  >
                    {title}
                  </h3>
                  {project?.director && (
                    <p
                      className={`text-base transition-colors duration-200 ${
                        isHighlighted ? 'text-white/90' : 'text-white/70'
                      }`}
                    >
                      {project.director}
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
