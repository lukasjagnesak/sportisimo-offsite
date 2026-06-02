'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ChevronDown, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface TopBarProps {
  displayName: string
}

export default function DashboardTopBar({ displayName }: TopBarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="h-14 border-b border-purple/20 bg-navy-light/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left — spacer for mobile hamburger */}
      <div className="w-8 md:hidden" />

      {/* Center title — visible on mobile */}
      <div className="flex-1 flex justify-center md:justify-start">
        <span className="md:hidden text-sm font-semibold text-soft-white">DreamTales</span>
      </div>

      {/* Right — user menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 hover:bg-white/5 transition group"
          aria-expanded={menuOpen}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <span className="hidden sm:block text-sm text-soft-white max-w-[120px] truncate">{displayName}</span>
          <ChevronDown size={14} className="text-muted group-hover:text-soft-white transition" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-20 w-52 rounded-xl border border-purple/20 bg-navy-light shadow-xl shadow-black/40 overflow-hidden">
              <div className="px-4 py-3 border-b border-purple/20">
                <p className="text-xs text-muted">Přihlášen jako</p>
                <p className="text-sm font-medium text-soft-white truncate mt-0.5">{displayName}</p>
              </div>
              <div className="p-1">
                <a
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted hover:text-soft-white hover:bg-white/5 transition"
                >
                  <User size={15} />
                  Nastavení účtu
                </a>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition disabled:opacity-60"
                >
                  <LogOut size={15} />
                  {isLoggingOut ? 'Odhlašování...' : 'Odhlásit se'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
