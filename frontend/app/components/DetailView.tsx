'use client'
import {useEffect, useMemo, useState} from 'react'
import BackgroundMedia from './BackgroundMedia/BackgroundMedia'

type RelatedItem = {title: string; directors: string[]; brand: string; previewUrl?: string}

export type DetailItem = {
  name: string
  slug?: string
  bgImage?: string
  previewUrl?: string
  bgColor?: string
  backgroundColor?: string
  specialization?: string
  description?: string
  relatedProjects?: RelatedItem[]
}

type BackgroundStrategy = 'auto' | 'color' | 'video' | 'image' | 'none'

export default function DetailView({
  item,
  backgroundStrategy = 'auto',
}: {
  item: DetailItem
  backgroundStrategy?: BackgroundStrategy
}) {
  const [hoveredProjectUrl, setHoveredProjectUrl] = useState<string | null>(null)

  // Use hovered project video if allowed, otherwise fall back to the item's preview
  const initialPreview = useMemo(() => item.previewUrl ?? null, [item.previewUrl])
  const allowPreview =
    backgroundStrategy !== 'color' && backgroundStrategy !== 'image' && backgroundStrategy !== 'none'
  const activePreviewSrc = allowPreview ? hoveredProjectUrl ?? initialPreview ?? undefined : undefined
  useEffect(() => {
    if (!allowPreview) {
      setHoveredProjectUrl(null)
    }
  }, [allowPreview])

  const color = item.bgColor ?? item.backgroundColor

  useEffect(() => {
    if (activePreviewSrc && /\.gif($|\?)/i.test(activePreviewSrc)) {
      const img = new Image()
      img.src = activePreviewSrc
    }
  }, [activePreviewSrc])

  const mainStyle = color ? {backgroundColor: color} : undefined
  const showBackgroundMedia = Boolean(activePreviewSrc)

  return (
    <main className="relative min-h-dvh w-full overflow-hidden text-white" style={mainStyle}>
      {showBackgroundMedia && <BackgroundMedia variant="preview" previewUrl={activePreviewSrc} bgColor={color} />}
      <section className="relative z-10 pt-32 pb-16 md:px-12 px-6 max-w-6xl">
        <header className="mb-8">
          <h1 className="md:text-6xl text-2xl leading-[1.05] tracking-tight">{item.name}</h1>
          {item.specialization ? (
            <p className="mt-2 text-2xl text-white/85">{item.specialization}</p>
          ) : null}
        </header>
        {item.description ? (
          <article className="max-w-3xl md:text-2xl text-[18px] md:text-left text-white/90 leading-tight">
            <p>{item.description}</p>
          </article>
        ) : null}
        {item.relatedProjects?.length ? (
          <div className="mt-24">
            <h2 className="md:text-[18px] text-base mb-4">Related projects</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {item.relatedProjects.map((proj) => (
                <li
                  key={`${proj.title}-${proj.brand}`}
                  onMouseEnter={() =>
                    allowPreview && proj.previewUrl && setHoveredProjectUrl(proj.previewUrl)
                  }
                  onMouseLeave={() => allowPreview && setHoveredProjectUrl(null)}
                  onFocus={() => allowPreview && proj.previewUrl && setHoveredProjectUrl(proj.previewUrl)}
                  onBlur={() => allowPreview && setHoveredProjectUrl(null)}
                  className="cursor-pointer transition-opacity hover:opacity-100 opacity-90"
                >
                  <div className="rounded-2xl h-full">
                    <div className="text-base text-white/80">{proj.brand}</div>
                    <div className="text-xl">{proj.title}</div>
                    <div className="mt-1 text-sm text-white/70">{proj.directors.join(', ')}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </main>
  )
}
