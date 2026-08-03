"use client";

import { useActionState } from "react";
import { createOfferAction } from "@/lib/actions/jobs";
import { idle } from "@/lib/actions/types";
import { Alert, Card, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function OfferForm({
  jobRequestId,
  suggestedPrice,
}: {
  jobRequestId: string;
  /** rozpočet klienta v haléřích – nabídneme jako výchozí sazbu */
  suggestedPrice?: number;
}) {
  const [state, formAction] = useActionState(createOfferAction, idle);

  if (state.ok) {
    return <Alert tone="success">{state.message}</Alert>;
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-ink-900">Reagovat na poptávku</h3>
      <p className="mt-1 text-sm text-ink-600">
        Napište konkrétně, proč jste dobrá volba a kdy můžete nastoupit. Obecné odpovědi klienti
        přeskakují.
      </p>

      <form action={formAction} className="mt-5 space-y-4">
        <input type="hidden" name="jobRequestId" value={jobRequestId} />
        {state.error && <Alert tone="error">{state.error}</Alert>}

        <Field label="Zpráva klientovi" htmlFor="message" error={state.fieldErrors?.message} required>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            minLength={20}
            className="field-input"
            placeholder="Dobrý den, úklid bytu na Vinohradech mi sedí do trasy…"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Vaše sazba (Kč/h)"
            htmlFor="pricePerHour"
            error={state.fieldErrors?.pricePerHour}
            required
          >
            <input
              id="pricePerHour"
              name="pricePerHour"
              type="number"
              min={150}
              step={10}
              required
              defaultValue={suggestedPrice ? Math.round(suggestedPrice / 100) : undefined}
              className="field-input"
            />
          </Field>

          <Field
            label="Můžu nastoupit od"
            htmlFor="availableFrom"
            error={state.fieldErrors?.availableFrom}
          >
            <input id="availableFrom" name="availableFrom" type="date" className="field-input" />
          </Field>
        </div>

        <SubmitButton className="w-full" pendingLabel="Odesílám…">
          Odeslat nabídku
        </SubmitButton>
      </form>
    </Card>
  );
}
