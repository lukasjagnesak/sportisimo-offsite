# DreamTales — Roadmapa & Plán Implementace

## Přehled projektu

**Název:** DreamTales | dreamtales.eu  
**CZ sub-brand:** Pohádky Snů  
**Tagline:** "Každá noc, pohádka jen pro vaše dítě"  
**Cílový trh:** EU (primárně CZ/SK/PL), rodiče dětí 3–10 let  
**Monetizace:** Freemium subscription (Stripe, EU VAT-compliant)

---

## Název a brand analýza

### Název: DreamTales
- ✅ Mezinárodně srozumitelné (EN)
- ✅ Lehce vyslovitelné ve všech EU jazycích
- ✅ Popisuje produkt (Dream = sen, Tales = pohádky)
- ✅ Dostupná doména .eu
- ✅ Kompatibilní s SEO pro termíny "bedtime stories AI"

### Alternativní názvy (záloha):
- PohádkyAI.cz (only CZ market)
- NightStories.eu
- BedtimeMagic.eu
- TalePillow.eu

---

## Monetizační model

| Plán | Cena/měs | Cena/rok | Počet dětí | Pohádek/den | Délky |
|------|----------|----------|-----------|-------------|-------|
| Zdarma | €0 | — | 1 | 3/měsíc | 15 min |
| Starter | €4.99 | €49.99 | 1 | 1/den | 15,30 min |
| Family | €7.99 | €59.99 | 3 | 3/den | 15,30,45 min |

### GDPR kompliace (EU):
- Souhlas rodiče s emailem (double opt-in)
- Data dítěte minimalizována (jméno + věk, bez trackingu)
- Právo na výmaz dat (GDPR Art. 17)
- Uložení v EU (Supabase Frankfurt + Vercel Frankfurt)
- Žádná reklama, žádný behavioral tracking

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Jazyk:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI:** shadcn/ui komponenty (Radix UI)
- **Animace:** Framer Motion
- **Formuláře:** React Hook Form + Zod

### Backend
- **Runtime:** Next.js API Routes (serverless)
- **Databáze:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/heslo)
- **File storage:** Supabase Storage (PDF soubory)

### AI & Generování
- **Pohádky:** Anthropic Claude claude-opus-4-8 (nejlepší kreativní psaní)
- **PDF:** @react-pdf/renderer (Pravidelné stránky A4)
- **Obrázky:** fal.ai FLUX (titulní ilustrace, optional)

### Platby & Email
- **Platby:** Stripe (SEPA, karty, iDEAL, sofort — všechny EU metody)
- **Email:** Resend (transactional, GDPR-compliant)
- **Šablony:** React Email

### Deployment
- **Hosting:** Vercel (EU region Frankfurt)
- **Cron:** Vercel Cron (1x/hodinu pro odesílání pohádek)
- **CDN:** Vercel Edge Network

---

## Databázový model

```
users
  id (uuid, FK auth.users)
  email
  full_name
  stripe_customer_id
  subscription_plan: free|starter|family
  subscription_status: active|inactive|trialing|past_due|canceled
  subscription_period_end
  stories_generated_this_month
  month_reset_at

children
  id
  user_id → users
  name
  age
  gender: boy|girl|neutral
  friends: string[]
  parents: string[]
  avatar_emoji
  active

story_preferences
  id
  child_id → children
  genres: string[]
  reading_length: 15|30|45
  delivery_time: time
  timezone
  language: cs|en|sk
  active

stories
  id
  child_id → children
  user_id → users
  title
  content (full story text)
  genre
  reading_length
  pdf_url
  pdf_storage_path
  sent_at
  created_at

subscriptions
  id
  user_id → users
  stripe_subscription_id
  stripe_price_id
  plan
  status
  current_period_start/end
  cancel_at_period_end

email_deliveries
  id
  story_id → stories
  user_id → users
  email
  resend_email_id
  status: pending|sent|failed
  created_at
```

---

## Story Generation Prompts (Claude claude-opus-4-8)

### System prompt:
```
Jsi nejlepší autor pohádek pro děti v Česku. Píšeš originální, poutavé 
a vzdělávací pohádky, které rodiče čtou svým dětem před spaním. 
Pohádky jsou gramaticky správné v češtině, věkově vhodné (3-10 let), 
plné fantazie, s jasným poučením, bezpečné a pozitivní.
NIKDY nezahrni násilí, strachy, démony nebo nevhodný obsah.
```

