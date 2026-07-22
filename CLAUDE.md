# CLAUDE.md

Contexto para trabajar en este repo. Léelo antes de tocar auth, base de datos o despliegue — hay decisiones no obvias que no se ven solo mirando el código.

## Dónde vive el código ahora

Este directorio (originalmente una copia de `c:\xampp\htdocs\PROYECTOS\PERSONALES\v0-repositorio-de-capoeira`, hecha para armar el `.zip` del primer despliegue a Hostinger) **es ahora el proyecto activo**. Se va a convertir en un repo de git nuevo (todavía no se hizo `git init`), separado del repo original que estaba enlazado a v0.app/Vercel.

La carpeta vieja en `c:\xampp\htdocs\...` queda congelada como referencia histórica — no se vuelve a tocar. Si algo de este documento menciona esa ruta en ejemplos viejos, ya no aplica; usa la ruta de este proyecto.

MySQL local sigue siendo el mismo XAMPP de siempre (no cambió, solo cambió dónde vive el código de la app) — `.env.local` de este proyecto ya apunta a esa misma base `capoeira` local.

## Qué es esto

Sitio web para un grupo/comunidad de capoeira: rodas (videos de eventos), cantorias (videos de canto), catálogo de canciones, documentos de política interna, gestión de usuarios/miembros. Generado originalmente con **v0.app** y pensado para Vercel + Supabase.

## Estado actual (importante): migración activa fuera de Supabase

El proyecto **se migró de Supabase (Postgres + Auth + Storage) a MySQL + almacenamiento en disco**, y ya está desplegado en un hosting compartido de Hostinger ("Unlimited Web Hosting") en **gaiacapoeira.com**, en vez de pagar Supabase + Vercel. Esto ya está hecho:

- ✅ Backend movido de `@supabase/supabase-js` a **Drizzle ORM + mysql2**.
- ✅ Storage de archivos movido de Supabase Storage a disco local (`public/uploads/`).
- ✅ Esquema completo traducido a MySQL y probado localmente (XAMPP).
- ✅ Sistema de migraciones versionadas con drizzle-kit configurado y funcionando.
- ✅ Migración de **datos reales**: export CSV desde Supabase (Table Editor → Export) + `migration/migrate-csv.ts` → MySQL local (17 usuarios, 7 cantorias, 2 política, 60 rodas, 16 songs), luego volcado a `migration/production-dump.sql` e importado en la base de producción de Hostinger vía phpMyAdmin.
- ✅ Cron automático de sync con YouTube **descartado a propósito** (decisión del creador del proyecto) — ver sección "Decisión: se descartó el cron automático" más abajo. La sincronización sigue existiendo, pero solo manual.
- ✅ **Desplegado y funcionando en producción** (gaiacapoeira.com) — subida manual por zip vía el asistente "Deploy Web App" de hPanel. Ver sección "Despliegue en Hostinger" más abajo para el proceso exacto y un gotcha real que salió con la contraseña de MySQL.

