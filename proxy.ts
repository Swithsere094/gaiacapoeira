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
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get("gaia-session")
  if (!sessionCookie) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
