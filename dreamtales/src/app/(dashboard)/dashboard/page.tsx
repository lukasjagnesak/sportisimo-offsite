import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Users, Sparkles, Clock, ChevronRight, CalendarClock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { GENRES, PLANS } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, subscription_plan, subscription_status, subscription_period_end, stories_generated_this_month')
    .eq('id', user.id)
    .single()

  // Fetch children
  const { data: children } = await supabase
    .from('children')
    .select('id, name, age, gender')
    .eq('user_id', user.id)
    .eq('active', true)

  // Fetch recent stories (last 5)
  const { data: recentStories } = await supabase
    .from('stories')
    .select('id, title, genre, reading_length, created_at, child_name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch delivery schedules
  const { data: preferences } = await supabase
    .from('story_preferences')
    .select('child_id, delivery_time, active, children(name)')
    .eq('active', true)

  const plan = (profile?.subscription_plan ?? 'free') as keyof typeof PLANS
  const planInfo = PLANS[plan]
  const storiesThisMonth = profile?.stories_generated_this_month ?? 0
  const firstName = profile?.full_name?.split(' ')[0] ?? 'příteli'

  const statusBadge = {
    active: { label: 'Aktivní', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    trialing: { label: 'Zkušební', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    canceled: { label: 'Zrušeno', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
    past_due: { label: 'Po splatnosti', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    inactive: { label: 'Neaktivní', cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  }

  const subStatus = profile?.subscription_status ?? 'inactive'
  const badge = statusBadge[subStatus as keyof typeof statusBadge] ?? statusBadge.inactive

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-soft-white">
            Dobrý večer, <span className="text-gradient">{firstName}</span>! 🌙
          </h1>
          <p className="text-muted text-sm mt-1">Vítejte zpět ve světě kouzelných pohádek</p>
        </div>
        <Link
          href="/stories"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-semibold px-5 py-2.5 text-sm transition shadow-lg shadow-purple/30"
        >
          <Sparkles size={16} />
          Vygenerovat pohádku
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stories this month */}
        <div className="rounded-2xl border border-purple/20 bg-navy-mid/80 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <BookOpen size={18} className="text-violet-400" />
            </div>
            <span className="text-xs text-muted">tento měsíc</span>
          </div>
          <p className="text-3xl font-bold text-soft-white">
            {storiesThisMonth}
            <span className="text-base text-muted font-normal">/{planInfo.stories_per_month}</span>
          </p>
          <p className="text-sm text-muted mt-1">Pohádky vygenerovány</p>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 rounded-full bg-navy-light overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500 transition-all"
              style={{ width: `${Math.min(100, (storiesThisMonth / planInfo.stories_per_month) * 100)}%` }}
            />
          </div>
        </div>

        {/* Children count */}
        <div className="rounded-2xl border border-purple/20 bg-navy-mid/80 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Users size={18} className="text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-soft-white">
            {children?.length ?? 0}
            <span className="text-base text-muted font-normal">/{planInfo.max_children}</span>
          </p>
          <p className="text-sm text-muted mt-1">Profily dětí</p>
          {(children?.length ?? 0) === 0 && (
            <Link href="/children" className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition flex items-center gap-1">
              Přidat dítě <ChevronRight size={12} />
            </Link>
          )}
        </div>

        {/* Subscription */}
        <div className="rounded-2xl border border-purple/20 bg-navy-mid/80 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center">
              <Sparkles size={18} className="text-gold" />
            </div>
          </div>
          <p className="text-xl font-bold text-soft-white">{planInfo.name}</p>
          <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.cls}`}>
            {badge.label}
          </span>
          {profile?.subscription_period_end && (
            <p className="text-xs text-muted mt-2">
              Do {formatDate(profile.subscription_period_end)}
            </p>
          )}
          {plan === 'free' && (
            <Link href="/settings" className="mt-3 text-xs text-gold hover:text-gold-light transition flex items-center gap-1">
              Upgradovat <ChevronRight size={12} />
            </Link>
          )}
        </div>
      </div>

      {/* Recent stories + Delivery */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent stories */}
        <div className="lg:col-span-3 rounded-2xl border border-purple/20 bg-navy-mid/80">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-purple/10">
            <h2 className="font-semibold text-soft-white flex items-center gap-2">
              <BookOpen size={16} className="text-violet-400" />
              Poslední pohádky
            </h2>
            <Link href="/stories" className="text-xs text-violet-400 hover:text-violet-300 transition flex items-center gap-1">
              Všechny <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-purple/10">
            {recentStories && recentStories.length > 0 ? (
              recentStories.map((story) => {
                const genreData = GENRES.find((g) => g.id === story.genre)
                return (
                  <div key={story.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/3 transition group">
                    <div className="w-9 h-9 rounded-xl bg-purple/20 border border-purple/20 flex items-center justify-center text-lg shrink-0">
                      {genreData?.emoji ?? '📖'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-soft-white truncate">{story.title}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {story.child_name} · {story.reading_length} min · {formatDate(story.created_at)}
                      </p>
                    </div>
                    <Clock size={14} className="text-muted/50 shrink-0 hidden group-hover:block" />
                  </div>
                )
              })
            ) : (
              <div className="px-6 py-10 text-center">
                <p className="text-4xl mb-3">📚</p>
                <p className="text-sm text-muted">Zatím žádné pohádky</p>
                <Link href="/stories" className="mt-3 inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition">
                  <Sparkles size={12} />
                  Vytvořit první pohádku
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Delivery schedule */}
        <div className="lg:col-span-2 rounded-2xl border border-purple/20 bg-navy-mid/80">
          <div className="px-5 pt-5 pb-4 border-b border-purple/10">
            <h2 className="font-semibold text-soft-white flex items-center gap-2">
              <CalendarClock size={16} className="text-blue-400" />
              Plán doručení
            </h2>
          </div>
          <div className="p-5 space-y-3">
            {preferences && preferences.length > 0 ? (
              preferences.map((pref) => {
                const childData = pref.children
                const child = (Array.isArray(childData) ? (childData[0] as { name: string } | undefined) ?? null : childData as { name: string } | null)
                return (
                  <div
                    key={pref.child_id}
                    className="flex items-center justify-between rounded-xl bg-navy-light/50 border border-purple/15 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-soft-white">{child?.name ?? 'Dítě'}</p>
                      <p className="text-xs text-muted mt-0.5">Každý den</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-violet-300">{pref.delivery_time ?? '20:00'}</p>
                      <p className="text-xs text-muted">doručení</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-6 text-center">
                <p className="text-3xl mb-2">⏰</p>
                <p className="text-xs text-muted leading-relaxed">
                  Nastav čas doručení v profilu dítěte
                </p>
                <Link href="/children" className="mt-3 inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition">
                  Nastavit <ChevronRight size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
