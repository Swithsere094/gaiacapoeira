import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it } from "vitest"
import { GET as listSongs, POST as createSong } from "@/app/api/songs/route"
import { DELETE as deleteSong, PUT as updateSong } from "@/app/api/songs/[id]/route"
import { db } from "@/lib/db/client"
import { songs } from "@/lib/db/schema"
import { loginAs } from "./helpers"

function req(method: string, body?: unknown) {
  return new NextRequest("http://localhost/api/songs", {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

const validSong = {
  title: "Paranauê",
  type: "corrido",
  lyrics: "Paranauê, paraná...",
  tags: ["tradicional", "corrido"],
}

// Tabla dedicada a esta suite — se trunca antes de cada test para que
// ningún test dependa de datos dejados por otro.
beforeEach(async () => {
  await db.delete(songs)
})

describe("GET /api/songs", () => {
  it("no requiere sesión", async () => {
    const res = await listSongs()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it("devuelve las canciones creadas", async () => {
    await loginAs({ role: "admin" })
    await createSong(req("POST", validSong))

    const res = await listSongs()
    expect(await res.json()).toHaveLength(1)
  })
})

describe("POST /api/songs", () => {
  it("exige sesión", async () => {
    const res = await createSong(req("POST", validSong))
    expect(res.status).toBe(401)
  })

  it("exige título, tipo y letra", async () => {
    await loginAs({ role: "member" })
    const res = await createSong(req("POST", { title: "Solo título" }))
    expect(res.status).toBe(400)
  })

  it("crea la canción y devuelve tags como array real (no string), no solo JSON crudo de mysql2", async () => {
    await loginAs({ role: "member" })
    const res = await createSong(req("POST", validSong))
    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data.title).toBe(validSong.title)
    expect(Array.isArray(data.tags)).toBe(true)
    expect(data.tags).toEqual(validSong.tags)

    const listRes = await listSongs()
    expect(await listRes.json()).toHaveLength(1)
  })
})

describe("PUT /api/songs/[id]", () => {
  it("permite editar a cualquier usuario autenticado (member incluido)", async () => {
    await loginAs({ role: "admin" })
    const created = await createSong(req("POST", validSong)).then((r) => r.json())

    await loginAs({ role: "member" })
    const res = await updateSong(
      req("PUT", { ...validSong, title: "Título editado" }),
      params(created.id)
    )
    expect(res.status).toBe(200)
    expect((await res.json()).title).toBe("Título editado")
  })
})

describe("DELETE /api/songs/[id]", () => {
  it("rechaza a un usuario sin rol admin", async () => {
    await loginAs({ role: "admin" })
    const created = await createSong(req("POST", validSong)).then((r) => r.json())

    await loginAs({ role: "member" })
    const res = await deleteSong(req("DELETE"), params(created.id))
    expect(res.status).toBe(403)
  })

  it("borra la canción cuando quien pide es admin", async () => {
    await loginAs({ role: "admin" })
    const created = await createSong(req("POST", validSong)).then((r) => r.json())

    const res = await deleteSong(req("DELETE"), params(created.id))
    expect(res.status).toBe(200)

    const listRes = await listSongs()
    expect(await listRes.json()).toEqual([])
  })
})
