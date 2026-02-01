/**
 * Animation Configuration Utility
 *
 * Centralizes animation settings for device-aware performance optimization.
 *
 * Key principles:
 * 1. SURGICAL will-change/force3D: Only apply to actively animating items, remove immediately on complete
 * 2. MOBILE CHEAPER BY DESIGN: Simpler animations on mobile (no stagger, shorter durations, fewer simultaneous)
 * 3. PROFESSIONAL CROSS-DEVICE: This isn't "lowering quality" - it's optimal behavior for each platform
 */

// Device detection - NO CACHING
// Caching can cause issues on iOS when orientation changes or viewport resizes
// The performance cost of these checks is negligible

export function getIsMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 1024
}

export function getIsReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}

/**
 * Animation duration settings
 * Mobile: shorter durations to feel snappy and reduce decode work
 * Desktop: fuller animations with more expressiveness
 */
export const DURATION = {
  // Reveal animations
  reveal: {
    mobile: 0.35,      // Was 0.6 - now much snappier
    desktop: 0.6,
  },
  // Sequenced reveals
  sequence: {
    mobile: 0.3,       // Was 0.8 - mobile doesn't need elaborate entrance
    desktop: 0.8,
  },
  // Fade out navigation
  fadeOut: {
    mobile: 0.25,      // Was 0.4 - quick exit
    desktop: 0.5,
  },
  // Crossfade between media
  crossfade: {
    mobile: 0.3,       // Was 0.45 - faster swap
    desktop: 0.45,
  },
} as const

/**
 * Stagger settings
 * Mobile: ZERO or near-zero stagger (all items animate together)
 * Desktop: Staggered for visual interest
 */
export const STAGGER = {
  reveal: {
    mobile: 0,         // NO stagger on mobile - simultaneous is smoother
    desktop: 0.08,
  },
  sequence: {
    mobile: 0,         // NO stagger
    desktop: {
      each: 0.08,
      from: 'start' as const,
      ease: 'power2.inOut',
    },
  },
  fadeOut: {
    mobile: 0,         // All items fade together
    desktop: {
      each: 0.05,
      from: 'end' as const,
      ease: 'power2.inOut',
    },
  },
} as const

/**
 * Easing settings
 * Mobile: Simpler easing curves
 * Desktop: More expressive curves
 */
export const EASE = {
  reveal: {
    mobile: 'power1.out',   // Simpler curve
    desktop: 'power2.out',
  },
  fadeOut: {
    mobile: 'power1.in',
    desktop: 'power2.in',
  },
} as const

/**
 * GPU hint utilities
 *
 * CRITICAL: These should only be applied RIGHT BEFORE animation starts
 * and REMOVED IMMEDIATELY on complete. Leaving them on causes:
 * - GPU memory pressure (each promoted element = GPU texture)
 * - Compositor overhead
 * - Battery drain
 *
 * IMPORTANT: Don't apply will-change to many nodes. Use it on a SMALL set
 * (ideally <5 elements) and only during the animation.
 */
export const GPU_HINTS = {
  /**
   * Apply GPU acceleration hints to elements ONLY when about to animate
   * Returns the GSAP vars object
   *
   * NOTE: Only use on a SMALL number of elements (ideally <5)
   */
  apply: (_items: Element | Element[] | NodeListOf<Element>): gsap.TweenVars => ({
    willChange: 'transform, opacity',
    // NOTE: force3D removed by default - only use if proven to help
    // GSAP's default transform handling is usually sufficient
  }),

  /**
   * GPU hints for desktop with force3D (only if explicitly needed)
   * Use sparingly - force3D creates compositor layers
   */
  applyWithForce3D: (_items: Element | Element[] | NodeListOf<Element>): gsap.TweenVars => ({
    willChange: 'transform, opacity',
    force3D: true,
  }),

  /**
   * Clear GPU hints IMMEDIATELY after animation completes
   * This is CRITICAL for mobile Safari performance
   *
   * SAFER POLICY: Only clear will-change, NOT transforms
   * Clearing transforms can break elements that have a base transform other than "none"
   */
  clear: (): gsap.TweenVars => ({
    willChange: 'auto',
    // NOTE: Do NOT clearProps transform by default - it can break base transforms
  }),

  /**
   * Clear GPU hints AND transforms - ONLY use for elements that:
   * 1. Started with inline hidden styles (like REVEAL_HIDDEN_STYLE)
   * 2. You know their base transform should be "none"
   */
  clearWithTransform: (): gsap.TweenVars => ({
    willChange: 'auto',
    clearProps: 'transform',
  }),

  /**
   * Full cleanup including backface visibility
   * ONLY use when you explicitly set backfaceVisibility
   */
  clearAll: (): gsap.TweenVars => ({
    willChange: 'auto',
    clearProps: 'backfaceVisibility',
    // NOTE: Not clearing transform - use clearWithTransform if needed
  }),
} as const

/**
 * Get animation config for current device
 * Use this to get device-appropriate settings
 */
export function getRevealConfig(isMobile?: boolean) {
  const mobile = isMobile ?? getIsMobile()
  return {
    duration: mobile ? DURATION.reveal.mobile : DURATION.reveal.desktop,
    stagger: mobile ? STAGGER.reveal.mobile : STAGGER.reveal.desktop,
    ease: mobile ? EASE.reveal.mobile : EASE.reveal.desktop,
    // Mobile: Skip GPU hints entirely - CSS transforms are sufficient
    useGPUHints: !mobile,
  }
}

export function getSequenceConfig(isMobile?: boolean) {
  const mobile = isMobile ?? getIsMobile()
  return {
    duration: mobile ? DURATION.sequence.mobile : DURATION.sequence.desktop,
    stagger: mobile ? STAGGER.sequence.mobile : STAGGER.sequence.desktop,
    // Mobile: Skip animation entirely for immediate show
    skipAnimation: mobile,
  }
}

export function getFadeOutConfig(isMobile?: boolean) {
  const mobile = isMobile ?? getIsMobile()
  return {
    duration: mobile ? DURATION.fadeOut.mobile : DURATION.fadeOut.desktop,
    stagger: mobile ? STAGGER.fadeOut.mobile : STAGGER.fadeOut.desktop,
    ease: mobile ? EASE.fadeOut.mobile : EASE.fadeOut.desktop,
  }
}

export function getCrossfadeConfig(isMobile?: boolean) {
  const mobile = isMobile ?? getIsMobile()
  return {
    duration: mobile ? DURATION.crossfade.mobile : DURATION.crossfade.desktop,
  }
}

/**
 * Maximum number of items to animate simultaneously on mobile
 * Beyond this, skip animation and show immediately
 */
export const MOBILE_MAX_ANIMATED_ITEMS = 6

/**
 * Check if we should skip animation entirely
 * True if: reduced motion OR too many items on mobile
 */
export function shouldSkipAnimation(itemCount: number, isMobile?: boolean): boolean {
  if (getIsReducedMotion()) return true
  const mobile = isMobile ?? getIsMobile()
  if (mobile && itemCount > MOBILE_MAX_ANIMATED_ITEMS) return true
  return false
}
