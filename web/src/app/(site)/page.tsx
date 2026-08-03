import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Avatar, Badge, ButtonLink, Card, Stars } from "@/components/ui";
import { FEES } from "@/lib/fees";
import { formatCzk, formatRating, pluralCz } from "@/lib/format";
import { SERVICE_LABELS, type Service } from "@/lib/constants";

export const dynamic = "force-dynamic";

const steps = [
  {
    title: "Zadáte poptávku",
    body: "Za dvě minuty popíšete, co potřebujete uklidit, jak často a kdy se vám to hodí. Adresu vidíme jen my.",
  },
  {
    title: "Uklízečky se ozvou samy",
    body: "Do 24 hodin máte na stole konkrétní reakce s cenou a termínem. Nikoho neobvoláváte.",
  },
  {
    title: "Vyberete si podle hodnocení",
    body: "Zkušenosti, jazyky, reference od jiných klientů, volné termíny. Rozhodnete se v klidu.",
  },
  {
    title: "Plánujete v kalendáři",
    body: "Vidíte dostupnost a objednáváte na konkrétní den a hodinu. Bez SMS a bez dohadování.",
  },
];

export default async function HomePage() {
  const [cleaners, cleanerCount, reviewCount] = await Promise.all([
    prisma.cleanerProfile.findMany({
      where: { acceptingWork: true, verificationState: "APPROVED" },
      orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
      take: 3,
      include: { user: true, services: true },
    }),
    prisma.cleanerProfile.count(),
    prisma.review.count(),
  ]);

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <Badge tone="accent">Praha, Brno a okolí</Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-ink-950 sm:text-5xl">
              Váš čas stojí víc než hodina úklidu.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-700">
              Zadejte jednu poptávku a nechte uklízečky, ať se ozvou samy. Vyberete si podle
              hodnocení a dostupnosti, domluvíte se přímo a dál už jen plánujete v kalendáři.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/poptavky/nova" size="lg">
                Zadat poptávku zdarma
              </ButtonLink>
              <ButtonLink href="/uklizecky" size="lg" variant="outline">
                Prohlédnout uklízečky
              </ButtonLink>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-ink-100 pt-6">
              <div>
                <dt className="text-sm text-ink-500">Poskytovatelů</dt>
                <dd className="text-2xl font-semibold text-ink-900">{cleanerCount}</dd>
              </div>
              <div>
                <dt className="text-sm text-ink-500">Hodnocení</dt>
                <dd className="text-2xl font-semibold text-ink-900">{reviewCount}</dd>
              </div>
              <div>
                <dt className="text-sm text-ink-500">První reakce</dt>
                <dd className="text-2xl font-semibold text-ink-900">do 24 h</dd>
              </div>
            </dl>
          </div>

          {/* Ukázka toho, co klient uvidí – prodává produkt líp než obrázek. */}
          <Card className="h-fit p-6">
            <p className="text-sm font-medium text-ink-500">Reakce na vaši poptávku</p>
            <div className="mt-4 space-y-3">
              {cleaners.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-3 rounded-xl border border-ink-100 p-3"
                >
                  <Avatar firstName={c.user.firstName} lastName={c.user.lastName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-ink-900">
                        {c.user.firstName} {c.user.lastName}
                      </p>
                      {c.verified && <Badge tone="success">Ověřeno</Badge>}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-sm text-ink-600">
                      <Stars value={c.ratingAvg} size="sm" />
                      <span>{formatRating(c.ratingAvg)}</span>
                      <span className="text-ink-300">·</span>
                      <span>{c.yearsExperience} let praxe</span>
                    </div>
                    <p className="mt-1 text-sm text-ink-700">
                      {formatCzk(c.hourlyRate)} / hod · {c.city}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-ink-500">
              Skutečné profily z platformy. Kontakt se odemyká až ve chvíli, kdy si někoho
              vyberete.
            </p>
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------ jak to jde */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
          Čtyři kroky, žádné obvolávání
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Card key={step.title} className="p-6">
              <span className="flex size-8 items-center justify-center rounded-lg bg-ink-700 text-sm font-semibold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ cena */}
      <section className="border-y border-ink-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
              Platíte za propojení, ne za každou hodinu
            </h2>
            <p className="mt-4 leading-relaxed text-ink-700">
              Agentury si berou provizi z každé návštěvy — často třetinu ceny. U nás zaplatíte
              jednorázově za to, že vám najdeme člověka, a pak už si domlouváte přímo. Uklízečce
              zůstane celá její sazba, což se pozná na tom, koho si přitáhnete.
            </p>
            <ul className="mt-6 space-y-3 text-ink-700">
              {[
                "Zadání poptávky a prohlížení profilů je zdarma.",
                `Jednorázový poplatek ${formatCzk(FEES.CONNECTION_FEE)} zaplatíte, až když si někoho vyberete.`,
                `Plánovací nadstavba ${formatCzk(FEES.CLIENT_SUBSCRIPTION)} měsíčně, zrušíte kdykoli.`,
                "Za samotný úklid platíte přímo uklízečce, my si z toho nebereme nic.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 text-sand-500">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <ButtonLink href="/cenik" variant="outline" className="mt-8">
              Podrobný ceník
            </ButtonLink>
          </div>

          <Card className="p-8">
            <p className="text-sm font-medium text-ink-500">Modelový výpočet</p>
            <p className="mt-2 text-ink-700">
              Pravidelný úklid 4 hodiny každých 14 dní, sazba 390 Kč/h.
            </p>
            <table className="mt-6 w-full text-sm">
              <tbody className="divide-y divide-ink-100">
                <tr>
                  <td className="py-3 text-ink-600">Agentura (provize ~30 %)</td>
                  <td className="py-3 text-right font-medium text-ink-900">
                    {formatCzk(4 * 39000 * 1.3 * 2)} / měsíc
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-ink-600">Uklidno – úklid přímo uklízečce</td>
                  <td className="py-3 text-right font-medium text-ink-900">
                    {formatCzk(4 * 39000 * 2)} / měsíc
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-ink-600">Uklidno – plánovač</td>
                  <td className="py-3 text-right font-medium text-ink-900">
                    {formatCzk(FEES.CLIENT_SUBSCRIPTION)} / měsíc
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink-200">
                  <td className="py-3 font-semibold text-ink-900">Ušetříte měsíčně</td>
                  <td className="py-3 text-right font-semibold text-sand-600">
                    {formatCzk(4 * 39000 * 0.3 * 2 - FEES.CLIENT_SUBSCRIPTION)}
                  </td>
                </tr>
              </tfoot>
            </table>
            <p className="mt-4 text-xs text-ink-500">
              Orientační propočet při obvyklé provizi úklidových agentur. Skutečná cena závisí na
              domluvě s konkrétní uklízečkou.
            </p>
          </Card>
        </div>
      </section>

      {/* --------------------------------------------------------------- profily */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Nejlépe hodnocení tento měsíc
          </h2>
          <Link href="/uklizecky" className="text-sm font-medium text-ink-700 hover:text-ink-900">
            Zobrazit všechny →
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {cleaners.map((c) => (
            <Card key={c.id} className="flex flex-col p-6">
              <div className="flex items-center gap-3">
                <Avatar firstName={c.user.firstName} lastName={c.user.lastName} />
                <div>
                  <p className="font-medium text-ink-900">
                    {c.user.firstName} {c.user.lastName}
                  </p>
                  <p className="text-sm text-ink-500">{c.city}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm">
                <Stars value={c.ratingAvg} />
                <span className="font-medium text-ink-900">{formatRating(c.ratingAvg)}</span>
                <span className="text-ink-500">
                  ({c.ratingCount}{" "}
                  {pluralCz(c.ratingCount, "hodnocení", "hodnocení", "hodnocení")})
                </span>
              </div>

              <p className="mt-3 line-clamp-3 text-sm text-ink-600">{c.headline}</p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.services.slice(0, 3).map((s) => (
                  <Badge key={s.id}>{SERVICE_LABELS[s.service as Service]}</Badge>
                ))}
              </div>

              <div className="mt-auto flex items-center justify-between pt-6">
                <span className="font-semibold text-ink-900">{formatCzk(c.hourlyRate)}/h</span>
                <Link
                  href={`/uklizecky/${c.id}`}
                  className="text-sm font-medium text-ink-700 hover:text-ink-900"
                >
                  Zobrazit profil →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- pro obě strany */}
      <section className="border-t border-ink-100 bg-ink-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Uklízíte nebo žehlíte?</h2>
            <p className="mt-4 leading-relaxed text-ink-200">
              Poptávky ve svém okolí vidíte hned po registraci. Reagujete jen na ty, které se vám
              hodí, cenu si určujete sami a klient vám platí přímo — bez provize z každé hodiny.
            </p>
            <ButtonLink href="/registrace?role=CLEANER" variant="accent" className="mt-6">
              Chci dostávat poptávky
            </ButtonLink>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Vlastní sazba", "Cenu si nastavujete vy, my do ní nemluvíme."],
              ["Vlastní kalendář", "Nastavíte, kdy pracujete. Mimo něj vás nikdo neobjedná."],
              ["Reference se počítají", "Dobrá hodnocení vás posunou nahoru ve výpisu."],
              ["Bez závazků", "Odmítnout poptávku můžete kdykoli, nikdo vás nehodnotí za to."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl bg-ink-800 p-5">
                <h3 className="font-medium">{title}</h3>
                <p className="mt-1.5 text-sm text-ink-200">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- cta */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-ink-950">
          Zadejte poptávku dnes, vybírejte zítra
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ink-600">
          Trvá to dvě minuty a nic vás to nestojí. Platíte, až když si někoho opravdu vyberete.
        </p>
        <ButtonLink href="/poptavky/nova" size="lg" className="mt-8">
          Zadat poptávku zdarma
        </ButtonLink>
      </section>
    </>
  );
}
