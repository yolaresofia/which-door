'use client'

import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getIsReducedMotion } from '../utils/animationConfig'

/**
 * Page Transition Configuration
 *
 * Performance constraints:
 * - 60fps on mid-tier mobile devices
 * - Only animate transform and opacity (GPU-accelerated)
 * - No layout thrash (getBoundingClientRect, etc.)
 * - CSS transitions preferred over JS animation loops
 */
const TRANSITION_CONFIG = {
  // Duration in ms - short enough to feel snappy, long enough for smoothness
  duration: 280,
  // Easing: ease-in-out feel
  easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  // Exit animation is slightly faster than enter
  exitDuration: 240,
  // Translate amount in px (small to avoid text blur)
  translateY: 12,
  exitTranslateY: -8,
} as const

type TransitionState = 'idle' | 'exiting' | 'entering'

type PageTransitionContextType = {
  /**
   * Navigate to a URL with a smooth page transition.
   * This should be called instead of router.push() for animated transitions.
   */
  navigateWithTransition: (url: string) => void
  /**
   * Current transition state
   */
  transitionState: TransitionState
  /**
   * Whether a transition is in progress
   */
  isTransitioning: boolean
  /**
   * Register a custom exit animation callback for the current page.
   * Called before navigation with a done() callback that must be invoked when animation completes.
   */
  registerExitAnimation: (callback: (done: () => void) => void) => void
  /**
   * Unregister the exit animation callback (cleanup)
   */
  unregisterExitAnimation: () => void
}

const PageTransitionContext = createContext<PageTransitionContextType | null>(null)

export function usePageTransition() {
  const context = useContext(PageTransitionContext)
  if (!context) {
    throw new Error('usePageTransition must be used within a PageTransitionProvider')
  }
  return context
}

/**
 * Optional hook that returns null if not within provider.
 * Useful for components that may or may not be within the provider.
 */
export function usePageTransitionOptional() {
  return useContext(PageTransitionContext)
}

type PageTransitionProviderProps = {
  children: ReactNode
}

export function PageTransitionProvider({ children }: PageTransitionProviderProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [transitionState, setTransitionState] = useState<TransitionState>('idle')
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)

  // Refs for managing transition state without re-renders
  const isTransitioningRef = useRef(false)
  const exitAnimationRef = useRef<((done: () => void) => void) | null>(null)
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPathnameRef = useRef(pathname)

  // Clear any pending timeouts
  const clearTransitionTimeout = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
    }
  }, [])

  // Register a custom exit animation for the current page
  const registerExitAnimation = useCallback((callback: (done: () => void) => void) => {
    exitAnimationRef.current = callback
  }, [])

  // Unregister the exit animation
  const unregisterExitAnimation = useCallback(() => {
    exitAnimationRef.current = null
  }, [])

  // Main navigation function with transition
  const navigateWithTransition = useCallback((url: string) => {
    // Don't navigate to current page
    if (url === pathname) return

    // Don't start new transition if one is in progress
    if (isTransitioningRef.current) {
      console.log('⚠️ Transition in progress, queuing navigation to:', url)
      setPendingUrl(url)
      return
    }

    // Check for reduced motion preference
    if (getIsReducedMotion()) {
      // Immediate navigation without animation
      router.push(url)
      return
    }

    console.log('🎬 Starting page transition to:', url)
    isTransitioningRef.current = true
    setTransitionState('exiting')

    // Safety timeout: ensure we navigate even if animation fails
    const safetyTimeout = TRANSITION_CONFIG.exitDuration + 500
    transitionTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Transition safety timeout triggered')
      isTransitioningRef.current = false
      setTransitionState('idle')
      router.push(url)
    }, safetyTimeout)

    // If there's a registered exit animation, use it
    if (exitAnimationRef.current) {
      exitAnimationRef.current(() => {
        clearTransitionTimeout()
        router.push(url)
      })
    } else {
      // Default: wait for CSS exit animation to complete
      setTimeout(() => {
        clearTransitionTimeout()
        router.push(url)
      }, TRANSITION_CONFIG.exitDuration)
    }
  }, [pathname, router, clearTransitionTimeout])

  // Handle route changes - trigger enter animation
  useEffect(() => {
    if (pathname !== lastPathnameRef.current) {
      lastPathnameRef.current = pathname

      // Only animate enter if we were in a transition
      if (isTransitioningRef.current) {
        setTransitionState('entering')

        // Reset to idle after enter animation
        const enterTimeout = setTimeout(() => {
          setTransitionState('idle')
          isTransitioningRef.current = false

          // Handle queued navigation
          if (pendingUrl) {
            const nextUrl = pendingUrl
            setPendingUrl(null)
            // Use requestAnimationFrame to ensure state is settled
            requestAnimationFrame(() => {
              navigateWithTransition(nextUrl)
            })
          }
        }, TRANSITION_CONFIG.duration)

        return () => clearTimeout(enterTimeout)
      }
    }
  }, [pathname, pendingUrl, navigateWithTransition])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTransitionTimeout()
    }
  }, [clearTransitionTimeout])

  const contextValue: PageTransitionContextType = {
    navigateWithTransition,
    transitionState,
    isTransitioning: transitionState !== 'idle',
    registerExitAnimation,
    unregisterExitAnimation,
  }

  return (
    <PageTransitionContext.Provider value={contextValue}>
      <div
        data-transition-root
        data-transition-state={transitionState}
        style={{
          // Ensure root fills viewport
          minHeight: '100dvh',
          // Background hardening
          backgroundColor: '#000',
        }}
      >
        {/*
          NOTE: We don't apply page-level CSS animations here.
          Individual GSAP animations handle each element's exit/enter with stagger.
          The data attributes are kept for state tracking only.
        */}
        <div data-page-content>
          {children}
        </div>
      </div>
    </PageTransitionContext.Provider>
  )
}

/**
 * Hook to register a page-specific exit animation.
 * Call this in page components that need custom exit animations.
 *
 * @example
 * ```tsx
 * usePageExitAnimation((done) => {
 *   // Animate elements out
 *   gsap.to('[data-reveal]', {
 *     opacity: 0,
 *     y: -20,
 *     duration: 0.3,
 *     onComplete: done
 *   })
 * })
 * ```
 */
export function usePageExitAnimation(callback: (done: () => void) => void) {
  const context = usePageTransitionOptional()

  useEffect(() => {
    if (context) {
      context.registerExitAnimation(callback)
      return () => {
        context.unregisterExitAnimation()
      }
    }
  }, [context, callback])
}
