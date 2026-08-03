# Rozpočet a měření

## Jednotková ekonomika

Z čeho počítáme, co si smíme dovolit zaplatit za klienta.

| Položka | Částka |
| --- | --- |
| Poplatek za propojení | 249 Kč |
| Předplatné Plánovač | 99 Kč / měsíc |
| Předpokládaná průměrná doba předplatného | 6 měsíců |
| **Hrubá hodnota klienta (LTV)** | **249 + 594 = 843 Kč** |
| Cílová CAC (⅓ LTV) | do 280 Kč |
| Strop CAC při akvizici (⅔ LTV) | 560 Kč |

Klíčové upřesnění: propojení se prodává opakovaně. Klient, který si za rok
najde druhého poskytovatele, přidá dalších 249 Kč. Konzervativně s tím
nepočítáme, ale reálné LTV bude vyšší.

**Konverzní řetězec, se kterým vstupujeme (odhad, po měsíci nahradit daty):**

```
1 000 prokliků
  → 120 registrací klienta          (12 %)
  →  70 odeslaných poptávek         (58 % z registrací)
  →  25 přijatých nabídek           (36 % z poptávek)  ← platící klient
  →  10 aktivních předplatných      (40 % z propojení)
```

Při CPC 12 Kč to znamená CAC 480 Kč za platícího klienta. To je nad cílem a pod
stropem — proto je od začátku prioritou zvednout míru přijetí nabídky, ne
zlevňovat proklik.

---

## Rozpočet – první tři měsíce

### Fáze 0: nábor uklízeček (3 týdny před spuštěním)

| Kanál | Rozpočet | Cíl |
| --- | --- | --- |
| Facebook – nábor (CZ) | 25 000 Kč | 35 registrací poskytovatelů |
| Facebook – nábor (UA/SK) | 15 000 Kč | 20 registrací |
| Skupiny a komunity (organicky) | 0 Kč | 10 registrací |
| **Celkem** | **40 000 Kč** | **~65 registrací, z toho 45 vyplněných profilů** |

Cílová cena za registrovaného poskytovatele: do 600 Kč. Bez nabídky nemá smysl
utrácet za poptávku, proto je tahle fáze nepodkročitelná.

### Fáze 1: pilot v Praze (měsíc 1)

| Kanál | Rozpočet | Cíl |
| --- | --- | --- |
| Meta – klienti, studené publikum | 35 000 Kč | 60 registrací |
| Meta – retargeting | 8 000 Kč | dokončení poptávek |
| LinkedIn – management | 20 000 Kč | 15 registrací, test kanálu |
| Meta – doplňkový nábor | 12 000 Kč | doplnit chybějící čtvrti |
| **Celkem** | **75 000 Kč** | |

V prvním měsíci neškálovat. Cílem není objem, ale zjistit, jestli poptávka
dostane reakci do 24 hodin. Pokud ne, problém je v nabídce, ne v reklamě.

### Fáze 2: škálování (měsíce 2–3)

| Kanál | Rozpočet / měsíc |
| --- | --- |
| Meta – klienti (Praha + Brno) | 70 000 Kč |
| Meta – retargeting a lookalike | 20 000 Kč |
| LinkedIn (jen pokud CAC < 800 Kč) | 25 000 Kč |
| Nábor poskytovatelů | 25 000 Kč |
| **Celkem** | **140 000 Kč** |

Poměr investice do nabídky a poptávky držet zhruba 1:4. Jakmile medián času do
první reakce přeleze 24 hodin, přesypat rozpočet zpátky do náboru.

---

## Konverzní události

Zavést v Meta Pixelu, Conversions API i LinkedIn Insight Tagu pod stejnými názvy.

| Událost | Kdy se odpaluje | Hodnota |
| --- | --- | --- |
| `RegistraceKlient` | dokončená registrace s rolí CLIENT | – |
| `RegistraceUklizecka` | dokončená registrace s rolí CLEANER | – |
| `PoptavkaOdeslana` | zveřejnění poptávky | – |
| `NabidkaPrijata` | přijetí nabídky (propojení) | 249 Kč |
| `PredplatneAktivovano` | první úspěšná platba předplatného | 99 Kč |
| `KartaUlozena` | uložení platební metody | – |

Server-side měření (Conversions API) je u nás důležitější než obvykle: platba
probíhá na serveru a část konverzí by se přes prohlížeč vůbec nezměřila.

---

## UTM konvence

```
utm_source   = facebook | instagram | linkedin
utm_medium   = cpc | paid_social | organic
utm_campaign = uklidno-{cil}-{mesto}-{rok}{mesic}
               např. uklidno-klienti-praha-202609
utm_content  = {kod-kreativy}-{varianta-textu}
               např. k1-a3
utm_term     = {publikum}
               např. lal1-platici
```

`utm_content` musí odpovídat kódům z [kreativa.md](kreativa.md) a
[reklamni-texty.md](reklamni-texty.md) — jinak se po měsíci nedá zjistit, která
kombinace vlastně fungovala.

---

## Metriky, které sledovat týdně

**Zdraví trhu (důležitější než výkon reklamy):**

- Medián času od zveřejnění poptávky k první reakci — **cíl pod 24 h**
- Podíl poptávek s alespoň jednou reakcí — **cíl nad 85 %**
- Podíl poptávek, které skončí propojením — **cíl nad 35 %**
- Počet aktivních poskytovatelů na 10 otevřených poptávek — **cíl 3+**

**Výkon akvizice:**

- CAC platícího klienta podle kanálu
- Poměr registrace → poptávka (odhaluje problém ve formuláři poptávky)
- Poměr propojení → předplatné (odhaluje, jestli plánovač dává smysl)
- Frekvence zobrazení na publikum — nad 3 v týdnu snižovat rozpočet

**Varovné signály:**

- Roste podíl poptávek bez reakce → okamžitě přesypat rozpočet do náboru
- Rostoucí CPM při stejném publiku → vyčerpaná kreativa, nasadit další sadu
- Vysoká registrace, nízká poptávka → problém je v produktu, ne v reklamě

---

## Co netestovat hned

Aby se rozpočet neutopil v šumu: první měsíc jeden trh (Praha), jeden hlavní cíl
(propojení), maximálně tři kreativní koncepty. Brno, LinkedIn message ads a
kampaně na firemní úklid mají smysl až poté, co drží čas do první reakce.
