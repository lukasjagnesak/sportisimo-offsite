import Link from "next/link";
import { Avatar, Badge, Card, Stars } from "./ui";
import { formatCzk, formatRating, pluralCz } from "@/lib/format";
import {
  LANGUAGE_LABELS,
  SERVICE_LABELS,
  type Language,
  type Service,
} from "@/lib/constants";

type CleanerCardData = {
  id: string;
  city: string;
  headline: string | null;
  hourlyRate: number;
  yearsExperience: number;
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
  verified: boolean;
  hasOwnSupplies: boolean;
  hasCar: boolean;
  user: { firstName: string; lastName: string };
  services: { id: string; service: string }[];
  languages: { id: string; language: string }[];
};

export function CleanerCard({ cleaner }: { cleaner: CleanerCardData }) {
  return (
    <Card className="flex flex-col p-5 transition hover:border-ink-300">
      <div className="flex items-start gap-4">
        <Avatar firstName={cleaner.user.firstName} lastName={cleaner.user.lastName} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-ink-900">
              {cleaner.user.firstName} {cleaner.user.lastName}
            </h3>
            {cleaner.verified && <Badge tone="success">Ověřeno</Badge>}
          </div>

          {/* Oddělovač drží u města, aby po zalomení řádku nezůstal viset sám. */}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-ink-600">
            {cleaner.ratingCount > 0 ? (
              <span className="flex items-center gap-1.5">
                <Stars value={cleaner.ratingAvg} size="sm" />
                <span className="font-medium text-ink-900">
                  {formatRating(cleaner.ratingAvg)}
                </span>
                <span>
                  ({cleaner.ratingCount}{" "}
                  {pluralCz(cleaner.ratingCount, "hodnocení", "hodnocení", "hodnocení")})
                </span>
              </span>
            ) : (
              <span className="text-ink-500">Zatím bez hodnocení</span>
            )}
            <span>{cleaner.city}</span>
          </div>
        </div>

        <div className="text-right">
          <p className="font-semibold text-ink-900">{formatCzk(cleaner.hourlyRate)}</p>
          <p className="text-xs text-ink-500">za hodinu</p>
        </div>
      </div>

      {cleaner.headline && (
        <p className="mt-4 line-clamp-2 text-sm text-ink-700">{cleaner.headline}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {cleaner.services.slice(0, 4).map((s) => (
          <Badge key={s.id}>{SERVICE_LABELS[s.service as Service]}</Badge>
        ))}
        {cleaner.services.length > 4 && <Badge>+{cleaner.services.length - 4}</Badge>}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
        <span>{cleaner.yearsExperience} let praxe</span>
        <span>{cleaner.completedJobs} dokončených úklidů</span>
        <span>
          {cleaner.languages.map((l) => LANGUAGE_LABELS[l.language as Language]).join(", ")}
        </span>
        {cleaner.hasOwnSupplies && <span>Vlastní drogerie</span>}
        {cleaner.hasCar && <span>Vlastní auto</span>}
      </div>

      <Link
        href={`/uklizecky/${cleaner.id}`}
        className="mt-5 rounded-lg border border-ink-200 py-2 text-center text-sm font-medium text-ink-800 transition hover:border-ink-400 hover:bg-ink-50"
      >
        Zobrazit profil
      </Link>
    </Card>
  );
}
