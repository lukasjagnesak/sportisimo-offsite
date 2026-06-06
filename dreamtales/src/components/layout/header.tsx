'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { useApp, REGIONS } from '@/lib/context/app-context'

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5 interactive">
      <span className="relative grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br from-blossom to-lavender dark:from-night dark:to-night dark:ring-1 dark:ring-white/10 shadow-soft">
        <Icon name="moon" className="w-5 h-5 text-blossomink dark:text-stellar" />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white dark:bg-stellar animate-pulse" />
      </span>
      <span className="font-display font-bold text-xl tracking-tight text-slate-800 dark:text-white">
        Dreamy<span className="text-dreamy">Tales</span>
      </span>
    </Link>
  )
}

export function ThemeToggle() {
  const { dark, setDark } = useApp()
  return (
    <button
      onClick={() => setDark(!dark)}
      aria-label="Toggle day / night"
      className="interactive relative w-16 h-[34px] rounded-full p-1 glass overflow-hidden"
    >
      <span
        className={`absolute inset-0 transition-opacity duration-500 ${dark ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'linear-gradient(120deg,#1b2542,#0b0f19)' }}
      />
      <span
        className={`absolute inset-0 transition-opacity duration-500 ${dark ? 'opacity-0' : 'opacity-100'}`}
        style={{ background: 'linear-gradient(120deg,#D0E7FF,#FFD1E6)' }}
      />
      <span className={`relative grid place-items-center w-[26px] h-[26px] rounded-full bg-white shadow transition-transform duration-500 ${dark ? 'translate-x-[30px]' : 'translate-x-0'}`}>
        <Icon name={dark ? 'moon' : 'sun'} className="w-3.5 h-3.5 text-slate-700" />
      </span>
    </button>
  )
}

export function RegionSwitcher() {
  const { region, setRegion } = useApp()
  const [open, setOpen] = useState(false)
  const cur = REGIONS.find(r => r.code === region)!

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const target = e.target as Element
      if (!target.closest('[data-region-switcher]')) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="relative" data-region-switcher>
      <button
        onClick={() => setOpen(!open)}
        className="interactive flex items-center gap-2 rounded-3xl px-3.5 py-2.5 glass text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        <span className="text-base leading-none">{cur.flag}</span>
        <span className="hidden sm:inline">{cur.cur}</span>
        <Icon name="chevron" className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 glass-strong rounded-3xl p-2 shadow-softlg z-50 step-enter">
          {REGIONS.map(r => {
            const active = r.code === region
            return (
              <button
                key={r.code}
                onClick={() => { setRegion(r.code); setOpen(false) }}
                className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-blossom/60 dark:bg-stellar/15 text-blossomink dark:text-stellar' : 'text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/5'}`}
              >
                <span className="text-lg leading-none">{r.flag}</span>
                <span className="flex-1 text-left">{r.label}</span>
                <span className="text-xs font-bold opacity-60">{r.cur}</span>
                {active && <Icon name="check" className="w-4 h-4" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 12) }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'py-2.5' : 'py-4'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className={`flex items-center justify-between gap-3 rounded-3xl px-3 sm:px-4 py-2.5 transition-all duration-300 ${scrolled ? 'glass-strong shadow-soft' : ''}`}>
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <RegionSwitcher />
            <Link
              href="/dashboard"
              className="interactive hidden sm:inline-flex items-center justify-center gap-2 rounded-3xl px-5 py-2.5 text-sm bg-slate-800 text-white dark:bg-white dark:text-midnight font-semibold shadow-soft"
            >
              <Icon name="user" className="w-4 h-4" />
              Login / Dashboard
            </Link>
            <Link
              href="/dashboard"
              aria-label="Login"
              className="sm:hidden interactive grid place-items-center w-11 h-11 rounded-2xl bg-slate-800 text-white dark:bg-white dark:text-midnight"
            >
              <Icon name="user" className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
