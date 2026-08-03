"use client";

import { useActionState, useState } from "react";
import { requestBookingAction } from "@/lib/actions/bookings";
import { idle } from "@/lib/actions/types";
import { Alert, Card, Field, cx } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { SERVICE_LABELS, type Service } from "@/lib/constants";

type SlotOption = { start: string; label: string };

export function BookingForm({
  cleanerId,
  cleanerName,
  services,
  slots,
  defaultAddress,
}: {
  cleanerId: string;
  cleanerName: string;
  services: Service[];
  slots: SlotOption[];
  defaultAddress: string;
}) {
  const [state, formAction] = useActionState(requestBookingAction, idle);
  const [selected, setSelected] = useState<string>("");

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-ink-900">Objednat termín</h2>
      <p className="mt-1 text-sm text-ink-600">
        Vyberte volný slot z kalendáře. {cleanerName} termín potvrdí, nebo navrhne jiný.
      </p>

      {slots.length === 0 ? (
        <Alert tone="warning">
          V nejbližších třech týdnech nemá {cleanerName} volno. Zkuste se domluvit v chatu.
        </Alert>
      ) : (
        <form action={formAction} className="mt-5 space-y-4">
          <input type="hidden" name="cleanerId" value={cleanerId} />
          <input type="hidden" name="start" value={selected} />

          {state.error && <Alert tone="error">{state.error}</Alert>}
          {state.ok && <Alert tone="success">{state.message}</Alert>}

          <fieldset>
            <legend className="field-label">Volné termíny</legend>
            <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {slots.map((slot) => (
                <button
                  type="button"
                  key={slot.start}
                  onClick={() => setSelected(slot.start)}
                  className={cx(
                    "rounded-lg border px-3 py-2 text-left text-sm transition",
                    selected === slot.start
                      ? "border-ink-600 bg-ink-50 font-medium text-ink-900"
                      : "border-ink-100 text-ink-700 hover:border-ink-300",
                  )}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Služba" htmlFor="service" required>
              <select id="service" name="service" required className="field-input">
                {services.map((service) => (
                  <option key={service} value={service}>
                    {SERVICE_LABELS[service]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Délka" htmlFor="durationMinutes" required>
              <select
                id="durationMinutes"
                name="durationMinutes"
                defaultValue="120"
                className="field-input"
              >
                {[60, 120, 180, 240, 300, 360, 480].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes / 60} hodin{minutes === 60 ? "a" : minutes <= 240 ? "y" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Adresa" htmlFor="address">
            <input
              id="address"
              name="address"
              defaultValue={defaultAddress}
              className="field-input"
            />
          </Field>

          <Field label="Poznámka k termínu" htmlFor="note">
            <textarea
              id="note"
              name="note"
              rows={2}
              className="field-input"
              placeholder="Klíče budou u sousedky, prosím zvláštní pozornost kuchyni."
            />
          </Field>

          <SubmitButton disabled={!selected} className="w-full" pendingLabel="Odesílám…">
            {selected ? "Odeslat žádost o termín" : "Nejdřív vyberte termín"}
          </SubmitButton>
        </form>
      )}
    </Card>
  );
}
