import { findCleaners, parseFilters } from "@/lib/queries/cleaners";
import { CleanerCard } from "@/components/cleaner-card";
import { EmptyState, PageHeader } from "@/components/ui";
import { CleanerFiltersForm } from "./filters";
import { pluralCz } from "@/lib/format";

export const metadata = {
  title: "Uklízečky a uklízeči",
  description:
    "Prohlédněte si profily prověřených uklízeček – hodnocení, jazyky, zkušenosti, ceny i volné termíny.",
};

export const dynamic = "force-dynamic";

export default async function CleanersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const cleaners = await findCleaners(filters);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="Uklízečky a uklízeči"
        description="Filtrujte podle jazyka, zkušeností i hodnocení. Kontakt se odemyká až po propojení přes poptávku."
      />

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <CleanerFiltersForm filters={filters} />

        <div>
          <p className="mb-4 text-sm text-ink-600">
            {cleaners.length}{" "}
            {pluralCz(cleaners.length, "výsledek", "výsledky", "výsledků")}
          </p>

          {cleaners.length === 0 ? (
            <EmptyState
              title="Nikoho jsme nenašli"
              description="Zkuste rozvolnit filtry – třeba zvýšit maximální cenu nebo vypnout požadavek na ověřený profil."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {cleaners.map((cleaner) => (
                <CleanerCard key={cleaner.id} cleaner={cleaner} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
