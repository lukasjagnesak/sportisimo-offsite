import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Alert, Avatar, Badge, ButtonLink, Card, Stars } from "@/components/ui";
import { formatCzk, formatDate, formatRating, pluralCz, timeAgo } from "@/lib/format";
import {
  FREQUENCY_LABELS,
  JOB_STATUS_LABELS,
  SERVICE_LABELS,
  type Frequency,
  type JobStatus,
  type Service,
} from "@/lib/constants";
import { FEES, FLAGS } from "@/lib/fees";
import { OfferForm } from "./offer-form";
import { OfferActions } from "./offer-actions";
import { cancelJobRequestAction } from "@/lib/actions/jobs";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nova?: string }>;
}) {
  const [{ id }, { nova }, user] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
  ]);

  const job = await prisma.jobRequest.findUnique({
    where: { id },
    include: {
      services: true,
      match: true,
      offers: {
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      },
    },
  });
  if (!job) notFound();

  const isOwner = user?.id === job.clientId;
  const isCleaner = user?.role === "CLEANER" && Boolean(user.cleanerProfileId);

  // Profily uklízeček k nabídkám dotáhneme jedním dotazem.
  const cleanerProfiles = await prisma.cleanerProfile.findMany({
    where: { id: { in: job.offers.map((o) => o.cleanerId) } },
    include: { user: { select: { firstName: true, lastName: true } }, languages: true },
  });
  const profileById = new Map(cleanerProfiles.map((p) => [p.id, p]));

  const myOffer = isCleaner ? job.offers.find((o) => o.cleanerId === user!.cleanerProfileId) : null;
  const hasPaymentMethod = user
    ? (await prisma.paymentMethod.count({ where: { userId: user.id } })) > 0
    : false;

  // Adresu vidí jen zadavatel a propojená uklízečka.
  const canSeeAddress =
    isOwner || (job.match?.cleanerId && job.match.cleanerId === user?.cleanerProfileId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {nova && (
        <div className="mb-6">
          <Alert tone="success">
            Poptávka je zveřejněná. Jakmile na ni někdo zareaguje, dáme vám vědět e-mailem.
          </Alert>
        </div>
      )}

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={job.status === "OPEN" ? "success" : "neutral"}>
                {JOB_STATUS_LABELS[job.status as JobStatus]}
              </Badge>
              <span className="text-xs text-ink-500">zadáno {timeAgo(job.createdAt)}</span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">
              {job.title}
            </h1>
          </div>

          {job.budgetPerHour && (
            <div className="text-right">
              <p className="text-xl font-semibold text-ink-900">
                do {formatCzk(job.budgetPerHour)}
              </p>
              <p className="text-xs text-ink-500">za hodinu</p>
            </div>
          )}
        </div>

        <p className="mt-5 whitespace-pre-line leading-relaxed text-ink-700">{job.description}</p>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-ink-100 pt-6 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-ink-500">Lokalita</dt>
            <dd className="mt-0.5 font-medium text-ink-900">
              {canSeeAddress && job.street ? `${job.street}, ${job.city}` : job.city}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Frekvence</dt>
            <dd className="mt-0.5 font-medium text-ink-900">
              {FREQUENCY_LABELS[job.frequency as Frequency]}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Plocha</dt>
            <dd className="mt-0.5 font-medium text-ink-900">
              {job.areaM2 ? `${job.areaM2} m²` : "–"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Termín od</dt>
            <dd className="mt-0.5 font-medium text-ink-900">
              {job.preferredFrom ? formatDate(job.preferredFrom) : "dohodou"}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          {job.services.map((s) => (
            <Badge key={s.id} tone="accent">
              {SERVICE_LABELS[s.service as Service]}
            </Badge>
          ))}
        </div>

        {job.note && (
          <p className="mt-5 rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-700">{job.note}</p>
        )}

        {isOwner && job.status === "OPEN" && (
          <form action={cancelJobRequestAction} className="mt-6 border-t border-ink-100 pt-5">
            <input type="hidden" name="jobRequestId" value={job.id} />
            <button
              type="submit"
              className="text-sm text-ink-500 underline hover:text-red-600"
            >
              Zrušit poptávku
            </button>
          </form>
        )}
      </Card>

      {/* ------------------------------------------------------------- nabídky */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight text-ink-900">
          Nabídky ({job.offers.length})
        </h2>

        {!isOwner && !isCleaner && (
          <p className="mt-2 text-sm text-ink-600">
            Konkrétní nabídky vidí jen zadavatel poptávky.
          </p>
        )}

        {isOwner && job.offers.length === 0 && (
          <p className="mt-2 text-sm text-ink-600">
            Zatím žádné. Většina poptávek dostane první reakci do 24 hodin.
          </p>
        )}

        {isOwner && job.offers.length > 0 && (
          <>
            {FLAGS.REQUIRE_CONNECTION_FEE && (
              <p className="mt-2 text-sm text-ink-600">
                Po přijetí nabídky se strhne jednorázový poplatek{" "}
                {formatCzk(FEES.CONNECTION_FEE)} a odemkne se kontakt i společný kalendář.
              </p>
            )}
            {!hasPaymentMethod && FLAGS.REQUIRE_CONNECTION_FEE && (
              <div className="mt-4">
                <Alert tone="warning">
                  Nemáte uloženou platební metodu.{" "}
                  <Link href="/dashboard/platby" className="font-medium underline">
                    Přidejte kartu
                  </Link>
                  , ať můžete nabídku přijmout.
                </Alert>
              </div>
            )}

            <ul className="mt-5 space-y-4">
              {job.offers.map((offer) => {
                const profile = profileById.get(offer.cleanerId);
                if (!profile) return null;

                return (
                  <li key={offer.id}>
                    <Card className="p-5">
                      <div className="flex flex-wrap items-start gap-4">
                        <Avatar
                          firstName={profile.user.firstName}
                          lastName={profile.user.lastName}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/uklizecky/${profile.id}`}
                              className="font-semibold text-ink-900 hover:underline"
                            >
                              {profile.user.firstName} {profile.user.lastName}
                            </Link>
                            {profile.verified && <Badge tone="success">Ověřeno</Badge>}
                            {offer.status !== "PENDING" && (
                              <Badge tone={offer.status === "ACCEPTED" ? "success" : "neutral"}>
                                {offer.status === "ACCEPTED" ? "Vybráno" : "Neaktuální"}
                              </Badge>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-600">
                            {profile.ratingCount > 0 ? (
                              <>
                                <Stars value={profile.ratingAvg} size="sm" />
                                <span className="font-medium text-ink-900">
                                  {formatRating(profile.ratingAvg)}
                                </span>
                                <span>
                                  ({profile.ratingCount}{" "}
                                  {pluralCz(
                                    profile.ratingCount,
                                    "hodnocení",
                                    "hodnocení",
                                    "hodnocení",
                                  )}
                                  )
                                </span>
                              </>
                            ) : (
                              <span>Zatím bez hodnocení</span>
                            )}
                            <span className="text-ink-300">·</span>
                            <span>{profile.yearsExperience} let praxe</span>
                            <span className="text-ink-300">·</span>
                            <span>{profile.completedJobs} úklidů</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-semibold text-ink-900">
                            {formatCzk(offer.pricePerHour)}
                          </p>
                          <p className="text-xs text-ink-500">za hodinu</p>
                        </div>
                      </div>

                      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-700">
                        {offer.message}
                      </p>

                      {offer.availableFrom && (
                        <p className="mt-3 text-sm text-ink-600">
                          Nastoupí od {formatDate(offer.availableFrom)}
                        </p>
                      )}

                      {offer.status === "PENDING" && job.status === "OPEN" && (
                        <OfferActions
                          offerId={offer.id}
                          cleanerName={`${profile.user.firstName} ${profile.user.lastName}`}
                          disabled={FLAGS.REQUIRE_CONNECTION_FEE && !hasPaymentMethod}
                        />
                      )}
                    </Card>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {/* --------------------------------------------------- reakce uklízečky */}
        {isCleaner && (
          <div className="mt-5">
            {job.status !== "OPEN" ? (
              <Alert>Tato poptávka už je uzavřená.</Alert>
            ) : myOffer ? (
              <Card className="p-5">
                <Badge tone="success">Vaše nabídka byla odeslána</Badge>
                <p className="mt-3 text-sm text-ink-700">{myOffer.message}</p>
                <p className="mt-2 text-sm font-medium text-ink-900">
                  {formatCzk(myOffer.pricePerHour)} / hodinu
                </p>
              </Card>
            ) : (
              <OfferForm jobRequestId={job.id} suggestedPrice={job.budgetPerHour ?? undefined} />
            )}
          </div>
        )}

        {!user && (
          <Card className="mt-5 p-6 text-center">
            <p className="text-ink-700">
              Uklízíte? Zaregistrujte se a reagujte na poptávky ve svém okolí.
            </p>
            <ButtonLink href="/registrace?role=CLEANER" className="mt-4">
              Chci dostávat poptávky
            </ButtonLink>
          </Card>
        )}
      </section>
    </div>
  );
}
