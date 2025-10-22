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
  const [fontLoaded, setFontLoaded] = useState(false)
  
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
  })

  // CRITICAL FIX: Improved font loading detection
  useEffect(() => {
    let cancelled = false
    let timeoutId: NodeJS.Timeout

    const triggerAnimation = () => {
      if (cancelled) return
      setFontLoaded(true)
      // Use RAF to ensure font is painted before animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          start()
        })
      })
    }

    // Method 1: Font Loading API (best)
    if ('fonts' in document && (document as any).fonts?.ready) {
      ;(document as any).fonts.ready.then(() => {
        // Double-check the specific font is loaded
        ;(document as any).fonts.load('normal 1em Neue').then(
          () => {
            if (!cancelled) triggerAnimation()
          },
          () => {
            // Fallback if font load fails
            if (!cancelled) triggerAnimation()
          }
        )
      })
    } else {
      // Method 2: Fallback for older browsers
      // Wait a bit longer to ensure font is loaded
      timeoutId = setTimeout(triggerAnimation, 100)
    }

    // Method 3: Safety timeout (if font takes too long, show content anyway)
    const safetyTimeout = setTimeout(() => {
      if (!cancelled && !fontLoaded) {
        console.warn('Font loading timeout - showing content anyway')
        triggerAnimation()
      }
    }, 3000) // 3 second max wait

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      clearTimeout(safetyTimeout)
    }
  }, [start, fontLoaded])

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
                className={`transition-opacity duration-300 ease-out ${
                  dimOthers ? 'opacity-40' : 'opacity-100'
                }`}
                style={{ 
                  contain: 'layout paint style',
                  willChange: 'opacity'
                }}
              >
                <Link 
                  href={`/projects/${project?.slug}`} 
                  className="block text-left group outline-none" 
                  data-reveal
                >
                  <h3
                    className={`max-w-[20ch] leading-tight font-semibold text-2xl transition-all duration-300 ease-out ${
                      isHighlighted ? 'text-white' : 'text-white/90'
                    }`}
                    style={{ 
                      backfaceVisibility: 'hidden',
                    }}
                    onMouseEnter={() => select(index)}
                    onFocus={() => select(index)}
                  >
                    {title}
                  </h3>
                  {project?.director && (
                    <p
                      className={`text-base transition-all duration-300 ease-out ${
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