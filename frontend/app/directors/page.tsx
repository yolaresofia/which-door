'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { directors } from '../components/constants'
import { useCrossfadeMedia } from '../utils/useCrossfadeMedia'
import { useSequencedReveal } from '../utils/useSequencedReveal'
import BackgroundMedia from '../components/BackgroundMedia/BackgroundMedia'
import { gsap } from 'gsap'

const DEFAULT_INDEX = 3

const getMedia = (d: any, i: number) => ({
  id: d?.slug ?? i,
  videoSrc: d?.previewUrl ?? d?.vimeoUrl ?? '',
  previewUrl: d?.previewUrl ?? '',
  vimeoUrl: d?.vimeoUrl ?? '',
  previewPoster: d?.previewPoster ?? '',
  bgColor: d?.bgColor ?? '#477AA1',
})

export default function DirectorsIndexPage() {
  const router = useRouter()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [fontLoaded, setFontLoaded] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const listRef = useRef<HTMLUListElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const animationRef = useRef<gsap.core.Tween | null>(null)

  const initialIdx =
    Number.isInteger(DEFAULT_INDEX) && directors[DEFAULT_INDEX] ? DEFAULT_INDEX : 0
  const initialMedia = getMedia(directors[initialIdx], initialIdx)
  
  const { setSlotRef, slotMedia, crossfadeTo } = useCrossfadeMedia(initialMedia, {
    duration: 0.45,
  })

  const activeIndex = hoveredIndex ?? initialIdx

  // Enter animation - EXACT SAME as ProjectsLanding
  const { start } = useSequencedReveal(listRef, {
    target: '[data-reveal]',
    duration: 0.8,
    ease: 'power2.out',
    from: { opacity: 0, y: 20, scale: 0.98 },
    to: { opacity: 1, y: 0, scale: 1 },
    autoStart: false,
    stagger: { 
      each: 0.08,
      from: 'start',
      ease: 'power2.inOut'
    },
  })

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Font loading + trigger enter animation
  useEffect(() => {
    let cancelled = false
    let timeoutId: NodeJS.Timeout

    const triggerAnimation = () => {
      if (cancelled) return
      setFontLoaded(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!isMobile) start()
        })
      })
    }

    if ('fonts' in document && (document as any).fonts?.ready) {
      ;(document as any).fonts.ready.then(() => {
        ;(document as any).fonts.load('normal 1em Neue').then(
          () => {
            if (!cancelled) triggerAnimation()
          },
          () => {
            if (!cancelled) triggerAnimation()
          }
        )
      })
    } else {
      timeoutId = setTimeout(triggerAnimation, 100)
    }

    const safetyTimeout = setTimeout(() => {
      if (!cancelled && !fontLoaded) {
        triggerAnimation()
      }
    }, 3000)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      clearTimeout(safetyTimeout)
    }
  }, [start, fontLoaded, isMobile])

  // Handlers to request a crossfade
  const select = (i: number) => {
    if (isNavigating) return
    const d = directors[i]
    if (!d) return
    setHoveredIndex(i)
    crossfadeTo(getMedia(d, i))
  }

  const resetToDefault = () => {
    if (isNavigating) return
    setHoveredIndex(null)
    crossfadeTo(initialMedia)
  }

  // Fade-out animation function - EXACT SAME as ProjectsLanding
  const fadeOutAndNavigate = useCallback((url: string) => {
    if (isNavigating) return
    
    console.log('🎬 Directors: Starting fade-out animation...')
    setIsNavigating(true)

    // Disable pointer events during animation
    if (mainRef.current) {
      mainRef.current.style.pointerEvents = 'none'
    }

    // Fade out all director names
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[data-reveal]')
      
      console.log('🎬 Directors: Found items to animate:', items.length)
      
      if (items.length === 0) {
        console.warn('⚠️ Directors: No items found with [data-reveal], navigating immediately')
        router.push(url)
        return
      }

      // Kill any existing animation
      if (animationRef.current) {
        animationRef.current.kill()
      }

      // Create the animation
      animationRef.current = gsap.to(items, {
        opacity: 0,
        y: -30,
        scale: 0.92,
        duration: 0.7,
        ease: 'power2.in',
        stagger: {
          each: 0.05,
          from: 'start'
        },
        onStart: () => {
          console.log('▶️ Directors: Animation started')
        },
        onComplete: () => {
          console.log('✅ Directors: Animation complete, navigating to:', url)
          // Small safety delay to ensure animation is fully visible
          setTimeout(() => {
            router.push(url)
          }, 50)
        }
      })
    } else {
      console.warn('⚠️ Directors: listRef not found, navigating immediately')
      // Fallback
      router.push(url)
    }
  }, [isNavigating, router])

  // Handle director click with fade-out
  const handleDirectorClick = useCallback((e: React.MouseEvent, slug: string) => {
    if (isMobile || isNavigating) return
    
    e.preventDefault()
    fadeOutAndNavigate(`/directors/${slug}`)
  }, [isMobile, isNavigating, fadeOutAndNavigate])

  // Expose fade-out function globally for header navigation
  useEffect(() => {
    if (isMobile) return

    // Make fade-out function available globally
    (window as any).__directorsFadeOut = fadeOutAndNavigate

    return () => {
      console.log('🔧 Directors: Cleaning up __directorsFadeOut function')
      delete (window as any).__directorsFadeOut
    }
  }, [isMobile, fadeOutAndNavigate])

  return (
    <main 
      ref={mainRef}
      className="relative min-h-dvh w-full overflow-hidden text-white"
    >
      {/* BACKGROUND (preview variant) */}
      <div className="absolute inset-0 z-0 bg-black">
        <div
          ref={el => { setSlotRef(0)(el) }}
          className="absolute inset-0 will-change-opacity will-change-transform"
          style={{ pointerEvents: 'none' }}
        >
          {slotMedia[0] && (
            <BackgroundMedia
              variant="preview"
              previewUrl={slotMedia[0].previewUrl ?? slotMedia[0].videoSrc}
              vimeoUrl={slotMedia[0].vimeoUrl ?? slotMedia[0].videoSrc}
              previewPoster={slotMedia[0].previewPoster}
              bgColor={slotMedia[0].bgColor}
            />
          )}
        </div>
        <div
          ref={el => { setSlotRef(1)(el) }}
          className="absolute inset-0 will-change-opacity will-change-transform"
          style={{ pointerEvents: 'none' }}
        >
          {slotMedia[1] && (
            <BackgroundMedia
              variant="preview"
              previewUrl={slotMedia[1].previewUrl ?? slotMedia[1].videoSrc}
              vimeoUrl={slotMedia[1].vimeoUrl ?? slotMedia[1].videoSrc}
              previewPoster={slotMedia[1].previewPoster}
              bgColor={slotMedia[1].bgColor}
            />
          )}
        </div>
      </div>

      {/* FOREGROUND LIST */}
      <section className="relative min-h-dvh w-full pt-32">
        <ul
          ref={listRef}
          className="md:pl-12 max-w-none md:space-y-2 space-y-6 px-6"
          onMouseLeave={resetToDefault}
          onTouchEnd={resetToDefault}
        >
          {directors.map((d, i) => {
            const isActive = i === activeIndex
            return (
              <li
                key={d.slug}
                className={`transition-opacity duration-200 ${
                  isActive ? 'opacity-100' : 'opacity-70'
                }`}
                style={{
                  overflow: 'visible', // Allow animation to move freely
                  willChange: 'opacity, transform'
                }}
              >
                <div
                  data-reveal
                  style={{
                    overflow: 'visible', // Critical: allow text to animate freely
                    willChange: 'opacity, transform'
                  }}
                >
                  <a
                    href={`/directors/${d.slug}`}
                    onClick={(e) => handleDirectorClick(e, d.slug)}
                    aria-current={isActive ? 'page' : undefined}
                    className="block outline-none"
                    onMouseEnter={() => select(i)}
                    onFocus={() => select(i)}
                    onTouchStart={() => select(i)}
                  >
                    <span
                      className={[
                        'block leading-[1.05] tracking-tight transition-all duration-200',
                        'md:text-6xl text-3xl',
                        isActive ? 'text-white' : 'text-white/80',
                      ].join(' ')}
                      style={{
                        overflow: 'visible', // Allow text to animate freely
                        backfaceVisibility: 'hidden'
                      }}
                    >
                      {d.name}
                    </span>
                  </a>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}