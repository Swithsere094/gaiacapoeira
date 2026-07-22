import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { updateUser, deleteUser, verifyUserPassword } from "@/lib/auth/db"

type Params = { params: Promise<{ id: string }> }

// PUT /api/users/[id]
// Admin  → puede cambiar cualquier campo de cualquier usuario (sin verificar contraseña actual)
// Member → solo puede editar su propio perfil:
//   - apodo: siempre
//   - contraseña: si provee currentPassword correcto
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params
  const isAdmin = session.user.role === "admin"
  const isSelf  = session.user.id === id

  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const body = await request.json()

  try {
    let updates: Parameters<typeof updateUser>[1]

    if (isAdmin) {
      // Admin: actualización completa sin verificar contraseña actual
      updates = {
        name:     body.name,
        email:    body.email,
        role:     body.role,
        apodo:    body.apodo,
        avatar:   body.avatar !== undefined ? body.avatar : undefined,
        password: body.password || undefined,
      }
    } else {
      // Member: solo apodo, avatar y (opcionalmente) cambio de contraseña propio
      updates = {
        apodo:  body.apodo,
        avatar: body.avatar !== undefined ? body.avatar : undefined,
      }

      if (body.password) {
        // Requiere la contraseña actual
        if (!body.currentPassword) {
          return NextResponse.json(
            { error: "Debes ingresar tu contraseña actual para cambiarla" },
            { status: 400 }
          )
        }
        const valid = await verifyUserPassword(id, body.currentPassword)
        if (!valid) {
          return NextResponse.json(
            { error: "La contraseña actual es incorrecta" },
            { status: 400 }
          )
        }
        updates.password = body.password
      }
    }

    const user = await updateUser(id, updates)

    // Actualizar sesión si el usuario editó su propio perfil
    if (isSelf) {
      session.user = { ...session.user, ...user }
      await session.save()
    }

    return NextResponse.json(user)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al actualizar usuario"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/users/[id] — solo admin
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = await params

  if (session.user.id === id) {
    return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 })
  }

  try {
    await deleteUser(id)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al eliminar usuario"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
