// Jediný zdroj pravdy pro "enumy". Databáze je drží jako String (kvůli
// kompatibilitě SQLite ↔ Postgres), tady k nim patří typy i české popisky.

export const ROLES = ["CLIENT", "CLEANER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const SERVICES = [
  "HOME_CLEANING",
  "OFFICE_CLEANING",
  "IRONING",
  "WINDOWS",
  "DEEP_CLEANING",
  "LAUNDRY",
  "POST_RENOVATION",
] as const;
export type Service = (typeof SERVICES)[number];

export const SERVICE_LABELS: Record<Service, string> = {
  HOME_CLEANING: "Úklid domácnosti",
  OFFICE_CLEANING: "Úklid kanceláří",
  IRONING: "Žehlení",
  WINDOWS: "Mytí oken",
  DEEP_CLEANING: "Generální úklid",
  LAUNDRY: "Praní prádla",
  POST_RENOVATION: "Úklid po rekonstrukci",
};

export const LANGUAGES = ["cs", "sk", "en", "de", "uk", "ru", "vi"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  cs: "Čeština",
  sk: "Slovenština",
  en: "Angličtina",
  de: "Němčina",
  uk: "Ukrajinština",
  ru: "Ruština",
  vi: "Vietnamština",
};

export const LANGUAGE_LEVELS = ["BASIC", "INTERMEDIATE", "FLUENT", "NATIVE"] as const;
export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];

export const LANGUAGE_LEVEL_LABELS: Record<LanguageLevel, string> = {
  BASIC: "Základy",
  INTERMEDIATE: "Středně pokročilá",
  FLUENT: "Plynule",
  NATIVE: "Rodilý mluvčí",
};

export const FREQUENCIES = ["ONE_TIME", "WEEKLY", "BIWEEKLY", "MONTHLY"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  ONE_TIME: "Jednorázově",
  WEEKLY: "Každý týden",
  BIWEEKLY: "Každých 14 dní",
  MONTHLY: "Jednou měsíčně",
};

export const JOB_STATUSES = ["OPEN", "MATCHED", "CANCELLED", "EXPIRED"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  OPEN: "Otevřená",
  MATCHED: "Propojeno",
  CANCELLED: "Zrušená",
  EXPIRED: "Vypršela",
};

export const OFFER_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  PENDING: "Čeká na vyjádření",
  ACCEPTED: "Přijatá",
  REJECTED: "Odmítnutá",
  WITHDRAWN: "Stažená",
};

export const BOOKING_STATUSES = [
  "REQUESTED",
  "CONFIRMED",
  "DECLINED",
  "COMPLETED",
  "CANCELLED_BY_CLIENT",
  "CANCELLED_BY_CLEANER",
  "NO_SHOW",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  REQUESTED: "Čeká na potvrzení",
  CONFIRMED: "Potvrzeno",
  DECLINED: "Odmítnuto",
  COMPLETED: "Dokončeno",
  CANCELLED_BY_CLIENT: "Zrušeno klientem",
  CANCELLED_BY_CLEANER: "Zrušeno uklízečkou",
  NO_SHOW: "Nedostavil(a) se",
};

export const PLACE_TYPES = ["APARTMENT", "HOUSE", "OFFICE"] as const;
export type PlaceType = (typeof PLACE_TYPES)[number];

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  APARTMENT: "Byt",
  HOUSE: "Dům",
  OFFICE: "Kancelář",
};

export const WEEKDAYS = [
  { value: 1, label: "Pondělí", short: "Po" },
  { value: 2, label: "Úterý", short: "Út" },
  { value: 3, label: "Středa", short: "St" },
  { value: 4, label: "Čtvrtek", short: "Čt" },
  { value: 5, label: "Pátek", short: "Pá" },
  { value: 6, label: "Sobota", short: "So" },
  { value: 7, label: "Neděle", short: "Ne" },
] as const;

export const PAYMENT_PURPOSES = ["CONNECTION_FEE", "SUBSCRIPTION", "CLEANER_FEE"] as const;
export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[number];

export const PAYMENT_PURPOSE_LABELS: Record<PaymentPurpose, string> = {
  CONNECTION_FEE: "Zprostředkování kontaktu",
  SUBSCRIPTION: "Předplatné",
  CLEANER_FEE: "Poplatek poskytovatele",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Čeká na zaplacení",
  PAID: "Zaplaceno",
  FAILED: "Neúspěšná",
  REFUNDED: "Vráceno",
};

export function isService(v: string): v is Service {
  return (SERVICES as readonly string[]).includes(v);
}

export function isLanguage(v: string): v is Language {
  return (LANGUAGES as readonly string[]).includes(v);
}
