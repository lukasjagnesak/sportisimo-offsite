import { notFound } from "next/navigation";
import { getCleanerDetail } from "@/lib/queries/cleaners";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Alert, Avatar, Badge, ButtonLink, Card, Stars } from "@/components/ui";
import { formatCzk, formatDate, formatMinutes, formatRating, pluralCz } from "@/lib/format";
import {
  LANGUAGE_LABELS,
  LANGUAGE_LEVEL_LABELS,
  SERVICE_LABELS,
  WEEKDAYS,
  type Language,
  type LanguageLevel,
  type Service,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getCleanerDetail(id);
  if (!detail) return { title: "Profil nenalezen" };

  const { cleaner } = detail;
  return {
    title: `${cleaner.user.firstName} ${cleaner.user.lastName} – ${cleaner.city}`,
    description: cleaner.headline ?? undefined,
  };
}

export default async function CleanerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, viewer] = await Promise.all([getCleanerDetail(id), getCurrentUser()]);
  if (!detail) notFound();

  const { cleaner, reviews, breakdown } = detail;

  // Kontakt ukazujeme jen protistraně, se kterou už propojení existuje.
  const match = viewer
    ? await prisma.match.findFirst({
        where: { clientId: viewer.id, cleanerId: cleaner.id, status: "ACTIVE" },
      })
    : null;

  const scores = [
    ["Kvalita úklidu", breakdown.quality],
    ["Dochvilnost", breakdown.punctuality],
    ["Komunikace", breakdown.communication],
  ] as const;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-start gap-5">
              <Avatar
                firstName={cleaner.user.firstName}
                lastName={cleaner.user.lastName}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
                    {cleaner.user.firstName} {cleaner.user.lastName}
                  </h1>
                  {cleaner.verified && <Badge tone="success">Ověřený profil</Badge>}
                  {cleaner.criminalRecordChecked && <Badge tone="accent">Výpis z rejstříku</Badge>}
                </div>

                <p className="mt-1 text-ink-600">
                  {cleaner.city} · dojede do {cleaner.radiusKm} km
                </p>

                {cleaner.ratingCount > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <Stars value={cleaner.ratingAvg} />
                    <span className="font-medium text-ink-900">
                      {formatRating(cleaner.ratingAvg)}
                    </span>
                    <span className="text-ink-500">
                      z {cleaner.ratingCount}{" "}
                      {pluralCz(cleaner.ratingCount, "hodnocení", "hodnocení", "hodnocení")}
                    </span>
                  </div>
                )}

                {cleaner.headline && (
                  <p className="mt-4 text-lg text-ink-800">{cleaner.headline}</p>
                )}
              </div>
            </div>

            {cleaner.bio && (
              <p className="mt-6 whitespace-pre-line leading-relaxed text-ink-700">
                {cleaner.bio}
              </p>
            )}

            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-ink-100 pt-6 sm:grid-cols-4">
              {[
                ["Praxe", `${cleaner.yearsExperience} let`],
                ["Dokončeno", `${cleaner.completedJobs} úklidů`],
                ["Vlastní drogerie", cleaner.hasOwnSupplies ? "Ano" : "Ne"],
                ["Fakturuje", cleaner.invoices ? "Ano" : "Ne"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-ink-500">{label}</dt>
                  <dd className="mt-0.5 font-medium text-ink-900">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-ink-900">Co nabízí</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {cleaner.services.map((s) => (
                <Badge key={s.id} tone="accent">
                  {SERVICE_LABELS[s.service as Service]}
                </Badge>
              ))}
            </div>

            <h2 className="mt-6 font-semibold text-ink-900">Jazyky</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
              {cleaner.languages.map((l) => (
                <li key={l.id} className="flex justify-between border-b border-ink-50 pb-1.5">
                  <span>{LANGUAGE_LABELS[l.language as Language]}</span>
                  <span className="text-ink-500">
                    {LANGUAGE_LEVEL_LABELS[l.level as LanguageLevel]}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-ink-900">Kdy obvykle pracuje</h2>
            {cleaner.availability.length === 0 ? (
              <p className="mt-3 text-sm text-ink-600">Dostupnost zatím nevyplnila.</p>
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {WEEKDAYS.map((day) => {
                  const blocks = cleaner.availability.filter((a) => a.weekday === day.value);
                  return (
                    <li
                      key={day.value}
                      className="flex justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm"
                    >
                      <span className="text-ink-700">{day.label}</span>
                      <span className="font-medium text-ink-900">
                        {blocks.length
                          ? blocks
                              .map((b) => `${formatMinutes(b.startMin)}–${formatMinutes(b.endMin)}`)
                              .join(", ")
                          : "volno"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-4 text-xs text-ink-500">
              Konkrétní volné termíny uvidíte v kalendáři po propojení.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-ink-900">
              Hodnocení ({cleaner.ratingCount})
            </h2>

            {cleaner.ratingCount > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {scores.map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-ink-50 px-3 py-2.5">
                    <p className="text-xs text-ink-500">{label}</p>
                    <p className="mt-0.5 font-semibold text-ink-900">
                      {value ? formatRating(value) : "–"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <ul className="mt-6 space-y-5">
              {reviews.length === 0 && (
                <li className="text-sm text-ink-600">Zatím bez hodnocení.</li>
              )}
              {reviews.map((review) => (
                <li key={review.id} className="border-b border-ink-50 pb-5 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink-900">
                      {review.author.firstName} {review.author.lastName[0]}.
                    </span>
                    <span className="text-xs text-ink-500">{formatDate(review.createdAt)}</span>
                  </div>
                  <Stars value={review.rating} size="sm" />
                  {review.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-ink-700">{review.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* ------------------------------------------------------------ sidebar */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <Card className="p-6">
            <p className="text-3xl font-semibold text-ink-900">{formatCzk(cleaner.hourlyRate)}</p>
            <p className="text-sm text-ink-500">za hodinu, platíte přímo</p>

            {match ? (
              <>
                <Alert tone="success">Jste propojeni – můžete plánovat termíny.</Alert>
                <ButtonLink href={`/dashboard/spoluprace/${match.id}`} className="mt-4 w-full">
                  Otevřít spolupráci
                </ButtonLink>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm leading-relaxed text-ink-600">
                  Kontakt se odemyká po zadání poptávky a přijetí nabídky. Tím máte jistotu, že
                  má{" "}
                  {cleaner.user.firstName} volno právě na to, co potřebujete.
                </p>
                <ButtonLink href="/poptavky/nova" className="mt-4 w-full">
                  Zadat poptávku
                </ButtonLink>
                {!viewer && (
                  <ButtonLink href="/registrace" variant="outline" className="mt-2 w-full">
                    Vytvořit účet
                  </ButtonLink>
                )}
              </>
            )}
          </Card>

          <Card className="p-5 text-sm text-ink-600">
            <p className="font-medium text-ink-900">Na platformě od</p>
            <p className="mt-1">{formatDate(cleaner.user.createdAt)}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
