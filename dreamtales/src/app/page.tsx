'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { GlassCard } from '@/components/ui/glass-card'
import { Header } from '@/components/layout/header'
import { Logo } from '@/components/layout/header'
import { useApp } from '@/lib/context/app-context'

/* ── Meteor / falling stars ─────────────────────────────────── */
type Meteor = {
  id: string; dir: 'left' | 'right'; top: number; left: number
  ang: number; len: number; thick: number; travel: number; dur: number; head: number
}
function makeMeteor(): Meteor {
  const bright = Math.random() < 0.3
  const dir: 'left' | 'right' = Math.random() < 0.5 ? 'right' : 'left'
  return {
    id: Math.random().toString(36).slice(2),
    dir,
    top: -12 + Math.random() * 50,
    left: dir === 'right' ? -18 + Math.random() * 38 : 78 + Math.random() * 38,
    ang: 16 + Math.random() * 13,
    len: 110 + Math.random() * (bright ? 200 : 130),
    thick: bright ? 2.4 : 1.5,
    travel: 360 + Math.random() * 460,
    dur: 2.2 + Math.random() * 2.4,
    head: bright ? 5 : 3.5,
  }
}

function FallingStars() {
  const { dark } = useApp()
  const [meteors, setMeteors] = useState<Meteor[]>([])

  useEffect(() => {
    if (!dark) { setMeteors([]); return }
    let timer: ReturnType<typeof setTimeout>
    let alive = true
    function schedule(first: boolean) {
      const wait = first ? 1500 + Math.random() * 4000 : 5000 + Math.random() * 10000
      timer = setTimeout(() => {
        if (!alive) return
        setMeteors(cur => {
          if (cur.length >= 2) return cur
          const m = makeMeteor()
          setTimeout(() => {
            if (alive) setMeteors(c => c.filter(x => x.id !== m.id))
          }, m.dur * 1000 + 120)
          return [...cur, m]
        })
        schedule(false)
      }, wait)
    }
    schedule(true)
    return () => { alive = false; clearTimeout(timer) }
  }, [dark])

  if (!dark) return null
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }} aria-hidden>
      {meteors.map(m => (
        <span key={m.id} className="absolute" style={{ top: `${m.top}%`, left: `${m.left}%`, transform: `${m.dir === 'left' ? 'scaleX(-1) ' : ''}rotate(${m.ang}deg)` }}>
          <span className="block rounded-full" style={{
            width: `${m.len}px`, height: `${m.thick}px`,
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(191,200,255,0.45) 55%, rgba(255,255,255,0.95) 100%)',
            boxShadow: '0 0 6px 1px rgba(199,210,255,0.45)',
            ['--mtravel' as string]: `${m.travel}px`,
            animation: `meteor ${m.dur}s cubic-bezier(.55,.08,.9,.5) forwards`,
          }}>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full" style={{
              width: `${m.head}px`, height: `${m.head}px`, background: '#fff',
              boxShadow: '0 0 8px 2px rgba(255,255,255,0.9), 0 0 16px 5px rgba(160,180,255,0.5)',
            }} />
          </span>
        </span>
      ))}
    </div>
  )
}

