import { z } from "zod";
import {
  FREQUENCIES,
  LANGUAGES,
  LANGUAGE_LEVELS,
  PLACE_TYPES,
  SERVICES,
} from "./constants";

const password = z
  .string()
  .min(8, "Heslo musí mít alespoň 8 znaků.")
  .max(200, "Heslo je příliš dlouhé.");

const email = z.string().trim().toLowerCase().email("Zadejte platný e-mail.");

const phone = z
  .string()
  .trim()
  .regex(/^(\+420)?\s?\d{3}\s?\d{3}\s?\d{3}$/, "Zadejte telefon ve tvaru +420 777 123 456.");

export const registerSchema = z.object({
  email,
  password,
  firstName: z.string().trim().min(2, "Zadejte jméno."),
  lastName: z.string().trim().min(2, "Zadejte příjmení."),
  phone: phone.optional().or(z.literal("")),
  role: z.enum(["CLIENT", "CLEANER"]),
  city: z.string().trim().min(2, "Zadejte město.").optional(),
  consent: z.literal(true, { message: "Bez souhlasu s podmínkami nelze účet založit." }),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Zadejte heslo."),
});

export const clientProfileSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  phone: phone.optional().or(z.literal("")),
  street: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{3}\s?\d{2}$/, "PSČ ve tvaru 110 00.")
    .optional()
    .or(z.literal("")),
  placeType: z.enum(PLACE_TYPES).optional().or(z.literal("")),
  areaM2: z.coerce.number().int().min(10).max(2000).optional(),
  hasPets: z.coerce.boolean().default(false),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const cleanerProfileSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  phone: phone.optional().or(z.literal("")),
  headline: z.string().trim().max(120).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Zadejte město, kde pracujete."),
  postalCode: z.string().trim().max(10).optional().or(z.literal("")),
  radiusKm: z.coerce.number().int().min(1).max(100),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  /** v korunách, na haléře se přepočítá až v handleru */
  hourlyRate: z.coerce.number().int().min(150, "Sazba pod 150 Kč/h nedává smysl.").max(3000),
  hasOwnSupplies: z.coerce.boolean().default(false),
  hasCar: z.coerce.boolean().default(false),
  invoices: z.coerce.boolean().default(false),
  acceptingWork: z.coerce.boolean().default(true),
  services: z.array(z.enum(SERVICES)).min(1, "Vyberte alespoň jednu službu."),
  languages: z
    .array(z.object({ language: z.enum(LANGUAGES), level: z.enum(LANGUAGE_LEVELS) }))
    .min(1, "Uveďte alespoň jeden jazyk."),
});

export const jobRequestSchema = z.object({
  title: z.string().trim().min(5, "Název poptávky je moc krátký.").max(120),
  description: z.string().trim().min(20, "Popište prosím podrobněji, co potřebujete.").max(4000),
  city: z.string().trim().min(2, "Zadejte město."),
  postalCode: z.string().trim().max(10).optional().or(z.literal("")),
  street: z.string().trim().max(120).optional().or(z.literal("")),
  areaM2: z.coerce.number().int().min(10).max(2000).optional(),
  frequency: z.enum(FREQUENCIES),
  estimatedHours: z.coerce.number().int().min(1).max(24).optional(),
  /** v korunách */
  budgetPerHour: z.coerce.number().int().min(100).max(3000).optional(),
  preferredFrom: z.coerce.date().optional(),
  preferredTo: z.coerce.date().optional(),
  services: z.array(z.enum(SERVICES)).min(1, "Vyberte alespoň jednu službu."),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const offerSchema = z.object({
  jobRequestId: z.string().min(1),
  message: z.string().trim().min(20, "Napište klientovi alespoň pár vět.").max(2000),
  /** v korunách */
  pricePerHour: z.coerce.number().int().min(150).max(3000),
  availableFrom: z.coerce.date().optional(),
});

export const availabilitySchema = z.object({
  blocks: z
    .array(
      z.object({
        weekday: z.coerce.number().int().min(1).max(7),
        startMin: z.coerce.number().int().min(0).max(1439),
        endMin: z.coerce.number().int().min(1).max(1440),
      }),
    )
    .max(50),
});

export const bookingSchema = z.object({
  cleanerId: z.string().min(1),
  start: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(60).max(720),
  service: z.enum(SERVICES),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  quality: z.coerce.number().int().min(1).max(5).optional(),
  punctuality: z.coerce.number().int().min(1).max(5).optional(),
  communication: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const paymentMethodSchema = z.object({
  cardNumber: z.string().trim().min(12).max(25),
  expMonth: z.coerce.number().int().min(1).max(12),
  expYear: z.coerce.number().int().min(new Date().getFullYear()).max(2100),
  holder: z.string().trim().min(3, "Zadejte jméno držitele karty."),
  cvc: z.string().trim().regex(/^\d{3,4}$/, "CVC má 3–4 číslice."),
});

export const messageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().trim().min(1, "Zpráva je prázdná.").max(4000),
});

/** Sjednocený tvar chyb pro formuláře: { pole: "hláška" }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    out[key] ??= issue.message;
  }
  return out;
}
