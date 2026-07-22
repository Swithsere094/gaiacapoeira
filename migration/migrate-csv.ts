// Migra los CSV exportados desde Supabase (Table Editor -> Export as CSV)
// hacia la base MySQL local. Vacía y recarga las 5 tablas en cada corrida
// (pensado para repetir la prueba las veces que haga falta).
//
// Uso: npx tsx migration/migrate-csv.ts
//
// Espera los archivos en migration/csv-export/:
//   usuarios.csv, cantorias.csv, politica.csv, rodas.csv, songs.csv
// (si falta alguno, simplemente se salta esa tabla)

import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { parse } from "csv-parse/sync"

function loadEnvLocal() {
  const envPath = join(process.cwd(), ".env.local")
  const content = readFileSync(envPath, "utf-8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!(key in process.env)) process.env[key] = value
  }
}

const CSV_DIR = join(process.cwd(), "migration", "csv-export")

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

function readCsv(table: string): Row[] {
  const path = join(CSV_DIR, `${table}.csv`)
  if (!existsSync(path)) {
    console.log(`  (sin ${table}.csv, se salta)`)
    return []
  }
  const content = readFileSync(path, "utf-8")
  return parse(content, { columns: true, skip_empty_lines: true })
}

function nullIfEmpty(value: string | undefined): string | null {
  return value === undefined || value === "" ? null : value
}

// "2026-06-04 02:38:49.570451+00" -> Date (UTC)
function parseTimestamp(value: string | undefined): Date | null {
  if (!value) return null
  const match = value.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(\.\d+)?/)
  if (!match) return new Date(value)
  const [, date, time, frac] = match
  const ms = frac ? Math.round(parseFloat(frac) * 1000) : 0
  return new Date(`${date}T${time}.${String(ms).padStart(3, "0")}Z`)
}

// Formato de Postgres para arrays en CSV: {tag1,tag2}. También acepta
// JSON (["tag1","tag2"]) por si acaso. Vacío -> null.
function parsePgArray(value: string | undefined): string[] | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed)
    } catch {
      // sigue abajo
    }
  }
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    const inner = trimmed.slice(1, -1)
    if (!inner) return []
    return inner.split(",").map((s) => s.trim().replace(/^"(.*)"$/, "$1"))
  }
  return null
}

