import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { addDays, getFreeSlots } from "@/lib/availability";
import { formatDate, formatTime } from "@/lib/format";
import { AvailabilityForm } from "./availability-form";
import { DaysOff } from "./days-off";

export const metadata = { title: "Kalendář dostupnosti" };
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = (await getCurrentUser())!;
  if (user.role !== "CLEANER" || !user.cleanerProfileId) redirect("/dashboard");

  const [availability, exceptions, slots] = await Promise.all([
    prisma.availability.findMany({
      where: { cleanerId: user.cleanerProfileId },
      orderBy: { weekday: "asc" },
    }),
    prisma.availabilityException.findMany({
      where: { cleanerId: user.cleanerProfileId, date: { gte: new Date() } },
      orderBy: { date: "asc" },
    }),
    getFreeSlots(user.cleanerProfileId, new Date(), addDays(new Date(), 14)),
  ]);

  // Náhled volných termínů seskupený po dnech – přesně to, co uvidí klient.
  const byDay = new Map<string, typeof slots>();
  for (const slot of slots) {
    const key = slot.start.toDateString();
    byDay.set(key, [...(byDay.get(key) ?? []), slot]);
  }

  return (
    <>
      <PageHeader
        title="Kalendář dostupnosti"
        description="Nastavte, kdy pracujete. Mimo tuto dobu vás klienti nemohou objednat."
      />

      <div className="space-y-6">
        <AvailabilityForm availability={availability} />

        <DaysOff exceptions={exceptions} />

        <Card className="p-6">
          <h2 className="font-semibold text-ink-900">Volné termíny na dva týdny dopředu</h2>
          <p className="mt-1 text-sm text-ink-600">
            Takhle vidí váš kalendář klienti. Obsazené a už zarezervované časy tu nejsou.
          </p>

          {byDay.size === 0 ? (
            <p className="mt-4 text-sm text-ink-600">
              Zatím tu nic není – doplňte dostupnost výše.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {[...byDay.entries()].slice(0, 10).map(([key, daySlots]) => (
                <li key={key}>
                  <p className="text-sm font-medium text-ink-900">
                    {formatDate(daySlots[0].start)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {daySlots.map((slot) => (
                      <span
                        key={slot.start.toISOString()}
                        className="rounded-lg bg-ink-50 px-2.5 py-1 text-sm text-ink-700"
                      >
                        {formatTime(slot.start)}–{formatTime(slot.end)}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
