import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Icon } from '@/components/ui/icon'
import { GlassCard } from '@/components/ui/glass-card'
import { GENRES, PLANS } from '@/types'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, subscription_plan, subscription_status, subscription_period_end, stories_generated_this_month')
    .eq('id', user.id)
    .single()

  const { data: children } = await supabase
    .from('children')
    .select('id, name, age, gender')
    .eq('user_id', user.id)
    .eq('active', true)

  const { data: recentStories } = await supabase
    .from('stories')
    .select('id, title, genre, reading_length, created_at, child_name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(6)

  const { data: preferences } = await supabase
    .from('story_preferences')
    .select('child_id, delivery_time, active, children(name)')
    .eq('active', true)

  const plan = (profile?.subscription_plan ?? 'free') as keyof typeof PLANS
  const planInfo = PLANS[plan]
  const storiesThisMonth = profile?.stories_generated_this_month ?? 0
  const firstName = profile?.full_name?.split(' ')[0] ?? 'friend'

  const GENRE_TONES: Record<string, string> = {
    forest: 'from-lavender/70 to-cloud/60',
    space: 'from-cloud/70 to-blossom/60',
    dragon: 'from-blossom/70 to-cloud/60',
    ninja: 'from-blossom/70 to-lavender/60',
    fairy: 'from-lavender/70 to-blossom/60',
    ocean: 'from-cloud/70 to-lavender/60',
  }

  return (
    <div className="max-w-6xl mx-auto view-enter">
      {/* ── Greeting ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-800 dark:text-white tracking-tight">
            Good evening, <span className="text-dreamy">{firstName}</span>! 🌙
          </h1>
          <p className="mt-1.5 text-slate-500 dark:text-slate-300/90">Here&apos;s your story archive and tonight&apos;s lineup.</p>
        </div>
        <Link
          href="/stories"
          className="interactive inline-flex items-center justify-center gap-2 rounded-3xl px-6 py-3 text-[15px] bg-blossom text-blossomink dark:bg-stellar dark:text-midnight font-bold shadow-soft cta-glow shrink-0"
        >
          <Icon name="sparkle" className="w-5 h-5" /> Generate story
        </Link>
      </div>

      {/* ── Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <GlassCard className="p-5 flex items-center gap-4">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-blossom/60 dark:bg-stellar/15 text-blossomink dark:text-stellar shrink-0">
            <Icon name="book" className="w-6 h-6" />
          </span>
          <div>
            <div className="font-display font-bold text-2xl leading-none text-slate-800 dark:text-white">
              {storiesThisMonth}<span className="text-base text-slate-500 dark:text-slate-400 font-normal ml-1">/ {planInfo.stories_per_month}</span>
            </div>
            <div className="text-xs font-semibold opacity-55 mt-0.5">Stories this month</div>
          </div>
        </GlassCard>
        <GlassCard className="p-5 flex items-center gap-4">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-cloud/70 dark:bg-cloud/15 text-slate-600 dark:text-cloud shrink-0">
            <Icon name="user" className="w-6 h-6" />
          </span>
          <div>
            <div className="font-display font-bold text-2xl leading-none text-slate-800 dark:text-white">
              {children?.length ?? 0}<span className="text-base text-slate-500 dark:text-slate-400 font-normal ml-1">/ {planInfo.max_children}</span>
            </div>
            <div className="text-xs font-semibold opacity-55 mt-0.5">Child profiles</div>
          </div>
        </GlassCard>
        <GlassCard className="p-5 flex items-center gap-4">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-stellar/40 dark:bg-stellar/15 text-slate-700 dark:text-stellar shrink-0">
            <Icon name="sparkle" className="w-6 h-6" />
          </span>
          <div>
            <div className="font-display font-bold text-xl leading-none text-slate-800 dark:text-white">{planInfo.name}</div>
            <div className="text-xs font-semibold opacity-55 mt-0.5">
              {profile?.subscription_status === 'active' ? 'Active' : (profile?.subscription_status ?? 'Free plan')}
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* ── Stories + children ────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Child profiles */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <Icon name="user" className="w-5 h-5 text-blossomink dark:text-stellar" /> Children
              </h2>
              <Link href="/children" className="text-xs font-semibold text-blossomink dark:text-stellar hover:opacity-80 transition flex items-center gap-1">
                Manage <Icon name="chevron" className="w-3.5 h-3.5 -rotate-90" />
              </Link>
            </div>
            {children && children.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {children.map((child, i) => {
                  const tones = ['from-blossom to-lavender', 'from-cloud to-lavender', 'from-lavender to-blossom']
                  return (
                    <div key={child.id} className="flex items-center gap-2.5 glass rounded-2xl pl-1.5 pr-4 py-1.5 border border-white/60 dark:border-white/10">
                      <span className={`grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br ${tones[i % tones.length]} text-white font-bold text-sm`}>
                        {child.name[0]}
                      </span>
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-white leading-none">{child.name}</div>
                        <div className="text-xs opacity-55 font-semibold">{child.age} yrs</div>
                      </div>
                    </div>
                  )
                })}
                <Link href="/children/new" className="interactive grid place-items-center w-12 h-12 rounded-3xl glass text-blossomink dark:text-stellar border border-dashed border-blossom/50 dark:border-stellar/30" aria-label="Add child">
                  <Icon name="plus" className="w-5 h-5" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-3xl mb-3">👶</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No child profiles yet</p>
                <Link href="/children/new" className="interactive inline-flex items-center gap-2 rounded-3xl px-5 py-2.5 text-sm bg-blossom/70 dark:bg-stellar/15 text-blossomink dark:text-stellar font-bold">
                  <Icon name="plus" className="w-4 h-4" /> Add your first child
                </Link>
              </div>
            )}
          </GlassCard>

          {/* Delivery schedule */}
          {preferences && preferences.length > 0 && (
            <GlassCard className="p-5">
              <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                <Icon name="clock" className="w-5 h-5 text-blossomink dark:text-stellar" /> Delivery schedule
              </h2>
              <div className="space-y-2.5">
                {preferences.map(pref => {
                  const childData = pref.children
                  const child = (Array.isArray(childData) ? (childData[0] as { name: string } | undefined) ?? null : childData as { name: string } | null)
                  return (
                    <div key={pref.child_id} className="flex items-center justify-between rounded-2xl bg-white/50 dark:bg-white/5 border border-white/50 dark:border-white/10 px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{child?.name ?? 'Child'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Every evening</p>
                      </div>
                      <span className="font-display font-bold text-blossomink dark:text-stellar">{pref.delivery_time ?? '20:00'}</span>
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          )}

          {/* Story archive */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                <Icon name="book" className="w-5 h-5 text-blossomink dark:text-stellar" /> Story archive
              </h2>
              <Link href="/stories" className="text-sm font-semibold text-blossomink dark:text-stellar hover:opacity-80 transition">
                View all
              </Link>
            </div>
            {recentStories && recentStories.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {recentStories.map(story => {
                  const genreData = GENRES.find(g => g.id === story.genre)
                  const tone = GENRE_TONES[story.genre] ?? 'from-lavender/70 to-cloud/60'
                  return (
                    <GlassCard key={story.id} className="overflow-hidden interactive group">
                      <div className={`relative h-28 bg-gradient-to-br ${tone} grid place-items-center overflow-hidden`}>
                        <div className="absolute inset-0 opacity-30" style={{ background: 'repeating-linear-gradient(135deg, rgba(255,255,255,.18) 0 10px, transparent 10px 20px)' }} />
                        <span className="text-4xl relative">{genreData?.emoji ?? '📖'}</span>
                        <span className="absolute bottom-2 right-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/85 text-slate-700">{story.reading_length} min</span>
                      </div>
                      <div className="p-3">
                        <h4 className="font-display font-semibold text-[14px] leading-snug text-slate-800 dark:text-white line-clamp-2">{story.title}</h4>
                        <div className="text-xs font-semibold opacity-50 mt-1">{formatDate(story.created_at)}</div>
                        <div className="mt-3 flex gap-2">
                          <Link href={`/stories/${story.id}`} className="interactive flex-1 inline-flex items-center justify-center gap-1 rounded-2xl py-1.5 text-xs bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-200 font-semibold border border-white/60 dark:border-white/10">
                            <Icon name="play" className="w-3.5 h-3.5" /> Read
                          </Link>
                          <Link href={`/api/stories/${story.id}/pdf`} className="interactive flex-1 inline-flex items-center justify-center gap-1 rounded-2xl py-1.5 text-xs bg-blossom text-blossomink dark:bg-stellar dark:text-midnight font-bold shadow-soft">
                            <Icon name="download" className="w-3.5 h-3.5" /> PDF
                          </Link>
                        </div>
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            ) : (
              <GlassCard className="py-12 text-center">
                <p className="text-5xl mb-4">📚</p>
                <p className="font-display font-bold text-xl text-slate-800 dark:text-white mb-2">No stories yet</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Your bedtime stories will appear here</p>
                <Link href="/stories" className="interactive inline-flex items-center gap-2 rounded-3xl px-6 py-3 text-sm bg-blossom text-blossomink dark:bg-stellar dark:text-midnight font-bold shadow-soft cta-glow">
                  <Icon name="sparkle" className="w-4 h-4" /> Generate first story
                </Link>
              </GlassCard>
            )}
          </div>
        </div>

        {/* ── Settings sidebar ──────────────────────── */}
        <div className="space-y-5">
          <GlassCard className="p-6">
            <h2 className="font-display font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Icon name="gear" className="w-5 h-5 text-blossomink dark:text-stellar" /> Settings
            </h2>

            {/* Plan card */}
            <div className="rounded-3xl p-4 mb-4 bg-gradient-to-br from-blossom/50 to-lavender/40 dark:from-stellar/10 dark:to-cloud/5 border border-white/50 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider opacity-60">Current plan</div>
                  <div className="font-display font-bold text-lg text-slate-800 dark:text-white">{planInfo.name}</div>
                </div>
                <span className="grid place-items-center w-10 h-10 rounded-2xl bg-white/70 dark:bg-white/10 text-blossomink dark:text-stellar">
                  <Icon name="star" className="w-5 h-5 fill-current" />
                </span>
              </div>
              <Link
                href="/settings"
                className="interactive mt-3 w-full inline-flex items-center justify-center gap-2 rounded-3xl py-2.5 text-sm bg-slate-800 text-white dark:bg-white dark:text-midnight font-bold shadow-soft"
              >
                Manage billing <Icon name="arrow" className="w-4 h-4" />
              </Link>
              {profile?.subscription_period_end && (
                <p className="text-xs opacity-55 mt-2 text-center">Renews {formatDate(profile.subscription_period_end)}</p>
              )}
            </div>

            <div className="border-t border-white/30 dark:border-white/10 pt-4 space-y-3">
              <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid place-items-center w-8 h-8 rounded-xl bg-lavender/50 dark:bg-white/5 text-blossomink dark:text-cloud">
                    <Icon name="gear" className="w-[18px] h-[18px]" />
                  </span>
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">Account</span>
                </div>
                <Link href="/settings" className="text-xs font-semibold text-blossomink dark:text-stellar hover:opacity-80 transition flex items-center gap-1">
                  Edit <Icon name="chevron" className="w-3 h-3 -rotate-90" />
                </Link>
              </div>
              <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid place-items-center w-8 h-8 rounded-xl bg-lavender/50 dark:bg-white/5 text-blossomink dark:text-cloud">
                    <Icon name="user" className="w-[18px] h-[18px]" />
                  </span>
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">Children</span>
                </div>
                <Link href="/children" className="text-xs font-semibold text-blossomink dark:text-stellar hover:opacity-80 transition flex items-center gap-1">
                  {children?.length ?? 0} added <Icon name="chevron" className="w-3 h-3 -rotate-90" />
                </Link>
              </div>
            </div>
          </GlassCard>

          {plan === 'free' && (
            <GlassCard className="p-6 text-center">
              <span className="grid place-items-center w-12 h-12 rounded-2xl bg-blossom/60 dark:bg-stellar/15 text-blossomink dark:text-stellar mx-auto mb-3">
                <Icon name="sparkle" className="w-6 h-6" />
              </span>
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">Upgrade plan</h3>
              <p className="text-sm opacity-60 mt-1 mb-4">Daily stories, premium layouts &amp; more.</p>
              <Link href="/settings" className="interactive w-full inline-flex items-center justify-center rounded-3xl py-3 text-sm bg-blossom text-blossomink dark:bg-stellar dark:text-midnight font-bold shadow-soft cta-glow">
                View plans
              </Link>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}
