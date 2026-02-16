import { useEffect, useRef, RefObject } from 'react'

/**
 * Detects which item in a snap-scroll container is centered.
 * Uses scroll events + snap position calculation for reliable detection
 * across all browsers and layout contexts (including fixed-position parents).
 *
 * @param containerRef - Ref to the scrollable container
 * @param itemSelector - CSS selector for the items to observe (e.g., '[data-index]')
 * @param onActiveChange - Callback when the active (centered) item changes
 * @param options - Optional configuration
 */
export function useCenteredItemDetection(
  containerRef: RefObject<HTMLElement | null>,
  itemSelector: string,
  onActiveChange: (index: number) => void,
  options: {
    enabled?: boolean
    threshold?: number
  } = {}
) {
  const { enabled = true } = options
  const activeIndexRef = useRef(0)
  const onActiveChangeRef = useRef(onActiveChange)

  // Keep callback ref updated without re-running effect
  useEffect(() => {
    onActiveChangeRef.current = onActiveChange
  }, [onActiveChange])

  useEffect(() => {
    if (!enabled) return

    const container = containerRef.current
    if (!container) return

    const items = container.querySelectorAll(itemSelector)
    if (!items.length) return

    const detect = () => {
      const containerRect = container.getBoundingClientRect()
      const containerCenter = containerRect.top + containerRect.height / 2

      let closestIndex = activeIndexRef.current
      let closestDist = Infinity

      items.forEach((item, index) => {
        const rect = item.getBoundingClientRect()
        const itemCenter = rect.top + rect.height / 2
        const dist = Math.abs(itemCenter - containerCenter)
        if (dist < closestDist) {
          closestDist = dist
          closestIndex = index
        }
      })

      if (closestIndex !== activeIndexRef.current) {
        activeIndexRef.current = closestIndex
        onActiveChangeRef.current(closestIndex)
      }
    }

    // Use scrollend for snap detection (fires after snap settles)
    // Fall back to debounced scroll for browsers without scrollend
    let scrollTimer: ReturnType<typeof setTimeout> | null = null
    const supportsScrollEnd = 'onscrollend' in window

    if (supportsScrollEnd) {
      container.addEventListener('scrollend', detect, { passive: true })
    }

    // Also listen to scroll for faster feedback during active scrolling
    const handleScroll = () => {
      if (scrollTimer) clearTimeout(scrollTimer)
      scrollTimer = setTimeout(detect, 80)
    }
    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      if (supportsScrollEnd) {
        container.removeEventListener('scrollend', detect)
      }
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimer) clearTimeout(scrollTimer)
    }
  }, [containerRef, itemSelector, enabled])
}
