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
    const yearParam = searchParams.get("year")
    const monthParam = searchParams.get("month")
    const childId = searchParams.get("childId")

    if (!yearParam || !monthParam) {
      return NextResponse.json(
        { error: "Parametry year a month jsou povinné." },
        { status: 400 }
      )
    }

    const year = parseInt(yearParam, 10)
    const month = parseInt(monthParam, 10) // 1-12

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Neplatné parametry year nebo month." }, { status: 400 })
    }

    // Build date range for the month (UTC)
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59))

    // Get children IDs that belong to the family
    const familyChildren = await prisma.child.findMany({
      where: { familyId: user.familyId },
      select: { id: true },
    })
    const familyChildIds = familyChildren.map((c) => c.id)

    const whereClause: {
      date: { gte: Date; lte: Date }
      childId?: string | { in: string[] }
    } = {
      date: { gte: startDate, lte: endDate },
    }

    if (childId) {
      if (!familyChildIds.includes(childId)) {
        return NextResponse.json(
          { error: "Dítě nepatří do vaší rodiny." },
          { status: 403 }
        )
      }
      whereClause.childId = childId
    } else {
      whereClause.childId = { in: familyChildIds }
    }

    const custodyDays = await prisma.custodyDay.findMany({
      where: whereClause,
      orderBy: { date: "asc" },
    })

    return NextResponse.json({ days: custodyDays })
  } catch (error) {
    console.error("GET /api/custody error:", error)
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

    // Support both single day { date, parentId, childId } and bulk { days: [...] }
    const days: Array<{ date: string; parentId: string; childId: string }> =
      Array.isArray(body.days) ? body.days : [{ date: body.date, parentId: body.parentId ?? "", childId: body.childId }]

    if (days.length === 0) {
      return NextResponse.json({ error: "Žádná data." }, { status: 400 })
    }

    // Validate all children belong to the family
    const familyChildren = await prisma.child.findMany({
      where: { familyId: user.familyId },
      select: { id: true },
    })
    const familyChildIds = new Set(familyChildren.map((c) => c.id))

    for (const day of days) {
      if (!day.date || !day.childId) {
        return NextResponse.json(
          { error: "Každý záznam musí obsahovat date a childId." },
          { status: 400 }
        )
      }
      if (!familyChildIds.has(day.childId)) {
        return NextResponse.json(
          { error: `Dítě ${day.childId} nepatří do vaší rodiny.` },
          { status: 403 }
        )
      }
    }

    const results = await Promise.all(
      days.map(async (day) => {
        const dateObj = new Date(day.date)
        const dateNoon = new Date(
          Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate(), 12, 0, 0)
        )
        if (!day.parentId) {
          // Delete custody assignment
          await prisma.custodyDay.deleteMany({
            where: { date: dateNoon, childId: day.childId },
          })
          return null
        }
        return prisma.custodyDay.upsert({
          where: { date_childId: { date: dateNoon, childId: day.childId } },
          update: { parentId: day.parentId },
          create: { date: dateNoon, parentId: day.parentId, childId: day.childId, isOvernight: true },
        })
      })
    )

    return NextResponse.json({ days: results.filter(Boolean), count: results.length })
  } catch (error) {
    console.error("POST /api/custody error:", error)
    return NextResponse.json({ error: "Nepodařilo se uložit dny péče." }, { status: 500 })
  }
}
