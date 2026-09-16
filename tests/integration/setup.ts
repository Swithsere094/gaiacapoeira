import { beforeEach, vi } from "vitest"
import { loadEnvLocal, TEST_DB_NAME } from "../env"

// globalSetup corre en un proceso aparte — sus cambios a process.env no
// llegan acá, así que hay que volver a cargar .env.local y apuntar a la
// DB de test en cada worker que ejecuta un archivo de test.
loadEnvLocal()
process.env.DB_NAME = TEST_DB_NAME

// next/headers (cookies()) solo funciona dentro del request context real
// de Next — como acá se llama a los route handlers directo, sin levantar
// un servidor, se mockea con un store en memoria. getSession() (iron-session
// real, con sellado/firmado real usando AUTH_SECRET) sigue funcionando tal
// cual: solo cambia el transporte de la cookie.
const cookieJar = new Map<string, string>()

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined,
    set: (name: string, value: string) => {
      cookieJar.set(name, value)
    },
    delete: (name: string) => {
      cookieJar.delete(name)
    },
  }),
}))

beforeEach(() => {
  cookieJar.clear()
})
