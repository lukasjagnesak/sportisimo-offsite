"use client";

import { useActionState } from "react";
import {
  cancelSubscriptionAction,
  resumeSubscriptionAction,
  subscribeAction,
} from "@/lib/actions/billing";
import { idle } from "@/lib/actions/types";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import type { PlanId } from "@/lib/fees";

export function SubscriptionActions({
  planId,
  active,
  cancelAtPeriodEnd,
  disabled,
}: {
  planId: PlanId;
  active?: boolean;
  cancelAtPeriodEnd?: boolean;
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(subscribeAction, idle);

  if (active) {
    return (
      <div className="mt-6 border-t border-ink-100 pt-5">
        {cancelAtPeriodEnd ? (
          <form action={resumeSubscriptionAction}>
            <SubmitButton variant="outline" pendingLabel="Obnovuji…">
              Obnovit předplatné
            </SubmitButton>
          </form>
        ) : (
          <form action={cancelSubscriptionAction}>
            <SubmitButton variant="ghost" size="sm" pendingLabel="Ruším…">
              Zrušit ke konci období
            </SubmitButton>
          </form>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-3">
      <input type="hidden" name="plan" value={planId} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}

      <SubmitButton size="lg" className="w-full" disabled={disabled} pendingLabel="Aktivuji…">
        Aktivovat předplatné
      </SubmitButton>
    </form>
  );
}