### User prompt struktura:
```
Hlavní hrdina: [JMÉNO_DÍTĚTE] ([VĚK], [POHLAVÍ])
Žánr: [ŽÁNR_NÁZEV]
Délka: [POČET_SLOV] slov (~[MINUTY] minut)
Vedlejší postavy: [PŘÁTELÉ], [RODIČE]

Struktura:
1. Nadpis s jménem dítěte (10%)
2. Představení světa (10%)  
3. Výzva/problém (20%)
4. Dobrodružství (55%)
5. Vrchol (10%)
6. Klidný závěr s poučením (5%)
```

### Délky a počty slov:
- 15 min = ~1,800 slov (120 slov/min čtení)
- 30 min = ~3,600 slov
- 45 min = ~5,400 slov

---

## 50 Nejoblíbenějších témat pohádek

| # | Téma | CZ název | Emoji | Věk | Kategorie |
|---|------|---------|-------|-----|-----------|
| 1 | Superheroes | Superhrdinové | 🦸 | 4-10 | Moderní |
| 2 | Princesses | Princezny | 👸 | 3-9 | Klasika |
| 3 | Dragons | Draci | 🐉 | 4-10 | Fantasy |
| 4 | Space | Vesmír | 🚀 | 4-10 | Dobrodružství |
| 5 | Dinosaurs | Dinosauři | 🦕 | 3-8 | Moderní |
| 6 | Cars & Racing | Auta a závodění | 🏎️ | 3-8 | Moderní |
| 7 | Ninjas | Nindžové | 🥷 | 5-10 | Dobrodružství |
| 8 | Pirates | Piráti | 🏴‍☠️ | 4-10 | Dobrodružství |
| 9 | Unicorns | Jednorožci | 🦄 | 3-8 | Fantasy |
| 10 | Mermaids | Mořské panny | 🧜 | 3-9 | Fantasy |
| 11 | Fairies | Víly | 🧚 | 3-8 | Fantasy |
| 12 | Knights | Rytíři a hrady | ⚔️ | 4-10 | Klasika |
| 13 | Forest Animals | Lesní zvířátka | 🦊 | 3-7 | Klasika |
| 14 | Farm Animals | Hospodářská zvířata | 🐄 | 2-6 | Klasika |
| 15 | Ocean Adventure | Podmořský svět | 🐠 | 3-9 | Dobrodružství |
| 16 | Wizards | Čarodějové | 🧙 | 5-10 | Fantasy |
| 17 | Robots | Roboti | 🤖 | 4-10 | Moderní |
| 18 | Football | Fotbal | ⚽ | 4-10 | Moderní |
| 19 | Dogs & Pets | Psi a mazlíčci | 🐕 | 3-8 | Klasika |
| 20 | Trains | Vlaky | 🚂 | 2-7 | Moderní |
| 21 | Firefighters | Hasiči | 🚒 | 3-8 | Moderní |
| 22 | Construction | Stavba a bagry | 🏗️ | 2-7 | Moderní |
| 23 | Cowboys | Kovbojové | 🤠 | 4-9 | Dobrodružství |
| 24 | Jungle | Džungle | 🌴 | 4-10 | Dobrodružství |
| 25 | Time Travel | Cestování časem | ⏰ | 6-10 | Dobrodružství |
| 26 | Candy Kingdom | Království sladkostí | 🍭 | 3-7 | Fantasy |
| 27 | Christmas | Vánoce a Mikuláš | 🎄 | 3-9 | Místní |
| 28 | Halloween (friendly) | Halloweenská dob. | 🎃 | 4-9 | Moderní |
| 29 | Ballet & Dance | Balet a tanec | 🩰 | 3-9 | Klasika |
| 30 | Music | Hudební dobrodružství | 🎵 | 3-9 | Vzdělávací |
| 31 | Science | Věda a experimenty | 🔬 | 5-10 | Vzdělávací |
| 32 | Nature | Příroda a ekologie | 🌿 | 4-10 | Vzdělávací |
| 33 | Arctic | Arktická dobrodružství | 🐧 | 4-9 | Dobrodružství |
| 34 | Bugs & Insects | Broučci a hmyz | 🐛 | 3-8 | Vzdělávací |
| 35 | Horses | Koně a poníci | 🐴 | 3-10 | Klasika |
| 36 | Cooking | Vaření a pečení | 👨‍🍳 | 4-9 | Vzdělávací |
| 37 | Garden | Kouzelná zahrada | 🌸 | 3-8 | Klasika |
| 38 | Czech Folk Tales | České pohádky | 🏰 | 4-10 | Místní |
| 39 | Dragon Slayer | Drak a hrdina | 🗡️ | 5-10 | Místní |
| 40 | Enchanted Forest | Kouzelný les | 🌲 | 4-10 | Místní |
| 41 | Emotions | Emoce a přátelství | 💛 | 3-8 | Vzdělávací |
| 42 | Alphabet | Písmenkové dob. | 📚 | 3-6 | Vzdělávací |
| 43 | Birds & Flying | Ptáci a létání | 🦅 | 3-9 | Klasika |
| 44 | Submarine | Ponorka a moře | 🌊 | 5-10 | Dobrodružství |
| 45 | Mountains | Horské dobrodružství | ⛰️ | 4-10 | Dobrodružství |
| 46 | Circus | Cirkus a kouzla | 🎪 | 3-9 | Klasika |
| 47 | Weather Heroes | Hrdinové počasí | ⛈️ | 4-9 | Fantasy |
| 48 | Block World | Svět bloků (Minecraft) | 🎮 | 5-10 | Moderní |
| 49 | Flower Kingdom | Království květin | 🌺 | 3-7 | Fantasy |
| 50 | Sports Team | Hvězdný tým | 🏆 | 5-10 | Moderní |

