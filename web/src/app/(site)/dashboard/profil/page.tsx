import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Alert, PageHeader } from "@/components/ui";
import { ClientProfileForm } from "./client-form";
import { CleanerProfileForm } from "./cleaner-form";

export const metadata = { title: "Můj profil" };
export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ vitejte?: string }>;
}) {
  const user = await requirePageUser();
  const { vitejte } = await searchParams;

  if (user.role === "CLEANER") {
    const profile = await prisma.cleanerProfile.findUnique({
      where: { userId: user.id },
      include: { services: true, languages: true },
    });

    return (
      <>
        <PageHeader
          title="Můj profil"
          description="Tohle vidí klienti, když zvažují vaši nabídku. Vyplatí se být konkrétní."
        />
        {vitejte && (
          <div className="mb-6">
            <Alert tone="success">
              Vítejte. Doplňte profil — s vyplněnými zkušenostmi a jazyky dostáváte výrazně víc
              reakcí.
            </Alert>
          </div>
        )}
        {profile && <CleanerProfileForm user={user} profile={profile} />}
      </>
    );
  }

  const profile = await prisma.clientProfile.findUnique({ where: { userId: user.id } });

  return (
    <>
      <PageHeader
        title="Můj profil"
        description="Údaje předvyplníme do poptávek. Adresu vidí jen uklízečka, kterou si vyberete."
      />
      <ClientProfileForm user={user} profile={profile} />
    </>
  );
}
