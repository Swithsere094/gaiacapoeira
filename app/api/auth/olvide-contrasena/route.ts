import { NextRequest, NextResponse } from "next/server"
import { resetPasswordByCredentials } from "@/lib/auth/db"
import { getClientIp, rateLimit } from "@/lib/rate-limit"

// Más estricto que login: acá un intento exitoso devuelve una contraseña
// nueva en texto plano en la respuesta, así que además de fuerza bruta
// hay que frenar el enumerado de combinaciones usuario+email.
const RESET_LIMIT = 5
const RESET_WINDOW_MS = 15 * 60 * 1000

// POST /api/auth/olvide-contrasena — pública, no requiere sesión
// Requiere username + email para verificar identidad.
// Si coinciden con un usuario, genera una contraseña temporal y la devuelve.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed, retryAfterSeconds } = rateLimit(`olvide:${ip}`, RESET_LIMIT, RESET_WINDOW_MS)
  if (!allowed) {
    return NextResponse.json(
      { error: `Demasiados intentos. Probá de nuevo en ${Math.ceil(retryAfterSeconds / 60)} minuto(s).` },
      { status: 429 }
    )
  }

  const body = await request.json()
  const { username, email } = body

  if (!username || !email) {
    return NextResponse.json(
      { error: "Usuario y email son obligatorios" },
      { status: 400 }
    )
  }

  try {
    const tempPassword = await resetPasswordByCredentials(username, email)

    if (!tempPassword) {
      return NextResponse.json(
        { error: "No encontramos un usuario con ese nombre y email. Verifica los datos o contacta al administrador." },
        { status: 404 }
      )
    }

    return NextResponse.json({ tempPassword })
  } catch {
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    )
  }
}
