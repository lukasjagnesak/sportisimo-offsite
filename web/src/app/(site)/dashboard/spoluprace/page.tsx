import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listMatches } from "@/lib/queries/matches";
import { Avatar, Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatDate, pluralCz } from "@/lib/format";
import { SERVICE_LABELS, type Service } from "@/lib/constants";

export const metadata = { title: "Spolupráce" };
export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const user = (await getCurrentUser())!;
  const matches = await listMatches(user);
  const isCleaner = user.role === "CLEANER";

  return (
    <>
      <PageHeader
        title="Spolupráce"
        description="Propojení, u kterých už máte kontakt, chat i společný kalendář."
      />

      {matches.length === 0 ? (
        <EmptyState
          title="Zatím žádná spolupráce"
          description={
            isCleaner
              ? "Reagujte na poptávky – jakmile vás klient vybere, objeví se tu."
              : "Zadejte poptávku a vyberte si z reakcí. Propojení se pak objeví tady."
          }
          action={
            <ButtonLink href={isCleaner ? "/poptavky" : "/poptavky/nova"} className="mt-2">
              {isCleaner ? "Procházet poptávky" : "Zadat poptávku"}
            </ButtonLink>
          }
        />
      ) : (
        <ul className="space-y-4">
          {matches.map(({ match, client, cleaner }) => {
            const other = isCleaner ? client : cleaner.user;
            return (
              <li key={match.id}>
                <Link href={`/dashboard/spoluprace/${match.id}`}>
                  <Card className="p-5 transition hover:border-ink-300">
                    <div className="flex flex-wrap items-start gap-4">
                      <Avatar firstName={other.firstName} lastName={other.lastName} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink-900">
                          {other.firstName} {other.lastName}
                        </p>
                        <p className="mt-0.5 text-sm text-ink-600">{match.jobRequest.title}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {match.jobRequest.services.map((s) => (
                            <Badge key={s.id}>{SERVICE_LABELS[s.service as Service]}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right text-sm text-ink-500">
                        <p>propojeno {formatDate(match.createdAt)}</p>
                        <p className="mt-1">
                          {match._count.bookings}{" "}
                          {pluralCz(match._count.bookings, "rezervace", "rezervace", "rezervací")}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
