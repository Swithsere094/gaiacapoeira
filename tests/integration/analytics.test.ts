import { NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it } from "vitest"
import { POST as trackPageview } from "@/app/api/analytics/pageview/route"
import { GET as getSummary } from "@/app/api/analytics/summary/route"
import { createUser } from "@/lib/auth/db"
import { db } from "@/lib/db/client"
import { page_views, usuarios } from "@/lib/db/schema"
import { loginAs } from "./helpers"

function pageviewReq(body?: unknown) {
  return new NextRequest("http://localhost/api/analytics/pageview", {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

beforeEach(async () => {
  await db.delete(page_views)
})

describe("POST /api/analytics/pageview", () => {
  it("no requiere sesión", async () => {
    const res = await trackPageview(pageviewReq({ path: "/auth/login" }))
    expect(res.status).toBe(201)
  })

  it("exige un path no vacío", async () => {
    const res = await trackPageview(pageviewReq({ path: "" }))
    expect(res.status).toBe(400)
  })

  it("guarda el user_id cuando hay sesión", async () => {
    // page_views.user_id tiene FK real a usuarios — a diferencia de
    // songs/rodas, acá loginAs() con un usuario sintético no alcanza
    // (violaría la constraint al insertar), hace falta un usuario real.
    const realUser = await createUser({
      username: `vitest_pv_${Date.now()}`,
      password: "x",
      name: "PV Test",
      role: "member",
    })
    try {
      await loginAs(realUser)
      await trackPageview(pageviewReq({ path: "/rodas" }))

      await loginAs({ role: "admin" })
      const summary = await getSummary().then((r) => r.json())
      expect(summary.uniqueUsers).toBe(1)
    } finally {
      await db.delete(usuarios).where(eq(usuarios.id, realUser.id))
    }
  })
})

describe("GET /api/analytics/summary", () => {
  it("exige sesión", async () => {
    const res = await getSummary()
    expect(res.status).toBe(401)
  })

  it("rechaza a un usuario sin rol admin", async () => {
    await loginAs({ role: "member" })
    const res = await getSummary()
    expect(res.status).toBe(403)
  })

  it("agrega totales y páginas más visitadas para admin", async () => {
    for (const path of ["/rodas", "/rodas", "/canciones"]) {
      await trackPageview(pageviewReq({ path }))
    }

    await loginAs({ role: "admin" })
    const res = await getSummary()
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.totalViews).toBe(3)
    expect(data.topPages[0]).toEqual({ path: "/rodas", count: 2 })
    expect(data.viewsByDay).toHaveLength(30)
    expect(data.viewsByDay.at(-1).count).toBe(3)
  })
})
