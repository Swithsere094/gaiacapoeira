import { defineConfig } from "vitest/config"

// Unit tests puros: sin DB, sin mocks de Next. Ver vitest.integration.config.mts
// para los tests de rutas API contra MySQL.
export default defineConfig({
  resolve: {
    alias: { "@": import.meta.dirname },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
})
