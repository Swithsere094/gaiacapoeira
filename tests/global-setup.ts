import { execSync } from "child_process"
import mysql from "mysql2/promise"
import { loadEnvLocal, TEST_DB_NAME } from "./env"

// Corre una vez antes de toda la suite de integración: crea capoeira_test
// si no existe y le aplica las migraciones de drizzle. Idempotente — no
// pasa nada si ya estaba creada/migrada.
export default async function globalSetup() {
  loadEnvLocal()

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || undefined,
  })
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${TEST_DB_NAME}\``)
  await connection.end()

  execSync("npx drizzle-kit migrate", {
    stdio: "inherit",
    env: { ...process.env, DB_NAME: TEST_DB_NAME },
  })
}
