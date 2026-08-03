import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Registrace" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  if (await getCurrentUser()) redirect("/dashboard");

  const { role } = await searchParams;
  const initialRole = role === "CLEANER" ? "CLEANER" : "CLIENT";

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Vytvoření účtu</h1>
      <p className="mt-2 text-ink-600">
        Registrace je zdarma. Poplatek platíte, až když si vyberete konkrétní uklízečku.
      </p>

      <RegisterForm initialRole={initialRole} />

      <p className="mt-6 text-center text-sm text-ink-600">
        Už máte účet?{" "}
        <Link href="/prihlaseni" className="font-medium text-ink-800 hover:underline">
          Přihlaste se
        </Link>
      </p>
    </div>
  );
}
