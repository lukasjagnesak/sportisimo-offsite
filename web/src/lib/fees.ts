// Obchodní model na jednom místě.
//
// Fáze 1 (start): platí pouze klient – jednorázový poplatek za zprostředkování
// kontaktu + volitelné předplatné 99 Kč/měs za plánovací nadstavbu.
// Fáze 2 (finální produkt): poplatek platí obě strany – zapne se přepnutím
// CLEANER_FEE_ENABLED, kód pro to je připravený.

/** Částky jsou v haléřích. 99 Kč = 9900. */
export const FEES = {
  /** Jednorázový poplatek klienta za odemčení kontaktu na vybranou uklízečku. */
  CONNECTION_FEE: 24900,

  /** Předplatné klienta – plánování, kalendář, opakované rezervace. */
  CLIENT_SUBSCRIPTION: 9900,

  /** Fáze 2: měsíční poplatek uklízečky za přístup k poptávkám. */
  CLEANER_SUBSCRIPTION: 9900,

  VAT_RATE: 21,
} as const;

export const FLAGS = {
  /** Fáze 2 – zapne poplatky na straně uklízečky. */
  CLEANER_FEE_ENABLED: process.env.CLEANER_FEE_ENABLED === "true",

  /**
   * Vyžadovat aktivní předplatné pro rezervace v kalendáři.
   * Při vypnutí je plánování zdarma (užitečné pro beta provoz).
   */
  REQUIRE_SUBSCRIPTION_FOR_BOOKING:
    process.env.REQUIRE_SUBSCRIPTION_FOR_BOOKING !== "false",

  /**
   * Vyžadovat zaplacení zprostředkovatelského poplatku před odemčením kontaktu.
   * Vypnuto = kontakt se odemkne hned (pro pilotní provoz / testování).
   */
  REQUIRE_CONNECTION_FEE: process.env.REQUIRE_CONNECTION_FEE !== "false",
} as const;

export const PLANS = {
  CLIENT_BASIC: {
    id: "CLIENT_BASIC" as const,
    name: "Plánovač",
    audience: "CLIENT" as const,
    price: FEES.CLIENT_SUBSCRIPTION,
    period: "měsíc",
    features: [
      "Kalendář dostupnosti vašich uklízeček",
      "Objednání na konkrétní den a hodinu",
      "Opakované úklidy a připomínky",
      "Chat a historie všech návštěv",
      "Neomezený počet rezervací",
    ],
  },
  CLEANER_PRO: {
    id: "CLEANER_PRO" as const,
    name: "Profi",
    audience: "CLEANER" as const,
    price: FEES.CLEANER_SUBSCRIPTION,
    period: "měsíc",
    features: [
      "Neomezené reakce na poptávky",
      "Přednostní pozice ve výpisu",
      "Ověřený odznak na profilu",
      "Statistiky poptávek ve vašem okolí",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;

/** Rozpad ceny na základ a DPH – pro doklad. */
export function vatBreakdown(amount: number, rate: number = FEES.VAT_RATE) {
  const base = Math.round((amount / (100 + rate)) * 100);
  return { base, vat: amount - base, total: amount, rate };
}
