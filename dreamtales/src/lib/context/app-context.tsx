'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

export const REGIONS = [
  { code: 'us', label: 'United States', flag: '🇺🇸', sym: '$', cur: 'USD', t2: '9.99', t3: '14.99' },
  { code: 'ca', label: 'Canada', flag: '🇨🇦', sym: 'CA$', cur: 'CAD', t2: '13.99', t3: '19.99' },
  { code: 'uk', label: 'United Kingdom', flag: '🇬🇧', sym: '£', cur: 'GBP', t2: '8.99', t3: '12.99' },
  { code: 'eu', label: 'European Union', flag: '🇪🇺', sym: '€', cur: 'EUR', t2: '9.99', t3: '14.99' },
  { code: 'cz', label: 'Czech Republic', flag: '🇨🇿', sym: 'Kč', cur: 'CZK', t2: '229', t3: '349' },
  { code: 'sk', label: 'Slovakia', flag: '🇸🇰', sym: '€', cur: 'EUR', t2: '9.99', t3: '14.99' },
]

const DICT = {
  nav: { login: 'Login / Dashboard', home: 'Home', create: 'Create story', dashboard: 'Dashboard' },
  cta: { create: 'Create a Free Story Now', start: 'Start the magic', back: 'Back', next: 'Continue', finish: "Send tonight's story" },
  hero: {
    badge: 'Trusted by 40,000+ bedtimes',
    title: 'Turn Your Child Into the Hero of Their Own Bedtime Story.',
    title2: 'Every Night in Your Inbox.',
    sub: 'Personalized, gently-narrated tales that arrive as a beautiful PDF booklet — right at bedtime, every single night.',
    note: 'No credit card needed · First story is free',
    preview: "Tonight's booklet",
  },
  proof: { title: 'Loved by sleepy families everywhere', sub: 'Real words from parents who finally got their evenings back.' },
  how: {
    title: 'How the magic works',
    sub: 'Three calm steps. Then you simply tuck them in.',
    s1t: 'Personalize', s1d: 'Enter their name, age and choose their companions for the journey.',
    s2t: 'Pick a Theme', s2d: 'Select from our magical universe of 50+ hand-crafted themes.',
    s3t: 'Sleep Soundly', s3d: 'A custom PDF lands in your inbox at exactly the right bedtime.',
    step: 'Step',
  },
  pricing: {
    title: 'Gentle plans for every family',
    sub: 'Cancel anytime. Every plan keeps bedtime calm.',
    mo: '/ month', pop: 'Most loved',
    t1n: 'Magical Trial', t1d: '1 customizable story, sent instantly (watermarked).',
    t2n: 'Bedtime Regular', t2d: '1 child profile · a daily story at your set time · 15-minute length · standard layouts.',
    t3n: 'Family Premium', t3d: 'Up to 3 children · choose 15/30/45 min · custom bedtimes · premium layouts · generate on-demand.',
    pick: 'Choose plan', free: 'Start for free',
  },
  faq: {
    title: 'Questions, gently answered',
    q1: 'Is the content always age-appropriate?', a1: 'Every story is filtered for the age you choose and reviewed for calming, kind, screen-free bedtime content.',
    q2: 'Where is DreamyTales available?', a2: 'DreamyTales is crafted for families across the world with pricing shown in your local currency.',
    q3: 'When exactly does the story arrive?', a3: 'Right at the bedtime you pick. Premium families can set different times per child or generate a story on demand.',
    q4: 'Can I cancel anytime?', a4: "Of course. Manage or cancel in one click from your dashboard's billing portal — no emails, no friction.",
    q5: "Do you store my child's data?", a5: "Only what's needed to write the story. Profiles are private to your account and never sold. You can delete them anytime.",
  },
  footer: { tag: 'Sweet dreams, delivered.', rights: '© 2026 DreamyTales. Made for cozy nights.' },
  onb: {
    title: "Let's craft tonight's story",
    s1: 'The Hero', s2: 'Theme Universe', s3: 'Timing & Length', s4: 'Secure Delivery',
    nameL: "Child's name", nameP: 'e.g. Liam',
    ageL: 'Age group',
    ageToddler: 'Toddler', ageTodSub: '1–3 yrs', agePre: 'Preschool', agePreSub: '3–5 yrs', ageSchool: 'School', ageSchoolSub: '6–9 yrs',
    genderL: 'For correct grammar',
    gGirl: 'Girl', gBoy: 'Boy', gNeutral: 'Neutral',
    compL: 'Add companions', compHint: 'Optional — who joins the adventure?',
    themeL: 'Choose a theme universe',
    catAction: 'Action & Heroes', catFantasy: 'Fantasy & Magic', catAnimals: 'Animals', catMachines: 'Machines & Science', catCalm: 'Emotional & Calming',
    lenL: 'Story length', timeL: 'Delivery time', timeHint: "We'll send the booklet right on time, every evening.",
    min: 'min',
    emailT: "Where should we send tonight's magic?",
    emailSub: "We'll deliver the PDF booklet to this inbox at bedtime.",
    emailP: 'you@email.com',
    google: 'Continue with Google', or: 'or',
    summary: 'Story preview',
    done: 'Your magic is on its way!',
    doneSub: "is the hero of tonight's tale. The booklet will arrive at",
    gotoDash: 'Go to my dashboard',
  },
  dash: {
    greeting: 'Good evening',
    sub: "Here's tonight's lineup and your story archive.",
    addChild: 'Add child',
    tonight: "Tonight's story", scheduled: 'Scheduled for', generateNow: 'Generate now', ready: 'Ready to send',
    archive: 'Story archive', stories: 'stories', read: 'Read online', download: 'Download PDF', newStory: 'New story',
    settings: 'Account & settings',
    plan: 'Current plan', manageBilling: 'Manage billing', billingHint: 'Update card, invoices or cancel via secure portal.',
    delivery: 'Delivery time', appearance: 'Appearance', day: 'Day', night: 'Night',
    langPref: 'Story language', region: 'Region & currency', upgrade: 'Upgrade plan',
    streak: 'night streak', booklets: 'booklets made', minutes: 'minutes read',
  },
}

function resolvePath(obj: Record<string, unknown>, path: string): string | undefined {
  const result = path.split('.').reduce<unknown>((o, k) => {
    if (o == null || typeof o !== 'object') return undefined
    return (o as Record<string, unknown>)[k]
  }, obj)
  return typeof result === 'string' ? result : undefined
}

interface AppContextValue {
  dark: boolean
  setDark: (v: boolean) => void
  region: string
  setRegion: (v: string) => void
  t: (key: string) => string
  REGIONS: typeof REGIONS
  reg: typeof REGIONS[0]
  currency: string
}

const AppCtx = createContext<AppContextValue | null>(null)

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDarkState] = useState(false)
  const [region, setRegion] = useState('eu')

  function setDark(v: boolean) {
    setDarkState(v)
    if (typeof document !== 'undefined') {
      if (v) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    }
  }

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) setDark(true)
  }, [])

  const t = useCallback((key: string): string => {
    const v = resolvePath(DICT as unknown as Record<string, unknown>, key)
    return v ?? key
  }, [])

  const reg = REGIONS.find(r => r.code === region) ?? REGIONS[0]

  return (
    <AppCtx.Provider value={{ dark, setDark, region, setRegion, t, REGIONS, reg, currency: reg.sym }}>
      {children}
    </AppCtx.Provider>
  )
}
