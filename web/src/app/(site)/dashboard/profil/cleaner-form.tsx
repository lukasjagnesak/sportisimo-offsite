"use client";

import { useActionState, useState } from "react";
import { saveCleanerProfileAction } from "@/lib/actions/profile";
import { idle } from "@/lib/actions/types";
import { Alert, Card, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import {
  LANGUAGES,
  LANGUAGE_LABELS,
  LANGUAGE_LEVELS,
  LANGUAGE_LEVEL_LABELS,
  SERVICES,
  SERVICE_LABELS,
} from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";

type Profile = {
  headline: string | null;
  bio: string | null;
  city: string;
  postalCode: string | null;
  radiusKm: number;
  yearsExperience: number;
  hourlyRate: number;
  hasOwnSupplies: boolean;
  hasCar: boolean;
  invoices: boolean;
  acceptingWork: boolean;
  services: { service: string }[];
  languages: { language: string; level: string }[];
};

export function CleanerProfileForm({
  user,
  profile,
}: {
  user: SessionUser;
  profile: Profile;
}) {
  const [state, formAction] = useActionState(saveCleanerProfileAction, idle);

  // Jazyky mají u sebe úroveň, takže potřebují stav – zbytek formuláře jede
  // nekontrolovaně přes defaultValue.
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    profile.languages.map((l) => l.language),
  );

  const levelOf = (code: string) =>
    profile.languages.find((l) => l.language === code)?.level ?? "INTERMEDIATE";

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
          />
        </Field>

        <Field
          label="Krátké představení"
          htmlFor="headline"
          error={state.fieldErrors?.headline}
          hint="Jedna věta, kterou klient uvidí ve výpisu. Např. „Pečlivý úklid domácností a žehlení, 12 let praxe“."
        >
          <input
            id="headline"
            name="headline"
            defaultValue={profile.headline ?? ""}
            maxLength={120}
            className="field-input"
          />
        </Field>

        <Field
          label="O mně"
          htmlFor="bio"
          error={state.fieldErrors?.bio}
          hint="Čemu se věnujete, jak pracujete, co od vás klient může čekat."
        >
          <textarea
            id="bio"
            name="bio"
            rows={6}
            defaultValue={profile.bio ?? ""}
            className="field-input"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Město" htmlFor="city" error={state.fieldErrors?.city} required>
            <input
              id="city"
              name="city"
              defaultValue={profile.city}
              required
              className="field-input"
            />
          </Field>
          <Field label="PSČ" htmlFor="postalCode">
            <input
              id="postalCode"
              name="postalCode"
              defaultValue={profile.postalCode ?? ""}
              className="field-input"
            />
          </Field>
          <Field label="Dojedu do (km)" htmlFor="radiusKm" error={state.fieldErrors?.radiusKm}>
            <input
              id="radiusKm"
              name="radiusKm"
              type="number"
              min={1}
              max={100}
              defaultValue={profile.radiusKm}
              className="field-input"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Praxe (roky)"
            htmlFor="yearsExperience"
            error={state.fieldErrors?.yearsExperience}
          >
            <input
              id="yearsExperience"
              name="yearsExperience"
              type="number"
              min={0}
              max={60}
              defaultValue={profile.yearsExperience}
              className="field-input"
            />
          </Field>
          <Field
            label="Hodinová sazba (Kč)"
            htmlFor="hourlyRate"
            error={state.fieldErrors?.hourlyRate}
            hint="Kolik si účtujete. Platí vám klient přímo, my si z toho nic nebereme."
            required
          >
            <input
              id="hourlyRate"
              name="hourlyRate"
              type="number"
              min={150}
              step={10}
              defaultValue={Math.round(profile.hourlyRate / 100)}
              required
              className="field-input"
            />
          </Field>
        </div>

        <fieldset>
          <legend className="field-label">Co nabízím</legend>
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
                  defaultChecked={profile.services.some((s) => s.service === service)}
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

        <fieldset>
          <legend className="field-label">Jazyky</legend>
          <div className="space-y-2">
            {LANGUAGES.map((code) => {
              const checked = selectedLanguages.includes(code);
              return (
                <div
                  key={code}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-100 px-3 py-2.5"
                >
                  <label className="flex w-40 cursor-pointer items-center gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      name="languages[]"
                      value={code}
                      checked={checked}
                      onChange={(e) =>
                        setSelectedLanguages((prev) =>
                          e.target.checked ? [...prev, code] : prev.filter((c) => c !== code),
                        )
                      }
                      className="size-4 rounded border-ink-300"
                    />
                    {LANGUAGE_LABELS[code]}
                  </label>

                  {checked && (
                    <select
                      name={`level_${code}`}
                      defaultValue={levelOf(code)}
                      className="field-input w-48 py-1.5 text-sm"
                    >
                      {LANGUAGE_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {LANGUAGE_LEVEL_LABELS[level]}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
          {state.fieldErrors?.languages && (
            <p className="field-error">{state.fieldErrors.languages}</p>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="field-label">Další informace</legend>
          {[
            ["hasOwnSupplies", "Vozím vlastní čisticí prostředky", profile.hasOwnSupplies],
            ["hasCar", "Mám vlastní auto", profile.hasCar],
            ["invoices", "Fakturuji (mám IČO)", profile.invoices],
            ["acceptingWork", "Aktuálně beru nové zakázky", profile.acceptingWork],
          ].map(([name, label, checked]) => (
            <label key={name as string} className="flex items-center gap-2.5 text-sm text-ink-800">
              <input
                type="checkbox"
                name={name as string}
                defaultChecked={checked as boolean}
                className="size-4 rounded border-ink-300"
              />
              {label as string}
            </label>
          ))}
        </fieldset>

        <SubmitButton pendingLabel="Ukládám…">Uložit profil</SubmitButton>
      </form>
    </Card>
  );
}
