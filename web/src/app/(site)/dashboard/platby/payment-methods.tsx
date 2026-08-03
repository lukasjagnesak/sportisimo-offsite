"use client";

import { useActionState, useState } from "react";
import {
  addPaymentMethodAction,
  removePaymentMethodAction,
  setDefaultPaymentMethodAction,
} from "@/lib/actions/billing";
import { idle } from "@/lib/actions/types";
import { Alert, Badge, Button, Card, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

type Method = {
  id: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
};

export function PaymentMethods({ methods }: { methods: Method[] }) {
  const [state, formAction] = useActionState(addPaymentMethodAction, idle);
  const [adding, setAdding] = useState(methods.length === 0);

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-ink-900">Platební metody</h2>

      {methods.length > 0 && (
        <ul className="mt-4 space-y-2">
          {methods.map((method) => (
            <li
              key={method.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-100 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="rounded bg-ink-100 px-2 py-1 text-xs font-semibold uppercase text-ink-700">
                  {method.brand ?? "karta"}
                </span>
                <span className="text-sm text-ink-900">•••• {method.last4}</span>
                <span className="text-xs text-ink-500">
                  {String(method.expMonth).padStart(2, "0")}/{method.expYear}
                </span>
                {method.isDefault && <Badge tone="success">Výchozí</Badge>}
              </div>

              <div className="flex gap-2">
                {!method.isDefault && (
                  <form action={setDefaultPaymentMethodAction}>
                    <input type="hidden" name="methodId" value={method.id} />
                    <button type="submit" className="text-sm text-ink-600 hover:text-ink-900">
                      Nastavit jako výchozí
                    </button>
                  </form>
                )}
                <form action={removePaymentMethodAction}>
                  <input type="hidden" name="methodId" value={method.id} />
                  <button type="submit" className="text-sm text-ink-500 hover:text-red-600">
                    Odebrat
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form action={formAction} className="mt-5 space-y-4 border-t border-ink-100 pt-5">
          {state.error && <Alert tone="error">{state.error}</Alert>}
          {state.ok && <Alert tone="success">{state.message}</Alert>}

          <Field
            label="Číslo karty"
            htmlFor="cardNumber"
            error={state.fieldErrors?.cardNumber}
            hint="Testovací karta: 4242 4242 4242 4242"
            required
          >
            <input
              id="cardNumber"
              name="cardNumber"
              inputMode="numeric"
              autoComplete="cc-number"
              required
              className="field-input"
              placeholder="4242 4242 4242 4242"
            />
          </Field>

          <Field label="Jméno držitele" htmlFor="holder" error={state.fieldErrors?.holder} required>
            <input
              id="holder"
              name="holder"
              autoComplete="cc-name"
              required
              className="field-input"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Měsíc" htmlFor="expMonth" error={state.fieldErrors?.expMonth} required>
              <input
                id="expMonth"
                name="expMonth"
                type="number"
                min={1}
                max={12}
                required
                className="field-input"
                placeholder="12"
              />
            </Field>
            <Field label="Rok" htmlFor="expYear" error={state.fieldErrors?.expYear} required>
              <input
                id="expYear"
                name="expYear"
                type="number"
                min={new Date().getFullYear()}
                required
                className="field-input"
                placeholder={String(new Date().getFullYear() + 2)}
              />
            </Field>
            <Field label="CVC" htmlFor="cvc" error={state.fieldErrors?.cvc} required>
              <input
                id="cvc"
                name="cvc"
                inputMode="numeric"
                required
                className="field-input"
                placeholder="123"
              />
            </Field>
          </div>

          <p className="text-xs text-ink-500">
            Číslo karty se u nás neukládá. Bráně předáváme jen jednorázový token, v databázi
            zůstane značka a poslední čtyřčíslí.
          </p>

          <div className="flex gap-2">
            <SubmitButton pendingLabel="Ověřuji kartu…">Uložit kartu</SubmitButton>
            {methods.length > 0 && (
              <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                Zrušit
              </Button>
            )}
          </div>
        </form>
      ) : (
        <Button variant="outline" className="mt-5" onClick={() => setAdding(true)}>
          Přidat kartu
        </Button>
      )}
    </Card>
  );
}
