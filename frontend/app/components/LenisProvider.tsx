'use client'

import dynamic from 'next/dynamic'
import { type ReactNode } from 'react'

// Lazy load Lenis smooth scrolling - reduces initial bundle size by ~15KB
// Must be in a client component to use ssr: false
const ReactLenis = dynamic(() => import('lenis/react'), { ssr: false })

type Props = {
  children: ReactNode
}

export default function LenisProvider({ children }: Props) {
  return <ReactLenis root>{children}</ReactLenis>
}
