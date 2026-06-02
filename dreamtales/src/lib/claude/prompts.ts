import { ReadingLength } from '@/types'

interface StoryParams {
  childName: string
  childAge: number | null
  childGender: 'boy' | 'girl' | 'neutral'
  genre: string
  genreName: string
  readingLength: ReadingLength
  friends?: string[]
  parents?: string[]
  language?: 'cs' | 'en'
}

const WORD_COUNTS: Record<ReadingLength, number> = {
  15: 1800,
  30: 3600,
  45: 5400,
}

const GENDER_CS = {
  boy: { hrdina: 'hrdina', hlavni: 'hlavní hrdina', byl: 'byl', malý: 'malý', statečný: 'statečný' },
  girl: { hrdina: 'hrdinka', hlavni: 'hlavní hrdinka', byl: 'byla', malý: 'malá', statečný: 'statečná' },
  neutral: { hrdina: 'hrdina', hlavni: 'hlavní hrdina', byl: 'bylo', malý: 'malé', statečný: 'statečné' },
}

export function buildStoryPrompt(params: StoryParams): string {
  const {
    childName,
    childAge,
    childGender,
    genre,
    genreName,
    readingLength,
    friends = [],
    parents = [],
    language = 'cs',
  } = params

  const wordCount = WORD_COUNTS[readingLength]
  const gender = GENDER_CS[childGender]
  const friendsList = friends.length > 0 ? `kamarádi: ${friends.join(', ')}` : ''
  const parentsList = parents.length > 0 ? `rodiče: ${parents.join(', ')}` : ''
  const supportingChars = [friendsList, parentsList].filter(Boolean).join('; ')
  const ageHint = childAge ? `ve věku ${childAge} let` : ''

  if (language === 'cs') {
    return `Jsi mistr pohádkář pro děti. Napiš originální pohádku na dobrou noc v češtině.

## PARAMETRY POHÁDKY:
- Hlavní hrdina: **${childName}** (${ageHint}, ${childGender === 'boy' ? 'chlapec' : childGender === 'girl' ? 'dívka' : 'dítě'})
- Žánr: **${genreName}** (${genre})
- Délka pohádky: přibližně **${wordCount} slov** (cca ${readingLength} minut čtení)
- Vedlejší postavy: ${supportingChars || 'žádné specifikovány — vymysli vhodné'}

## POKYNY PRO PSANÍ:

### Struktura pohádky:
1. **Nadpis** — chytlavý název pohádky obsahující jméno ${childName}
2. **Začátek** (10% textu) — představení hrdiny ${childName} a jeho/jejího světa
3. **Rozvoj** (20% textu) — ${childName} dostane výzvu nebo problém
4. **Dobrodružství** (55% textu) — vzrušující příběh v žánru ${genreName}, ${childName} zažívá dobrodružství, setkává se s přáteli a překonává překážky
5. **Vrchol** (10% textu) — napínavé vyvrcholení
6. **Závěr** (5% textu) — spokojené ukončení, ${childName} se vrací domů/usíná, poučení z příběhu

### Styl:
- Piš **přitažlivým, plynulým češtiny** vhodnou pro čtení rodičů dětem
- Používej **bohatý popis** scén a postav
- Přidej **dialog** (alespoň 30% textu tvoří dialogy)
- ${childName} je vždy **statečný, laskavý a chytrý ${gender.hrdina}**
- Každá překážka má **řešení skrze odvahu nebo laskavost**
- Zakončení musí být **uklidňující** — vhodné před spaním

### Konkrétní prvky žánru ${genreName}:
${getGenreSpecificInstructions(genre)}

### Délka:
- Pohádka musí mít přesně **${wordCount} ± 200 slov**
- Rozděl text na odstavce (každý 3-6 vět)
- Přidej **tučné zvýraznění** klíčových momentů

## FORMÁT VÝSTUPU:
Vrať POUZE pohádku v tomto formátu:

# [Název pohádky s ${childName}]

[Text pohádky...]

---
*Konec pohádky*`
  }

  // English version
  return `You are a master storyteller for children. Write an original bedtime story in English.

## STORY PARAMETERS:
- Main hero: **${childName}** (${ageHint}, ${childGender})
- Genre: **${genreName}** (${genre})
- Length: approximately **${wordCount} words** (~${readingLength} minutes reading time)
- Supporting characters: ${supportingChars || 'none specified — create appropriate ones'}

## WRITING INSTRUCTIONS:

### Story Structure:
1. **Title** — catchy story name featuring ${childName}
2. **Opening** (10%) — introduce ${childName} and their world
3. **Rising action** (20%) — ${childName} receives a challenge or problem
4. **Adventure** (55%) — exciting story in ${genreName} genre, ${childName} experiences adventures and overcomes obstacles
5. **Climax** (10%) — exciting peak moment
6. **Resolution** (5%) — happy ending, ${childName} returns home/falls asleep, lesson learned

### Style:
- Write in **engaging, flowing English** suitable for parents reading aloud to children
- Use **rich descriptions** of scenes and characters
- Include **dialogue** (at least 30% of text)
- ${childName} is always **brave, kind, and clever**
- Every obstacle has a **solution through courage or kindness**
- Ending must be **calming** — suitable for bedtime

### Genre-specific elements for ${genreName}:
${getGenreSpecificInstructions(genre)}

### Length:
- Story must be exactly **${wordCount} ± 200 words**
- Split into paragraphs (3-6 sentences each)
- Add **bold text** for key moments

## OUTPUT FORMAT:
Return ONLY the story in this format:

# [Story Title with ${childName}]

[Story text...]

---
*The End*`
}

