'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { directors } from '../components/constants'
import { useBackgroundMedia, type Media } from '../context/BackgroundMediaContext'
import { useSequencedReveal } from '../utils/useSequencedReveal'
import { useFadeOutNavigation } from '../utils/useFadeOutNavigation'
import { REVEAL_HIDDEN_STYLE, REVEAL_HIDDEN_STYLE_SIMPLE } from '../utils/useRevealAnimation'
import { useGSAP } from '@gsap/react'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_INDEX = 3

/** Convert a director to Media format for the global background */
function directorToMedia(d: any, i: number): Media {
  return {
    id: d?.slug ?? i,
    videoSrc: d?.previewUrl ?? d?.vimeoUrl ?? '',
    previewUrl: d?.previewUrl ?? '',
    mobilePreviewUrl: d?.mobilePreviewUrl ?? '',
    vimeoUrl: d?.vimeoUrl ?? '',
    previewPoster: d?.previewPoster ?? '',
    previewPosterLQIP: d?.previewPosterLQIP ?? '',
    bgColor: d?.bgColor ?? '#477AA1',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DirectorsClient() {
  const { setBackground } = useBackgroundMedia()

  // ─────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0) // Mobile: which director is centered
  const [isReady, setIsReady] = useState(false)

  // Device detection (CSR-only)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

  // ─────────────────────────────────────────────────────────────
  // REFS
  // ─────────────────────────────────────────────────────────────
  const listRef = useRef<HTMLUListElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const hasSetInitialBgRef = useRef(false)
  const hasAnimatedRef = useRef(false)

  // Default director index
  const initialIdx = Number.isInteger(DEFAULT_INDEX) && directors[DEFAULT_INDEX] ? DEFAULT_INDEX : 0
  const desktopActiveIndex = hoveredIndex ?? initialIdx

  // ─────────────────────────────────────────────────────────────
  // FADE-OUT NAVIGATION
  // ─────────────────────────────────────────────────────────────
  const { fadeOutAndNavigate, isNavigating } = useFadeOutNavigation(mainRef, {
    selector: '[data-reveal]',
    isMobile,
    saveVideo: false, // No longer needed - global background persists
  })

  // ─────────────────────────────────────────────────────────────
  // SET INITIAL BACKGROUND ON MOUNT (useLayoutEffect for sync before paint)
  // ─────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (hasSetInitialBgRef.current) return
    hasSetInitialBgRef.current = true

    // Set the default director's video as background
    setBackground(directorToMedia(directors[initialIdx], initialIdx))
  }, [initialIdx, setBackground])

  // ─────────────────────────────────────────────────────────────
  // DESKTOP REVEAL ANIMATION
  // ─────────────────────────────────────────────────────────────
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

  // Mark ready after short delay
  useEffect(() => {
    const timeoutId = setTimeout(() => setIsReady(true), 100)
    return () => clearTimeout(timeoutId)
  }, [])

  // Trigger animation when ready
  useEffect(() => {
    if (!isReady || hasAnimatedRef.current) return
    hasAnimatedRef.current = true

    if (isMobile) {
      // Mobile: immediate show
      const items = scrollContainerRef.current?.querySelectorAll('[data-mobile-reveal]')
      items?.forEach((item) => {
        const el = item as HTMLElement
        el.style.opacity = '1'
        el.style.transform = 'none'
      })
    } else {
      // Desktop: sequenced reveal
      requestAnimationFrame(() => start())
    }
  }, [isReady, isMobile, start])

  // ─────────────────────────────────────────────────────────────
  // MOBILE: Scroll detection for centered item
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMobile || !scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const items = container.querySelectorAll('[data-index]')
    if (items.length === 0) return

    const findCenteredItem = () => {
      const containerRect = container.getBoundingClientRect()
      const centerY = containerRect.top + containerRect.height / 2

      let closestIndex = 0
      let closestDistance = Infinity

      items.forEach((item, index) => {
        const rect = item.getBoundingClientRect()
        const itemCenterY = rect.top + rect.height / 2
        const distance = Math.abs(itemCenterY - centerY)

        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      if (closestIndex !== activeIndex) {
        setActiveIndex(closestIndex)
        const d = directors[closestIndex]
        if (d) {
          setBackground(directorToMedia(d, closestIndex))
        }
      }
    }

    findCenteredItem()

    const handleScroll = () => requestAnimationFrame(findCenteredItem)
    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => container.removeEventListener('scroll', handleScroll)
  }, [isMobile, activeIndex, setBackground])

  // ─────────────────────────────────────────────────────────────
  // HOVER HANDLERS (desktop)
  // ─────────────────────────────────────────────────────────────
  const select = useCallback((i: number) => {
    if (isNavigating || isMobile) return
    const d = directors[i]
    if (!d) return
    setHoveredIndex(i)
    setBackground(directorToMedia(d, i))
  }, [isNavigating, isMobile, setBackground])

  const resetToDefault = useCallback(() => {
    if (isNavigating || isMobile) return
    setHoveredIndex(null)
    setBackground(directorToMedia(directors[initialIdx], initialIdx))
  }, [isNavigating, isMobile, initialIdx, setBackground])

  // ─────────────────────────────────────────────────────────────
  // NAVIGATION HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handleDirectorClick = useCallback((e: React.MouseEvent, slug: string) => {
    if (isMobile || isNavigating) return
    e.preventDefault()
    fadeOutAndNavigate(`/directors/${slug}`)
  }, [isMobile, isNavigating, fadeOutAndNavigate])

  // Expose fade-out for header navigation
  useGSAP(() => {
    if (isMobile) return
    ;(window as any).__directorsFadeOut = fadeOutAndNavigate
    return () => { delete (window as any).__directorsFadeOut }
  }, { dependencies: [isMobile, fadeOutAndNavigate] })

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  // MOBILE LAYOUT
  if (isMobile) {
    return (
      <main className="fixed inset-0">
        {/* NO local background - uses GlobalBackgroundMedia from layout */}

        {/* Scrollable list with snap */}
        <div
          ref={scrollContainerRef}
          className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <ul>
            {directors.map((d, index) => {
              const isActive = activeIndex === index
              return (
                <li
                  key={d.slug}
                  data-index={index}
                  data-mobile-reveal
                  className="snap-center snap-always h-screen flex items-center px-6"
                  style={REVEAL_HIDDEN_STYLE_SIMPLE}
                >
                  <a
                    href={`/directors/${d.slug}`}
                    className={`block transition-opacity duration-300 ${
                      isActive ? 'opacity-100' : 'opacity-30'
                    }`}
                  >
                    <h3 className="text-3xl leading-[1.05] font-semibold text-white">
                      {d.name}
                    </h3>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </main>
    )
  }

  // DESKTOP LAYOUT
  return (
    <main
      ref={mainRef}
      className="relative min-h-dvh w-full overflow-hidden text-white"
    >
      {/* NO local background - uses GlobalBackgroundMedia from layout */}

      {/* FOREGROUND LIST */}
      <section className="relative min-h-dvh w-full pt-32">
        <div className="mx-auto px-6 md:px-12">
          <ul
            ref={listRef}
            className="md:space-y-2 space-y-6"
            onMouseLeave={resetToDefault}
            onTouchEnd={resetToDefault}
          >
            {directors.map((d, i) => {
              const isActive = i === desktopActiveIndex
              return (
                <li
                  key={d.slug}
                  className={`transition-opacity duration-200 ${
                    isActive ? 'opacity-100' : 'opacity-70'
                  }`}
                >
                  <div data-reveal style={REVEAL_HIDDEN_STYLE}>
                    <a
                      href={`/directors/${d.slug}`}
                      onClick={(e) => handleDirectorClick(e, d.slug)}
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
                    </a>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </main>
  )
}
