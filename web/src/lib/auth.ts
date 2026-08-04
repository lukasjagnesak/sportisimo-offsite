import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { prisma } from "./prisma";
import type { Role } from "./constants";

export const SESSION_COOKIE = "uklidno_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** V DB držíme jen otisk tokenu – únik databáze sám o sobě nedá přístup k účtům. */
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export async function createSession(userId: string, meta?: { userAgent?: string; ip?: string }) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);

  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt, ...meta },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  store.delete(SESSION_COOKIE);
}

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone: string | null;
  locale: string;
  cleanerProfileId: string | null;
};

/**
 * Aktuálně přihlášený uživatel, nebo null. `cache` zajistí jediný dotaz
 * na render i při volání z více komponent.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { cleanerProfile: { select: { id: true } } } } },
  });

  if (!session || session.expiresAt < new Date() || session.user.status !== "ACTIVE") {
    return null;
  }

  const { user } = session;
  return {
    id: user.id,
    email: user.email,
    role: user.role as Role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    locale: user.locale,
    cleanerProfileId: user.cleanerProfile?.id ?? null,
  };
});

/**
 * Pro stránky v /dashboard. Layout sice nepřihlášeného přesměruje, ale layout
 * a stránka se renderují paralelně – bez tohohle by stránka stihla sáhnout na
 * null dřív, než se redirect projeví.
 */
export async function requirePageUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/prihlaseni");
  return user;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Pro API routy a server actions – vyhodí AuthError, který handler přeloží na 401/403. */
export async function requireUser(role?: Role | Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Nejste přihlášeni.", 401);

  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(user.role)) {
      throw new AuthError("K této akci nemáte oprávnění.", 403);
    }
  }
  return user;
}

export async function requireCleaner(): Promise<SessionUser & { cleanerProfileId: string }> {
  const user = await requireUser("CLEANER");
  if (!user.cleanerProfileId) {
    throw new AuthError("Nejprve dokončete svůj profil poskytovatele.", 403);
  }
  return user as SessionUser & { cleanerProfileId: string };
}
