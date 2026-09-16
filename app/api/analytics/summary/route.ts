import { NextResponse } from "next/server"
import { desc, gte, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { page_views } from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"

const DAYS = 30

// GET /api/analytics/summary — solo admin
export async function GET() {
  const session = await getSession()
  if (!session.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  try {
    const since = new Date()
    since.setDate(since.getDate() - DAYS)
    since.setHours(0, 0, 0, 0)

    const [[totals], topPages, recentViews] = await Promise.all([
      db.select({ count: sql<number>`count(*)`, uniqueUsers: sql<number>`count(distinct ${page_views.user_id})` }).from(page_views),
      db
        .select({ path: page_views.path, count: sql<number>`count(*)`.as("count") })
        .from(page_views)
        .groupBy(page_views.path)
        .orderBy(desc(sql`count(*)`))
        .limit(15),
      db
        .select({ created_at: page_views.created_at })
        .from(page_views)
        .where(gte(page_views.created_at, since)),
    ])

    // El día se agrupa acá en JS (en vez de con DATE() de MySQL) a propósito:
    // mysql2 devuelve DATE(...) como objeto Date, no como string — rompía el
    // Map de abajo — y además el servidor de MySQL local corre en hora
    // distinta a UTC, así que agrupar del lado de MySQL podía mandar una
    // visita al día "equivocado" según la hora del día. Agrupando acá mismo,
    // con la misma función (toISOString) para las filas reales y para la
    // lista de referencia de los últimos N días, ambos lados quedan
    // consistentes sin importar en qué huso horario esté el server de DB.
    const countByDay = new Map<string, number>()
    for (const row of recentViews) {
      const key = new Date(row.created_at).toISOString().slice(0, 10)
      countByDay.set(key, (countByDay.get(key) ?? 0) + 1)
    }

    const viewsByDay: { day: string; count: number }[] = []
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      viewsByDay.push({ day: key, count: countByDay.get(key) ?? 0 })
    }

    return NextResponse.json({
      totalViews: totals?.count ?? 0,
      uniqueUsers: totals?.uniqueUsers ?? 0,
      topPages,
      viewsByDay,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al obtener analíticas"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
