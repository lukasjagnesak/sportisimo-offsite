export type SubscriptionPlan = 'free' | 'starter' | 'family'

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive'

export type ReadingLength = 15 | 30 | 45

export interface User {
  id: string
  email: string
  full_name: string | null
  stripe_customer_id: string | null
  subscription_plan: SubscriptionPlan
  subscription_status: SubscriptionStatus
  subscription_period_end: string | null
  created_at: string
}

export interface Child {
  id: string
  user_id: string
  name: string
  age: number | null
  gender: 'boy' | 'girl' | 'neutral'
  friends: string[]
  parents: string[]
  created_at: string
}

export interface StoryPreferences {
  id: string
  child_id: string
  genres: string[]
  reading_length: ReadingLength
  delivery_time: string
  timezone: string
  active: boolean
}

export interface Story {
  id: string
  child_id: string
  child_name: string
  title: string
  content: string
  genre: string
  reading_length: ReadingLength
  pdf_url: string | null
  sent_at: string | null
  created_at: string
}

export interface Genre {
  id: string
  name: string
  name_cs: string
  emoji: string
  description: string
  age_min: number
  age_max: number
  category: 'classic' | 'modern' | 'adventure' | 'fantasy' | 'educational' | 'local'
}

export const GENRES: Genre[] = [
  { id: 'superheroes', name: 'Superheroes', name_cs: 'Superhrdinové', emoji: '🦸', description: 'Zachraňování světa s superschopnostmi', age_min: 4, age_max: 10, category: 'modern' },
  { id: 'princesses', name: 'Princesses', name_cs: 'Princezny', emoji: '👸', description: 'Magická království a odvážné princezny', age_min: 3, age_max: 9, category: 'classic' },
  { id: 'dragons', name: 'Dragons', name_cs: 'Draci', emoji: '🐉', description: 'Ohnivé bytosti a hrdinské výpravy', age_min: 4, age_max: 10, category: 'fantasy' },
  { id: 'space', name: 'Space & Astronauts', name_cs: 'Vesmír a astronauti', emoji: '🚀', description: 'Dobrodružství ve vesmíru mezi hvězdami', age_min: 4, age_max: 10, category: 'adventure' },
  { id: 'dinosaurs', name: 'Dinosaurs', name_cs: 'Dinosauři', emoji: '🦕', description: 'Pravěké obry a tajemné světy', age_min: 3, age_max: 8, category: 'modern' },
  { id: 'cars', name: 'Cars & Racing', name_cs: 'Auta a závodění', emoji: '🏎️', description: 'Rychlé závody a dobrodružné cesty', age_min: 3, age_max: 8, category: 'modern' },
  { id: 'ninjas', name: 'Ninjas', name_cs: 'Nindžové', emoji: '🥷', description: 'Tajemní bojovníci a akrobatické výpravy', age_min: 5, age_max: 10, category: 'adventure' },
  { id: 'pirates', name: 'Pirates', name_cs: 'Piráti', emoji: '🏴‍☠️', description: 'Mořská dobrodružství a hledání pokladů', age_min: 4, age_max: 10, category: 'adventure' },
  { id: 'unicorns', name: 'Unicorns', name_cs: 'Jednorožci', emoji: '🦄', description: 'Magičtí koně a duhové světy', age_min: 3, age_max: 8, category: 'fantasy' },
  { id: 'mermaids', name: 'Mermaids', name_cs: 'Mořské panny', emoji: '🧜', description: 'Podmořské dobrodružství a mořský svět', age_min: 3, age_max: 9, category: 'fantasy' },
  { id: 'fairies', name: 'Fairies', name_cs: 'Víly', emoji: '🧚', description: 'Kouzelné bytosti a zázračné činy', age_min: 3, age_max: 8, category: 'fantasy' },
  { id: 'knights', name: 'Knights & Castles', name_cs: 'Rytíři a hrady', emoji: '⚔️', description: 'Statečné rytíře a pevná středověká hrady', age_min: 4, age_max: 10, category: 'classic' },
  { id: 'forest', name: 'Forest Animals', name_cs: 'Lesní zvířátka', emoji: '🦊', description: 'Přátelé z lesa a tajemná příroda', age_min: 3, age_max: 7, category: 'classic' },
  { id: 'farm', name: 'Farm Animals', name_cs: 'Hospodářská zvířata', emoji: '🐄', description: 'Život na farmě a zvířecí přátelé', age_min: 2, age_max: 6, category: 'classic' },
  { id: 'ocean', name: 'Ocean Adventure', name_cs: 'Podmořský svět', emoji: '🐠', description: 'Hluboký oceán a mořské bytosti', age_min: 3, age_max: 9, category: 'adventure' },
  { id: 'wizards', name: 'Wizards & Magic', name_cs: 'Čarodějové a magie', emoji: '🧙', description: 'Kouzelné školy a tajemná kouzla', age_min: 5, age_max: 10, category: 'fantasy' },
  { id: 'robots', name: 'Robots & Tech', name_cs: 'Roboti a technika', emoji: '🤖', description: 'Futuristické světy a přátelé roboti', age_min: 4, age_max: 10, category: 'modern' },
  { id: 'football', name: 'Football & Sports', name_cs: 'Fotbal a sport', emoji: '⚽', description: 'Sportovní hrdinové a velká vítězství', age_min: 4, age_max: 10, category: 'modern' },
  { id: 'dogs', name: 'Dogs & Pets', name_cs: 'Psi a mazlíčci', emoji: '🐕', description: 'Věrní přátelé a psí dobrodružství', age_min: 3, age_max: 8, category: 'classic' },
  { id: 'trains', name: 'Trains & Railways', name_cs: 'Vlaky a železnice', emoji: '🚂', description: 'Dobrodružné cesty vlakem do vzdálených míst', age_min: 2, age_max: 7, category: 'modern' },
  { id: 'firefighters', name: 'Firefighters', name_cs: 'Hasiči', emoji: '🚒', description: 'Stateční hasiči a záchranné mise', age_min: 3, age_max: 8, category: 'modern' },
  { id: 'construction', name: 'Construction', name_cs: 'Stavba a bagry', emoji: '🏗️', description: 'Velké stavby a pracovití bagři', age_min: 2, age_max: 7, category: 'modern' },
  { id: 'cowboys', name: 'Cowboys & West', name_cs: 'Kovbojové a Divoký západ', emoji: '🤠', description: 'Dobrodružný divoký západ a kovbojové', age_min: 4, age_max: 9, category: 'adventure' },
  { id: 'jungle', name: 'Jungle Adventure', name_cs: 'Džungle', emoji: '🌴', description: 'Záhadná džungle a exotická zvířata', age_min: 4, age_max: 10, category: 'adventure' },
  { id: 'time_travel', name: 'Time Travel', name_cs: 'Cestování časem', emoji: '⏰', description: 'Výpravy do minulosti i budoucnosti', age_min: 6, age_max: 10, category: 'adventure' },
  { id: 'candy', name: 'Candy Kingdom', name_cs: 'Království sladkostí', emoji: '🍭', description: 'Sladká království a čokoládové dobrodružství', age_min: 3, age_max: 7, category: 'fantasy' },
  { id: 'christmas', name: 'Christmas Magic', name_cs: 'Vánoce a Mikuláš', emoji: '🎄', description: 'Vánoční magie a Ježíšek', age_min: 3, age_max: 9, category: 'local' },
  { id: 'halloween', name: 'Friendly Halloween', name_cs: 'Halloweenská dobrodružství', emoji: '🎃', description: 'Roztomilí duchové a bezpečné strašidelniny', age_min: 4, age_max: 9, category: 'modern' },
  { id: 'ballet', name: 'Ballet & Dance', name_cs: 'Balet a tanec', emoji: '🩰', description: 'Krásná taneční představení a zákulisní dobrodružství', age_min: 3, age_max: 9, category: 'classic' },
  { id: 'music', name: 'Music Adventure', name_cs: 'Hudební dobrodružství', emoji: '🎵', description: 'Magická moc hudby a hudební hrdinové', age_min: 3, age_max: 9, category: 'educational' },
  { id: 'science', name: 'Science & Experiments', name_cs: 'Věda a experimenty', emoji: '🔬', description: 'Zvídaví vědci a fascinující objevy', age_min: 5, age_max: 10, category: 'educational' },
  { id: 'nature', name: 'Nature & Environment', name_cs: 'Příroda a ekologie', emoji: '🌿', description: 'Péče o přírodu a ekologičtí hrdinové', age_min: 4, age_max: 10, category: 'educational' },
  { id: 'arctic', name: 'Arctic Adventure', name_cs: 'Arktická dobrodružství', emoji: '🐧', description: 'Ledový sever a polární dobrodružství', age_min: 4, age_max: 9, category: 'adventure' },
  { id: 'bugs', name: 'Bugs & Insects', name_cs: 'Broučci a hmyz', emoji: '🐛', description: 'Malý svět hmyzu a velká dobrodružství', age_min: 3, age_max: 8, category: 'educational' },
  { id: 'horses', name: 'Horses & Ponies', name_cs: 'Koně a poníci', emoji: '🐴', description: 'Krásní koně a jezdectví', age_min: 3, age_max: 10, category: 'classic' },
  { id: 'cooking', name: 'Cooking & Baking', name_cs: 'Vaření a pečení', emoji: '👨‍🍳', description: 'Kuchařské dobrodružství a chutné recepty', age_min: 4, age_max: 9, category: 'educational' },
  { id: 'garden', name: 'Garden Magic', name_cs: 'Kouzelná zahrada', emoji: '🌸', description: 'Tajemná zahrada a mluvící rostliny', age_min: 3, age_max: 8, category: 'classic' },
  { id: 'czech_folklore', name: 'Czech Folk Tales', name_cs: 'České pohádky', emoji: '🏰', description: 'Klasické české pohádky s novým hrdinou', age_min: 4, age_max: 10, category: 'local' },
  { id: 'dragon_slayer', name: 'Dragon Slayer Quest', name_cs: 'Drak a hrdina', emoji: '🗡️', description: 'Epická výprava za záchranou království', age_min: 5, age_max: 10, category: 'local' },
  { id: 'enchanted_forest', name: 'Enchanted Forest', name_cs: 'Kouzelný les', emoji: '🌲', description: 'Magický les plný tajemství a dobrodružství', age_min: 4, age_max: 10, category: 'local' },
  { id: 'emotions', name: 'Emotional Intelligence', name_cs: 'Emoce a přátelství', emoji: '💛', description: 'Pochopení emocí a budování přátelství', age_min: 3, age_max: 8, category: 'educational' },
  { id: 'abc', name: 'Alphabet Adventure', name_cs: 'Písmenkové dobrodružství', emoji: '📚', description: 'Naučná pohádka plná písmenek a slovíček', age_min: 3, age_max: 6, category: 'educational' },
  { id: 'birds', name: 'Birds & Flying', name_cs: 'Ptáci a létání', emoji: '🦅', description: 'Volné létání a dobrodružství ve vzduchu', age_min: 3, age_max: 9, category: 'classic' },
  { id: 'submarines', name: 'Submarine Adventure', name_cs: 'Ponorka a moře', emoji: '🌊', description: 'Výpravy ponorkou do hlubin oceánu', age_min: 5, age_max: 10, category: 'adventure' },
  { id: 'mountains', name: 'Mountain Adventure', name_cs: 'Horské dobrodružství', emoji: '⛰️', description: 'Statečné výpravy do hor a na vrcholy', age_min: 4, age_max: 10, category: 'adventure' },
  { id: 'circus', name: 'Circus Magic', name_cs: 'Cirkus a kouzla', emoji: '🎪', description: 'Kouzelný cirkus a akrobatická dobrodružství', age_min: 3, age_max: 9, category: 'classic' },
  { id: 'weather', name: 'Weather Heroes', name_cs: 'Hrdinové počasí', emoji: '⛈️', description: 'Hrdinové ovládající déšť, vítr a slunce', age_min: 4, age_max: 9, category: 'fantasy' },
  { id: 'minecraft', name: 'Block World Adventure', name_cs: 'Dobrodružství ve světě bloků', emoji: '🎮', description: 'Stavění, dobývání a přežití v blokovém světě', age_min: 5, age_max: 10, category: 'modern' },
  { id: 'flowers', name: 'Flower Kingdom', name_cs: 'Království květin', emoji: '🌺', description: 'Kouzelné království plné barevných květin', age_min: 3, age_max: 7, category: 'fantasy' },
  { id: 'sports_team', name: 'Dream Sports Team', name_cs: 'Hvězdný tým', emoji: '🏆', description: 'Cesta k vítězství s nejlepším sportovním týmem', age_min: 5, age_max: 10, category: 'modern' },
]

export const READING_LENGTHS: { value: ReadingLength; label: string; words: number }[] = [
  { value: 15, label: '15 minut', words: 1800 },
  { value: 30, label: '30 minut', words: 3600 },
  { value: 45, label: '45 minut', words: 5400 },
]

export const PLANS = {
  free: {
    name: 'Zdarma',
    price: 0,
    stories_per_month: 3,
    max_children: 1,
    stripe_price_id: null,
  },
  starter: {
    name: 'Starter',
    price: 499,
    stories_per_month: 31,
    max_children: 1,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
  },
  family: {
    name: 'Family',
    price: 799,
    stories_per_month: 93,
    max_children: 3,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID,
  },
}
