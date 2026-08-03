"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { AuthError, requireUser } from "../auth";
import { cleanerProfileSchema, clientProfileSchema, fieldErrors, messageSchema } from "../validation";
import { formToObject, type ActionState } from "./types";
import { LANGUAGE_LEVELS, type Language, type LanguageLevel } from "../constants";

function toActionState(e: unknown): ActionState {
  if (e instanceof AuthError) return { ok: false, error: e.message };
  throw e;
}

const asArray = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v ? [String(v)] : []);

export async function saveClientProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireUser("CLIENT");
    const raw = formToObject(formData);
    const parsed = clientProfileSchema.safeParse({ ...raw, hasPets: raw.hasPets === "on" });
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

    const { firstName, lastName, phone, ...profile } = parsed.data;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        phone: phone || null,
        clientProfile: {
          upsert: {
            create: {
              ...profile,
              placeType: profile.placeType || null,
              street: profile.street || null,
              city: profile.city || null,
              postalCode: profile.postalCode || null,
              note: profile.note || null,
            },
            update: {
              ...profile,
              placeType: profile.placeType || null,
              street: profile.street || null,
              city: profile.city || null,
              postalCode: profile.postalCode || null,
              note: profile.note || null,
            },
          },
        },
      },
    });
  } catch (e) {
    return toActionState(e);
  }

  revalidatePath("/dashboard/profil");
  return { ok: true, message: "Profil uložen." };
}

export async function saveCleanerProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireUser("CLEANER");
    const raw = formToObject(formData);

    // Jazyky přicházejí jako dvojice languages[] + level_<kód>.
    const languages = asArray(raw.languages).map((language) => {
      const level = String(formData.get(`level_${language}`) ?? "INTERMEDIATE");
      return {
        language: language as Language,
        level: (LANGUAGE_LEVELS as readonly string[]).includes(level)
          ? (level as LanguageLevel)
          : ("INTERMEDIATE" as LanguageLevel),
      };
    });

    const parsed = cleanerProfileSchema.safeParse({
      ...raw,
      services: asArray(raw.services),
      languages,
      hasOwnSupplies: raw.hasOwnSupplies === "on",
      hasCar: raw.hasCar === "on",
      invoices: raw.invoices === "on",
      acceptingWork: raw.acceptingWork === "on",
    });
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

    const {
      firstName,
      lastName,
      phone,
      services,
      languages: langs,
      hourlyRate,
      ...profile
    } = parsed.data;

    const cleanerProfile = await prisma.cleanerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!cleanerProfile) return { ok: false, error: "Profil poskytovatele nenalezen." };

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { firstName, lastName, phone: phone || null },
      }),
      prisma.cleanerProfile.update({
        where: { id: cleanerProfile.id },
        data: {
          ...profile,
          headline: profile.headline || null,
          bio: profile.bio || null,
          postalCode: profile.postalCode || null,
          hourlyRate: hourlyRate * 100,
        },
      }),
      prisma.cleanerService.deleteMany({ where: { cleanerId: cleanerProfile.id } }),
      prisma.cleanerService.createMany({
        data: services.map((service) => ({ cleanerId: cleanerProfile.id, service })),
      }),
      prisma.cleanerLanguage.deleteMany({ where: { cleanerId: cleanerProfile.id } }),
      prisma.cleanerLanguage.createMany({
        data: langs.map((l) => ({ cleanerId: cleanerProfile.id, ...l })),
      }),
    ]);
  } catch (e) {
    return toActionState(e);
  }

  revalidatePath("/dashboard/profil");
  revalidatePath("/uklizecky");
  return { ok: true, message: "Profil uložen." };
}

export async function sendMessageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireUser(["CLIENT", "CLEANER"]);
    const parsed = messageSchema.safeParse(formToObject(formData));
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

    const conversation = await prisma.conversation.findUnique({
      where: { id: parsed.data.conversationId },
      include: { match: true },
    });
    if (!conversation) return { ok: false, error: "Konverzace nenalezena." };

    const { match } = conversation;
    const isParticipant =
      match.clientId === user.id || match.cleanerId === user.cleanerProfileId;
    if (!isParticipant) return { ok: false, error: "K této konverzaci nemáte přístup." };

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        body: parsed.data.body,
      },
    });

    // Protistrana = ten druhý z dvojice.
    let recipientId = match.clientId;
    if (user.id === match.clientId) {
      const profile = await prisma.cleanerProfile.findUnique({
        where: { id: match.cleanerId },
        select: { userId: true },
      });
      recipientId = profile?.userId ?? match.clientId;
    }

    if (recipientId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: "NEW_OFFER",
          title: `Nová zpráva od ${user.firstName}`,
          body: parsed.data.body.slice(0, 120),
          href: `/dashboard/spoluprace/${match.id}`,
        },
      });
    }

    revalidatePath(`/dashboard/spoluprace/${match.id}`);
  } catch (e) {
    return toActionState(e);
  }

  return { ok: true };
}

export async function markNotificationsReadAction(): Promise<void> {
  const user = await requireUser(["CLIENT", "CLEANER", "ADMIN"]);
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard");
}
