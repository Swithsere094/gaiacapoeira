import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { songs } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"

// GET /api/songs — listar canciones
export async function GET() {
  try {
    const data = await db.select().from(songs).orderBy(desc(songs.created_at))
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al obtener canciones"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/songs — crear canción (requiere sesión)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const body = await request.json()
  const { title, type, lyrics, translation, context, video_url, mestre, tags } = body

  if (!title || !type || !lyrics) {
    return NextResponse.json(
      { error: "Título, tipo y letra son obligatorios" },
      { status: 400 }
    )
  }

  try {
    const id = randomUUID()
    await db.insert(songs).values({
      id,
      title,
      type,
      lyrics,
      translation: translation || null,
      context: context || null,
      video_url: video_url || null,
      mestre: mestre || null,
      tags: tags && tags.length > 0 ? tags : null,
    })

    const [data] = await db.select().from(songs).where(eq(songs.id, id)).limit(1)
    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al crear la canción"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
