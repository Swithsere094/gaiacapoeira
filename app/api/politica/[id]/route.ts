import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { politica } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"
import { deleteFile, urlToRelativePath } from "@/lib/storage"

type Params = { params: Promise<{ id: string }> }

// PUT /api/politica/[id] — actualizar documento (solo admin)
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
  const { title, content, category, file_url, file_name } = body

  try {
    await db
      .update(politica)
      .set({
        title,
        content: content || null,
        category: category || null,
        file_url: file_url || null,
        file_name: file_name || null,
        updated_at: new Date(),
      })
      .where(eq(politica.id, id))

    const [data] = await db.select().from(politica).where(eq(politica.id, id)).limit(1)
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al actualizar el documento"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/politica/[id] — eliminar documento (solo admin)
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
    // Obtener el documento para borrar el archivo de disco si existe
    const [doc] = await db
      .select({ file_url: politica.file_url })
      .from(politica)
      .where(eq(politica.id, id))
      .limit(1)

    if (doc?.file_url) {
      const relativePath = urlToRelativePath(doc.file_url)
      if (relativePath) await deleteFile(relativePath)
    }

    await db.delete(politica).where(eq(politica.id, id))
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al eliminar el documento"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
