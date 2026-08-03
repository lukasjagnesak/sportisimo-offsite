import { prisma } from "./prisma";
import { chargeUser } from "./payments";
import { PLANS, type PlanId } from "./fees";

export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE", currentPeriodEnd: { gt: new Date() } },
    orderBy: { currentPeriodEnd: "desc" },
  });
}

export async function hasActiveSubscription(userId: string) {
  return (await getActiveSubscription(userId)) !== null;
}

function addMonth(from: Date) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d;
}

/**
 * Založí předplatné a hned strhne první období. Když platba selže,
 * předplatné se nezaloží – uživatel nemá viset v PAST_DUE hned od začátku.
 */
export async function subscribe(
  userId: string,
  planId: PlanId,
): Promise<{ ok: true; subscriptionId: string } | { ok: false; error: string }> {
  const existing = await getActiveSubscription(userId);
  if (existing) return { ok: true, subscriptionId: existing.id };

  const plan = PLANS[planId];
  const now = new Date();

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      plan: planId,
      amount: plan.price,
      status: "PAST_DUE",
      currentPeriodStart: now,
      currentPeriodEnd: addMonth(now),
    },
  });

  const charge = await chargeUser({
    userId,
    purpose: "SUBSCRIPTION",
    amount: plan.price,
    description: `Předplatné ${plan.name} – ${plan.period}`,
    subscriptionId: subscription.id,
  });

  if (!charge.ok) {
    await prisma.subscription.delete({ where: { id: subscription.id } });
    return { ok: false, error: charge.error };
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "ACTIVE" },
  });

  await prisma.notification.create({
    data: {
      userId,
      type: "PAYMENT",
      title: `Předplatné ${plan.name} je aktivní`,
      body: "Od teď můžete plánovat úklidy v kalendáři.",
      href: "/dashboard/predplatne",
    },
  });

  return { ok: true, subscriptionId: subscription.id };
}

export async function cancelAtPeriodEnd(userId: string) {
  const sub = await getActiveSubscription(userId);
  if (!sub) return { ok: false as const, error: "Nemáte aktivní předplatné." };

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true },
  });
  return { ok: true as const };
}

export async function resumeSubscription(userId: string) {
  const sub = await getActiveSubscription(userId);
  if (!sub) return { ok: false as const, error: "Nemáte aktivní předplatné." };

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: false },
  });
  return { ok: true as const };
}
