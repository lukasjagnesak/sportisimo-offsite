import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { FEES } from "@/lib/fees";
import { formatCzk } from "@/lib/format";

export const metadata = {
  title: "Jak to funguje",
  description:
    "Od zadání poptávky přes výběr uklízečky až po plánování termínů v kalendáři – krok za krokem.",
};

const clientSteps = [
  {
    title: "Zadáte poptávku",
    body: "Popíšete, co potřebujete uklidit, jak často a kdy se vám to hodí. Ulici uvidí až ten, koho si vyberete – ve výpisu je jen město.",
  },
  {
    title: "Přijdou reakce",
    body: "Uklízečky ve vašem okolí reagují konkrétní sazbou a termínem nástupu. U každé vidíte hodnocení, praxi, jazyky a počet dokončených úklidů.",
  },
  {
    title: "Vyberete si",
    body: `Přijmutím nabídky se strhne jednorázový poplatek ${formatCzk(FEES.CONNECTION_FEE)} a hned se odemkne telefon, e-mail a chat. Ostatní nabídky se automaticky uzavřou.`,
  },
  {
    title: "Domluvíte detaily",
    body: "V chatu si vyjasníte klíče, drogerii, přístup do domu. Historie zpráv vám zůstane, takže se nemusíte nic pamatovat.",
  },
  {
    title: "Plánujete v kalendáři",
    body: "S předplatným Plánovač vidíte volné termíny a objednáváte na konkrétní den a hodinu. Uklízečka termín potvrdí a oba ho máte v přehledu.",
  },
  {
    title: "Hodnotíte",
    body: "Po dokončeném úklidu ohodnotíte kvalitu, dochvilnost a komunikaci. Hodnocení pomáhá dalším klientům i dobrým uklízečkám.",
  },
];

const cleanerSteps = [
  {
    title: "Založíte profil",
    body: "Vyplníte, co děláte, kde, za kolik a jakými jazyky se domluvíte. Čím konkrétnější profil, tím lepší poptávky.",
  },
  {
    title: "Vyberete si poptávky",
    body: "Vidíte otevřené poptávky ve svém okolí. Reagujete jen na ty, které vám sedí do trasy a do kalendáře.",
  },
  {
    title: "Nabídnete svoji cenu",
    body: "Sazbu si určujete sami. Napíšete klientovi pár vět o tom, proč jste dobrá volba a odkdy můžete.",
  },
  {
    title: "Klient si vás vybere",
    body: "Dostanete kontakt a přístup do chatu. Za úklid vám klient platí přímo — Uklidno si z ceny nebere nic.",
  },
  {
    title: "Řídíte si kalendář",
    body: "Nastavíte, ve které dny a hodiny pracujete, a přidáte dovolenou. Mimo tuhle dobu vás nikdo neobjedná.",
  },
  {
    title: "Sbíráte hodnocení",
    body: "Dobré reference vás posouvají nahoru ve výpisu a přinášejí další zakázky bez shánění.",
  },
];

function Steps({ steps }: { steps: typeof clientSteps }) {
  return (
    <ol className="mt-6 space-y-4">
      {steps.map((step, i) => (
        <li key={step.title}>
          <Card className="flex gap-4 p-5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink-700 text-sm font-semibold text-white">
              {i + 1}
            </span>
            <div>
              <h3 className="font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{step.body}</p>
            </div>
          </Card>
        </li>
      ))}
    </ol>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader
        title="Jak to funguje"
        description="Nejsme agentura. Propojíme vás a pak už si to řídíte sami – my se staráme jen o to, aby se to dobře plánovalo."
      />

      <section>
        <h2 className="text-xl font-semibold tracking-tight text-ink-900">Pro klienty</h2>
        <Steps steps={clientSteps} />
        <ButtonLink href="/poptavky/nova" className="mt-6">
          Zadat poptávku
        </ButtonLink>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight text-ink-900">
          Pro uklízečky a uklízeče
        </h2>
        <Steps steps={cleanerSteps} />
        <ButtonLink href="/registrace?role=CLEANER" variant="accent" className="mt-6">
          Chci dostávat poptávky
        </ButtonLink>
      </section>

      <Card className="mt-14 p-6">
        <h2 className="font-semibold text-ink-900">Co Uklidno není</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-700">
          <li>
            <strong>Není zaměstnavatel.</strong> Uklízečky jsou samostatné osoby, ne naši
            zaměstnanci. Smluvní vztah vzniká mezi vámi a jimi.
          </li>
          <li>
            <strong>Nedrží peníze za úklid.</strong> Za odvedenou práci platíte přímo, my
            účtujeme jen zprostředkování a plánovací nástroj.
          </li>
          <li>
            <strong>Nerozhoduje za vás.</strong> Ověřujeme totožnost a u části poskytovatelů i
            výpis z rejstříku trestů, ale výběr je vždy na vás.
          </li>
        </ul>
      </Card>
    </div>
  );
}
