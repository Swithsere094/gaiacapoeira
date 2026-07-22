import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { politica } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"

// GET /api/politica — listar documentos
export async function GET() {
  try {
    const data = await db.select().from(politica).orderBy(desc(politica.created_at))
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al obtener documentos"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/politica — crear documento (solo admin)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const body = await request.json()
  const { title, content, category, file_url, file_name } = body

  if (!title) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 })
  }

  try {
    const id = randomUUID()
    await db.insert(politica).values({
      id,
      title,
      content: content || null,
      category: category || null,
      file_url: file_url || null,
      file_name: file_name || null,
    })

    const [data] = await db.select().from(politica).where(eq(politica.id, id)).limit(1)
    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al crear el documento"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
