import type { ReadingLength } from '@/types'

// ─────────────────────────────────────────────────────────────
// Word-count targets per reading length
// ─────────────────────────────────────────────────────────────
const WORD_COUNTS: Record<ReadingLength, number> = {
  15: 1800,
  30: 3600,
  45: 5400,
}

// ─────────────────────────────────────────────────────────────
// Age-tier helpers
// ─────────────────────────────────────────────────────────────
type AgeTier = 'toddler' | 'preschool' | 'school'

function getAgeTier(age: number | null): AgeTier {
  if (!age || age <= 3) return 'toddler'
  if (age <= 5) return 'preschool'
  return 'school'
}

const AGE_GUIDANCE: Record<AgeTier, string> = {
  toddler: `
- Age 1–3: very short sentences (max 8 words). Simple vocabulary — single-syllable words where possible.
- Lots of repetition and rhythm ("and then…, and then…").
- Concrete, familiar concepts only (home, animals, food, sleep).
- No complex plot twists — linear, soothing sequence of events.
- Onomatopoeia and sound words (moo, buzz, whoosh) every few sentences.`,

  preschool: `
- Age 3–5: short, clear sentences (8–12 words). Simple but expanding vocabulary.
- Some repetition for comfort, but with small variations to keep interest.
- One clear problem to solve; resolution within 2–3 steps.
- Strong sensory descriptions: colours, textures, sounds, smells.
- Characters with clear emotions that the child can recognise.`,

  school: `
- Age 6–9: varied sentence length (short for punch, long for atmosphere).
- Richer vocabulary — introduce 2–3 new words naturally, explain in context.
- Subplot is fine (a side character with their own small challenge).
- Moral can be more nuanced (teamwork, honesty, empathy, perseverance).
- Some mild suspense is OK, but always resolves warmly before the end.`,
}

// ─────────────────────────────────────────────────────────────
// Grammar helpers (Czech gender agreement)
// ─────────────────────────────────────────────────────────────
const GENDER_CS = {
  boy: {
    hrdina: 'hrdina', typ: 'chlapec', byl: 'byl', malý: 'malý',
    statečný: 'statečný', laskavý: 'laskavý', chytrý: 'chytrý',
  },
  girl: {
    hrdina: 'hrdinka', typ: 'dívka', byl: 'byla', malý: 'malá',
    statečný: 'statečná', laskavý: 'laskavá', chytrý: 'chytrá',
  },
  neutral: {
    hrdina: 'hrdina', typ: 'dítě', byl: 'bylo', malý: 'malé',
    statečný: 'statečné', laskavý: 'laskavé', chytrý: 'chytré',
  },
}

const GENDER_EN = {
  boy: { hero: 'boy', pronoun: 'he', possessive: 'his', reflexive: 'himself' },
  girl: { hero: 'girl', pronoun: 'she', possessive: 'her', reflexive: 'herself' },
  neutral: { hero: 'child', pronoun: 'they', possessive: 'their', reflexive: 'themselves' },
}

// ─────────────────────────────────────────────────────────────
// Genre-specific instructions (EN & CS)
// ─────────────────────────────────────────────────────────────

interface GenreGuide {
  en: string
  cs: string
}

function g(en: string, cs: string): GenreGuide {
  return { en, cs }
}

