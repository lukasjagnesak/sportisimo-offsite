'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GlassCard } from '@/components/ui/glass-card'
import { Icon } from '@/components/ui/icon'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim() || name.trim().length < 2) { setError('Name must be at least 2 characters.'); return }
    if (!email) { setError('Please enter your email address.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!/[a-zA-Z]/.test(password)) { setError('Password must contain at least one letter.'); return }
    if (!/[0-9]/.test(password)) { setError('Password must contain at least one number.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name.trim() } },
      })
      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('This email is already registered. Please sign in.')
        } else {
          setError('Registration failed. Please try again.')
        }
      } else {
        setRegisteredEmail(email)
        setSuccess(true)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <GlassCard className="p-8 shadow-softlg text-center">
        <div className="grid place-items-center w-20 h-20 rounded-full bg-gradient-to-br from-blossom to-lavender dark:from-stellar/30 dark:to-cloud/20 mx-auto mb-5 shadow-softlg" style={{ animation: 'floaty 5s ease-in-out infinite' }}>
          <Icon name="mail" className="w-10 h-10 text-blossomink dark:text-stellar" />
        </div>
        <h2 className="font-display font-bold text-3xl text-slate-800 dark:text-white mb-3">Check your inbox!</h2>
        <p className="text-slate-500 dark:text-slate-300/90 mb-2">We sent a confirmation email to</p>
        <p className="font-bold text-blossomink dark:text-stellar mb-4">{registeredEmail}</p>
        <p className="text-sm text-slate-500 dark:text-slate-300/90 leading-relaxed mb-8">
          Click the link in the email to complete registration and start creating your first bedtime story.
        </p>
        <Link
          href="/login"
          className="interactive inline-flex items-center justify-center gap-2 rounded-3xl px-8 py-4 text-[15px] bg-blossom text-blossomink dark:bg-stellar dark:text-midnight font-bold shadow-soft cta-glow"
        >
          <Icon name="arrowL" className="w-5 h-5" /> Back to sign in
        </Link>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-8 shadow-softlg">
      <div className="text-center mb-8">
        <h1 className="font-display font-bold text-3xl text-slate-800 dark:text-white">Create your account</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-300/90 text-sm">First story is free — no credit card needed</p>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <Icon name="x" className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold text-sm text-slate-700 dark:text-slate-200 mb-2">Full name</label>
          <div className="flex items-center gap-3 rounded-3xl glass px-5 py-4">
            <Icon name="user" className="w-5 h-5 text-blossomink/60 dark:text-cloud/60 shrink-0" />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
              placeholder="Jane Doe"
              className="flex-1 bg-transparent outline-none font-semibold text-slate-800 dark:text-white placeholder:opacity-40"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-sm text-slate-700 dark:text-slate-200 mb-2">Email address</label>
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
          <label className="block font-semibold text-sm text-slate-700 dark:text-slate-200 mb-2">Password</label>
          <div className="flex items-center gap-3 rounded-3xl glass px-5 py-4">
            <Icon name="lock" className="w-5 h-5 text-blossomink/60 dark:text-cloud/60 shrink-0" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              className="flex-1 bg-transparent outline-none font-semibold text-slate-800 dark:text-white placeholder:opacity-40"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-sm text-slate-700 dark:text-slate-200 mb-2">Confirm password</label>
          <div className="flex items-center gap-3 rounded-3xl glass px-5 py-4">
            <Icon name="check" className="w-5 h-5 text-blossomink/60 dark:text-cloud/60 shrink-0" />
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
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
              Creating account…
            </>
          ) : (
            <>Create free account <Icon name="sparkle" className="w-5 h-5" /></>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-300/70">
        By creating an account you agree to our{' '}
        <Link href="/terms" className="text-blossomink dark:text-stellar hover:opacity-80 transition">Terms</Link>
        {' '}and{' '}
        <Link href="/privacy" className="text-blossomink dark:text-stellar hover:opacity-80 transition">Privacy Policy</Link>.
      </p>

      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-300/90">
        Already have an account?{' '}
        <Link href="/login" className="text-blossomink dark:text-stellar font-semibold hover:opacity-80 transition">
          Sign in
        </Link>
      </p>
    </GlassCard>
  )
}
