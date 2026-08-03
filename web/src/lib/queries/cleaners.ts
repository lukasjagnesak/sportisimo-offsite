import { prisma } from "../prisma";
import { isLanguage, isService, type Language, type Service } from "../constants";

export type CleanerFilters = {
  city?: string;
  service?: Service;
  language?: Language;
  minRating?: number;
  maxPrice?: number;
  minExperience?: number;
  verifiedOnly?: boolean;
  sort?: "rating" | "price" | "experience";
};

/** Převod query stringu na filtry – jediné místo, kde se čte URL. */
export function parseFilters(params: Record<string, string | string[] | undefined>): CleanerFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const service = one(params.sluzba);
  const language = one(params.jazyk);
  const sort = one(params.razeni);

  return {
    city: one(params.mesto)?.trim() || undefined,
    service: service && isService(service) ? service : undefined,
    language: language && isLanguage(language) ? language : undefined,
    minRating: Number(one(params.hodnoceni)) || undefined,
    maxPrice: Number(one(params.cena)) || undefined,
    minExperience: Number(one(params.praxe)) || undefined,
    verifiedOnly: one(params.overene) === "1",
    sort: sort === "price" || sort === "experience" ? sort : "rating",
  };
}

export async function findCleaners(filters: CleanerFilters) {
  const orderBy =
    filters.sort === "price"
      ? [{ hourlyRate: "asc" as const }]
      : filters.sort === "experience"
        ? [{ yearsExperience: "desc" as const }]
        : [{ ratingAvg: "desc" as const }, { ratingCount: "desc" as const }];

  return prisma.cleanerProfile.findMany({
    where: {
      acceptingWork: true,
      // Neschválené profily se ve veřejném katalogu nezobrazují.
      verificationState: "APPROVED",
      ...(filters.city ? { city: { contains: filters.city } } : {}),
      ...(filters.verifiedOnly ? { verified: true } : {}),
      ...(filters.minRating ? { ratingAvg: { gte: filters.minRating } } : {}),
      ...(filters.maxPrice ? { hourlyRate: { lte: filters.maxPrice * 100 } } : {}),
      ...(filters.minExperience ? { yearsExperience: { gte: filters.minExperience } } : {}),
      ...(filters.service ? { services: { some: { service: filters.service } } } : {}),
      ...(filters.language ? { languages: { some: { language: filters.language } } } : {}),
    },
    orderBy,
    include: {
      user: { select: { firstName: true, lastName: true } },
      services: true,
      languages: true,
    },
    take: 60,
  });
}

export async function getCleanerDetail(id: string) {
  const cleaner = await prisma.cleanerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, createdAt: true } },
      services: true,
      languages: true,
      availability: { orderBy: { weekday: "asc" } },
    },
  });
  if (!cleaner) return null;

  const reviews = await prisma.review.findMany({
    where: { targetId: cleaner.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { author: { select: { firstName: true, lastName: true } } },
  });

  // Dílčí průměry dávají klientovi lepší obrázek než jedno číslo.
  const breakdown = await prisma.review.aggregate({
    where: { targetId: cleaner.user.id },
    _avg: { quality: true, punctuality: true, communication: true },
  });

  return { cleaner, reviews, breakdown: breakdown._avg };
}
