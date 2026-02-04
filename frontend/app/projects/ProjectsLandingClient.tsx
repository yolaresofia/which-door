'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react'
import BackgroundMedia from '../components/BackgroundMedia'
import { projects } from '../components/constants'
import { useBackgroundMedia, type Media } from '../context/BackgroundMediaContext'
import { useCrossfadeMedia } from '../utils/useCrossfadeMedia'
import { useSequencedReveal } from '../utils/useSequencedReveal'
import { useFadeOutNavigation } from '../utils/useFadeOutNavigation'
import { useGSAP } from '@gsap/react'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getTitle = (p: any) => p?.name ?? p?.title ?? 'Untitled'
const getPreview = (p: any) => p?.previewUrl ?? ''
const getMobilePreview = (p: any) => p?.mobilePreviewUrl ?? ''
const getVimeo = (p: any) => p?.vimeoUrl ?? ''
const getPoster = (p: any) => p?.previewPoster ?? ''
const getPosterLQIP = (p: any) => p?.previewPosterLQIP ?? ''
const getBgColor = (p: any) => p?.bgColor ?? '#000'

/** Convert a project to Media format */
function projectToMedia(project: any, fallbackId?: number): Media {
  return {
    id: project?.slug ?? fallbackId ?? 0,
    videoSrc: getPreview(project) || getVimeo(project),
    previewUrl: getPreview(project),
    mobilePreviewUrl: getMobilePreview(project),
    vimeoUrl: getVimeo(project),
    previewPoster: getPoster(project),
    previewPosterLQIP: getPosterLQIP(project),
    bgColor: getBgColor(project),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectsLandingClient() {
  // Device detection (CSR-only) - detect ONCE at mount
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

  // Global background context (for desktop)
  const { setBackground } = useBackgroundMedia()

  // ─────────────────────────────────────────────────────────────
  // PROJECTS DATA
  // ─────────────────────────────────────────────────────────────
  const homepageProjects = useMemo(
    () => projects.filter((project) => project.isInHomePage),
    []
  )
  const visibleProjects = homepageProjects.length ? homepageProjects : projects
  const first = visibleProjects[0] ?? projects[0]
  const initialMedia = useMemo(() => projectToMedia(first), [first])

  // ─────────────────────────────────────────────────────────────
  // LOCAL CROSSFADE (mobile only) - uses battle-tested BackgroundMedia
  // ─────────────────────────────────────────────────────────────
  const { setSlotRef, slotMedia, crossfadeTo } = useCrossfadeMedia(initialMedia, { duration: 0.45 })

  // ─────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0) // Mobile: which project is centered
  const [isReady, setIsReady] = useState(false)

  // ─────────────────────────────────────────────────────────────
  // REFS
  // ─────────────────────────────────────────────────────────────
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const hasSetInitialBgRef = useRef(false)
  const hasAnimatedRef = useRef(false)

  // ─────────────────────────────────────────────────────────────
  // FADE-OUT NAVIGATION
  // ─────────────────────────────────────────────────────────────
  const { fadeOutAndNavigate, isNavigating } = useFadeOutNavigation(mainRef, {
    selector: '[data-reveal]',
    isMobile,
    saveVideo: false,
  })

  // ─────────────────────────────────────────────────────────────
  // SET INITIAL BACKGROUND ON MOUNT (desktop uses global context)
  // ─────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (hasSetInitialBgRef.current) return
    hasSetInitialBgRef.current = true

    // Desktop: set global background
    if (!isMobile) {
      setBackground(initialMedia)
    }
  }, [isMobile, initialMedia, setBackground])

  // ─────────────────────────────────────────────────────────────
  // HOVER HANDLER (desktop) - crossfade via global context
  // ─────────────────────────────────────────────────────────────
  const select = useCallback((i: number) => {
    setSelectedIndex(i)
    const project = visibleProjects[i]
    if (project) {
      setBackground(projectToMedia(project, i))
    }
  }, [setBackground, visibleProjects])

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
  // MOBILE: Scroll detection for centered item (uses local crossfade)
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
        const project = visibleProjects[closestIndex]
        if (project) {
          // Mobile: use local crossfade
          crossfadeTo(projectToMedia(project, closestIndex))
        }
      }
    }

    findCenteredItem()

    const handleScroll = () => requestAnimationFrame(findCenteredItem)
    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => container.removeEventListener('scroll', handleScroll)
  }, [isMobile, activeIndex, crossfadeTo, visibleProjects])

  // ─────────────────────────────────────────────────────────────
  // NAVIGATION HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handleProjectClick = useCallback((slug: string) => {
    if (isMobile || isNavigating) return
    fadeOutAndNavigate(`/projects/${slug}`)
  }, [isMobile, isNavigating, fadeOutAndNavigate])

  // Expose fade-out for header navigation
  useGSAP(() => {
    if (isMobile) return
    ;(window as any).__projectsFadeOut = fadeOutAndNavigate
    return () => { delete (window as any).__projectsFadeOut }
  }, { dependencies: [isMobile, fadeOutAndNavigate] })

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  const hiddenStyle = { opacity: 0, transform: 'translateY(20px) scale(0.98)' }
  const hiddenStyleSimple = { opacity: 0, transform: 'translateY(20px)' }

  // MOBILE LAYOUT - uses LOCAL BackgroundMedia (battle-tested for iOS)
  if (isMobile) {
    return (
      <main className="fixed inset-0">
        {/* LOCAL background video - crossfade slots (works well on iOS) */}
        <div className="fixed inset-0 z-0 bg-black">
          <div
            ref={(el) => { setSlotRef(0)(el) }}
            className="absolute inset-0"
          >
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
            ref={(el) => { setSlotRef(1)(el) }}
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
                      <p className="text-lg text-white/75">{project.director}</p>
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

  // DESKTOP LAYOUT - uses GLOBAL background from layout
  return (
    <main ref={mainRef} className="relative w-full min-h-screen">
      {/* NO local background - uses GlobalBackgroundMedia from layout */}

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
  )
}
