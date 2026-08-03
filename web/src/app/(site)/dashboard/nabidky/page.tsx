import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatCzk, timeAgo } from "@/lib/format";
import { OFFER_STATUS_LABELS, type OfferStatus } from "@/lib/constants";
import { withdrawOfferAction } from "@/lib/actions/jobs";

export const metadata = { title: "Moje nabídky" };
export const dynamic = "force-dynamic";

export default async function MyOffersPage() {
  const user = (await getCurrentUser())!;
  if (user.role !== "CLEANER" || !user.cleanerProfileId) redirect("/dashboard");

  const offers = await prisma.offer.findMany({
    where: { cleanerId: user.cleanerProfileId },
    orderBy: { createdAt: "desc" },
    include: { jobRequest: { select: { id: true, title: true, city: true, status: true } } },
  });

  return (
    <>
      <PageHeader
        title="Moje nabídky"
        description="Reakce, které jste poslal(a) na poptávky klientů."
        action={<ButtonLink href="/poptavky">Procházet poptávky</ButtonLink>}
      />

      {offers.length === 0 ? (
        <EmptyState
          title="Zatím jste nikam nereagoval(a)"
          description="Projděte otevřené poptávky ve svém okolí a ozvěte se těm, které vám sedí."
          action={
            <ButtonLink href="/poptavky" className="mt-2">
              Zobrazit poptávky
            </ButtonLink>
          }
        />
      ) : (
        <ul className="space-y-4">
          {offers.map((offer) => (
            <li key={offer.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          offer.status === "ACCEPTED"
                            ? "success"
                            : offer.status === "PENDING"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {OFFER_STATUS_LABELS[offer.status as OfferStatus]}
                      </Badge>
                      <span className="text-xs text-ink-500">{timeAgo(offer.createdAt)}</span>
                    </div>

                    <Link
                      href={`/poptavky/${offer.jobRequest.id}`}
                      className="mt-2 block font-semibold text-ink-900 hover:underline"
                    >
                      {offer.jobRequest.title}
                    </Link>
                    <p className="mt-1 text-sm text-ink-600">{offer.jobRequest.city}</p>
                    <p className="mt-3 line-clamp-2 text-sm text-ink-700">{offer.message}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-ink-900">
                      {formatCzk(offer.pricePerHour)}
                    </p>
                    <p className="text-xs text-ink-500">za hodinu</p>

                    {offer.status === "PENDING" && (
                      <form action={withdrawOfferAction} className="mt-3">
                        <input type="hidden" name="offerId" value={offer.id} />
                        <button
                          type="submit"
                          className="text-sm text-ink-500 hover:text-red-600"
                        >
                          Stáhnout nabídku
                        </button>
                      </form>
                    )}

                    {offer.status === "ACCEPTED" && (
                      <Link
                        href="/dashboard/spoluprace"
                        className="mt-3 inline-block text-sm font-medium text-ink-700 hover:text-ink-900"
                      >
                        Otevřít spolupráci →
                      </Link>
                    )}
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
