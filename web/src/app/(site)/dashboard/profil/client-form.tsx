"use client";

import { useActionState } from "react";
import { saveClientProfileAction } from "@/lib/actions/profile";
import { idle } from "@/lib/actions/types";
import { Alert, Card, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PLACE_TYPES, PLACE_TYPE_LABELS } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";

type Profile = {
  street: string | null;
  city: string | null;
  postalCode: string | null;
  placeType: string | null;
  areaM2: number | null;
  hasPets: boolean;
  note: string | null;
} | null;

export function ClientProfileForm({
  user,
  profile,
}: {
  user: SessionUser;
  profile: Profile;
}) {
  const [state, formAction] = useActionState(saveClientProfileAction, idle);

  return (
    <Card className="p-6">
      <form action={formAction} className="space-y-5">
        {state.error && <Alert tone="error">{state.error}</Alert>}
        {state.ok && <Alert tone="success">{state.message}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Jméno" htmlFor="firstName" error={state.fieldErrors?.firstName} required>
            <input
              id="firstName"
              name="firstName"
              defaultValue={user.firstName}
              required
              className="field-input"
            />
          </Field>
          <Field label="Příjmení" htmlFor="lastName" error={state.fieldErrors?.lastName} required>
            <input
              id="lastName"
              name="lastName"
              defaultValue={user.lastName}
              required
              className="field-input"
            />
          </Field>
        </div>

        <Field label="Telefon" htmlFor="phone" error={state.fieldErrors?.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={user.phone ?? ""}
            className="field-input"
            placeholder="+420 777 123 456"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Field label="Ulice a číslo" htmlFor="street" error={state.fieldErrors?.street}>
            <input
              id="street"
              name="street"
              defaultValue={profile?.street ?? ""}
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

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Město" htmlFor="city" error={state.fieldErrors?.city}>
            <input
              id="city"
              name="city"
              defaultValue={profile?.city ?? ""}
              className="field-input"
            />
          </Field>
          <Field label="Typ objektu" htmlFor="placeType">
            <select
              id="placeType"
              name="placeType"
              defaultValue={profile?.placeType ?? ""}
              className="field-input"
            >
              <option value="">Nevyplněno</option>
              {PLACE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PLACE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
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
        </div>

        <label className="flex items-center gap-2.5 text-sm text-ink-800">
          <input
            type="checkbox"
            name="hasPets"
            defaultChecked={profile?.hasPets}
            className="size-4 rounded border-ink-300"
          />
          Máme doma zvíře
        </label>

        <Field
          label="Poznámka pro poskytovatele"
          htmlFor="note"
          hint="Např. kde jsou klíče, alergie na čisticí prostředky, na co si dát pozor."
        >
          <textarea
            id="note"
            name="note"
            rows={3}
            defaultValue={profile?.note ?? ""}
            className="field-input"
          />
        </Field>

        <SubmitButton pendingLabel="Ukládám…">Uložit profil</SubmitButton>
      </form>
    </Card>
  );
}
