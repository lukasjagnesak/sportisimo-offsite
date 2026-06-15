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

    const whereClause: {
      familyId: string
      date?: { gte: Date; lte: Date }
      childId?: string
    } = {
      familyId: user.familyId,
    }

    if (yearParam && monthParam) {
      const year = parseInt(yearParam, 10)
      const month = parseInt(monthParam, 10) // 1-12

      if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
        whereClause.date = {
          gte: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)),
          lte: new Date(Date.UTC(year, month, 0, 23, 59, 59)),
        }
      }
    }

    if (childId) {
      whereClause.childId = childId
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        paidBy: {
          select: { name: true, email: true },
        },
        child: {
          select: { name: true, color: true },
        },
      },
      orderBy: { date: "desc" },
    })

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error("GET /api/expenses error:", error)
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
      amount,
      category,
      description,
      date,
      childId,
      receiptUrl,
    } = body as {
      amount: number
      category: string
      description?: string
      date: string
      childId?: string
      receiptUrl?: string
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Částka musí být kladné číslo." }, { status: 400 })
    }

    if (!category || typeof category !== "string") {
      return NextResponse.json({ error: "Kategorie je povinná." }, { status: 400 })
    }

    if (!date || typeof date !== "string") {
      return NextResponse.json({ error: "Datum je povinné." }, { status: 400 })
    }

    // Validate childId belongs to family if provided
    if (childId) {
      const child = await prisma.child.findFirst({
        where: { id: childId, familyId: user.familyId },
      })
      if (!child) {
        return NextResponse.json(
          { error: "Dítě nepatří do vaší rodiny." },
          { status: 403 }
        )
      }
    }

    const expense = await prisma.expense.create({
      data: {
        amount,
        category,
        description: description ?? null,
        date: new Date(date),
        receiptUrl: receiptUrl ?? null,
        paidById: session.user.id,
        childId: childId ?? null,
        familyId: user.familyId,
      },
      include: {
        paidBy: {
          select: { name: true, email: true },
        },
        child: {
          select: { name: true, color: true },
        },
      },
    })

    return NextResponse.json({ expense }, { status: 201 })
  } catch (error) {
    console.error("POST /api/expenses error:", error)
    return NextResponse.json({ error: "Nepodařilo se vytvořit výdaj." }, { status: 500 })
  }
}
