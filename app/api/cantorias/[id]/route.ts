import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { cantorias } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"

type Params = { params: Promise<{ id: string }> }

// DELETE /api/cantorias/[id] (solo admin)
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = await params
  try {
    await db.delete(cantorias).where(eq(cantorias.id, id))
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al eliminar cantoria"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
