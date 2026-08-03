import { prisma } from "./prisma";

/**
 * Práce s kalendářem uklízečky.
 *
 * Časy dostupnosti se ukládají jako minuty od půlnoci v lokálním čase
 * (Europe/Prague). Aplikace proto musí běžet s TZ=Europe/Prague – viz README.
 * Až přibude více zemí, přesune se časové pásmo na profil uklízečky.
 */

/** Minimální předstih rezervace v hodinách – nikdo nechce objednávku na „za 10 minut“. */
export const BOOKING_LEAD_HOURS = 12;

/** Jak daleko dopředu smí klient plánovat. */
export const BOOKING_HORIZON_DAYS = 60;

export type Slot = { start: Date; end: Date };

export function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** ISO číslo dne: 1 = pondělí … 7 = neděle. */
export function isoWeekday(d: Date) {
  const day = d.getDay();
  return day === 0 ? 7 : day;
}

function atMinutes(day: Date, minutes: number) {
  const d = startOfDay(day);
  d.setMinutes(minutes);
  return d;
}

function overlaps(a: Slot, b: Slot) {
  return a.start < b.end && b.start < a.end;
}

/** Rezervace, které blokují kalendář (odmítnuté a zrušené ne). */
const BLOCKING_STATUSES = ["REQUESTED", "CONFIRMED", "COMPLETED"];

export async function getFreeSlots(
  cleanerId: string,
  from: Date,
  to: Date,
  durationMinutes = 120,
): Promise<Slot[]> {
  const rangeStart = startOfDay(from);
  const rangeEnd = addDays(startOfDay(to), 1);

  const [recurring, exceptions, bookings] = await Promise.all([
    prisma.availability.findMany({ where: { cleanerId } }),
    prisma.availabilityException.findMany({
      where: { cleanerId, date: { gte: rangeStart, lt: rangeEnd } },
    }),
    prisma.booking.findMany({
      where: {
        cleanerId,
        status: { in: BLOCKING_STATUSES },
        start: { lt: rangeEnd },
        end: { gt: rangeStart },
      },
      select: { start: true, end: true },
    }),
  ]);

  const exceptionsByDay = new Map<string, typeof exceptions>();
  for (const ex of exceptions) {
    const key = startOfDay(ex.date).toDateString();
    exceptionsByDay.set(key, [...(exceptionsByDay.get(key) ?? []), ex]);
  }

  const earliest = new Date(Date.now() + BOOKING_LEAD_HOURS * 3600 * 1000);
  const slots: Slot[] = [];

  for (let day = rangeStart; day < rangeEnd; day = addDays(day, 1)) {
    const dayExceptions = exceptionsByDay.get(day.toDateString()) ?? [];

    // Celodenní blokace (dovolená) přebije všechno ostatní.
    if (dayExceptions.some((e) => e.blocked && e.startMin === null)) continue;

    const extra = dayExceptions.filter((e) => !e.blocked && e.startMin !== null);
    const windows = extra.length
      ? extra.map((e) => ({ startMin: e.startMin!, endMin: e.endMin! }))
      : recurring
          .filter((r) => r.weekday === isoWeekday(day))
          .map((r) => ({ startMin: r.startMin, endMin: r.endMin }));

    // Částečné blokace v rámci dne (např. návštěva lékaře 9–11).
    const blockedWindows = dayExceptions
      .filter((e) => e.blocked && e.startMin !== null)
      .map((e) => ({ start: atMinutes(day, e.startMin!), end: atMinutes(day, e.endMin!) }));

    for (const window of windows) {
      for (
        let min = window.startMin;
        min + durationMinutes <= window.endMin;
        min += durationMinutes
      ) {
        const slot = { start: atMinutes(day, min), end: atMinutes(day, min + durationMinutes) };
        if (slot.start < earliest) continue;
        if (bookings.some((b) => overlaps(slot, b))) continue;
        if (blockedWindows.some((b) => overlaps(slot, b))) continue;
        slots.push(slot);
      }
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Ověří, že termín leží v dostupnosti a nekoliduje s jinou rezervací.
 * Volá se před vytvořením rezervace – UI nabízí jen volné sloty, ale API
 * nesmí věřit tomu, co přijde od klienta.
 */
export async function isSlotBookable(
  cleanerId: string,
  start: Date,
  end: Date,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (end <= start) return { ok: false, reason: "Konec musí být po začátku." };

  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  if (durationMinutes < 60) return { ok: false, reason: "Minimální délka úklidu je 1 hodina." };
  if (durationMinutes > 12 * 60) return { ok: false, reason: "Maximální délka úklidu je 12 hodin." };

  if (start < new Date(Date.now() + BOOKING_LEAD_HOURS * 3600 * 1000)) {
    return {
      ok: false,
      reason: `Rezervaci lze vytvořit nejdříve ${BOOKING_LEAD_HOURS} hodin předem.`,
    };
  }
  if (start > addDays(new Date(), BOOKING_HORIZON_DAYS)) {
    return { ok: false, reason: `Plánovat lze nejdále ${BOOKING_HORIZON_DAYS} dní dopředu.` };
  }

  const conflict = await prisma.booking.findFirst({
    where: {
      cleanerId,
      status: { in: BLOCKING_STATUSES },
      start: { lt: end },
      end: { gt: start },
    },
  });
  if (conflict) return { ok: false, reason: "Tento termín je už obsazený." };

  const slots = await getFreeSlots(cleanerId, start, start, durationMinutes);
  const fits = slots.some((s) => s.start <= start && s.end >= end);

  // Sloty se generují po `durationMinutes` od začátku okna; termín zvolený
  // klientem se s takovou mřížkou nemusí trefit, tak ověříme okno napřímo.
  if (!fits) {
    const dayAvailability = await prisma.availability.findMany({
      where: { cleanerId, weekday: isoWeekday(start) },
    });
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = startMin + durationMinutes;
    const inWindow = dayAvailability.some((a) => a.startMin <= startMin && a.endMin >= endMin);
    if (!inWindow) {
      return { ok: false, reason: "V tomto čase uklízečka nepracuje." };
    }

    const blocked = await prisma.availabilityException.findFirst({
      where: {
        cleanerId,
        blocked: true,
        date: { gte: startOfDay(start), lt: addDays(startOfDay(start), 1) },
      },
    });
    if (blocked) return { ok: false, reason: "V tento den má uklízečka volno." };
  }

  return { ok: true };
}
