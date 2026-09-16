import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { verifyCredentials } from "@/lib/auth/db"
import { getClientIp, rateLimit } from "@/lib/rate-limit"

// Máximo 10 intentos cada 15 min por IP — generoso para uso normal (nadie
// se equivoca 10 veces seguidas en 15 minutos) pero corta fuerza bruta real.
const LOGIN_LIMIT = 10
const LOGIN_WINDOW_MS = 15 * 60 * 1000

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed, retryAfterSeconds } = rateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)
  if (!allowed) {
    return NextResponse.json(
      { error: `Demasiados intentos. Probá de nuevo en ${Math.ceil(retryAfterSeconds / 60)} minuto(s).` },
      { status: 429 }
    )
  }

  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: "Usuario y contraseña requeridos" }, { status: 400 })
  }

  const user = await verifyCredentials(username, password)

  if (!user) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 })
  }

  const session = await getSession()
  session.user = user
  await session.save()

  return NextResponse.json({ user })
}
