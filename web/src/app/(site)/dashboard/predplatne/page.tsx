import Link from "next/link";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSubscription } from "@/lib/subscription";
import { Alert, Badge, Card, PageHeader } from "@/components/ui";
import { formatCzk, formatDate } from "@/lib/format";
import { FLAGS, PLANS } from "@/lib/fees";
import { SubscriptionActions } from "./actions";

export const metadata = { title: "Předplatné" };
export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const user = await requirePageUser();
  const plan = user.role === "CLEANER" ? PLANS.CLEANER_PRO : PLANS.CLIENT_BASIC;

  const [subscription, methodCount] = await Promise.all([
    getActiveSubscription(user.id),
    prisma.paymentMethod.count({ where: { userId: user.id } }),
  ]);

  // Fáze 1: tarif pro uklízečky je připravený, ale ještě se neprodává.
  const planAvailable = user.role !== "CLEANER" || FLAGS.CLEANER_FEE_ENABLED;

  return (
    <>
      <PageHeader
        title="Předplatné"
        description="Plánovací nadstavba nad rámec zprostředkování. Zrušíte kdykoli."
      />

      {subscription ? (
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-ink-900">{plan.name}</h2>
                <Badge tone={subscription.cancelAtPeriodEnd ? "warning" : "success"}>
                  {subscription.cancelAtPeriodEnd ? "Končí na konci období" : "Aktivní"}
                </Badge>
              </div>
              <p className="mt-1 text-ink-600">
                {formatCzk(subscription.amount)} měsíčně
              </p>
            </div>
            <div className="text-right text-sm text-ink-600">
              <p>{subscription.cancelAtPeriodEnd ? "Přístup do" : "Další platba"}</p>
              <p className="font-medium text-ink-900">
                {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-2 border-t border-ink-100 pt-5 text-sm text-ink-700">
            {plan.features.map((feature) => (
              <li key={feature} className="flex gap-2.5">
                <span className="text-sand-500">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          <SubscriptionActions
            planId={plan.id}
            cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
            active
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {methodCount === 0 && (
            <Alert tone="warning">
              Nejdřív si{" "}
              <Link href="/dashboard/platby" className="font-medium underline">
                uložte platební kartu
              </Link>
              .
            </Alert>
          )}

          {!planAvailable && (
            <Alert>
              Tarif pro poskytovatele zatím nespouštíme — dokud běží pilot, jsou poptávky i
              reakce pro uklízečky zdarma.
            </Alert>
          )}

          <Card className="p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink-900">{plan.name}</h2>
              <p className="text-2xl font-semibold text-ink-900">
                {formatCzk(plan.price)}
                <span className="text-base font-normal text-ink-500"> / {plan.period}</span>
              </p>
            </div>

            <ul className="mt-5 space-y-2 text-sm text-ink-700">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2.5">
                  <span className="text-sand-500">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <SubscriptionActions
              planId={plan.id}
              disabled={methodCount === 0 || !planAvailable}
            />

            <p className="mt-4 text-xs text-ink-500">
              Bez předplatného zůstává zdarma: zadávání poptávek, prohlížení profilů, kontakt na
              vybranou uklízečku i chat.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
