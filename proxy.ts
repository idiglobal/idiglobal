import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const isLoggedIn = !!session?.user
  const role = (session?.user as { role?: string } | undefined)?.role

  const isAdminRoute = nextUrl.pathname.startsWith("/dashboard")
  const isClientRoute = nextUrl.pathname.startsWith("/portal")
  const isAuthRoute = nextUrl.pathname === "/login"

  if (isAuthRoute) {
    if (isLoggedIn) {
      const dest = role === "ADMIN" ? "/dashboard" : "/portal"
      return NextResponse.redirect(new URL(dest, nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn && (isAdminRoute || isClientRoute)) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/portal", nextUrl))
  }

  if (isClientRoute && role !== "CLIENT") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*", "/portal/:path*", "/login"],
}
