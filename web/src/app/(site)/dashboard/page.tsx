import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSubscription } from "@/lib/subscription";
import { Alert, Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatCzk, formatDateTime, timeAgo } from "@/lib/format";
import {
  BOOKING_STATUS_LABELS,
  SERVICE_LABELS,
  type BookingStatus,
  type Service,
} from "@/lib/constants";
import { markNotificationsReadAction } from "@/lib/actions/profile";
import { FLAGS } from "@/lib/fees";

export const metadata = { title: "Přehled" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  const isCleaner = user.role === "CLEANER";

  const [notifications, subscription, upcoming, stats] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    getActiveSubscription(user.id),
    prisma.booking.findMany({
      where: {
        ...(isCleaner ? { cleanerId: user.cleanerProfileId! } : { clientId: user.id }),
        status: { in: ["REQUESTED", "CONFIRMED"] },
        start: { gte: new Date() },
      },
      orderBy: { start: "asc" },
      take: 4,
    }),
    isCleaner
      ? Promise.all([
          prisma.offer.count({ where: { cleanerId: user.cleanerProfileId!, status: "PENDING" } }),
          prisma.match.count({ where: { cleanerId: user.cleanerProfileId!, status: "ACTIVE" } }),
          prisma.jobRequest.count({ where: { status: "OPEN" } }),
        ])
      : Promise.all([
          prisma.jobRequest.count({ where: { clientId: user.id, status: "OPEN" } }),
          prisma.match.count({ where: { clientId: user.id, status: "ACTIVE" } }),
          prisma.offer.count({
            where: { jobRequest: { clientId: user.id }, status: "PENDING" },
          }),
        ]),
  ]);

  const unread = notifications.filter((n) => !n.readAt).length;

  const tiles = isCleaner
    ? [
        { label: "Čekající nabídky", value: stats[0], href: "/dashboard/nabidky" },
        { label: "Aktivní spolupráce", value: stats[1], href: "/dashboard/spoluprace" },
        { label: "Otevřené poptávky", value: stats[2], href: "/poptavky" },
      ]
    : [
        { label: "Otevřené poptávky", value: stats[0], href: "/dashboard/poptavky" },
        { label: "Aktivní spolupráce", value: stats[1], href: "/dashboard/spoluprace" },
        { label: "Nové nabídky", value: stats[2], href: "/dashboard/poptavky" },
      ];

  return (
    <>
      <PageHeader
        title={`Dobrý den, ${user.firstName}`}
        description={
          isCleaner
            ? "Přehled vašich nabídek, zakázek a termínů."
            : "Přehled poptávek, spoluprací a naplánovaných úklidů."
        }
        action={
          isCleaner ? (
            <ButtonLink href="/poptavky">Procházet poptávky</ButtonLink>
          ) : (
            <ButtonLink href="/poptavky/nova">Nová poptávka</ButtonLink>
          )
        }
      />

      {!isCleaner && !subscription && FLAGS.REQUIRE_SUBSCRIPTION_FOR_BOOKING && (
        <div className="mb-6">
          <Alert tone="info">
            Chcete plánovat úklidy v kalendáři?{" "}
            <Link href="/dashboard/predplatne" className="font-medium underline">
              Aktivujte předplatné Plánovač
            </Link>{" "}
            za 99 Kč měsíčně.
          </Alert>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href}>
            <Card className="p-5 transition hover:border-ink-300">
              <p className="text-sm text-ink-500">{tile.label}</p>
              <p className="mt-1 text-3xl font-semibold text-ink-900">{tile.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-semibold text-ink-900">Nejbližší termíny</h2>
          {upcoming.length === 0 ? (
            <EmptyState
              title="Žádné naplánované termíny"
              description={
                isCleaner
                  ? "Jakmile vás klient objedná, uvidíte termín tady."
                  : "Po propojení s uklízečkou si můžete v kalendáři vybrat konkrétní den a hodinu."
              }
            />
          ) : (
            <ul className="space-y-3">
              {upcoming.map((booking) => (
                <li key={booking.id}>
                  <Card className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-medium text-ink-900">
                        {formatDateTime(booking.start)}
                      </p>
                      <p className="text-sm text-ink-600">
                        {SERVICE_LABELS[booking.service as Service]}
                        {booking.priceTotal ? ` · ${formatCzk(booking.priceTotal)}` : ""}
                      </p>
                    </div>
                    <Badge tone={booking.status === "CONFIRMED" ? "success" : "warning"}>
                      {BOOKING_STATUS_LABELS[booking.status as BookingStatus]}
                    </Badge>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">
              Novinky {unread > 0 && <Badge tone="accent">{unread} nové</Badge>}
            </h2>
            {unread > 0 && (
              <form action={markNotificationsReadAction}>
                <button type="submit" className="text-sm text-ink-600 hover:text-ink-900">
                  Označit jako přečtené
                </button>
              </form>
            )}
          </div>

          {notifications.length === 0 ? (
            <EmptyState title="Zatím nic nového" description="Tady se objeví reakce a změny." />
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link href={n.href ?? "/dashboard"}>
                    <Card
                      className={`p-4 transition hover:border-ink-300 ${
                        n.readAt ? "" : "border-l-4 border-l-sand-500"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-medium text-ink-900">{n.title}</p>
                        <span className="shrink-0 text-xs text-ink-500">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      {n.body && <p className="mt-1 text-sm text-ink-600">{n.body}</p>}
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
