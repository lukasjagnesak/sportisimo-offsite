import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface ChildInput {
  name: string
  color: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nejste přihlášeni." }, { status: 401 })
    }

    const body = await request.json()
    const { familyName, children } = body as { familyName: string; children: ChildInput[] }

    if (!familyName || typeof familyName !== "string" || familyName.trim().length === 0) {
      return NextResponse.json({ error: "Název rodiny je povinný." }, { status: 400 })
    }

    if (!Array.isArray(children) || children.length === 0) {
      return NextResponse.json({ error: "Přidejte alespoň jedno dítě." }, { status: 400 })
    }

    const validChildren = children.filter(
      (c) => c.name && typeof c.name === "string" && c.name.trim().length > 0
    )

    if (validChildren.length === 0) {
      return NextResponse.json({ error: "Zadejte jméno alespoň jednoho dítěte." }, { status: 400 })
    }

    // Check if user already has a family
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyId: true },
    })

    if (existingUser?.familyId) {
      return NextResponse.json({ error: "Již máte přiřazenou rodinu." }, { status: 400 })
    }

    // Create family with children and connect user
    const family = await prisma.family.create({
      data: {
        name: familyName.trim(),
        members: {
          connect: { id: session.user.id },
        },
        children: {
          create: validChildren.map((c) => ({
            name: c.name.trim(),
            color: c.color || "#6366f1",
          })),
        },
      },
      include: {
        children: true,
        members: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    // Update user's familyId
    await prisma.user.update({
      where: { id: session.user.id },
      data: { familyId: family.id },
    })

    return NextResponse.json({ family }, { status: 201 })
  } catch (error) {
    console.error("POST /api/onboarding error:", error)
    return NextResponse.json({ error: "Nepodařilo se vytvořit rodinu." }, { status: 500 })
  }
}