const GENRE_GUIDES: Record<string, GenreGuide> = {
  superheroes: g(
    `- The child gains ONE clearly-defined superpower tied to a personal trait (e.g. super speed for someone who loves running).
- The villain is silly or misguided, NEVER threatening — defeated by cleverness, not combat.
- Include a costume the child designs themselves with their favourite colours.
- Saving the day means protecting others, not winning a fight.
- Superpower is used three times: first clumsily, then better, then perfectly.`,
    `- Dítě získá JEDNU jasně danou superschopnost spojenou s jeho vlastností (rychlost pro toho, kdo miluje běh).
- Záporák je směšný nebo omyl, NIKDY strašidelný — porazen chytrostí, ne bojovností.
- Kostým, který si dítě samo navrhne ve svých oblíbených barvách.
- Záchrana světa = ochrana druhých, ne výhra v boji.
- Schopnost využita třikrát: nejdřív nešikovně, pak lépe, pak dokonale.`,
  ),

  princesses: g(
    `- The princess SOLVES her own problem — no rescuing needed.
- The magical kingdom has at least three imaginative, original inhabitants.
- A quirky magical object (an umbrella that translates animal speech, a mirror that shows tomorrow).
- The lesson is about courage, generosity, or choosing kindness.
- Include at least one funny moment — palace protocol gone wrong, royal mishap.`,
    `- Princezna SAMA řeší svůj problém — nepotřebuje zachránce.
- Kouzelné království má alespoň tři originální, imaginativní obyvatele.
- Zvláštní kouzelný předmět (deštník překládající zvířecí řeč, zrcadlo ukazující zítřek).
- Poučení o odvaze, štědrosti nebo volbě laskavosti.
- Alespoň jeden vtipný moment — palácový protokol jde bokem, královský trapas.`,
  ),

  dragons: g(
    `- The dragon and child START as strangers — trust is earned across the story.
- Dragon has ONE endearing quirk (hiccups that produce tiny rainbows, fear of butterflies).
- The dragon's cave holds a secret that matters to the plot.
- "Battle" (if any) is a battle of wits or a dance of co-operation, never violent.
- Ending: dragon and child part as true friends; dragon promises to visit on birthdays.`,
    `- Drak a dítě ZAČÍNAJÍ jako cizinci — důvěra se buduje v průběhu příběhu.
- Drak má JEDNU roztomilou zvláštnost (škytavka vytvářející duhové obláčky, strach z motýlů).
- Drakova jeskyně skrývá tajemství, které je pro příběh klíčové.
- "Boj" (pokud existuje) je souboj důvtipu nebo spolupráce, nikdy násilný.
- Závěr: drak a dítě se loučí jako skuteční přátelé; drak slíbí návštěvu na narozeniny.`,
  ),

  space: g(
    `- The child's spacecraft has a name, a colour scheme, and one special feature (a garden module, a music player for warp speed).
- Visit exactly TWO alien worlds with contrasting landscapes.
- One friendly alien companion who doesn't speak the same language — communication is fun and gestures-based.
- A scientific wonder explained simply (how stars are born, why planets are round).
- The journey home feels warm and cosy — Earth's blue glow grows bigger through the window as the child drifts off.`,
    `- Dítěova kosmická loď má jméno, barevné schéma a jednu speciální funkci (zahradní modul, hudební přehrávač na rychlost světla).
- Navštívit přesně DVĚ mimozemské světy s kontrastními krajinami.
- Jeden přátelský mimozemšťan, který nemluví stejným jazykem — komunikace je zábavná a gestová.
- Vědecký objev vysvětlený jednoduše (jak se rodí hvězdy, proč jsou planety kulaté).
- Cesta domů je teplá a útulná — modrá záře Země roste v okně, zatímco dítě usíná.`,
  ),

  dinosaurs: g(
    `- All dinosaurs are gentle giants or tiny curious companions (no predator terror).
- Include real dinosaur names, sizes, and one genuine fact per dinosaur met.
- The child "adopts" a baby dinosaur for the adventure, returning it safely at the end.
- Prehistoric setting rich with ferns, volcanic sunsets, amber forests.
- Dinosaur world starts winding down for the night as the story ends — everyone resting.`,
    `- Všichni dinosauři jsou laskaví obři nebo malí zvídaví společníci (žádný strach z predátorů).
- Zahrnutí skutečných názvů dinosaurů, velikostí a jednoho pravdivého faktu o každém dinosaurovi.
- Dítě "adoptuje" malého dinosaura na dobrodružství a na konci ho bezpečně vrátí.
- Pravěké prostředí bohaté na kapradiny, sopečné západy slunce, jantarové lesy.
- Svět dinosaurů se začíná ukládat ke spánku, jak příběh končí — všichni odpočívají.`,
  ),

  cars: g(
    `- The car has a name, a personality, and an engine sound rendered as words ("vrrrm-vrrrm-sshhhh").
- The race or journey features THREE distinct landscapes (city, mountain pass, meadow).
- A mechanical problem solved through teamwork with a mechanic friend.
- Emphasise fair play — winning matters less than how you race.
- At the finish: engines cooling, quiet pit lane, stars appearing above the track.`,
    `- Auto má jméno, osobnost a zvuk motoru vyjádřený slovy ("vrrrm-vrrrm-sshhhh").
- Závod nebo cesta prochází TŘEMI různými krajinami (město, horský průsmyk, louka).
- Technický problém vyřešen spoluprací s mechanikem-přítelem.
- Důraz na fair play — výhra je méně důležitá než způsob závodění.
- V cíli: chladnoucí motory, tichý boxový lane, hvězdy se objevují nad tratí.`,
  ),

  ninjas: g(
    `- A secret dojo (hidden in a waterfall, inside a giant tree) where the child learns three techniques.
- Training montage: first lesson fails, second improves, third succeeds beautifully.
- The "mission" is to recover something lost (a friend's laughter, a village's stars) — not to fight anyone.
- A wise, gentle master with one memorable koan or piece of advice.
- Moonlit rooftop sequences — describe the stillness, the silver light, the breathing.`,
    `- Tajná dódžo (ukrytá ve vodopádu, uvnitř gigantického stromu) kde se dítě naučí tři techniky.
- Tréninková montáž: první lekce selže, druhá se zlepší, třetí krásně uspěje.
- "Mise" spočívá v nalezení něčeho ztraceného (smích přítele, hvězdy vesnice) — ne v boji.
- Moudrý, laskavý mistr s jedním zapamatovatelným příslovím nebo radou.
- Sekvence na měsícem ozářené střeše — popsat klid, stříbrné světlo, dýchání.`,
  ),

  pirates: g(
    `- The ship has a name, a flag designed by the crew, and a quirky crew member (a parrot who only speaks in riddles, a sailor who bakes incredible bread).
- A treasure map with three clues to decode — one per island visited.
- The treasure turns out to be something non-material (a friendship, a skill, a memory).
- Sea during the day = adventure; sea at night = stars reflected in still water, everyone asleep in hammocks.`,
    `- Loď má jméno, vlajku navrženou posádkou a jednoho zvláštního člena posádky (papoušek mluvící jen hádankami, námořník pečící úžasný chléb).
- Mapa pokladu se třemi vodítky k rozluštění — jedno na každém navštíveném ostrově.
- Poklad se ukáže být nemateriální (přátelství, dovednost, vzpomínka).
- Moře přes den = dobrodružství; moře v noci = hvězdy odrážející se v klidné vodě, všichni spí v houpacích sítích.`,
  ),

  unicorns: g(
    `- The unicorn's magic is powered by a specific emotion (joy, gratitude, wonder) — not generically "good wishes".
- Rainbow world with synesthetic details: colours have sounds, shapes have scents.
- The unicorn and child heal something broken together (a friendship, a wilting garden).
- Horn glows more softly as the adventure ends — a visual signal of approaching rest.
- Mane described in terms of textures and warmth; riding feels like floating on a cloud.`,
    `- Magie jednorožce je poháněna konkrétní emocí (radost, vděčnost, úžas) — ne obecně "dobrými přáními".
- Duhový svět se synestickými detaily: barvy mají zvuky, tvary mají vůně.
- Jednorožec a dítě společně uzdraví něco zlomeného (přátelství, vadnoucí zahradu).
- Roh světélkuje stále jemněji, jak dobrodružství končí — vizuální signál blížícího se odpočinku.
- Hříva popsána texturami a teplem; jízda se podobá plutí na oblaku.`,
  ),

  mermaids: g(
    `- The underwater world has bioluminescent coral streets and a city built on whale song.
- The child breathes underwater via a magic seashell necklace — describe the first breath sensation.
- A sea creature companion (an octopus DJ, a narwhal postal worker, a crab cartographer).
- An environmental threat (a lost anchor, nets of forgotten fishing line) is resolved peacefully.
- End above water: child floats on their back, stars reflected in the sea, waves rocking gently.`,
    `- Podmořský svět má bioluminescenční korálové ulice a město postavené na velrybím zpěvu.
- Dítě dýchá pod vodou díky kouzelné náhrdelníku z mušle — popsat pocit prvního nádechu.
- Mořský společník (chobotnicový DJ, narvalový poštmistr, krabský kartograf).
- Ekologická hrozba (ztracená kotva, sítě zapomenuté rybářské liny) vyřešena mírumilovně.
- Konec nad vodou: dítě plave na zádech, hvězdy se odrážejí v moři, vlny lehce kolébají.`,
  ),

  fairies: g(
    `- Fairy wings described in unique detail (veined like autumn leaves, stitched from moonbeams).
- The fairy village exists inside something ordinary — a hollow oak, a gap in a stone wall.
- A fairy problem that only a human child's size or perspective can solve.
- Fairy dust: glowing, slow-floating, smells faintly of honey and rain.
- Night market scene: tiny lanterns, music from acorn-cap drums, the whole wood humming.`,
    `- Vílí křídla popsána originálně (žilkovaná jako podzimní listí, sešitá z měsíčních paprsků).
- Vílí vesnice existuje uvnitř něčeho obyčejného — dutý dub, mezera v kamenné zdi.
- Vílí problém, který může vyřešit pouze lidské dítě svou velikostí nebo perspektivou.
- Vílí prach: svítící, pomalu plovoucí, slabě voní medem a deštěm.
- Noční tržiště: malé lampičky, hudba z bubnů z žaludů, celý les bzučí.`,
  ),

  knights: g(
    `- The castle has a name and three distinct towers with different functions (library, kitchen, a tower full of stars).
- The quest is to return something lost rather than slay something.
- The dragon (if any) is the knight's best friend by chapter three.
- Armour described in sensory detail: cool metal in morning, warm from the afternoon sun, gleaming.
- Tournament scene where kindness, not strength, wins the day.`,
    `- Hrad má jméno a tři různé věže s různými funkcemi (knihovna, kuchyně, věž plná hvězd).
- Výprava spočívá v vrácení ztracené věci, ne v zabití něčeho.
- Drak (pokud existuje) je rytíř nejlepší přítel do třetí kapitoly.
- Brnění popsáno smyslovým detailem: ráno studený kov, odpoledne teplý sluncem, lesklý.
- Turnajová scéna, kde vyhraje laskavost, ne síla.`,
  ),

  forest: g(
    `- FOUR named forest animals with distinct personalities (not archetypes).
- Each animal offers a different kind of help: practical, emotional, physical, clever.
- The forest has a secret — a clearing where moonlight pools like silver water on quiet nights.
- Seasonal richness: smells of pine, earth after rain, the specific sound of wind in different trees.
- Story ends in that clearing; animals curl up together; forest falls into peaceful night sounds.`,
    `- ČTYŘI pojmenovaná lesní zvířata s odlišnými osobnostmi (ne archetypy).
- Každé zvíře nabídne jiný druh pomoci: praktickou, emocionální, fyzickou, chytrou.
- Les má tajemství — paseky kde se měsíční světlo sbírá jako stříbrná voda v tichých nocích.
- Sezónní bohatost: vůně borovic, země po dešti, specifický zvuk větru v různých stromech.
- Příběh končí na té pasece; zvířata se kroutí k sobě; les upadá do pokojných nočních zvuků.`,
  ),

  farm: g(
    `- The farm wakes up and goes to sleep — story arc mirrors a full farm day.
- Each animal has ONE funny habit that becomes plot-relevant.
- A barn mystery (a missing egg, a runaway piglet) is solved together.
- The rooster's evening call signals everyone to rest.
- Final image: barn doors closed, hay smelling warm and sweet, animals breathing slowly in the dark.`,
    `- Farma se probouzí a usíná — oblouk příběhu zrcadlí celý farmaření den.
- Každé zvíře má JEDEN zábavný zvyk, který se stane relevantní pro děj.
- Záhada stodoly (chybějící vejce, uprchlé prasátko) vyřešena společně.
- Večerní kohoutiové volání dává signál všem k odpočinku.
- Závěrečný obraz: zavřené dveře stodoly, seno voní teplé a sladce, zvířata pomalu dýchají ve tmě.`,
  ),

  ocean: g(
    `- Two deep-sea zones visited: sunlight zone (colourful, busy) and twilight zone (mysterious, beautiful).
- A piece of treasure that turns out to be important to an ocean creature.
- Bioluminescence described in warm, wonder-filled terms — not eerie.
- An ocean current as a character: a warm river in the sea that carries messages.
- End: child surfaces; the sea glitters under the moon; the ocean hums a lullaby.`,
    `- Dvě podmořské zóny navštíveny: sluneční zóna (barevná, živá) a soumračná zóna (tajemná, krásná).
- Poklad, který se ukáže být důležitý pro mořského tvora.
- Bioluminiscence popsána teplými, úžasuplnými slovy — ne děsivě.
- Mořský proud jako postava: teplá řeka v moři přenášející zprávy.
- Konec: dítě se vynoří; moře třpytí pod měsícem; oceán zpívá ukolébavku.`,
  ),

  wizards: g(
    `- A magical school that is NOT a copy of Hogwarts — set it in a lighthouse, a cloud city, a library that floats on a lake.
- The child learns one SPECIFIC spell (not "a powerful spell") — describe exactly what it does and feels like.
- A magical creature familiar (a compass moth, an ink-fish) helps solve the problem.
- A forbidden section of the library holds a clue — not danger, just forgotten knowledge.
- End: potions simmering down, candles guttering, students returning to warm dormitories.`,
    `- Kouzelná škola, která NENÍ kopií Bradavic — usazena v majáku, oblačném městě, knihovně plovoucí na jezeře.
- Dítě se naučí JEDNO KONKRÉTNÍ kouzlo (ne "mocné kouzlo") — přesně popsat co dělá a jak se to cítí.
- Kouzelný společník (kompasový moth, inkoustová ryba) pomáhá vyřešit problém.
- Zakázaná sekce knihovny skrývá vodítko — ne nebezpečí, jen zapomenuté znalosti.
- Konec: dojíždějící lektvary, dohořívající svíčky, studenti se vracejí do teplých kolejí.`,
  ),

  robots: g(
    `- The robot friend has a distinct name and was built for one purpose it now questions.
- Robot emotions expressed through sounds and light colours (a sad bleep, a happy green glow).
- A city where humans and robots build things together — emphasise co-creation.
- The robot solves one problem using its original function in an unexpected, creative way.
- At night, robots enter standby mode — describe it as a kind of dreaming, gently.`,
    `- Robot-přítel má zřetelné jméno a byl postaven pro jeden účel, který nyní zpochybňuje.
- Robotické emoce vyjadřované zvuky a barvami světla (smutné pípání, veselá zelená záře).
- Město kde lidé a roboti společně stavějí — důraz na spoluvytváření.
- Robot vyřeší jeden problém pomocí své původní funkce neočekávaným, kreativním způsobem.
- V noci roboti vstupují do pohotovostního režimu — popsat to jako druh snění, jemně.`,
  ),

  football: g(
    `- The team has a name, a kit colour, and each player has a clear role and personality.
- The big match has a half-time setback (injury, rain, missed penalty) that requires team regrouping.
- Victory is collective — no single star moment, everyone contributes.
- After the final whistle: muddy kit, exhausted but joyful, team meal together.
- Final image: ball resting in empty net, stadium lights off one by one, stars above.`,
    `- Tým má jméno, barvu dresu a každý hráč jasnou roli a osobnost.
- Velký zápas má poločasový zádrh (zranění, déšť, zmeškaná penalta) vyžadující přeskupení týmu.
- Vítězství je kolektivní — žádný hvězdný moment, každý přispěje.
- Po závěrečném hvizdu: blátivý dres, vyčerpaný ale radostný, společné jídlo týmu.
- Závěrečný obraz: míč odpočívá v prázdné síti, světla stadionu zhasínají jedno po druhém, hvězdy nahoře.`,
  ),

  dogs: g(
    `- The dog companion has a specific breed with trait-appropriate qualities used in the story.
- A dog adventure: sniffing out a mystery (lost object, hidden friend) using scent described vividly.
- Include the unconditional love moment — the dog waiting, the reunion, the wagging tail.
- The world seen from dog height — described with wonder and specific detail.
- Evening ritual: dog curled at the foot of the bed, both child and dog closing eyes together.`,
    `- Psí společník má specifické plemeno s vlastnostmi vhodnými pro příběh.
- Psí dobrodružství: čichání záhady (ztracená věc, schovaný přítel) pomocí čichu popsaného živě.
- Zahrnutí momentu bezpodmínečné lásky — pes čekající, shledání, vrtění ocasem.
- Svět viděný z psí výšky — popsán s úžasem a specifickým detailem.
- Večerní rituál: pes zkroucený u nohou postele, dítě i pes zavírají oči společně.`,
  ),

  trains: g(
    `- The train has a personality expressed through its engine sounds (hmm-hmm-WHOOOOSH = "I'm thinking!").
- Three stops, each with a distinct weather and culture.
- A mysterious parcel in the luggage van — contents revealed at last stop to help someone.
- Describe the sensation of train travel: rhythm of rails, rocking motion, changing light through windows.
- Final station arrival at dusk — city lights coming on one by one, time to sleep.`,
    `- Vlak má osobnost vyjadřovanou zvuky motoru (hmm-hmm-WHOOOOSH = "Přemýšlím!").
- Tři zastávky, každá s odlišným počasím a kulturou.
- Tajemný balíček ve vagonu na zavazadla — obsah odhalen na poslední zastávce, aby pomohl někomu.
- Popsat vjem cestování vlakem: rytmus kolejí, houpavý pohyb, měnící se světlo přes okna.
- Příjezd na konečnou za soumraku — světla města se rozsvěcují jedno po druhém, čas na spánek.`,
  ),

  firefighters: g(
    `- The fire station is the child's home base — describe it with warmth and pride.
- The call-out involves rescuing a PERSON OR ANIMAL, not fighting fire for its own sake.
- Equipment described in sensory detail: the cool weight of the helmet, the smell of rubber boots.
- Teamwork is the central value — no one is a hero alone.
- After the rescue: back at the station, warm soup, gear hung up, sliding down the pole into sleep.`,
    `- Hasičská stanice je domovská základna dítěte — popsat ji s teplem a hrdostí.
- Výjezd zahrnuje záchrana OSOBY NEBO ZVÍŘETE, ne boj s ohněm pro sebe.
- Vybavení popsáno smyslovým detailem: chladná váha helmy, vůně gumových bot.
- Týmová práce je ústřední hodnotou — nikdo není hrdina sám.
- Po záchraně: zpět na stanici, teplá polévka, pověšená výstroj, klouzání po tyči do spánku.`,
  ),

  construction: g(
    `- Machines have names and specialities (Benny the Backhoe who loves puzzles, Rosie the Crane who sings).
- A big build project: describe the stages — foundation, walls, roof — with appropriate wonder.
- A problem on site (a pipe in the wrong place, a missing beam) solved through clever thinking.
- The finished building has a purpose that helps the community (a playground, a library, a bridge).
- End: tools resting, machines silent, the new building standing in evening light.`,
    `- Stroje mají jména a speciality (Béďa Bagr co miluje hádanky, Ráfka Jeřáb co zpívá).
- Velký stavební projekt: popsat fáze — základy, stěny, střecha — s přiměřeným úžasem.
- Problém na staveništi (potrubí na špatném místě, chybějící trám) vyřešen chytrým přemýšlením.
- Dokončená budova slouží komunitě (hřiště, knihovna, most).
- Konec: nástroje odpočívají, stroje tiché, nová budova stojí ve večerním světle.`,
  ),

  cowboys: g(
    `- The ranch or trail has a name and a specific landscape (red mesa, silver river, cottonwood grove).
- A horse companion with a distinct personality — give it a name and one fun quirk.
- The adventure involves helping a stranger (lost traveller, stranded cattle) — Western hospitality.
- Camp fire scene: describe the stars above the prairie, the crackle of the fire, the smell of smoke.
- Sleeping under the stars: bedroll, coyote howling far away (not scary), Milky Way overhead.`,
    `- Ranč nebo trasa má jméno a specifickou krajinu (červená mesa, stříbrná řeka, háj topol).
- Koňský společník s zřetelnou osobností — dát mu jméno a jeden zábavný zvyk.
- Dobrodružství zahrnuje pomoc cizinci (ztracený cestovatel, uvízlý dobytek) — westernová pohostinnost.
- Scéna u táborového ohně: popsat hvězdy nad prérií, praskání ohně, vůni kouře.
- Spánek pod hvězdami: spacák, kojot vyjící zdaleka (ne děsivě), Mléčná dráha nahoře.`,
  ),

  jungle: g(
    `- The jungle is alive — use all five senses: macaw calls, petrichor, dappled light, the taste of jungle fruit.
- An animal guide who knows the jungle's secret paths (a slow loris, a tapir, a capybara).
- A "discovery" moment: a hidden waterfall, an ancient carved stone, a clearing full of fireflies.
- Danger is replaced by challenge: crossing a river on stepping-stones, navigating a canyon.
- End: hammock in the tree canopy, stars through leaves, jungle settling into night chorus.`,
    `- Džungle žije — použít všech pět smyslů: volání ara, vůně petrichoru, tečkované světlo, chuť džunglového ovoce.
- Zvířecí průvodce znající tajné cesty džungle (pomalý loris, tapír, kapybara).
- Moment "objevu": skrytý vodopád, starý vyřezávaný kámen, čistina plná světlušek.
- Nebezpečí nahrazeno výzvou: přechod řeky po kamenech, navigace kaňonem.
- Konec: houpací síť v korunách stromů, hvězdy přes listy, džungle upadá do nočního chóru.`,
  ),

  time_travel: g(
    `- The time machine is small and personal (a pocket watch, a map with a hole in it).
- Visit exactly TWO time periods: one past, one future — contrasting but both optimistic.
- The child must return something to its rightful time without changing history.
- Time travel sensation described: colours blurring, sounds layering, a feeling of all moments at once.
- Return home: everything the same but seen newly; the ordinary glows.`,
    `- Stroj času je malý a osobní (kapesní hodinky, mapa s dírou).
- Navštívit přesně DVĚ časová období: jedno v minulosti, jedno v budoucnosti — kontrastní, ale obě optimistická.
- Dítě musí vrátit něco do správného času bez změny historie.
- Vjem cestování časem: rozostřující se barvy, vrstvení zvuků, pocit všech momentů najednou.
- Návrat domů: vše stejné, ale viděné nově; obyčejné svítí.`,
  ),

  candy: g(
    `- The candy kingdom has geography: Caramel Mountains, the Lollipop Forest, the Fizzy River.
- Candy creatures with candy-appropriate traits (a gummy bear who bounces everywhere, a chocolate knight who melts in the sun).
- The problem: the sweetness is FADING — and the fix requires something non-sweet (music, laughter, a kind word).
- Sensory: describe colours, smells, and textures with playful precision.
- End: candy world restored, everyone sharing a feast under a sugar-spun moon.`,
    `- Sladkové království má geografii: Karamelové hory, les lízátek, perlivá řeka.
- Sladkové bytosti s příslušnými vlastnostmi (gumový medvěd co všude skáče, čokoládový rytíř co se taví na slunci).
- Problém: sladkost MIZÍ — a lék vyžaduje něco nesladkého (hudbu, smích, laskavé slovo).
- Smyslové: popsat barvy, vůně a textury s hravou přesností.
- Konec: obnovený sladkový svět, sdílení slavnosti pod cukrově upředeným měsícem.`,
  ),

  christmas: g(
    `- Story set in the 24 hours before Christmas — build anticipation gently.
- Include a small problem (a missing gift, a lost reindeer) that needs one child's help.
- Santa's workshop: describe the sounds, smells, and warmth.
- Elves have specialities: one wraps, one tests, one remembers names.
- Ending: child back in bed, hearing sleigh bells fading, snow falling softly outside.`,
    `- Příběh v 24 hodinách před Vánoci — jemně budovat napětí.
- Zahrnout malý problém (chybějící dárek, ztracený sob) vyžadující pomoc jednoho dítěte.
- Santova dílna: popsat zvuky, vůně a teplo.
- Elfové mají speciality: jeden balí, jeden testuje, jeden si pamatuje jména.
- Konec: dítě zpět v posteli, slyší vzdalující se zvonečky saní, venku jemně padá sníh.`,
  ),

  halloween: g(
    `- Friendly, cozy Halloween — emphasise costumes, pumpkins, and community.
- The "scary" characters are shy or misunderstood (a ghost who just wants a friend, a witch who gardens).
- Trick-or-treat adventure with a mystery house that turns out to be the nicest on the street.
- Sensory: autumn leaves, candle smells, the sound of rustling costumes.
- End: candy counted, costumes hung up, carved pumpkin glowing on the porch, time for sleep.`,
    `- Přátelský, útulný Halloween — důraz na kostýmy, dýně a komunitu.
- "Strašidelné" postavy jsou stydlivé nebo nepochopené (duch co chce jen přítele, čarodějnice co zahradničí).
- Dobrodružství při sběru sladkostí s záhadným domem, který se ukáže být nejhezčím na ulici.
- Smyslové: podzimní listí, vůně svíček, zvuk šustících kostýmů.
- Konec: sladkosti spočítány, kostýmy pověšeny, vyřezaná dýně svítí na verandě, čas na spánek.`,
  ),

  ballet: g(
    `- The ballet school is magical and demanding — show the joy of mastery, not just the glamour.
- One specific ballet move the child is learning (a pirouette, an arabesque) — describe it physically.
- The performance night: nerves, the smell of rosin, lights coming up, the first note.
- A moment of connection with the audience — describe the silence of a held breath.
- After the performance: flowers, warm dressing room, exhausted but glowing.`,
    `- Baletní škola je magická a náročná — ukázat radost z mistrovství, ne jen glamour.
- Jeden konkrétní baletní pohyb co se dítě učí (pirueta, arabeska) — popis fyzicky.
- Výkon večer: nervy, vůně kanafasu, světla přicházející nahoru, první nota.
- Moment spojení s publikem — popsat ticho zadrženého dechu.
- Po výkonu: květiny, teplá šatna, vyčerpaná ale zářící.`,
  ),

  music: g(
    `- Each instrument met in the adventure becomes a character with a personality.
- The quest: restore a melody that's gone missing from the world (describe the world without it).
- A concert scene where every instrument plays its part — no instrument is better than another.
- Describe music synaesthetically: colours, shapes, temperatures of sounds.
- End: the melody restored, everything humming quietly, the world drifting off to its own song.`,
    `- Každý nástroj potkávaný v dobrodružství se stává postavou s osobností.
- Výprava: obnovit melodii co zmizela ze světa (popsat svět bez ní).
- Koncertní scéna kde každý nástroj hraje svůj díl — žádný nástroj není lepší než druhý.
- Popsat hudbu synesticky: barvy, tvary, teploty zvuků.
- Konec: melodie obnovena, vše tiše brouká, svět unáší do vlastní písně.`,
  ),

  science: g(
    `- The child's lab is cluttered, personal, and wonderful — describe it with love.
- One real scientific concept at the heart of the adventure (surface tension, refraction, echo).
- An experiment goes unexpectedly RIGHT and opens a mystery to explore.
- A mentor scientist who is enthusiastic, not superior — they learn something from the child.
- End: notebook full, experiment results noted, stars through the lab window, mind full of questions.`,
    `- Dítěova laboratoř je přeplněná, osobní a úžasná — popsat ji s láskou.
- Jeden skutečný vědecký koncept v srdci dobrodružství (povrchové napětí, lom světla, ozvěna).
- Experiment jde neočekávaně SPRÁVNĚ a otevírá záhadu k prozkoumání.
- Mentorský vědec nadšený, ne nadřazený — naučí se něco od dítěte.
- Konec: zápisník plný, výsledky experimentu zaznamenány, hvězdy přes laboratorní okno, mysl plná otázek.`,
  ),

  nature: g(
    `- A specific ecosystem as the setting (a peat bog, a chalk meadow, a tidal pool).
- An environmental problem revealed gently — not climate doom, but a local, fixable challenge.
- The child's solution is simple but meaningful: plant one thing, clean one patch, tell one person.
- Animal guides who explain the ecosystem in one sentence each.
- End: the ecosystem a little better; child walking home through dusk; one more star visible.`,
    `- Specifický ekosystém jako prostředí (rašeliniště, křídová louka, přílivový bazén).
- Ekologický problém odhalen jemně — ne klimatický armageddon, ale místní, řešitelná výzva.
- Dítěovo řešení jednoduché ale smysluplné: zasadit jednu věc, vyčistit jeden kousek, říct jedné osobě.
- Zvířecí průvodci vysvětlující ekosystém v jedné větě každý.
- Konec: ekosystém trochu lepší; dítě jdoucí domů za soumraku; jedna další hvězda viditelná.`,
  ),

  arctic: g(
    `- The Arctic is introduced in wonder, not fear: silence, impossibly blue ice, the northern lights.
- A polar animal companion (a snowy owl, an arctic fox, a young walrus) with a specific personality.
- The aurora borealis as a character — it responds to feelings, flares when something beautiful happens.
- Finding shelter for the night: an igloo, a snow hollow lined with animal warmth.
- End: northern lights dancing, everyone warm inside, the cold world beautiful outside.`,
    `- Arktika představena s úžasem, ne strachem: ticho, nemožně modré ledovce, polární záře.
- Polární zvířecí společník (sněžná sova, polární liška, mladý mrož) s konkrétní osobností.
- Polární záře jako postava — reaguje na pocity, vzplaní když se stane něco krásného.
- Nalezení nočního útulku: iglu, sněžná dutina vystlaná zvířecím teplem.
- Konec: tančící polární záře, všichni teplo uvnitř, chladný svět krásný venku.`,
  ),

  bugs: g(
    `- Bug world seen at insect scale — grass is a forest, a raindrop is an ocean.
- Four insects with distinct jobs and social roles (navigator, builder, singer, watcher).
- One real insect behaviour explained through the story (bee waggle dance, firefly light codes).
- A threat to the colony (a heavy shoe, a hosepipe) repelled by co-operative smarts.
- Twilight: bugs settling into their beds (leaf cups, soil tunnels, cobweb hammocks).`,
    `- Svět broučků viděný v hmyzím měřítku — tráva je les, kapka deště je oceán.
- Čtyři hmyzy s odlišnými úlohami a sociálními rolemi (navigátor, stavitel, zpěvák, strážce).
- Jedno skutečné hmyzí chování vysvětlené příběhem (tanec včely, světelné kódy světlušek).
- Hrozba kolonii (těžká bota, hadice) odvrácena kooperativní chytrostí.
- Soumrak: broučci ukládající se do svých postelí (kelímky listů, norky v zemi, pavučinové sítě).`,
  ),

  horses: g(
    `- The horse-child bond is the heart of the story — build it in stages (wary, curious, trusting, devoted).
- Describe riding: the rhythm, the warmth of the horse's neck, the view from the saddle.
- A horse show or trail ride with a specific challenge (a spooky shadow, a tricky fence).
- The horse communicates through ears, eyes, and breath — the child learns to read these.
- Evening stable: grooming, the smell of hay, horse breathing slowing, both of you calm.`,
    `- Pouto kůň-dítě je srdcem příběhu — budovat ho po etapách (opatrný, zvídavý, důvěřující, oddaný).
- Popsat jízdu: rytmus, teplo koňského krku, pohled ze sedla.
- Koňská show nebo výlet terénem s konkrétní výzvou (strašidelný stín, složitý plot).
- Kůň komunikuje ušima, očima a dechem — dítě se naučí je číst.
- Večerní stáj: hřebelcování, vůně sena, zpomalení koňova dechu, oba klidní.`,
  ),

  cooking: g(
    `- The kitchen is a magical place — smells lead the story as much as plot.
- A recipe with three impossible ingredients that turn out to be metaphorical (a spoonful of laughter, midnight's first chill).
- Cooking as teamwork: each character contributes one thing.
- A moment of failure (sunken cake, burnt caramel) that teaches improvisation.
- The meal shared: describe taste, warmth, conversation, the full-stomach feeling of contentment.`,
    `- Kuchyně je magické místo — vůně vedou příběh stejně jako děj.
- Recept se třemi nemožnými ingrediencemi, které se ukáží být metaforické (lžička smíchu, první chlad půlnoci).
- Vaření jako týmová práce: každá postava přispěje jednou věcí.
- Moment selhání (propadlý dort, spálený karamel) co učí improvizaci.
- Sdílené jídlo: popsat chuť, teplo, konverzaci, pocit plného břicha spokojenosti.`,
  ),

  garden: g(
    `- The garden has its own ecology: a compost pile with characters, a pond with a story, a hedge with a secret door.
- Plants speak — not constantly, only at dusk when the garden is almost asleep.
- A seed planted at the start of the story; check on it at the end — it has sprouted.
- Describe the physical act of gardening: smell of turned earth, grit under fingernails, the satisfaction of weeding.
- Evening garden: fireflies waking, late bees drowsy, jasmine scent strongest before dark.`,
    `- Zahrada má vlastní ekologii: kompostová hromada s postavami, rybník s příběhem, živý plot s tajnými dveřmi.
- Rostliny mluví — ne pořád, jen za soumraku kdy zahrada téměř spí.
- Semínko zasazené na začátku příběhu; zkontrolovat na konci — vyklíčilo.
- Popsat fyzický akt zahradničení: vůně obrácené půdy, písek pod nehty, uspokojení z pletí.
- Večerní zahrada: probouzející se světlušky, ospale pozdní včely, nejsilnější vůně jasmínu před tmou.`,
  ),

  czech_folklore: g(
    `- Draw on authentic Czech folklore: Vodník, Rusalky, forest spirits, the Noonday Witch — but make them friendly or misunderstood.
- Use a traditional three-part structure: three tasks, three wishes, three days.
- Magic items rooted in tradition: a magical staff, a spinning wheel, a cloak of invisibility made of nettles.
- The lesson follows Czech folk wisdom: honesty is rewarded, greed is punished, kindness to strangers brings luck.
- Language: include a few classic Czech folk-tale phrases ("Bylo nebylo…", "A žili šťastně…").`,
    `- Čerpat z autentického českého folklóru: Vodník, Rusalky, lesní duchy, Polednice — ale přátelské nebo nepochopené.
- Použít tradiční tříčlennou strukturu: tři úkoly, tři přání, tři dny.
- Kouzelné předměty zakořeněné v tradici: kouzelná hůl, kolovrat, plášť neviditelnosti z kopřiv.
- Poučení z české lidové moudrosti: poctivost je odměněna, chamtivost potrestána, laskavost k cizincům přináší štěstí.
- Jazyk: zahrnout několik klasických pohádkových frází ("Bylo nebylo…", "A žili šťastně…").`,
  ),

  dragon_slayer: g(
    `- The dragon is not a monster but a misunderstood ancient being protecting something precious.
- The "quest" begins as a slaying but ends as a negotiation or rescue.
- The true villain is a rumour or a lie (the dragon was blamed for something a human did).
- The hero's weapons are patience, listening, and a brave heart — not a sword.
- End: dragon and child allies; kingdom safer for understanding; stars wheeling overhead.`,
    `- Drak není monstrum, ale nepochopená prastarí bytost chránící něco vzácného.
- "Výprava" začíná jako zabití, ale končí vyjednáváním nebo záchranou.
- Pravý padouch je fáma nebo lež (drak byl obviněn z něčeho, co udělal člověk).
- Hrdinovy zbraně jsou trpělivost, naslouchání a statečné srdce — ne meč.
- Konec: drak a dítě jsou spojenci; království bezpečnější díky pochopení; hvězdy se točí nahoře.`,
  ),

  enchanted_forest: g(
    `- Every tree in this forest has a name and a memory — the oldest remembers the first sunrise.
- A path that changes depending on what the traveller most needs (comfort, adventure, quiet, company).
- Three forest guardians: one of wisdom, one of wildness, one of stillness — each teaches something.
- Describe the forest at twilight: the moment it shifts from day-forest to night-forest.
- End: the forest exhales, all creatures find their place, the child finds theirs too — warm and still.`,
    `- Každý strom v tomto lese má jméno a vzpomínku — nejstarší si pamatuje první východ slunce.
- Cesta co se mění podle toho, co cestovatel nejvíce potřebuje (útěchu, dobrodružství, klid, společnost).
- Tři lesní strážci: jeden moudrosti, jeden divočiny, jeden ticha — každý něco naučí.
- Popsat les za soumraku: moment kdy se mění z denního lesa na noční les.
- Konec: les vydechne, všechny bytosti najdou své místo, dítě také — teplé a klidné.`,
  ),

  emotions: g(
    `- Each emotion is a character the child meets (Worried is a small grey cloud, Brave is a warm amber light).
- The child's problem is an emotional one — feeling left out, nervous about something new, missing someone.
- Each emotion character offers a strategy or gift, not a solution (Worried teaches checking, Brave teaches stepping forward).
- No emotion is bad — each has a use and a time. Even Fear is useful.
- End: child returns with new tools; the world feels the same but navigable; sleep feels safe.`,
    `- Každá emoce je postava, se kterou se dítě setkává (Starostlivost je malý šedý obláček, Odvaha je teplé jantarové světlo).
- Dítěův problém je emocionální — cítit se vynechaně, nervózně před něčím novým, chybět někoho.
- Každá emocionální postava nabídne strategii nebo dar, ne řešení (Starostlivost učí kontrolovat, Odvaha učí udělat krok vpřed).
- Žádná emoce není špatná — každá má použití a čas. I Strach je užitečný.
- Konec: dítě se vrací s novými nástroji; svět se zdá stejný, ale zvládnutelný; spánek se zdá bezpečný.`,
  ),

  abc: g(
    `- Each letter the child meets is a gateway to a mini-adventure (A opens a door to an Avalanche of Apples).
- Weave five letters naturally through the story — don't force all 26.
- Each letter's adventure teaches a single concept or skill.
- The "alphabet keeper" is an eccentric character (an elderly librarian who is secretly a letter herself).
- End: the child has learned that letters are keys — every book a door; every word an invitation.`,
    `- Každé písmeno, se kterým se dítě setkává, je brána do mini-dobrodružství (A otevírá dveře do laviny Ant, Andulky, Automobilu).
- Přirozeně prolnout pět písmen příběhem — nevynucovat všech 26.
- Dobrodružství každého písmene naučí jeden koncept nebo dovednost.
- "Strážce abecedy" je excentrická postava (starší knihovník/ka, která je tajně sama písmenem).
- Konec: dítě se naučilo, že písmena jsou klíče — každá kniha dveřmi; každé slovo pozvánkou.`,
  ),

  birds: g(
    `- The story is structured as a migration — departure, journey, arrival — mirroring the sleep journey.
- Three bird species met: one for speed, one for navigation, one for song.
- Describe flight sensation: updraft, tilting wing, the world shrinking below, clouds at eye level.
- Bird calls as communication — each species has a call rendered in words (the thrush's "pree-pree-tuuu").
- Arrival at the roost: trees heavy with birds, the settling chorus, the gradual silence, sleep.`,
    `- Příběh strukturován jako migrace — odlet, cesta, přílet — zrcadlící cestu ke spánku.
- Tři druhy ptáků setkávaných: jeden pro rychlost, jeden pro navigaci, jeden pro zpěv.
- Popsat pocit letu: stoupající proud, naklonění křídla, svět zmenšující se dole, oblaka v úrovni očí.
- Ptačí volání jako komunikace — každý druh má volání vyjádřené slovy (drozd zpívá "prí-prí-tuuu").
- Příchod na nocovište: stromy plné ptáků, usazovací chór, postupné ticho, spánek.`,
  ),

  submarines: g(
    `- The submarine has a name and a crew of four with distinct specialities (pilot, engineer, cook, scientist).
- Describe the interior: the hum of instruments, the condensation on portholes, bioluminescence outside.
- A dive to explore something specific (an undiscovered trench, a sunken ship with a message aboard).
- The submarine as a cosy capsule in the immense ocean — intimate against the vastness.
- Surfacing at night: stars and sea, the hatch opening to cool air, home on the horizon.`,
    `- Ponorka má jméno a posádku čtyř s odlišnými specialitami (pilot, inženýr, kuchař, vědec).
- Popsat interiér: bzučení přístrojů, kondenzát na iluminátorech, bioluminiscence venku.
- Ponor k prozkoumání něčeho specifického (neobjevená průrva, potopená loď se zprávou na palubě).
- Ponorka jako útulná kapsle v obrovském oceánu — intimní oproti rozlehlosti.
- Vynoření v noci: hvězdy a moře, otevírající se poklop do chladného vzduchu, domov na obzoru.`,
  ),

  mountains: g(
    `- The mountain has a name and a character — it responds to weather, to visitors, to seasons.
- The climb is a journey inward as much as upward: each altitude a new perspective.
- A mountain hut: warmth, wooden walls, a fire, the smell of pine sap and melting snow.
- Summit view described in cinematic, wonder-filled terms — worth every step.
- Descent at dusk: the valley filling with lights, feeling small and safe and enormous all at once.`,
    `- Hora má jméno a charakter — reaguje na počasí, na návštěvníky, na roční doby.
- Výstup je cesta dovnitř stejně jako nahoru: každá nadmořská výška nová perspektiva.
- Horská chata: teplo, dřevěné stěny, oheň, vůně borovicové pryskyřice a tající sněhu.
- Pohled ze summitu popsán kinematicky, plný úžasu — stojí za každý krok.
- Sestup za soumraku: údolí plnící se světly, pocit malosti a bezpečí a obrovskosti najednou.`,
  ),

  circus: g(
    `- The circus has a distinct atmosphere: sawdust, big-top canvas, the smell of popcorn and canvas.
- The child learns ONE circus skill (basic juggling, a cartwheel, walking a rope one inch off the ground).
- Each act the child watches teaches them something useful for later in the story.
- The circus's crisis (a missing performer, a broken prop) is solved by using what was learned.
- After the show: empty ring, a single spotlight, the silence of a big tent at rest.`,
    `- Cirkus má výraznou atmosféru: piliny, plátno velkého stanu, vůně popcornu a plátna.
- Dítě se naučí JEDNU cirkusovou dovednost (základní žonglování, kolo, chůze po laně centimetr nad zemí).
- Každé číslo, které dítě sleduje, ho naučí něco užitečného pro pozdější část příběhu.
- Cirkusová krize (chybějící umělec, roztrhnutá rekvizita) vyřešena tím, co bylo naučeno.
- Po představení: prázdná aréna, jediný reflektor, ticho velkého stanu v klidu.`,
  ),

  weather: g(
    `- Each weather type is a character with a distinct personality (Sun is generous and loud, Fog is quiet and wise, Storm is passionate but short-lived).
- The child is given a weather instrument (a barometer, a cloud-jar) that grants limited weather influence.
- A weather crisis (drought, too much rain) requires listening to all weather characters, not just the most powerful.
- Sky described across the full colour spectrum: dawn to dusk.
- End: all weathers in balance, rain over here, sun over there, rainbow in between, the child at the centre.`,
    `- Každý typ počasí je postava s zřetelnou osobností (Slunce je velkorysé a hlučné, Mlha je tichá a moudrá, Bouřka je vášnivá ale krátkodobá).
- Dítě dostane meteorologický nástroj (barometr, lahvičku na mraky) dávající omezený vliv na počasí.
- Povětrnostní krize (sucho, příliš mnoho deště) vyžaduje naslouchat všem povětrnostním postavám, ne jen nejsilnější.
- Obloha popsána přes celé barevné spektrum: od úsvitu do soumraku.
- Konec: všechna počasí v rovnováze, déšť tamhle, slunce tam, duha mezi tím, dítě uprostřed.`,
  ),

  minecraft: g(
    `- Describe the block world with genuine affection — sunsets over pixel plains, the first-night house, the infinite horizon.
- The adventure involves building something together with an NPC friend (not combat-focused).
- Resource gathering as discovery: each ore or material has a personality.
- The Nether/End equivalent is a beautiful rather than terrifying otherworld.
- End: return to home base as sun sets; torches lit; door closed; safe, warm, built by your own hands.`,
    `- Popsat svět bloků s opravdovou láskou — západ slunce nad pixelovými pláněmi, první noční domeček, nekonečný horizont.
- Dobrodružství zahrnuje stavění něčeho společně s NPC přítelem (ne zaměřeno na boj).
- Sběr zdrojů jako objev: každá ruda nebo materiál má osobnost.
- Ekvivalent Netheru/Endu je krásný, ne děsivý jiný svět.
- Konec: návrat do základního tábora při západu slunce; zapálené pochodně; zavřené dveře; bezpečně, teplo, postaveno vlastníma rukama.`,
  ),

  flowers: g(
    `- The flower kingdom is organised by colour and scent zones, each with different residents.
- A flower blooming for the first time — its first morning, first bee, first raindrop.
- Flower communication through pollen carried on bees (messages travel slowly, carefully, beautifully).
- A withering flower restored not by magic, but by attention, water, and being seen.
- End: the garden at last light, each flower closing for the night, a slow hush of petals.`,
    `- Království květin je organizováno barevnými a vonnými zónami, každá s různými obyvateli.
- Poprvé kvetoucí květina — její první ráno, první včela, první kapka deště.
- Komunikace květin přes pyl nesený včelami (zprávy cestují pomalu, pečlivě, krásně).
- Vadnoucí květina obnovena ne kouzlem, ale pozorností, vodou a tím, že je viděna.
- Konec: zahrada v posledním světle, každá květina zavírající se na noc, pomalé ticho okvětních lístků.`,
  ),

  sports_team: g(
    `- The team has a name, a captain, and a philosophy (they win as a unit or not at all).
- The tournament arc: three games, each harder, each teaching a different lesson.
- A teammate who is struggling — the group lifts them, not by talent but by belief.
- The final game's climax is not about the score but about a moment of pure connection.
- Trophy or not: the team celebration feels like the real prize; the journey home together.`,
    `- Tým má jméno, kapitána a filozofii (vyhrávají jako celek nebo vůbec).
- Turnajový oblouk: tři zápasy, každý těžší, každý naučí jinou lekci.
- Spoluhráč v problémech — skupina ho pozvedne, ne talentem ale vírou.
- Vyvrcholení finálního zápasu není o skóre, ale o momentu čistého spojení.
- Pohár nebo ne: týmová oslava se zdá být skutečnou cenou; cesta domů společně.`,
  ),
}

