"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./ui";
import type { ComponentProps } from "react";

/** Tlačítko, které samo hlídá stav odesílání formuláře. */
export function SubmitButton({
  children,
  pendingLabel = "Odesílám…",
  disabled,
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" {...props} disabled={pending || disabled}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
