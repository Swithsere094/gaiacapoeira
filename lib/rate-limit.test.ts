import { describe, expect, it } from "vitest"
import { rateLimit } from "./rate-limit"

// Cada test usa una key propia (random) para no compartir el bucket en
// memoria con otros tests del mismo archivo.
function uniqueKey(prefix: string) {
  return `${prefix}:${Math.random().toString(36).slice(2)}`
}

describe("rateLimit", () => {
  it("permite pedidos por debajo del límite", () => {
    const key = uniqueKey("under")
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60_000).allowed).toBe(true)
    }
  })

  it("bloquea al superar el límite dentro de la ventana", () => {
    const key = uniqueKey("over")
    for (let i = 0; i < 3; i++) rateLimit(key, 3, 60_000)
    const result = rateLimit(key, 3, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
  })

  it("cuenta cada key por separado", () => {
    const keyA = uniqueKey("a")
    const keyB = uniqueKey("b")
    rateLimit(keyA, 1, 60_000)
    expect(rateLimit(keyA, 1, 60_000).allowed).toBe(false)
    expect(rateLimit(keyB, 1, 60_000).allowed).toBe(true)
  })

  it("resetea el contador una vez que pasa la ventana", async () => {
    const key = uniqueKey("reset")
    expect(rateLimit(key, 1, 20).allowed).toBe(true)
    expect(rateLimit(key, 1, 20).allowed).toBe(false)
    await new Promise((r) => setTimeout(r, 30))
    expect(rateLimit(key, 1, 20).allowed).toBe(true)
  })
})
