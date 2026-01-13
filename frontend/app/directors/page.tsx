'use client'
import dynamic from 'next/dynamic'

// CSR-only: Skip SSR entirely for this video-heavy interactive page
// This eliminates hydration issues and ensures correct mobile detection from the start
const DirectorsClient = dynamic(() => import('./DirectorsClient'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black" />
  ),
})

export default function DirectorsIndexPage() {
  return <DirectorsClient />
}
