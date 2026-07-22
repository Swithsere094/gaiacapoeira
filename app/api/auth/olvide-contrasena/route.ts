import { NextRequest, NextResponse } from "next/server"
import { resetPasswordByCredentials } from "@/lib/auth/db"

// POST /api/auth/olvide-contrasena — pública, no requiere sesión
// Requiere username + email para verificar identidad.
// Si coinciden con un usuario, genera una contraseña temporal y la devuelve.
export async function POST(request: NextRequest) {
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
