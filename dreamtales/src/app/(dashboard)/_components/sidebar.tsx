'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, BookOpen, Settings, X, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Přehled', icon: LayoutDashboard },
  { href: '/children', label: 'Profily dětí', icon: Users },
  { href: '/stories', label: 'Pohádky', icon: BookOpen },
  { href: '/settings', label: 'Nastavení', icon: Settings },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-purple/20">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-md shadow-purple-900/50 shrink-0">
          <span className="text-lg">🌙</span>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">DreamTales</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-purple/30 text-white border border-purple/40 shadow-sm shadow-purple/20'
                  : 'text-muted hover:text-soft-white hover:bg-white/5'
              )}
            >
              <Icon className={cn('h-4.5 w-4.5 shrink-0', isActive ? 'text-violet-300' : 'text-muted')} size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom decoration */}
      <div className="px-4 py-4 border-t border-purple/20">
        <div className="rounded-xl bg-gradient-to-br from-purple/20 to-violet-900/20 border border-purple/20 p-4">
          <p className="text-xs font-semibold text-violet-300 mb-1">Tip dne</p>
          <p className="text-xs text-muted leading-relaxed">Přidejte jméno kamaráda dítěte do profilu — pohádky budou ještě osobnější!</p>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile toggle button — rendered into the topbar slot via CSS */}
      <button
        className="md:hidden fixed top-3.5 left-4 z-50 p-2 rounded-lg bg-navy-mid border border-purple/20 text-muted hover:text-white transition"
        onClick={() => setMobileOpen(true)}
        aria-label="Otevřít menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-navy-light border-r border-purple/20 flex flex-col transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition"
          onClick={() => setMobileOpen(false)}
          aria-label="Zavřít menu"
        >
          <X size={18} />
        </button>
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-navy-light border-r border-purple/20 min-h-screen sticky top-0">
        <NavContent />
      </aside>
    </>
  )
}
