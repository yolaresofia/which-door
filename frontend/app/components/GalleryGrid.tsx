// app/components/GalleryGrid.tsx
type GalleryGridProps = {
  images: string[]
  onImageClick?: (index: number) => void
}

export default function GalleryGrid({ images, onImageClick }: GalleryGridProps) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 bg-[#477AA1]">
      {images.map((src, i) => (
        <li key={`img-${i}`} className="relative">
          <button
            type="button"
            onClick={() => onImageClick?.(i)}
            className="block w-full aspect-[16/9] bg-cover bg-center"
            style={{ backgroundImage: `url(${src})` }}
            aria-label={`Open image ${i + 1}`}
          />
        </li>
      ))}
    </ul>
  )
}
