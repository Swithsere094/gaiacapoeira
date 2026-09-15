# Gaia Capoeira

Sitio web del grupo de capoeira **Areia no Mar**: rodas (videos de eventos), cantorias (videos de canto), catálogo de canciones, documentos de política interna y gestión de usuarios/miembros.

En producción en [gaiacapoeira.com](https://gaiacapoeira.com).

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** + shadcn/ui (Radix UI)
- **MySQL 8** vía **Drizzle ORM**
- Auth propio con `iron-session` + `bcryptjs`
- Hosting: Hostinger (Unlimited Web Hosting), con auto-deploy vía Git nativo

Para el contexto completo del proyecto (arquitectura, decisiones de migración, gotchas de despliegue), ver [CLAUDE.md](./CLAUDE.md).

## Desarrollo local

Requiere MySQL corriendo localmente (XAMPP) y pnpm.

```bash
pnpm install
pnpm dev
```

Copiar `.env.example` a `.env.local` y completar las variables (ver detalle en CLAUDE.md).

Abrir [http://localhost:3000](http://localhost:3000).

## Migraciones de base de datos

```bash
pnpm db:generate   # genera la migración a partir de lib/db/schema.ts
pnpm db:migrate    # la aplica
pnpm db:studio     # GUI de Drizzle Studio
```
