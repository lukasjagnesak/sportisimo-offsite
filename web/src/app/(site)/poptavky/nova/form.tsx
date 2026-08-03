"use client";

import { useActionState } from "react";
import { createJobRequestAction } from "@/lib/actions/jobs";
import { idle } from "@/lib/actions/types";
import { Alert, Card, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { FREQUENCIES, FREQUENCY_LABELS, SERVICES, SERVICE_LABELS } from "@/lib/constants";

type Profile = {
  street: string | null;
  city: string | null;
  postalCode: string | null;
  areaM2: number | null;
} | null;

export function JobRequestForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState(createJobRequestAction, idle);

  return (
    <Card className="p-6">
      <form action={formAction} className="space-y-5">
        {state.error && <Alert tone="error">{state.error}</Alert>}

        <Field
          label="Název poptávky"
          htmlFor="title"
          error={state.fieldErrors?.title}
          hint="Například „Pravidelný úklid bytu 3+kk na Vinohradech“."
          required
        >
          <input id="title" name="title" required className="field-input" />
        </Field>

        <fieldset>
          <legend className="field-label">Co potřebujete</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SERVICES.map((service) => (
              <label
                key={service}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-ink-100 px-3 py-2.5 text-sm hover:border-ink-300"
              >
                <input
                  type="checkbox"
                  name="services[]"
                  value={service}
                  className="size-4 rounded border-ink-300"
                />
                {SERVICE_LABELS[service]}
              </label>
            ))}
          </div>
          {state.fieldErrors?.services && (
            <p className="field-error">{state.fieldErrors.services}</p>
          )}
        </fieldset>

        <Field
          label="Popis"
          htmlFor="description"
          error={state.fieldErrors?.description}
          hint="Kolik místností, jestli máte zvířata, kdo předá klíče, na co si dát pozor."
          required
        >
          <textarea
            id="description"
            name="description"
            rows={6}
            required
            minLength={20}
            className="field-input"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Město" htmlFor="city" error={state.fieldErrors?.city} required>
            <input
              id="city"
              name="city"
              required
              defaultValue={profile?.city ?? ""}
              className="field-input"
            />
          </Field>
          <Field label="PSČ" htmlFor="postalCode" error={state.fieldErrors?.postalCode}>
            <input
              id="postalCode"
              name="postalCode"
              defaultValue={profile?.postalCode ?? ""}
              className="field-input"
              placeholder="120 00"
            />
          </Field>
        </div>

        <Field
          label="Ulice a číslo popisné"
          htmlFor="street"
          error={state.fieldErrors?.street}
          hint="Zobrazíme až uklízečce, kterou si vyberete. V přehledu poptávek adresa vidět není."
        >
          <input
            id="street"
            name="street"
            defaultValue={profile?.street ?? ""}
            className="field-input"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Plocha (m²)" htmlFor="areaM2" error={state.fieldErrors?.areaM2}>
            <input
              id="areaM2"
              name="areaM2"
              type="number"
              min={10}
              defaultValue={profile?.areaM2 ?? ""}
              className="field-input"
            />
          </Field>
          <Field
            label="Odhad hodin"
            htmlFor="estimatedHours"
            error={state.fieldErrors?.estimatedHours}
          >
            <input
              id="estimatedHours"
              name="estimatedHours"
              type="number"
              min={1}
              max={24}
              className="field-input"
            />
          </Field>
          <Field
            label="Rozpočet (Kč/h)"
            htmlFor="budgetPerHour"
            error={state.fieldErrors?.budgetPerHour}
          >
            <input
              id="budgetPerHour"
              name="budgetPerHour"
              type="number"
              min={100}
              step={10}
              className="field-input"
              placeholder="400"
            />
          </Field>
        </div>

        <Field label="Jak často" htmlFor="frequency" error={state.fieldErrors?.frequency} required>
          <select id="frequency" name="frequency" className="field-input" defaultValue="ONE_TIME">
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABELS[f]}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nejdřív od" htmlFor="preferredFrom" error={state.fieldErrors?.preferredFrom}>
            <input id="preferredFrom" name="preferredFrom" type="date" className="field-input" />
          </Field>
          <Field label="Nejpozději do" htmlFor="preferredTo" error={state.fieldErrors?.preferredTo}>
            <input id="preferredTo" name="preferredTo" type="date" className="field-input" />
          </Field>
        </div>

        <Field
          label="Poznámka"
          htmlFor="note"
          error={state.fieldErrors?.note}
          hint="Cokoli dalšího, co by měl poskytovatel vědět."
        >
          <textarea id="note" name="note" rows={3} className="field-input" />
        </Field>

        <div className="rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-700">
          Zadání poptávky je zdarma. Platíte až ve chvíli, kdy přijmete konkrétní nabídku.
        </div>

        <SubmitButton size="lg" className="w-full" pendingLabel="Odesílám…">
          Zveřejnit poptávku
        </SubmitButton>
      </form>
    </Card>
  );
}
