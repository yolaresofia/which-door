// app/projects/[slug]/page.tsx
'use client'

import {use, useMemo, useState, useRef, useEffect, useCallback} from 'react'
import {notFound, useRouter} from 'next/navigation'
import {projects, galleryImages} from '@/app/components/constants'
import DetailView from '@/app/components/DetailView'
import GalleryGrid from '@/app/components/GalleryGrid'
import ImageLightbox from '@/app/components/ImageLightbox'
import ContactPage from '@/app/contact/page'
import ContactSection from '@/app/components/ContactSection'
import BackgroundMedia from '@/app/components/BackgroundMedia/BackgroundMedia'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

export default function ProjectPage({params}: {params: Promise<{slug: string}>}) {
  // Unwrap params (Next 15)
  const {slug} = use(params)
  const router = useRouter()

  // Hooks FIRST (unconditional)
  const [open, setOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const mainRef = useRef<HTMLElement | null>(null)

  // Derive project after hooks
  const project = useMemo(() => projects.find((p) => p.slug === slug), [slug])
  const relatedProjects = useMemo(() => {
    if (!project) return []

    const slugify = (value: string) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

    if (project.otherProjects?.length) {
      return project.otherProjects.map((proj: any) => {
        if (proj.url) return proj

        const match =
          projects.find((p) => p.name.toLowerCase() === (proj.title ?? '').toLowerCase()) ||
          projects.find((p) => p.slug === slugify(proj.title ?? ''))

        return {
          ...proj,
          url: match ? `/projects/${match.slug}` : undefined,
          directors: proj.directors ?? (match?.director ? [match.director] : []),
          previewUrl: proj.previewUrl ?? match?.previewUrl ?? project.previewUrl,
        }
      })
    }

    return projects
      .filter((p) => p.slug !== slug)
      .map((p) => ({
        title: p.name,
        directors: p.director ? [p.director] : [],
        previewUrl: p.previewUrl,
        url: `/projects/${p.slug}`,
      }))
      .slice(0, 3)
  }, [project, slug])
  const projectWithRelated = useMemo(
    () => (project ? {...project, otherProjects: relatedProjects} : project),
    [project, relatedProjects]
  )

  const gallery = useMemo(
    () => project?.galleryImages?.filter((g) => g?.url) ?? galleryImages,
    [project]
  )

  const videoSrc = project ? (project as any).vimeoUrl ?? (project as any).videoURL : ''

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fade-out animation function - EXACT SAME as ProjectsLanding
  const fadeOutAndNavigate = useCallback((url: string) => {
    if (isNavigating || isMobile) return

    setIsNavigating(true)

    // Disable pointer events during animation
    if (mainRef.current) {
      mainRef.current.style.pointerEvents = 'none'
    }

    // Fade out controls
    const controlsContainer = document.querySelector('[data-touch-toggle-ignore]')
    if (controlsContainer) {
      const items = controlsContainer.querySelectorAll('[data-reveal]')

      if (items.length === 0) {
        router.push(url)
        return
      }

      // Create the animation
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
          // Small safety delay to ensure animation is fully visible
          setTimeout(() => {
            router.push(url)
          }, 50)
        }
      })
    } else {
      router.push(url)
    }
  }, [isNavigating, isMobile, router])

  // Expose fade-out function globally for header navigation
  useGSAP(() => {
    if (isMobile) return

    // Make fade-out function available globally
    ;(window as any).__projectDetailFadeOut = fadeOutAndNavigate

    return () => {
      delete (window as any).__projectDetailFadeOut
    }
  }, { dependencies: [isMobile, fadeOutAndNavigate] })
  if (!project) return notFound()
  return (
    <main ref={mainRef} className="text-white">
      <section className="relative h-dvh w-screen overflow-hidden isolate">
        <BackgroundMedia
          vimeoUrl={videoSrc}
          controls
          autoPlay
          title={(project as any).name}
          subtitle={(project as any).director}
          className="!z-0"
        />
      </section>

      <DetailView item={projectWithRelated as any} backgroundStrategy="color" />

      <GalleryGrid
        images={gallery}
        onImageClick={(i: number) => {
          setStartIndex(i)
          setOpen(true)
        }}
      />
      <ContactSection bgColor="#477AA1" />
      <ImageLightbox
        images={gallery}
        isOpen={open}
        initialIndex={startIndex}
        onClose={() => setOpen(false)}
        backgroundColor="#477AA1"
      />
    </main>
  )
}
