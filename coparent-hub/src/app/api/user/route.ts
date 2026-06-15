import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nejste přihlášeni." }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        telegramChatId: true,
        familyId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Uživatel nebyl nalezen." }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("GET /api/user error:", error)
    return NextResponse.json({ error: "Interní chyba serveru." }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nejste přihlášeni." }, { status: 401 })
    }

    const body = await request.json()
    const { name, telegramChatId } = body as { name?: string; telegramChatId?: string }

    const updateData: { name?: string; telegramChatId?: string | null } = {}

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Jméno nemůže být prázdné." }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (telegramChatId !== undefined) {
      updateData.telegramChatId =
        typeof telegramChatId === "string" && telegramChatId.trim().length > 0
          ? telegramChatId.trim()
          : null
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        telegramChatId: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("PATCH /api/user error:", error)
    return NextResponse.json({ error: "Nepodařilo se aktualizovat profil." }, { status: 500 })
  }
}
