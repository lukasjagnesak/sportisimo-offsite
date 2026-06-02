'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import {
  Sparkles,
  Star,
  Mail,
  Check,
  ArrowRight,
  BookOpen,
  Moon,
  Wand2,
  ChevronRight,
  Quote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { GENRES } from '@/types'

/* ─── Animation helpers ───────────────────────────────────── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

function useInView(threshold = 0.15) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [inView, setInView] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/* ─── Stars background ────────────────────────────────────── */

const STAR_CONFIG = [
  { top: '8%',  left: '12%', size: 2,   delay: '0s',    dur: '2.1s' },
  { top: '14%', left: '35%', size: 1.5, delay: '0.4s',  dur: '3.2s' },
  { top: '6%',  left: '58%', size: 2.5, delay: '1s',    dur: '1.8s' },
  { top: '22%', left: '72%', size: 1.5, delay: '0.2s',  dur: '2.6s' },
  { top: '18%', left: '88%', size: 2,   delay: '0.8s',  dur: '3s'   },
  { top: '40%', left: '5%',  size: 1.5, delay: '1.2s',  dur: '2.3s' },
  { top: '35%', left: '92%', size: 2,   delay: '0.6s',  dur: '1.9s' },
  { top: '55%', left: '20%', size: 1,   delay: '1.5s',  dur: '2.8s' },
  { top: '48%', left: '50%', size: 2,   delay: '0.3s',  dur: '2.2s' },
  { top: '62%', left: '78%', size: 1.5, delay: '0.9s',  dur: '3.1s' },
  { top: '72%', left: '8%',  size: 1,   delay: '0.1s',  dur: '2.5s' },
  { top: '80%', left: '42%', size: 2,   delay: '1.3s',  dur: '1.7s' },
  { top: '85%', left: '65%', size: 1.5, delay: '0.5s',  dur: '2.9s' },
  { top: '90%', left: '90%', size: 1,   delay: '0.7s',  dur: '2.4s' },
  { top: '28%', left: '28%', size: 1,   delay: '1.8s',  dur: '3.3s' },
  { top: '3%',  left: '80%', size: 3,   delay: '0s',    dur: '2.7s' },
  { top: '50%', left: '97%', size: 1,   delay: '2s',    dur: '1.6s' },
  { top: '75%', left: '55%', size: 2,   delay: '1.1s',  dur: '3s'   },
]

function StarField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {STAR_CONFIG.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            top: s.top,
            left: s.left,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: s.delay,
            animationDuration: s.dur,
          }}
        />
      ))}
      {/* Shooting star */}
      <span
        className="absolute w-24 h-px bg-gradient-to-r from-transparent via-white to-transparent animate-shoot opacity-70"
        style={{ top: '18%', left: '0' }}
        aria-hidden
      />
    </div>
  )
}

/* ─── Story preview card ──────────────────────────────────── */