async function main() {
  loadEnvLocal()

  const { db } = await import("../lib/db/client")
  const schema = await import("../lib/db/schema")

  console.log("Leyendo CSVs...")
  const usuariosRows = readCsv("usuarios")
  const cantoriasRows = readCsv("cantorias")
  const politicaRows = readCsv("politica")
  const rodasRows = readCsv("rodas")
  const songsRows = readCsv("songs")
  console.log(
    `  usuarios=${usuariosRows.length} cantorias=${cantoriasRows.length} politica=${politicaRows.length} rodas=${rodasRows.length} songs=${songsRows.length}`
  )

  console.log("Vaciando tablas destino en MySQL...")
  await db.delete(schema.rodas)
  await db.delete(schema.songs)
  await db.delete(schema.cantorias)
  await db.delete(schema.politica)
  await db.delete(schema.usuarios)

  // ── usuarios (primero: rodas/songs dependen de sus ids) ────────────
  if (usuariosRows.length > 0) {
    await db.insert(schema.usuarios).values(
      usuariosRows.map((r) => ({
        id: r.id,
        username: r.username,
        password_hash: r.password_hash,
        name: r.name,
        email: nullIfEmpty(r.email),
        role: r.role,
        apodo: nullIfEmpty(r.apodo),
        avatar: nullIfEmpty(r.avatar),
        created_at: parseTimestamp(r.created_at) ?? new Date(),
        updated_at: parseTimestamp(r.updated_at) ?? new Date(),
      }))
    )
  }
  const validUserIds = new Set(usuariosRows.map((r) => r.id))
  console.log(`  usuarios insertados: ${usuariosRows.length}`)

  // ── cantorias (sin FK) ───────────────────────────────────────────
  if (cantoriasRows.length > 0) {
    await db.insert(schema.cantorias).values(
      cantoriasRows.map((r) => ({
        id: r.id,
        title: r.title,
        video_url: nullIfEmpty(r.video_url),
        description: nullIfEmpty(r.description),
        event_date: nullIfEmpty(r.event_date),
        created_at: parseTimestamp(r.created_at) ?? new Date(),
        updated_at: parseTimestamp(r.updated_at) ?? new Date(),
      }))
    )
  }
  console.log(`  cantorias insertadas: ${cantoriasRows.length}`)

  // ── politica (sin FK) ────────────────────────────────────────────
  if (politicaRows.length > 0) {
    await db.insert(schema.politica).values(
      politicaRows.map((r) => ({
        id: r.id,
        title: r.title,
        content: nullIfEmpty(r.content),
        category: nullIfEmpty(r.category),
        file_url: nullIfEmpty(r.file_url),
        file_name: nullIfEmpty(r.file_name),
        created_at: parseTimestamp(r.created_at) ?? new Date(),
        updated_at: parseTimestamp(r.updated_at) ?? new Date(),
      }))
    )
  }
  console.log(`  politica insertada: ${politicaRows.length}`)
  const withFile = politicaRows.filter((r) => r.file_url).length
  if (withFile > 0) {
    console.log(
      `  aviso: ${withFile} documento(s) con file_url apuntando todavía a Supabase Storage (no se migró el archivo, solo el link)`
    )
  }

  // ── rodas (user_id opcional, debe existir en usuarios o queda null) ─
  let rodasOrphanUsers = 0
  if (rodasRows.length > 0) {
    await db.insert(schema.rodas).values(
      rodasRows.map((r) => {
        const userId = nullIfEmpty(r.user_id)
        const validUser = userId && validUserIds.has(userId) ? userId : null
        if (userId && !validUser) rodasOrphanUsers++
        return {
          id: r.id,
          title: r.title,
          description: nullIfEmpty(r.description),
          video_url: r.video_url,
          thumbnail_url: nullIfEmpty(r.thumbnail_url),
          location: nullIfEmpty(r.location),
          event_date: nullIfEmpty(r.event_date),
          duration: r.duration ? Number(r.duration) : null,
          participants: parsePgArray(r.participants),
          tags: parsePgArray(r.tags),
          views: r.views ? Number(r.views) : 0,
          user_id: validUser,
          created_at: parseTimestamp(r.created_at) ?? new Date(),
          updated_at: parseTimestamp(r.updated_at) ?? new Date(),
        }
      })
    )
  }
  console.log(`  rodas insertadas: ${rodasRows.length}`)
  if (rodasOrphanUsers > 0) {
    console.log(`  aviso: ${rodasOrphanUsers} roda(s) con user_id que no existe en usuarios -> se dejó en NULL`)
  }

  // ── songs (mismo tratamiento de user_id) ────────────────────────
  let songsOrphanUsers = 0
  if (songsRows.length > 0) {
    await db.insert(schema.songs).values(
      songsRows.map((r) => {
        const userId = nullIfEmpty(r.user_id)
        const validUser = userId && validUserIds.has(userId) ? userId : null
        if (userId && !validUser) songsOrphanUsers++
        return {
          id: r.id,
          title: r.title,
          type: r.type,
          lyrics: r.lyrics,
          translation: nullIfEmpty(r.translation),
          context: nullIfEmpty(r.context),
          video_url: nullIfEmpty(r.video_url),
          audio_url: nullIfEmpty(r.audio_url),
          mestre: nullIfEmpty(r.mestre),
          tags: parsePgArray(r.tags),
          user_id: validUser,
          created_at: parseTimestamp(r.created_at) ?? new Date(),
          updated_at: parseTimestamp(r.updated_at) ?? new Date(),
        }
      })
    )
  }
  console.log(`  songs insertadas: ${songsRows.length}`)
  if (songsOrphanUsers > 0) {
    console.log(`  aviso: ${songsOrphanUsers} canción(es) con user_id que no existe en usuarios -> se dejó en NULL`)
  }

  console.log("Listo.")
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
