/**
 * Almacenamiento de archivos en disco local (reemplaza Supabase Storage).
 * Los archivos se guardan bajo public/uploads/<folder>/ y se sirven
 * directamente por Next.js como estáticos en /uploads/<folder>/<archivo>.
 * Solo usar en server-side (API routes).
 */

import { mkdir, unlink, writeFile } from "fs/promises"
import path from "path"

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads")

export async function saveFile(
  buffer: Buffer,
  folder: string,
  originalName: string
): Promise<{ url: string; path: string }> {
  const ext = originalName.split(".").pop() ?? ""
  const safeName = originalName
    .replace(/\.[^/.]+$/, "") // quitar extensión
    .replace(/[^a-zA-Z0-9_-]/g, "_") // solo alfanumérico
    .slice(0, 60)
  const fileName = `${Date.now()}_${safeName}.${ext}`

  const dir = path.join(UPLOADS_ROOT, folder)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, fileName), buffer)

  const relativePath = `${folder}/${fileName}`
  return { url: `/uploads/${relativePath}`, path: relativePath }
}

export async function deleteFile(relativePath: string): Promise<void> {
  await unlink(path.join(UPLOADS_ROOT, relativePath)).catch(() => {
    // El archivo ya no existe o no se pudo borrar — no es crítico.
  })
}

// Convierte una url pública ("/uploads/politica/xxx.pdf") en la ruta
// relativa esperada por deleteFile ("politica/xxx.pdf").
export function urlToRelativePath(url: string): string | null {
  const prefix = "/uploads/"
  if (!url.startsWith(prefix)) return null
  return url.slice(prefix.length)
}
