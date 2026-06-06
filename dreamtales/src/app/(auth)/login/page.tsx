'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GlassCard } from '@/components/ui/glass-card'
import { Icon } from '@/components/ui/icon'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError('Incorrect email or password. Please try again.')
      } else {
        router.push('/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassCard className="p-8 shadow-softlg">
      <div className="text-center mb-8">
        <h1 className="font-display font-bold text-3xl text-slate-800 dark:text-white">Welcome back</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-300/90 text-sm">Sign in to continue your bedtime stories</p>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <Icon name="x" className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block font-semibold text-sm text-slate-700 dark:text-slate-200 mb-2">
            Email address
          </label>
          <div className="flex items-center gap-3 rounded-3xl glass px-5 py-4">
            <Icon name="mail" className="w-5 h-5 text-blossomink/60 dark:text-cloud/60 shrink-0" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@email.com"
              className="flex-1 bg-transparent outline-none font-semibold text-slate-800 dark:text-white placeholder:opacity-40"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-semibold text-sm text-slate-700 dark:text-slate-200">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-blossomink dark:text-stellar hover:opacity-80 transition">
              Forgot password?
            </Link>
          </div>
          <div className="flex items-center gap-3 rounded-3xl glass px-5 py-4">
            <Icon name="lock" className="w-5 h-5 text-blossomink/60 dark:text-cloud/60 shrink-0" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="flex-1 bg-transparent outline-none font-semibold text-slate-800 dark:text-white placeholder:opacity-40"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="interactive w-full flex items-center justify-center gap-2 rounded-3xl py-4 text-[15px] bg-blossom text-blossomink dark:bg-stellar dark:text-midnight font-bold shadow-soft cta-glow disabled:opacity-50 disabled:pointer-events-none mt-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Signing in…
            </>
          ) : (
            <>Sign in <Icon name="arrow" className="w-5 h-5" /></>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-300/90">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-blossomink dark:text-stellar font-semibold hover:opacity-80 transition">
          Create one free
        </Link>
      </p>
    </GlassCard>
  )
}
