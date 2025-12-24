'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { directors } from '../components/constants'
import { useCrossfadeMedia } from '../utils/useCrossfadeMedia'
import { useSequencedReveal } from '../utils/useSequencedReveal'
import { usePageTransitionVideo } from '../utils/usePageTransitionVideo'
import { useFadeOutNavigation } from '../utils/useFadeOutNavigation'
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
  const [selectedIndex, setSelectedIndex] = useState(DEFAULT_INDEX) // For mobile
  const [fontLoaded, setFontLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileAnimationPhase, setMobileAnimationPhase] = useState<'hidden' | 'animating' | 'done'>('hidden')

  const listRef = useRef<HTMLUListElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null) // Mobile scroll container
  const observerRef = useRef<IntersectionObserver | null>(null) // Mobile observer
  const hasTransitionedRef = useRef(false)
  const mobileAnimationDoneRef = useRef(false)

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

  const activeIndex = hoveredIndex ?? initialIdx

  // Enter animation - EXACT SAME as ProjectsLanding
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

  // Handle incoming page transition video
  useEffect(() => {
    if (hasTransitionedRef.current || !previousVideo || isMobile) return
    hasTransitionedRef.current = true

    // Crossfade from previous video to directors default video after a brief delay
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

  // Hide content initially to prevent FOUC (Flash of Unstyled Content)
  useGSAP(() => {
    if (!listRef.current || isMobile) return

    // Set initial hidden state before animation (desktop)
    const items = listRef.current.querySelectorAll('[data-reveal]')
    gsap.set(items, { opacity: 0, y: 20, scale: 0.98 })
  }, { dependencies: [isMobile], scope: listRef })

  // Mobile enter animation - reveal items smoothly
  useGSAP(() => {
    if (!isMobile || !scrollContainerRef.current || mobileAnimationPhase !== 'hidden') return

    try {
      const listElement = scrollContainerRef.current.querySelector('ul')
      if (!listElement) return

      const items = listElement.querySelectorAll('li')
      if (!items || items.length === 0) return

      // Mark as animating so GSAP takes control
      setMobileAnimationPhase('animating')

      // Animate in from opacity 0 (set via inline style) to full visibility
      gsap.fromTo(items,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: 'power2.out',
          stagger: {
            each: 0.06,
            from: 'start' as const,
          },
          delay: 0.1,
          onComplete: () => {
            setMobileAnimationPhase('done')
            mobileAnimationDoneRef.current = true
          }
        }
      )
    } catch (error) {
      console.error('Mobile enter animation error:', error)
      setMobileAnimationPhase('done') // Ensure items become visible even on error
    }
  }, { dependencies: [isMobile, mobileAnimationPhase], scope: scrollContainerRef })

  // Font loading + trigger enter animation
  useEffect(() => {
    // Only run on desktop
    if (isMobile) return
    if (fontLoaded) return // Prevent re-running

    let cancelled = false
    let timeoutId: NodeJS.Timeout

    const triggerAnimation = () => {
      if (cancelled) return
      setFontLoaded(true)
      // Start with RAF to ensure DOM is ready
      requestAnimationFrame(() => {
        start()
      })
    }

    // Simplified font loading that works in production
    if (typeof window !== 'undefined' && 'fonts' in document) {
      const fonts = (document as any).fonts
      if (fonts?.ready) {
        fonts.ready.then(() => {
          // Try to load the font, but don't wait forever
          Promise.race([
            fonts.load('normal 1em Neue').catch(() => null),
            new Promise(resolve => setTimeout(resolve, 500))
          ]).then(() => {
            if (!cancelled) triggerAnimation()
          })
        }).catch(() => {
          // If fonts.ready fails, fallback to timeout
          if (!cancelled) timeoutId = setTimeout(triggerAnimation, 100)
        })
      } else {
        timeoutId = setTimeout(triggerAnimation, 100)
      }
    } else {
      timeoutId = setTimeout(triggerAnimation, 100)
    }

    // Safety timeout to ensure animation always runs
    const safetyTimeout = setTimeout(() => {
      if (!cancelled && !fontLoaded) {
        triggerAnimation()
      }
    }, 1000)

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
      clearTimeout(safetyTimeout)
    }
  }, [start, fontLoaded, isMobile])

  // Mobile: Track visible items and find center item on scroll
  useGSAP(() => {
    if (!isMobile || !scrollContainerRef.current) return

    try {
      const container = scrollContainerRef.current
      const listElement = container.querySelector('ul')
      if (!listElement) return

      const items = listElement.querySelectorAll('li')
      if (!items || items.length === 0) return

      // Track which items are currently visible
      const visibleItems = new Set<number>()

      // Function to find and select the item closest to center
      const selectCenterItem = () => {
        if (visibleItems.size === 0) return

        const containerRect = container.getBoundingClientRect()
        const containerCenter = containerRect.top + containerRect.height / 2

        let bestIndex = -1
        let bestDistance = Infinity

        visibleItems.forEach((index) => {
          const item = items[index]
          if (!item) return

          const rect = item.getBoundingClientRect()
          const itemCenter = rect.top + rect.height / 2
          const distance = Math.abs(itemCenter - containerCenter)

          if (distance < bestDistance) {
            bestDistance = distance
            bestIndex = index
          }
        })

        if (bestIndex >= 0 && bestIndex !== selectedIndex) {
          setSelectedIndex(bestIndex)
          const d = directors[bestIndex]
          if (d) {
            crossfadeTo(getMedia(d, bestIndex))
          }
        }
      }

      // Intersection Observer to track which items are visible
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const index = parseInt((entry.target as HTMLElement).getAttribute('data-index') || '0', 10)
            if (entry.isIntersecting) {
              visibleItems.add(index)
            } else {
              visibleItems.delete(index)
            }
          })
          // After updating visible items, select the center one
          selectCenterItem()
        },
        {
          root: container,
          threshold: 0.1,
          rootMargin: '0px'
        }
      )

      items.forEach((item) => {
        observerRef.current?.observe(item)
      })

      // Also listen for scroll events to catch fast scrolling
      const handleScroll = () => {
        requestAnimationFrame(selectCenterItem)
      }
      container.addEventListener('scroll', handleScroll, { passive: true })

      return () => {
        observerRef.current?.disconnect()
        container.removeEventListener('scroll', handleScroll)
      }
    } catch (error) {
      console.error('Intersection observer setup error:', error)
    }
  }, { dependencies: [isMobile, selectedIndex, crossfadeTo], scope: scrollContainerRef })

  // Handlers to request a crossfade (desktop only)
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

  // Wrap the hook's fadeOutAndNavigate to pass slotMedia
  const handleFadeOutAndNavigate = useCallback((url: string) => {
    fadeOutAndNavigate(url, slotMedia)
  }, [fadeOutAndNavigate, slotMedia])

  // Handle director click with fade-out
  const handleDirectorClick = useCallback((e: React.MouseEvent, slug: string) => {
    if (isMobile || isNavigating) return

    e.preventDefault()
    handleFadeOutAndNavigate(`/directors/${slug}`)
  }, [isMobile, isNavigating, handleFadeOutAndNavigate])

  // Expose fade-out function globally for header navigation
  useGSAP(() => {
    if (isMobile) return

    // Make fade-out function available globally
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
          <div className="max-w-[1600px] mx-auto px-6 md:px-12">
            <ul
              ref={listRef}
              className="md:space-y-2 space-y-6"
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
                  <div
                    data-reveal
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

      {/* Mobile Layout - Y-axis centered, left-aligned (EXACT SAME AS PROJECTSLANDING) */}
      <main 
        className={`fixed inset-0 ${isMobile ? 'block' : 'hidden'}`}
      >
        {/* Background - Fixed */}
        <div className="fixed inset-0 z-0 bg-black">
          <div
            ref={(el) => {
              if (!isMobile) return
              setSlotRef(0)(el)
            }}
            className="absolute inset-0"
            style={{ pointerEvents: 'none' }}
          >
            {isMobile && slotMedia[0] && (
              <BackgroundMedia
                variant="preview"
                previewUrl={slotMedia[0].previewUrl ?? slotMedia[0].videoSrc}
                mobilePreviewUrl={slotMedia[0].mobilePreviewUrl}
                vimeoUrl={slotMedia[0].vimeoUrl ?? slotMedia[0].videoSrc}
                previewPoster={slotMedia[0].previewPoster}
                previewPosterLQIP={slotMedia[0].previewPosterLQIP}
                bgColor={slotMedia[0].bgColor}
              />
            )}
          </div>
          <div
            ref={(el) => {
              if (!isMobile) return
              setSlotRef(1)(el)
            }}
            className="absolute inset-0"
            style={{ pointerEvents: 'none' }}
          >
            {isMobile && slotMedia[1] && (
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

        {/* Scrollable Container with Snap - EXACT SAME AS PROJECTSLANDING */}
        <div 
          ref={scrollContainerRef}
          className="relative z-10 h-full overflow-y-scroll snap-y snap-mandatory"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <ul 
            className="min-h-full"
          >
            {directors.map((d, index) => {
              const isActive = selectedIndex === index

              // Calculate styles based on animation phase
              const getItemStyles = () => {
                if (mobileAnimationPhase === 'hidden') {
                  // Before animation: completely invisible
                  return { opacity: 0, transform: 'scale(0.95)' }
                }
                if (mobileAnimationPhase === 'animating') {
                  // During animation: let GSAP control (no inline styles)
                  return {}
                }
                // After animation: normal interactive state
                return {
                  opacity: isActive ? 1 : 0.25,
                  transform: `scale(${isActive ? 1 : 0.92})`,
                  transition: 'opacity 0.5s ease-out, transform 0.5s ease-out'
                }
              }

              return (
                <li
                  key={d.slug}
                  data-index={index}
                  data-reveal
                  className="snap-center snap-always h-screen flex items-center px-6"
                  style={{
                    ...getItemStyles(),
                    willChange: 'opacity, transform',
                  }}
                >
                  <a
                    href={`/directors/${d.slug}`}
                    onClick={(e) => {
                      if (!isMobile || isNavigating) return
                      e.preventDefault()
                      handleFadeOutAndNavigate(`/directors/${d.slug}`)
                    }}
                    className="block w-full text-left outline-none"
                  >
                    <h3 className="text-3xl sm:text-5xl md:text-6xl leading-[1.05] font-semibold text-white mb-3">
                      {d.name}
                    </h3>
                  </a>
                </li>
              )
            })}
          </ul>

          {/* Hide scrollbar */}
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </div>
      </main>
    </>
  )
}
