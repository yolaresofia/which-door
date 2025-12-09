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
  const [isAnimating, setIsAnimating] = useState(false)

  // Handle close with exit animation
  const handleClose = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)

    const backdrop = backdropRef.current
    const content = contentRef.current
    const navItemsList = navRef.current?.querySelectorAll('li')

    // Create exit animation timeline
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimating(false)
        setIsVisible(false)
        onClose()
      }
    })

    // Fade out nav items (reverse order)
    if (navItemsList && navItemsList.length > 0) {
      tl.to(navItemsList, {
        opacity: 0,
        y: -10,
        duration: 0.3,
        ease: 'power2.in',
        stagger: {
          each: 0.05,
          from: 'end' as const,
        },
      })
    }

    // Fade out content
    if (content) {
      tl.to(content, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        ease: 'power2.in',
      }, '-=0.15')
    }

    // Fade out backdrop
    if (backdrop) {
      tl.to(backdrop, {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
      }, '-=0.1')
    }
  }, [isAnimating, onClose])

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    },
    [handleClose],
  )

  // Show menu when open prop changes
  useEffect(() => {
    if (open) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
    } else if (!open && isVisible) {
      // User closed from outside, just hide immediately
      setIsVisible(false)
      document.body.style.overflow = ''
    }
  }, [open, isVisible])

  useEffect(() => {
    if (!isVisible) return
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [isVisible, onKeyDown])

  // Enter animation when menu opens
  useGSAP(() => {
    if (!open || !menuRef.current || !isVisible) return

    const backdrop = backdropRef.current
    const content = contentRef.current
    const navItems = navRef.current?.querySelectorAll('li')

    // Set initial states
    if (backdrop) gsap.set(backdrop, { opacity: 0 })
    if (content) gsap.set(content, { opacity: 0, y: -20 })
    if (navItems) gsap.set(navItems, { opacity: 0, y: 10 })

    // Create timeline for smooth entrance
    const tl = gsap.timeline()

    // Fade in backdrop
    if (backdrop) {
      tl.to(backdrop, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      })
    }

    // Fade in header content
    if (content) {
      tl.to(content, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
      }, '-=0.1')
    }

    // Stagger in nav items
    if (navItems && navItems.length > 0) {
      tl.to(navItems, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: {
          each: 0.08,
          from: 'start' as const,
        },
      }, '-=0.2')
    }

    return () => {
      tl.kill()
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
              const isActive = currentPath === href
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
