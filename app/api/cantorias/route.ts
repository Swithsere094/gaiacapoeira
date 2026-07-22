import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { cantorias } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"

// GET /api/cantorias
export async function GET() {
  try {
    const data = await db.select().from(cantorias).orderBy(desc(cantorias.event_date))
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al obtener cantorias"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/cantorias (solo admin)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const body = await request.json()
  const { title, video_url, description, event_date } = body

  if (!title) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 })
  }

  try {
    const id = randomUUID()
    await db.insert(cantorias).values({
      id,
      title,
      video_url: video_url || null,
      description: description || null,
      event_date: event_date || null,
    })

    const [data] = await db.select().from(cantorias).where(eq(cantorias.id, id)).limit(1)
    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al crear cantoria"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
