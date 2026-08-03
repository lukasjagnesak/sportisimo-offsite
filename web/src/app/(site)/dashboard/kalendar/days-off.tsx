import { addDayOffAction, removeDayOffAction } from "@/lib/actions/bookings";
import { Button, Card, Field } from "@/components/ui";
import { formatDate } from "@/lib/format";

type Exception = { id: string; date: Date; note: string | null };

export function DaysOff({ exceptions }: { exceptions: Exception[] }) {
  return (
    <Card className="p-6">
      <h2 className="font-semibold text-ink-900">Dovolená a jednorázové volno</h2>
      <p className="mt-1 text-sm text-ink-600">
        Vybraný den zmizí z kalendáře, i když v něm běžně pracujete.
      </p>

      <form action={addDayOffAction} className="mt-5 flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Field label="Datum" htmlFor="date">
            <input
              id="date"
              name="date"
              type="date"
              required
              min={new Date().toISOString().slice(0, 10)}
              className="field-input"
            />
          </Field>
        </div>
        <div className="min-w-48 flex-1">
          <Field label="Poznámka" htmlFor="note">
            <input id="note" name="note" className="field-input" placeholder="Dovolená" />
          </Field>
        </div>
        <Button type="submit" variant="outline">
          Přidat volno
        </Button>
      </form>

      {exceptions.length > 0 && (
        <ul className="mt-5 space-y-2">
          {exceptions.map((exception) => (
            <li
              key={exception.id}
              className="flex items-center justify-between rounded-lg bg-ink-50 px-4 py-2.5 text-sm"
            >
              <span className="text-ink-800">
                {formatDate(exception.date)}
                {exception.note && <span className="text-ink-500"> · {exception.note}</span>}
              </span>
              <form action={removeDayOffAction}>
                <input type="hidden" name="exceptionId" value={exception.id} />
                <button type="submit" className="text-ink-500 hover:text-red-600">
                  Zrušit
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
