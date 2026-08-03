# Architektura

## Přehled

Jedna Next.js aplikace, která obsluhuje veřejný web i přihlášenou část. Žádné
oddělené API — data se čtou přímo v server komponentách a zapisují server
actions. Pro rozsah MVP je to nejrychlejší cesta; až přijde mobilní aplikace,
přibude REST/tRPC vrstva nad stejnou doménovou logikou (viz
[roadmapa](roadmapa.md)).

```
web/src/
├── app/(site)/          stránky – veřejné i dashboard, sdílejí hlavičku a patičku
│   ├── page.tsx                 landing
│   ├── uklizecky/               katalog a detail profilu
│   ├── poptavky/                seznam, nová poptávka, detail s nabídkami
│   ├── dashboard/               přihlášená část, navigace podle role
│   ├── cenik/  jak-to-funguje/  podminky/  soukromi/
│   └── prihlaseni/  registrace/
├── components/          sdílené UI (Button, Card, Badge, Field, Stars…)
└── lib/
    ├── actions/         server actions – jediné místo, kde se zapisuje
    ├── queries/         složitější čtení (katalog, propojení)
    ├── payments/        rozhraní platební brány + mock implementace
    ├── auth.ts          hesla, session, requireUser / requireCleaner
    ├── availability.ts  generování volných slotů, validace termínu
    ├── constants.ts     "enumy" + české popisky
    ├── fees.ts          ceník a feature flagy obchodního modelu
    ├── subscription.ts  předplatné
    └── validation.ts    Zod schémata
```

## Zásadní rozhodnutí

### Enumy jako String

SQLite v Prismě neumí `enum` ani skalární pole. Aby stejné schéma běželo lokálně
na SQLite i v produkci na PostgreSQL, jsou všechny výčty uložené jako `String`
a jejich povolené hodnoty žijí v [`constants.ts`](../web/src/lib/constants.ts)
jako `as const` pole. Odtud se odvozují TypeScript typy i české popisky, takže
přidání nové služby je změna na jednom místě.

Přechod na Postgres = změna `provider` v `schema.prisma` a `DATABASE_URL`.
Datové typy zůstávají kompatibilní.

### Peníze v haléřích

Všechny částky jsou celá čísla v haléřích (99 Kč = 9900). Žádné `Float`, žádné
zaokrouhlovací chyby. Formuláře pracují v korunách a převádějí se až v server
action — hranice je vždy okomentovaná.

### Ceník a feature flagy na jednom místě

[`fees.ts`](../web/src/lib/fees.ts) drží kompletní obchodní model. Přechod z
fáze 1 (platí jen klient) na fázi 2 (platí obě strany) je přepnutí
`CLEANER_FEE_ENABLED` — kód, který poplatek uklízečce strhne, už existuje
v `acceptOfferAction`. Stejně tak `REQUIRE_CONNECTION_FEE` a
`REQUIRE_SUBSCRIPTION_FOR_BOOKING` umožňují rozvolnit pilot bez zásahu do kódu.

### Platební brána za rozhraním

`PaymentProvider` ([`payments/provider.ts`](../web/src/lib/payments/provider.ts))
definuje tři operace: `tokenizeCard`, `charge`, `refund`. Ve vývoji běží
`mockProvider`, produkční implementace (Stripe, GoPay nebo Comgate) se přidá do
`getProvider()` bez dopadu na zbytek aplikace.

**Číslo karty se do databáze nikdy neukládá.** V produkci kartu tokenizuje SDK
brány přímo v prohlížeči a na server přijde jen token; `addPaymentMethodAction`
se pak zjednoduší o krok tokenizace. V `PaymentMethod` zůstává token, značka a
poslední čtyřčíslí.

### Session bez externí služby

Náhodný 32bajtový token v httpOnly cookie, v databázi jen jeho SHA-256 otisk.
Únik databáze sám o sobě nedá přístup k účtům. `getCurrentUser` je obalený
v React `cache`, takže i při volání z pěti komponent proběhne jeden dotaz na
render.

