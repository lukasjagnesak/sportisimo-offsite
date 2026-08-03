"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { AuthError, requireCleaner, requireUser } from "../auth";
import { availabilitySchema, bookingSchema, fieldErrors, reviewSchema } from "../validation";
import { formToObject, type ActionState } from "./types";
import { isSlotBookable } from "../availability";
import { hasActiveSubscription } from "../subscription";
import { FLAGS } from "../fees";
import { SERVICE_LABELS, type Service } from "../constants";
import { formatDateTime } from "../format";

function toActionState(e: unknown): ActionState {
  if (e instanceof AuthError) return { ok: false, error: e.message };
  throw e;
}

export async function requestBookingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireUser("CLIENT");
    const parsed = bookingSchema.safeParse(formToObject(formData));
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

    const { cleanerId, start, durationMinutes, service, address, note } = parsed.data;

    if (FLAGS.REQUIRE_SUBSCRIPTION_FOR_BOOKING && !(await hasActiveSubscription(user.id))) {
      return {
        ok: false,
        error: "Plánování v kalendáři je součástí předplatného Plánovač.",
      };
    }

    // Rezervovat lze jen u uklízečky, se kterou už klienta pojí propojení.
    const match = await prisma.match.findFirst({
      where: { clientId: user.id, cleanerId, status: "ACTIVE" },
    });
    if (!match) {
      return {
        ok: false,
        error: "S touto uklízečkou zatím nejste propojeni. Vyberte ji nejdřív u poptávky.",
      };
    }

    const end = new Date(start.getTime() + durationMinutes * 60000);
    const check = await isSlotBookable(cleanerId, start, end);
    if (!check.ok) return { ok: false, error: check.reason };

    const cleanerProfile = await prisma.cleanerProfile.findUnique({
      where: { id: cleanerId },
      select: { userId: true, hourlyRate: true },
    });
    if (!cleanerProfile) return { ok: false, error: "Uklízečka nenalezena." };

    await prisma.booking.create({
      data: {
        matchId: match.id,
        clientId: user.id,
        cleanerId,
        start,
        end,
        service,
        address: address || null,
        note: note || null,
        priceTotal: Math.round((cleanerProfile.hourlyRate * durationMinutes) / 60),
      },
    });

    await prisma.notification.create({
      data: {
        userId: cleanerProfile.userId,
        type: "BOOKING_REQUESTED",
        title: "Nová žádost o termín",
        body: `${user.firstName} ${user.lastName} – ${SERVICE_LABELS[service as Service]}, ${formatDateTime(start)}.`,
        href: "/dashboard/rezervace",
      },
    });
  } catch (e) {
    return toActionState(e);
  }

  revalidatePath("/dashboard/rezervace");
  return { ok: true, message: "Žádost odeslána, uklízečka ji potvrdí." };
}

/** Potvrzení / odmítnutí ze strany uklízečky. */
export async function respondToBookingAction(formData: FormData): Promise<void> {
  const cleaner = await requireCleaner();
  const id = String(formData.get("bookingId"));
  const decision = String(formData.get("decision"));
  const status = decision === "confirm" ? "CONFIRMED" : "DECLINED";

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.cleanerId !== cleaner.cleanerProfileId) return;
  if (booking.status !== "REQUESTED") return;

  await prisma.booking.update({ where: { id }, data: { status } });

  await prisma.notification.create({
    data: {
      userId: booking.clientId,
      type: "BOOKING_CONFIRMED",
      title: status === "CONFIRMED" ? "Termín potvrzen" : "Termín odmítnut",
      body: `${formatDateTime(booking.start)} – ${cleaner.firstName} ${cleaner.lastName}`,
      href: "/dashboard/rezervace",
    },
  });

  revalidatePath("/dashboard/rezervace");
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  const user = await requireUser(["CLIENT", "CLEANER"]);
  const id = String(formData.get("bookingId"));

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return;

  const isClient = booking.clientId === user.id;
  const isCleaner = user.cleanerProfileId === booking.cleanerId;
  if (!isClient && !isCleaner) return;
  if (["COMPLETED", "DECLINED"].includes(booking.status)) return;

  await prisma.booking.update({
    where: { id },
    data: { status: isClient ? "CANCELLED_BY_CLIENT" : "CANCELLED_BY_CLEANER" },
  });

  revalidatePath("/dashboard/rezervace");
}

/** Uzavření zakázky uklízečkou – odemkne klientovi možnost hodnotit. */
export async function completeBookingAction(formData: FormData): Promise<void> {
  const cleaner = await requireCleaner();
  const id = String(formData.get("bookingId"));

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.cleanerId !== cleaner.cleanerProfileId) return;
  if (booking.status !== "CONFIRMED" || booking.end > new Date()) return;

  await prisma.$transaction([
    prisma.booking.update({ where: { id }, data: { status: "COMPLETED" } }),
    prisma.cleanerProfile.update({
      where: { id: cleaner.cleanerProfileId },
      data: { completedJobs: { increment: 1 } },
    }),
    prisma.notification.create({
      data: {
        userId: booking.clientId,
        type: "REVIEW_RECEIVED",
        title: "Jak jste byli spokojeni?",
        body: "Ohodnoťte poslední úklid – pomůžete tím ostatním klientům.",
        href: "/dashboard/rezervace",
      },
    }),
  ]);

  revalidatePath("/dashboard/rezervace");
}

