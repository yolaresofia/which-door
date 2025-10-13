'use client'

import {useEffect} from 'react'
import BackgroundMedia from './BackgroundMedia/BackgroundMedia'

type RelatedItem = {title: string; directors: string[]; brand: string}

export type DetailItem = {
  name: string
  slug?: string
  bgImage?: string
  vimeoUrl?: string
  videoURL?: string
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
  const videoSrc = item.vimeoUrl ?? item.videoURL
  const color = item.bgColor ?? item.backgroundColor
  const imageSrc = item.bgImage ?? ''

  useEffect(() => {
    if (videoSrc && /\.gif($|\?)/i.test(videoSrc)) {
      const img = new Image()
      img.src = videoSrc
    }
  }, [videoSrc])

  let bgProps: {imageSrc: string; videoSrc?: string; bgColor?: string} | undefined = undefined

  switch (backgroundStrategy) {
    case 'color':
      bgProps = {imageSrc, bgColor: color}
      break
    case 'video':
      bgProps = {imageSrc, videoSrc: videoSrc}
      break
    case 'image':
      bgProps = {imageSrc}
      break
    case 'none':
      bgProps = undefined
      break
    case 'auto':
    default:
      if (color) bgProps = {imageSrc, bgColor: color}
      else if (videoSrc) bgProps = {imageSrc, videoSrc}
      else bgProps = {imageSrc}
  }

  return (
    <main className="relative min-h-dvh w-full overflow-hidden text-white bg-[#477AA1]">
      {bgProps && <BackgroundMedia videoSrc={bgProps.videoSrc} />}

      <section className="relative z-10 pt-32 pb-16 md:px-12 px-6 max-w-6xl">
        <header className="mb-8">
          <h1 className="md:text-6xl text-2xl leading-[1.05] tracking-tight">{item.name}</h1>
          {item.specialization ? (
            <p className="mt-2 text-2xl text-white/85">{item.specialization}</p>
          ) : null}
        </header>

        {item.description ? (
          <article className="max-w-3xl md:text-2xl text-[18px] text-justify md:text-left text-white/90 leading-tight">
            <p>{item.description}</p>
          </article>
        ) : null}

        {item.relatedProjects?.length ? (
          <div className="mt-24">
            <h2 className="md:text-[18px] text-base mb-4">Related projects</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {item.relatedProjects.map((proj) => (
                <li key={`${proj.title}-${proj.brand}`}>
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
