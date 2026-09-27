# Kytara – aplikace pro učení na kytaru

Webová aplikace (React + TypeScript + Vite), která běží celá v prohlížeči – na počítači, tabletu i mobilu.

## Co umí

- **Písně s akordy na hmatníku** – aktuální a další akord, prstoklad na celém hmatníku (včetně barré a kapodastru),
  rytmický vzor (↓ ↑) nebo rozklad prsty a **mini tabulatura, které struny v jakém pořadí v daném akordu hrát**.
  Při přehrávání se zvýrazňuje právě hraná struna a krok vzoru.
- **Doprovod a metronom** – syntetizovaná kytara hraje zvolený rytmus/rozklad, tempo 40–130 %, opakování části, transpozice, kapodastr.
- **Poslech (mikrofon)**
  - *Krok za krokem* – aplikace čeká, až akord zahraješ správně, a pak posune dál.
  - *Hodnocení* – hraješ do tempa, aplikace hodnotí každý akord (zelená / žlutá / červená) a dá skóre.
  - Když akord nezní správně, řekne, **který tón chybí** (přidušená struna) nebo co zní navíc.
- **Rozpoznání akordů z nahrávky** – soubor (MP3, WAV, M4A, MP4…), nahrávka mikrofonem nebo **YouTube video**
  (aplikace poslouchá zvuk karty, Chrome/Edge na počítači). Najde tempo, takt, tóninu, akordy po taktech,
  doporučí kapodastr pro snadné tvary a pak ukazuje akordy synchronně s hudbou (i zpomaleně). Výsledek jde uložit jako píseň.
- **Knihovna akordů** – 12 kořenů × 14 typů, více poloh každého akordu, tóny a jejich funkce, ověření mikrofonem.
- **Trénink** – „Zahraj akord“ (kvíz s měřením času), „Minuta změn“ (mikrofon sám počítá přechody), metronom s trenérem tempa.
- **Ladička** – standardní i alternativní ladění, referenční tóny.
- **Cesta učení** – 12 kroků od ladění po barré a vlastní písně z YouTube, denní rutina, série dní a statistiky.
- Vlastní písně v ChordPro, **import ze zpěvníků ve formátu „akordy nad textem“**, česká notace (H/B), režim pro leváky.

## Spuštění

```bash
npm install
npm run dev      # vývojový server
npm test         # testy (teorie, rozpoznávání akordů, analýza nahrávky)
npm run build    # produkční build do dist/
```

Mikrofon a sdílení zvuku vyžadují HTTPS (nebo `localhost`).

## Nasazení na Vercel

Na [vercel.com/new](https://vercel.com/new) importuj tento repozitář a klikni na **Deploy** – Vercel sám pozná Vite,
nic dalšího se nenastavuje. `vercel.json` jen povoluje mikrofon a sdílení zvuku karty.

## Jak funguje rozpoznávání

1. Spektrum (FFT) → **chroma** (energie 12 tónů bez ohledu na oktávu), s potlačením šumu.
2. Porovnání se šablonami akordů, které zahrnují harmonické tóny struny; při ověřování se použije přesně
   hraný prstoklad.
3. U nahrávek: detekce nástupů → tempo a doby (dynamické programování) → průměr chroma na dobu →
   Viterbi přes akordy (změny preferovány na začátku taktu) → tónina (Krumhansl) → doporučený kapodastr.

Vše běží lokálně v prohlížeči (analýza ve Web Workeru), nic se neodesílá na server.