Přihlášení vrací stejnou hlášku pro neexistující účet i špatné heslo a u
neexistujícího účtu naprázdno hashuje, aby délka odpovědi neprozradila, které
e-maily jsou registrované.

## Datový model

Kompletní schéma je v [`web/prisma/schema.prisma`](../web/prisma/schema.prisma).
Jádro:

```
User ──┬── ClientProfile
       └── CleanerProfile ──┬── CleanerService
                            ├── CleanerLanguage
                            ├── Availability            (týdenní rozvrh)
                            └── AvailabilityException   (dovolená, mimořádná směna)

JobRequest ── JobRequestService
     │
     └── Offer ──(přijetí + platba)──> Match ──┬── Conversation ── Message
                                               ├── Booking ── Review
                                               └── Payment

User ── PaymentMethod, Payment, Subscription, Notification
```

**`Match` je klíčová entita.** Vzniká jen přijetím nabídky a je jedinou branou
ke kontaktním údajům, chatu i rezervacím. Kdykoli se v aplikaci rozhoduje
„smí tenhle člověk vidět tenhle telefon / tuhle adresu“, odpověď se odvozuje
od existence aktivního `Match`.

### Ochrana osobních údajů v datovém modelu

- Ulice v `JobRequest.street` se zobrazuje **jen** zadavateli a propojené
  uklízečce; ve veřejném výpisu poptávek je pouze město.
- Telefon a e-mail protistrany se zobrazují až v detailu propojení.
- Neschválené profily (`verificationState !== "APPROVED"`) se ve veřejném
  katalogu nezobrazují vůbec.

## Kalendář a časová pásma

Dostupnost se ukládá jako minuty od půlnoci v lokálním čase (`Availability`),
rezervace jako `DateTime`. Aplikace musí běžet s `TZ=Europe/Prague` — je to
zjednodušení odpovídající jednomu trhu. Až přibude druhá země, přesune se
časové pásmo na `CleanerProfile` a sloty se budou počítat vůči němu.

Pravidla v [`availability.ts`](../web/src/lib/availability.ts):

- minimální předstih rezervace 12 hodin
- maximálně 60 dní dopředu
- délka 1–12 hodin
- kolize se počítají proti rezervacím ve stavech `REQUESTED`, `CONFIRMED`,
  `COMPLETED` (zamítnuté a zrušené kalendář neblokují)

`isSlotBookable` se volá v server action znovu, i když UI nabízí jen volné
sloty — API nesmí věřit tomu, co přijde od klienta.

## Toky zápisu

Všechny zápisy jdou přes server actions v [`lib/actions/`](../web/src/lib/actions).
Každá začíná `requireUser` / `requireCleaner`, validuje vstup Zodem a vrací
jednotný `ActionState` (`{ ok, error, fieldErrors, message }`), na který jsou
napojené formuláře přes `useActionState`.

**Přijetí nabídky** (`acceptOfferAction`) je nejcitlivější tok:

1. ověření, že poptávka patří přihlášenému klientovi a nabídka je `PENDING`
2. stržení poplatku přes platební bránu — při neúspěchu se **nic** nezapíše
3. teprve po úspěšné platbě transakce: založení `Match` + `Conversation`,
   přepnutí nabídky na `ACCEPTED`, ostatních na `REJECTED`, poptávky na
   `MATCHED`, navázání platby na `Match`, notifikace uklízečce
4. ve fázi 2 poplatek uklízečce — jeho selhání už uzavřené propojení neruší,
   `Payment` zůstane `FAILED` a řeší ho provoz

Platba je vně databázové transakce záměrně: síťové volání se do transakce
nezavírá. Cenou je, že při pádu aplikace mezi krokem 2 a 3 zůstane zaplacená
platba bez `Match` — proto se platby dohledávají podle `matchId: null` a je to
první věc, kterou má řešit provozní kontrola.

## Kde se počítají hodnocení

`CleanerProfile.ratingAvg` a `ratingCount` jsou denormalizované, aby šlo podle
hodnocení řadit a filtrovat v databázi. Přepočítávají se při vložení recenze
v `createReviewAction`. Konzistenci hlídá `npm run check:flows`.
