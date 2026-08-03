import { prisma } from "../prisma";
import { FEES } from "../fees";
import { mockProvider } from "./mock";
import type { PaymentProvider } from "./provider";
import type { PaymentPurpose } from "../constants";

export * from "./provider";

/**
 * Výběr brány. Reálný provider se přidá sem – rozhraní PaymentProvider
 * je záměrně minimální, aby šel Stripe/GoPay/Comgate doplnit bez zásahu
 * do zbytku aplikace.
 */
export function getProvider(): PaymentProvider {
  switch (process.env.PAYMENT_PROVIDER) {
    case "mock":
    default:
      return mockProvider;
  }
}

export async function getDefaultPaymentMethod(userId: string) {
  return prisma.paymentMethod.findFirst({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

type ChargeArgs = {
  userId: string;
  purpose: PaymentPurpose;
  amount: number;
  description: string;
  matchId?: string;
  subscriptionId?: string;
};

export type ChargeOutcome =
  | { ok: true; paymentId: string }
  | { ok: false; error: string; paymentId?: string };

/**
 * Založí Payment, strhne částku a výsledek zapíše. Payment vzniká vždy –
 * i neúspěšný pokus musí zůstat v historii kvůli reklamacím a účetnictví.
 */
export async function chargeUser({
  userId,
  purpose,
  amount,
  description,
  matchId,
  subscriptionId,
}: ChargeArgs): Promise<ChargeOutcome> {
  const method = await getDefaultPaymentMethod(userId);
  if (!method) {
    return { ok: false, error: "Nemáte uloženou žádnou platební metodu." };
  }

  const provider = getProvider();
  const payment = await prisma.payment.create({
    data: {
      userId,
      matchId,
      subscriptionId,
      purpose,
      amount,
      description,
      vatRate: FEES.VAT_RATE,
      provider: provider.name,
      status: "PENDING",
    },
  });

  const result = await provider.charge({
    amount,
    currency: "CZK",
    description,
    methodToken: method.providerToken,
    idempotencyKey: payment.id,
  });

  if (!result.ok) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", description: `${description} – ${result.message}` },
    });
    return { ok: false, error: result.message, paymentId: payment.id };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "PAID", providerRef: result.providerRef, paidAt: new Date() },
  });

  return { ok: true, paymentId: payment.id };
}
