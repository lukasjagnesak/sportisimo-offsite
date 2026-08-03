import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Alert, PageHeader } from "@/components/ui";
import { JobRequestForm } from "./form";

export const metadata = { title: "Nová poptávka" };

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ vitejte?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/registrace?role=CLIENT");
  if (user.role !== "CLIENT") redirect("/poptavky");

  const { vitejte } = await searchParams;

  // Předvyplníme adresu z profilu, ať klient nepíše totéž podruhé.
  const profile = await prisma.clientProfile.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageHeader
        title="Zadejte poptávku"
        description="Čím konkrétnější popis, tím přesnější nabídky dostanete. Adresu uvidí jen ten, koho si vyberete."
      />

      {vitejte && (
        <div className="mb-6">
          <Alert tone="success">
            Účet je založený. Zadejte první poptávku – je to zdarma a nezávazné.
          </Alert>
        </div>
      )}

      <JobRequestForm profile={profile} />
    </div>
  );
}
