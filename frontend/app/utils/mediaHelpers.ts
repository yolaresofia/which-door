import type { Media } from './useCrossfadeMedia'

/**
 * Build a Media object from any project/director entity.
 * Replaces per-field getter functions and inline object construction.
 */
export function toMediaObject(
  entity: any,
  index: number,
  defaultBgColor = '#000'
): Media {
  return {
    id: entity?.slug ?? index,
    videoSrc: entity?.previewUrl ?? entity?.vimeoUrl ?? '',
    previewUrl: entity?.previewUrl ?? '',
    mobilePreviewUrl: entity?.mobilePreviewUrl ?? '',
    vimeoUrl: entity?.vimeoUrl ?? '',
    previewPoster: entity?.previewPoster ?? '',
    previewPosterLQIP: entity?.previewPosterLQIP ?? '',
    bgColor: entity?.bgColor ?? defaultBgColor,
  }
}

export function getTitle(entity: any): string {
  return entity?.name ?? entity?.title ?? 'Untitled'
}
