'use client'

import React from 'react'

export type BackgroundMediaProps = {
  imageSrc: string
  videoSrc?: string
  useVideo?: boolean
  showScrim?: boolean
  showLeftGradient?: boolean
  className?: string
}

const isGif = (url?: string) => !!url && /\.gif($|\?)/i.test(url)

export default function BackgroundMedia({
  imageSrc,
  videoSrc,
  useVideo = true,
  showScrim = true,
  showLeftGradient = true,
  className = '',
}: BackgroundMediaProps) {
  const showVideo = !!(useVideo && videoSrc && !isGif(videoSrc))
  const bgForImage = isGif(videoSrc) ? (videoSrc as string) : imageSrc

  return (
    <div className={`absolute inset-0 -z-10 ${className}`}>
      {showVideo ? (
        <video
          className="h-full w-full object-cover"
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <div
          className="h-full w-full bg-cover bg-center"
          style={{backgroundImage: `url(${bgForImage})`}}
        />
      )}
      {showScrim && <div className="absolute inset-0 bg-black/40" />}
      {showLeftGradient && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      )}
    </div>
  )
}
