'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()

  const navItems = [
    { href: '/projects', label: 'Projects' },
    { href: '/directors', label: 'Directors' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-28">
      <div className="h-full px-12">
        <div className="grid h-full grid-cols-3 items-center">
          <div className="justify-self-start">
            <Link href="/" className="flex items-center group h-[46px]">
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
                className="h-full w-auto ml-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            </Link>
          </div>
          <nav className="justify-self-center">
            <ul
              role="list"
              className="flex items-center gap-8 text-white text-sm font-medium tracking-wide uppercase"
            >
              {navItems.map(({ href, label }) => {
                const isActive = pathname === href
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`transition-opacity duration-200 ${
                        isActive
                          ? 'text-white opacity-100'
                          : 'text-white opacity-70 hover:opacity-100'
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          <div className="justify-self-end" aria-hidden />
        </div>
      </div>
    </header>
  )
}