// ─────────────────────────────────────────────────────────────
// Shared bedtime-arc instructions (appended to every story)
// ─────────────────────────────────────────────────────────────
const SLEEP_ARC_EN = `
### BEDTIME NARRATIVE ARC (critical — follow this exactly):
The story must physiologically guide the child toward sleep through pacing:
- **Final 15% of the story**: pace slows dramatically. Sentences grow longer and more rhythmic.
- **Sensory shift**: sounds become quieter, lights softer, movements slower.
- **The hero yawns** — naturally, without announcement. Other characters yawn too.
- **Warmth cues**: describe a blanket, a fire, a warm drink, the weight of tiredness.
- **Stars or moon must appear** in the final scene.
- **Last paragraph**: slow breath rhythm. 2–3 very long, rolling sentences. End on something still and soft.`

const SLEEP_ARC_CS = `
### POHÁDKOVÝ OBLOUK K USNUTÍ (zásadní — dodržet přesně):
Příběh musí fyziologicky vést dítě ke spánku prostřednictvím tempa:
- **Posledních 15% textu**: tempo se dramaticky zpomalí. Věty jsou delší a rytmičtější.
- **Smyslový přechod**: zvuky ztichnout, světla jsou jemnější, pohyby pomalejší.
- **Hrdina zívne** — přirozeně, bez upozornění. Ostatní postavy také zívají.
- **Podněty tepla**: popsat přikrývku, oheň, teplý nápoj, tíhu únavy.
- **Ve finální scéně musí být hvězdy nebo měsíc.**
- **Poslední odstavec**: pomalý rytmus dechu. 2–3 velmi dlouhé, plynoucí věty. Zakončit něčím klidným a jemným.`

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export interface StoryParams {
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
  const ageTier = getAgeTier(childAge)
  const guide = GENRE_GUIDES[genre] ?? GENRE_GUIDES['forest']
  const genreInstructions = language === 'en' ? guide.en : guide.cs
  const ageInstructions = AGE_GUIDANCE[ageTier]

  if (language === 'en') {
    const g = GENDER_EN[childGender]
    const friendsList = friends.length > 0 ? `Supporting characters — friends: ${friends.join(', ')}` : ''
    const parentsList = parents.length > 0 ? `Supporting characters — parents/family: ${parents.join(', ')}` : ''
    const companions = [friendsList, parentsList].filter(Boolean).join('\n- ')
    const ageHint = childAge ? `${childAge} years old` : 'age unspecified'

    return `You are a world-class children's bedtime story author — warm, imaginative, and deeply skilled at guiding children to sleep through narrative rhythm and sensory language.

## STORY PARAMETERS
- **Hero**: ${childName} (${ageHint}, ${g.hero}) — ${childName} uses ${g.possessive} full name throughout the story, never abbreviated.
- **Genre**: ${genreName}
- **Length**: ~${wordCount} words (approximately ${readingLength} minutes read-aloud time)
${companions ? `- ${companions}` : '- Supporting characters: invent two memorable ones suited to the genre'}

## AGE-APPROPRIATE LANGUAGE (${ageTier})
${ageInstructions}

## GENRE BLUEPRINT — ${genreName}
${genreInstructions}

## STORY ARCHITECTURE
1. **Title** (bold, centred, on its own line): catchy, contains ${childName}'s name
2. **Opening** (~10%): establish the world vividly; introduce ${childName} doing something characteristic
3. **Inciting moment** (~10%): a gentle call to adventure or a problem noticed
4. **Rising journey** (~50%): the heart of the adventure; genre elements in full bloom; include at least one moment of setback and one moment of surprising kindness
5. **Resolution** (~15%): the challenge resolved; not by force but by the hero's core quality (curiosity / kindness / courage)
6. **Sleep descent** (~15%): follow the BEDTIME NARRATIVE ARC below — this section is non-negotiable

## CRAFT REQUIREMENTS
- **Dialogue**: at least 25% of the story; characters have distinct speech patterns
- **Sensory immersion**: each location gets scent, sound, and texture — not just sight
- **${childName}'s friends** (if provided): weave them naturally as active participants, not props
- **Bold text**: use sparingly for the single most magical moment per scene
- **Paragraph rhythm**: vary short (2–3 sentences) and long (5–6 sentences) paragraphs
${SLEEP_ARC_EN}

## OUTPUT FORMAT
Return ONLY the story — no preamble, no commentary:

# [Story Title]

[Story text…]

---
*The End*`
  }

  // Czech version
  const g = GENDER_CS[childGender]
  const friendsList = friends.length > 0 ? `Vedlejší postavy — kamarádi: ${friends.join(', ')}` : ''
  const parentsList = parents.length > 0 ? `Vedlejší postavy — rodiče/rodina: ${parents.join(', ')}` : ''
  const companions = [friendsList, parentsList].filter(Boolean).join('\n- ')
  const ageHint = childAge ? `${childAge} let` : 'věk nespecifikován'

  return `Jsi světoznámý autor pohádek pro děti — vřelý, imaginativní a hluboce zručný v tom, jak prostřednictvím narativního rytmu a smyslového jazyka vést děti ke spánku.

## PARAMETRY POHÁDKY
- **Hrdina/hrdinka**: ${childName} (${ageHint}, ${g.typ}) — ${childName} je celým jménem po celou dobu příběhu, nikdy zkráceně.
- **Žánr**: ${genreName}
- **Délka**: přibližně ${wordCount} slov (cca ${readingLength} minut čtení nahlas)
${companions ? `- ${companions}` : '- Vedlejší postavy: vymysli dvě zapamatovatelné vhodné pro žánr'}

## VĚKOVĚ PŘIMĚŘENÝ JAZYK (${ageTier === 'toddler' ? 'batole' : ageTier === 'preschool' ? 'předškolák' : 'školák'})
${AGE_GUIDANCE[ageTier]}

## ŽÁNROVÝ PLÁN — ${genreName}
${genreInstructions}

## ARCHITEKTURA PŘÍBĚHU
1. **Nadpis** (tučně, na vlastním řádku): chytlavý, obsahuje jméno ${childName}
2. **Začátek** (~10 %): živě nastav svět; ukaž ${childName} jak dělá něco charakteristického
3. **Spouštěcí moment** (~10 %): jemná výzva k dobrodružství nebo zpozorovaný problém
4. **Vzestupná cesta** (~50 %): srdce dobrodružství; žánrové prvky v plném rozkvětu; zahrnout alespoň jeden moment nezdaru a jeden moment překvapivé laskavosti
5. **Rozuzlení** (~15 %): výzva překonána; ne silou, ale hrdinovou základní vlastností (zvídavost / laskavost / odvaha)
6. **Sestup do spánku** (~15 %): dodržet POHÁDKOVÝ OBLOUK K USNUTÍ níže — tato část je povinná

## TVŮRČÍ POŽADAVKY
- **Dialogy**: alespoň 25 % textu; postavy mají odlišné způsoby řeči
- **Smyslové ponoření**: každé místo dostane vůni, zvuk a texturu — nejen vizuál
- **Kamarádi ${childName}e** (pokud jsou uvedeni): přirozeně je zaplést jako aktivní účastníky, ne kulisy
- **Tučný text**: použít střídmě pro jediný nejmagičtější moment každé scény
- **Rytmus odstavců**: střídej krátké (2–3 věty) a dlouhé (5–6 vět) odstavce
- **Gramatika**: ${childName} je ${g.byl} ${g.statečný} ${g.hrdina} — hlídej shodu (rod, číslo, pád)
${SLEEP_ARC_CS}

## FORMÁT VÝSTUPU
Vrať POUZE pohádku — žádnou předmluvu ani komentář:

# [Nadpis pohádky]

[Text pohádky…]

---
*Konec pohádky*`
}

