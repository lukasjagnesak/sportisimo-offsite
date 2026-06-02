import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ceník — DreamTales',
  description: 'Vyberte plán, který nejlépe odpovídá vaší rodině. Začněte zdarma a pohádky na dobrou noc pro vaše dítě.',
}

const plans = [
  {
    id: 'free',
    name: 'Zdarma',
    price: '€0',
    period: 'navždy',
    description: 'Ideální pro vyzkoušení',
    color: 'from-slate-600 to-slate-800',
    accent: 'border-slate-400',
    features: [
      '3 pohádky za měsíc',
      '1 profil dítěte',
      '15 minut čtení',
      'Všechny žánry',
      'PDF ke stažení',
    ],
    missing: [
      'Denní automatické doručení',
      'Email s PDF přílohou',
      'Delší pohádky (30/45 min)',
      'Více profilů dětí',
    ],
    cta: 'Začít zdarma',
    ctaHref: '/register',
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '€4.99',
    period: 'měsíčně',
    annualPrice: '€49.99/rok',
    description: 'Pro rodiny s jedním dítětem',
    color: 'from-purple-600 to-purple-900',
    accent: 'border-purple-400',
    features: [
      '1 pohádka každý den',
      '1 profil dítěte',
      '15 a 30 minut čtení',
      'Všechny žánry a témata',
      'Krásné PDF s grafikou',
      'Email každý večer',
      'Vaše dítě jako hrdina příběhu',
      'Přátelé a rodiče v pohádce',
    ],
    missing: [
      '45minutové pohádky',
      'Více profilů dětí',
    ],
    cta: 'Vybrat Starter',
    ctaHref: '/register?plan=starter',
    popular: true,
    badge: 'Nejoblíbenější',
  },
  {
    id: 'family',
    name: 'Family',
    price: '€7.99',
    period: 'měsíčně',
    annualPrice: '€59.99/rok (ušetříte 37%)',
    description: 'Pro rodiny s více dětmi',
    color: 'from-amber-500 to-orange-700',
    accent: 'border-amber-400',
    features: [
      '3 pohádky každý den',
      'Až 3 profily dětí',
      'Všechny délky (15, 30, 45 min)',
      'Všechny žánry a témata',
      'Krásné PDF s grafikou',
      'Individuální doručení pro každé dítě',
      'Každé dítě jako hrdina vlastního příběhu',
      'Přizpůsobené každému dítěti zvlášť',
      'Prioritní podpora',
    ],
    missing: [],
    cta: 'Vybrat Family',
    ctaHref: '/register?plan=family',
    popular: false,
    badge: 'Nejlepší hodnota',
  },
]

const faq = [
  {
    q: 'Jak funguje bezplatný plán?',
    a: 'Bezplatný plán zahrnuje 3 pohádky za měsíc, které si můžete vygenerovat kdykoli. Pohádky jsou dostupné ke stažení jako PDF v aplikaci.',
  },
  {
    q: 'Mohu plán kdykoli zrušit?',
    a: 'Ano, předplatné můžete zrušit kdykoli v nastavení účtu. Přístup máte až do konce zaplaceného období.',
  },
  {
    q: 'Jaké platební metody přijímáte?',
    a: 'Přijímáme všechny hlavní platební karty (Visa, Mastercard), SEPA převody, iDEAL, Sofort a další EU platební metody prostřednictvím Stripe.',
  },
  {
    q: 'Kde jsou moje data uložena?',
    a: 'Veškerá data jsou uložena v EU (Frankfurt). Dodržujeme GDPR a data vašich dětí zpracováváme minimálně — pouze jméno a věk pro generování pohádek.',
  },
  {
    q: 'Mohu pohádky tisknout?',
    a: 'Ano! Každá pohádka je v krásném A4 PDF formátu, který je optimalizován pro tisk. PDF máte přiloženo přímo v emailu.',
  },
  {
    q: 'Jak AI vytváří pohádky?',
    a: 'Používáme nejpokročilejší AI model Claude od Anthropic, který je trénován na tisících pohádek a příběhů. Každá pohádka je originální a přizpůsobená jménu, věku a preferencím vašeho dítěte.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0d0d1a]">
      {/* Header */}
      <div className="py-20 text-center px-4">
        <div className="inline-block bg-purple-900/30 border border-purple-500/30 rounded-full px-4 py-1.5 text-sm text-purple-300 mb-6">
          💫 Vyzkoušejte zdarma — bez kreditní karty
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Jednoduché ceny pro každou rodinu
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Začněte s bezplatným plánem nebo odemkněte plnou magii každodenních pohádek.
          Žádné skryté poplatky.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border ${plan.accent} ${plan.popular ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0d0d1a]' : ''} overflow-hidden`}
            >
              {plan.badge && (
                <div className={`absolute top-0 left-0 right-0 bg-gradient-to-r ${plan.color} py-1.5 text-center text-xs font-bold text-white uppercase tracking-widest`}>
                  {plan.badge}
                </div>
              )}

              <div className={`bg-gradient-to-br ${plan.color} p-6 ${plan.badge ? 'pt-10' : ''}`}>
                <h2 className="text-xl font-bold text-white mb-1">{plan.name}</h2>
                <p className="text-white/70 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/60">/{plan.period}</span>
                </div>
                {plan.annualPrice && (
                  <p className="text-white/60 text-xs mt-1">{plan.annualPrice}</p>
                )}
              </div>

              <div className="bg-slate-900 p-6">
                <Link
                  href={plan.ctaHref}
                  className={`block w-full py-3 text-center rounded-lg font-semibold transition-all mb-6 ${
                    plan.popular
                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  {plan.cta}
                </Link>

                <div className="space-y-2.5">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <span className="text-green-400 flex-shrink-0">✓</span>
                      {f}
                    </div>
                  ))}
                  {plan.missing.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <span className="flex-shrink-0">—</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trial info */}
        <div className="mt-10 text-center">
          <p className="text-slate-400 text-sm">
            Všechny placené plány mají <strong className="text-white">7denní zkušební dobu zdarma</strong>.
            Kreditní karta je vyžadována při aktivaci zkušební doby.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 pb-24">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Časté dotazy</h2>
        <div className="space-y-4">
          {faq.map((item, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">{item.q}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pb-24 px-4">
        <h2 className="text-3xl font-bold text-white mb-4">
          Připraveni začít kouzlit?
        </h2>
        <p className="text-slate-400 mb-8">
          První pohádka zdarma za méně než 2 minuty.
        </p>
        <Link
          href="/register"
          className="inline-block bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all hover:scale-105"
        >
          Vygenerovat první pohádku →
        </Link>
      </div>
    </div>
  )
}