export async function saveAvailabilityAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const cleaner = await requireCleaner();

    // Formulář posílá pro každý den dvojici od/do; prázdný den = volno.
    const blocks: { weekday: number; startMin: number; endMin: number }[] = [];
    for (let weekday = 1; weekday <= 7; weekday++) {
      const from = formData.get(`from_${weekday}`);
      const to = formData.get(`to_${weekday}`);
      if (!from || !to) continue;

      const [fh, fm] = String(from).split(":").map(Number);
      const [th, tm] = String(to).split(":").map(Number);
      const startMin = fh * 60 + fm;
      const endMin = th * 60 + tm;
      if (endMin <= startMin) {
        return { ok: false, error: "Konec směny musí být po jejím začátku." };
      }
      blocks.push({ weekday, startMin, endMin });
    }

    const parsed = availabilitySchema.safeParse({ blocks });
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

    await prisma.$transaction([
      prisma.availability.deleteMany({ where: { cleanerId: cleaner.cleanerProfileId } }),
      prisma.availability.createMany({
        data: parsed.data.blocks.map((b) => ({ ...b, cleanerId: cleaner.cleanerProfileId })),
      }),
    ]);
  } catch (e) {
    return toActionState(e);
  }

  revalidatePath("/dashboard/kalendar");
  return { ok: true, message: "Dostupnost uložena." };
}

export async function addDayOffAction(formData: FormData): Promise<void> {
  const cleaner = await requireCleaner();
  const dateValue = formData.get("date");
  if (!dateValue) return;

  const date = new Date(String(dateValue));
  date.setHours(0, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return;

  await prisma.availabilityException.create({
    data: {
      cleanerId: cleaner.cleanerProfileId,
      date,
      blocked: true,
      note: String(formData.get("note") ?? "") || null,
    },
  });

  revalidatePath("/dashboard/kalendar");
}

export async function removeDayOffAction(formData: FormData): Promise<void> {
  const cleaner = await requireCleaner();
  await prisma.availabilityException.deleteMany({
    where: { id: String(formData.get("exceptionId")), cleanerId: cleaner.cleanerProfileId },
  });
  revalidatePath("/dashboard/kalendar");
}

export async function createReviewAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireUser(["CLIENT", "CLEANER"]);
    const parsed = reviewSchema.safeParse(formToObject(formData));
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

    const { bookingId, comment, ...scores } = parsed.data;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return { ok: false, error: "Rezervace nenalezena." };
    if (booking.status !== "COMPLETED") {
      return { ok: false, error: "Hodnotit lze až dokončený úklid." };
    }

    const isClient = booking.clientId === user.id;
    const isCleaner = user.cleanerProfileId === booking.cleanerId;
    if (!isClient && !isCleaner) return { ok: false, error: "K této rezervaci nemáte přístup." };

    // Protistrana: klient hodnotí uklízečku a naopak.
    let targetId: string;
    if (isClient) {
      const profile = await prisma.cleanerProfile.findUnique({
        where: { id: booking.cleanerId },
        select: { userId: true },
      });
      if (!profile) return { ok: false, error: "Protistrana nenalezena." };
      targetId = profile.userId;
    } else {
      targetId = booking.clientId;
    }

    const existing = await prisma.review.findUnique({
      where: { bookingId_authorId: { bookingId, authorId: user.id } },
    });
    if (existing) return { ok: false, error: "Tuto návštěvu jste už hodnotili." };

    await prisma.review.create({
      data: { bookingId, authorId: user.id, targetId, comment: comment || null, ...scores },
    });

    // Průměr držíme denormalizovaně na profilu kvůli řazení ve výpisu.
    if (isClient) {
      const stats = await prisma.review.aggregate({
        where: { targetId },
        _avg: { rating: true },
        _count: true,
      });
      await prisma.cleanerProfile.update({
        where: { id: booking.cleanerId },
        data: { ratingAvg: stats._avg.rating ?? 0, ratingCount: stats._count },
      });
    }

    await prisma.notification.create({
      data: {
        userId: targetId,
        type: "REVIEW_RECEIVED",
        title: "Máte nové hodnocení",
        body: `${scores.rating} z 5 hvězdiček od ${user.firstName} ${user.lastName}.`,
        href: "/dashboard",
      },
    });
  } catch (e) {
    return toActionState(e);
  }

  revalidatePath("/dashboard/rezervace");
  revalidatePath("/uklizecky");
  return { ok: true, message: "Děkujeme za hodnocení." };
}