/* ── BookletMock ────────────────────────────────────────────── */
function BookletMock() {
  return (
    <div className="relative" style={{ animation: 'floaty 6s ease-in-out infinite' }}>
      <div className="absolute -right-5 top-6 bottom-6 w-[88%] rounded-3xl bg-white/40 dark:bg-white/5 blur-[1px]" />
      <div className="absolute -left-4 top-10 bottom-2 w-[80%] rounded-3xl bg-lavender/50 dark:bg-night/70" />
      <GlassCard className="relative p-5 sm:p-6 w-[300px] sm:w-[360px] shadow-softlg">
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-blossom/70 dark:bg-stellar/15 text-blossomink dark:text-stellar">
            <Icon name="sparkle" className="w-3.5 h-3.5" /> PDF
          </span>
          <span className="text-xs font-semibold opacity-60">Tonight&apos;s booklet</span>
        </div>
        <div className="relative rounded-2xl overflow-hidden h-44 sm:h-52 mb-4 select-none"
          style={{ background: 'linear-gradient(180deg,#0a1026 0%,#1a1747 42%,#3a2a5e 74%,#6b4172 100%)' }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(80% 55% at 78% 20%, rgba(255,233,168,.18), transparent 60%)' }} />
          <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: 'radial-gradient(120% 90% at 50% 125%, rgba(255,196,224,.45), transparent 68%)' }} />
          <div className="absolute" style={{ top: '16px', right: '24px', width: '44px', height: '44px', borderRadius: '9999px', background: 'radial-gradient(circle at 36% 34%, #fffdf3, #ffe7a3)', boxShadow: '0 0 24px 7px rgba(255,231,163,.5)' }}>
            <span className="absolute rounded-full" style={{ width: '11px', height: '11px', top: '9px', left: '22px', background: 'rgba(214,178,120,.35)' }} />
            <span className="absolute rounded-full" style={{ width: '7px', height: '7px', top: '24px', left: '12px', background: 'rgba(214,178,120,.3)' }} />
          </div>
          {[[14,30,2.2,0],[24,52,1.6,1.1],[40,18,2,0.5],[58,40,1.4,1.6],[12,70,1.6,0.8],[30,84,2,2.2],[68,16,1.8,1.3],[50,66,1.5,0.3]].map((s, i) => (
            <span key={i} className="absolute rounded-full bg-white" style={{ left: `${s[1]}%`, top: `${s[0]}%`, width: `${s[2]}px`, height: `${s[2]}px`, boxShadow: '0 0 5px rgba(255,255,255,.8)', animation: `twinkle ${3 + s[3]}s ease-in-out infinite`, animationDelay: `${s[3]}s` }} />
          ))}
          {[[-2,18,42],[12,15,34],[26,20,52],[42,16,40],[55,21,56],[72,17,44],[86,20,50]].map((p, i) => (
            <span key={`f${i}`} className="absolute" style={{ bottom: 0, left: `${p[0]}%`, width: 0, height: 0, borderLeft: `${p[1]}px solid transparent`, borderRight: `${p[1]}px solid transparent`, borderBottom: `${p[2]}px solid #0b0a1f` }} />
          ))}
          <div className="absolute inset-x-0 bottom-0 h-3" style={{ background: '#0b0a1f' }} />
          <div className="absolute inset-x-0 bottom-0 px-4 pb-3.5 pt-8 text-center" style={{ background: 'linear-gradient(180deg, transparent, rgba(8,8,24,.55) 60%)' }}>
            <div className="text-[8px] font-bold uppercase tracking-[0.22em] text-stellar/90 mb-1">A DreamyTales bedtime tale</div>
            <div className="font-display font-bold text-white leading-tight text-[19px]" style={{ textShadow: '0 2px 10px rgba(0,0,0,.5)' }}>Liam &amp; the<br />Whispering Forest</div>
          </div>
        </div>
        <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-300/90" style={{ textWrap: 'pretty' } as React.CSSProperties}>
          Tonight, Liam tiptoes into a forest where the trees hum gentle lullabies and a sleepy fox leads the way home…
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold opacity-70">
          <Icon name="clock" className="w-4 h-4" /> 15 min · <Icon name="heart" className="w-4 h-4" /> calming
        </div>
      </GlassCard>
      <div className="absolute -top-4 -left-3 text-stellar" style={{ animation: 'twinkle 3.5s ease-in-out infinite' }}>
        <Icon name="star" className="w-7 h-7 fill-current text-blossom dark:text-stellar" />
      </div>
      <div className="absolute -bottom-3 right-6" style={{ animation: 'twinkle 4.5s ease-in-out infinite', animationDelay: '1s' }}>
        <Icon name="sparkle" className="w-6 h-6 text-cloud dark:text-cloud" />
      </div>
    </div>
  )
}

