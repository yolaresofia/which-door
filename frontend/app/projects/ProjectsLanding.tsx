'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import BackgroundMedia from '../components/BackgroundMedia'
import { projects } from '../components/constants'
import { useCrossfadeMedia } from '../utils/useCrossfadeMedia'
import { useSequencedReveal } from '../utils/useSequencedReveal'
import { usePageTransitionVideo } from '../utils/usePageTransitionVideo'
import { useFadeOutNavigation } from '../utils/useFadeOutNavigation'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

const getTitle = (p: any) => p?.name ?? p?.title ?? 'Untitled'
const getPreview = (p: any) => p?.previewUrl ?? ''
const getMobilePreview = (p: any) => p?.mobilePreviewUrl ?? ''
const getVimeo = (p: any) => p?.vimeoUrl ?? ''
const getPoster = (p: any) => p?.previewPoster ?? ''
const getPosterLQIP = (p: any) => p?.previewPosterLQIP ?? ''
const getBgColor = (p: any) => p?.bgColor ?? '#000'

export default function ProjectsLanding() {
  const { getPreviousVideoState } = usePageTransitionVideo()

  const homepageProjects = useMemo(
    () => projects.filter((project) => project.isInHomePage),
    []
  )
  const visibleProjects = homepageProjects.length ? homepageProjects : projects

  const first = visibleProjects[0] ?? projects[0]
  const targetVideo = useMemo(() => ({
    id: first?.slug ?? 0,
    videoSrc: getPreview(first) || getVimeo(first),
    previewUrl: getPreview(first),
    mobilePreviewUrl: getMobilePreview(first),
    vimeoUrl: getVimeo(first),
    previewPoster: getPoster(first),
    previewPosterLQIP: getPosterLQIP(first),
    bgColor: getBgColor(first),
  }), [first])

  // Check for previous video state to determine initial state
  const previousVideo = getPreviousVideoState()
  const initialVideo = previousVideo || targetVideo

  const { setSlotRef, slotMedia, crossfadeTo } = useCrossfadeMedia(initialVideo, { duration: 0.45 })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [fontLoaded, setFontLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileAnimationPhase, setMobileAnimationPhase] = useState<'hidden' | 'animating' | 'done'>('hidden')

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const hasTransitionedRef = useRef(false)
  const mobileAnimationDoneRef = useRef(false)

  // Use the reusable fade-out navigation hook
  const { fadeOutAndNavigate, isNavigating } = useFadeOutNavigation(mainRef, {
    selector: '[data-reveal]',
    isMobile,
    saveVideo: true,
  })

  const select = useCallback((i: number) => {
    // Always update selectedIndex to ensure UI state is correct
    setSelectedIndex(i)
    const project = visibleProjects[i]
    if (!project) return
    // crossfadeTo will handle duplicate prevention internally
    crossfadeTo({
      id: project?.slug ?? i,
      videoSrc: getPreview(project) || getVimeo(project),
      previewUrl: getPreview(project),
      mobilePreviewUrl: getMobilePreview(project),
      vimeoUrl: getVimeo(project),
      previewPoster: getPoster(project),
      previewPosterLQIP: getPosterLQIP(project),
      bgColor: getBgColor(project),
    })
  }, [crossfadeTo, visibleProjects])

  // Desktop animation
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

    // Crossfade from previous video to projects default video after a brief delay
    const timeoutId = setTimeout(() => {
      crossfadeTo(targetVideo)
    }, 400)

    return () => clearTimeout(timeoutId)
  }, [isMobile, previousVideo, crossfadeTo, targetVideo])

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

  // Font loading
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
          select(bestIndex)
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
  }, { dependencies: [isMobile, selectedIndex, select], scope: scrollContainerRef })

  // Wrap the hook's fadeOutAndNavigate to pass slotMedia
  const handleFadeOutAndNavigate = useCallback((url: string) => {
    fadeOutAndNavigate(url, slotMedia)
  }, [fadeOutAndNavigate, slotMedia])

  // Handle project click
  const handleProjectClick = useCallback((slug: string) => {
    if (isMobile || isNavigating) return
    handleFadeOutAndNavigate(`/projects/${slug}`)
  }, [isMobile, isNavigating, handleFadeOutAndNavigate])

  // Listen for navigation from header/other sources
  useEffect(() => {
    if (isMobile) return

    // Custom event listener for navigation from header
    const handleNavigationRequest = (e: CustomEvent) => {
      const url = e.detail?.url
      if (url && !isNavigating) {
        handleFadeOutAndNavigate(url)
      }
    }

    window.addEventListener('navigate-with-fade' as any, handleNavigationRequest as any)

    return () => {
      window.removeEventListener('navigate-with-fade' as any, handleNavigationRequest as any)
    }
  }, [isMobile, isNavigating, handleFadeOutAndNavigate])

  // Expose fade-out function globally for header navigation
  useGSAP(() => {
    if (isMobile) return

    // Make fade-out function available globally
    (window as any).__projectsFadeOut = handleFadeOutAndNavigate

    return () => {
      delete (window as any).__projectsFadeOut
    }
  }, { dependencies: [isMobile, handleFadeOutAndNavigate] })

  return (
    <>
      {/* Desktop Layout */}
      <main 
        ref={mainRef}
        className={`relative w-full min-h-screen ${isMobile ? 'hidden' : 'block'}`}
      >
        {/* Background - Fixed */}
        <div className="fixed inset-0 z-0 bg-black">
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
              setSlotRef(1)(el)
            }}
            className="absolute inset-0"
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

        {/* Desktop Grid */}
        <section className="relative z-10 flex min-h-screen w-full md:px-12 px-4 items-center justify-center">
          <ul
            ref={listRef}
            className="w-full max-w-[1600px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-12 gap-y-10"
          >
            {visibleProjects.map((project, index) => {
              const title = getTitle(project)
              const isHighlighted = selectedIndex === index
              const dimOthers = !isHighlighted

              return (
                <li
                  key={project?.slug ?? `${title}-${index}`}
                  className={`transition-opacity duration-300 ease-out ${
                    dimOthers ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  <div
                    onClick={() => handleProjectClick(project?.slug)}
                    className="block w-full text-left group outline-none cursor-pointer"
                    data-reveal
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleProjectClick(project?.slug)
                      }
                    }}
                  >
                    <h3
                      className={`max-w-[20ch] leading-tight font-semibold text-2xl transition-all duration-300 ease-out ${
                        isHighlighted ? 'text-white' : 'text-white/90'
                      }`}
                      onMouseEnter={() => !isNavigating && select(index)}
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
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </main>

      {/* Mobile Layout - Y-axis centered, left-aligned */}
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

        {/* Scrollable Container with Snap */}
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
            ref={isMobile ? listRef : undefined}
            className="min-h-full"
          >
            {visibleProjects.map((project, index) => {
              const title = getTitle(project)
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
                  key={project?.slug ?? `${title}-${index}`}
                  data-index={index}
                  data-reveal
                  className="snap-center snap-always h-screen flex items-center px-6"
                  style={{
                    ...getItemStyles(),
                    willChange: 'opacity, transform',
                  }}
                >
                  <a
                    href={`/projects/${project?.slug}`}
                    onClick={(e) => {
                      if (!isMobile || isNavigating) return
                      e.preventDefault()
                      handleFadeOutAndNavigate(`/projects/${project?.slug}`)
                    }}
                    className="block w-full text-left outline-none"
                  >
                    <h3 className="text-3xl leading-[1.05] font-semibold text-white mb-3">
                      {title}
                    </h3>
                    {project?.director && (
                      <p className="text-lg sm:text-xl md:text-2xl text-white/75">
                        {project.director}
                      </p>
                    )}
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
