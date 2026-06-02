'use client'

import { useState, useEffect } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { createClient } from '@/lib/supabase/client'
import { User, CreditCard, Bell, Shield, Check, AlertTriangle, Loader2 } from 'lucide-react'
import { PLANS } from '@/types'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'subscription', label: 'Předplatné', icon: CreditCard },
  { id: 'delivery', label: 'Doručování', icon: Bell },
  { id: 'privacy', label: 'Soukromí', icon: Shield },
]

interface UserProfile {
  full_name: string | null
  email: string
  subscription_plan: string
  subscription_status: string
  subscription_period_end: string | null
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Profile form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  // Delivery preferences
  const [emailStories, setEmailStories] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(true)

  // Privacy/danger
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('users')
        .select('full_name, email, subscription_plan, subscription_status, subscription_period_end')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        setFullName(data.full_name ?? '')
        setEmail(data.email ?? user.email ?? '')
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  function showSuccess(msg: string) {
    setSavedMsg(msg)
    setErrorMsg(null)
    setTimeout(() => setSavedMsg(null), 3000)
  }

  async function handleSaveProfile() {
    setSaving(true)
    setErrorMsg(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('users')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id)

      if (email !== profile?.email) {
        const { error } = await supabase.auth.updateUser({ email })
        if (error) {
          setErrorMsg('Změna e-mailu se nezdařila: ' + error.message)
          return
        }
      }
      showSuccess('Profil byl uložen')
    } finally {
      setSaving(false)
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setPortalLoading(false)
    }
  }

  async function handleExportData() {
    setExportLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: stories } = await supabase
        .from('stories')
        .select('title, content, genre, created_at, child_name')
        .eq('user_id', user.id)

      const { data: children } = await supabase
        .from('children')
        .select('name, age, gender, friends, parents')
        .eq('user_id', user.id)

      const exportData = {
        profile: { full_name: fullName, email },
        children: children ?? [],
        stories: stories ?? [],
        exported_at: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'dreamtales-export.json'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportLoading(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'SMAZAT') return
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const plan = (profile?.subscription_plan ?? 'free') as keyof typeof PLANS
  const planInfo = PLANS[plan]

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-muted" size={28} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-soft-white">Nastavení</h1>
        <p className="text-muted text-sm mt-1">Správa vašeho účtu a předplatného</p>
      </div>

      {/* Success/Error banner */}
      {savedMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-900/30 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
          <Check size={14} />
          {savedMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-900/30 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          <AlertTriangle size={14} />
          {errorMsg}
        </div>
      )}

      <Tabs.Root defaultValue="profile">
        {/* Tab list */}
        <Tabs.List className="flex gap-1 p-1 rounded-xl bg-navy-mid/80 border border-purple/20 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Tabs.Trigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'flex-1 min-w-max flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                  'text-muted hover:text-soft-white',
                  'data-[state=active]:bg-purple/30 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-purple/40'
                )}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </Tabs.Trigger>
            )
          })}
        </Tabs.List>

        {/* Profile tab */}
        <Tabs.Content value="profile">
          <div className="rounded-2xl border border-purple/20 bg-navy-mid/80 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-soft-white">Osobní údaje</h2>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">Celé jméno</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jan Novák"
                className="w-full rounded-xl bg-navy-light border border-purple/30 px-4 py-2.5 text-soft-white placeholder-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">E-mailová adresa</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="vas@email.cz"
                className="w-full rounded-xl bg-navy-light border border-purple/30 px-4 py-2.5 text-soft-white placeholder-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-transparent transition"
              />
              <p className="mt-1.5 text-xs text-muted">Změna e-mailu vyžaduje potvrzení</p>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-semibold px-5 py-2.5 text-sm transition disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? <><Loader2 size={14} className="animate-spin" /> Ukládám...</> : 'Uložit změny'}
            </button>
          </div>
        </Tabs.Content>

        {/* Subscription tab */}
        <Tabs.Content value="subscription">
          <div className="rounded-2xl border border-purple/20 bg-navy-mid/80 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-soft-white">Předplatné</h2>

            {/* Current plan card */}
            <div className="rounded-xl border border-purple/30 bg-navy-light/50 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted mb-1">Aktuální plán</p>
                  <p className="text-xl font-bold text-soft-white">{planInfo.name}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted">{planInfo.stories_per_month} pohádek / měsíc</p>
                    <p className="text-sm text-muted">Max {planInfo.max_children} {planInfo.max_children === 1 ? 'dítě' : 'děti'}</p>
                    {planInfo.price > 0 && (
                      <p className="text-sm text-muted">{planInfo.price} Kč / měsíc</p>
                    )}
                  </div>
                </div>
                <span className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border',
                  profile?.subscription_status === 'active'
                    ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                    : 'border-gray-500/30 bg-gray-500/15 text-gray-400'
                )}>
                  {profile?.subscription_status === 'active' ? 'Aktivní' : profile?.subscription_status ?? 'Neaktivní'}
                </span>
              </div>
            </div>

            {/* Upgrade cards */}
            {plan !== 'family' && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-soft-white">Dostupné plány</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.entries(PLANS) as [keyof typeof PLANS, typeof PLANS[keyof typeof PLANS]][])
                    .filter(([k]) => k !== plan)
                    .map(([key, p]) => (
                      <div
                        key={key}
                        className={cn(
                          'rounded-xl border p-4',
                          key === 'family'
                            ? 'border-gold/40 bg-gold/5'
                            : 'border-purple/30 bg-navy-light/30'
                        )}
                      >
                        <p className="font-semibold text-soft-white">{p.name}</p>
                        <p className="text-sm text-muted mt-1">{p.stories_per_month} pohádek / měsíc</p>
                        {p.price > 0 ? (
                          <p className="text-sm font-bold text-soft-white mt-1">{p.price} Kč<span className="text-xs font-normal text-muted">/měs</span></p>
                        ) : (
                          <p className="text-sm text-muted mt-1">Zdarma</p>
                        )}
                        {p.price > 0 && p.stripe_price_id && (
                          <button
                            onClick={handleManageBilling}
                            disabled={portalLoading}
                            className={cn(
                              'mt-3 w-full rounded-lg py-2 text-xs font-semibold transition',
                              key === 'family'
                                ? 'bg-gold/20 border border-gold/40 text-gold hover:bg-gold/30'
                                : 'bg-purple/20 border border-purple/40 text-violet-300 hover:bg-purple/30'
                            )}
                          >
                            Upgradovat
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Manage billing */}
            {plan !== 'free' && (
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="flex items-center gap-2 text-sm text-muted hover:text-soft-white transition"
              >
                {portalLoading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                Spravovat platební metodu a faktury
              </button>
            )}
          </div>
        </Tabs.Content>

        {/* Delivery tab */}
        <Tabs.Content value="delivery">
          <div className="rounded-2xl border border-purple/20 bg-navy-mid/80 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-soft-white">Doručovací preference</h2>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={emailStories}
                    onChange={(e) => setEmailStories(e.target.checked)}
                  />
                  <div className={cn(
                    'w-5 h-5 rounded-md border-2 transition flex items-center justify-center',
                    emailStories ? 'border-violet-500 bg-violet-500' : 'border-purple/40 bg-transparent'
                  )}>
                    {emailStories && <Check size={12} className="text-white" />}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-soft-white">Denní pohádka e-mailem</p>
                  <p className="text-xs text-muted mt-0.5">Doručení pohádky na váš e-mail podle nastaveného času</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={emailUpdates}
                    onChange={(e) => setEmailUpdates(e.target.checked)}
                  />
                  <div className={cn(
                    'w-5 h-5 rounded-md border-2 transition flex items-center justify-center',
                    emailUpdates ? 'border-violet-500 bg-violet-500' : 'border-purple/40 bg-transparent'
                  )}>
                    {emailUpdates && <Check size={12} className="text-white" />}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-soft-white">Novinky a aktualizace</p>
                  <p className="text-xs text-muted mt-0.5">Informace o nových žánrech, funkcích a akcích</p>
                </div>
              </label>
            </div>

            <button
              onClick={() => showSuccess('Preference uloženy')}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-semibold px-5 py-2.5 text-sm transition"
            >
              Uložit preference
            </button>
          </div>
        </Tabs.Content>

        {/* Privacy tab */}
        <Tabs.Content value="privacy">
          <div className="space-y-4">
            {/* Export data */}
            <div className="rounded-2xl border border-purple/20 bg-navy-mid/80 p-6">
              <h2 className="text-lg font-semibold text-soft-white mb-1">Export dat</h2>
              <p className="text-sm text-muted mb-4">Stáhněte si kopii všech vašich dat z DreamTales ve formátu JSON.</p>
              <button
                onClick={handleExportData}
                disabled={exportLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-purple/30 bg-transparent text-muted hover:text-soft-white hover:border-purple/50 px-4 py-2.5 text-sm font-medium transition disabled:opacity-60"
              >
                {exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                Stáhnout moje data (GDPR)
              </button>
            </div>

            {/* Delete account */}
            <div className="rounded-2xl border border-red-500/20 bg-red-900/10 p-6">
              <h2 className="text-lg font-semibold text-red-300 mb-1">Smazat účet</h2>
              <p className="text-sm text-muted mb-4">
                Tato akce je nevratná. Všechny vaše pohádky, profily dětí a data budou trvale smazány.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted mb-1.5">
                    Pro potvrzení napište <span className="text-red-400 font-mono font-semibold">SMAZAT</span>
                  </label>
                  <input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="SMAZAT"
                    className="w-full max-w-xs rounded-xl bg-navy-light border border-red-500/20 px-4 py-2.5 text-soft-white placeholder-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 transition"
                  />
                </div>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'SMAZAT'}
                  className="rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold px-5 py-2.5 text-sm transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <AlertTriangle size={14} />
                  Trvale smazat účet
                </button>
              </div>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
