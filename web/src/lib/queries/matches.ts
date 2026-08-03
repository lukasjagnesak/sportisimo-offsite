import { prisma } from "../prisma";
import type { SessionUser } from "../auth";

/** Propojení, kterých je uživatel součástí – z pohledu klienta i uklízečky. */
export async function listMatches(user: SessionUser) {
  const matches = await prisma.match.findMany({
    where:
      user.role === "CLEANER"
        ? { cleanerId: user.cleanerProfileId ?? "" }
        : { clientId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      jobRequest: { include: { services: true } },
      conversation: { include: { _count: { select: { messages: true } } } },
      _count: { select: { bookings: true } },
    },
  });

  // Protistrany dotáhneme hromadně, ať se neposílá N dotazů.
  const [clients, cleaners] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: matches.map((m) => m.clientId) } },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    }),
    prisma.cleanerProfile.findMany({
      where: { id: { in: matches.map((m) => m.cleanerId) } },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      },
    }),
  ]);

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const cleanerById = new Map(cleaners.map((c) => [c.id, c]));

  return matches.map((match) => ({
    match,
    client: clientById.get(match.clientId)!,
    cleaner: cleanerById.get(match.cleanerId)!,
  }));
}

export async function getMatchDetail(id: string, user: SessionUser) {
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      jobRequest: { include: { services: true } },
      conversation: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: { sender: { select: { id: true, firstName: true, lastName: true } } },
          },
        },
      },
      bookings: { orderBy: { start: "desc" } },
    },
  });
  if (!match) return null;

  const isClient = match.clientId === user.id;
  const isCleaner = match.cleanerId === user.cleanerProfileId;
  if (!isClient && !isCleaner) return null;

  const [client, cleaner] = await Promise.all([
    prisma.user.findUnique({
      where: { id: match.clientId },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    }),
    prisma.cleanerProfile.findUnique({
      where: { id: match.cleanerId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        services: true,
      },
    }),
  ]);

  return { match, client: client!, cleaner: cleaner!, isClient, isCleaner };
}
