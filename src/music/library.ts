import { parseChordPro, type Song } from './song';

// Vestavěné písně – lidové a volné (public domain) skladby, seřazené podle obtížnosti.
const SOURCES: Record<string, string> = {
  'cviceni-em-am': `{title: Cvičení: Em a Am}
{artist: První akordy}
{bpm: 60}
{time: 4/4}
{level: 1}
{pattern: down4}
{note: Dva nejsnazší akordy. Všimněte si, že prostředníček a prsteníček se jen posunou o strunu níž.}
{c: Pomalu}
| Em | Em | Am | Am |
| Em | Em | Am | Am |
{c: Rychlejší přechody}
| Em | Am | Em | Am |
| Em:2 Am:2 | Em:2 Am:2 | Em:2 Am:2 | Em |`,

  'cviceni-g-c-d': `{title: Cvičení: G, C, D}
{artist: Tři akordy na tisíc písní}
{bpm: 70}
{time: 4/4}
{level: 1}
{pattern: down4}
{note: Na G, C a D se dá zahrát obrovské množství písní. Pomalu a bez zastavování!}
{c: Dvojice}
| G | G | C | C |
| G | G | D | D |
{c: Celý kruh}
| G | C | D | G |
| G | C | D | G |
| G:2 C:2 | D:2 G:2 | G:2 C:2 | D:2 G:2 |`,

  'kocka-leze-dirou': `{title: Kočka leze dírou}
{artist: Lidová}
{bpm: 90}
{time: 4/4}
{key: D}
{level: 1}
{pattern: down4}
{note: Jen dva akordy: D a A7. Na přechod máte celou dobu – zkuste si ho nejdřív v klidu.}
{c: Sloka}
[D]Kočka leze dírou, [A7:2]pes oknem, [D:2]pes oknem,
[D]nebude-li pršet, [A7:2]nezmoknem, [D:2]nezmoknem.`,

  'skakal-pes': `{title: Skákal pes}
{artist: Lidová}
{bpm: 96}
{time: 4/4}
{key: C}
{level: 1}
{pattern: down4}
{note: Akordy C a G7. Při přechodu z C na G7 se prsty jen „překlopí“.}
{c: Sloka 1}
[C]Skákal pes přes [G7:2]oves, přes zele[C:2]nou louku,
[C]šel za ním mys[G7:2]livec, péro na klo[C:2]bouku.
{c: Sloka 2}
[C]Pejsku náš, co [G7:2]děláš, žes tak ve[C:2]sel stále?
[C]Řekni nám, kdo [G7:2]tě tak vycvičil [C:2]dokonale.`,

  'pec-nam-spadla': `{title: Pec nám spadla}
{artist: Lidová}
{bpm: 100}
{time: 4/4}
{key: C}
{level: 1}
{pattern: down-up8}
{c: Sloka}
[C:4]Pec nám spadla, [G7:4]pec nám spadla, [C:2]kdopak nám ji [G7:1]posta[C:1]ví?
[C:4]Starý pecař [G7:4]není doma [C:2]a mladý to [G7:1]neu[C:1]mí.`,

  'holka-modrooka': `{title: Holka modrooká}
{artist: Lidová}
{bpm: 100}
{time: 4/4}
{key: G}
{level: 1}
{pattern: folk}
{note: Vyzkoušejte si rytmus pop/folk: D – D U – U D U.}
{c: Sloka}
[G]Holka modrooká, [D7]nesedávej u potoka,
[D7]holka modrooká, [G]nesedávej tam.
[G]V potoce je hastrmánek, [D7]zatahá tě za copánek,
[D7]holka modrooká, [G]nesedávej tam.`,

  'saints': `{title: When the Saints Go Marching In}
{artist: Tradicionál}
{bpm: 110}
{time: 4/4}
{key: G}
{level: 1}
{pattern: folk}
{c: Sloka}
Oh when the [G]saints go marching in, [G]
oh when the saints go marching [D7]in, [D7]
oh Lord I [G]want to [G7]be in that [C]number, [C]
when the [G]saints go [D7]marching [G]in. [G]`,

  'amazing-grace': `{title: Amazing Grace}
{artist: John Newton (1779)}
{bpm: 84}
{time: 3/4}
{key: G}
{level: 2}
{pattern: waltz-arp}
{note: Tříčtvrťový takt. Zkuste nejdřív valčíkový úder, pak rozklad prsty.}
{c: Sloka}
A[G:6]mazing grace, how [C:3]sweet the [G:3]sound,
that [G:6]saved a wretch like [D:6]me.
I [G:6]once was lost, but [C:3]now am [G:3]found,
was [Em:3]blind, but [D:3]now I [G:6]see.`,

  'scarborough-fair': `{title: Scarborough Fair}
{artist: Tradicionál}
{bpm: 96}
{time: 3/4}
{key: Am}
{level: 2}
{pattern: waltz-arp}
{c: Sloka}
[Am:6]Are you going to [G:3]Scarbo[Am:3]rough Fair?
[C:3]Parsley, [Am:3]sage, rose[D:3]mary and [Am:3]thyme,
re[Am:3]member [C:3]me to one who [G:3]lives [G:3]there,
[Am:3]she once was a [G:3]true love of [Am:6]mine.`,

  kometa: `{title: Kometa}
{artist: Jaromír Nohavica}
{bpm: 170}
{time: 6/8}
{key: Am}
{level: 2}
{pattern: arp68}
{note: Celá píseň je v 6/8 a hraje se rozkladem: palec (p) bas, pak i–m–a–m–i na 3., 2., 1., 2. a 3. strunu. Každý akord trvá jeden takt (6 osmin), v refrénu se C a E7 dělí o takt. Nejdřív zpomal tempo na 50–60 % a klikni na „Předvést vybrnkávání“. Text písně je chráněný autorskými právy, proto tu jsou jen akordy – přes „Upravit kopii“ si ho můžeš dopsat ze svého zpěvníku.}
{c: Předehra}
| Am | Dm | E7 | Am |
{c: Sloka 1}
| Am | Am | Am | Am |
| Dm | G7 | C | E7 |
{c: Sloka 2}
| Am | Am | Am | Am |
| Dm | G7 | C | E7 |
{soc: Refrén}
| Am | Dm | G7 | C:3 E7:3 |
| Am | Dm | E7 | Am |
{eoc}
{c: Sloka 3}
| Am | Am | Am | Am |
| Dm | G7 | C | E7 |
{c: Sloka 4}
| Am | Am | Am | Am |
| Dm | G7 | C | E7 |
{soc: Refrén}
| Am | Dm | G7 | C:3 E7:3 |
| Am | Dm | E7 | Am |
{eoc}
{c: Sloka 5}
| Am | Am | Am | Am |
| Dm | G7 | C | E7 |
{c: Sloka 6}
| Am | Am | Am | Am |
| Dm | G7 | C | E7 |
{soc: Refrén}
| Am | Dm | G7 | C:3 E7:3 |
| Am | Dm | E7 | Am |
{eoc}`,

  'rising-sun': `{title: The House of the Rising Sun}
{artist: Tradicionál}
{bpm: 110}
{time: 6/8}
{key: Am}
{level: 2}
{pattern: arp68}
{note: Klasický rozklad v 6/8. Každý akord trvá jeden takt (6 osmin). Pozor na akord F – pokud barré ještě nejde, použijte Fmaj7.}
{c: Sloka}
There [Am]is a [C]house in [D]New Or[F]leans,
they [Am]call the [C]Rising [E]Sun, [E]
and it's [Am]been the [C]ruin of [D]many a poor [F]boy,
and [Am]God, I [E]know I'm [Am]one. [E]`,

  'blues-a': `{title: Blues v A (12 taktů)}
{artist: Cvičení}
{bpm: 90}
{time: 4/4}
{key: A}
{level: 2}
{pattern: rock8}
{note: Dvanáctitaktové blues – základ rocku i blues. Septakordy A7, D7 a E7.}
{c: 12 taktů}
| A7 | A7 | A7 | A7 |
| D7 | D7 | A7 | A7 |
| E7 | D7 | A7 | E7 |`,

  'kruh-c': `{title: Písničkový kruh C–Am–F–G}
{artist: Cvičení}
{bpm: 80}
{time: 4/4}
{key: C}
{level: 3}
{pattern: folk}
{note: Nejslavnější postup popu (50s progression). Obsahuje barré F – pokud ještě nejde, zahrajte Fmaj7.}
{c: Postup}
| C | Am | F | G |
| C | Am | F | G |
| C:2 Am:2 | F:2 G:2 | C:2 Am:2 | F:2 G:2 |`,
};

export const BUILTIN_SONGS: Song[] = Object.entries(SOURCES).map(([id, src]) => ({
  ...parseChordPro(src, id),
  builtin: true,
}));
