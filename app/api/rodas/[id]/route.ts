import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { rodas } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"

type Params = { params: Promise<{ id: string }> }

// PUT /api/rodas/[id] — actualizar roda (solo admin)
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { title, description, video_url, location, event_date } = body

  try {
    await db
      .update(rodas)
      .set({
        title,
        description: description || null,
        video_url,
        location: location || null,
        event_date: event_date || null,
        updated_at: new Date(),
      })
      .where(eq(rodas.id, id))

    const [data] = await db.select().from(rodas).where(eq(rodas.id, id)).limit(1)
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al actualizar la roda"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/rodas/[id] — eliminar roda (solo admin)
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const { id } = await params

  try {
    await db.delete(rodas).where(eq(rodas.id, id))
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al eliminar la roda"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
