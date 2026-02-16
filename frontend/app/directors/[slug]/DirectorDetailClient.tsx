'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { notFound } from 'next/navigation'
import DetailView from '@/app/components/DetailView'
import { directors, projects } from '@/app/components/constants'
import { useSequencedReveal } from '@/app/utils/useSequencedReveal'
import { useFadeOutNavigation } from '@/app/utils/useFadeOutNavigation'
import { useGlobalVideo } from '@/app/utils/GlobalVideoContext'
import { useGSAP } from '@gsap/react'

export default function DirectorDetailClient({ slug }: { slug: string }) {
  const { setVideo, crossfadeTo, setMode } = useGlobalVideo()

  const [fontLoaded, setFontLoaded] = useState(false)

  // CSR-only: We can detect mobile immediately since we're only on client
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

  const contentRef = useRef<HTMLElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)

  // Use the reusable fade-out navigation hook
  const { fadeOutAndNavigate, isNavigating } = useFadeOutNavigation(mainRef, {
    selector: '[data-reveal]',
    isMobile,
  })

  const item = useMemo(() => directors.find((d) => d.slug === slug), [slug])

  const itemWithLinks = useMemo(() => {
    if (!item) return null

    const slugify = (value: string) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

    const otherProjects = item.otherProjects?.map((proj) => {
      const match =
        projects.find((p) => p.name.toLowerCase() === proj.title.toLowerCase()) ||
        projects.find((p) => p.slug === slugify(proj.title))

      return {
        ...proj,
        url: proj.url ?? (match ? `/projects/${match.slug}` : undefined),
        previewPoster: match?.previewPoster ?? undefined,
      }
    })

    return {...item, otherProjects}
  }, [item])

  const targetVideo = useMemo(() => ({
    id: itemWithLinks?.slug ?? slug,
    videoSrc: itemWithLinks?.previewUrl ?? '',
    previewUrl: itemWithLinks?.previewUrl ?? '',
    mobilePreviewUrl: (itemWithLinks as any)?.mobilePreviewUrl ?? '',
    previewPoster: itemWithLinks?.previewPoster,
    bgColor: '#477AA1',
  }), [itemWithLinks, slug])

  // Tell the global video layer what to show
  useEffect(() => {
    setMode('background')
    setVideo(targetVideo)
  }, [setMode, setVideo, targetVideo])

  // Handle hover on other projects - crossfade to show their preview with poster
  const handleHoverProject = useCallback((project: { previewUrl?: string; mobilePreviewUrl?: string; previewPoster?: string; title?: string } | null) => {
    if (isMobile) return

    if (project && project.previewUrl) {
      crossfadeTo({
        id: project.title ?? 'hover-project',
        videoSrc: project.previewUrl,
        previewUrl: project.previewUrl,
        mobilePreviewUrl: project.mobilePreviewUrl,
        previewPoster: project.previewPoster,
        bgColor: '#477AA1',
      })
    } else {
      // Return to director's video
      crossfadeTo(targetVideo)
    }
  }, [isMobile, crossfadeTo, targetVideo])

  // Enter animation
  const { start } = useSequencedReveal(contentRef, {
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

  // Start mobile content reveal - simple immediate show for performance
  useEffect(() => {
    if (!isMobile) return
    if (!contentRef.current) return

    // Mobile: Simple immediate show - no animation for better performance
    // GSAP stagger animations are heavy on mobile and cause glitches
    const items = contentRef.current.querySelectorAll('[data-reveal]')
    if (items && items.length > 0) {
      items.forEach((item) => {
        const el = item as HTMLElement
        el.style.opacity = '1'
        el.style.transform = 'none'
      })
    }
  }, [isMobile])

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

  // Handle navigation from other pages (like clicking back to directors list)
  useEffect(() => {
    if (isMobile) return

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
  useGSAP(() => {
    if (isMobile) return

    // Make fade-out function available globally
    ;(window as any).__directorDetailFadeOut = fadeOutAndNavigate

    return () => {
      delete (window as any).__directorDetailFadeOut
    }
  }, { dependencies: [isMobile, fadeOutAndNavigate] })

  // Check if item exists after all hooks have been called
  if (!itemWithLinks) {
    return notFound()
  }

  return (
    <main
      ref={mainRef}
      className="relative min-h-screen w-full overflow-hidden text-white"
    >
      {/* Content with animation */}
      <section
        ref={contentRef}
        className="relative z-10"
      >
        <DetailView item={itemWithLinks} enableAnimations={true} onHoverProject={handleHoverProject} />
      </section>
    </main>
  )
}
