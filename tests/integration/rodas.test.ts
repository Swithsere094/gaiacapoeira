import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it } from "vitest"
import { GET as listRodas, POST as createRoda } from "@/app/api/rodas/route"
import { db } from "@/lib/db/client"
import { rodas } from "@/lib/db/schema"
import { loginAs } from "./helpers"

function req(body?: unknown) {
  return new NextRequest("http://localhost/api/rodas", {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

const validRoda = {
  title: "Roda de sábado",
  video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  location: "Parque central",
}

beforeEach(async () => {
  await db.delete(rodas)
})

describe("POST /api/rodas", () => {
  it("exige sesión", async () => {
    const res = await createRoda(req(validRoda))
    expect(res.status).toBe(401)
  })

  it("rechaza a un usuario autenticado que no sea admin", async () => {
    await loginAs({ role: "member" })
    const res = await createRoda(req(validRoda))
    expect(res.status).toBe(403)
  })

  it("exige título y video_url", async () => {
    await loginAs({ role: "admin" })
    const res = await createRoda(req({ title: "Sin video" }))
    expect(res.status).toBe(400)
  })

  it("crea la roda cuando quien pide es admin", async () => {
    await loginAs({ role: "admin" })
    const res = await createRoda(req(validRoda))
    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data.title).toBe(validRoda.title)
    expect(data.views).toBe(0)

    const listRes = await listRodas()
    expect(await listRes.json()).toHaveLength(1)
  })
})
