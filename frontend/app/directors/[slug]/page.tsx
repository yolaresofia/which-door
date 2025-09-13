'use client'

import BackgroundMedia from '@/app/components/BackgroundMedia';
import { directors } from '@/app/components/constants';
import Link from 'next/link';
import {notFound} from 'next/navigation'
import {useEffect, useMemo} from 'react'

export default function DirectorPage({params}: {params: {slug: string}}) {
  const director = useMemo(
    () => directors?.find((d) => d.slug === params.slug),
    [params.slug],
  )

  useEffect(() => {
    if (director?.bgVideo && /\.gif($|\?)/i.test(director.bgVideo)) {
      const img = new Image()
      img.src = director.bgVideo
    }
  }, [director?.bgVideo])

  if (!director) return notFound()

  return (
    <main className="relative min-h-dvh w-full overflow-hidden text-white">
     <BackgroundMedia imageSrc={director.bgImage} videoSrc={director.bgVideo} />

      <section className="relative z-10 pt-28 pb-16 px-12 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-6xl leading-[1.05] tracking-tight">
            {director.name}
          </h1>
          <p className="mt-2 text-2xl text-white/85">{director.specialization}</p>
        </header>

        <article className="max-w-3xl text-2xl text-white/90">
          <p>{director.bio}</p>
        </article>

        <div className="mt-24">
          <h2 className="text-2xl mb-4">Projects</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {director.relatedProjects.map((proj) => (
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
      </section>
    </main>
  )
}