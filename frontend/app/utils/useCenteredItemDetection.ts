import { useEffect, useRef, RefObject } from 'react'

/**
 * Detects which item in a scrollable container is centered using IntersectionObserver.
 * This is MUCH more performant than using getBoundingClientRect() in a scroll loop
 * because IntersectionObserver runs on the compositor thread and doesn't cause layout thrashing.
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
    // Threshold at which an item is considered "active" (0.5 = 50% visible)
    threshold?: number
  } = {}
) {
  const { enabled = true, threshold = 0.5 } = options
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

    // Track intersection ratios for all items
    const ratios = new Map<Element, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        // Update ratios for changed entries
        entries.forEach((entry) => {
          ratios.set(entry.target, entry.intersectionRatio)
        })

        // Find the item with the highest intersection ratio
        let maxRatio = 0
        let newActiveIndex = activeIndexRef.current

        items.forEach((item, index) => {
          const ratio = ratios.get(item) ?? 0
          if (ratio > maxRatio) {
            maxRatio = ratio
            newActiveIndex = index
          }
        })

        // Only trigger callback if the active item changed and it's sufficiently visible
        if (newActiveIndex !== activeIndexRef.current && maxRatio >= threshold) {
          activeIndexRef.current = newActiveIndex
          onActiveChangeRef.current(newActiveIndex)
        }
      },
      {
        root: container,
        // rootMargin shrinks the intersection box to focus on the center
        // -40% from top and bottom means only the center 20% of viewport triggers
        rootMargin: '-40% 0px -40% 0px',
        // Multiple thresholds for smoother detection
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    )

    // Observe all items
    items.forEach((item) => observer.observe(item))

    return () => {
      observer.disconnect()
      ratios.clear()
    }
  }, [containerRef, itemSelector, enabled, threshold])
}
