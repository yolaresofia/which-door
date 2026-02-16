'use client'

import type { Media } from '../../utils/useCrossfadeMedia'
import BackgroundMedia from './BackgroundMedia'

type CrossfadeBackgroundProps = {
  slotMedia: [Media | null, Media | null]
  setSlotRef: (i: 0 | 1) => (el: HTMLDivElement | null) => void
  onVideoReady?: () => void
  disablePointerEvents?: boolean
  positioning?: 'fixed' | 'absolute'
}

export default function CrossfadeBackground({
  slotMedia,
  setSlotRef,
  onVideoReady,
  disablePointerEvents = false,
  positioning = 'fixed',
}: CrossfadeBackgroundProps) {
  return (
    <div className={`${positioning} inset-0 z-0 bg-black`}>
      {([0, 1] as const).map((i) => (
        <div
          key={i}
          ref={(el) => { setSlotRef(i)(el) }}
          className="absolute inset-0"
          style={disablePointerEvents ? { pointerEvents: 'none' } : undefined}
        >
          {slotMedia[i] && (
            <BackgroundMedia
              variant="preview"
              previewUrl={slotMedia[i]!.previewUrl ?? slotMedia[i]!.videoSrc}
              mobilePreviewUrl={slotMedia[i]!.mobilePreviewUrl}
              vimeoUrl={slotMedia[i]!.vimeoUrl ?? slotMedia[i]!.videoSrc}
              previewPoster={slotMedia[i]!.previewPoster}
              previewPosterLQIP={slotMedia[i]!.previewPosterLQIP}
              bgColor={slotMedia[i]!.bgColor}
              onVideoReady={onVideoReady}
            />
          )}
        </div>
      ))}
    </div>
  )
}
