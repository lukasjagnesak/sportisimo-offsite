import { randomUUID } from "node:crypto";
import type { PaymentProvider } from "./provider";

/** Detekce značky karty podle prefixu – jen pro zobrazení v UI. */
function detectBrand(number: string): string {
  if (/^4/.test(number)) return "visa";
  if (/^5[1-5]/.test(number)) return "mastercard";
  if (/^3[47]/.test(number)) return "amex";
  return "card";
}

/** Luhnův algoritmus – ať se ve vývoji chytí alespoň překlepy. */
function luhnValid(number: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = Number(number[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return number.length >= 12 && sum % 10 === 0;
}

/**
 * Vývojová brána. Žádná síťová komunikace, deterministické chování:
 * karta končící na 0000 vždy selže (pro testování chybových stavů).
 */
export const mockProvider: PaymentProvider = {
  name: "mock",

  async tokenizeCard({ cardNumber, expMonth, expYear }) {
    const digits = cardNumber.replace(/\D/g, "");
    if (!luhnValid(digits)) {
      return { ok: false, message: "Neplatné číslo karty." };
    }
    const now = new Date();
    const expired =
      expYear < now.getFullYear() ||
      (expYear === now.getFullYear() && expMonth < now.getMonth() + 1);
    if (expired) return { ok: false, message: "Platnost karty už vypršela." };

    return {
      ok: true,
      token: `mock_pm_${randomUUID()}`,
      brand: detectBrand(digits),
      last4: digits.slice(-4),
    };
  },

  async charge({ amount, methodToken }) {
    if (amount <= 0) {
      return { ok: false, code: "invalid_amount", message: "Neplatná částka." };
    }
    if (methodToken.endsWith("0000")) {
      return { ok: false, code: "card_declined", message: "Platba byla zamítnuta bankou." };
    }
    return { ok: true, providerRef: `mock_ch_${randomUUID()}` };
  },

  async refund() {
    return { ok: true };
  },
};