function getGenreSpecificInstructions(genre: string): string {
  const instructions: Record<string, string> = {
    superheroes: `- ${''} dej ${''} speciální superschopnost (let, síla, rychlost nebo vlastní originální schopnost)
- Přidej záporáka, kterého porazí laskavostí, ne násilím
- Kostým s barvami, které dítě miluje
- Záchrana ostatních jako motivace`,

    princesses: `- Princezna je AKTIVNÍ hrdinka — sama řeší problémy
- Magické království s unikátními obyvateli
- Magický předmět nebo bytost jako pomocník
- Poučení o odvaze nebo přátelství`,

    dragons: `- Drak může být přítel NEBO soupeř (záleží na příběhu)
- Drakova jeskyně s pokladem nebo tajemstvím
- Magický oheň nebo schopnost draka hraje klíčovou roli
- Dítě prokáže odvahu rozumem, ne silou`,

    space: `- Vlastní vesmírná loď se jménem
- Mimozemští přátelé s laskavými vlastnostmi
- Planeta s unikátními rysy (barvy, gravitace, zvuky)
- Vědecký objev nebo záchranná mise`,

    dinosaurs: `- Dinosauři jsou přátelé, ne nebezpeční
- Pravěký svět s bohatou přírodou
- Záchrana malého dinosaura nebo objev nové druhy
- Vzdělávací prvek o dinosaurech přirozeně zasazený do příběhu`,

    cars: `- Auto/závodník se jménem a charakterem
- Velký závod nebo dobrodružná cesta
- Mechanická překážka, kterou vyřeší chytrostí
- Týmová spolupráce jako klíč k vítězství`,

    ninjas: `- Tajná nindžovská akademie
- Speciální dovednost, kterou dítě ovládne
- Záchranná mise v noci nebo souboj důvtipu
- Učitel nebo mistr, který předá moudrost`,

    pirates: `- Vlastní pirátská loď se jménem a posádkou
- Mapa s tajemstvím k rozluštění
- Mořská bouře nebo setkání s podmořskou bytostí
- Poklad, který není zlato — přátelství, domov nebo svoboda`,

    unicorns: `- Jednorožec se speciálním darem (léčení, teleportace, kouzla)
- Duhový svět s živými barvami
- Záchrana kouzelného lesa nebo přátel
- Magie, která je poháněna laskavostí`,

    wizards: `- Kouzelná škola nebo akademie
- Kouzlo, které se dítě naučí
- Zlomení kletby nebo záchrana pomocí magie
- Staré tajemství ukryté v knihovně nebo věži`,

    robots: `- Robot jako nejlepší přítel
- Futuristické město nebo vesmírná stanice
- Technická záhada k vyřešení
- Ponaučení o přátelství mezi lidmi a stroji`,

    czech_folklore: `- Inspirace klasickými českými pohádkami (Pohádky Erbenovy, Němcové)
- Tradiční prostředí: hrad, les, hospoda, vesnice
- Kouzelný předmět (prsten, mošna, klacík)
- Klasická česká pohádková poučení: poctivost, laskavost, skromnost`,

    forest: `- Mluvící lesní zvířata jako přátelé (liška, ježek, veverka, zajíc)
- Tajemství hlubokého lesa
- Pomoc zranjenému zvířátku
- Harmonie s přírodou jako poučení`,

    ocean: `- Podmořský svět s krásnými korály a bioluminiscencí
- Mořské bytosti jako přátelé (delfíni, chobotnice, mořský koník)
- Záchrana moře před znečištěním nebo záhada podmořského hradu
- Fascinující fakta o oceánu zasazená do příběhu`,

    default: `- Dítě je srdcem příběhu — jeho/její osobnost formuje průběh
- Přidej nečekané přátelství s neobvyklou bytostí
- Dobrodružství přináší poučení o odvaze nebo laskavosti
- Šťastný konec s nostalgickým návratem domů`,
  }

  return instructions[genre] || instructions.default
}

