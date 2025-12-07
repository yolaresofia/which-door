// app/components/GalleryGrid.tsx
import Image from 'next/image'

type GalleryImage = {
  url: string
  alt?: string
}

type GalleryGridProps = {
  images: GalleryImage[]
  onImageClick?: (index: number) => void
}

export default function GalleryGrid({ images, onImageClick }: GalleryGridProps) {
  const validImages = (images || []).filter((img) => typeof img?.url === 'string' && img.url.trim().length > 0)

  if (!validImages.length) return null

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 bg-[#477AA1]">
      {validImages.map((img, i) => (
        <li key={`img-${i}`} className="relative">
          <button
            type="button"
            onClick={() => onImageClick?.(i)}
            className="block w-full"
            aria-label={`Open image ${i + 1}`}
          >
            <div className="relative w-full aspect-[16/9]">
              <Image
                src={img.url}
                alt={img.alt || `Gallery image ${i + 1}`}
                fill
                className="object-cover"
                sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 100vw"
                priority={i < 2}
              />
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
