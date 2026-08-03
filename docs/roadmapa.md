# Roadmapa

## Fáze 1 — hotovo (tento repozitář)

Funkční webová aplikace: registrace obou rolí, profily, katalog s filtry,
poptávka → nabídky → propojení → platba, chat, kalendář, rezervace, hodnocení,
platební metody a předplatné.

---

## Fáze 2 — do ostrého provozu

Bez těchto věcí nelze spustit reálný provoz.

### Platby

- [ ] Napojit reálnou bránu za rozhraní `PaymentProvider`. Pro CZK a opakované
      platby přichází v úvahu Stripe (jednodušší integrace, karty i Apple/Google
      Pay) nebo GoPay/Comgate (české prostředí, bankovní tlačítka).
      **Rozhodnutí zatím nepadlo** — kód je připravený na obojí.
- [ ] Tokenizace karty v prohlížeči přes SDK brány, ne na serveru
- [ ] Webhooky brány: potvrzení platby, zamítnutí, vrácení peněz
- [ ] Cron na obnovu předplatného na konci období + stav `PAST_DUE` a
      připomínkové e-maily
- [ ] Vystavování dokladů (fakturační údaje, číselná řada, PDF)

### E-maily a notifikace

- [ ] Odesílání transakčních e-mailů (nová nabídka, přijetí nabídky, potvrzení
      termínu, připomínka den předem, žádost o hodnocení)
- [ ] Ověření e-mailu při registraci
- [ ] Zapomenuté heslo
- [ ] Odhlašovací preference a respektování zákona o elektronických komunikacích

### Důvěra a bezpečnost

- [ ] Administrace pro schvalování profilů (`verificationState`)
- [ ] Nahrávání profilových fotek a dokladů
- [ ] Nahlašování nevhodného obsahu, moderace hodnocení
- [ ] Rate limiting na přihlášení a odesílání poptávek
- [ ] Detekce pokusů o obejití zprostředkování (telefon v textu poptávky)

### Právní

- [ ] Revize obchodních podmínek a zásad ochrany údajů advokátem
- [ ] Cookie lišta se souhlasem před nasazením měřicích kódů
- [ ] Zpracovatelské smlouvy s bránou, hostingem a e-mailovou službou
- [ ] Export a smazání údajů na žádost (GDPR) — zatím jen ručně

### Provoz

- [ ] Přechod na PostgreSQL (změna `provider` + `DATABASE_URL`)
- [ ] Monitoring chyb a alerting
- [ ] Zálohování databáze
- [ ] Automatické testy nad server actions (dnes je pokrytá jen doménová logika
      přes `check:flows`)

---

## Fáze 3 — mobilní aplikace

### Kdy má smysl

Až budou data ukazovat, že klienti opakovaně plánují (tedy že předplatné dává
smysl). Do té doby je responzivní web dostatečný a levnější.

Mobilní aplikace řeší dvě věci, které web neumí dobře: **push notifikace**
o nové nabídce a rychlý přístup ke kalendáři. Obojí je cennější pro uklízečku
než pro klienta — proto začít aplikací pro nabídkovou stranu.

### Technický postup

1. **Vytáhnout API vrstvu.** Doménová logika už je oddělená v `lib/` a
   nezávisí na Reactu. Nad ni přidat REST nebo tRPC endpointy; server actions
   se pak stanou jen jedním z konzumentů.
2. **Autentizace pro mobil.** Session cookie nahradit tokenem s refresh
   mechanismem. Tabulka `Session` na to stačí, přibude typ tokenu.
3. **React Native (Expo).** Sdílí se jazyk i typy, doménové konstanty a
   validační schémata z `lib/` jdou použít beze změny.
4. **Push notifikace.** Model `Notification` už existuje — přibude tabulka
   registrovaných zařízení a odeslání přes Expo Push nebo FCM.

### Rozsah první verze aplikace (pro uklízečky)

- přihlášení
- seznam poptávek v okolí + push při nové poptávce
- odeslání nabídky
- kalendář a potvrzování termínů
- chat

Klientská aplikace až ve druhém kroku — pro klienta je web dostatečný, protože
poptávku zadává z pohodlí a ne na cestách.

---

## Fáze 4 — růst

- **Poplatek pro poskytovatele** (`CLEANER_FEE_ENABLED`) — až bude poptávek
  tolik, že přístup k nim má prokazatelnou hodnotu. Zavádět s předstihem
  30 dní a nikoho nepřepínat automaticky.
- **Geolokace** místo textového hledání podle města (PostGIS nebo dojezdová
  vzdálenost)
- **Doporučování** — párovat poptávky s profily podle historie, ne jen podle
  filtrů
- **Opakované rezervace** — dnes se plánuje po jednom termínu; série
  „každý čtvrtek 8:00“ ušetří nejvíc práce právě předplatitelům
- **Firemní účty** — více adres pod jednou fakturací, schvalování objednávek
- **Další města a Slovensko** — vyžaduje časové pásmo na profilu a druhou měnu
