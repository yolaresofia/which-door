'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import BackgroundMedia from '../components/BackgroundMedia'
import { projects } from '../components/constants'
import { useCrossfadeMedia } from '../utils/useCrossfadeMedia'
import { useSequencedReveal } from '../utils/useSequencedReveal'
import { usePageTransitionVideo } from '../utils/usePageTransitionVideo'
import { useFadeOutNavigation } from '../utils/useFadeOutNavigation'
import { useVideoReady } from '../utils/useVideoReady'
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
  const [activeIndex, setActiveIndex] = useState(0) // For mobile - which project is centered
  const [isMobile, setIsMobile] = useState(false)
  const [isReady, setIsReady] = useState(false) // Single ready state for animations

  // Track video ready state for smoother content reveal
  // Short timeout (800ms) - we don't want to wait too long for the video
  // Better UX to show content slightly before video than wait 4 seconds
  const { isReady: videoReady, markReady } = useVideoReady({
    skip: isMobile, // Skip waiting on mobile (simpler experience)
    timeout: 800,
  })

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const hasTransitionedRef = useRef(false)
  const hasAnimatedRef = useRef(false)

  // Use the reusable fade-out navigation hook
  const { fadeOutAndNavigate, isNavigating } = useFadeOutNavigation(mainRef, {
    selector: '[data-reveal]',
    isMobile,
    saveVideo: true,
  })

  const select = useCallback((i: number) => {
    setSelectedIndex(i)
    const project = visibleProjects[i]
    if (!project) return
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

  // Handle incoming page transition video (desktop only)
  useEffect(() => {
    if (hasTransitionedRef.current || !previousVideo || isMobile) return
    hasTransitionedRef.current = true

    const timeoutId = setTimeout(() => {
      crossfadeTo(targetVideo)
    }, 400)

    return () => clearTimeout(timeoutId)
  }, [isMobile, previousVideo, crossfadeTo, targetVideo])

  // Detect mobile ONCE on mount - don't re-run on resize to prevent video interruption
  useEffect(() => {
    const checkMobile = window.innerWidth < 1024
    setIsMobile(checkMobile)

    // Mark ready after a short delay to allow initial render
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
      // Mobile: Simple immediate show - no animation for better performance
      // GSAP stagger animations are heavy on mobile and cause glitches
      const mobileItems = scrollContainerRef.current?.querySelectorAll('[data-mobile-reveal]')
      if (mobileItems && mobileItems.length > 0) {
        mobileItems.forEach((item) => {
          const el = item as HTMLElement
          el.style.opacity = '1'
          el.style.transform = 'none'
        })
      }
    } else {
      // Desktop animation
      requestAnimationFrame(() => {
        start()
      })
    }
  }, [isReady, isMobile, videoReady, start])

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
        const project = visibleProjects[closestIndex]
        if (project) {
          crossfadeTo({
            id: project?.slug ?? closestIndex,
            videoSrc: getPreview(project) || getVimeo(project),
            previewUrl: getPreview(project),
            mobilePreviewUrl: getMobilePreview(project),
            vimeoUrl: getVimeo(project),
            previewPoster: getPoster(project),
            previewPosterLQIP: getPosterLQIP(project),
            bgColor: getBgColor(project),
          })
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
  }, [isMobile, activeIndex, crossfadeTo, visibleProjects])

  // Wrap the hook's fadeOutAndNavigate to pass slotMedia
  const handleFadeOutAndNavigate = useCallback((url: string) => {
    fadeOutAndNavigate(url, slotMedia)
  }, [fadeOutAndNavigate, slotMedia])

  // Handle project click (desktop only)
  const handleProjectClick = useCallback((slug: string) => {
    if (isMobile || isNavigating) return
    handleFadeOutAndNavigate(`/projects/${slug}`)
  }, [isMobile, isNavigating, handleFadeOutAndNavigate])

  // Listen for navigation from header/other sources (desktop only)
  useEffect(() => {
    if (isMobile) return

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

  // Expose fade-out function globally for header navigation (desktop only)
  useGSAP(() => {
    if (isMobile) return
    (window as any).__projectsFadeOut = handleFadeOutAndNavigate
    return () => {
      delete (window as any).__projectsFadeOut
    }
  }, { dependencies: [isMobile, handleFadeOutAndNavigate] })

  // Hidden styles for initial render - applied via inline styles
  const hiddenStyle = { opacity: 0, transform: 'translateY(20px) scale(0.98)' }
  const hiddenStyleSimple = { opacity: 0, transform: 'translateY(20px)' }

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
                onVideoReady={markReady}
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
            className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-10"
          >
            {visibleProjects.map((project, index) => {
              const title = getTitle(project)
              const isHighlighted = selectedIndex === index
              const dimOthers = !isHighlighted

              return (
                <li
                  key={project?.slug ?? `${title}-${index}`}
                  className={`
                    transition-opacity duration-300 ease-out
                    first:justify-self-start last:justify-self-end
                    [&:not(:first-child):not(:last-child)]:justify-self-center
                    sm:[&:nth-child(2n+1)]:justify-self-start sm:[&:nth-child(2n)]:justify-self-end
                    md:[&:nth-child(3n+1)]:justify-self-start md:[&:nth-child(3n+2)]:justify-self-center md:[&:nth-child(3n)]:justify-self-end
                    lg:[&:nth-child(4n+1)]:justify-self-start lg:[&:nth-child(4n+2)]:justify-self-center lg:[&:nth-child(4n+3)]:justify-self-center lg:[&:nth-child(4n)]:justify-self-end
                    xl:[&:nth-child(5n+1)]:justify-self-start xl:[&:nth-child(5n+2)]:justify-self-center xl:[&:nth-child(5n+3)]:justify-self-center xl:[&:nth-child(5n+4)]:justify-self-center xl:[&:nth-child(5n)]:justify-self-end
                    ${dimOthers ? 'opacity-40' : 'opacity-100'}
                  `}
                >
                  <div
                    onClick={() => handleProjectClick(project?.slug)}
                    className="block text-left group outline-none cursor-pointer"
                    data-reveal
                    style={hiddenStyle}
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

      {/* Mobile Layout - IMPORTANT: Mount video immediately, just hide container */}
      <main className={`fixed inset-0 ${isMobile ? 'block' : 'hidden'}`}>
        {/* Background video - crossfade slots */}
        <div className="fixed inset-0 z-0 bg-black">
          <div
            ref={(el) => { if (isMobile) setSlotRef(0)(el) }}
            className="absolute inset-0"
          >
            {/* Mount BackgroundMedia immediately when slotMedia exists
                so video can start loading. Container visibility handles show/hide */}
            {slotMedia[0] && (
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
            {slotMedia[1] && (
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
            {visibleProjects.map((project, index) => {
              const title = getTitle(project)
              const isActive = activeIndex === index
              return (
                <li
                  key={project?.slug ?? `${title}-${index}`}
                  data-index={index}
                  data-mobile-reveal
                  className="snap-center snap-always h-screen flex items-center px-6"
                  style={hiddenStyleSimple}
                >
                  <a
                    href={`/projects/${project?.slug}`}
                    className={`block transition-opacity duration-300 ${
                      isActive ? 'opacity-100' : 'opacity-30'
                    }`}
                  >
                    <h3 className="text-3xl leading-[1.05] font-semibold text-white mb-2">
                      {title}
                    </h3>
                    {project?.director && (
                      <p className="text-lg text-white/75">
                        {project.director}
                      </p>
                    )}
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
