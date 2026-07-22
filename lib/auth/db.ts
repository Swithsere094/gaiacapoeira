/**
 * Operaciones de usuarios contra MySQL (Drizzle).
 * Solo se usa en server-side (API routes).
 */

import bcrypt from "bcryptjs"
import { randomBytes, randomUUID } from "crypto"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { usuarios } from "@/lib/db/schema"
import type { AppUser } from "./users"

function rowToUser(row: typeof usuarios.$inferSelect): AppUser {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    email: row.email,
    role: row.role,
    apodo: row.apodo,
    avatar: row.avatar,
  }
}

// ── Verificar credenciales ──────────────────────────────────────────
export async function verifyCredentials(
  username: string,
  password: string
): Promise<AppUser | null> {
  const [row] = await db.select().from(usuarios).where(eq(usuarios.username, username)).limit(1)
  if (!row) return null

  const valid = await bcrypt.compare(password, row.password_hash)
  if (!valid) return null

  return rowToUser(row)
}

// ── Obtener todos los usuarios (sin password_hash) ──────────────────
export async function getAllUsers(): Promise<AppUser[]> {
  const rows = await db.select().from(usuarios).orderBy(usuarios.created_at)
  return rows.map(rowToUser)
}

// ── Obtener un usuario por ID ───────────────────────────────────────
export async function getUserById(id: string): Promise<AppUser | null> {
  const [row] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1)
  if (!row) return null
  return rowToUser(row)
}

// ── Crear usuario ───────────────────────────────────────────────────
export async function createUser(params: {
  username: string
  password: string
  name: string
  email?: string
  role: "admin" | "member"
  apodo?: string
}): Promise<AppUser> {
  const password_hash = await bcrypt.hash(params.password, 10)
  const id = randomUUID()

  await db.insert(usuarios).values({
    id,
    username: params.username,
    password_hash,
    name: params.name,
    email: params.email || null,
    role: params.role,
    apodo: params.apodo || null,
  })

  const user = await getUserById(id)
  if (!user) throw new Error("Error al crear usuario")
  return user
}

// ── Actualizar usuario (sin cambiar contraseña) ─────────────────────
export async function updateUser(
  id: string,
  params: {
    name?: string
    email?: string | null
    role?: "admin" | "member"
    apodo?: string | null
    avatar?: string | null
    password?: string // opcional: si viene, se hashea
  }
): Promise<AppUser> {
  const updates: Partial<typeof usuarios.$inferInsert> = { updated_at: new Date() }
  if (params.name !== undefined) updates.name = params.name
  if (params.email !== undefined) updates.email = params.email
  if (params.role !== undefined) updates.role = params.role
  if (params.apodo !== undefined) updates.apodo = params.apodo
  if (params.avatar !== undefined) updates.avatar = params.avatar
  if (params.password) updates.password_hash = await bcrypt.hash(params.password, 10)

  await db.update(usuarios).set(updates).where(eq(usuarios.id, id))

  const user = await getUserById(id)
  if (!user) throw new Error("Usuario no encontrado")
  return user
}

// ── Eliminar usuario ────────────────────────────────────────────────
export async function deleteUser(id: string): Promise<void> {
  await db.delete(usuarios).where(eq(usuarios.id, id))
}

// ── Verificar contraseña actual de un usuario ────────────────────────
export async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
  const [row] = await db
    .select({ password_hash: usuarios.password_hash })
    .from(usuarios)
    .where(eq(usuarios.id, userId))
    .limit(1)

  if (!row) return false
  return bcrypt.compare(password, row.password_hash)
}

// ── Resetear contraseña por username + email (olvidé contraseña) ─────
// Genera una contraseña temporal, la guarda hasheada y la devuelve en claro.
export async function resetPasswordByCredentials(
  username: string,
  email: string
): Promise<string | null> {
  const [row] = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(
      and(
        eq(usuarios.username, username.trim().toLowerCase()),
        eq(usuarios.email, email.trim().toLowerCase())
      )
    )
    .limit(1)

  if (!row) return null

  // Generar contraseña temporal legible (sin caracteres confusos)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  const bytes = randomBytes(10)
  const tempPassword = Array.from(bytes, (b) => chars[b % chars.length]).join("")

  const password_hash = await bcrypt.hash(tempPassword, 10)
  await db.update(usuarios).set({ password_hash, updated_at: new Date() }).where(eq(usuarios.id, row.id))

  return tempPassword
}
