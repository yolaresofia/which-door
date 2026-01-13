'use client'
import { use } from 'react'
import dynamic from 'next/dynamic'

// CSR-only: Skip SSR entirely for this video-heavy interactive page
// This eliminates hydration issues and ensures correct mobile detection from the start
const DirectorDetailClient = dynamic(() => import('./DirectorDetailClient'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black" />
  ),
})

export default function DirectorPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = use(params)
  return <DirectorDetailClient slug={slug} />
}
