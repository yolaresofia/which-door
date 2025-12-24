'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useCallback, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

type NavItem = {href: string; label: string}

export default function MobileMenu({
  id = 'mobile-menu',
  open,
  onClose,
  navItems,
  currentPath,
}: {
  id?: string
  open: boolean
  onClose: () => void
  navItems: ReadonlyArray<NavItem>
  currentPath: string
}) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const backdropRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const navRef = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const isAnimatingRef = useRef(false)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  // Handle close with exit animation
  const handleClose = useCallback(() => {
    if (isAnimatingRef.current) {
      console.log('⚠️ Menu already animating, ignoring close request')
      return
    }

    isAnimatingRef.current = true

    try {
      const backdrop = backdropRef.current
      const content = contentRef.current
      const navItemsList = navRef.current?.querySelectorAll('li')

      // Kill any existing timeline
      if (timelineRef.current) {
        timelineRef.current.kill()
      }

      // Create exit animation timeline
      timelineRef.current = gsap.timeline({
        onComplete: () => {
          isAnimatingRef.current = false
          setIsVisible(false)
          onClose()
        }
      })

      // Simplified exit: just fade out everything together
      if (navItemsList && navItemsList.length > 0) {
        timelineRef.current.to(navItemsList, {
          opacity: 0,
          scale: 0.95,
          duration: 0.25,
          ease: 'power2.in',
        })
      }

      if (content) {
        timelineRef.current.to(content, {
          opacity: 0,
          duration: 0.25,
          ease: 'power2.in',
        }, '-=0.2')
      }

      if (backdrop) {
        timelineRef.current.to(backdrop, {
          opacity: 0,
          duration: 0.2,
          ease: 'power2.in',
        }, '-=0.15')
      }

      // Safety timeout - close even if animation fails
      setTimeout(() => {
        if (isAnimatingRef.current) {
          console.log('⏰ Menu animation timeout, closing immediately')
          isAnimatingRef.current = false
          setIsVisible(false)
          onClose()
        }
      }, 500)
    } catch (error) {
      console.error('Menu close animation error:', error)
      isAnimatingRef.current = false
      setIsVisible(false)
      onClose()
    }
  }, [onClose])

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    },
    [handleClose],
  )

  // Show menu when open prop changes
  useEffect(() => {
    try {
      if (open && !isVisible) {
        setIsVisible(true)
        document.body.style.overflow = 'hidden'
      } else if (!open && isVisible && !isAnimatingRef.current) {
        // User closed from outside without animation
        setIsVisible(false)
        document.body.style.overflow = ''
      }
    } catch (error) {
      console.error('Menu visibility error:', error)
    }
  }, [open, isVisible])

  useEffect(() => {
    if (!isVisible) return

    try {
      window.addEventListener('keydown', onKeyDown)
      return () => {
        window.removeEventListener('keydown', onKeyDown)
        document.body.style.overflow = ''
      }
    } catch (error) {
      console.error('Menu keyboard listener error:', error)
    }
  }, [isVisible, onKeyDown])

  // Enter animation when menu opens
  useGSAP(() => {
    if (!open || !menuRef.current || !isVisible) return

    try {
      const backdrop = backdropRef.current
      const content = contentRef.current
      const navItems = navRef.current?.querySelectorAll('li')

      // Set initial states
      if (backdrop) gsap.set(backdrop, { opacity: 0 })
      if (content) gsap.set(content, { opacity: 0, scale: 0.95 })
      if (navItems) gsap.set(navItems, { opacity: 0, scale: 0.95 })

      // Simplified enter animation - everything fades in together
      const tl = gsap.timeline()

      // Fade in backdrop
      if (backdrop) {
        tl.to(backdrop, {
          opacity: 1,
          duration: 0.25,
          ease: 'power2.out',
        })
      }

      // Fade in content and nav items together
      if (content) {
        tl.to(content, {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
        }, '-=0.1')
      }

      if (navItems && navItems.length > 0) {
        tl.to(navItems, {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
          stagger: {
            each: 0.05,
            from: 'start' as const,
          },
        }, '-=0.25')
      }

      return () => {
        tl.kill()
      }
    } catch (error) {
      console.error('Menu enter animation error:', error)
    }
  }, { dependencies: [open, isVisible], scope: menuRef })

  if (!isVisible) return null

  return (
    <div ref={menuRef} id={id} role="dialog" aria-modal="true" className="fixed inset-0 z-50 lg:hidden">
      <div ref={backdropRef} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div ref={contentRef} className="absolute inset-0 flex flex-col">
        <div className="flex items-center justify-between px-6 md:px-12 h-28">
          <div className="lg:justify-self-start">
            <Link 
              href="/" 
              className="flex items-center group lg:h-[46px] h-[30px]"
            >
              <Image
                src="https://cdn.sanity.io/images/xerhtqd5/production/0d40f22651c19648b1b763c39c3be9cf3df8e469-39x46.svg"
                alt="Which Door logo"
                width={39}
                height={46}
                priority
                className="h-full w-auto"
              />
              <Image
                src="https://cdn.sanity.io/images/xerhtqd5/production/fb73dc9852c0a288232ff5cf63a37c29f64e477e-131x44.svg"
                alt="Which Door wordmark"
                width={131}
                height={44}
                className="h-full w-auto ml-2 opacity-100 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100"
              />
            </Link>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-white tracking-wide text-sm font-medium"
            aria-label="Close menu"
          >
            Close
          </button>
        </div>
        <nav ref={navRef} className="px-6 md:px-12 pt-6">
          <ul className="space-y-4">
            {navItems.map(({href, label}) => {
              // For Projects (/) and Directors (/directors), also match their detail pages
              const isActive =
                href === '/'
                  ? currentPath === '/' || currentPath === '/projects' || currentPath?.startsWith('/projects/')
                  : href === '/directors'
                    ? currentPath === '/directors' || currentPath?.startsWith('/directors/')
                    : currentPath === href
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={handleClose}
                    className={`block text-3xl tracking-wide transition-opacity duration-200 ${
                      isActive
                        ? 'text-white opacity-100'
                        : 'text-white opacity-80 hover:opacity-100'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="pointer-events-none select-none">
          <div className="absolute left-6 md:left-12 bottom-6 md:bottom-8 max-w-[60%] text-white leading-tight text-base space-y-6">
            <p className="pointer-events-auto">
              <span className="block">
                For Inquiries &amp; Commissions{' '}
                <a
                  href="mailto:info@whichdoor.com"
                >
                  info@whichdoor.com
                </a>
              </span>
              <span className="block pt-2">
                For Job Applications &amp; Internships{' '}
                <a
                  href="mailto:apply@whichdoor.com"
                >
                  apply@whichdoor.com
                </a>
              </span>
            </p>
            <p className="pointer-events-auto">
              <a
                href="https://vimeo.com/"
                target="_blank"
                rel="noreferrer"
              >
                Vimeo
              </a>
              ,{' '}
              <a
                href="https://youtube.com/"
                target="_blank"
                rel="noreferrer"
              >
                YouTube
              </a>
              ,{' '}
              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
