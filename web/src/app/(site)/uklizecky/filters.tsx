"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Card, Field } from "@/components/ui";
import { LANGUAGES, LANGUAGE_LABELS, SERVICES, SERVICE_LABELS } from "@/lib/constants";
import type { CleanerFilters } from "@/lib/queries/cleaners";

/**
 * Filtry zapisují stav do URL – výsledek jde sdílet odkazem a funguje
 * i tlačítko zpět. Vlastní dotaz běží na serveru.
 */
export function CleanerFiltersForm({ filters }: { filters: CleanerFilters }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);

    startTransition(() => router.push(`/uklizecky?${next.toString()}`, { scroll: false }));
  }

  return (
    <Card className={`h-fit p-5 lg:sticky lg:top-20 ${pending ? "opacity-60" : ""}`}>
      <div className="space-y-4">
        <Field label="Město" htmlFor="mesto">
          <input
            id="mesto"
            className="field-input"
            defaultValue={filters.city ?? ""}
            placeholder="Praha"
            onBlur={(e) => update("mesto", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") update("mesto", e.currentTarget.value);
            }}
          />
        </Field>

        <Field label="Služba" htmlFor="sluzba">
          <select
            id="sluzba"
            className="field-input"
            value={filters.service ?? ""}
            onChange={(e) => update("sluzba", e.target.value)}
          >
            <option value="">Všechny služby</option>
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {SERVICE_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Jazyk" htmlFor="jazyk">
          <select
            id="jazyk"
            className="field-input"
            value={filters.language ?? ""}
            onChange={(e) => update("jazyk", e.target.value)}
          >
            <option value="">Nezáleží</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {LANGUAGE_LABELS[l]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Minimální hodnocení" htmlFor="hodnoceni">
          <select
            id="hodnoceni"
            className="field-input"
            value={filters.minRating ?? ""}
            onChange={(e) => update("hodnoceni", e.target.value)}
          >
            <option value="">Nezáleží</option>
            <option value="4.5">4,5 a více</option>
            <option value="4">4,0 a více</option>
            <option value="3.5">3,5 a více</option>
          </select>
        </Field>

        <Field label="Cena do (Kč/h)" htmlFor="cena">
          <input
            id="cena"
            type="number"
            min={100}
            step={10}
            className="field-input"
            defaultValue={filters.maxPrice ?? ""}
            placeholder="např. 400"
            onBlur={(e) => update("cena", e.target.value)}
          />
        </Field>

        <Field label="Praxe alespoň" htmlFor="praxe">
          <select
            id="praxe"
            className="field-input"
            value={filters.minExperience ?? ""}
            onChange={(e) => update("praxe", e.target.value)}
          >
            <option value="">Nezáleží</option>
            <option value="2">2 roky</option>
            <option value="5">5 let</option>
            <option value="10">10 let</option>
          </select>
        </Field>

        <label className="flex items-center gap-2.5 text-sm text-ink-800">
          <input
            type="checkbox"
            className="size-4 rounded border-ink-300"
            checked={filters.verifiedOnly ?? false}
            onChange={(e) => update("overene", e.target.checked ? "1" : "")}
          />
          Jen ověřené profily
        </label>

        <Field label="Řadit podle" htmlFor="razeni">
          <select
            id="razeni"
            className="field-input"
            value={filters.sort ?? "rating"}
            onChange={(e) => update("razeni", e.target.value)}
          >
            <option value="rating">Nejlepší hodnocení</option>
            <option value="price">Nejnižší cena</option>
            <option value="experience">Nejvíc zkušeností</option>
          </select>
        </Field>

        <button
          type="button"
          onClick={() => startTransition(() => router.push("/uklizecky"))}
          className="w-full rounded-lg border border-ink-200 py-2 text-sm text-ink-700 hover:bg-ink-50"
        >
          Zrušit filtry
        </button>
      </div>
    </Card>
  );
}
