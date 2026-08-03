"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "../prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "../auth";
import { loginSchema, registerSchema, fieldErrors } from "../validation";
import { formToObject, type ActionState } from "./types";

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = formToObject(formData);
  const parsed = registerSchema.safeParse({ ...raw, consent: raw.consent === "on" });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  }

  const { email, password, firstName, lastName, phone, role, city } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, fieldErrors: { email: "Účet s tímto e-mailem už existuje." } };
  }

  if (role === "CLEANER" && !city) {
    return { ok: false, fieldErrors: { city: "Zadejte město, kde pracujete." } };
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      role,
      firstName,
      lastName,
      phone: phone || null,
      ...(role === "CLIENT"
        ? { clientProfile: { create: { city: city || null } } }
        : {
            cleanerProfile: {
              create: {
                city: city!,
                // Výchozí dostupnost pracovní týden 8–16, uklízečka si ji upraví.
                availability: {
                  create: [1, 2, 3, 4, 5].map((weekday) => ({
                    weekday,
                    startMin: 8 * 60,
                    endMin: 16 * 60,
                  })),
                },
                services: { create: [{ service: "HOME_CLEANING" }] },
                languages: { create: [{ language: "cs", level: "NATIVE" }] },
              },
            },
          }),
    },
  });

  const h = await headers();
  await createSession(user.id, {
    userAgent: h.get("user-agent") ?? undefined,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  redirect(role === "CLEANER" ? "/dashboard/profil?vitejte=1" : "/poptavky/nova?vitejte=1");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Stejná hláška pro neexistující účet i špatné heslo – ať web neprozrazuje,
  // které e-maily jsou registrované.
  const invalid: ActionState = { ok: false, error: "Nesprávný e-mail nebo heslo." };
  if (!user) {
    // Hash naprázdno, aby odpověď trvala podobně dlouho jako u existujícího účtu.
    await verifyPassword(parsed.data.password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
    return invalid;
  }
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) return invalid;
  if (user.status !== "ACTIVE") {
    return { ok: false, error: "Účet je pozastavený. Ozvěte se nám na podpora@uklidno.cz." };
  }

  const h = await headers();
  await createSession(user.id, {
    userAgent: h.get("user-agent") ?? undefined,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
