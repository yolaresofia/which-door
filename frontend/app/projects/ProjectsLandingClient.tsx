'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { CrossfadeBackground } from '../components/BackgroundMedia'
import { projects } from '../components/constants'
import { useCrossfadeMedia } from '../utils/useCrossfadeMedia'
import { useSequencedReveal } from '../utils/useSequencedReveal'
import { usePageTransitionVideo } from '../utils/usePageTransitionVideo'
import { useFadeOutNavigation } from '../utils/useFadeOutNavigation'
import { useVideoReady } from '../utils/useVideoReady'
import { useCenteredItemDetection } from '../utils/useCenteredItemDetection'
import { REVEAL_HIDDEN_STYLE, REVEAL_HIDDEN_STYLE_SIMPLE } from '../utils/useRevealAnimation'
import { toMediaObject, getTitle } from '../utils/mediaHelpers'
import { useGSAP } from '@gsap/react'

export default function ProjectsLandingClient() {
  const { getPreviousVideoState } = usePageTransitionVideo()

  const homepageProjects = useMemo(
    () => projects.filter((project) => project.isInHomePage),
    []
  )
  const visibleProjects = homepageProjects.length ? homepageProjects : projects

  const first = visibleProjects[0] ?? projects[0]
  const targetVideo = useMemo(() => toMediaObject(first, 0), [first])

  const previousVideo = getPreviousVideoState()
  const initialVideo = previousVideo || targetVideo

  const { setSlotRef, slotMedia, crossfadeTo } = useCrossfadeMedia(initialVideo, { duration: 0.45 })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isReady, setIsReady] = useState(false)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

  const { isReady: videoReady, markReady } = useVideoReady({
    skip: isMobile,
    timeout: 800,
  })

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const hasTransitionedRef = useRef(false)
  const hasAnimatedRef = useRef(false)

  const { fadeOutAndNavigate, isNavigating } = useFadeOutNavigation(mainRef, {
    selector: '[data-reveal]',
    isMobile,
    saveVideo: true,
  })

  const select = useCallback((i: number) => {
    setSelectedIndex(i)
    const project = visibleProjects[i]
    if (!project) return
    crossfadeTo(toMediaObject(project, i))
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
    const project = visibleProjects[index]
    if (project) {
      crossfadeTo(toMediaObject(project, index))
    }
  }, [crossfadeTo, visibleProjects])

  useCenteredItemDetection(scrollContainerRef, '[data-index]', handleMobileActiveChange, {
    enabled: isMobile,
  })

  const handleFadeOutAndNavigate = useCallback((url: string) => {
    fadeOutAndNavigate(url, slotMedia)
  }, [fadeOutAndNavigate, slotMedia])

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
            {visibleProjects.map((project, index) => {
              const title = getTitle(project)
              const isActive = activeIndex === index
              return (
                <li
                  key={project?.slug ?? `${title}-${index}`}
                  data-index={index}
                  data-mobile-reveal
                  className="snap-center snap-always h-screen flex items-center px-6"
                  style={REVEAL_HIDDEN_STYLE_SIMPLE}
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
    )
  }

  // Desktop Layout
  return (
    <main
      ref={mainRef}
      className="relative w-full min-h-screen"
    >
      <CrossfadeBackground
        slotMedia={slotMedia}
        setSlotRef={setSlotRef}
        onVideoReady={markReady}
        disablePointerEvents
      />

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
                  style={REVEAL_HIDDEN_STYLE}
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
  )
}
