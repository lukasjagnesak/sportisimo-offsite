import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { FEES, PLANS, vatBreakdown } from "@/lib/fees";
import { formatCzk } from "@/lib/format";

export const metadata = {
  title: "Ceník",
  description:
    "Zadání poptávky zdarma, jednorázový poplatek za propojení a plánovač za 99 Kč měsíčně. Žádná provize z ceny úklidu.",
};

const faq = [
  {
    q: "Kdy přesně zaplatím?",
    a: `Až ve chvíli, kdy si vyberete konkrétní nabídku. Do té doby je všechno – zadání poptávky, prohlížení profilů i čtení reakcí – zdarma. Jednorázový poplatek ${formatCzk(FEES.CONNECTION_FEE)} strhneme z uložené karty a hned se odemkne kontakt, chat a společný kalendář.`,
  },
  {
    q: "Musím mít předplatné?",
    a: "Ne. Bez něj se s uklízečkou normálně domluvíte v chatu i po telefonu. Předplatné řeší plánování – vidíte její kalendář a objednáváte na konkrétní den a hodinu, včetně opakovaných úklidů.",
  },
  {
    q: "Berete si provizi z ceny úklidu?",
    a: "Ne. Za úklid platíte přímo uklízečce, v hotovosti nebo převodem, jak se domluvíte. Právě proto si u nás účtuje méně než přes agenturu a zároveň jí zůstane víc.",
  },
  {
    q: "Platí něco uklízečky?",
    a: "Zatím ne. V pilotním provozu jsou registrace i reakce na poptávky zdarma. Až tarif pro poskytovatele spustíme, dáme vědět předem a nikoho nepřepneme automaticky.",
  },
  {
    q: "Jak zruším předplatné?",
    a: "Jedním kliknutím v sekci Předplatné. Zůstane vám aktivní do konce zaplaceného období a pak se prostě neobnoví.",
  },
  {
    q: "Co když s uklízečkou nebudeme ladit?",
    a: "Zadejte novou poptávku. Poplatek za propojení se platí za každé nové propojení, ale historie hodnocení vám příště pomůže vybrat přesněji.",
  },
];

export default function PricingPage() {
  const connection = vatBreakdown(FEES.CONNECTION_FEE);
  const plan = PLANS.CLIENT_BASIC;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <PageHeader
        title="Ceník"
        description="Platíte za výsledek – za to, že máte konkrétního člověka. Ne za každou odpracovanou hodinu."
      />

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="p-6">
          <p className="text-sm font-medium text-ink-500">Poptávka</p>
          <p className="mt-2 text-3xl font-semibold text-ink-900">zdarma</p>
          <ul className="mt-5 space-y-2 text-sm text-ink-700">
            {[
              "Neomezený počet poptávek",
              "Profily a hodnocení všech poskytovatelů",
              "Reakce s cenou a termínem",
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="text-sand-500">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="border-ink-300 p-6 shadow-md">
          <p className="text-sm font-medium text-ink-500">Propojení</p>
          <p className="mt-2 text-3xl font-semibold text-ink-900">
            {formatCzk(FEES.CONNECTION_FEE)}
          </p>
          <p className="mt-1 text-xs text-ink-500">
            jednorázově, vč. DPH ({formatCzk(connection.base, true)} +{" "}
            {formatCzk(connection.vat, true)} DPH)
          </p>
          <ul className="mt-5 space-y-2 text-sm text-ink-700">
            {[
              "Odemčení kontaktu na vybranou uklízečku",
              "Chat a společná historie",
              "Adresa se předává až tady",
              "Platíte, až když si opravdu vyberete",
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="text-sand-500">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-medium text-ink-500">Plánovač</p>
          <p className="mt-2 text-3xl font-semibold text-ink-900">
            {formatCzk(plan.price)}
            <span className="text-base font-normal text-ink-500"> / měsíc</span>
          </p>
          <ul className="mt-5 space-y-2 text-sm text-ink-700">
            {plan.features.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="text-sand-500">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="font-semibold text-ink-900">Pro uklízečky a uklízeče</h2>
        <p className="mt-2 text-ink-700">
          V pilotním provozu zdarma – registrace, profil i reakce na poptávky. Za úklid dostáváte
          zaplaceno přímo od klienta, my si z toho nebereme nic. Až budeme spouštět placený tarif,
          řekneme si o to předem.
        </p>
        <ButtonLink href="/registrace?role=CLEANER" variant="outline" className="mt-5">
          Zaregistrovat se
        </ButtonLink>
      </Card>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight text-ink-900">Časté otázky</h2>
        <div className="mt-5 space-y-3">
          {faq.map((item) => (
            <details key={item.q} className="card group p-5">
              <summary className="cursor-pointer list-none font-medium text-ink-900">
                <span className="mr-2 text-ink-400 group-open:hidden">+</span>
                <span className="mr-2 hidden text-ink-400 group-open:inline">−</span>
                {item.q}
              </summary>
              <p className="mt-3 pl-6 text-sm leading-relaxed text-ink-700">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-12 text-center">
        <ButtonLink href="/poptavky/nova" size="lg">
          Zadat poptávku zdarma
        </ButtonLink>
      </div>
    </div>
  );
}
