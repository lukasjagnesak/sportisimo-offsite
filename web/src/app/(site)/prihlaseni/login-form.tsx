"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { idle } from "@/lib/actions/types";
import { Alert, Card, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, idle);

  return (
    <Card className="mt-8 p-6">
      <form action={formAction} className="space-y-4">
        {state.error && <Alert tone="error">{state.error}</Alert>}

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

        <Field label="Heslo" htmlFor="password" error={state.fieldErrors?.password} required>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="field-input"
          />
        </Field>

        <SubmitButton className="w-full" pendingLabel="Přihlašuji…">
          Přihlásit se
        </SubmitButton>
      </form>
    </Card>
  );
}
