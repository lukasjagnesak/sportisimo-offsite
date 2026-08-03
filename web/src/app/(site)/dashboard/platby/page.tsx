import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatCzk, formatDate } from "@/lib/format";
import {
  PAYMENT_PURPOSE_LABELS,
  PAYMENT_STATUS_LABELS,
  type PaymentPurpose,
} from "@/lib/constants";
import { vatBreakdown } from "@/lib/fees";
import { PaymentMethods } from "./payment-methods";

export const metadata = { title: "Platby" };
export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const user = (await getCurrentUser())!;

  const [methods, payments] = await Promise.all([
    prisma.paymentMethod.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <PageHeader
        title="Platby"
        description="Platební metody a historie účtovaných poplatků."
      />

      <PaymentMethods methods={methods} />

      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold text-ink-900">Historie plateb</h2>
          <span className="text-sm text-ink-600">
            Celkem zaplaceno {formatCzk(totalPaid)}
          </span>
        </div>

        {payments.length === 0 ? (
          <EmptyState
            title="Zatím žádné platby"
            description="Poplatek se strhne, až přijmete nabídku nebo aktivujete předplatné."
          />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Datum</th>
                  <th className="px-5 py-3 font-medium">Popis</th>
                  <th className="px-5 py-3 font-medium">Základ / DPH</th>
                  <th className="px-5 py-3 text-right font-medium">Částka</th>
                  <th className="px-5 py-3 text-right font-medium">Stav</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {payments.map((payment) => {
                  const vat = vatBreakdown(payment.amount, payment.vatRate);
                  return (
                    <tr key={payment.id}>
                      <td className="px-5 py-3 whitespace-nowrap text-ink-600">
                        {formatDate(payment.paidAt ?? payment.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink-900">
                          {PAYMENT_PURPOSE_LABELS[payment.purpose as PaymentPurpose]}
                        </p>
                        {payment.description && (
                          <p className="text-xs text-ink-500">{payment.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-ink-500">
                        {formatCzk(vat.base, true)} + {formatCzk(vat.vat, true)}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-ink-900 whitespace-nowrap">
                        {formatCzk(payment.amount)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Badge
                          tone={
                            payment.status === "PAID"
                              ? "success"
                              : payment.status === "FAILED"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </>
  );
}
