// app/directors/[slug]/page.tsx
import {notFound} from 'next/navigation'
import DetailView from '@/app/components/DetailView'
import {directors} from '@/app/components/constants'

export default async function DirectorPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const item = directors.find((d) => d.slug === slug)
  if (!item) return notFound()
    
  return (
    <main>
      <DetailView item={item as any} />
    </main>
  )
}
