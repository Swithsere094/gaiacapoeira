import { readFileSync, existsSync } from "fs"
import { join } from "path"

// drizzle-kit y vitest no cargan .env.local solos (a diferencia de Next) —
// mismo parser simple que ya usa drizzle.config.ts.
export function loadEnvLocal() {
  const envLocalPath = join(process.cwd(), ".env.local")
  if (!existsSync(envLocalPath)) return
  for (const line of readFileSync(envLocalPath, "utf-8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (!(key in process.env)) process.env[key] = value
  }
}

// Los tests de integración corren contra esta base separada, nunca contra
// la DB de desarrollo (que tiene datos reales migrados + el usuario de QA
// de Playwright — ver CLAUDE.md). Las tablas se truncan libremente entre
// tests porque acá no hay nada que no se pueda perder.
export const TEST_DB_NAME = "capoeira_test"
