import { Alert, PageHeader } from "@/components/ui";
import { FEES } from "@/lib/fees";
import { formatCzk } from "@/lib/format";

export const metadata = { title: "Obchodní podmínky" };

/**
 * Pracovní podklad, ne hotový právní dokument. Před spuštěním musí projít
 * advokátem – zejména část o postavení zprostředkovatele, reklamacích
 * a odstoupení od smlouvy u digitálního obsahu.
 */
export default function TermsPage() {
  const sections = [
    {
      title: "1. Kdo jsme a co děláme",
      body: [
        "Uklidno je online platforma, která propojuje zájemce o úklidové a žehlicí služby (dále „klient“) s osobami, které tyto služby poskytují (dále „poskytovatel“).",
        "Uklidno není zaměstnavatelem poskytovatelů, není smluvní stranou smlouvy o úklidu a neodpovídá za způsob ani kvalitu provedení služby. Smlouva o úklidu vzniká přímo mezi klientem a poskytovatelem.",
      ],
    },
    {
      title: "2. Registrace a účet",
      body: [
        "Účet si může založit fyzická osoba starší 18 let nebo právnická osoba. Uživatel odpovídá za pravdivost uvedených údajů a za zabezpečení přístupových údajů.",
        "Poskytovatel prohlašuje, že je oprávněn nabízené služby poskytovat, a že si sám plní své daňové a odvodové povinnosti.",
      ],
    },
    {
      title: "3. Poplatky",
      body: [
        `Zadání poptávky, prohlížení profilů a příjem nabídek jsou pro klienta zdarma. Přijetím konkrétní nabídky se klientovi účtuje jednorázový zprostředkovatelský poplatek ${formatCzk(FEES.CONNECTION_FEE)} včetně DPH.`,
        `Volitelné předplatné Plánovač ve výši ${formatCzk(FEES.CLIENT_SUBSCRIPTION)} měsíčně zpřístupňuje kalendář a rezervace. Obnovuje se automaticky vždy o měsíc; zrušit ho lze kdykoli s účinností ke konci zaplaceného období.`,
        "V pilotním provozu jsou služby pro poskytovatele bezplatné. O zavedení poplatků na straně poskytovatelů budou uživatelé informováni nejméně 30 dní předem.",
        "Odměna za samotný úklid se hradí přímo mezi klientem a poskytovatelem. Uklidno z ní neúčtuje žádnou provizi.",
      ],
    },
    {
      title: "4. Zprostředkování a odemčení kontaktu",
      body: [
        "Zaplacením zprostředkovatelského poplatku je služba zprostředkování splněna – klientovi se zpřístupní kontaktní údaje poskytovatele, chat a společný kalendář.",
        "Klient bere na vědomí, že v souladu s § 1837 občanského zákoníku nemá právo odstoupit od smlouvy o poskytnutí digitální služby, která byla na jeho výslovnou žádost splněna před uplynutím lhůty pro odstoupení.",
      ],
    },
    {
      title: "5. Hodnocení",
      body: [
        "Hodnocení může vložit pouze uživatel, který s hodnoceným absolvoval dokončenou rezervaci. Jednu rezervaci lze hodnotit jednou.",
        "Uklidno může odstranit hodnocení, které je zjevně nepravdivé, urážlivé, obsahuje osobní údaje třetích osob nebo bylo získáno protiplněním.",
      ],
    },
    {
      title: "6. Zrušení rezervace",
      body: [
        "Rezervaci lze zrušit na straně klienta i poskytovatele. Opakované rušení na poslední chvíli může vést k omezení účtu.",
        "Případné storno poplatky za konkrétní úklid si strany sjednávají mezi sebou; Uklidno je nevybírá ani nevymáhá.",
      ],
    },
    {
      title: "7. Zakázané jednání",
      body: [
        "Uživatel nesmí zveřejňovat kontaktní údaje v textu poptávky nebo nabídky s cílem obejít zprostředkování, vydávat se za jinou osobu ani platformu využívat k nabízení jiných než úklidových služeb.",
        "Uklidno může účet, který podmínky porušuje, pozastavit nebo zrušit.",
      ],
    },
    {
      title: "8. Odpovědnost",
      body: [
        "Uklidno odpovídá za dostupnost a funkčnost platformy. Neodpovídá za škodu vzniklou při poskytování úklidových služeb, za ztrátu či poškození věcí ani za jednání uživatelů.",
        "Klientům doporučujeme sjednat si u pravidelné spolupráce vlastní pojištění domácnosti a poskytovatelům pojištění odpovědnosti za škodu.",
      ],
    },
    {
      title: "9. Změny podmínek",
      body: [
        "Uklidno může podmínky měnit. O podstatných změnách informuje uživatele e-mailem nejméně 30 dní předem. Pokračováním v užívání služby po účinnosti změn uživatel se změnami souhlasí.",
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader title="Obchodní podmínky" description="Verze pro pilotní provoz." />

      <div className="mb-8">
        <Alert tone="warning">
          Pracovní znění pro vývoj produktu. Před ostrým spuštěním musí projít revizí advokáta.
        </Alert>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-semibold text-ink-900">{section.title}</h2>
            <div className="mt-2 space-y-3 text-sm leading-relaxed text-ink-700">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
