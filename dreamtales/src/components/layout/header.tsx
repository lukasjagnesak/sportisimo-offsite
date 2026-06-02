'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function Header() {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-navy/90 backdrop-blur-md border-b border-purple/20 shadow-lg shadow-black/30'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group focus-visible:outline-none"
          >
            <Sparkles className="h-5 w-5 text-gold group-hover:text-gold-light transition-colors" />
            <span className="font-display text-xl font-semibold text-soft-white group-hover:text-gradient transition-all">
              DreamTales
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="#how-it-works">Jak to funguje</NavLink>
            <NavLink href="#pricing">Cena</NavLink>
            <NavLink href="/blog">Blog</NavLink>
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/prihlasit">Přihlásit</Link>
            </Button>
            <Button variant="gold" size="sm" asChild>
              <Link href="/registrace">Začít zdarma</Link>
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-muted hover:text-soft-white hover:bg-white/5 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Přepnout menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300',
          menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="bg-navy/95 backdrop-blur-md border-t border-purple/20 px-4 py-4 flex flex-col gap-1">
          <MobileNavLink href="#how-it-works" onClick={() => setMenuOpen(false)}>
            Jak to funguje
          </MobileNavLink>
          <MobileNavLink href="#pricing" onClick={() => setMenuOpen(false)}>
            Cena
          </MobileNavLink>
          <MobileNavLink href="/blog" onClick={() => setMenuOpen(false)}>
            Blog
          </MobileNavLink>
          <div className="mt-3 pt-3 border-t border-purple/20 flex flex-col gap-2">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/prihlasit" onClick={() => setMenuOpen(false)}>
                Přihlásit
              </Link>
            </Button>
            <Button variant="gold" size="sm" className="w-full" asChild>
              <Link href="/registrace" onClick={() => setMenuOpen(false)}>
                Začít zdarma
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-sm text-muted hover:text-soft-white rounded-lg hover:bg-white/5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/60"
    >
      {children}
    </Link>
  )
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-4 py-3 text-sm text-soft-white/80 hover:text-soft-white rounded-lg hover:bg-white/5 transition-colors"
    >
      {children}
    </Link>
  )
}
