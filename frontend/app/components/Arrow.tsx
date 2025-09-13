export default function Arrow({
  direction,
  className = '',
}: {
  direction: 'left' | 'right'
  className?: string
}) {
  const rotate = direction === 'left' ? 'rotate-180' : ''
  return (
    <svg
      className={`${className} ${rotate}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}
