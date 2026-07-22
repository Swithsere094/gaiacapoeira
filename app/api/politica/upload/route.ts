import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { saveFile } from "@/lib/storage"

// POST /api/politica/upload — subir archivo a disco local (solo admin)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    // Validar tamaño (máx 20 MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo no puede superar 20 MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { url } = await saveFile(buffer, "politica", file.name)

    return NextResponse.json({ url, name: file.name })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al subir el archivo"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
