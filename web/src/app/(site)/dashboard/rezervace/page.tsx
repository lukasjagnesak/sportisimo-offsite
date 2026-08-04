import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatCzk, formatDate, formatTime } from "@/lib/format";
import {
  BOOKING_STATUS_LABELS,
  SERVICE_LABELS,
  type BookingStatus,
  type Service,
} from "@/lib/constants";
import {
  cancelBookingAction,
  completeBookingAction,
  respondToBookingAction,
} from "@/lib/actions/bookings";
import { ReviewForm } from "./review-form";

export const metadata = { title: "Rezervace" };
export const dynamic = "force-dynamic";

function statusTone(status: string) {
  if (status === "CONFIRMED") return "success" as const;
  if (status === "COMPLETED") return "neutral" as const;
  if (status === "REQUESTED") return "warning" as const;
  return "danger" as const;
}

export default async function BookingsPage() {
  const user = await requirePageUser();
  const isCleaner = user.role === "CLEANER";

  const bookings = await prisma.booking.findMany({
    where: isCleaner ? { cleanerId: user.cleanerProfileId! } : { clientId: user.id },
    orderBy: { start: "desc" },
    take: 60,
    include: { reviews: { select: { authorId: true } } },
  });

  // Protistrany načteme hromadně kvůli jménům v seznamu.
  const [clients, cleaners] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: bookings.map((b) => b.clientId) } },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.cleanerProfile.findMany({
      where: { id: { in: bookings.map((b) => b.cleanerId) } },
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
  ]);
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const cleanerById = new Map(cleaners.map((c) => [c.id, c]));

  const now = new Date();
  const upcoming = bookings.filter((b) => b.start >= now && !b.status.startsWith("CANCELLED"));
  const past = bookings.filter((b) => b.start < now || b.status.startsWith("CANCELLED"));

  function renderBooking(booking: (typeof bookings)[number]) {
    const other = isCleaner
      ? clientById.get(booking.clientId)
      : cleanerById.get(booking.cleanerId)?.user;
    const alreadyReviewed = booking.reviews.some((r) => r.authorId === user.id);
    const canReview = booking.status === "COMPLETED" && !alreadyReviewed;
    const canComplete = isCleaner && booking.status === "CONFIRMED" && booking.end < now;
    const canCancel = ["REQUESTED", "CONFIRMED"].includes(booking.status) && booking.start > now;

    return (
      <li key={booking.id}>
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-ink-900">
                {formatDate(booking.start)} · {formatTime(booking.start)}–
                {formatTime(booking.end)}
              </p>
              <p className="mt-1 text-sm text-ink-600">
                {SERVICE_LABELS[booking.service as Service]}
                {other ? ` · ${other.firstName} ${other.lastName}` : ""}
                {booking.priceTotal ? ` · ${formatCzk(booking.priceTotal)}` : ""}
              </p>
              {booking.address && (
                <p className="mt-1 text-sm text-ink-500">{booking.address}</p>
              )}
              {booking.note && (
                <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700">
                  {booking.note}
                </p>
              )}
            </div>
            <Badge tone={statusTone(booking.status)}>
              {BOOKING_STATUS_LABELS[booking.status as BookingStatus]}
            </Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {isCleaner && booking.status === "REQUESTED" && (
              <>
                <form action={respondToBookingAction}>
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <input type="hidden" name="decision" value="confirm" />
                  <button
                    type="submit"
                    className="rounded-lg bg-ink-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-800"
                  >
                    Potvrdit termín
                  </button>
                </form>
                <form action={respondToBookingAction}>
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <input type="hidden" name="decision" value="decline" />
                  <button
                    type="submit"
                    className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
                  >
                    Odmítnout
                  </button>
                </form>
              </>
            )}

            {canComplete && (
              <form action={completeBookingAction}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-ink-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-ink-800"
                >
                  Označit jako dokončené
                </button>
              </form>
            )}

            {canCancel && (
              <form action={cancelBookingAction}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm text-ink-600 hover:border-red-200 hover:text-red-700"
                >
                  Zrušit
                </button>
              </form>
            )}
          </div>

          {canReview && <ReviewForm bookingId={booking.id} />}
        </Card>
      </li>
    );
  }

  return (
    <>
      <PageHeader
        title="Rezervace"
        description={
          isCleaner
            ? "Potvrzujte termíny, uzavírejte hotové zakázky a sbírejte hodnocení."
            : "Přehled naplánovaných i proběhlých úklidů."
        }
      />

      <section>
        <h2 className="mb-3 font-semibold text-ink-900">Nadcházející</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title="Nic naplánovaného"
            description={
              isCleaner
                ? "Jakmile vás klient objedná, uvidíte žádost tady."
                : "Termín si vyberete v detailu spolupráce."
            }
          />
        ) : (
          <ul className="space-y-4">{upcoming.map(renderBooking)}</ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-semibold text-ink-900">Historie</h2>
          <ul className="space-y-4">{past.map(renderBooking)}</ul>
        </section>
      )}
    </>
  );
}
