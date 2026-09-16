import { readdirSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { CORDAS, getCordaSrc } from "./cordas"

describe("getCordaSrc", () => {
  it("devuelve null para id vacío", () => {
    expect(getCordaSrc(null)).toBeNull()
    expect(getCordaSrc(undefined)).toBeNull()
    expect(getCordaSrc("")).toBeNull()
  })

  it("arma la ruta del PNG a partir del id", () => {
    expect(getCordaSrc("mestre")).toBe("/Cuerda x cuerda/mestre.png")
  })
})

// Guarda de regresión: cada id de CORDAS debe tener su PNG real en disco
// (y viceversa), para no volver a dejar un archivo huérfano como el que se
// sacó en la limpieza de restos de v0/Vercel (ver CLAUDE.md).
describe("CORDAS vs public/Cuerda x cuerda/", () => {
  const dir = join(process.cwd(), "public", "Cuerda x cuerda")
  const filesOnDisk = new Set(readdirSync(dir))

  it("cada id de CORDAS tiene su archivo PNG", () => {
    const missing = CORDAS.map((c) => `${c.id}.png`).filter((f) => !filesOnDisk.has(f))
    expect(missing).toEqual([])
  })

  it("no hay PNGs en el directorio que no estén referenciados en CORDAS", () => {
    const referenced = new Set(CORDAS.map((c) => `${c.id}.png`))
    const orphans = [...filesOnDisk].filter((f) => f.endsWith(".png") && !referenced.has(f))
    expect(orphans).toEqual([])
  })
})
