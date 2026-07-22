// Script temporal para crear un usuario admin de prueba en local.
// Uso: npx tsx migration/seed-admin.ts <username> <password>
import { readFileSync } from "fs"
import { join } from "path"

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

async function main() {
  loadEnvLocal()

  const [username, password] = process.argv.slice(2)
  if (!username || !password) {
    console.error("Uso: npx tsx migration/seed-admin.ts <username> <password>")
    process.exit(1)
  }

  const bcrypt = (await import("bcryptjs")).default
  const { randomUUID } = await import("crypto")
  const { db } = await import("../lib/db/client")
  const { usuarios } = await import("../lib/db/schema")

  const password_hash = await bcrypt.hash(password, 10)

  await db.insert(usuarios).values({
    id: randomUUID(),
    username,
    password_hash,
    name: "Admin de prueba",
    role: "admin",
  })

  console.log(`Usuario admin "${username}" creado correctamente.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
