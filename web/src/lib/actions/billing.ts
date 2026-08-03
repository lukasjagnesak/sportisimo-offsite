"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { AuthError, requireUser } from "../auth";
import { fieldErrors, paymentMethodSchema } from "../validation";
import { formToObject, type ActionState } from "./types";
import { getProvider } from "../payments";
import { cancelAtPeriodEnd, resumeSubscription, subscribe } from "../subscription";
import { PLANS, type PlanId } from "../fees";

function toActionState(e: unknown): ActionState {
  if (e instanceof AuthError) return { ok: false, error: e.message };
  throw e;
}

/**
 * Uložení karty. V produkci tokenizuje kartu SDK brány přímo v prohlížeči
 * a sem doputuje jen token – tenhle handler pak přijímá `providerToken`
 * místo čísla karty. Ve vývoji tokenizujeme přes mock bránu.
 */
export async function addPaymentMethodAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireUser(["CLIENT", "CLEANER"]);
    const parsed = paymentMethodSchema.safeParse(formToObject(formData));
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

    const { cardNumber, expMonth, expYear, holder } = parsed.data;
    const provider = getProvider();
    const token = await provider.tokenizeCard({ cardNumber, expMonth, expYear, holder });

    if (!token.ok) return { ok: false, fieldErrors: { cardNumber: token.message } };

    const count = await prisma.paymentMethod.count({ where: { userId: user.id } });

    await prisma.paymentMethod.create({
      data: {
        userId: user.id,
        type: "CARD",
        brand: token.brand,
        last4: token.last4,
        expMonth,
        expYear,
        providerToken: token.token,
        provider: provider.name,
        isDefault: count === 0,
      },
    });
  } catch (e) {
    return toActionState(e);
  }

  revalidatePath("/dashboard/platby");
  return { ok: true, message: "Platební metoda uložena." };
}

export async function setDefaultPaymentMethodAction(formData: FormData): Promise<void> {
  const user = await requireUser(["CLIENT", "CLEANER"]);
  const id = String(formData.get("methodId"));

  const method = await prisma.paymentMethod.findFirst({ where: { id, userId: user.id } });
  if (!method) return;

  await prisma.$transaction([
    prisma.paymentMethod.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    prisma.paymentMethod.update({ where: { id }, data: { isDefault: true } }),
  ]);

  revalidatePath("/dashboard/platby");
}

export async function removePaymentMethodAction(formData: FormData): Promise<void> {
  const user = await requireUser(["CLIENT", "CLEANER"]);
  const id = String(formData.get("methodId"));

  const method = await prisma.paymentMethod.findFirst({ where: { id, userId: user.id } });
  if (!method) return;

  await prisma.paymentMethod.delete({ where: { id } });

  // Ať uživatel nezůstane bez výchozí metody, když měl uloženo víc karet.
  if (method.isDefault) {
    const next = await prisma.paymentMethod.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (next) {
      await prisma.paymentMethod.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  revalidatePath("/dashboard/platby");
}

export async function subscribeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireUser(["CLIENT", "CLEANER"]);
    const planId = String(formData.get("plan")) as PlanId;

    const plan = PLANS[planId];
    if (!plan) return { ok: false, error: "Neznámý tarif." };
    if (plan.audience !== user.role) {
      return { ok: false, error: "Tento tarif není určen pro váš typ účtu." };
    }

    const result = await subscribe(user.id, planId);
    if (!result.ok) return { ok: false, error: result.error };
  } catch (e) {
    return toActionState(e);
  }

  revalidatePath("/dashboard/predplatne");
  return { ok: true, message: "Předplatné je aktivní." };
}

export async function cancelSubscriptionAction(): Promise<void> {
  const user = await requireUser(["CLIENT", "CLEANER"]);
  await cancelAtPeriodEnd(user.id);
  revalidatePath("/dashboard/predplatne");
}

export async function resumeSubscriptionAction(): Promise<void> {
  const user = await requireUser(["CLIENT", "CLEANER"]);
  await resumeSubscription(user.id);
  revalidatePath("/dashboard/predplatne");
}
