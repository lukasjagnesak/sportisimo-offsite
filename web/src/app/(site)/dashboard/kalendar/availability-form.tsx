"use client";

import { useActionState, useState } from "react";
import { saveAvailabilityAction } from "@/lib/actions/bookings";
import { idle } from "@/lib/actions/types";
import { Alert, Card } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { WEEKDAYS } from "@/lib/constants";
import { formatMinutes } from "@/lib/format";

type Block = { id: string; weekday: number; startMin: number; endMin: number };

export function AvailabilityForm({ availability }: { availability: Block[] }) {
  const [state, formAction] = useActionState(saveAvailabilityAction, idle);

  // Stav držíme lokálně, aby odškrtnutý den hned skryl časy.
  const [days, setDays] = useState(() =>
    WEEKDAYS.map((day) => {
      const block = availability.find((a) => a.weekday === day.value);
      return {
        weekday: day.value,
        label: day.label,
        enabled: Boolean(block),
        from: formatMinutes(block?.startMin ?? 8 * 60),
        to: formatMinutes(block?.endMin ?? 16 * 60),
      };
    }),
  );

  function patch(weekday: number, patchValue: Partial<(typeof days)[number]>) {
    setDays((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, ...patchValue } : d)));
  }

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-ink-900">Běžný týden</h2>
      <p className="mt-1 text-sm text-ink-600">
        Odškrtnutý den znamená volno. Jednorázové výjimky řešte níž.
      </p>

      <form action={formAction} className="mt-5 space-y-3">
        {state.error && <Alert tone="error">{state.error}</Alert>}
        {state.ok && <Alert tone="success">{state.message}</Alert>}

        {days.map((day) => (
          <div
            key={day.weekday}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-100 px-4 py-3"
          >
            <label className="flex w-32 items-center gap-2.5 text-sm font-medium text-ink-800">
              <input
                type="checkbox"
                checked={day.enabled}
                onChange={(e) => patch(day.weekday, { enabled: e.target.checked })}
                className="size-4 rounded border-ink-300"
              />
              {day.label}
            </label>

            {day.enabled ? (
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="time"
                  name={`from_${day.weekday}`}
                  value={day.from}
                  onChange={(e) => patch(day.weekday, { from: e.target.value })}
                  className="field-input w-32 py-1.5"
                />
                <span className="text-ink-500">–</span>
                <input
                  type="time"
                  name={`to_${day.weekday}`}
                  value={day.to}
                  onChange={(e) => patch(day.weekday, { to: e.target.value })}
                  className="field-input w-32 py-1.5"
                />
              </div>
            ) : (
              <span className="text-sm text-ink-500">volno</span>
            )}
          </div>
        ))}

        <SubmitButton pendingLabel="Ukládám…">Uložit dostupnost</SubmitButton>
      </form>
    </Card>
  );
}
