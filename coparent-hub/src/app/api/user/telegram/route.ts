import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { chatId } = await req.json()

  await prisma.user.update({
    where: { id: session.user.id },
    data: { telegramChatId: chatId || null },
  })

  return NextResponse.json({ ok: true })
}
