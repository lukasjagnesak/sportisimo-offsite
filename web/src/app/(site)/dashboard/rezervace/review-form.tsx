"use client";

import { useActionState, useState } from "react";
import { createReviewAction } from "@/lib/actions/bookings";
import { idle } from "@/lib/actions/types";
import { Alert, Field, cx } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

const criteria = [
  { name: "rating", label: "Celkově" },
  { name: "quality", label: "Kvalita" },
  { name: "punctuality", label: "Dochvilnost" },
  { name: "communication", label: "Komunikace" },
] as const;

function StarPicker({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-ink-700">{label}</span>
      <input type="hidden" name={name} value={value} />
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${label}: ${star} z 5`}
            className={cx(
              "px-0.5 text-xl leading-none transition",
              star <= value ? "text-sand-500" : "text-ink-200 hover:text-sand-300",
            )}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [state, formAction] = useActionState(createReviewAction, idle);
  const [scores, setScores] = useState<Record<string, number>>({
    rating: 5,
    quality: 5,
    punctuality: 5,
    communication: 5,
  });
  const [open, setOpen] = useState(false);

  if (state.ok) {
    return (
      <div className="mt-4">
        <Alert tone="success">{state.message}</Alert>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 text-sm font-medium text-ink-700 underline hover:text-ink-900"
      >
        Ohodnotit tuto návštěvu
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-5 space-y-4 border-t border-ink-100 pt-5">
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <div className="space-y-2">
        {criteria.map((c) => (
          <StarPicker
            key={c.name}
            name={c.name}
            label={c.label}
            value={scores[c.name]}
            onChange={(v) => setScores((prev) => ({ ...prev, [c.name]: v }))}
          />
        ))}
      </div>

      <Field label="Komentář" htmlFor={`comment-${bookingId}`} error={state.fieldErrors?.comment}>
        <textarea
          id={`comment-${bookingId}`}
          name="comment"
          rows={3}
          className="field-input"
          placeholder="Co se povedlo, co příště jinak?"
        />
      </Field>

      <SubmitButton size="sm" pendingLabel="Ukládám…">
        Odeslat hodnocení
      </SubmitButton>
    </form>
  );
}
