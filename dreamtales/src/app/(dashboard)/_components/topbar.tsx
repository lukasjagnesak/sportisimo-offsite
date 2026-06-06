'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Icon } from '@/components/ui/icon'

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
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="h-14 border-b border-white/20 dark:border-white/5 glass-strong flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="w-8 md:hidden" />

      <div className="flex-1 flex justify-center md:justify-start">
        <span className="md:hidden font-display font-bold text-lg text-slate-800 dark:text-white">
          Dreamy<span className="text-dreamy">Tales</span>
        </span>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="interactive flex items-center gap-2 rounded-2xl px-3 py-1.5 hover:bg-white/40 dark:hover:bg-white/5 transition"
          aria-expanded={menuOpen}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blossom to-lavender flex items-center justify-center text-blossomink text-xs font-bold shrink-0">
            {initials}
          </div>
          <span className="hidden sm:block text-sm font-semibold text-slate-800 dark:text-white max-w-[120px] truncate">{displayName}</span>
          <Icon name="chevron" className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-20 w-52 glass-strong rounded-3xl p-2 shadow-softlg step-enter overflow-hidden">
              <div className="px-3 py-2.5 mb-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate mt-0.5">{displayName}</p>
              </div>
              <div className="border-t border-white/30 dark:border-white/10 pt-1">
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5 transition font-semibold"
                >
                  <Icon name="gear" className="w-4 h-4" />
                  Account settings
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition font-semibold disabled:opacity-60"
                >
                  <Icon name="arrowL" className="w-4 h-4" />
                  {isLoggingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
