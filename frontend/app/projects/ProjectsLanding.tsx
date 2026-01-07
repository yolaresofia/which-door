'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react'
import BackgroundMedia from '../components/BackgroundMedia'
import { projects } from '../components/constants'
import { useCrossfadeMedia } from '../utils/useCrossfadeMedia'
import { useSequencedReveal } from '../utils/useSequencedReveal'
import { usePageTransitionVideo } from '../utils/usePageTransitionVideo'
import { useFadeOutNavigation } from '../utils/useFadeOutNavigation'
import { useVideoReady } from '../utils/useVideoReady'
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
  const [activeIndex, setActiveIndex] = useState(0) // For mobile - which project is centered
  const [isMobile, setIsMobile] = useState(false)

  // Track video ready state for smoother content reveal
  const { isReady: videoReady, markReady } = useVideoReady({
    skip: isMobile, // Skip waiting on mobile (simpler experience)
    timeout: 2500,
  })

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const hasTransitionedRef = useRef(false)

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

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Hide content initially to prevent FOUC (desktop only)
  // useLayoutEffect runs synchronously before browser paint
  useLayoutEffect(() => {
    if (!listRef.current || isMobile) return
    const items = listRef.current.querySelectorAll('[data-reveal]')
    gsap.set(items, { opacity: 0, y: 20, scale: 0.98 })
  }, [isMobile])

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
            {visibleProjects.map((project, index) => {
              const title = getTitle(project)
              const isActive = activeIndex === index
              return (
                <li
                  key={project?.slug ?? `${title}-${index}`}
                  data-index={index}
                  className="snap-center snap-always h-screen flex items-center px-6"
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