- ✅ `@vercel/analytics` eliminado (código, `package.json`, lockfile) — ya no tira el warning de `/_vercel/insights/script.js` en consola.
- ✅ **Repo de git nuevo creado** en GitHub: [github.com/Swithsere094/gaiacapoeira](https://github.com/Swithsere094/gaiacapoeira), rama `main`, primer commit ya pusheado (165 archivos, sin nada sensible — `.env.local`, el dump de datos y `node_modules` quedaron fuera correctamente por `.gitignore`). Este repo es independiente del repo original enlazado a v0.app/Vercel — no lo toca.

Lo que **falta ahora mismo — SIGUIENTE TAREA A TRABAJAR**:

- ❌ **CI/CD para auto-deploy en push a `main`** — ver sección dedicada "CI/CD" más abajo, tiene el plan completo y los datos concretos del servidor que hacen falta para armarlo (ruta del deploy en Hostinger, credenciales ya puestas, etc.). Este es el trabajo que sigue.
- ❌ 2 documentos de `politica` migrados con `file_url` apuntando todavía a Supabase Storage (archivos no migrados, solo el link) — bajarlos y resubirlos a `public/uploads/politica/` cuando se dé de baja Supabase. Menor, no urgente.
- ❌ Construir el backend (rutas API) de los módulos que ya tienen tablas pero no tienen código: ver "Tablas sin usar todavía" más abajo. No pedido todavía, solo queda documentado por si se retoma.

Si ves código que hace referencia a Supabase en algún sitio no mencionado aquí, probablemente sea una regresión — no debería quedar nada (`@supabase/*` ya no está ni en `package.json`).

## Stack técnico

- **Frontend/Backend**: Next.js 16 (App Router) + React 19 + TypeScript, todo en un solo proyecto (rutas API en `app/api/**`, sin backend separado).
- **UI**: Tailwind CSS 4 + shadcn/ui (`components/ui/`) sobre Radix UI.
- **Base de datos**: MySQL 8, accedida con **Drizzle ORM** (`drizzle-orm/mysql2`).
- **Auth**: sistema propio (no Supabase Auth) con `iron-session` (cookie `gaia-session`) + `bcryptjs` para contraseñas.
- **Gestor de paquetes**: pnpm.
- **Hosting objetivo**: Hostinger "Unlimited Web Hosting" (plan compartido). Confirmado que soporta Node.js apps (incluye Next.js explícitamente), SSH y pnpm — pero **no ofrece PostgreSQL en hosting compartido, solo MySQL/MariaDB**. Esa es la razón técnica de fondo de toda la migración.

## Base de datos

### Archivos clave

| Archivo | Qué es |
|---|---|
| `lib/db/schema.ts` | **Fuente de verdad del esquema.** Todos los cambios de tablas se hacen editando este archivo. |
| `lib/db/client.ts` | Cliente Drizzle + pool de mysql2. Lee `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` del entorno. |
| `drizzle.config.ts` | Config de drizzle-kit. Carga `.env.local` a mano (drizzle-kit no lo hace solo). |
| `drizzle/` | Migraciones generadas y versionadas (SQL). **Se commitea a git.** |
| `migration/mysql-schema.sql` | ⚠️ Histórico. Era el script manual antes de configurar drizzle-kit. Ya no se edita ni se usa para aplicar cambios — se dejó solo como referencia de la traducción inicial Postgres→MySQL. |
| `migration/seed-admin.ts` | Script para crear un usuario admin de prueba: `npx tsx migration/seed-admin.ts <user> <pass>`. |

### Flujo de migraciones (nunca hacer `DROP DATABASE` a mano)

```bash
# 1. Editar lib/db/schema.ts (agregar tabla/columna/índice/etc.)
pnpm db:generate   # genera drizzle/000X_xxx.sql con el diff
# 2. Revisar el SQL generado
pnpm db:migrate    # lo aplica; solo corre lo que falte (tabla __drizzle_migrations lleva el registro)
```

Este mismo `pnpm db:migrate` se corre tanto en local como en producción. También existe `pnpm db:studio` (GUI web de Drizzle Studio para inspeccionar datos).

### Las 12 tablas

**En uso real por el código** (rutas API en `app/api/**` las consultan):
`usuarios`, `cantorias`, `politica`, `rodas`, `songs`.

**Con esquema listo pero sin backend/API todavía** (tablas creadas, sin rutas):
`articles`, `movements`, `portuguese_lessons`, `portuguese_vocabulary`, `comments`, `favorites`, `user_lesson_progress`.

Importante: las páginas de frontend `app/articulos/page.tsx`, `app/movimientos/page.tsx` y `app/portugues/page.tsx` **ya existen visualmente pero usan arrays hardcodeados como mock data** — no hacen `fetch` a ninguna API. Son candidatas obvias para conectar a `articles`, `movements` y `portuguese_lessons`/`portuguese_vocabulary` respectivamente cuando se construya ese backend.

`profiles` existía en Supabase pero **se excluyó a propósito**: estaba vacía en producción y era redundante con `usuarios` (parece ser un remanente de cuando el proyecto pensaba usar Supabase Auth, antes de pasar a auth propio).

### Política de foreign keys en `user_id`

Ninguna de estas columnas tenía FK en el Postgres original (quedó pendiente en el proyecto original). Al migrar se definió una política a propósito, dividida en dos grupos — tenla en cuenta si agregas una tabla nueva con `user_id`:

- **Contenido curado** (`articles`, `movements`, `portuguese_lessons`, `rodas`, `songs`): `user_id` nullable, `ON DELETE SET NULL`. El contenido sobrevive si se borra el usuario que lo creó.
- **Datos propios del usuario** (`comments`, `favorites`, `user_lesson_progress`): `user_id` NOT NULL, `ON DELETE CASCADE`. Si se borra el usuario, sus comentarios/favoritos/progreso se borran con él.

Las FKs están declaradas en `lib/db/schema.ts` con `.references(() => tabla.columna, { onDelete: "..." })` — **no basta con ponerlas solo en SQL a mano**, drizzle-kit genera las migraciones a partir del `.ts`, así que si falta el `.references()` ahí, la migración sale sin la constraint (ya pasó una vez).

### Gotcha importante: columnas JSON

MySQL no tiene tipo array nativo (a diferencia de Postgres `text[]`). Se usan columnas `JSON`, pero **mysql2 no las parsea automáticamente de vuelta a array/objeto JS al leerlas** (las devuelve como string crudo) — a diferencia de lo que hacía el cliente de Supabase. Por eso en `lib/db/schema.ts` existe un tipo custom `jsonArray` (via `customType` de Drizzle) que hace `JSON.stringify`/`JSON.parse` en ambas direcciones. **Usa `jsonArray(...)` para cualquier columna nueva que deba comportarse como array**, no uses `json()` a secas o te vas a encontrar con strings donde esperabas arrays.

### IDs

Los IDs son UUID (`CHAR(36)`), pero **se generan en la aplicación** con `randomUUID()` de `node:crypto`, no con un default de MySQL. Razón: MySQL no soporta `RETURNING`, así que si dejáramos que la base genere el ID no habría forma de devolver la fila recién creada sin una vuelta extra. Patrón en todas las rutas POST:

```ts
const id = randomUUID()
await db.insert(tabla).values({ id, ...resto })
const [data] = await db.select().from(tabla).where(eq(tabla.id, id)).limit(1)
return NextResponse.json(data, { status: 201 })
```

## Auth

- Tabla `usuarios` (no `profiles`, no Supabase Auth). Roles: `admin` | `member`.
- Sesión con `iron-session`, cookie `gaia-session`, definida en `lib/auth/session.ts`.
- Todas las operaciones de usuario están en `lib/auth/db.ts` (login, crear, editar, borrar, reset de contraseña).
- `proxy.ts` (en la raíz) es el middleware de Next — exige la cookie de sesión en **todas** las rutas excepto `/auth/login`, `/auth/olvide-contrasena`, `/api/auth/login`, `/api/auth/olvide-contrasena`. Si una ruta nueva necesita ser pública, hay que agregarla a `PUBLIC_PATHS` ahí.

## Storage de archivos

- `lib/storage.ts`: `saveFile()` / `deleteFile()` / `urlToRelativePath()`. Guarda en `public/uploads/<carpeta>/` y sirve como estático de Next en `/uploads/<carpeta>/<archivo>`.
- Único uso real hoy: subida de documentos de política (`app/api/politica/upload/route.ts`, admin only, máx 20 MB).
- `public/uploads/` está en `.gitignore` (son archivos de usuario, no código).
- **Importante para el despliegue**: si el flujo de deploy en Hostinger hace un `git checkout`/clone limpio en cada release, hay que asegurarse de que `public/uploads/` no se borre entre despliegues (los archivos subidos deben persistir fuera del árbol versionado).
- El componente `components/video-upload.tsx` que subía directo a Supabase Storage desde el browser **se eliminó** (no se usaba en ninguna página). Si se retoma esa función, tiene que subir el archivo a una ruta API del servidor (como hace `politica/upload`), no llamar a un storage client desde el cliente — ya no hay uno.

## Desarrollo local

Este proyecto se desarrolla con **XAMPP** (MySQL local), no con Docker ni un MySQL remoto.

```powershell
# 1. Arrancar MySQL (XAMPP Control Panel, o:)
cd C:\xampp
.\mysql_start.bat

# 2. Arrancar Next (desde este proyecto, ya no desde la carpeta de XAMPP)
cd "C:\Users\Protom-M\Desktop\capoeira-para-hostinger"
pnpm dev
```

`.env.local` (no versionado) debe tener `DB_HOST=localhost`, `DB_USER=root`, `DB_PASSWORD=` (vacío por defecto en XAMPP), `DB_NAME=capoeira`, `AUTH_SECRET`, y las variables de YouTube/cron si se van a probar esas rutas (ver `.env.example` para la lista completa).

Nota: con contraseña vacía, `drizzle.config.ts` necesita `password: process.env.DB_PASSWORD || undefined` — un string vacío hace que drizzle-kit crea que falta la contraseña y tire error de "missing params".

Para tener un usuario con el que entrar: `npx tsx migration/seed-admin.ts admin admin123`.

## Cómo agregar un módulo nuevo (ej. activar "movimientos")

1. La tabla probablemente ya existe en `lib/db/schema.ts` (ver lista de tablas arriba) — revisa antes de crear una nueva.
2. Crear las rutas en `app/api/<modulo>/route.ts` (GET lista + POST crear) y `app/api/<modulo>/[id]/route.ts` (PUT/DELETE), siguiendo el patrón ya usado en `app/api/rodas/` o `app/api/songs/` (import de `db` y la tabla desde `lib/db/*`, chequeo de sesión con `getSession()`, chequeo de rol admin donde aplique).
3. Conectar la página de frontend correspondiente (si ya existe como mock, como `app/movimientos/page.tsx`) reemplazando el array hardcodeado por un `fetch` a la API nueva.
4. Si la tabla necesita una columna nueva que no se prevé todavía, es el flujo normal de migraciones (`pnpm db:generate` + `pnpm db:migrate`).

## Despliegue en Hostinger (✅ ya hecho — gaiacapoeira.com)

Proceso real que se usó (no vía git, subida manual de zip):

1. hPanel → MySQL Databases → crear base + usuario (queda prefijado con el usuario de hosting, ej. `u762014524_gaiacapoeira`).
2. Importar `migration/production-dump.sql` en esa base por **phpMyAdmin** (pestaña Import). Ojo: el dump NO debe traer `CREATE DATABASE`/`USE` — se le quitaron esas líneas a propósito porque el usuario de hosting compartido no tiene permiso de crear bases, solo de escribir en la que ya existe.
3. Armar un `.zip` del proyecto **sin**: `node_modules/`, `.next/`, `.git/`, `.env.local`, `migration/csv-export/`, `migration/production-dump.sql`.
4. hPanel → Websites → Add Website → **Deploy Web App → Upload your website files** → subir el zip. Hostinger auto-detecta framework (Next.js) y gestor de paquetes (pnpm, por el `pnpm-lock.yaml`) — no hace falta correr comandos a mano por SSH, el panel corre `pnpm install` + `pnpm run build` solo.
5. En la pantalla de revisión, sección **Variables de entorno** → cargar las mismas de `.env.example` (9 en total: 5 de DB + `AUTH_SECRET` + 3 de YouTube — ya no hay `CRON_SECRET`).
6. Deploy. Reiniciar la app si se agregan/cambian variables después.

### Gotcha real que se dio en este despliegue: "Access denied" al hacer login

Con todo desplegado y las env vars puestas, el login tiraba 500 con:
```
Error: Access denied for user 'u762014524_gaiacapoeira'@'2a02:4780:2b:1234::29' (using password: YES)
```
La IP en el error es la IP interna desde la que el contenedor de la Node.js App se conecta a MySQL (no es la IP pública ni "localhost"). Se investigaron dos hipótesis:

1. **Acceso remoto no habilitado** — se probó agregando `%` en hPanel → MySQL Databases → **MySQL remoto**. No resolvió nada (el error seguía idéntico), así que esto ya estaba bien o no era la causa real.
2. **Contraseña** — se **reseteó la contraseña del usuario MySQL a una sin caracteres especiales** (solo alfanumérico) y se actualizó `DB_PASSWORD` en las env vars. **Esto sí lo resolvió.**

Conclusión: probablemente algún carácter especial de la contraseña original no viajaba bien al guardarse en el campo de variables de entorno del panel de Hostinger. **Recomendación para el futuro**: usar siempre contraseñas de base de datos alfanuméricas (sin `@ $ % " ' \` ni similares) para las credenciales que van a vivir en variables de entorno de este panel.

## CI/CD (pendiente de construir)

Todavía no existe. Decisión tomada durante el primer despliegue: automatizar recién ahora que el proceso manual ya está probado y funcionando (para no automatizar a ciegas algo nunca antes ejecutado). Dos caminos evaluados, ninguno implementado todavía:

1. **Git integration nativa de hPanel** (Advanced/Websites → Git): Hostinger puede conectar un repo de GitHub y hacer pull automático vía webhook al hacer push. Más simple, cero config de CI externa — **probar esta primero**, revisar si el plan la soporta.
2. **GitHub Actions + SSH**: un workflow que en cada push a `main` entra por SSH (hay acceso confirmado) y corre `git pull && pnpm install && pnpm db:migrate && pnpm build` + reinicia la Node.js App. Más control/logs, pero hay que guardar la llave SSH como secret en GitHub.

**Datos concretos del servidor** (sacados de los logs de error durante el primer despliegue):
- Ruta de la app en el servidor: `/home/u762014524/domains/gaiacapoeira.com/nodejs/`
- Usuario de hosting: `u762014524`
- Repo de GitHub: `https://github.com/Swithsere094/gaiacapoeira.git`, rama `main`

Cosas a decidir cuando se arme esto:
- ¿El deploy corre `pnpm db:migrate` automáticamente, o eso se sigue haciendo a mano por ahora? (Recomendado: automatizarlo también, es idempotente — ver sección de migraciones arriba.)
- `public/uploads/` no debe borrarse en cada deploy — confirmar que el método elegido no haga un checkout limpio que se lleve por delante esa carpeta.
- Variables de entorno de producción ya están puestas a mano en el Node.js App de hPanel (9 variables — ver `.env.example`) — un redeploy vía git no debería tocarlas, pero confirmarlo la primera vez.
- **Gotcha ya conocido**: si en algún momento hay que volver a tocar `DB_PASSWORD` u otra variable con caracteres especiales en el panel de Hostinger, usar solo alfanumérico (ver el gotcha de "Access denied" documentado arriba, en la sección de despliegue) — no confirmado si el problema era el campo de variables de entorno específicamente o algo más amplio del panel.

## Otras notas sueltas

- `next.config.mjs` tiene `typescript: { ignoreBuildErrors: true }` (preexistente, no es cosa de esta migración) — `next build` no va a fallar por errores de tipos. Usa `npx tsc --noEmit` para chequear tipos de verdad.
- El gestor de paquetes es pnpm — no uses `npm install` ni generes un `package-lock.json`.

## Decisión: se descartó el cron automático

`/api/rodas/sync-cron` (endpoint pensado para Vercel Cron, protegido con `CRON_SECRET`) y `vercel.json` **se eliminaron a propósito** — el creador del proyecto decidió no migrar esa automatización al nuevo hosting. La sincronización con YouTube sigue existiendo, pero **solo de forma manual**: los botones de "Sincronizar" en `/galera`, que pegan a `/api/rodas/sync` y `/api/cantorias/sync` (ambos POST, requieren sesión de admin). Si en el futuro se pide reactivar la sincronización automática, hay que recrear ese endpoint (es básicamente `rodas/sync` pero con auth por `CRON_SECRET` en vez de sesión) y configurar un cron job en hPanel — no es algo que quedó a medias, fue una decisión de producto.
