import './globals.css'

import {SpeedInsights} from '@vercel/speed-insights/next'
import type {Metadata} from 'next'
import {draftMode} from 'next/headers'
import {VisualEditing, toPlainText} from 'next-sanity'
import {Toaster} from 'sonner'

import DraftModeToast from '@/app/components/DraftModeToast'
import Header from '@/app/components/Header'
import LenisProvider from '@/app/components/LenisProvider'
import * as demo from '@/sanity/lib/demo'
import {sanityFetch, SanityLive} from '@/sanity/lib/live'
import {settingsQuery} from '@/sanity/lib/queries'
import {resolveOpenGraphImage} from '@/sanity/lib/utils'
import {handleError} from './client-utils'

/**
 * Generate metadata for the page.
 * Learn more: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#generatemetadata-function
 */
export async function generateMetadata(): Promise<Metadata> {
  const {data: settings} = await sanityFetch({
    query: settingsQuery,
    // Metadata should never contain stega
    stega: false,
  })
  const title = settings?.title || demo.title
  const description = settings?.description || demo.description

  const ogImage = resolveOpenGraphImage(settings?.ogImage)
  let metadataBase: URL | undefined = undefined
  try {
    metadataBase = settings?.ogImage?.metadataBase
      ? new URL(settings.ogImage.metadataBase)
      : undefined
  } catch {
    // ignore
  }
  return {
    metadataBase,
    title: {
      template: `%s | ${title}`,
      default: title,
    },
    description: toPlainText(description),
    openGraph: {
      images: ogImage ? [ogImage] : [],
    },
  }
}

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()

  return (
    <html lang="en" className="bg-white text-black font-neue">
      <head>
        {/* CRITICAL FIX: Preload font to prevent FOUT */}
        <link
          rel="preload"
          href="/fonts/PPNeueMontreal-Medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* CRITICAL FIX: Preload LCP image (first project poster) to reduce LCP from 9.9s */}
        <link
          rel="preload"
          href="https://cdn.sanity.io/images/xerhtqd5/production/56e1c08338bae02337d4eb3156b2c81b31cfd118-3015x1694.jpg?w=1920&q=75&auto=format"
          as="image"
          type="image/jpeg"
          fetchPriority="high"
        />
        {/* Preconnect to Sanity CDN for faster resource loading */}
        <link rel="preconnect" href="https://cdn.sanity.io" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
        {/* Preconnect to Vimeo domains for faster video loading */}
        <link rel="preconnect" href="https://player.vimeo.com" />
        <link rel="preconnect" href="https://i.vimeocdn.com" />
        <link rel="preconnect" href="https://f.vimeocdn.com" />
        <link rel="preconnect" href="https://vod-adaptive-ak.vimeocdn.com" />
        <link rel="dns-prefetch" href="https://player.vimeo.com" />
        <link rel="dns-prefetch" href="https://i.vimeocdn.com" />
        <link rel="dns-prefetch" href="https://f.vimeocdn.com" />
        <link rel="dns-prefetch" href="https://vod-adaptive-ak.vimeocdn.com" />
      </head>
      <body>
        <LenisProvider>
          <section className="min-h-screen">
            {/* The <Toaster> component is responsible for rendering toast notifications used in /app/client-utils.ts and /app/components/DraftModeToast.tsx */}
            <Toaster />
            {isDraftMode && (
              <>
                <DraftModeToast />
                {/*  Enable Visual Editing, only to be rendered when Draft Mode is enabled */}
                <VisualEditing />
              </>
            )}
            {/* The <SanityLive> component is responsible for making all sanityFetch calls in your application live, so should always be rendered. */}
            <SanityLive onError={handleError} />
            <Header />
            <main className="">{children}</main>
          </section>
          <SpeedInsights />
        </LenisProvider>
      </body>
    </html>
  )
}
