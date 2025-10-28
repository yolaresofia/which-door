'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import BackgroundMedia from '../components/BackgroundMedia'
import { projects } from '../components/constants'
import { useCrossfadeMedia } from '../utils/useCrossfadeMedia'
import { useSequencedReveal } from '../utils/useSequencedReveal'
import { usePageTransitionVideo } from '../utils/usePageTransitionVideo'
import { gsap } from 'gsap'

const getTitle = (p: any) => p?.name ?? p?.title ?? 'Untitled'
const getPreview = (p: any) => p?.previewUrl ?? ''
const getVimeo = (p: any) => p?.vimeoUrl ?? ''
const getPoster = (p: any) => p?.previewPoster ?? ''
const getBgColor = (p: any) => p?.bgColor ?? '#000'

export default function ProjectsLanding() {
  const router = useRouter()
  const pathname = usePathname()
  const { saveVideoState, getPreviousVideoState } = usePageTransitionVideo()

  const first = projects[0]
  const targetVideo = useMemo(() => ({
    id: first?.slug ?? 0,
    videoSrc: getPreview(first) || getVimeo(first),
    previewUrl: getPreview(first),
    vimeoUrl: getVimeo(first),
    previewPoster: getPoster(first),
    bgColor: getBgColor(first),
  }), [first])

  // Check for previous video state to determine initial state
  const previousVideo = getPreviousVideoState()
  const initialVideo = previousVideo || targetVideo

  const { setSlotRef, slotMedia, crossfadeTo } = useCrossfadeMedia(initialVideo, { duration: 0.6 })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [fontLoaded, setFontLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const hasTransitionedRef = useRef(false)

  const select = useCallback((i: number) => {
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
  }, [selectedIndex, crossfadeTo])

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

    console.log('📹 Projects: Transitioning from previous page video')
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

  // Font loading
  useEffect(() => {
    let cancelled = false
    let timeoutId: NodeJS.Timeout

    const triggerAnimation = () => {
      if (cancelled) return
      setFontLoaded(true)
      // Start with RAF to ensure DOM is ready
      if (!isMobile) {
        requestAnimationFrame(() => {
          start()
        })
      }
    }

    if ('fonts' in document && (document as any).fonts?.ready) {
      ;(document as any).fonts.ready.then(() => {
        ;(document as any).fonts.load('normal 1em Neue').then(
          () => {
            if (!cancelled) triggerAnimation()
          },
          () => {
            if (!cancelled) triggerAnimation()
          }
        )
      })
    } else {
      timeoutId = setTimeout(triggerAnimation, 100)
    }

    const safetyTimeout = setTimeout(() => {
      if (!cancelled && !fontLoaded) {
        triggerAnimation()
      }
    }, 3000)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      clearTimeout(safetyTimeout)
    }
  }, [start, fontLoaded, isMobile])

  // Mobile: Intersection Observer for scroll detection
  useEffect(() => {
    if (!isMobile || !listRef.current) return

    const items = listRef.current.querySelectorAll('li')
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0', 10)
            select(index)
          }
        })
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.5,
        rootMargin: '0px'
      }
    )

    items.forEach((item) => {
      observerRef.current?.observe(item)
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [isMobile, select])

  // Fade-out animation function (reusable)
  const fadeOutAndNavigate = useCallback((url: string) => {
    if (isNavigating) return
    setIsNavigating(true)

    // Save current video state for the next page to use
    const currentMedia = slotMedia[0] || slotMedia[1]
    if (currentMedia) {
      saveVideoState({
        id: currentMedia.id,
        videoSrc: currentMedia.videoSrc || '',
        previewUrl: currentMedia.previewUrl,
        vimeoUrl: currentMedia.vimeoUrl,
        previewPoster: currentMedia.previewPoster,
        bgColor: currentMedia.bgColor,
      })
    }

    // Disable pointer events during animation
    if (mainRef.current) {
      mainRef.current.style.pointerEvents = 'none'
    }

    // Fade out all project titles
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[data-reveal]')

      gsap.to(items, {
        opacity: 0,
        y: -30,
        scale: 0.92,
        duration: 0.7,
        ease: 'power2.in',
        stagger: {
          each: 0.05,
          from: 'start'
        },
        onComplete: () => {
          router.push(url)
        }
      })
    } else {
      // Fallback
      router.push(url)
    }
  }, [isNavigating, router, slotMedia, saveVideoState])

  // Handle project click
  const handleProjectClick = useCallback((slug: string) => {
    if (isMobile || isNavigating) return
    fadeOutAndNavigate(`/projects/${slug}`)
  }, [isMobile, isNavigating, fadeOutAndNavigate])

  // Listen for navigation from header/other sources
  useEffect(() => {
    if (isMobile) return

    // Custom event listener for navigation from header
    const handleNavigationRequest = (e: CustomEvent) => {
      const url = e.detail?.url
      if (url && !isNavigating) {
        fadeOutAndNavigate(url)
      }
    }

    window.addEventListener('navigate-with-fade' as any, handleNavigationRequest as any)

    return () => {
      window.removeEventListener('navigate-with-fade' as any, handleNavigationRequest as any)
    }
  }, [isMobile, isNavigating, fadeOutAndNavigate])

  // Expose fade-out function globally for header navigation
  useEffect(() => {
    if (isMobile) return

    // Make fade-out function available globally
    (window as any).__projectsFadeOut = fadeOutAndNavigate

    return () => {
      delete (window as any).__projectsFadeOut
    }
  }, [isMobile, fadeOutAndNavigate])

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

        {/* Desktop Grid */}
        <section className="relative z-10 flex min-h-screen w-full md:px-12 px-4 items-center justify-center">
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
                vimeoUrl={slotMedia[0].vimeoUrl ?? slotMedia[0].videoSrc}
                previewPoster={slotMedia[0].previewPoster}
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
                vimeoUrl={slotMedia[1].vimeoUrl ?? slotMedia[1].videoSrc}
                previewPoster={slotMedia[1].previewPoster}
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
            {projects.map((project, index) => {
              const title = getTitle(project)
              const isActive = selectedIndex === index

              return (
                <li
                  key={project?.slug ?? `${title}-${index}`}
                  data-index={index}
                  className="snap-center snap-always h-screen flex items-center px-6 transition-all duration-500 ease-out"
                  style={{
                    opacity: isActive ? 1 : 0.25,
                    transform: `scale(${isActive ? 1 : 0.92})`,
                    willChange: 'opacity, transform',
                    transition: 'opacity 0.5s ease-out, transform 0.5s ease-out'
                  }}
                >
                  <a 
                    href={`/projects/${project?.slug}`}
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
