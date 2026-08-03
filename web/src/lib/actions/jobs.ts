"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";
import { AuthError, requireCleaner, requireUser } from "../auth";
import { fieldErrors, jobRequestSchema, offerSchema } from "../validation";
import { formToObject, type ActionState } from "./types";
import { chargeUser } from "../payments";
import { FEES, FLAGS } from "../fees";

function toActionState(e: unknown): ActionState {
  if (e instanceof AuthError) return { ok: false, error: e.message };
  throw e;
}

export async function createJobRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let jobId: string;
  try {
    const user = await requireUser("CLIENT");
    const raw = formToObject(formData);
    const parsed = jobRequestSchema.safeParse({
      ...raw,
      services: raw.services ? (Array.isArray(raw.services) ? raw.services : [raw.services]) : [],
    });

    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

    const { services, budgetPerHour, ...data } = parsed.data;

    const job = await prisma.jobRequest.create({
      data: {
        ...data,
        clientId: user.id,
        postalCode: data.postalCode || null,
        street: data.street || null,
        note: data.note || null,
        // Formulář pracuje v korunách, databáze v haléřích.
        budgetPerHour: budgetPerHour ? budgetPerHour * 100 : null,
        services: { create: services.map((service) => ({ service })) },
      },
    });
    jobId = job.id;
  } catch (e) {
    return toActionState(e);
  }

  revalidatePath("/poptavky");
  redirect(`/poptavky/${jobId}?nova=1`);
}

export async function cancelJobRequestAction(formData: FormData): Promise<void> {
  const user = await requireUser("CLIENT");
  const id = String(formData.get("jobRequestId"));

  await prisma.jobRequest.updateMany({
    where: { id, clientId: user.id, status: "OPEN" },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/dashboard/poptavky");
  revalidatePath(`/poptavky/${id}`);
}

export async function createOfferAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const cleaner = await requireCleaner();
    const parsed = offerSchema.safeParse(formToObject(formData));
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

    const { jobRequestId, message, pricePerHour, availableFrom } = parsed.data;

    const job = await prisma.jobRequest.findUnique({ where: { id: jobRequestId } });
    if (!job || job.status !== "OPEN") {
      return { ok: false, error: "Tato poptávka už není otevřená." };
    }

    const duplicate = await prisma.offer.findUnique({
      where: {
        jobRequestId_cleanerId: { jobRequestId, cleanerId: cleaner.cleanerProfileId },
      },
    });
    if (duplicate) {
      return { ok: false, error: "Na tuto poptávku jste už reagoval(a)." };
    }

    await prisma.offer.create({
      data: {
        jobRequestId,
        cleanerId: cleaner.cleanerProfileId,
        message,
        pricePerHour: pricePerHour * 100,
        availableFrom,
      },
    });

    await prisma.notification.create({
      data: {
        userId: job.clientId,
        type: "NEW_OFFER",
        title: "Nová nabídka na vaši poptávku",
        body: `${cleaner.firstName} ${cleaner.lastName} reagoval(a) na „${job.title}“.`,
        href: `/poptavky/${job.id}`,
      },
    });
  } catch (e) {
    return toActionState(e);
  }

  revalidatePath("/poptavky");
  return { ok: true, message: "Nabídka odeslána. Klient vám dá vědět." };
}

export async function withdrawOfferAction(formData: FormData): Promise<void> {
  const cleaner = await requireCleaner();
  const id = String(formData.get("offerId"));

  await prisma.offer.updateMany({
    where: { id, cleanerId: cleaner.cleanerProfileId, status: "PENDING" },
    data: { status: "WITHDRAWN" },
  });

  revalidatePath("/dashboard/nabidky");
}

export async function rejectOfferAction(formData: FormData): Promise<void> {
  const user = await requireUser("CLIENT");
  const id = String(formData.get("offerId"));

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { jobRequest: true },
  });
  if (!offer || offer.jobRequest.clientId !== user.id) return;

  await prisma.offer.update({ where: { id }, data: { status: "REJECTED" } });
  revalidatePath(`/poptavky/${offer.jobRequestId}`);
}

