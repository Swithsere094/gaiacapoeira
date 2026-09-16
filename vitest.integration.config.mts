import { defineConfig } from "vitest/config"

// Tests de integración: ejercitan las rutas API reales (app/api/**) contra
// una base MySQL de prueba dedicada (capoeira_test, ver tests/env.ts).
// Requiere MySQL local corriendo (XAMPP) — no pensado para CI todavía.
export default defineConfig({
  resolve: {
    alias: { "@": import.meta.dirname },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/integration/setup.ts"],
    globalSetup: ["./tests/global-setup.ts"],
    testTimeout: 15000,
    hookTimeout: 15000,
    // Varios archivos comparten la misma DB de prueba (truncan tablas entre
    // tests) — correr en serie evita que se pisen entre sí.
    fileParallelism: false,
  },
})
