'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/icon'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', iconName: 'bolt' as const },
  { href: '/children', label: 'Children', iconName: 'user' as const },
  { href: '/stories', label: 'Stories', iconName: 'book' as const },
  { href: '/settings', label: 'Settings', iconName: 'gear' as const },
]

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  return (
    <>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 dark:border-white/5">
        <span className="relative grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br from-blossom to-lavender shadow-soft">
          <Icon name="moon" className="w-5 h-5 text-blossomink" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-pulse" />
        </span>
        <span className="font-display font-bold text-xl tracking-tight text-slate-800 dark:text-white">
          Dreamy<span className="text-dreamy">Tales</span>
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${isActive
                ? 'bg-blossom/60 dark:bg-stellar/15 text-blossomink dark:text-stellar border border-blossom/50 dark:border-stellar/30 shadow-soft'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
              }`}
            >
              <Icon name={item.iconName} className="w-4.5 h-4.5 shrink-0 w-[18px] h-[18px]" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 dark:border-white/5">
        <div className="rounded-2xl p-4 bg-gradient-to-br from-blossom/40 to-lavender/30 dark:from-stellar/10 dark:to-cloud/5 border border-white/50 dark:border-white/10">
          <p className="text-xs font-bold text-blossomink dark:text-stellar mb-1">Daily Tip</p>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">Add your child&apos;s friend&apos;s name to make stories even more personal!</p>
        </div>
      </div>
    </>
  )
}

export default function DashboardSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <button
        className="md:hidden fixed top-3.5 left-4 z-50 p-2 rounded-xl glass text-slate-700 dark:text-slate-200"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Icon name="plus" className="w-5 h-5 rotate-45" />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 glass-strong flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button className="absolute top-4 right-4 p-1.5 rounded-xl glass text-slate-600 dark:text-slate-300" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <Icon name="x" className="w-4 h-4" />
        </button>
        <NavContent onClose={() => setMobileOpen(false)} />
      </aside>

      <aside className="hidden md:flex w-60 shrink-0 flex-col glass-strong border-r border-white/20 dark:border-white/5 min-h-screen sticky top-0">
        <NavContent />
      </aside>
    </>
  )
}