export function buildTitlePrompt(childName: string, genre: string): string {
  return `Vymysli 5 chytlavých názvů pohádky na dobrou noc pro dítě jménem ${childName} v žánru "${genre}". Každý název musí obsahovat jméno ${childName}. Vrať pouze seznam názvů, každý na novém řádku.`
}

export function buildImagePrompt(genre: string, title: string, childGender: 'boy' | 'girl' | 'neutral'): string {
  const genderDesc = childGender === 'boy' ? 'a brave young boy' : childGender === 'girl' ? 'a brave young girl' : 'a brave young child'

  const baseStyle = 'children\'s book illustration, soft watercolor style, warm pastel colors, gentle lighting, magical atmosphere, no text, high quality, detailed background'

  const genreScenes: Record<string, string> = {
    superheroes: `${genderDesc} superhero flying over a colorful city at sunset, cape flowing, ${baseStyle}`,
    princesses: `${genderDesc} princess in a magical castle garden with glowing flowers and a friendly unicorn, ${baseStyle}`,
    dragons: `${genderDesc} and a friendly colorful dragon in a magical cave with glowing crystals, ${baseStyle}`,
    space: `${genderDesc} astronaut floating in space surrounded by colorful planets and friendly aliens, ${baseStyle}`,
    dinosaurs: `${genderDesc} riding a friendly baby dinosaur through a lush prehistoric jungle, ${baseStyle}`,
    cars: `${genderDesc} racing driver in a colorful racing car on a magical winding track through a forest, ${baseStyle}`,
    ninjas: `${genderDesc} ninja jumping between rooftops under a full moon with cherry blossoms, ${baseStyle}`,
    pirates: `${genderDesc} pirate on a colorful ship sailing through sparkling magical waters, ${baseStyle}`,
    unicorns: `${genderDesc} riding a rainbow unicorn over a magical cloud kingdom, ${baseStyle}`,
    wizards: `${genderDesc} young wizard in a magical library with floating books and glowing spell books, ${baseStyle}`,
    robots: `${genderDesc} and a friendly colorful robot exploring a futuristic magical city, ${baseStyle}`,
    forest: `${genderDesc} in an enchanted glowing forest with friendly talking animals surrounding them, ${baseStyle}`,
    ocean: `${genderDesc} underwater surrounded by colorful fish, corals and friendly sea creatures, ${baseStyle}`,
    default: `${genderDesc} on a magical adventure in a colorful fairytale landscape, ${baseStyle}`,
  }

  return genreScenes[genre] || genreScenes.default
}
