import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const upcoming = searchParams.get("upcoming") === "true"

    const whereClause: {
      familyId: string
      date?: { gte: Date }
    } = {
      familyId: user.familyId,
    }

    if (upcoming) {
      whereClause.date = { gte: new Date() }
    }

    const schoolEvents = await prisma.schoolEvent.findMany({
      where: whereClause,
      include: {
        child: {
          select: { name: true, color: true },
        },
      },
      orderBy: { date: "asc" },
    })

    return NextResponse.json({ schoolEvents })
  } catch (error) {
    console.error("GET /api/school-events error:", error)
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
      description,
      date,
      startTime,
      endTime,
      type,
      location,
      childId,
    } = body as {
      name: string
      description?: string
      date: string
      startTime?: string
      endTime?: string
      type: string
      location?: string
      childId: string
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Název události je povinný." }, { status: 400 })
    }

    if (!date || typeof date !== "string") {
      return NextResponse.json({ error: "Datum je povinné." }, { status: 400 })
    }

    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "Typ události je povinný." }, { status: 400 })
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

    const schoolEvent = await prisma.schoolEvent.create({
      data: {
        name: name.trim(),
        description: description ?? null,
        date: new Date(date),
        startTime: startTime ?? null,
        endTime: endTime ?? null,
        type,
        location: location ?? null,
        childId,
        familyId: user.familyId,
      },
      include: {
        child: {
          select: { name: true, color: true },
        },
      },
    })

    return NextResponse.json({ schoolEvent }, { status: 201 })
  } catch (error) {
    console.error("POST /api/school-events error:", error)
    return NextResponse.json({ error: "Nepodařilo se vytvořit školní událost." }, { status: 500 })
  }
}