function StoryPreviewCard() {
  return (
    <div className="relative w-72 lg:w-80">
      {/* Glow underneath */}
      <div className="absolute inset-0 rounded-2xl bg-purple/30 blur-2xl scale-105" />

      <div className="relative glass rounded-2xl p-5 shadow-2xl border border-purple/30 animate-float">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🐉</span>
          <div>
            <p className="text-xs text-muted">Pohádka pro Tomáše</p>
            <p className="text-sm font-semibold text-soft-white">Drak a kouzelný les</p>
          </div>
          <Badge variant="gold" className="ml-auto text-xs">Nová</Badge>
        </div>

        {/* Story lines */}
        <div className="space-y-2 mb-4">
          <p className="text-xs text-soft-white/80 leading-relaxed">
            Jednoho večera, když hvězdy začínaly svítit nad kouzelným lesem,
            malý drak Tomáš objevil...
          </p>
          <div className="h-2 bg-purple/20 rounded-full w-full" />
          <div className="h-2 bg-purple/20 rounded-full w-4/5" />
          <div className="h-2 bg-purple/20 rounded-full w-5/6" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-purple/20">
          <div className="flex items-center gap-1.5">
            <Moon className="h-3.5 w-3.5 text-gold" />
            <span className="text-xs text-muted">15 minut čtení</span>
          </div>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map((n) => (
              <Star key={n} className="h-3 w-3 fill-gold text-gold" />
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-4 -right-4 bg-gold text-navy text-xs font-bold rounded-full px-3 py-1.5 shadow-lg shadow-gold/40">
        ✨ Dnešní pohádka
      </div>
    </div>
  )
}

/* ─── Section wrapper ─────────────────────────────────────── */

function Section({
  id,
  className,
  children,
}: {
  id?: string
  className?: string
  children: React.ReactNode
}) {
  const { ref, inView } = useInView()
  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  )
}

/* ─── How it works data ───────────────────────────────────── */

const STEPS = [
  {
    number: '01',
    icon: <BookOpen className="h-6 w-6" />,
    title: 'Vytvořte profil dítěte',
    description:
      'Zadejte jméno, věk, pohlaví a jména přátel nebo sourozenců. Pohádky tak budou opravdu osobní.',
    color: 'from-purple to-purple-light',
  },
  {
    number: '02',
    icon: <Wand2 className="h-6 w-6" />,
    title: 'Vyberte žánr pohádky',
    description:
      'Superhrdinové, draci, vesmír nebo české pohádky? Vyberte z desítek žánrů a AI vytvoří unikátní příběh.',
    color: 'from-purple-light to-gold',
  },
  {
    number: '03',
    icon: <Mail className="h-6 w-6" />,
    title: 'Každý večer pohádka na e-mail',
    description:
      'Nastavte čas doručení a každý večer dorazí čerstvá pohádka přímo do vaší schránky, připravená ke čtení.',
    color: 'from-gold to-gold-light',
  },
]

/* ─── Pricing data ────────────────────────────────────────── */

const PLANS = [
  {
    name: 'Zdarma',
    price: '0 €',
    period: 'navždy',
    badge: null,
    description: 'Vyzkoušejte DreamTales bez rizika.',
    features: [
      '3 pohádky za měsíc',
      '1 dítě',
      'Všechny žánry',
      'Doručení e-mailem',
    ],
    missing: ['Neomezené pohádky', '3 děti', 'PDF ke stažení'],
    cta: 'Začít zdarma',
    href: '/registrace',
    variant: 'outline' as const,
  },
  {
    name: 'Starter',
    price: '4,99 €',
    period: 'měsíc',
    badge: 'Nejoblíbenější',
    description: 'Pohádka každý večer pro jedno dítě.',
    features: [
      'Pohádka každý den',
      '1 dítě',
      'Všechny žánry',
      'Doručení e-mailem',
      'PDF ke stažení',
      'Vlastní délka pohádky',
    ],
    missing: ['3 děti'],
    cta: 'Vybrat Starter',
    href: '/registrace?plan=starter',
    variant: 'default' as const,
    highlight: true,
  },
  {
    name: 'Family',
    price: '7,99 €',
    period: 'měsíc',
    badge: 'Nejlepší hodnota',
    description: 'Pohádky pro celou rodinu každý večer.',
    features: [
      'Pohádka každý den',
      'Až 3 děti',
      'Všechny žánry',
      'Doručení e-mailem',
      'PDF ke stažení',
      'Vlastní délka pohádky',
      'Prioritní podpora',
    ],
    missing: [],
    cta: 'Vybrat Family',
    href: '/registrace?plan=family',
    variant: 'outline' as const,
  },
]

/* ─── Testimonials ────────────────────────────────────────── */

const TESTIMONIALS = [
  {
    name: 'Martina K.',
    location: 'Praha',
    avatar: '👩',
    text: 'Dcera se každý večer těší na novou pohádku. Příběhy jsou nádherně napsané a ona v nich vždy najde sama sebe jako hrdinku. Absolutně doporučuji každé rodině!',
    stars: 5,
  },
  {
    name: 'Jakub M.',
    location: 'Brno',
    avatar: '👨',
    text: 'Synovi (5 let) miluje pohádky o superhrdinech. DreamTales mu každý večer vygeneruje nový příběh, kde je on sám hlavním hrdinou. Usínání je teď radost pro celou rodinu.',
    stars: 5,
  },
  {
    name: 'Petra S.',
    location: 'Ostrava',
    avatar: '👩‍🦱',
    text: 'Mám tři děti a Family plán je naprostý poklad. Každé dostane svou pohádku v jejich oblíbeném žánru. Konečně způsob, jak děti nadchnout pro čtení!',
    stars: 5,
  },
]

/* ─── Genre display genres (first 12) ────────────────────── */

const FEATURED_GENRES = GENRES.slice(0, 12)

/* ══════════════════════════════════════════════════════════ */
/*  PAGE                                                      */
/* ══════════════════════════════════════════════════════════ */

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex flex-col overflow-hidden">

        {/* ─── HERO ────────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center justify-center bg-night overflow-hidden">
          <StarField />

          {/* Radial glow blobs */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple/20 blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-light/10 blur-[100px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-dark/10 blur-[150px]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-0">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">

              {/* Text */}
              <motion.div
                className="flex-1 text-center lg:text-left max-w-2xl"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 mb-6"
                >
                  <Sparkles className="h-3.5 w-3.5 text-gold" />
                  <span className="text-xs font-medium text-gold">Pohádky na dobrou noc vytvořené AI</span>
                </motion.div>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold leading-[1.1] tracking-tight mb-6">
                  Každý večer{' '}
                  <span className="text-shimmer">originální pohádka</span>{' '}
                  <br className="hidden sm:block" />
                  speciálně pro{' '}
                  <span className="italic text-gold">vaše dítě</span>
                </h1>

                <p className="text-lg sm:text-xl text-muted leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                  DreamTales každý večer vygeneruje personalizovanou pohádku,
                  kde je vaše dítě hlavním hrdinou. Doručení e-mailem přesně
                  na dobrou noc.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                  <Button variant="gold" size="xl" asChild>
                    <Link href="/registrace" className="gap-2">
                      Začít zdarma
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="xl" asChild>
                    <Link href="#how-it-works" className="gap-2">
                      <BookOpen className="h-5 w-5" />
                      Jak to funguje
                    </Link>
                  </Button>
                </div>

                {/* Social proof */}
                <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-muted">
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-2">
                      {['👩', '👨', '👩‍🦱'].map((a, i) => (
                        <span
                          key={i}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-navy-mid border border-purple/30 text-sm"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                    <span className="text-soft-white/70 text-xs">2 400+ šťastných rodin</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} className="h-3.5 w-3.5 fill-gold text-gold" />
                    ))}
                    <span className="ml-1 text-xs text-soft-white/70">4.9 / 5</span>
                  </div>
                </div>
              </motion.div>

              {/* Story preview card */}
              <motion.div
                className="flex-shrink-0"
                initial={{ opacity: 0, x: 40, rotate: 3 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{ delay: 0.3, duration: 0.9, ease: 'easeOut' }}
              >
                <StoryPreviewCard />
              </motion.div>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy to-transparent pointer-events-none" />

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <span className="text-xs text-muted/60">Scroll</span>
            <motion.div
              className="w-px h-8 bg-gradient-to-b from-purple/60 to-transparent"
              animate={{ scaleY: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        </section>

        {/* ─── HOW IT WORKS ─────────────────────────────────── */}
        <Section id="how-it-works" className="relative py-24 lg:py-32 bg-navy">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeUp} className="text-center mb-16">
              <Badge variant="default" className="mb-4">Jak to funguje</Badge>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-soft-white mb-4">
                Pohádka za 3 jednoduché kroky
              </h2>
              <p className="text-muted text-lg max-w-xl mx-auto">
                Nastavení trvá méně než 2 minuty. Pak se staráme o všechno my.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-px bg-gradient-to-r from-purple/30 via-gold/40 to-purple/30" />

              {STEPS.map((step, i) => (
                <motion.div key={i} variants={scaleIn} className="relative">
                  <Card className="h-full hover:border-purple/40 hover:shadow-purple/20 hover:shadow-2xl transition-all duration-300 group">
                    <CardContent className="p-8">
                      {/* Number */}
                      <div className="text-6xl font-display font-bold text-purple/15 mb-4 leading-none select-none">
                        {step.number}
                      </div>
                      {/* Icon */}
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} text-navy mb-4 shadow-lg`}>
                        {step.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-soft-white mb-3 group-hover:text-gradient transition-all">
                        {step.title}
                      </h3>
                      <p className="text-muted leading-relaxed text-sm">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── GENRES ───────────────────────────────────────── */}
        <Section className="py-24 lg:py-32 relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-navy-light" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-purple/5 blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeUp} className="text-center mb-16">
              <Badge variant="default" className="mb-4">Žánry pohádek</Badge>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-soft-white mb-4">
                Přes 50 žánrů pro každé dítě
              </h2>
              <p className="text-muted text-lg max-w-xl mx-auto">
                Od klasických pohádek po moderní dobrodružství – vyberte, co vaše dítě miluje.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
            >
              {FEATURED_GENRES.map((genre) => (
                <motion.div key={genre.id} variants={scaleIn}>
                  <div className="group glass rounded-xl p-3 text-center hover:border-purple/50 hover:bg-purple/10 transition-all duration-200 cursor-pointer glow-border">
                    <span className="text-3xl mb-2 block">{genre.emoji}</span>
                    <p className="text-xs font-medium text-soft-white/90 leading-tight">{genre.name_cs}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="text-center mt-10">
              <p className="text-muted text-sm mb-4">A dalších {GENRES.length - 12} žánrů...</p>
              <Button variant="outline" size="lg" asChild>
                <Link href="/registrace" className="gap-2">
                  Zobrazit všechny žánry
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </Section>

        {/* ─── PRICING ──────────────────────────────────────── */}
        <Section id="pricing" className="py-24 lg:py-32 bg-navy relative">
          <div className="absolute bottom-0 left-0 right-0 h-1 divider-glow" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeUp} className="text-center mb-16">
              <Badge variant="gold" className="mb-4">Ceny</Badge>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-soft-white mb-4">
                Transparentní ceny, žádná překvapení
              </h2>
              <p className="text-muted text-lg max-w-xl mx-auto">
                Začněte zdarma, rozšiřte kdykoliv. Zrušení bez starostí.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              {PLANS.map((plan, i) => (
                <motion.div key={i} variants={scaleIn} className="relative">
                  {plan.highlight && (
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-purple via-purple-light to-gold opacity-60 blur-sm" />
                  )}
                  <Card
                    className={`relative h-full flex flex-col ${
                      plan.highlight
                        ? 'border-purple/60 bg-navy-mid shadow-2xl shadow-purple/20'
                        : 'border-purple/20 bg-navy-mid/60'
                    }`}
                  >
                    <CardContent className="p-7 flex flex-col h-full">
                      {/* Badge */}
                      {plan.badge && (
                        <Badge
                          variant={plan.highlight ? 'gold' : 'default'}
                          className="self-start mb-4"
                        >
                          {plan.badge}
                        </Badge>
                      )}

                      <h3 className="text-2xl font-display font-semibold text-soft-white mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-muted mb-4">{plan.description}</p>

                      {/* Price */}
                      <div className="mb-6">
                        <span className={`text-5xl font-bold ${plan.highlight ? 'text-gradient' : 'text-soft-white'}`}>
                          {plan.price}
                        </span>
                        <span className="text-muted text-sm ml-2">/ {plan.period}</span>
                      </div>

                      {/* Features */}
                      <ul className="space-y-2.5 mb-6 flex-1">
                        {plan.features.map((f, j) => (
                          <li key={j} className="flex items-center gap-2.5 text-sm text-soft-white/80">
                            <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                        {plan.missing.map((f, j) => (
                          <li key={`m-${j}`} className="flex items-center gap-2.5 text-sm text-muted/40 line-through">
                            <Check className="h-4 w-4 text-muted/30 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      <Button
                        variant={plan.highlight ? 'gold' : plan.variant}
                        size="lg"
                        className="w-full"
                        asChild
                      >
                        <Link href={plan.href}>{plan.cta}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <motion.p variants={fadeUp} className="text-center text-muted text-sm mt-8">
              Ceny jsou bez DPH. Předplatné lze kdykoliv zrušit.
            </motion.p>
          </div>
        </Section>

        {/* ─── TESTIMONIALS ─────────────────────────────────── */}
        <Section className="py-24 lg:py-32 bg-navy-light relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-purple/5 blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeUp} className="text-center mb-16">
              <Badge variant="default" className="mb-4">Recenze</Badge>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-soft-white mb-4">
                Co říkají rodiče
              </h2>
              <p className="text-muted text-lg max-w-xl mx-auto">
                Tisíce rodin si každý večer užívají personalizované pohádky.
              </p>
            </motion.div>

            <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <motion.div key={i} variants={scaleIn}>
                  <Card className="h-full hover:border-purple/40 transition-all duration-300 group">
                    <CardContent className="p-7 flex flex-col h-full">
                      {/* Stars */}
                      <div className="flex gap-0.5 mb-4">
                        {Array.from({ length: t.stars }).map((_, j) => (
                          <Star key={j} className="h-4 w-4 fill-gold text-gold" />
                        ))}
                      </div>

                      {/* Quote icon */}
                      <Quote className="h-6 w-6 text-purple/40 mb-3" />

                      <p className="text-soft-white/80 leading-relaxed text-sm flex-1 mb-6 italic">
                        "{t.text}"
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-3 pt-4 border-t border-purple/20">
                        <span className="text-2xl">{t.avatar}</span>
                        <div>
                          <p className="text-sm font-semibold text-soft-white">{t.name}</p>
                          <p className="text-xs text-muted">{t.location}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </Section>

        {/* ─── FINAL CTA ────────────────────────────────────── */}
        <Section className="py-24 lg:py-36 relative overflow-hidden bg-navy">
          {/* Animated background */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy-mid/40 to-navy" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-purple/15 blur-[120px] animate-pulse-glow" />
          </div>
          <StarField />

          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div variants={fadeUp}>
              <span className="text-5xl mb-6 block animate-float">✨</span>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-soft-white mb-6 leading-tight">
                Začněte psát{' '}
                <span className="text-shimmer">magické příběhy</span>{' '}
                dnes večer
              </h2>
              <p className="text-xl text-muted mb-10 leading-relaxed">
                Vaše dítě čeká na svého oblíbeného hrdinu. Zaregistrujte se
                zdarma a první pohádka dorazí ještě dnes.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Button variant="gold" size="xl" asChild>
                  <Link href="/registrace" className="gap-2">
                    <Sparkles className="h-5 w-5" />
                    Začít zdarma nyní
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link href="/prihlasit">Přihlásit se</Link>
                </Button>
              </div>

              <p className="text-muted/60 text-sm">
                Bez kreditní karty · Zrušení kdykoliv · 3 pohádky zdarma
              </p>
            </motion.div>
          </div>
        </Section>

        {/* ─── FOOTER ───────────────────────────────────────── */}
        <footer className="border-t border-purple/20 bg-navy py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" />
                <span className="font-display text-lg font-semibold text-soft-white">DreamTales</span>
              </div>

              <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted">
                <Link href="/o-nas" className="hover:text-soft-white transition-colors">O nás</Link>
                <Link href="/blog" className="hover:text-soft-white transition-colors">Blog</Link>
                <Link href="/podpora" className="hover:text-soft-white transition-colors">Podpora</Link>
                <Link href="/ochrana-soukromi" className="hover:text-soft-white transition-colors">Ochrana soukromí</Link>
                <Link href="/podminky" className="hover:text-soft-white transition-colors">Podmínky</Link>
              </nav>

              <p className="text-muted/50 text-xs">
                © {new Date().getFullYear()} DreamTales · dreamtales.eu
              </p>
            </div>
          </div>
        </footer>

      </main>
    </>
  )
}
