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
      select: { familyId: true },
    })

    if (!user?.familyId) {
      return NextResponse.json({ error: "Nemáte přiřazenou rodinu." }, { status: 404 })
    }

    const family = await prisma.family.findUnique({
      where: { id: user.familyId },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            color: true,
            birthDate: true,
          },
        },
      },
    })

    if (!family) {
      return NextResponse.json({ error: "Rodina nebyla nalezena." }, { status: 404 })
    }

    const currentUser = family.members.find((m) => m.id === session.user?.id)
    const payload = {
      id: family.id,
      name: family.name,
      children: family.children,
      members: family.members,
      currentUser,
    }
    // Return both flat (for calendar/expenses pages) and nested (for settings page)
    return NextResponse.json({ ...payload, family: payload })
  } catch (error) {
    console.error("GET /api/family error:", error)
    return NextResponse.json({ error: "Interní chyba serveru." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nejste přihlášeni." }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body as { name: string }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Název rodiny je povinný." }, { status: 400 })
    }

    const family = await prisma.family.create({
      data: {
        name: name.trim(),
        members: {
          connect: { id: session.user.id },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        children: true,
      },
    })

    // Update user's familyId
    await prisma.user.update({
      where: { id: session.user.id },
      data: { familyId: family.id },
    })

    return NextResponse.json({ family }, { status: 201 })
  } catch (error) {
    console.error("POST /api/family error:", error)
    return NextResponse.json({ error: "Nepodařilo se vytvořit rodinu." }, { status: 500 })
  }
}
