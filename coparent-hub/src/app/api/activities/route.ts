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
      return NextResponse.json({ error: "Nemáte přiřazenou rodinu." }, { status: 400 })
    }

    const activities = await prisma.activity.findMany({
      where: { familyId: user.familyId },
      include: {
        child: {
          select: { name: true, color: true },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    })

    return NextResponse.json({ activities })
  } catch (error) {
    console.error("GET /api/activities error:", error)
    return NextResponse.json({ error: "Interní chyba serveru." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: "Nemáte přiřazenou rodinu." }, { status: 400 })
    }

    const body = await request.json()
    const {
      name,
      location,
      dayOfWeek,
      startTime,
      endTime,
      color,
      childId,
    } = body as {
      name: string
      location?: string
      dayOfWeek: number
      startTime: string
      endTime: string
      color?: string
      childId: string
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Název aktivity je povinný." }, { status: 400 })
    }

    if (dayOfWeek === undefined || dayOfWeek === null || typeof dayOfWeek !== "number") {
      return NextResponse.json({ error: "Den v týdnu je povinný." }, { status: 400 })
    }

    if (!startTime || !endTime) {
      return NextResponse.json({ error: "Čas začátku a konce je povinný." }, { status: 400 })
    }

    if (!childId || typeof childId !== "string") {
      return NextResponse.json({ error: "Dítě je povinné." }, { status: 400 })
    }

    // Verify child belongs to the family
    const child = await prisma.child.findFirst({
      where: { id: childId, familyId: user.familyId },
    })

    if (!child) {
      return NextResponse.json(
        { error: "Dítě nepatří do vaší rodiny." },
        { status: 403 }
      )
    }

    const activity = await prisma.activity.create({
      data: {
        name: name.trim(),
        location: location ?? null,
        dayOfWeek,
        startTime,
        endTime,
        color: color ?? "#8b5cf6",
        familyId: user.familyId,
        childId,
      },
      include: {
        child: {
          select: { name: true, color: true },
        },
      },
    })

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    console.error("POST /api/activities error:", error)
    return NextResponse.json({ error: "Nepodařilo se vytvořit aktivitu." }, { status: 500 })
  }
}