// ─────────────────────────────────────────────────────────────
// System prompt (language-aware)
// ─────────────────────────────────────────────────────────────
export function buildSystemPrompt(language: 'cs' | 'en' = 'cs'): string {
  if (language === 'en') {
    return `You are a master bedtime story author for children aged 1–10. Your stories are:
- Written in flowing, read-aloud-friendly English
- Age-appropriate in vocabulary and theme
- Full of wonder, warmth, and gentle adventure
- Structured to calm and prepare children for sleep
- Personalised to the specific child named in each story
- Free of violence, nightmares, or age-inappropriate content
- Grammatically flawless

You never include meta-commentary about the story. You never break the fourth wall. You deliver ONLY the story, exactly as requested.`
  }

  return `Jsi mistrovský autor pohádek na dobrou noc pro děti ve věku 1–10 let. Tvoje pohádky jsou:
- Napsány plynnou, pro hlasité čtení přívětivou češtinou
- Věkově vhodné ve slovní zásobě i tématu
- Plné úžasu, vřelosti a jemného dobrodružství
- Strukturovány tak, aby dítě uklidnily a připravily ke spánku
- Personalizovány pro konkrétní dítě jmenované v každé pohádce
- Bez násilí, nočních můr nebo věkově nevhodného obsahu
- Gramaticky bezchybné včetně shody jmenné i slovesné

Nikdy nezahrnuješ meta-komentáře o pohádce. Nikdy nenarušuješ čtvrtou zeď. Doručuješ POUZE pohádku, přesně jak bylo požádáno.`
}

// ─────────────────────────────────────────────────────────────
// Utility prompts
// ─────────────────────────────────────────────────────────────
export function buildTitlePrompt(childName: string, genre: string, language: 'cs' | 'en' = 'cs'): string {
  if (language === 'en') {
    return `Generate 5 catchy bedtime story titles for a child named ${childName} in the "${genre}" genre. Each title must contain ${childName}'s name. Return only the list of titles, one per line.`
  }
  return `Vymysli 5 chytlavých názvů pohádky na dobrou noc pro dítě jménem ${childName} v žánru "${genre}". Každý název musí obsahovat jméno ${childName}. Vrať pouze seznam názvů, každý na novém řádku.`
}
