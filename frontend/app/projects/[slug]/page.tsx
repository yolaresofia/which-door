// app/projects/[slug]/page.tsx
'use client'

import {use, useMemo, useState} from 'react'
import {notFound} from 'next/navigation'
import {projects, galleryImages} from '@/app/components/constants'
import BackgroundMedia from '@/app/components/BackgroundMedia'
import DetailView from '@/app/components/DetailView'
import GalleryGrid from '@/app/components/GalleryGrid'
import ImageLightbox from '@/app/components/ImageLightbox'
import ContactPage from '@/app/contact/page'
import ContactSection from '@/app/components/ContactSection'

export default function ProjectPage({params}: {params: Promise<{slug: string}>}) {
  // Unwrap params (Next 15)
  const {slug} = use(params)

  // Hooks FIRST (unconditional)
  const [open, setOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)

  // Derive project after hooks
  const project = useMemo(() => projects.find((p) => p.slug === slug), [slug])
  if (!project) return notFound()

  const videoSrc = (project as any).bgVideo ?? (project as any).videoURL

  return (
    <main className="text-white">
      <section className="relative h-dvh w-screen overflow-hidden isolate">
        <BackgroundMedia
          imageSrc={(project as any).bgImage ?? ''}
          videoSrc={videoSrc}
          controls
          title={(project as any).name}
          subtitle={(project as any).director}
          className="!z-0"
        />
      </section>

      <DetailView item={project as any} backgroundStrategy="color" />

      <GalleryGrid
        images={galleryImages.map((g) => g.url)}
        onImageClick={(i: number) => {
          setStartIndex(i)
          setOpen(true)
        }}
      />
      <ContactSection bgColor="#477AA1" />
      <ImageLightbox
        images={galleryImages}
        isOpen={open}
        initialIndex={startIndex}
        onClose={() => setOpen(false)}
        backgroundColor="#477AA1"
      />
    </main>
  )
}
