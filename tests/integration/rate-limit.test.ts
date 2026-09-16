import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"
import { POST as login } from "@/app/api/auth/login/route"
import { POST as olvideContrasena } from "@/app/api/auth/olvide-contrasena/route"

// x-forwarded-for propia por test para no compartir el bucket en memoria
// con otros archivos de test que también pegan a estas rutas.
function reqWithIp(url: string, ip: string, body: unknown = {}) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: JSON.stringify(body),
  })
}

describe("rate limiting", () => {
  it("POST /api/auth/login devuelve 429 después de 10 pedidos en la misma ventana", async () => {
    const ip = "198.51.100.10"
    for (let i = 0; i < 10; i++) {
      const res = await login(reqWithIp("http://localhost/api/auth/login", ip))
      expect(res.status).not.toBe(429)
    }
    const blocked = await login(reqWithIp("http://localhost/api/auth/login", ip))
    expect(blocked.status).toBe(429)
    expect((await blocked.json()).error).toMatch(/demasiados intentos/i)
  })

  it("una IP distinta no se ve afectada por el límite de otra", async () => {
    const res = await login(reqWithIp("http://localhost/api/auth/login", "198.51.100.11"))
    expect(res.status).not.toBe(429)
  })

  it("POST /api/auth/olvide-contrasena devuelve 429 después de 5 pedidos", async () => {
    const ip = "198.51.100.20"
    for (let i = 0; i < 5; i++) {
      const res = await olvideContrasena(
        reqWithIp("http://localhost/api/auth/olvide-contrasena", ip)
      )
      expect(res.status).not.toBe(429)
    }
    const blocked = await olvideContrasena(
      reqWithIp("http://localhost/api/auth/olvide-contrasena", ip)
    )
    expect(blocked.status).toBe(429)
  })
})
