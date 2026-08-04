import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatCzk, pluralCz, timeAgo } from "@/lib/format";
import {
  FREQUENCY_LABELS,
  JOB_STATUS_LABELS,
  SERVICE_LABELS,
  type Frequency,
  type JobStatus,
  type Service,
} from "@/lib/constants";

export const metadata = { title: "Moje poptávky" };
export const dynamic = "force-dynamic";

export default async function MyJobsPage() {
  const user = await requirePageUser();
  if (user.role !== "CLIENT") redirect("/dashboard");

  const jobs = await prisma.jobRequest.findMany({
    where: { clientId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      services: true,
      _count: { select: { offers: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Moje poptávky"
        description="Přehled zadaných poptávek a reakcí, které na ně dorazily."
        action={<ButtonLink href="/poptavky/nova">Nová poptávka</ButtonLink>}
      />

      {jobs.length === 0 ? (
        <EmptyState
          title="Zatím žádná poptávka"
          description="Zadání trvá dvě minuty a je zdarma. Platíte, až když si někoho vyberete."
          action={
            <ButtonLink href="/poptavky/nova" className="mt-2">
              Zadat poptávku
            </ButtonLink>
          }
        />
      ) : (
        <ul className="space-y-4">
          {jobs.map((job) => (
            <li key={job.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={job.status === "OPEN" ? "success" : "neutral"}>
                        {JOB_STATUS_LABELS[job.status as JobStatus]}
                      </Badge>
                      <span className="text-xs text-ink-500">{timeAgo(job.createdAt)}</span>
                    </div>
                    <Link
                      href={`/poptavky/${job.id}`}
                      className="mt-2 block text-lg font-semibold text-ink-900 hover:underline"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-1 text-sm text-ink-600">
                      {job.city} · {FREQUENCY_LABELS[job.frequency as Frequency]}
                      {job.budgetPerHour ? ` · do ${formatCzk(job.budgetPerHour)}/h` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {job.services.map((s) => (
                        <Badge key={s.id}>{SERVICE_LABELS[s.service as Service]}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-semibold text-ink-900">{job._count.offers}</p>
                    <p className="text-xs text-ink-500">
                      {pluralCz(job._count.offers, "nabídka", "nabídky", "nabídek")}
                    </p>
                    <Link
                      href={`/poptavky/${job.id}`}
                      className="mt-3 inline-block text-sm font-medium text-ink-700 hover:text-ink-900"
                    >
                      Zobrazit →
                    </Link>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
