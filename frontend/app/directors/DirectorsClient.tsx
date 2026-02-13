'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { directors } from '../components/constants'
import { CrossfadeBackground } from '../components/BackgroundMedia'
import { useCrossfadeMedia } from '../utils/useCrossfadeMedia'
import { useSequencedReveal } from '../utils/useSequencedReveal'
import { usePageTransitionVideo } from '../utils/usePageTransitionVideo'
import { useFadeOutNavigation } from '../utils/useFadeOutNavigation'
import { useVideoReady } from '../utils/useVideoReady'
import { useCenteredItemDetection } from '../utils/useCenteredItemDetection'
import { REVEAL_HIDDEN_STYLE, REVEAL_HIDDEN_STYLE_SIMPLE } from '../utils/useRevealAnimation'
import { toMediaObject } from '../utils/mediaHelpers'
import { useGSAP } from '@gsap/react'

const DEFAULT_INDEX = 3

export default function DirectorsClient() {
  const { getPreviousVideoState } = usePageTransitionVideo()

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isReady, setIsReady] = useState(false)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

  const { isReady: videoReady, markReady } = useVideoReady({
    skip: isMobile,
    timeout: 800,
  })

  const listRef = useRef<HTMLUListElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const hasTransitionedRef = useRef(false)
  const hasAnimatedRef = useRef(false)

  const { fadeOutAndNavigate, isNavigating } = useFadeOutNavigation(mainRef, {
    selector: '[data-reveal]',
    isMobile,
    saveVideo: true,
  })

  const initialIdx =
    Number.isInteger(DEFAULT_INDEX) && directors[DEFAULT_INDEX] ? DEFAULT_INDEX : 0
  const targetMedia = toMediaObject(directors[initialIdx], initialIdx, '#477AA1')

  const previousVideo = getPreviousVideoState()
  const initialMedia = previousVideo || targetMedia

  const { setSlotRef, slotMedia, crossfadeTo } = useCrossfadeMedia(initialMedia, {
    duration: 0.45,
  })

  const desktopActiveIndex = hoveredIndex ?? initialIdx

  // Enter animation for desktop
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

  // Handle incoming page transition video (desktop only)
  useEffect(() => {
    if (hasTransitionedRef.current || !previousVideo || isMobile) return
    hasTransitionedRef.current = true

    const timeoutId = setTimeout(() => {
      crossfadeTo(targetMedia)
    }, 400)

    return () => clearTimeout(timeoutId)
  }, [isMobile, previousVideo, crossfadeTo, targetMedia])

  // Mark ready after a short delay to allow initial render
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsReady(true)
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [])

  // Single animation trigger for BOTH desktop and mobile
  useEffect(() => {
    if (!isReady) return
    if (hasAnimatedRef.current) return

    // Desktop: wait for video ready
    if (!isMobile && !videoReady) return

    hasAnimatedRef.current = true

    if (isMobile) {
      const mobileItems = scrollContainerRef.current?.querySelectorAll('[data-mobile-reveal]')
      if (mobileItems && mobileItems.length > 0) {
        mobileItems.forEach((item) => {
          const el = item as HTMLElement
          el.style.opacity = '1'
          el.style.transform = 'none'
        })
      }
    } else {
      requestAnimationFrame(() => {
        start()
      })
    }
  }, [isReady, isMobile, videoReady, start])

  // Mobile: detect centered item via IntersectionObserver and crossfade video
  const handleMobileActiveChange = useCallback((index: number) => {
    setActiveIndex(index)
    const d = directors[index]
    if (d) {
      crossfadeTo(toMediaObject(d, index, '#477AA1'))
    }
  }, [crossfadeTo])

  useCenteredItemDetection(scrollContainerRef, '[data-index]', handleMobileActiveChange, {
    enabled: isMobile,
  })

  // Desktop handlers
  const select = (i: number) => {
    if (isNavigating || isMobile) return
    const d = directors[i]
    if (!d) return
    setHoveredIndex(i)
    crossfadeTo(toMediaObject(d, i, '#477AA1'))
  }

  const resetToDefault = () => {
    if (isNavigating || isMobile) return
    setHoveredIndex(null)
    crossfadeTo(targetMedia)
  }

  const handleFadeOutAndNavigate = useCallback((url: string) => {
    fadeOutAndNavigate(url, slotMedia)
  }, [fadeOutAndNavigate, slotMedia])

  const handleDirectorClick = useCallback((e: React.MouseEvent, slug: string) => {
    if (isMobile || isNavigating) return
    e.preventDefault()
    handleFadeOutAndNavigate(`/directors/${slug}`)
  }, [isMobile, isNavigating, handleFadeOutAndNavigate])

  // Expose fade-out function globally for header navigation (desktop only)
  useGSAP(() => {
    if (isMobile) return
    (window as any).__directorsFadeOut = handleFadeOutAndNavigate
    return () => {
      delete (window as any).__directorsFadeOut
    }
  }, { dependencies: [isMobile, handleFadeOutAndNavigate] })

  if (isMobile) {
    return (
      <main className="fixed inset-0">
        <CrossfadeBackground slotMedia={slotMedia} setSlotRef={setSlotRef} />

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

  // Desktop Layout
  return (
    <main
      ref={mainRef}
      className="relative min-h-dvh w-full overflow-hidden text-white"
    >
      <CrossfadeBackground
        slotMedia={slotMedia}
        setSlotRef={setSlotRef}
        onVideoReady={markReady}
        disablePointerEvents
        positioning="absolute"
      />

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
                <div
                  data-reveal
                  style={REVEAL_HIDDEN_STYLE}
                >
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
