import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.familyId = (user as any).familyId
        token.role = (user as any).role
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).familyId = token.familyId
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        action: { label: "Action", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string
        const name = credentials.name as string
        const action = credentials.action as string // "login" | "register"

        const user = await prisma.user.findUnique({ where: { email } })

        if (user) {
          // Existing user — verify password stored in image field with "hash:" prefix
          const storedHash = user.image?.startsWith("hash:") ? user.image.slice(5) : null
          if (!storedHash) return null
          const valid = await bcrypt.compare(password, storedHash)
          if (!valid) return null
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            familyId: user.familyId,
            role: user.role,
          }
        } else {
          // New user registration
          if (action !== "register") return null
          const hash = await bcrypt.hash(password, 10)
          const newUser = await prisma.user.create({
            data: {
              email,
              name: name || email.split("@")[0],
              image: `hash:${hash}`,
            },
          })
          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            familyId: null,
            role: "PARENT",
          }
        }
      },
    }),
  ],
})
