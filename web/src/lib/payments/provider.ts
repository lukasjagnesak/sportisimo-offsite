// Platební brána je za rozhraním. Ve vývoji běží `mock`, v produkci se
// doplní reálná implementace (Stripe podporuje CZK i opakované platby;
// pro čistě český trh je alternativou GoPay/Comgate se stejným rozhraním).
//
// Zásada: číslo karty se do naší databáze nikdy nedostane. Ukládáme pouze
// token od brány + poslední čtyřčíslí pro zobrazení uživateli.

export type ChargeInput = {
  /** v haléřích */
  amount: number;
  currency: "CZK";
  description: string;
  /** token platební metody (PaymentMethod.providerToken) */
  methodToken: string;
  idempotencyKey: string;
};

export type ChargeResult =
  | { ok: true; providerRef: string }
  | { ok: false; code: string; message: string };

export type TokenizeInput = {
  /** Ve skutečné bráně přichází z jejího SDK na klientovi, ne z našeho formuláře. */
  cardNumber: string;
  expMonth: number;
  expYear: number;
  holder: string;
};

export type TokenizeResult =
  | { ok: true; token: string; brand: string; last4: string }
  | { ok: false; message: string };

export interface PaymentProvider {
  readonly name: string;
  tokenizeCard(input: TokenizeInput): Promise<TokenizeResult>;
  charge(input: ChargeInput): Promise<ChargeResult>;
  refund(providerRef: string, amount: number): Promise<{ ok: boolean }>;
}
