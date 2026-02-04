'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'
import MobileMenu from './MobileMenu'
import { usePageTransitionOptional } from './PageTransitionProvider'

export default function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const pageTransition = usePageTransitionOptional()

  const navItems = [
    { href: '/', label: 'Projects' },
    { href: '/directors', label: 'Directors' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ]

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    // Don't navigate if we're already on that page
    if (pathname === url) return

    // Desktop: use page transition system
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      e.preventDefault()

      // Try the new centralized transition system first
      if (pageTransition) {
        pageTransition.navigateWithTransition(url)
        return
      }

      // Fallback to legacy window-based fade-out functions
      // (for backwards compatibility during migration)
      const fadeOutFunctions: Record<string, string> = {
        '/': '__projectsFadeOut',
        '/projects': '__projectsFadeOut',
        '/about': '__aboutFadeOut',
        '/directors': '__directorsFadeOut',
        '/contact': '__contactFadeOut',
      }

      // Check exact path matches first
      const exactFadeOut = fadeOutFunctions[pathname ?? '']
      if (exactFadeOut && (window as any)[exactFadeOut]) {
        (window as any)[exactFadeOut](url)
        return
      }

      // Check prefix matches for detail pages
      if (pathname?.startsWith('/directors/') && (window as any).__directorDetailFadeOut) {
        (window as any).__directorDetailFadeOut(url)
        return
      }

      if (pathname?.startsWith('/projects/') && (window as any).__projectDetailFadeOut) {
        (window as any).__projectDetailFadeOut(url)
        return
      }

      // No legacy fade-out available - navigation will happen via default Link behavior
      // (pageTransition.navigateWithTransition was already called above if available)
    }

    // Mobile: allow default Link behavior (instant navigation)
  }, [pathname, pageTransition])

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-28">
      <div className="h-full px-6 md:px-12 mx-auto">
        <div className="h-full flex items-center justify-between lg:grid lg:grid-cols-3">
          {/* Logo */}
          <div className="lg:justify-self-start">
            <Link
              href="/"
              className="flex items-center group lg:h-[35px] h-[30px]"
              onClick={(e) => handleClick(e, '/')}
            >
              <Image
                src="https://cdn.sanity.io/images/xerhtqd5/production/0d40f22651c19648b1b763c39c3be9cf3df8e469-39x46.svg"
                alt="Which Door logo"
                width={39}
                height={46}
                priority
                unoptimized
                className="h-full w-auto"
              />
              <Image
                src="https://cdn.sanity.io/images/xerhtqd5/production/fb73dc9852c0a288232ff5cf63a37c29f64e477e-131x44.svg"
                alt="Which Door wordmark"
                width={120}
                height={44}
                unoptimized
                className="h-full w-auto ml-2 opacity-100 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100"
              />
            </Link>
          </div>
          <nav className="hidden lg:block lg:justify-self-center">
            <ul
              role="list"
              className="flex items-center gap-8 text-white text-xs font-medium tracking-wide uppercase"
            >
              {navItems.map(({ href, label }) => {
                const isActive =
                  href === '/'
                    ? pathname === '/' || pathname === '/projects' || pathname?.startsWith('/projects/')
                    : href === '/directors'
                      ? pathname === '/directors' || pathname?.startsWith('/directors/')
                      : pathname === href
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={(e) => handleClick(e, href)}
                      className={`transition-opacity duration-200 ${
                        isActive ? 'text-white opacity-100' : 'text-white opacity-70 hover:opacity-100'
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <div className="lg:justify-self-end">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="lg:hidden text-white tracking-wide text-sm font-medium"
              aria-label="Open menu"
              aria-controls="mobile-menu"
              aria-expanded={open}
            >
              Menu
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        id="mobile-menu"
        open={open}
        onClose={() => setOpen(false)}
        navItems={navItems}
        currentPath={pathname}
      />
    </header>
  )
}