/**
 * Přijetí nabídky = okamžik zpeněžení. Klient zaplatí zprostředkovatelský
 * poplatek a teprve pak se odemknou kontaktní údaje obou stran.
 *
 * Ve fázi 2 (FLAGS.CLEANER_FEE_ENABLED) se stejný krok účtuje i uklízečce.
 */
export async function acceptOfferAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let matchId: string;

  try {
    const user = await requireUser("CLIENT");
    const offerId = String(formData.get("offerId"));

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        jobRequest: true,
        // cleanerId je CleanerProfile.id – uživatele dohledáme zvlášť.
      },
    });

    if (!offer || offer.jobRequest.clientId !== user.id) {
      return { ok: false, error: "Nabídka nenalezena." };
    }
    if (offer.status !== "PENDING") {
      return { ok: false, error: "Tato nabídka už není aktuální." };
    }
    if (offer.jobRequest.status !== "OPEN") {
      return { ok: false, error: "Poptávka už byla uzavřena." };
    }

    const cleanerProfile = await prisma.cleanerProfile.findUnique({
      where: { id: offer.cleanerId },
      include: { user: true },
    });
    if (!cleanerProfile) return { ok: false, error: "Profil uklízečky nenalezen." };

    const cleanerName = `${cleanerProfile.user.firstName} ${cleanerProfile.user.lastName}`;

    if (FLAGS.REQUIRE_CONNECTION_FEE) {
      const charge = await chargeUser({
        userId: user.id,
        purpose: "CONNECTION_FEE",
        amount: FEES.CONNECTION_FEE,
        description: `Zprostředkování kontaktu – ${cleanerName}`,
      });
      if (!charge.ok) {
        return {
          ok: false,
          error: `${charge.error} Zkontrolujte platební metodu v nastavení.`,
        };
      }
    }

    // Platba proběhla – zbytek zapíšeme atomicky.
    const match = await prisma.$transaction(async (tx) => {
      const created = await tx.match.create({
        data: {
          jobRequestId: offer.jobRequestId,
          offerId: offer.id,
          clientId: user.id,
          cleanerId: offer.cleanerId,
          status: "ACTIVE",
          contactUnlockedAt: new Date(),
          conversation: { create: {} },
        },
      });

      await tx.offer.update({ where: { id: offer.id }, data: { status: "ACCEPTED" } });
      await tx.offer.updateMany({
        where: { jobRequestId: offer.jobRequestId, id: { not: offer.id }, status: "PENDING" },
        data: { status: "REJECTED" },
      });
      await tx.jobRequest.update({
        where: { id: offer.jobRequestId },
        data: { status: "MATCHED" },
      });

      await tx.payment.updateMany({
        where: { userId: user.id, purpose: "CONNECTION_FEE", matchId: null, status: "PAID" },
        data: { matchId: created.id },
      });

      await tx.notification.create({
        data: {
          userId: cleanerProfile.userId,
          type: "OFFER_ACCEPTED",
          title: "Vaši nabídku klient přijal",
          body: `Poptávka „${offer.jobRequest.title}“ je vaše. Kontakt na klienta najdete v konverzaci.`,
          href: "/dashboard/spoluprace",
        },
      });

      return created;
    });

    // Fáze 2: poplatek uklízečce. Neúspěch nesmí shodit už uzavřené propojení –
    // nezaplacený poplatek řeší provoz zvlášť (Payment zůstane ve stavu FAILED).
    if (FLAGS.CLEANER_FEE_ENABLED) {
      await chargeUser({
        userId: cleanerProfile.userId,
        purpose: "CLEANER_FEE",
        amount: FEES.CLEANER_SUBSCRIPTION,
        description: `Poplatek za zprostředkování zakázky – ${offer.jobRequest.title}`,
        matchId: match.id,
      });
    }

    matchId = match.id;
  } catch (e) {
    return toActionState(e);
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/spoluprace/${matchId}?propojeno=1`);
}
