import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const pathname = req.nextUrl.pathname

  const publicPaths = ["/", "/auth/signin", "/auth/register", "/api/auth"]
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-).*)"],
}
