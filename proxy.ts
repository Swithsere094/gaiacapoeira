import { type NextRequest, NextResponse } from "next/server"

// Rutas que NO requieren autenticación
const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/olvide-contrasena",
  "/api/auth/login",
  "/api/auth/olvide-contrasena",
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const response = NextResponse.next()
    response.headers.set("Cache-Control", "private, no-store")
    return response
  }

  const sessionCookie = request.cookies.get("gaia-session")
  if (!sessionCookie) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    const response = NextResponse.redirect(loginUrl)
    response.headers.set("Cache-Control", "private, no-store")
    return response
  }

  const response = NextResponse.next()
  response.headers.set("Cache-Control", "private, no-store")
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)",
  ],
}