---

## PDF Design — Grafický model

### Každá pohádka = krásné A4 PDF:

**Struktura stránek:**
- Titulní strana s názvem pohádky, jménem dítěte, žánrovými barvami
- Dekorativní rámeček (zlatý/tematický)
- AI generovaná titulní ilustrace (volitelně)
- Text pohádky s drop cap (velké první písmeno)
- Tematické oddělovače kapitol (✦)
- Zápatí: "DreamTales.eu — každou noc pohádka jen pro vaše dítě"
- Číslování stránek

**Tematické barevné schéma per žánr:**
- Superhrdinové: Tmavá navy + červená
- Princezny: Fialová + zlatá  
- Draci: Tmavá červená + oranžová
- Vesmír: Černá + modrá
- atd.

---

## Emailová automatizace

### Denní pohádka email:
- Čas: nastavitelný (default 19:30 CET)
- Předmět: "🌙 Dnešní pohádka pro [JMÉNO]: [NÁZEV]"
- Obsah: Preview pohádky + tlačítko + PDF příloha
- Odesílatel: pohádky@dreamtales.eu

### Triggery emailů:
1. Registrace → Welcome email
2. Každý den v čas doručení → Story email s PDF
3. Platba selhala → Reminder + opravit platbu
4. Konec zkušební doby → Upgrade offer
5. 30 dní inaktivity → Re-engagement

---

## Marketingový plán

### Brand voice:
- Magický, vřelý, důvěryhodný
- Pro rodiče: profesionální a uklidňující
- Czech-first (lokalizace CZ, SK, PL)

### Kanály:
1. **SEO** — "pohádky pro děti", "pohádky na dobrou noc", "AI pohádky"
2. **Facebook/Instagram** — cílení: rodiče, 25-45 let, CZ/SK
3. **TikTok** — krátké video "Jak AI vymyslí pohádku za 30 sekund"
4. **Maminkovské skupiny FB** — organický obsah
5. **Google Ads** — "pohádky na dobrou noc" klíčová slova
6. **Influencer** — maminky/rodičovské bloggerky CZ/SK

### Obsahový plán (AI generovaný):
- Landing page texty (níže)
- Blog posty: "Proč jsou pohádky důležité pro děj spánku"
- Social media posty (ukázky pohádek)
- Email kampaně

---

## Texty pro landing page (marketing copy)

### Hero sekce:
**Headline:** "Každý večer originální pohádka speciálně pro vaše dítě"
**Subheadline:** "Umělá inteligence vygeneruje pohádku na míru — s jménem vašeho dítěte jako hrdinou — a každý den ji pošle na váš e-mail jako krásné PDF."

### Features:
- "🎭 50+ žánrů pohádek" — superhrdina, princezna, vesmír, dinosauři a více
- "✨ Vaše dítě je hrdina" — jméno, přátelé a rodinní příslušníci ve příběhu
- "📄 Krásné PDF" — tematicky zpracované, připravené k tisku nebo čtení
- "📧 Automatické doručení" — každý večer v vámi zvolený čas
- "⏱️ Délka na míru" — 15, 30 nebo 45 minut čtení

### Pricing:
- Zdarma: "3 pohádky za měsíc — vyzkoušejte zdarma, bez kreditní karty"
- Starter: "Každý den nová pohádka pro jedno dítě"
- Family: "Tři děti, každé se svým příběhem, každý večer"

