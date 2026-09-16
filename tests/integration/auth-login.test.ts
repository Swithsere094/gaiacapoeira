import { randomUUID } from "crypto"
import { NextRequest } from "next/server"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { POST as login } from "@/app/api/auth/login/route"
import { db } from "@/lib/db/client"
import { usuarios } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

function loginRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

describe("POST /api/auth/login", () => {
  const testUserId = randomUUID()
  const username = `vitest_${testUserId.slice(0, 8)}`
  const password = "correcto123"

  beforeAll(async () => {
    // bcryptjs con costo 10, igual que lib/auth/db.ts — evita importar esa
    // función acá adentro solo para no depender de más superficie de la
    // que este test necesita cubrir.
    const bcrypt = await import("bcryptjs")
    await db.insert(usuarios).values({
      id: testUserId,
      username,
      password_hash: await bcrypt.hash(password, 10),
      name: "Usuario de prueba",
      role: "member",
    })
  })

  afterAll(async () => {
    await db.delete(usuarios).where(eq(usuarios.id, testUserId))
  })

  it("rechaza si falta usuario o contraseña", async () => {
    const res = await login(loginRequest({ username: "" }))
    expect(res.status).toBe(400)
  })

  it("rechaza credenciales incorrectas", async () => {
    const res = await login(loginRequest({ username, password: "incorrecta" }))
    expect(res.status).toBe(401)
  })

  it("rechaza un usuario que no existe", async () => {
    const res = await login(loginRequest({ username: "no-existe-nunca", password: "x" }))
    expect(res.status).toBe(401)
  })

  it("acepta credenciales correctas y devuelve el usuario sin el hash", async () => {
    const res = await login(loginRequest({ username, password }))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.user.username).toBe(username)
    expect(data.user.role).toBe("member")
    expect(data.user.password_hash).toBeUndefined()
  })
})
