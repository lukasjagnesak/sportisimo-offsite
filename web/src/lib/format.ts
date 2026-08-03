const czk = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  maximumFractionDigits: 0,
});

const czkPrecise = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  minimumFractionDigits: 2,
});

/** Vstup v haléřích. */
export function formatCzk(amount: number, precise = false): string {
  const value = amount / 100;
  return precise || !Number.isInteger(value) ? czkPrecise.format(value) : czk.format(value);
}

const dateFmt = new Intl.DateTimeFormat("cs-CZ", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("cs-CZ", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFmt = new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit" });

export const formatDate = (d: Date | string) => dateFmt.format(new Date(d));
export const formatDateTime = (d: Date | string) => dateTimeFmt.format(new Date(d));
export const formatTime = (d: Date | string) => timeFmt.format(new Date(d));

/** Minuty od půlnoci → "08:30". */
export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "08:30" → minuty od půlnoci. */
export function parseMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Relativní čas typu "před 3 h" pro výpisy zpráv a notifikací. */
export function timeAgo(d: Date | string): string {
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "právě teď";
  if (min < 60) return `před ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `před ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `před ${days} dny`;
  return formatDate(d);
}

/** 4.5 → "4,5" */
export function formatRating(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

export function pluralCz(count: number, one: string, few: string, many: string): string {
  if (count === 1) return one;
  if (count >= 2 && count <= 4) return few;
  return many;
}
