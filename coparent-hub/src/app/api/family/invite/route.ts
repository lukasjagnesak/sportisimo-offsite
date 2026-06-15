import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
      return NextResponse.json(
        { error: "Nemáte přiřazenou rodinu. Nejprve vytvořte rodinu." },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { email, role } = body as { email: string; role?: string }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Zadejte platnou e-mailovou adresu." }, { status: 400 })
    }

    const allowedRoles = ["PARENT", "VIEWER"]
    const inviteRole = role && allowedRoles.includes(role) ? role : "PARENT"

    // Check if invitation already exists for this email + family
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        familyId: user.familyId,
        accepted: false,
      },
    })

    if (existingInvitation) {
      return NextResponse.json({
        invitation: {
          id: existingInvitation.id,
          email: existingInvitation.email,
          role: existingInvitation.role,
          token: existingInvitation.token,
          familyId: existingInvitation.familyId,
          createdAt: existingInvitation.createdAt,
        },
        message: "Pozvánka pro tento e-mail již existuje.",
      })
    }

    const invitation = await prisma.invitation.create({
      data: {
        email: email.toLowerCase().trim(),
        role: inviteRole,
        familyId: user.familyId,
      },
    })

    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          token: invitation.token,
          familyId: invitation.familyId,
          createdAt: invitation.createdAt,
        },
        message: "Pozvánka byla úspěšně vytvořena.",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/family/invite error:", error)
    return NextResponse.json({ error: "Nepodařilo se vytvořit pozvánku." }, { status: 500 })
  }
}
