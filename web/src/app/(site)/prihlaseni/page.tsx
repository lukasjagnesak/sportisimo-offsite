import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Přihlášení" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Přihlášení</h1>
      <p className="mt-2 text-ink-600">Vítejte zpátky.</p>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-ink-600">
        Ještě nemáte účet?{" "}
        <Link href="/registrace" className="font-medium text-ink-800 hover:underline">
          Vytvořte si ho
        </Link>
      </p>
    </div>
  );
}
