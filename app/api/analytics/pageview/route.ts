import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { db } from "@/lib/db/client"
import { page_views } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"

// POST /api/analytics/pageview — pública (ver PUBLIC_PATHS en proxy.ts):
// tiene que poder registrar la visita a /auth/login de alguien sin sesión
// también. Analíticas propias, reemplaza a @vercel/analytics.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const path = typeof body?.path === "string" ? body.path.slice(0, 500) : ""

  if (!path) {
    return NextResponse.json({ error: "path requerido" }, { status: 400 })
  }

  try {
    const session = await getSession()
    await db.insert(page_views).values({
      id: randomUUID(),
      path,
      user_id: session.user?.id ?? null,
      // Explícito en vez de confiar en el default CURRENT_TIMESTAMP de
      // MySQL: el time_zone del servidor de MySQL local no coincide con
      // UTC, y mysql2 no lo convierte al leer — el timestamp quedaba
      // corrido varias horas, agrupando visitas en el día equivocado en
      // /admin/analytics (ver GET /api/analytics/summary).
      created_at: new Date(),
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al registrar la visita"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
