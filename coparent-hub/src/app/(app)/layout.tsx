import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { BottomNav } from "@/components/BottomNav"
import { TopHeader } from "@/components/TopHeader"
import { prisma } from "@/lib/prisma"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      family: {
        include: {
          children: { orderBy: { name: "asc" } },
          members: { select: { id: true, name: true, role: true } },
        },
      },
    },
  })

  if (!user?.familyId) redirect("/onboarding")

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopHeader user={session.user} family={user.family} />
      <main className="flex-1 pb-20 max-w-lg mx-auto w-full">{children}</main>
      <BottomNav />
    </div>
  )
}
