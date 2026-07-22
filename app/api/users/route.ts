import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAllUsers, createUser } from "@/lib/auth/db"

// GET /api/users — listar usuarios (solo admin)
export async function GET() {
  const session = await getSession()
  if (!session.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  try {
    const users = await getAllUsers()
    return NextResponse.json(users)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al obtener usuarios"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/users — crear usuario (solo admin)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const body = await request.json()
  const { username, password, name, email, role, apodo } = body

  if (!username || !password || !name || !role) {
    return NextResponse.json(
      { error: "Usuario, contraseña, nombre y rol son obligatorios" },
      { status: 400 }
    )
  }

  if (!["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 })
  }

  try {
    const user = await createUser({ username, password, name, email, role, apodo })
    return NextResponse.json(user, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al crear usuario"
    // Duplicate username
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json({ error: "El nombre de usuario ya existe" }, { status: 409 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
