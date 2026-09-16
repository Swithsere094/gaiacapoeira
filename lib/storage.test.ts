import { existsSync } from "fs"
import { readFile, rm } from "fs/promises"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { deleteFile, saveFile, urlToRelativePath } from "./storage"

// saveFile()/deleteFile() escriben bajo public/uploads/ del proyecto real
// (no hay forma de inyectar otra raíz) — se usa una carpeta dedicada y se
// borra después de cada test para no dejar residuos.
const TEST_FOLDER = "__vitest_test__"
const testDir = join(process.cwd(), "public", "uploads", TEST_FOLDER)

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true })
})

describe("saveFile", () => {
  it("guarda el archivo en disco y devuelve url/path consistentes", async () => {
    const { url, path: relativePath } = await saveFile(
      Buffer.from("contenido de prueba"),
      TEST_FOLDER,
      "Documento de Prueba.pdf"
    )

    expect(url).toBe(`/uploads/${relativePath}`)
    expect(relativePath.startsWith(`${TEST_FOLDER}/`)).toBe(true)
    expect(relativePath.endsWith(".pdf")).toBe(true)

    const savedPath = join(process.cwd(), "public", "uploads", relativePath)
    expect(existsSync(savedPath)).toBe(true)
    expect((await readFile(savedPath)).toString()).toBe("contenido de prueba")
  })

  it("sanitiza caracteres no alfanuméricos del nombre original", async () => {
    const { path: relativePath } = await saveFile(
      Buffer.from("x"),
      TEST_FOLDER,
      "árvore & çapoeira!!.pdf"
    )
    const fileName = relativePath.split("/")[1]
    // Timestamp_ + nombre saneado + extensión
    expect(fileName).toMatch(/^\d+_[a-zA-Z0-9_-]+\.pdf$/)
  })
})

describe("deleteFile", () => {
  it("borra un archivo existente", async () => {
    const { path: relativePath } = await saveFile(Buffer.from("x"), TEST_FOLDER, "a.pdf")
    const savedPath = join(process.cwd(), "public", "uploads", relativePath)
    expect(existsSync(savedPath)).toBe(true)

    await deleteFile(relativePath)
    expect(existsSync(savedPath)).toBe(false)
  })

  it("no lanza error si el archivo no existe", async () => {
    await expect(deleteFile(`${TEST_FOLDER}/no-existe.pdf`)).resolves.toBeUndefined()
  })
})

describe("urlToRelativePath", () => {
  it("convierte una url pública en su ruta relativa", () => {
    expect(urlToRelativePath("/uploads/politica/doc.pdf")).toBe("politica/doc.pdf")
  })

  it("devuelve null si la url no empieza con /uploads/", () => {
    expect(urlToRelativePath("https://ejemplo.com/uploads/politica/doc.pdf")).toBeNull()
    expect(urlToRelativePath("/otra-cosa/doc.pdf")).toBeNull()
  })
})
