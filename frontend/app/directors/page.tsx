'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { directors } from '../components/constants'
import { useCrossfadeMedia } from '../utils/useCrossfadeMedia'
import { useSequencedReveal } from '../utils/useSequencedReveal'
import { usePageTransitionVideo } from '../utils/usePageTransitionVideo'
import { useFadeOutNavigation } from '../utils/useFadeOutNavigation'
import { useVideoReady } from '../utils/useVideoReady'
import { REVEAL_HIDDEN_STYLE, REVEAL_HIDDEN_STYLE_SIMPLE } from '../utils/useRevealAnimation'
import BackgroundMedia from '../components/BackgroundMedia/BackgroundMedia'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

const DEFAULT_INDEX = 3

const getMedia = (d: any, i: number) => ({
  id: d?.slug ?? i,
  videoSrc: d?.previewUrl ?? d?.vimeoUrl ?? '',
  previewUrl: d?.previewUrl ?? '',
  mobilePreviewUrl: d?.mobilePreviewUrl ?? '',
  vimeoUrl: d?.vimeoUrl ?? '',
  previewPoster: d?.previewPoster ?? '',
  previewPosterLQIP: d?.previewPosterLQIP ?? '',
  bgColor: d?.bgColor ?? '#477AA1',
})

export default function DirectorsIndexPage() {
  const { getPreviousVideoState } = usePageTransitionVideo()

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0) // For mobile - which director is centered
  const [isMobile, setIsMobile] = useState(false)

  // Track video ready state for smoother content reveal
  const { isReady: videoReady, markReady } = useVideoReady({
    skip: isMobile, // Skip waiting on mobile (simpler experience)
    timeout: 2500,
  })

  const listRef = useRef<HTMLUListElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const hasTransitionedRef = useRef(false)

  // Use the reusable fade-out navigation hook
  const { fadeOutAndNavigate, isNavigating } = useFadeOutNavigation(mainRef, {
    selector: '[data-reveal]',
    isMobile,
    saveVideo: true,
  })

  const initialIdx =
    Number.isInteger(DEFAULT_INDEX) && directors[DEFAULT_INDEX] ? DEFAULT_INDEX : 0
  const targetMedia = getMedia(directors[initialIdx], initialIdx)

  // Check for previous video state to determine initial state
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

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Track if mobile animation has already run
  const mobileAnimatedRef = useRef(false)

  // Start animation when video is ready (desktop only)
  useEffect(() => {
    if (isMobile) return
    if (!videoReady) return

    // Use RAF to ensure DOM is fully ready
    const rafId = requestAnimationFrame(() => {
      start()
    })

    return () => cancelAnimationFrame(rafId)
  }, [isMobile, videoReady, start])

  // Start mobile animation once after mount - elements are already hidden via inline styles
  useEffect(() => {
    if (!isMobile) return
    if (!scrollContainerRef.current) return
    if (mobileAnimatedRef.current) return

    mobileAnimatedRef.current = true

    // Delay to ensure layout stability, then animate directly from inline hidden state
    const timeoutId = setTimeout(() => {
      const mobileItems = scrollContainerRef.current?.querySelectorAll('[data-mobile-reveal]')
      if (mobileItems && mobileItems.length > 0) {
        // Animate from current inline styles to visible - NO gsap.set() call
        gsap.to(mobileItems, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          stagger: {
            each: 0.08,
            from: 'start',
          },
        })
      }
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [isMobile])

  // Mobile: Simple scroll detection - find centered item
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
          crossfadeTo(getMedia(d, closestIndex))
        }
      }
    }

    // Initial check
    findCenteredItem()

    // Listen for scroll
    const handleScroll = () => {
      requestAnimationFrame(findCenteredItem)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [isMobile, activeIndex, crossfadeTo])

  // Desktop handlers
  const select = (i: number) => {
    if (isNavigating || isMobile) return
    const d = directors[i]
    if (!d) return
    setHoveredIndex(i)
    crossfadeTo(getMedia(d, i))
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

  return (
    <>
      {/* Desktop Layout - YOUR EXACT VERSION */}
      <main 
        ref={mainRef}
        className={`relative min-h-dvh w-full overflow-hidden text-white ${isMobile ? 'hidden' : 'block'}`}
      >
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
                mobilePreviewUrl={slotMedia[0].mobilePreviewUrl}
                vimeoUrl={slotMedia[0].vimeoUrl ?? slotMedia[0].videoSrc}
                previewPoster={slotMedia[0].previewPoster}
                previewPosterLQIP={slotMedia[0].previewPosterLQIP}
                bgColor={slotMedia[0].bgColor}
                onVideoReady={markReady}
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
                mobilePreviewUrl={slotMedia[1].mobilePreviewUrl}
                vimeoUrl={slotMedia[1].vimeoUrl ?? slotMedia[1].videoSrc}
                previewPoster={slotMedia[1].previewPoster}
                previewPosterLQIP={slotMedia[1].previewPosterLQIP}
                bgColor={slotMedia[1].bgColor}
              />
            )}
          </div>
        </div>

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

      {/* Mobile Layout */}
      <main className={`fixed inset-0 ${isMobile ? 'block' : 'hidden'}`}>
        {/* Background video - crossfade slots */}
        <div className="fixed inset-0 z-0 bg-black">
          <div
            ref={(el) => { if (isMobile) setSlotRef(0)(el) }}
            className="absolute inset-0"
          >
            {isMobile && slotMedia[0] && (
              <BackgroundMedia
                variant="preview"
                previewUrl={slotMedia[0].previewUrl}
                mobilePreviewUrl={slotMedia[0].mobilePreviewUrl}
                vimeoUrl={slotMedia[0].vimeoUrl}
                previewPoster={slotMedia[0].previewPoster}
                previewPosterLQIP={slotMedia[0].previewPosterLQIP}
                bgColor={slotMedia[0].bgColor}
              />
            )}
          </div>
          <div
            ref={(el) => { if (isMobile) setSlotRef(1)(el) }}
            className="absolute inset-0"
          >
            {isMobile && slotMedia[1] && (
              <BackgroundMedia
                variant="preview"
                previewUrl={slotMedia[1].previewUrl}
                mobilePreviewUrl={slotMedia[1].mobilePreviewUrl}
                vimeoUrl={slotMedia[1].vimeoUrl}
                previewPoster={slotMedia[1].previewPoster}
                previewPosterLQIP={slotMedia[1].previewPosterLQIP}
                bgColor={slotMedia[1].bgColor}
              />
            )}
          </div>
        </div>

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
    </>
  )
}
