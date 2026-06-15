import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const EXPENSE_CATEGORIES = [
  { value: "maintenance", label: "Výživné", icon: "💰", color: "#6366f1" },
  { value: "activities", label: "Kroužky", icon: "🎯", color: "#8b5cf6" },
  { value: "clothing", label: "Oblečení", icon: "👕", color: "#ec4899" },
  { value: "food", label: "Jídlo", icon: "🍎", color: "#f59e0b" },
  { value: "health", label: "Zdraví", icon: "🏥", color: "#ef4444" },
  { value: "education", label: "Vzdělání", icon: "📚", color: "#3b82f6" },
  { value: "entertainment", label: "Zábava", icon: "🎉", color: "#10b981" },
  { value: "other", label: "Ostatní", icon: "📦", color: "#6b7280" },
]

export const SCHOOL_EVENT_TYPES = [
  { value: "TRIP", label: "Škola v přírodě", icon: "🏕️" },
  { value: "MEETING", label: "Třídní schůzka", icon: "👨‍👩‍👧" },
  { value: "PHOTO", label: "Focení", icon: "📸" },
  { value: "EXCURSION", label: "Výlet", icon: "🚌" },
  { value: "PERFORMANCE", label: "Vystoupení", icon: "🎭" },
  { value: "OTHER", label: "Ostatní", icon: "📅" },
]

export const DAY_NAMES = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"]
export const MONTH_NAMES = [
  "Leden",
  "Únor",
  "Březen",
  "Duben",
  "Květen",
  "Červen",
  "Červenec",
  "Srpen",
  "Září",
  "Říjen",
  "Listopad",
  "Prosinec",
]

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

export function formatShortDate(date: Date | string): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
  }).format(new Date(date))
}