/* ── Reviews carousel ───────────────────────────────────────── */
const REVIEWS = [
  { n: 'Emma R.', loc: '🇺🇸 Austin, TX', t: 'Liam (4) fell asleep in 15 minutes listening to his ninja adventure! We do it every single night now.', c: 'from-blossom to-lavender', img: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { n: 'Daniel W.', loc: '🇨🇦 Toronto, ON', t: 'My daughter loves being the hero. Finally calm, screen-free evenings in our house.', c: 'from-cloud to-lavender', img: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { n: 'Olivia H.', loc: '🇬🇧 Manchester', t: 'The PDF arrives exactly at 7:30pm. It became our cosiest little ritual.', c: 'from-lavender to-blossom', img: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { n: 'Marcus P.', loc: '🇺🇸 Denver, CO', t: 'Two kids, two heroes, zero bedtime battles. Worth every cent of the Premium plan.', c: 'from-cloud to-blossom', img: 'https://randomuser.me/api/portraits/men/51.jpg' },
  { n: 'Aisha R.', loc: '🇬🇧 London', t: 'The calming themes are genius — no more overstimulation right before sleep.', c: 'from-blossom to-cloud', img: 'https://randomuser.me/api/portraits/women/65.jpg' },
  { n: 'Chloe T.', loc: '🇨🇦 Vancouver, BC', t: 'Beautiful illustrations and a story made just for her. The kids cannot wait for bedtime.', c: 'from-lavender to-cloud', img: 'https://randomuser.me/api/portraits/women/90.jpg' },
]

function ReviewCard({ r }: { r: typeof REVIEWS[0] }) {
  return (
    <GlassCard className="p-6 w-[300px] sm:w-[340px] shrink-0 flex flex-col">
      <div className="flex items-center gap-1 text-stellar mb-3">
        {[0,1,2,3,4].map(i => <Icon key={i} name="star" className="w-[18px] h-[18px] fill-current" />)}
      </div>
      <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200" style={{ textWrap: 'pretty' } as React.CSSProperties}>&ldquo;{r.t}&rdquo;</p>
      <div className="mt-auto pt-5 flex items-center gap-3">
        <span className={`grid place-items-center w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br ${r.c} text-white font-bold shadow-soft ring-2 ring-white/70 dark:ring-white/10`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={r.img} alt={r.n} loading="lazy" className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        </span>
        <div>
          <div className="font-bold text-sm text-slate-800 dark:text-white">{r.n}</div>
          <div className="text-xs opacity-60 font-semibold">{r.loc}</div>
        </div>
      </div>
    </GlassCard>
  )
}

/* ── Section title ──────────────────────────────────────────── */
function SectionTitle({ kicker, title, sub, center = true }: { kicker?: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''} mb-10 sm:mb-14`}>
      {kicker && (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-lavender/70 dark:bg-white/5 text-blossomink dark:text-cloud mb-4">
          <Icon name="sparkle" className="w-3.5 h-3.5" /> {kicker}
        </span>
      )}
      <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl leading-tight text-slate-800 dark:text-white tracking-tight" style={{ textWrap: 'balance' } as React.CSSProperties}>{title}</h2>
      {sub && <p className="mt-4 text-lg text-slate-500 dark:text-slate-300/90" style={{ textWrap: 'pretty' } as React.CSSProperties}>{sub}</p>}
    </div>
  )
}

/* ── FAQ ────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  { q: 'Is the content always age-appropriate?', a: 'Every story is filtered for the age you choose and reviewed for calming, kind, screen-free bedtime content.' },
  { q: 'Where is DreamyTales available?', a: 'DreamyTales is crafted for families across the world with pricing shown in your local currency.' },
  { q: 'When exactly does the story arrive?', a: 'Right at the bedtime you pick. Premium families can set different times per child or generate a story on demand.' },
  { q: 'Can I cancel anytime?', a: "Of course. Manage or cancel in one click from your dashboard's billing portal — no emails, no friction." },
  { q: "Do you store my child's data?", a: "Only what's needed to write the story. Profiles are private to your account and never sold. You can delete them anytime." },
]

/* ── Main landing page ──────────────────────────────────────── */
export default function LandingPage() {
  const { t, reg } = useApp()
  const [faqOpen, setFaqOpen] = useState<number>(0)

  const tiers = [
    { price: '0', popular: false, ic: 'sparkle' as const, cta: 'Start for free', feats: ['1 customizable story', 'Sent instantly', 'Watermarked PDF', 'Delivered to your inbox'] },
    { price: reg.t2, popular: true, ic: 'moon' as const, cta: 'Choose plan', feats: ['1 child profile', 'Daily story at your time', '15-minute length', 'Standard layouts'] },
    { price: reg.t3, popular: false, ic: 'star' as const, cta: 'Choose plan', feats: ['Up to 3 children', 'Choose 15 / 30 / 45 min', 'Custom bedtime hours', 'Premium layouts', 'Generate on-demand'] },
  ]
  const tierNames = ['Magical Trial', 'Bedtime Regular', 'Family Premium']
  const tierDescs = [
    '1 customizable story, sent instantly (watermarked).',
    '1 child profile · a daily story at your set time · 15-minute length · standard layouts.',
    'Up to 3 children · choose 15/30/45 min · custom bedtimes · premium layouts · generate on-demand.',
  ]

  return (
    <>
      <Header />
      <main className="view-enter">

        {/* ── Hero ────────────────────────────────────────── */}
        <section className="relative pt-8 sm:pt-14 pb-16">
          <FallingStars />
          <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full glass mb-6">
                <span className="flex -space-x-1.5">
                  {[0,1,2].map(i => <span key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-blossom to-cloud ring-2 ring-white dark:ring-night" />)}
                </span>
                {t('hero.badge')}
              </span>
              <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl leading-tight tracking-tight text-slate-800 dark:text-white max-w-2xl" style={{ textWrap: 'balance' } as React.CSSProperties}>
                {t('hero.title')}{' '}
                <br /><span className="text-dreamy" style={{ fontWeight: 500 }}>{t('hero.title2')}</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-slate-500 dark:text-slate-300/90 max-w-xl mx-auto lg:mx-0" style={{ textWrap: 'pretty' } as React.CSSProperties}>
                {t('hero.sub')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 lg:justify-start justify-center">
                <Link
                  href="/register"
                  className="interactive inline-flex items-center justify-center gap-2 rounded-3xl px-8 py-4 text-lg bg-blossom text-blossomink dark:bg-stellar dark:text-midnight font-bold shadow-soft cta-glow"
                >
                  {t('cta.create')}
                  <Icon name="arrow" className="w-5 h-5" />
                </Link>
                <span className="text-sm font-semibold opacity-60 flex items-center gap-2">
                  <Icon name="check" className="w-4 h-4" /> {t('hero.note')}
                </span>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <BookletMock />
            </div>
          </div>
        </section>

        {/* ── Social proof ────────────────────────────────── */}
        <section className="py-16 overflow-hidden">
          <SectionTitle kicker="★★★★★ 4.9 / 5" title={t('proof.title')} sub={t('proof.sub')} />
          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 z-10 bg-gradient-to-r from-mist dark:from-midnight to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 z-10 bg-gradient-to-l from-mist dark:from-midnight to-transparent" />
            <div className="flex gap-5 w-max" style={{ animation: 'marquee 38s linear infinite' }}>
              {[...REVIEWS, ...REVIEWS].map((r, i) => <ReviewCard key={i} r={r} />)}
            </div>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────── */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <SectionTitle kicker={t('how.title')} title={t('how.title')} sub={t('how.sub')} />
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { ic: 'user' as const, tone: 'from-blossom/70 to-lavender/60', t: t('how.s1t'), d: t('how.s1d') },
                { ic: 'wand' as const, tone: 'from-cloud/70 to-lavender/60', t: t('how.s2t'), d: t('how.s2d') },
                { ic: 'moon' as const, tone: 'from-lavender/70 to-blossom/60', t: t('how.s3t'), d: t('how.s3d') },
              ].map((s, i) => (
                <GlassCard key={i} className="relative p-7 interactive" style={{ animation: 'floaty 7s ease-in-out infinite', animationDelay: `${i * 0.6}s` }}>
                  <span className="absolute top-6 right-6 font-display font-bold text-5xl text-slate-200/70 dark:text-white/10">{i + 1}</span>
                  <span className={`grid place-items-center w-16 h-16 rounded-3xl bg-gradient-to-br ${s.tone} dark:ring-1 dark:ring-white/10 shadow-soft mb-5`}>
                    <Icon name={s.ic} className="w-8 h-8 text-blossomink dark:text-white" />
                  </span>
                  <div className="text-xs font-bold uppercase tracking-wider text-blossomink/70 dark:text-cloud mb-1">{t('how.step')} {i + 1}</div>
                  <h3 className="font-display font-bold text-2xl text-slate-800 dark:text-white mb-2">{s.t}</h3>
                  <p className="text-slate-500 dark:text-slate-300/90 leading-relaxed">{s.d}</p>
                </GlassCard>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/register" className="interactive inline-flex items-center justify-center gap-2 rounded-3xl px-8 py-4 text-lg bg-blossom text-blossomink dark:bg-stellar dark:text-midnight font-bold shadow-soft cta-glow">
                {t('cta.create')} <Icon name="arrow" className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────── */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <SectionTitle kicker={t('pricing.mo')} title={t('pricing.title')} sub={t('pricing.sub')} />
            <div className="grid md:grid-cols-3 gap-5 items-stretch">
              {tiers.map((tier, i) => {
                const pop = tier.popular
                return (
                  <div key={i} className={`relative rounded-3xl ${pop ? 'md:-mt-4 md:mb-0' : ''}`}>
                    {pop && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full bg-blossom text-blossomink dark:bg-stellar dark:text-midnight shadow-soft">
                        <Icon name="heart" className="w-3.5 h-3.5 fill-current" /> {t('pricing.pop')}
                      </span>
                    )}
                    <GlassCard className={`h-full p-7 flex flex-col ${pop ? 'ring-2 ring-blossom dark:ring-stellar shadow-softlg' : ''}`}>
                      <span className={`grid place-items-center w-12 h-12 rounded-2xl mb-4 ${pop ? 'bg-blossom dark:bg-stellar text-blossomink dark:text-midnight' : 'bg-lavender/60 dark:bg-white/5 text-blossomink dark:text-cloud'}`}>
                        <Icon name={tier.ic} className="w-6 h-6" />
                      </span>
                      <h3 className="font-display font-bold text-2xl text-slate-800 dark:text-white">{tierNames[i]}</h3>
                      <div className="mt-3 flex items-end gap-1">
                        <span className="font-display font-bold text-2xl text-slate-500 dark:text-slate-300 mb-1">{reg.sym}</span>
                        <span className="font-display font-bold text-4xl text-slate-800 dark:text-white">{tier.price}</span>
                        {tier.price !== '0' && <span className="text-sm font-semibold opacity-60 ml-1 mb-1">{t('pricing.mo')}</span>}
                      </div>
                      <p className="mt-3 text-sm text-slate-500 dark:text-slate-300/90 leading-relaxed">{tierDescs[i]}</p>
                      <ul className="mt-5 space-y-2.5 flex-1">
                        {tier.feats.map((f, j) => (
                          <li key={j} className="flex items-start gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-200">
                            <span className={`grid place-items-center w-5 h-5 rounded-full shrink-0 mt-0.5 ${pop ? 'bg-blossom/70 dark:bg-stellar/20 text-blossomink dark:text-stellar' : 'bg-lavender/60 dark:bg-white/10 text-blossomink dark:text-cloud'}`}>
                              <Icon name="check" className="w-3 h-3" stroke={2.6} />
                            </span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/register"
                        className={`interactive mt-6 w-full inline-flex items-center justify-center rounded-3xl px-6 py-3 text-[15px] font-bold transition-all ${pop ? 'bg-blossom text-blossomink dark:bg-stellar dark:text-midnight shadow-soft cta-glow' : 'bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-white/60 dark:border-white/10 backdrop-blur'}`}
                      >
                        {tier.cta}
                      </Link>
                    </GlassCard>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────── */}
        <section className="py-16">
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <SectionTitle kicker="FAQ" title={t('faq.title')} />
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => {
                const isOpen = faqOpen === i
                return (
                  <GlassCard key={i} className="overflow-hidden">
                    <button
                      onClick={() => setFaqOpen(isOpen ? -1 : i)}
                      className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <span className="font-display font-semibold text-lg text-slate-800 dark:text-white">{item.q}</span>
                      <span className={`grid place-items-center w-8 h-8 rounded-full bg-lavender/60 dark:bg-white/10 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
                        <Icon name="plus" className="w-4 h-4 text-blossomink dark:text-cloud" />
                      </span>
                    </button>
                    <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                      <div className="overflow-hidden">
                        <p className="px-6 pb-5 text-slate-500 dark:text-slate-300/90 leading-relaxed" style={{ textWrap: 'pretty' } as React.CSSProperties}>{item.a}</p>
                      </div>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────── */}
        <footer className="relative mt-24">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <GlassCard className="px-6 sm:px-10 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div className="flex flex-col items-center sm:items-start gap-3">
                <Logo />
                <p className="font-display text-lg text-slate-600 dark:text-slate-300">Sweet dreams, delivered.</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {[
                  { label: 'Home', href: '/' },
                  { label: 'Create story', href: '/register' },
                  { label: 'Dashboard', href: '/dashboard' },
                ].map(link => (
                  <Link key={link.href} href={link.href} className="interactive inline-flex items-center justify-center rounded-3xl px-4 py-2 text-sm bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-200 font-semibold border border-white/60 dark:border-white/10 backdrop-blur">
                    {link.label}
                  </Link>
                ))}
              </div>
            </GlassCard>
            <p className="text-center text-xs font-semibold opacity-50 mt-6">© 2026 DreamyTales. Made for cozy nights.</p>
          </div>
        </footer>

      </main>
    </>
  )
}
