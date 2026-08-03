"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerAction } from "@/lib/actions/auth";
import { idle } from "@/lib/actions/types";
import { Alert, Card, Field, cx } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

const roleOptions = [
  {
    value: "CLIENT",
    title: "Hledám úklid",
    body: "Zadám poptávku a vyberu si z reakcí.",
  },
  {
    value: "CLEANER",
    title: "Nabízím úklid",
    body: "Chci dostávat poptávky ve svém okolí.",
  },
] as const;

export function RegisterForm({ initialRole }: { initialRole: "CLIENT" | "CLEANER" }) {
  const [state, formAction] = useActionState(registerAction, idle);
  const [role, setRole] = useState<"CLIENT" | "CLEANER">(initialRole);

  return (
    <Card className="mt-8 p-6">
      <form action={formAction} className="space-y-5">
        {state.error && <Alert tone="error">{state.error}</Alert>}

        <fieldset>
          <legend className="field-label">Jsem tu jako</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {roleOptions.map((option) => (
              <label
                key={option.value}
                className={cx(
                  "cursor-pointer rounded-xl border-2 p-4 transition",
                  role === option.value
                    ? "border-ink-600 bg-ink-50"
                    : "border-ink-100 hover:border-ink-300",
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                  className="sr-only"
                />
                <span className="block font-medium text-ink-900">{option.title}</span>
                <span className="mt-1 block text-sm text-ink-600">{option.body}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Jméno" htmlFor="firstName" error={state.fieldErrors?.firstName} required>
            <input id="firstName" name="firstName" required className="field-input" />
          </Field>
          <Field label="Příjmení" htmlFor="lastName" error={state.fieldErrors?.lastName} required>
            <input id="lastName" name="lastName" required className="field-input" />
          </Field>
        </div>

        <Field label="E-mail" htmlFor="email" error={state.fieldErrors?.email} required>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="field-input"
            placeholder="vas@email.cz"
          />
        </Field>

        <Field
          label="Telefon"
          htmlFor="phone"
          error={state.fieldErrors?.phone}
          hint="Nezveřejňujeme ho. Protistrana ho uvidí až po vzájemném propojení."
        >
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="field-input"
            placeholder="+420 777 123 456"
          />
        </Field>

        <Field
          label={role === "CLEANER" ? "Město, kde pracujete" : "Město"}
          htmlFor="city"
          error={state.fieldErrors?.city}
          required={role === "CLEANER"}
        >
          <input
            id="city"
            name="city"
            required={role === "CLEANER"}
            className="field-input"
            placeholder="Praha"
          />
        </Field>

        <Field
          label="Heslo"
          htmlFor="password"
          error={state.fieldErrors?.password}
          hint="Alespoň 8 znaků."
          required
        >
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="field-input"
          />
        </Field>

        <div>
          <label className="flex items-start gap-3 text-sm text-ink-700">
            <input
              type="checkbox"
              name="consent"
              required
              className="mt-0.5 size-4 rounded border-ink-300"
            />
            <span>
              Souhlasím s{" "}
              <Link href="/podminky" className="font-medium text-ink-900 hover:underline">
                obchodními podmínkami
              </Link>{" "}
              a beru na vědomí{" "}
              <Link href="/soukromi" className="font-medium text-ink-900 hover:underline">
                zpracování osobních údajů
              </Link>
              .
            </span>
          </label>
          {state.fieldErrors?.consent && <p className="field-error">{state.fieldErrors.consent}</p>}
        </div>

        <SubmitButton className="w-full" pendingLabel="Zakládám účet…">
          Vytvořit účet
        </SubmitButton>
      </form>
    </Card>
  );
}
