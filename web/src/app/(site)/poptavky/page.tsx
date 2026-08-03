import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatCzk, pluralCz, timeAgo } from "@/lib/format";
import {
  FREQUENCY_LABELS,
  SERVICE_LABELS,
  SERVICES,
  type Frequency,
  type Service,
} from "@/lib/constants";

export const metadata = {
  title: "Otevřené poptávky",
  description: "Aktuální poptávky po úklidu a žehlení. Reagujte na ty, které vám sedí.",
};

export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const city = typeof params.mesto === "string" ? params.mesto.trim() : "";
  const service = typeof params.sluzba === "string" ? params.sluzba : "";

  const jobs = await prisma.jobRequest.findMany({
    where: {
      status: "OPEN",
      ...(city ? { city: { contains: city } } : {}),
      ...(service ? { services: { some: { service } } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      services: true,
      _count: { select: { offers: true } },
    },
  });

  // Na které poptávky už uklízečka reagovala – ať jí nenabízíme duplicitu.
  const myOfferJobIds = new Set(
    user?.cleanerProfileId
      ? (
          await prisma.offer.findMany({
            where: { cleanerId: user.cleanerProfileId },
            select: { jobRequestId: true },
          })
        ).map((o) => o.jobRequestId)
      : [],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader
        title="Otevřené poptávky"
        description="Reagujte cenou a termínem. Klient si vybere a vy se dozvíte kontakt."
        action={
          user?.role === "CLIENT" || !user ? (
            <ButtonLink href="/poptavky/nova">Zadat poptávku</ButtonLink>
          ) : null
        }
      />

      <form className="mb-6 flex flex-wrap gap-3" action="/poptavky">
        <input
          name="mesto"
          defaultValue={city}
          placeholder="Město"
          className="field-input max-w-[200px]"
        />
        <select name="sluzba" defaultValue={service} className="field-input max-w-[240px]">
          <option value="">Všechny služby</option>
          {SERVICES.map((s) => (
            <option key={s} value={s}>
              {SERVICE_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-ink-700 px-4 text-sm font-medium text-white hover:bg-ink-800"
        >
          Filtrovat
        </button>
      </form>

      {jobs.length === 0 ? (
        <EmptyState
          title="Žádné otevřené poptávky"
          description="Zkuste jiné město nebo službu. Nové poptávky přibývají každý den."
        />
      ) : (
        <ul className="space-y-4">
          {jobs.map((job) => (
            <li key={job.id}>
              <Card className="p-5 transition hover:border-ink-300">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/poptavky/${job.id}`}
                      className="text-lg font-semibold text-ink-900 hover:underline"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-1 text-sm text-ink-600">
                      {job.city} · {FREQUENCY_LABELS[job.frequency as Frequency]}
                      {job.areaM2 ? ` · ${job.areaM2} m²` : ""}
                      {job.estimatedHours ? ` · ~${job.estimatedHours} h` : ""}
                    </p>
                  </div>

                  <div className="text-right">
                    {job.budgetPerHour && (
                      <p className="font-semibold text-ink-900">
                        do {formatCzk(job.budgetPerHour)}/h
                      </p>
                    )}
                    <p className="text-xs text-ink-500">{timeAgo(job.createdAt)}</p>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-ink-700">{job.description}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {job.services.map((s) => (
                    <Badge key={s.id}>{SERVICE_LABELS[s.service as Service]}</Badge>
                  ))}
                  <span className="ml-auto text-xs text-ink-500">
                    {job._count.offers}{" "}
                    {pluralCz(job._count.offers, "nabídka", "nabídky", "nabídek")}
                  </span>
                  {myOfferJobIds.has(job.id) && <Badge tone="success">Už jste reagoval(a)</Badge>}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