---

## Denní roadmapa — 2 dny

### DEN 1 — Foundation & Core (Dnes)

**Ráno (0-4h):**
- [x] Next.js projekt setup
- [x] Závislosti (Claude, Supabase, Stripe, Resend, React PDF)
- [x] Databázové schema
- [x] Typy a utility funkce
- [x] Supabase client/server setup
- [x] Claude AI prompty (50 témat)
- [x] PDF generátor (tematický design)
- [x] Email šablony (React Email)
- [x] API proxy (Next.js 16)

**Odpoledne (4-8h):**
- [ ] UI komponenty (Button, Card, Input, Select, Badge)
- [ ] Landing page
- [ ] Login / Register stránky
- [ ] Dashboard layout + navigace
- [ ] API: /api/stories/generate
- [ ] API: /api/children (CRUD)
- [ ] API: /api/auth/callback

**Večer (8-12h):**
- [ ] Story generator UI
- [ ] Dashboard stránky (children, stories, settings)
- [ ] API: /api/checkout (Stripe)
- [ ] API: /api/webhooks/stripe
- [ ] API: /api/cron/send-stories

### DEN 2 — Polish & Launch (Zítra)

**Ráno (0-4h):**
- [ ] Supabase projekt setup (online)
- [ ] Stripe produkty a ceny
- [ ] Resend doména a email
- [ ] Test celého flow end-to-end
- [ ] Bug fixing

**Odpoledne (4-8h):**
- [ ] SEO meta tagy
- [ ] Pricing stránka
- [ ] Admin panel (basic)
- [ ] Performance optimalizace
- [ ] Error handling improvements

**Večer (8-12h):**
- [ ] Vercel deployment
- [ ] Domain nastavení (dreamtales.eu)
- [ ] Stripe webhook nastavení
- [ ] Cron job aktivace
- [ ] Smoke testing v produkci

---

## Marketing materiály (AI prompt bank)

### Pro generování obrázků (Midjourney/DALL-E/Flux):

**Hero obrázek:**
```
A magical nighttime scene with a glowing book floating above a child's bed, 
stars and moonlight, warm purple and gold tones, watercolor illustration style, 
cozy bedroom, fantasy atmosphere, soft dreamy light
```

**Promo banner:**
```
Happy Czech family reading bedtime story together, warm lamp light, 
cozy living room, illustrated book with glowing pages, dreamy atmosphere,
vector illustration style, purple and gold color palette
```

**Social media template:**
```
Cute illustrated book cover with a child hero, fairy tale style, 
vibrant colors, child's name written in magical font, stars and sparkles,
children's book illustration style
```

### Pro generování videí (Runway/Kling):

**Social media video:**
```
Magical animation: storybook opens, words and illustrations appear on pages, 
a child's name glows in golden letters, stars and moonlight, dreamy 30-second loop,
warm purple night sky background
```

**TikTok video:**
```
Split screen: parent types child's name on phone/computer → loading animation → 
beautiful bedtime story PDF appears → parent reading to smiling child → 
child falling asleep with smile, heartwarming 15-second vertical video
```

---

## Konfigurační příručka (pro spuštění)

### 1. Supabase (supabase.com)
```
1. Vytvořit nový projekt (region Frankfurt)
2. Spustit schema.sql v SQL Editoru
3. Vytvořit Storage bucket "stories" (public)
4. Zkopírovat URL + anon key + service role key do .env.local
```

### 2. Stripe (stripe.com)
```
1. Vytvořit produkty:
   - Starter Monthly: €4.99/měsíc
   - Family Monthly: €7.99/měsíc  
   - Family Annual: €59.99/rok
2. Zkopírovat Price IDs do .env.local
3. Nastavit Webhook: https://dreamtales.eu/api/webhooks/stripe
   Events: checkout.session.completed, customer.subscription.*
4. Zkopírovat Webhook Secret do .env.local
```

### 3. Resend (resend.com)
```
1. Přidat doménu dreamtales.eu
2. Ověřit DNS záznamy
3. Vytvořit API key
4. Nastavit FROM: pohádky@dreamtales.eu
```

### 4. Vercel deployment
```
1. git push na GitHub
2. Import projekt na Vercel
3. Nastavit Environment Variables (z .env.example)
4. Deploy
5. Přidat custom domain dreamtales.eu
6. Cron job se aktivuje automaticky z vercel.json
```
