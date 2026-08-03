import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMatchDetail } from "@/lib/queries/matches";
import { hasActiveSubscription } from "@/lib/subscription";
import { addDays, getFreeSlots } from "@/lib/availability";
import { Alert, Avatar, Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { formatCzk, formatDate, formatDateTime } from "@/lib/format";
import {
  BOOKING_STATUS_LABELS,
  SERVICE_LABELS,
  type BookingStatus,
  type Service,
} from "@/lib/constants";
import { FLAGS } from "@/lib/fees";
import { Chat } from "./chat";
import { BookingForm } from "./booking-form";

export const metadata = { title: "Spolupráce" };
export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ propojeno?: string }>;
}) {
  const [{ id }, { propojeno }, user] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
  ]);

  const detail = await getMatchDetail(id, user!);
  if (!detail) notFound();

  const { match, client, cleaner, isClient } = detail;
  const other = isClient ? cleaner.user : client;

  // Sloty načítáme jen klientovi – uklízečka si kalendář spravuje jinde.
  const [subscribed, slots] = await Promise.all([
    isClient ? hasActiveSubscription(user!.id) : Promise.resolve(true),
    isClient
      ? getFreeSlots(match.cleanerId, new Date(), addDays(new Date(), 21), 120)
      : Promise.resolve([]),
  ]);

  const canBook = !FLAGS.REQUIRE_SUBSCRIPTION_FOR_BOOKING || subscribed;

  return (
    <>
      {propojeno && (
        <div className="mb-6">
          <Alert tone="success">
            Hotovo — jste propojeni. Níže najdete kontakt, chat a možnost naplánovat termín.
          </Alert>
        </div>
      )}

      <PageHeader
        title={`${other.firstName} ${other.lastName}`}
        description={match.jobRequest.title}
        action={
          <ButtonLink href="/dashboard/spoluprace" variant="outline" size="sm">
            Zpět na přehled
          </ButtonLink>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Chat
            conversationId={match.conversation!.id}
            messages={match.conversation!.messages}
            currentUserId={user!.id}
          />

          <Card className="p-6">
            <h2 className="font-semibold text-ink-900">Rezervace</h2>

            {match.bookings.length === 0 ? (
              <p className="mt-2 text-sm text-ink-600">Zatím žádné naplánované termíny.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {match.bookings.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-100 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-ink-900">{formatDateTime(booking.start)}</p>
                      <p className="text-sm text-ink-600">
                        {SERVICE_LABELS[booking.service as Service]}
                        {booking.priceTotal ? ` · ${formatCzk(booking.priceTotal)}` : ""}
                      </p>
                    </div>
                    <Badge
                      tone={
                        booking.status === "CONFIRMED"
                          ? "success"
                          : booking.status === "COMPLETED"
                            ? "neutral"
                            : booking.status.startsWith("CANCELLED")
                              ? "danger"
                              : "warning"
                      }
                    >
                      {BOOKING_STATUS_LABELS[booking.status as BookingStatus]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}

            <ButtonLink
              href="/dashboard/rezervace"
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Spravovat rezervace
            </ButtonLink>
          </Card>

          {isClient && (
            <>
              {canBook ? (
                <BookingForm
                  cleanerId={match.cleanerId}
                  cleanerName={cleaner.user.firstName}
                  services={cleaner.services.map((s) => s.service as Service)}
                  slots={slots.map((s) => ({
                    start: s.start.toISOString(),
                    label: `${formatDate(s.start)} · ${formatDateTime(s.start).split(" ").pop()}`,
                  }))}
                  defaultAddress={
                    match.jobRequest.street
                      ? `${match.jobRequest.street}, ${match.jobRequest.city}`
                      : match.jobRequest.city
                  }
                />
              ) : (
                <Card className="p-6">
                  <h2 className="font-semibold text-ink-900">Plánování termínů</h2>
                  <p className="mt-2 text-sm text-ink-600">
                    Kalendář a objednávání na konkrétní den a hodinu jsou součástí předplatného
                    Plánovač za 99 Kč měsíčně. Kontakt a chat máte samozřejmě i bez něj.
                  </p>
                  <ButtonLink href="/dashboard/predplatne" className="mt-4">
                    Aktivovat předplatné
                  </ButtonLink>
                </Card>
              )}
            </>
          )}
        </div>

        {/* -------------------------------------------------------- kontakt */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Avatar firstName={other.firstName} lastName={other.lastName} />
              <div>
                <p className="font-semibold text-ink-900">
                  {other.firstName} {other.lastName}
                </p>
                <p className="text-sm text-ink-500">{isClient ? "Poskytovatel" : "Klient"}</p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-ink-500">Telefon</dt>
                <dd className="mt-0.5">
                  {other.phone ? (
                    <a href={`tel:${other.phone}`} className="font-medium text-ink-900 hover:underline">
                      {other.phone}
                    </a>
                  ) : (
                    <span className="text-ink-500">neuvedeno</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">E-mail</dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${other.email}`}
                    className="font-medium text-ink-900 hover:underline"
                  >
                    {other.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">Adresa úklidu</dt>
                <dd className="mt-0.5 font-medium text-ink-900">
                  {match.jobRequest.street
                    ? `${match.jobRequest.street}, ${match.jobRequest.city}`
                    : match.jobRequest.city}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">Propojeno</dt>
                <dd className="mt-0.5 font-medium text-ink-900">{formatDate(match.createdAt)}</dd>
              </div>
            </dl>

            {isClient && (
              <Link
                href={`/uklizecky/${cleaner.id}`}
                className="mt-5 block text-sm font-medium text-ink-700 hover:text-ink-900"
              >
                Zobrazit veřejný profil →
              </Link>
            )}
          </Card>

          <Card className="p-5 text-sm text-ink-600">
            <p className="font-medium text-ink-900">Platba za úklid</p>
            <p className="mt-1.5">
              Za samotný úklid se domlouváte přímo mezi sebou – Uklidno si z ceny nebere nic.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
