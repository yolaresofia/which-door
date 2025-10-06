'use client'

import Link from 'next/link'
import Image from 'next/image'
import {useEffect, useCallback} from 'react'

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
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onKeyDown])

  if (!open) return null

  return (
    <div id={id} role="dialog" aria-modal="true" className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex flex-col">
        <div className="flex items-center justify-between px-6 md:px-12 h-28">
          <Link href="/" onClick={onClose} className="flex items-center h-[46px]">
            <Image
              src="https://cdn.sanity.io/images/xerhtqd5/production/0d40f22651c19648b1b763c39c3be9cf3df8e469-39x46.svg"
              alt="Which Door logo"
              width={39}
              height={46}
              className="h-full w-auto"
            />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="text-white tracking-wide text-sm font-medium"
            aria-label="Close menu"
          >
            Close
          </button>
        </div>
        <nav className="px-6 md:px-12 pt-6">
          <ul className="space-y-6">
            {navItems.map(({href, label}) => {
              const isActive = currentPath === href
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
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
