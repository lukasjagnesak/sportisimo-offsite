# Uklidno

Platforma, která propojuje klienty s uklízečkami a uklízeči. Klient zadá
poptávku, poskytovatelé na ni reagují, klient si vybere podle hodnocení a
dostupnosti. Po propojení mají obě strany kontakt, chat a sdílený kalendář, ve
kterém se objednávají konkrétní termíny.

**Obchodní model (fáze 1):** platí pouze klient — jednorázově 249 Kč za
zprostředkování kontaktu a volitelně 99 Kč měsíčně za plánovací nadstavbu.
Z ceny samotného úklidu si platforma nebere nic. Poplatky na straně
poskytovatelů jsou v kódu připravené a zapínají se přepínačem
`CLEANER_FEE_ENABLED` (viz [`web/src/lib/fees.ts`](web/src/lib/fees.ts)).

| Adresář | Obsah |
| --- | --- |
| [`web/`](web) | Webová aplikace (Next.js) |
| [`docs/`](docs) | Architektura, datový model, roadmapa mobilní aplikace |
| [`marketing/`](marketing) | Cílení, texty a rozpočty pro FB, IG a LinkedIn |

## Rychlý start

```bash
cd web
npm install
cp .env.example .env
npm run db:migrate     # vytvoří SQLite databázi
npm run db:seed        # naplní ji ukázkovými daty
npm run dev            # http://localhost:3000
```

### Testovací účty

Heslo pro všechny: `Uklidno123`

| Role | E-mail | Co má připravené |
| --- | --- | --- |
| Klient | `lucie.bartosova@example.com` | aktivní propojení, předplatné, historie rezervací a hodnocení |
| Klient | `tomas.riha@example.com` | otevřená poptávka se třemi nabídkami k výběru |
| Klient | `martin.dvorak@example.com` | firemní poptávka na úklid kanceláří v Brně |
| Uklízečka | `jana.novakova@example.com` | nejlépe hodnocený profil, plný kalendář |
| Uklízeč | `petr.svoboda@example.com` | kanceláře v Brně, večerní směny |
| Admin | `admin@uklidno.cz` | – |

Testovací karta pro platby: `4242 4242 4242 4242`, libovolné budoucí datum.
Karta končící na `0000` platbu vždy zamítne (pro testování chybových stavů).

## Skripty

| Příkaz | Co dělá |
| --- | --- |
| `npm run dev` | vývojový server |
| `npm run build` | produkční build |
| `npm run db:migrate` | vytvoří / aktualizuje databázi podle schématu |
| `npm run db:reset` | zahodí databázi a nasadí ji znovu včetně seed dat |
| `npm run db:seed` | naplní databázi ukázkovými daty |
| `npm run db:studio` | Prisma Studio – prohlížeč databáze |
| `npm run check:flows` | integrační kontrola obchodní logiky proti databázi |
| `npm run lint` | ESLint |

## Ověření, že vše funguje

```bash
cd web
npm run db:reset && npm run db:seed
npm run build
npm run check:flows
```

`check:flows` kontroluje 38 pravidel napříč kalendářem, platbami, předplatným,
propojením a hodnocením — od „rezervaci nelze vytvořit za 2 hodiny“ po
„neúspěšná platba zůstane v historii“.

## Stack

- **Next.js 15** (App Router, server actions) + **TypeScript**
- **Prisma 6** — SQLite pro vývoj, PostgreSQL pro produkci
- **Tailwind CSS 4**
- **bcryptjs** + vlastní cookie session (bez externí auth služby)
- **Zod** pro validaci vstupů

Podrobnosti v [`docs/architektura.md`](docs/architektura.md).

## Co je hotové a co ne

**Hotové a funkční:**

- registrace a přihlášení pro obě role, session v httpOnly cookie
- profily klienta i poskytovatele včetně služeb, jazyků a úrovní
- katalog poskytovatelů s filtry (město, služba, jazyk, hodnocení, cena, praxe)
- poptávka → nabídky → přijetí → platba → odemčení kontaktu
- chat mezi propojenými stranami
- kalendář dostupnosti, dovolené, generování volných slotů, rezervace
- hodnocení po dokončené rezervaci a přepočet průměrů
- platební metody, historie plateb s rozpadem DPH, předplatné se zrušením
- veřejné stránky: landing, ceník, jak to funguje, podmínky, ochrana údajů

**Záměrně zjednodušené / chybí do produkce:**

- **platební brána** — běží mock implementace, reálná se doplní za rozhraním
  `PaymentProvider` (viz [`web/src/lib/payments/`](web/src/lib/payments))
- **e-maily** — notifikace se ukládají do databáze, ale neodesílají se
- **obnova předplatného** — chybí cron, který na konci období strhne další platbu
- **ověřování profilů** — `verificationState` se přepíná jen v databázi, chybí
  administrace
- **fotky** — místo profilových fotek jsou iniciály
- **zapomenuté heslo a ověření e-mailu**
- **fulltext a geolokace** — hledání podle města je textové, ne podle vzdálenosti

Rozpracování jednotlivých bodů je v [`docs/roadmapa.md`](docs/roadmapa.md).
