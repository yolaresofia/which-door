# Mobile Video Scroll Experience: Debugging & Optimization Guide

## Table of Contents
1. [Debugging Checklist](#1-debugging-checklist)
2. [GSAP Architecture for Next.js](#2-gsap-architecture-for-nextjs)
3. [GPU-Friendly Animation Properties](#3-gpu-friendly-animation-properties)
4. [Video Readiness Coordination](#4-video-readiness-coordination)
5. [Mobile Scroll Strategy](#5-mobile-scroll-strategy)
6. [Video Performance for Mobile](#6-video-performance-for-mobile)
7. [Exit Animation on Navigation](#7-exit-animation-on-navigation)
8. [Code Examples](#8-code-examples)
9. [Prioritized Fix Plan](#9-prioritized-fix-plan)
10. [YOUR SPECIFIC LAYOUT THRASHING ISSUES (CRITICAL - START HERE)](#10-your-specific-layout-thrashing-issues-critical)
11. [Mobile Video Autoplay](#11-mobile-video-autoplay-critical)

---

## 1. Debugging Checklist

### Chrome DevTools Performance (Mobile)

1. **Connect device via USB** or use Chrome's mobile emulation (throttle CPU 4x, Network: Fast 3G)

2. **Record a performance trace**:
   ```
   Performance tab → Record → Scroll through sections → Stop
   ```

3. **Look for these red flags**:

   | Symptom | What to look for | Likely cause |
   |---------|------------------|--------------|
   | Long Tasks (red bars) | Main thread blocks > 50ms | JS computation, forced reflows |
   | Layout Shift | Purple "Layout" bars in flame chart | Animating width/height/top/left |
   | Paint flashing | Enable "Paint flashing" in Rendering tab | Non-composited animations |
   | Low FPS | Frame rate drops below 30fps | Too many concurrent animations |
   | Jank spikes | Irregular frame timing | GC pauses, video decode stalls |

4. **Check the Layers panel**:
   ```
   More tools → Layers → Look for:
   - Elements without their own layer (need will-change or translateZ)
   - Layers that are too large (memory pressure)
   ```

5. **Safari Web Inspector (iOS)**:
   ```
   Develop → [Device] → Timeline → Record
   Look for: Layout, Paint, Composite events
   ```

### Quick Console Checks

```javascript
// Check for layout thrashing (run in console during scroll)
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) {
      console.warn('Long task:', entry.duration, 'ms');
    }
  }
});
observer.observe({ entryTypes: ['longtask'] });

// Check video decode performance
document.querySelectorAll('video').forEach((v, i) => {
  console.log(`Video ${i}:`, {
    readyState: v.readyState,
    paused: v.paused,
    buffered: v.buffered.length ? v.buffered.end(0) : 0,
    videoWidth: v.videoWidth,
    videoHeight: v.videoHeight
  });
});
```

### Mobile-Specific Checks

```javascript
// Battery/thermal throttling detection
if ('getBattery' in navigator) {
  navigator.getBattery().then(b => {
    console.log('Battery:', b.level * 100 + '%', 'Charging:', b.charging);
  });
}

// Check if video hardware decoding is available
const video = document.querySelector('video');
if (video) {
  video.getVideoPlaybackQuality?.() && console.log(
    'Dropped frames:', video.getVideoPlaybackQuality().droppedVideoFrames
  );
}
```

---

## 2. GSAP Architecture for Next.js

### The Flash/Glitch Problem

**Root Cause**: React hydration mismatch between server-rendered HTML and client-side state.

**Solution Architecture**:

```
Server Render → Inline hidden styles → Client Hydration → useLayoutEffect sets GSAP → useGSAP animates
```

### Correct Hook Ordering

```tsx
'use client'
import { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

export default function Section() {
  const containerRef = useRef<HTMLDivElement>(null)
  const hasInitializedRef = useRef(false)

  // 1. CRITICAL: useLayoutEffect runs BEFORE paint
  // Use this to set initial GSAP states that override inline styles
  useLayoutEffect(() => {
    if (!containerRef.current || hasInitializedRef.current) return
    hasInitializedRef.current = true

    const items = containerRef.current.querySelectorAll('[data-reveal]')
    // This runs synchronously before browser paints
    gsap.set(items, {
      opacity: 0,
      y: 20,
      // GPU hints ONLY - don't animate these
      willChange: 'transform, opacity',
      force3D: true
    })
  }, [])

  // 2. useGSAP for animations (with proper cleanup)
  useGSAP(() => {
    if (!containerRef.current) return

    const items = containerRef.current.querySelectorAll('[data-reveal]')

    // Animation runs after layout is stable
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
      stagger: 0.08,
      onComplete: () => {
        // Clean up will-change after animation
        gsap.set(items, { willChange: 'auto' })
      }
    })
  }, { scope: containerRef, dependencies: [] })

  return (
    <div ref={containerRef}>
      {/* Inline styles prevent flash during SSR/hydration */}
      <h1 data-reveal style={{ opacity: 0, transform: 'translateY(20px)' }}>
        Title
      </h1>
    </div>
  )
}
```

### Why useGSAP Over useEffect

```tsx
// ❌ BAD: useEffect doesn't guarantee cleanup order
useEffect(() => {
  const tl = gsap.timeline()
  tl.to('.item', { opacity: 1 })
  return () => tl.kill() // May not run before next animation starts
}, [])

// ✅ GOOD: useGSAP creates a context that auto-reverts
useGSAP(() => {
  // All animations in here are automatically cleaned up
  gsap.to('.item', { opacity: 1 })
}, { scope: containerRef }) // Scopes selector to container
```

### Preventing Re-Animation on Route Return

```tsx
const hasAnimatedRef = useRef(false)

useGSAP(() => {
  if (hasAnimatedRef.current) {
    // Already animated, show immediately
    gsap.set('[data-reveal]', { opacity: 1, y: 0 })
    return
  }
  hasAnimatedRef.current = true

  // Run animation
  gsap.to('[data-reveal]', { opacity: 1, y: 0 })
}, { scope: containerRef })
```

---

## 3. GPU-Friendly Animation Properties

### Only Animate These Properties

```typescript
// ✅ COMPOSITOR-ONLY (GPU accelerated, no layout/paint)
const SAFE_PROPERTIES = {
  transform: true,     // translateX, translateY, scale, rotate
  opacity: true,
  // GSAP-specific
  x: true,             // → translateX
  y: true,             // → translateY
  scale: true,         // → scale()
  rotation: true,      // → rotate()
  autoAlpha: true,     // → opacity + visibility
}

// ❌ AVOID (triggers layout or paint)
const EXPENSIVE_PROPERTIES = {
  width: true,
  height: true,
  top: true,
  left: true,
  margin: true,
  padding: true,
  borderWidth: true,
  fontSize: true,
  lineHeight: true,
}
```

### GPU Acceleration Setup

```typescript
// Before animation starts
gsap.set(elements, {
  // Promote to own compositor layer
  willChange: 'transform, opacity',
  // Force 3D transform (creates layer)
  force3D: true,
  // Prevent back-face flicker
  backfaceVisibility: 'hidden',
})

// The animation
gsap.to(elements, {
  opacity: 1,
  y: 0,
  scale: 1,
  duration: 0.5,
  ease: 'power2.out',
  onComplete: () => {
    // CRITICAL: Remove will-change after animation
    // Keeping it causes memory pressure on mobile
    gsap.set(elements, {
      willChange: 'auto',
      clearProps: 'backfaceVisibility'
    })
  }
})
```

### GSAP-Specific Optimizations

```typescript
gsap.config({
  // Disable automatic unitless number conversion (micro-optimization)
  units: { x: 'px', y: 'px' }
})

// Use overwrite to prevent competing tweens
gsap.to(element, {
  opacity: 1,
  overwrite: 'auto', // Kills conflicting tweens on same properties
})

// For stagger animations, use 'from' direction wisely
gsap.to(items, {
  opacity: 1,
  stagger: {
    each: 0.05,
    from: 'start',  // Enter: left-to-right
    // from: 'end',  // Exit: right-to-left (reverse)
    ease: 'power2.inOut'
  }
})
```

### Avoiding Layout Thrash

```typescript
// ❌ BAD: Causes layout thrash (read-write-read-write)
items.forEach(item => {
  const rect = item.getBoundingClientRect() // READ
  gsap.set(item, { x: rect.width })         // WRITE
})

// ✅ GOOD: Batch reads, then batch writes
const rects = Array.from(items).map(item =>
  item.getBoundingClientRect()
)
items.forEach((item, i) => {
  gsap.set(item, { x: rects[i].width })
})
```

---

## 4. Video Readiness Coordination

### Video Ready States

```typescript
const VIDEO_READY_STATES = {
  HAVE_NOTHING: 0,       // No data
  HAVE_METADATA: 1,      // Duration known
  HAVE_CURRENT_DATA: 2,  // Current frame available ✓ Good enough
  HAVE_FUTURE_DATA: 3,   // Next frame available
  HAVE_ENOUGH_DATA: 4,   // Can play through ✓ Ideal
}
```

### Robust Video Ready Detection

```typescript
function waitForVideoReady(
  video: HTMLVideoElement,
  timeout = 3000
): Promise<void> {
  return new Promise((resolve) => {
    // Already ready?
    if (video.readyState >= 2) {
      resolve()
      return
    }

    let resolved = false
    const cleanup = () => {
      video.removeEventListener('loadeddata', onReady)
      video.removeEventListener('canplay', onReady)
      video.removeEventListener('canplaythrough', onReady)
    }

    const onReady = () => {
      if (resolved) return
      resolved = true
      cleanup()
      resolve()
    }

    // Multiple events for reliability
    video.addEventListener('loadeddata', onReady)
    video.addEventListener('canplay', onReady)
    video.addEventListener('canplaythrough', onReady)

    // Fallback timeout (mobile may not fire events reliably)
    setTimeout(() => {
      if (!resolved) {
        resolved = true
        cleanup()
        console.warn('Video ready timeout, proceeding anyway')
        resolve()
      }
    }, timeout)
  })
}
```

### requestVideoFrameCallback (Modern Browsers)

```typescript
function waitForFirstFrame(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    if ('requestVideoFrameCallback' in video) {
      // Modern API: fires when actual frame is painted
      (video as any).requestVideoFrameCallback(() => {
        resolve()
      })
    } else {
      // Fallback: wait for playing + small delay
      const onPlaying = () => {
        video.removeEventListener('playing', onPlaying)
        // Give decoder time to paint first frame
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve()
          })
        })
      }

      if (!video.paused) {
        onPlaying()
      } else {
        video.addEventListener('playing', onPlaying)
      }
    }
  })
}
```

### App-Level Video Ready Hook

```typescript
// useVideoReady.ts
import { useState, useEffect, useCallback, useRef } from 'react'

type VideoReadyOptions = {
  timeout?: number
  skipOnMobile?: boolean
}

export function useVideoReady(options: VideoReadyOptions = {}) {
  const { timeout = 2000, skipOnMobile = false } = options
  const [isReady, setIsReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Skip waiting on mobile (faster UX)
  useEffect(() => {
    if (skipOnMobile && window.innerWidth < 1024) {
      setIsReady(true)
    }
  }, [skipOnMobile])

  const registerVideo = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video

    if (!video) return

    const checkReady = () => {
      if (video.readyState >= 2) {
        clearTimeout(timeoutRef.current)
        setIsReady(true)
      }
    }

    // Check immediately
    checkReady()

    // Listen for events
    video.addEventListener('loadeddata', checkReady)
    video.addEventListener('canplay', checkReady)

    // Timeout fallback
    timeoutRef.current = setTimeout(() => {
      setIsReady(true)
    }, timeout)

    return () => {
      video.removeEventListener('loadeddata', checkReady)
      video.removeEventListener('canplay', checkReady)
      clearTimeout(timeoutRef.current)
    }
  }, [timeout])

  // Manual trigger (for Vimeo or external sources)
  const markReady = useCallback(() => {
    clearTimeout(timeoutRef.current)
    setIsReady(true)
  }, [])

  return { isReady, registerVideo, markReady }
}
```

---

## 5. Mobile Scroll Strategy

### CSS scroll-snap Best Practices

```css
/* Container */
.scroll-container {
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  /* Prevent overscroll bounce on iOS */
  overscroll-behavior: contain;
  /* Smooth momentum scrolling on iOS */
  -webkit-overflow-scrolling: touch;
}

/* Items */
.scroll-item {
  height: 100dvh;
  scroll-snap-align: start;
  /* Prevent item from causing horizontal scroll */
  max-width: 100vw;
  overflow: hidden;
}
```

### scroll-snap Pitfalls & Fixes

```typescript
// Problem 1: Snap can fight with programmatic scroll
// Solution: Temporarily disable snap during animations
function scrollToIndex(container: HTMLElement, index: number) {
  const item = container.children[index] as HTMLElement
  if (!item) return

  // Disable snap
  container.style.scrollSnapType = 'none'

  item.scrollIntoView({ behavior: 'smooth' })

  // Re-enable after scroll completes
  setTimeout(() => {
    container.style.scrollSnapType = 'y mandatory'
  }, 500)
}

// Problem 2: iOS Safari scroll position jumps
// Solution: Use scroll-padding for header offset
.scroll-container {
  scroll-padding-top: 112px; /* Header height */
}

// Problem 3: Scroll events fire too frequently
// Solution: Debounce with RAF
let rafId: number | null = null
function onScroll() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    // Handle scroll
    rafId = null
  })
}
```

### GSAP ScrollTrigger for Mobile

```typescript
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

// Mobile-optimized ScrollTrigger setup
ScrollTrigger.config({
  // Reduce scroll-linked recalculations
  ignoreMobileResize: true,
  // Use requestAnimationFrame instead of scroll events
  limitCallbacks: true,
})

// Per-section trigger
useGSAP(() => {
  const sections = gsap.utils.toArray('.section')

  sections.forEach((section, i) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      // Mobile: use intersection instead of scroll position
      // (more performant)
      toggleActions: 'play none none reverse',
      onEnter: () => {
        // Animate section in
        gsap.to(section.querySelector('.content'), {
          opacity: 1,
          y: 0,
          duration: 0.5
        })
      },
      onLeave: () => {
        // Animate section out
        gsap.to(section.querySelector('.content'), {
          opacity: 0,
          y: -20,
          duration: 0.3
        })
      },
      // Prevent pin issues on mobile
      anticipatePin: 1,
      // Refresh on resize
      invalidateOnRefresh: true,
    })
  })

  return () => {
    ScrollTrigger.getAll().forEach(st => st.kill())
  }
}, { scope: containerRef })
```

### Manual Scroll Detection (Your Current Approach)

```typescript
// Optimized scroll handler for mobile
function useScrollCenterDetection(
  containerRef: RefObject<HTMLElement>,
  itemSelector: string,
  onActiveChange: (index: number) => void
) {
  const activeIndexRef = useRef(0)
  const rafRef = useRef<number>()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const detectActive = () => {
      const items = container.querySelectorAll(itemSelector)
      const viewportCenter = window.innerHeight / 2

      let closestIndex = 0
      let closestDistance = Infinity

      items.forEach((item, i) => {
        const rect = item.getBoundingClientRect()
        const itemCenter = rect.top + rect.height / 2
        const distance = Math.abs(itemCenter - viewportCenter)

        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = i
        }
      })

      // Only trigger if changed
      if (closestIndex !== activeIndexRef.current) {
        activeIndexRef.current = closestIndex
        onActiveChange(closestIndex)
      }
    }

    const onScroll = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        detectActive()
        rafRef.current = undefined
      })
    }

    // Use passive listener for better scroll performance
    container.addEventListener('scroll', onScroll, { passive: true })

    // Initial detection
    detectActive()

    return () => {
      container.removeEventListener('scroll', onScroll)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [containerRef, itemSelector, onActiveChange])
}
```

---

## 6. Video Performance for Mobile

### Only One Video Playing at a Time

```typescript
// VideoManager: Global singleton to manage video playback
class VideoManager {
  private activeVideo: HTMLVideoElement | null = null
  private preloadedVideo: HTMLVideoElement | null = null

  play(video: HTMLVideoElement) {
    // Pause current
    if (this.activeVideo && this.activeVideo !== video) {
      this.activeVideo.pause()
    }

    this.activeVideo = video
    video.play().catch(() => {
      // Autoplay blocked, show poster
    })
  }

  preload(video: HTMLVideoElement) {
    // Preload next video's metadata
    this.preloadedVideo = video
    video.preload = 'metadata'
    video.load()
  }

  pauseAll() {
    this.activeVideo?.pause()
    this.preloadedVideo?.pause()
  }
}

export const videoManager = new VideoManager()
```

### IntersectionObserver for Video Control

```typescript
function useVideoVisibility(
  videoRef: RefObject<HTMLVideoElement>,
  options: { threshold?: number; rootMargin?: string } = {}
) {
  const { threshold = 0.5, rootMargin = '0px' } = options

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Visible: play
          video.play().catch(() => {})
        } else {
          // Hidden: pause to save resources
          video.pause()
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [videoRef, threshold, rootMargin])
}
```

### Reduced Motion / Low Power Fallback

```typescript
function shouldReduceVideo(): boolean {
  // User prefers reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true
  }

  // Low power mode detection (iOS Safari)
  // Note: Not directly detectable, but can infer from:
  // - Battery level < 20%
  // - Video decode failures

  // Connection type (if available)
  const connection = (navigator as any).connection
  if (connection) {
    // Slow connection: use poster only
    if (connection.saveData) return true
    if (connection.effectiveType === '2g') return true
    if (connection.effectiveType === 'slow-2g') return true
  }

  return false
}

// Usage in component
function BackgroundVideo({ src, poster }) {
  const [useStaticPoster, setUseStaticPoster] = useState(false)

  useEffect(() => {
    if (shouldReduceVideo()) {
      setUseStaticPoster(true)
    }
  }, [])

  if (useStaticPoster) {
    return <img src={poster} className="object-cover w-full h-full" />
  }

  return <video src={src} poster={poster} autoPlay muted loop playsInline />
}
```

### Video Encoding Recommendations

```
Format: H.264 (MP4) - best mobile compatibility
Resolution:
  - Mobile: 720p max (1280x720)
  - Desktop: 1080p (1920x1080)
Bitrate:
  - Mobile: 1-2 Mbps
  - Desktop: 4-6 Mbps
Frame rate: 24-30fps (not 60fps - too heavy for mobile decode)
Audio: Remove if muted (saves bandwidth)
Duration: < 15 seconds loops preferred (less memory)

FFmpeg command for mobile-optimized video:
ffmpeg -i input.mov -c:v libx264 -preset slow -crf 23 \
  -vf "scale=720:-2" -an -movflags +faststart output.mp4
```

### Video Loading Patterns

```typescript
// preload attribute behavior:
// "none"     - Don't preload anything (good for many videos)
// "metadata" - Load duration, dimensions only (recommended default)
// "auto"     - Browser decides (can be aggressive on WiFi)

// For scroll-based video galleries:
<video
  preload="metadata"  // Load just enough to show poster
  poster={posterUrl}  // Always provide poster
  playsInline         // Required for iOS inline playback
  muted               // Required for autoplay
  loop
/>

// When video becomes visible:
video.preload = 'auto'
video.load() // iOS Safari needs explicit load()
video.play()
```

### Never Toggle display:none

```typescript
// ❌ BAD: Causes video to unload and reload
video.style.display = isVisible ? 'block' : 'none'

// ✅ GOOD: Use opacity/visibility
video.style.opacity = isVisible ? '1' : '0'
video.style.visibility = isVisible ? 'visible' : 'hidden'
// Or with GSAP:
gsap.to(video, { autoAlpha: isVisible ? 1 : 0 })

// ✅ ALSO GOOD: Use CSS classes
video.classList.toggle('hidden', !isVisible)
// .hidden { opacity: 0; pointer-events: none; }
```

---

## 7. Exit Animation on Navigation

### Prevent Glitchy Exit

```typescript
// Problem: Component unmounts before animation finishes
// Solution: Block navigation until exit animation completes

import { useRouter } from 'next/navigation'
import { useCallback, useRef } from 'react'
import { gsap } from 'gsap'

function useFadeOutNavigation(containerRef: RefObject<HTMLElement>) {
  const router = useRouter()
  const isNavigatingRef = useRef(false)

  const navigate = useCallback((url: string) => {
    // Prevent double-navigation
    if (isNavigatingRef.current) return
    isNavigatingRef.current = true

    const container = containerRef.current
    if (!container) {
      router.push(url)
      return
    }

    // Disable interactions during animation
    container.style.pointerEvents = 'none'

    const items = container.querySelectorAll('[data-reveal]')

    // Exit animation
    gsap.to(items, {
      opacity: 0,
      y: -20,
      scale: 0.95,
      duration: 0.4,
      ease: 'power2.in',
      stagger: {
        each: 0.03,
        from: 'end',  // Reverse order for exit
      },
      onComplete: () => {
        // Navigate after animation
        router.push(url)
      }
    })

    // Safety timeout: navigate even if animation fails
    setTimeout(() => {
      if (isNavigatingRef.current) {
        router.push(url)
      }
    }, 600)
  }, [router, containerRef])

  return navigate
}
```

### Prevent Concurrent Enter/Exit

```typescript
// Global animation state manager
const animationState = {
  current: null as gsap.core.Timeline | null,
  isAnimating: false,
}

function runEnterAnimation(items: Element[]) {
  // Kill any existing animation
  if (animationState.current) {
    animationState.current.kill()
  }

  animationState.isAnimating = true
  animationState.current = gsap.timeline({
    onComplete: () => {
      animationState.isAnimating = false
      animationState.current = null
    }
  })

  animationState.current.fromTo(items,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, stagger: 0.05 }
  )

  return animationState.current
}

function runExitAnimation(items: Element[]) {
  // Don't start exit if enter is still running
  if (animationState.isAnimating && animationState.current) {
    // Fast-forward enter animation
    animationState.current.progress(1)
  }

  animationState.isAnimating = true
  animationState.current = gsap.timeline({
    onComplete: () => {
      animationState.isAnimating = false
      animationState.current = null
    }
  })

  animationState.current.to(items, {
    opacity: 0,
    y: -20,
    stagger: { each: 0.03, from: 'end' }
  })

  return animationState.current
}
```

---

## 8. Code Examples

### Reusable Section Component

```tsx
// components/VideoSection.tsx
'use client'

import { useRef, useLayoutEffect, useCallback, useState, useEffect } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

type VideoSectionProps = {
  videoSrc: string
  posterSrc: string
  title: string
  subtitle?: string
  isActive?: boolean
  onVideoReady?: () => void
}

export function VideoSection({
  videoSrc,
  posterSrc,
  title,
  subtitle,
  isActive = false,
  onVideoReady,
}: VideoSectionProps) {
  const containerRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [videoReady, setVideoReady] = useState(false)
  const hasAnimatedRef = useRef(false)
  const isMobileRef = useRef(false)

  // Detect mobile once
  useEffect(() => {
    isMobileRef.current = window.innerWidth < 1024
  }, [])

  // FOUC prevention: set initial states synchronously
  useLayoutEffect(() => {
    if (!contentRef.current) return
    const items = contentRef.current.querySelectorAll('[data-reveal]')
    gsap.set(items, {
      opacity: 0,
      y: 20,
      willChange: 'transform, opacity',
      force3D: true
    })
  }, [])

  // Video ready detection
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleReady = () => {
      setVideoReady(true)
      onVideoReady?.()
    }

    // Check if already ready
    if (video.readyState >= 2) {
      handleReady()
      return
    }

    video.addEventListener('loadeddata', handleReady)
    video.addEventListener('canplay', handleReady)

    // Timeout fallback
    const timeout = setTimeout(handleReady, 2000)

    return () => {
      video.removeEventListener('loadeddata', handleReady)
      video.removeEventListener('canplay', handleReady)
      clearTimeout(timeout)
    }
  }, [onVideoReady])

  // Video play/pause based on active state
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isActive) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [isActive])

  // Enter animation - waits for video on desktop
  useGSAP(() => {
    if (!contentRef.current || hasAnimatedRef.current) return
    if (!isActive) return

    const shouldWait = !isMobileRef.current && !videoReady
    if (shouldWait) return

    hasAnimatedRef.current = true
    const items = contentRef.current.querySelectorAll('[data-reveal]')

    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
      stagger: isMobileRef.current ? 0 : 0.08,
      onComplete: () => {
        gsap.set(items, { willChange: 'auto' })
      }
    })
  }, {
    scope: containerRef,
    dependencies: [isActive, videoReady]
  })

  return (
    <section
      ref={containerRef}
      className="relative h-dvh w-full overflow-hidden snap-start"
    >
      {/* Video Layer */}
      <div className="absolute inset-0 -z-10">
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Content Layer */}
      <div
        ref={contentRef}
        className="relative h-full flex flex-col items-center justify-center text-white"
      >
        <h2
          data-reveal
          style={{ opacity: 0, transform: 'translateY(20px)' }}
          className="text-4xl md:text-6xl font-bold"
        >
          {title}
        </h2>
        {subtitle && (
          <p
            data-reveal
            style={{ opacity: 0, transform: 'translateY(20px)' }}
            className="mt-4 text-xl opacity-80"
          >
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
```

### Global Scroll Orchestrator

```tsx
// components/SectionOrchestrator.tsx
'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { VideoSection } from './VideoSection'

type SectionData = {
  id: string
  videoSrc: string
  posterSrc: string
  title: string
  subtitle?: string
}

type Props = {
  sections: SectionData[]
}

export function SectionOrchestrator({ sections }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [readySections, setReadySections] = useState<Set<number>>(new Set())
  const rafRef = useRef<number>()

  // Detect active section on scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const detectActive = () => {
      const viewportCenter = window.innerHeight / 2
      const items = container.children

      let closestIndex = 0
      let closestDistance = Infinity

      Array.from(items).forEach((item, i) => {
        const rect = item.getBoundingClientRect()
        const itemCenter = rect.top + rect.height / 2
        const distance = Math.abs(itemCenter - viewportCenter)

        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = i
        }
      })

      if (closestIndex !== activeIndex) {
        setActiveIndex(closestIndex)
      }
    }

    const onScroll = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        detectActive()
        rafRef.current = undefined
      })
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    detectActive() // Initial

    return () => {
      container.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [activeIndex])

  // Pre-warm next section
  useEffect(() => {
    const nextIndex = activeIndex + 1
    if (nextIndex < sections.length && !readySections.has(nextIndex)) {
      // Preload next section's video poster
      const img = new Image()
      img.src = sections[nextIndex].posterSrc
    }
  }, [activeIndex, sections, readySections])

  const handleVideoReady = useCallback((index: number) => {
    setReadySections(prev => new Set([...prev, index]))
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-dvh overflow-y-auto snap-y snap-mandatory overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {sections.map((section, index) => (
        <VideoSection
          key={section.id}
          videoSrc={section.videoSrc}
          posterSrc={section.posterSrc}
          title={section.title}
          subtitle={section.subtitle}
          isActive={index === activeIndex}
          onVideoReady={() => handleVideoReady(index)}
        />
      ))}
    </div>
  )
}
```

---

## 9. Prioritized Fix Plan

### Quick Fixes (1-2 Hours) - Likely Removes Glitch

These changes have the highest impact-to-effort ratio:

1. **Add `useLayoutEffect` for initial states**
   - Files: `useRevealAnimation.ts`, `useSequencedReveal.ts`, page components
   - Change: Move `gsap.set()` calls from `useGSAP` to `useLayoutEffect`
   - Why: Prevents flash by setting state before first paint

2. **Ensure inline styles on all `[data-reveal]` elements**
   - Files: All components with reveal animations
   - Change: Add `style={{ opacity: 0, transform: 'translateY(20px)' }}`
   - Why: SSR/hydration safety net

3. **Add GPU hints before animations**
   ```typescript
   gsap.set(items, { willChange: 'transform, opacity', force3D: true })
   ```
   - Why: Promotes elements to compositor layer

4. **Clean up `will-change` after animations**
   ```typescript
   onComplete: () => gsap.set(items, { willChange: 'auto' })
   ```
   - Why: Reduces mobile memory pressure

5. **Simplify mobile animations**
   - Remove stagger on mobile (set `stagger: 0`)
   - Reduce duration on mobile (0.4s instead of 0.6s)
   - Why: Less GPU work on constrained devices

### Medium Fixes (1 Day) - Stability Improvements

6. **Pause offscreen videos with IntersectionObserver**
   - Create `useVideoVisibility` hook (see Section 6)
   - Apply to all `<video>` elements
   - Why: Reduces decode overhead

7. **Single video manager**
   - Implement `VideoManager` singleton (see Section 6)
   - Ensure only 1 video plays at a time on mobile
   - Why: Mobile can only decode 1-2 videos simultaneously

8. **Preload strategy**
   - Preload next section's poster image
   - Set `preload="metadata"` on non-active videos
   - Why: Smoother transitions

9. **Scroll debouncing**
   - Ensure all scroll handlers use `requestAnimationFrame`
   - Add `{ passive: true }` to all scroll listeners
   - Why: Prevents main thread blocking

10. **Animation conflict prevention**
    - Add `overwrite: 'auto'` to all GSAP tweens
    - Track animation state globally to prevent concurrent enter/exit
    - Why: Prevents "fighting" animations

### Deeper Fixes (2-3 Days) - Architectural

11. **Re-encode videos for mobile**
    - Create mobile-specific versions (720p, 1-2 Mbps)
    - Serve based on viewport/connection
    - Why: Reduce decode overhead significantly

12. **Single persistent video with crossfade**
    - Instead of multiple `<video>` elements, use single video
    - Crossfade using canvas or CSS filters
    - Why: Most performant, but requires architecture change

13. **Consider Vimeo for all videos**
    - Vimeo handles adaptive bitrate, mobile optimization
    - Your existing `useVimeoController` already handles this well
    - Why: Offload video complexity to CDN

14. **Implement virtual scrolling**
    - Only render visible sections + 1 buffer
    - Use `react-window` or custom implementation
    - Why: Reduces DOM nodes and memory

15. **Service Worker video caching**
    - Cache video segments for faster replay
    - Requires careful cache management
    - Why: Eliminates network latency on revisit

---

## Summary Checklist

Before deploying mobile optimizations, verify:

- [ ] All `[data-reveal]` elements have inline `style` attributes
- [ ] Initial GSAP states set in `useLayoutEffect`, not `useEffect`
- [ ] `will-change` added before animation, removed after
- [ ] Only `transform` and `opacity` animated (no layout properties)
- [ ] Offscreen videos paused via IntersectionObserver
- [ ] Only 1 video actively playing at a time
- [ ] Scroll handlers use `requestAnimationFrame` and `passive: true`
- [ ] Animation durations reduced on mobile (< 0.5s)
- [ ] No stagger on mobile (or very small: 0.02s)
- [ ] Exit animations complete before navigation
- [ ] Videos have `playsInline muted` attributes
- [ ] Poster images provided for all videos
- [ ] `preload="metadata"` on non-visible videos

---

## 10. YOUR SPECIFIC LAYOUT THRASHING ISSUES (CRITICAL)

Based on Safari DevTools analysis showing 76ms composite, 24ms JS, and constant style invalidation/forced layout, here are the **specific culprits** found in your codebase:

### 10.1 Issue #1: Mobile Scroll Detection with Layout Reads (CRITICAL - FIX FIRST)

**Files:**
- `ProjectsLandingClient.tsx` (Lines 158-214)
- `DirectorsClient.tsx` (Lines 137-184)

**The Problem:**
```typescript
// Your current code - calls getBoundingClientRect() in a LOOP on every scroll
const findCenteredItem = () => {
  const containerRect = container.getBoundingClientRect()  // 1st LAYOUT READ
  const centerY = containerRect.top + containerRect.height / 2

  items.forEach((item, index) => {
    const rect = item.getBoundingClientRect()  // LAYOUT READ IN LOOP! 🚨
    const itemCenterY = rect.top + rect.height / 2
    // ...
  })
}

const handleScroll = () => {
  requestAnimationFrame(findCenteredItem)  // Runs 60x per second on scroll
}
```

**Why This Kills Performance:**
- `getBoundingClientRect()` forces synchronous layout calculation
- Called **inside a loop** for every item on the page
- Runs **60+ times per second** during scroll
- Safari must stop, recalculate entire layout, then continue
- This is the #1 reason for your 76ms composite spikes

**THE FIX:**

```typescript
// OPTIMIZED: Use IntersectionObserver instead of getBoundingClientRect in scroll loop

function useCenteredItemDetection(
  containerRef: RefObject<HTMLElement>,
  itemSelector: string,
  onActiveChange: (index: number) => void
) {
  const activeIndexRef = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const items = container.querySelectorAll(itemSelector)
    if (!items.length) return

    // Use IntersectionObserver - NO LAYOUT READS during scroll!
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry closest to center (highest intersection ratio)
        let maxRatio = 0
        let activeIndex = activeIndexRef.current

        entries.forEach((entry) => {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio
            activeIndex = Array.from(items).indexOf(entry.target as Element)
          }
        })

        if (activeIndex !== activeIndexRef.current && maxRatio > 0.5) {
          activeIndexRef.current = activeIndex
          onActiveChange(activeIndex)
        }
      },
      {
        root: container,
        rootMargin: '-40% 0px -40% 0px', // Detect when item crosses center 20%
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    items.forEach((item) => observer.observe(item))

    return () => observer.disconnect()
  }, [containerRef, itemSelector, onActiveChange])
}
```

**Alternative: Batch Layout Reads (if IntersectionObserver won't work)**

```typescript
// If you MUST use getBoundingClientRect, batch ALL reads first
const findCenteredItem = () => {
  const container = containerRef.current
  if (!container) return

  const items = container.querySelectorAll('[data-mobile-reveal]')

  // BATCH ALL READS FIRST - single layout calculation
  const containerRect = container.getBoundingClientRect()
  const rects = Array.from(items).map(item => item.getBoundingClientRect())

  // THEN do all calculations - NO more layout reads
  const centerY = containerRect.top + containerRect.height / 2

  let closest = 0
  let minDistance = Infinity

  rects.forEach((rect, index) => {
    const itemCenterY = rect.top + rect.height / 2
    const distance = Math.abs(itemCenterY - centerY)
    if (distance < minDistance) {
      minDistance = distance
      closest = index
    }
  })

  if (closest !== activeIndexRef.current) {
    activeIndexRef.current = closest
    onActiveChange(closest)
  }
}

// THROTTLE scroll handler more aggressively
let scrollTimeout: NodeJS.Timeout | null = null
const handleScroll = () => {
  if (scrollTimeout) return
  scrollTimeout = setTimeout(() => {
    scrollTimeout = null
    requestAnimationFrame(findCenteredItem)
  }, 100) // Only run every 100ms, not 60fps
}
```

---

### 10.2 Issue #2: Direct Style Manipulation (Bypasses Batching)

**Files:**
- `ProjectsLandingClient.tsx` (Lines 141-148)
- `DirectorsClient.tsx` (Lines 118-127)

**The Problem:**
```typescript
// Your current code - direct style writes force immediate reflow
mobileItems.forEach((item) => {
  const el = item as HTMLElement
  el.style.opacity = '1'      // WRITE - forces style recalc
  el.style.transform = 'none' // WRITE - forces reflow
})
```

**THE FIX:**

```typescript
// Option 1: Use GSAP to batch all style changes
gsap.set(mobileItems, {
  opacity: 1,
  clearProps: 'transform' // Removes transform entirely
})

// Option 2: Use CSS classes (browser optimizes batch)
mobileItems.forEach((item) => {
  item.classList.add('revealed')
})
// CSS: .revealed { opacity: 1; transform: none; }

// Option 3: Use cssText for single reflow
mobileItems.forEach((item) => {
  (item as HTMLElement).style.cssText = 'opacity: 1; transform: none;'
})
```

---

### 10.3 Issue #3: Animation Stagger Paint Flushes

**File:** `useSequencedReveal.ts` (Lines 78-113)

**The Problem:**
```typescript
// Two sequential GSAP operations cause paint flush between them
gsap.set(items, { willChange: 'transform, opacity', ... }) // Operation 1
// Paint flush happens here ⬇️
timelineRef.current.to(items, { opacity: 1, y: 0, ... })   // Operation 2
```

**THE FIX:**

```typescript
// Combine into single timeline operation
const tl = gsap.timeline()

tl.set(items, {
  willChange: 'transform, opacity',
  backfaceVisibility: 'hidden',
  force3D: true,
})
  .to(items, {
    ...to,
    duration,
    stagger,
    onComplete: () => {
      gsap.set(items, { willChange: 'auto' })
    }
  }, '<') // '<' means start at same time as previous

// Or use .fromTo() which is atomic
gsap.fromTo(items,
  { opacity: 0, y: 20, scale: 0.98 },
  {
    opacity: 1, y: 0, scale: 1,
    duration: 0.6,
    stagger: 0.08,
    force3D: true,
    onStart: () => {
      gsap.set(items, { willChange: 'transform, opacity' })
    },
    onComplete: () => {
      gsap.set(items, { willChange: 'auto', clearProps: 'force3D' })
    }
  }
)
```

---

### 10.4 Issue #4: useLayoutEffect Forcing Early Layout

**File:** `ControlsDesktop.tsx` (Lines 51-57)

**The Problem:**
```typescript
useLayoutEffect(() => {
  const items = containerRef.current.querySelectorAll('[data-reveal]')
  gsap.set(items, { opacity: 0, y: 20, scale: 0.98 }) // Forces layout before paint
}, [])
```

**THE FIX:**

Already have inline styles on elements, so this is redundant. Remove it:

```typescript
// DELETE this useLayoutEffect entirely
// Your inline styles already handle initial state:
// style={{ opacity: 0, transform: 'translateY(20px) scale(0.98)' }}

// If you need it, move to useEffect (after paint)
useEffect(() => {
  // This runs after paint, doesn't block rendering
  const items = containerRef.current?.querySelectorAll('[data-reveal]')
  if (items) {
    gsap.set(items, { willChange: 'transform, opacity', force3D: true })
  }
}, [])
```

---

### 10.5 Quick Performance Test

After making changes, run this in Safari console to verify:

```javascript
// Before/after comparison - run during scroll
let layoutCount = 0
const originalGetBCR = Element.prototype.getBoundingClientRect
Element.prototype.getBoundingClientRect = function() {
  layoutCount++
  return originalGetBCR.call(this)
}

// Scroll for 5 seconds, then check:
setTimeout(() => {
  console.log('getBoundingClientRect calls during scroll:', layoutCount)
  Element.prototype.getBoundingClientRect = originalGetBCR
}, 5000)

// BEFORE fix: probably 500+ calls
// AFTER fix: should be 0 (using IntersectionObserver)
```

---

### 10.6 Expected Impact

| Fix | Expected Improvement |
|-----|---------------------|
| IntersectionObserver for scroll | 76ms composite → ~16ms (4.7x faster) |
| Batched style writes | Eliminates "styles invalidated" |
| Single GSAP operation | Eliminates paint flushes between animations |
| Remove redundant useLayoutEffect | Faster first paint |

**Total expected improvement: 60-80% reduction in layout/paint time**

---

## 11. Mobile Video Autoplay (CRITICAL)

This section addresses the most common and frustrating mobile issue: videos that don't autoplay, show the native play button, or display the crossed-out play icon.

### 11.1 Understanding Mobile Autoplay Policies

#### iOS Safari (Most Restrictive)

| Condition | Autoplay Allowed? | Notes |
|-----------|-------------------|-------|
| `muted` + `playsInline` | ✅ Yes | Both required |
| `muted` only | ❌ No | Will show native controls |
| `playsInline` only | ❌ No | Will show native controls |
| Neither | ❌ No | Opens fullscreen player |
| Low Power Mode | ⚠️ Maybe | May be blocked silently |
| Background tab | ❌ No | Paused automatically |
| Data Saver enabled | ⚠️ Maybe | May block preload |

**iOS Safari Specifics:**
- `playsInline` attribute is **mandatory** for inline playback (without it, video opens fullscreen)
- Even with correct attributes, iOS may block autoplay if:
  - Device is in Low Power Mode
  - Page loaded in background
  - Too many videos on page (resource constraints)
  - Video has an audio track (even if muted via attribute)
- Safari ignores `preload="auto"` and uses its own heuristics

#### Chrome on iOS

Chrome on iOS uses **WebKit** (not Chromium), so it follows iOS Safari rules exactly. There's no difference in autoplay behavior.

#### Android Chrome

| Condition | Autoplay Allowed? | Notes |
|-----------|-------------------|-------|
| `muted` | ✅ Yes | `playsInline` not strictly required |
| Data Saver enabled | ❌ No | Blocks all video loading |
| Background tab | ❌ No | Paused automatically |
| Lite Mode | ❌ No | Videos replaced with placeholder |

**Android Chrome Specifics:**
- More lenient than iOS
- `playsInline` helps but isn't always required
- Data Saver mode is more aggressive than iOS
- Hardware decoder limitations vary by device

#### The "Crossed Play Icon" Explained

When you see a play button with a line through it (⃠), it means:

| Symptom | Likely Cause |
|---------|--------------|
| Crossed play icon on load | Autoplay blocked by browser policy |
| Crossed icon after play() | play() promise rejected |
| Native controls appearing | `playsInline` missing or video has audio |
| Black screen with spinner | Video cannot decode (codec/resolution) |
| Poster visible, no playback | `preload` blocked or src not loaded |

### 10.2 Implementation Checklist

#### Required HTML Attributes

```html
<!-- ✅ CORRECT: All required attributes -->
<video
  muted
  playsInline
  autoPlay
  loop
  preload="metadata"
  poster="/path/to/poster.jpg"
>
  <source src="/path/to/video.mp4" type="video/mp4" />
</video>

<!-- ❌ WRONG: Missing playsInline -->
<video muted autoPlay loop>
  <source src="/path/to/video.mp4" type="video/mp4" />
</video>
```

#### Required JavaScript Setup

```typescript
// CRITICAL: Set these properties in JS before calling play()
// Some browsers ignore HTML attributes but respect JS properties

function prepareVideoForAutoplay(video: HTMLVideoElement) {
  // 1. Ensure muted (most important)
  video.muted = true

  // 2. Ensure playsInline
  video.playsInline = true
  // Also set the attribute (some browsers check both)
  video.setAttribute('playsinline', '')
  video.setAttribute('webkit-playsinline', '') // Legacy iOS

  // 3. Remove any audio tracks if possible
  // (Videos with audio tracks are more likely to be blocked)

  // 4. Ensure preload is set
  video.preload = 'auto'
}
```

#### Attribute Priority Order

```typescript
// Order matters! Apply in this sequence:
video.muted = true           // 1st: Enables autoplay eligibility
video.playsInline = true     // 2nd: Prevents fullscreen hijack
video.preload = 'auto'       // 3rd: Starts loading
video.src = videoUrl         // 4th: Set source AFTER attributes
video.load()                 // 5th: Explicit load (iOS Safari)
video.play()                 // 6th: Attempt playback
```

### 10.3 Safe Play Helper Function

```typescript
type PlayResult = {
  success: boolean
  reason?: 'blocked' | 'not-allowed' | 'not-supported' | 'abort' | 'unknown'
  error?: Error
}

async function safePlay(video: HTMLVideoElement): Promise<PlayResult> {
  // Step 1: Ensure video is properly configured
  video.muted = true
  video.playsInline = true
  video.setAttribute('playsinline', '')
  video.setAttribute('webkit-playsinline', '')

  // Step 2: Check if video has data to play
  if (video.readyState < 2) { // HAVE_CURRENT_DATA
    // Wait for enough data, but with timeout
    await new Promise<void>((resolve) => {
      const onReady = () => {
        video.removeEventListener('loadeddata', onReady)
        video.removeEventListener('canplay', onReady)
        resolve()
      }
      video.addEventListener('loadeddata', onReady)
      video.addEventListener('canplay', onReady)

      // Force load on iOS Safari
      video.load()

      // Timeout after 3 seconds
      setTimeout(resolve, 3000)
    })
  }

  // Step 3: Attempt to play
  try {
    const playPromise = video.play()

    if (playPromise !== undefined) {
      await playPromise
      return { success: true }
    }

    // Legacy browsers don't return promise
    return { success: !video.paused }
  } catch (error) {
    const err = error as Error

    // Categorize the error
    if (err.name === 'NotAllowedError') {
      // Autoplay blocked by browser policy
      return { success: false, reason: 'not-allowed', error: err }
    }
    if (err.name === 'NotSupportedError') {
      // Codec or format not supported
      return { success: false, reason: 'not-supported', error: err }
    }
    if (err.name === 'AbortError') {
      // Play was interrupted (e.g., by load())
      return { success: false, reason: 'abort', error: err }
    }

    return { success: false, reason: 'unknown', error: err }
  }
}

// Usage:
const result = await safePlay(videoElement)
if (!result.success) {
  console.log('Autoplay blocked:', result.reason)
  // Show fallback (poster image or tap-to-play UI)
}
```

### 10.4 First User Gesture Unlock

iOS requires a user gesture to "unlock" video playback. Once unlocked, subsequent play() calls work without gestures.

```typescript
// Global state to track if video is unlocked
let videoUnlocked = false

function setupVideoUnlock() {
  if (videoUnlocked) return

  const unlockVideo = async () => {
    if (videoUnlocked) return

    // Find all videos on the page
    const videos = document.querySelectorAll('video')

    // Try to play each one briefly
    for (const video of videos) {
      try {
        video.muted = true
        video.playsInline = true

        // Play and immediately pause to "unlock"
        await video.play()
        // Don't pause - let it continue if it's the active video

        videoUnlocked = true
        console.log('✅ Video playback unlocked')
      } catch (e) {
        // Ignore errors - some videos may not be ready
      }
    }

    // Remove listeners once unlocked
    if (videoUnlocked) {
      document.removeEventListener('touchstart', unlockVideo)
      document.removeEventListener('touchend', unlockVideo)
      document.removeEventListener('click', unlockVideo)
      document.removeEventListener('scroll', unlockVideo)
    }
  }

  // Listen for ANY user interaction
  document.addEventListener('touchstart', unlockVideo, { once: false, passive: true })
  document.addEventListener('touchend', unlockVideo, { once: false, passive: true })
  document.addEventListener('click', unlockVideo, { once: false, passive: true })
  document.addEventListener('scroll', unlockVideo, { once: false, passive: true })
}

// Call on app mount
if (typeof window !== 'undefined') {
  setupVideoUnlock()
}
```

#### React Hook for User Gesture Unlock

```typescript
// useVideoUnlock.ts
import { useEffect, useRef, useCallback } from 'react'

export function useVideoUnlock() {
  const unlockedRef = useRef(false)
  const videosToUnlockRef = useRef<Set<HTMLVideoElement>>(new Set())

  const registerVideo = useCallback((video: HTMLVideoElement | null) => {
    if (video) {
      videosToUnlockRef.current.add(video)
    }
  }, [])

  const unregisterVideo = useCallback((video: HTMLVideoElement | null) => {
    if (video) {
      videosToUnlockRef.current.delete(video)
    }
  }, [])

  useEffect(() => {
    if (unlockedRef.current) return

    const attemptUnlock = async () => {
      if (unlockedRef.current) return

      const videos = videosToUnlockRef.current
      for (const video of videos) {
        try {
          video.muted = true
          video.playsInline = true
          await video.play()
          unlockedRef.current = true
          break
        } catch (e) {
          // Continue to next video
        }
      }
    }

    const events = ['touchstart', 'touchend', 'click', 'scroll']
    events.forEach(event => {
      document.addEventListener(event, attemptUnlock, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, attemptUnlock)
      })
    }
  }, [])

  return { registerVideo, unregisterVideo, isUnlocked: unlockedRef.current }
}
```

### 10.5 Detecting and Handling Blocked Playback

```typescript
// Comprehensive playback monitor
function monitorVideoPlayback(video: HTMLVideoElement, callbacks: {
  onPlaying?: () => void
  onBlocked?: (reason: string) => void
  onError?: (error: Error) => void
  onStalled?: () => void
}) {
  let playAttempted = false
  let isPlaying = false

  // Track when we attempt to play
  const originalPlay = video.play.bind(video)
  video.play = async () => {
    playAttempted = true
    try {
      await originalPlay()
    } catch (e) {
      callbacks.onBlocked?.((e as Error).name)
      throw e
    }
    return Promise.resolve()
  }

  // Event listeners
  const onPlay = () => {
    console.log('🎬 Video: play event')
  }

  const onPlaying = () => {
    console.log('▶️ Video: playing event')
    isPlaying = true
    callbacks.onPlaying?.()
  }

  const onPause = () => {
    console.log('⏸️ Video: pause event')
    isPlaying = false

    // If we tried to play but got paused immediately, autoplay was blocked
    if (playAttempted && !video.ended) {
      setTimeout(() => {
        if (video.paused && !video.ended) {
          callbacks.onBlocked?.('paused-after-play')
        }
      }, 100)
    }
  }

  const onWaiting = () => {
    console.log('⏳ Video: waiting event (buffering)')
  }

  const onStalled = () => {
    console.log('🚫 Video: stalled event')
    callbacks.onStalled?.()
  }

  const onError = () => {
    console.log('❌ Video: error event', video.error)
    callbacks.onError?.(new Error(video.error?.message || 'Unknown video error'))
  }

  const onSuspend = () => {
    console.log('💤 Video: suspend event (download paused)')
  }

  // Attach listeners
  video.addEventListener('play', onPlay)
  video.addEventListener('playing', onPlaying)
  video.addEventListener('pause', onPause)
  video.addEventListener('waiting', onWaiting)
  video.addEventListener('stalled', onStalled)
  video.addEventListener('error', onError)
  video.addEventListener('suspend', onSuspend)

  // Return cleanup function
  return () => {
    video.removeEventListener('play', onPlay)
    video.removeEventListener('playing', onPlaying)
    video.removeEventListener('pause', onPause)
    video.removeEventListener('waiting', onWaiting)
    video.removeEventListener('stalled', onStalled)
    video.removeEventListener('error', onError)
    video.removeEventListener('suspend', onSuspend)
  }
}
```

#### Verifying Actual Playback

```typescript
// play() promise resolving doesn't guarantee visible playback!
// Use this to confirm video is actually playing

async function verifyPlayback(video: HTMLVideoElement, timeoutMs = 2000): Promise<boolean> {
  // Check 1: Not paused
  if (video.paused) return false

  // Check 2: Has enough data
  if (video.readyState < 2) return false

  // Check 3: Time is progressing
  const startTime = video.currentTime

  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (video.currentTime > startTime) {
        clearInterval(checkInterval)
        resolve(true)
      }
    }, 100)

    setTimeout(() => {
      clearInterval(checkInterval)
      resolve(video.currentTime > startTime)
    }, timeoutMs)
  })
}

// Usage:
await safePlay(video)
const actuallyPlaying = await verifyPlayback(video)
if (!actuallyPlaying) {
  showFallbackUI()
}
```

### 10.6 Fallback Strategies

#### Strategy 1: Poster with Tap-to-Play

```tsx
function BackgroundVideoWithFallback({
  src,
  poster,
  onPlaybackStart
}: {
  src: string
  poster: string
  onPlaybackStart?: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'loading' | 'playing' | 'blocked'>('loading')

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const tryAutoplay = async () => {
      const result = await safePlay(video)

      if (result.success) {
        // Verify it's actually playing
        const playing = await verifyPlayback(video)
        if (playing) {
          setStatus('playing')
          onPlaybackStart?.()
        } else {
          setStatus('blocked')
        }
      } else {
        setStatus('blocked')
      }
    }

    tryAutoplay()
  }, [onPlaybackStart])

  const handleTapToPlay = async () => {
    const video = videoRef.current
    if (!video) return

    const result = await safePlay(video)
    if (result.success) {
      setStatus('playing')
      onPlaybackStart?.()
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* Video element - always present but may be invisible */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        loop
        preload="auto"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          status === 'playing' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Poster fallback with tap-to-play */}
      {status === 'blocked' && (
        <button
          onClick={handleTapToPlay}
          className="absolute inset-0 w-full h-full cursor-pointer group"
          aria-label="Tap to play video"
        >
          <img
            src={poster}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      )}

      {/* Loading state */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <img src={poster} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/10 animate-pulse" />
        </div>
      )}
    </div>
  )
}
```

#### Strategy 2: Animated Poster (GSAP/CSS)

When video can't play, use a subtle animation on the poster to maintain visual interest:

```tsx
function AnimatedPosterFallback({ poster }: { poster: string }) {
  const imgRef = useRef<HTMLImageElement>(null)

  useGSAP(() => {
    const img = imgRef.current
    if (!img) return

    // Subtle Ken Burns effect
    gsap.to(img, {
      scale: 1.05,
      duration: 20,
      ease: 'none',
      repeat: -1,
      yoyo: true
    })
  }, { scope: imgRef })

  return (
    <div className="relative w-full h-full overflow-hidden">
      <img
        ref={imgRef}
        src={poster}
        alt=""
        className="w-full h-full object-cover"
      />
    </div>
  )
}
```

#### Strategy 3: Mobile-First Poster, Desktop Video

```tsx
function ResponsiveBackgroundMedia({
  videoSrc,
  poster
}: {
  videoSrc: string
  poster: string
}) {
  const [isMobile, setIsMobile] = useState(true)
  const [autoplaySupported, setAutoplaySupported] = useState(true)

  useEffect(() => {
    // Check if mobile
    setIsMobile(window.innerWidth < 1024)

    // Test autoplay support
    const testVideo = document.createElement('video')
    testVideo.muted = true
    testVideo.playsInline = true
    testVideo.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAA'

    testVideo.play()
      .then(() => setAutoplaySupported(true))
      .catch(() => setAutoplaySupported(false))
  }, [])

  // On mobile or if autoplay not supported, just show poster
  if (isMobile || !autoplaySupported) {
    return (
      <img
        src={poster}
        alt=""
        className="w-full h-full object-cover"
      />
    )
  }

  // Desktop with autoplay support
  return (
    <video
      src={videoSrc}
      poster={poster}
      muted
      playsInline
      autoPlay
      loop
      className="w-full h-full object-cover"
    />
  )
}
```

### 10.7 Debugging Autoplay Issues

#### Remote iOS Safari Debugging

1. **Enable Web Inspector on iOS:**
   - Settings → Safari → Advanced → Web Inspector: ON

2. **Connect device to Mac:**
   - Use Lightning cable
   - Safari → Develop → [Your Device] → [Your Page]

3. **Check Console for errors:**
   ```
   NotAllowedError: The request is not allowed by the user agent...
   ```

4. **Check Network tab:**
   - Is video actually loading?
   - Any 403/404 errors?

#### Console Debugging Script

```javascript
// Paste this in console to debug all videos on page
(function debugVideos() {
  const videos = document.querySelectorAll('video')

  videos.forEach((video, i) => {
    console.group(`Video ${i}`)
    console.log('src:', video.currentSrc || video.src)
    console.log('readyState:', video.readyState, [
      'HAVE_NOTHING',
      'HAVE_METADATA',
      'HAVE_CURRENT_DATA',
      'HAVE_FUTURE_DATA',
      'HAVE_ENOUGH_DATA'
    ][video.readyState])
    console.log('paused:', video.paused)
    console.log('muted:', video.muted)
    console.log('playsInline:', video.playsInline)
    console.log('autoplay:', video.autoplay)
    console.log('error:', video.error)
    console.log('networkState:', video.networkState, [
      'NETWORK_EMPTY',
      'NETWORK_IDLE',
      'NETWORK_LOADING',
      'NETWORK_NO_SOURCE'
    ][video.networkState])

    // Check for audio tracks
    if (video.audioTracks) {
      console.log('audioTracks:', video.audioTracks.length)
    }

    // Try to play
    video.play()
      .then(() => console.log('✅ play() succeeded'))
      .catch(e => console.log('❌ play() failed:', e.name, e.message))

    console.groupEnd()
  })
})()
```

#### Check for Audio Tracks

Videos with audio tracks (even if muted) are more likely to be blocked:

```typescript
function hasAudioTrack(video: HTMLVideoElement): boolean {
  // Modern API
  if ('audioTracks' in video) {
    return (video as any).audioTracks.length > 0
  }

  // Fallback: check if video was created with audio
  // (this is a heuristic, not reliable)
  return false
}

// Recommendation: Encode videos without audio tracks for backgrounds
// FFmpeg: -an flag removes audio
// ffmpeg -i input.mp4 -c:v copy -an output-no-audio.mp4
```

#### Codec Support Check

```typescript
function checkCodecSupport() {
  const video = document.createElement('video')

  const codecs = [
    'video/mp4; codecs="avc1.42E01E"',       // H.264 Baseline
    'video/mp4; codecs="avc1.4D401E"',       // H.264 Main
    'video/mp4; codecs="avc1.64001E"',       // H.264 High
    'video/webm; codecs="vp8"',               // VP8
    'video/webm; codecs="vp9"',               // VP9
    'video/mp4; codecs="hvc1"',               // HEVC/H.265
    'video/mp4; codecs="av01.0.01M.08"',     // AV1
  ]

  codecs.forEach(codec => {
    const support = video.canPlayType(codec)
    console.log(`${codec}: ${support || 'not supported'}`)
  })
}

// Most compatible: H.264 Baseline (avc1.42E01E)
// Best quality: H.264 High (avc1.64001E)
// Recommendation: Use H.264 Main or High for broad compatibility
```

### 10.8 Complete React Component Example

```tsx
// components/MobileAutoplayVideo.tsx
'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'

type VideoStatus = 'loading' | 'playing' | 'blocked' | 'error'

type Props = {
  src: string
  poster: string
  className?: string
  onStatusChange?: (status: VideoStatus) => void
}

export function MobileAutoplayVideo({ src, poster, className = '', onStatusChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const posterRef = useRef<HTMLImageElement>(null)
  const [status, setStatus] = useState<VideoStatus>('loading')
  const hasAttemptedPlayRef = useRef(false)

  // Update status and notify parent
  const updateStatus = useCallback((newStatus: VideoStatus) => {
    setStatus(newStatus)
    onStatusChange?.(newStatus)
  }, [onStatusChange])

  // Attempt autoplay
  useEffect(() => {
    const video = videoRef.current
    if (!video || hasAttemptedPlayRef.current) return

    hasAttemptedPlayRef.current = true

    const attemptPlay = async () => {
      // Configure video
      video.muted = true
      video.playsInline = true
      video.setAttribute('playsinline', '')
      video.setAttribute('webkit-playsinline', '')

      // iOS Safari requires explicit load()
      video.load()

      try {
        await video.play()

        // Verify playback is actually happening
        const startTime = video.currentTime
        await new Promise(resolve => setTimeout(resolve, 200))

        if (!video.paused && video.currentTime > startTime) {
          updateStatus('playing')

          // Fade out poster
          if (posterRef.current) {
            gsap.to(posterRef.current, {
              opacity: 0,
              duration: 0.5,
              onComplete: () => {
                if (posterRef.current) {
                  posterRef.current.style.display = 'none'
                }
              }
            })
          }
        } else {
          updateStatus('blocked')
        }
      } catch (error) {
        const err = error as Error
        console.log('Autoplay blocked:', err.name)
        updateStatus('blocked')
      }
    }

    // Wait for video to have enough data
    if (video.readyState >= 2) {
      attemptPlay()
    } else {
      video.addEventListener('canplay', attemptPlay, { once: true })

      // Timeout fallback
      setTimeout(() => {
        if (status === 'loading') {
          attemptPlay()
        }
      }, 3000)
    }
  }, [status, updateStatus])

  // User gesture handler for tap-to-play
  const handleTapToPlay = async () => {
    const video = videoRef.current
    if (!video) return

    try {
      video.muted = true
      video.playsInline = true
      await video.play()
      updateStatus('playing')

      // Fade out poster
      if (posterRef.current) {
        gsap.to(posterRef.current, {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            if (posterRef.current) {
              posterRef.current.style.display = 'none'
            }
          }
        })
      }
    } catch (e) {
      console.error('Manual play failed:', e)
      updateStatus('error')
    }
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Video element - always rendered */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        loop
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Poster overlay - covers video until playing confirmed */}
      <img
        ref={posterRef}
        src={poster}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: status === 'playing' ? 'none' : 'block' }}
      />

      {/* Tap-to-play overlay when blocked */}
      {status === 'blocked' && (
        <button
          onClick={handleTapToPlay}
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors cursor-pointer z-10"
          aria-label="Tap to play video"
        >
          <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <svg
              className="w-8 h-8 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      {/* Loading shimmer */}
      {status === 'loading' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}
    </div>
  )
}

// Add to your global CSS:
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
// .animate-shimmer {
//   animation: shimmer 1.5s infinite;
// }
```

### 10.9 Summary: Autoplay Checklist

Before shipping, verify:

```markdown
## HTML Attributes
- [ ] `muted` attribute present
- [ ] `playsInline` attribute present (not `playsinline` lowercase in JSX)
- [ ] `autoPlay` attribute present
- [ ] `loop` attribute present (for background videos)
- [ ] `preload="auto"` or `preload="metadata"`
- [ ] `poster` attribute with valid image URL

## JavaScript
- [ ] Set `video.muted = true` in JS before play()
- [ ] Set `video.playsInline = true` in JS
- [ ] Call `video.load()` before play() on iOS Safari
- [ ] Handle play() promise rejection
- [ ] Verify actual playback (not just promise resolution)

## Fallbacks
- [ ] Show poster image when autoplay blocked
- [ ] Provide tap-to-play UI for blocked videos
- [ ] Animate poster if video cannot play (Ken Burns, etc.)
- [ ] Consider poster-only mode for mobile

## Performance
- [ ] Only 1 video playing at a time on mobile
- [ ] Videos without audio tracks (use `-an` in FFmpeg)
- [ ] Mobile-optimized resolution (720p max)
- [ ] Appropriate bitrate (1-2 Mbps mobile, 4-6 Mbps desktop)

## Testing
- [ ] Test on real iOS device (not simulator)
- [ ] Test on real Android device
- [ ] Test with Low Power Mode enabled
- [ ] Test with Data Saver enabled
- [ ] Test on slow 3G connection
- [ ] Test cold load (clear cache)
```
