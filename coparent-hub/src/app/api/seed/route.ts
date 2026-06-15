import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  return POST()
}

export async function POST() {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() // 0-indexed

    // Hash passwords
    const demoHash = bcrypt.hashSync("demo123", 10)
    const mamaHash = bcrypt.hashSync("demo123", 10)

    // Upsert users
    const tomas = await prisma.user.upsert({
      where: { email: "demo@coparent.app" },
      update: {
        name: "Tomáš Novák",
        role: "PARENT",
        image: `hash:${demoHash}`,
      },
      create: {
        email: "demo@coparent.app",
        name: "Tomáš Novák",
        role: "PARENT",
        image: `hash:${demoHash}`,
      },
    })

    const jana = await prisma.user.upsert({
      where: { email: "matka@coparent.app" },
      update: {
        name: "Jana Nováková",
        role: "PARENT",
        image: `hash:${mamaHash}`,
      },
      create: {
        email: "matka@coparent.app",
        name: "Jana Nováková",
        role: "PARENT",
        image: `hash:${mamaHash}`,
      },
    })

    // Create or find family
    let family = await prisma.family.findFirst({
      where: { name: "Rodina Novákovi" },
    })

    if (!family) {
      family = await prisma.family.create({
        data: { name: "Rodina Novákovi" },
      })
    }

    // Assign both users to the family
    await prisma.user.update({
      where: { id: tomas.id },
      data: { familyId: family.id },
    })

    await prisma.user.update({
      where: { id: jana.id },
      data: { familyId: family.id },
    })

    // Create or find children
    let childTomas = await prisma.child.findFirst({
      where: { name: "Tomáš", familyId: family.id },
    })
    if (!childTomas) {
      childTomas = await prisma.child.create({
        data: {
          name: "Tomáš",
          color: "#3b82f6",
          familyId: family.id,
        },
      })
    }

    let childEliska = await prisma.child.findFirst({
      where: { name: "Eliška", familyId: family.id },
    })
    if (!childEliska) {
      childEliska = await prisma.child.create({
        data: {
          name: "Eliška",
          color: "#ec4899",
          familyId: family.id,
        },
      })
    }

    // Generate custody days for current month — alternating weeks
    // Week 1 (Mon–Sun): father, Week 2: mother, Week 3: father, Week 4: mother, etc.
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const custodyUpserts: Promise<unknown>[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      // getDay(): 0=Sun,1=Mon...6=Sat
      // Week number within month (0-indexed) using Monday-based week
      const dayOfWeek = date.getDay() // 0=Sun
      // Find which "week block" this day falls in (0-indexed, resets every Monday)
      const firstDayOfMonth = new Date(year, month, 1).getDay()
      // Offset to Monday-based: Mon=0, Tue=1, ..., Sun=6
      const mondayOffset = (firstDayOfMonth + 6) % 7
      const weekIndex = Math.floor((day - 1 + mondayOffset) / 7)
      const fatherHasDay = weekIndex % 2 === 0

      const dateAtNoon = new Date(Date.UTC(year, month, day, 12, 0, 0))

      for (const child of [childTomas, childEliska]) {
        custodyUpserts.push(
          prisma.custodyDay.upsert({
            where: { date_childId: { date: dateAtNoon, childId: child.id } },
            update: { parentId: fatherHasDay ? tomas.id : jana.id },
            create: {
              date: dateAtNoon,
              parentId: fatherHasDay ? tomas.id : jana.id,
              childId: child.id,
              isOvernight: true,
            },
          })
        )
      }
    }

    await Promise.all(custodyUpserts)

    // Activities
    const existingFootball = await prisma.activity.findFirst({
      where: { name: "Fotbal", familyId: family.id },
    })
    if (!existingFootball) {
      await prisma.activity.create({
        data: {
          name: "Fotbal",
          dayOfWeek: 2,
          startTime: "17:00",
          endTime: "18:30",
          location: "SK Slavia Praha",
          color: "#3b82f6",
          familyId: family.id,
          childId: childTomas.id,
        },
      })
    }

    const existingDance = await prisma.activity.findFirst({
      where: { name: "Tanec", familyId: family.id },
    })
    if (!existingDance) {
      await prisma.activity.create({
        data: {
          name: "Tanec",
          dayOfWeek: 4,
          startTime: "16:00",
          endTime: "17:30",
          location: "Taneční studio",
          color: "#ec4899",
          familyId: family.id,
          childId: childEliska.id,
        },
      })
    }

    // Expenses — 5 expenses in current month
    const expenseData = [
      {
        amount: 1500,
        category: "food",
        description: "Nákup potravin",
        date: new Date(Date.UTC(year, month, 3, 12, 0, 0)),
        childId: childTomas.id,
      },
      {
        amount: 3200,
        category: "clothing",
        description: "Zimní bunda",
        date: new Date(Date.UTC(year, month, 7, 12, 0, 0)),
        childId: childEliska.id,
      },
      {
        amount: 8000,
        category: "health",
        description: "Ortodontista",
        date: new Date(Date.UTC(year, month, 10, 12, 0, 0)),
        childId: childTomas.id,
      },
      {
        amount: 2500,
        category: "education",
        description: "Školní potřeby a kroužky",
        date: new Date(Date.UTC(year, month, 14, 12, 0, 0)),
        childId: childEliska.id,
      },
      {
        amount: 4800,
        category: "activities",
        description: "Sportovní vybavení – fotbal",
        date: new Date(Date.UTC(year, month, 18, 12, 0, 0)),
        childId: childTomas.id,
      },
      {
        amount: 9500,
        category: "maintenance",
        description: "Výživné – červen",
        date: new Date(Date.UTC(year, month, 1, 12, 0, 0)),
        childId: null,
      },
    ]

    for (const expense of expenseData) {
      const exists = await prisma.expense.findFirst({
        where: {
          description: expense.description,
          familyId: family.id,
        },
      })
      if (!exists) {
        await prisma.expense.create({
          data: {
            ...expense,
            paidById: tomas.id,
            familyId: family.id,
          },
        })
      }
    }

    // School events — 3 events in next 30 days
    const today = new Date()
    const schoolEventData = [
      {
        name: "Školní výlet – ZOO Praha",
        type: "TRIP",
        date: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 7, 8, 0, 0)),
        startTime: "08:00",
        endTime: "16:00",
        location: "ZOO Praha",
        description: "Školní výlet do pražské zoologické zahrady.",
        childId: childTomas.id,
      },
      {
        name: "Třídní schůzka",
        type: "MEETING",
        date: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 14, 17, 0, 0)),
        startTime: "17:00",
        endTime: "18:30",
        location: "ZŠ Masarykova, třída 3.B",
        description: "Pravidelná třídní schůzka s třídní učitelkou.",
        childId: childEliska.id,
      },
      {
        name: "Školní fotografování",
        type: "PHOTO",
        date: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 21, 9, 0, 0)),
        startTime: "09:00",
        endTime: "11:00",
        location: "Školní aula",
        description: "Roční školní fotografování — nezapomeňte čistou uniformu.",
        childId: childTomas.id,
      },
    ]

    for (const event of schoolEventData) {
      const exists = await prisma.schoolEvent.findFirst({
        where: { name: event.name, familyId: family.id },
      })
      if (!exists) {
        await prisma.schoolEvent.create({
          data: {
            ...event,
            familyId: family.id,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Demo data byla úspěšně vytvořena.",
      data: {
        familyId: family.id,
        users: [tomas.email, jana.email],
        children: [childTomas.name, childEliska.name],
      },
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { success: false, error: "Nepodařilo se vytvořit demo data." },
      { status: 500 }
    )
  }
}
