# CLAUDE.md

Contexto para trabajar en este repo. Léelo antes de tocar auth, base de datos o despliegue — hay decisiones no obvias que no se ven solo mirando el código.

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
- ✅ **Desplegado y funcionando en producción** (gaiacapoeira.com). El primer despliegue fue manual por zip vía el asistente "Deploy Web App" de hPanel; luego se migró a auto-deploy con Git nativo (ver sección "CI/CD y despliegue en Hostinger" más abajo).

- ✅ `@vercel/analytics` eliminado (código, `package.json`, lockfile) — ya no tira el warning de `/_vercel/insights/script.js` en consola.
- ✅ **Repo de git nuevo creado** en GitHub: [github.com/Swithsere094/gaiacapoeira](https://github.com/Swithsere094/gaiacapoeira), rama `main`. Este repo es independiente del repo original enlazado a v0.app/Vercel — no lo toca.
- ✅ **CI/CD: push a `main` despliega solo en gaiacapoeira.com.** Ver sección "CI/CD y despliegue" más abajo — tiene la arquitectura final y varios gotchas reales que costaron bastante encontrar (puerto, CDN, invocación de pnpm anidada).

Lo que queda pendiente, sin urgencia:

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
- `proxy.ts` (en la raíz, convención actual de Next.js 16 — ver gotcha en "CI/CD y despliegue" sobre por qué no se llama `middleware.ts`) exige la cookie de sesión en **todas** las rutas excepto `/auth/login`, `/auth/olvide-contrasena`, `/api/auth/login`, `/api/auth/olvide-contrasena`. Si una ruta nueva necesita ser pública, hay que agregarla a `PUBLIC_PATHS` ahí. Todas las respuestas que pasan por acá llevan `Cache-Control: private, no-store` (necesario por el CDN de Hostinger, ver el mismo gotcha).

## Storage de archivos

- `lib/storage.ts`: `saveFile()` / `deleteFile()` / `urlToRelativePath()`. Guarda en `public/uploads/<carpeta>/` y sirve como estático de Next en `/uploads/<carpeta>/<archivo>`.
- Único uso real hoy: subida de documentos de política (`app/api/politica/upload/route.ts`, admin only, máx 20 MB).
- `public/uploads/` está en `.gitignore` (son archivos de usuario, no código).
- Confirmado que `public/uploads/` sobrevive a los auto-deploys (ver "CI/CD y despliegue" más abajo) — al estar en `.gitignore`, el pipeline de Git de Hostinger nunca la toca.
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

## CI/CD y despliegue en Hostinger (✅ ya hecho — gaiacapoeira.com)

**Push a `main` despliega solo.** La Node.js App de hPanel está conectada directo al repo de GitHub (`https://github.com/Swithsere094/gaiacapoeira`, rama `main`) con auto-deploy nativo — no hay workflow de GitHub Actions haciendo el deploy en sí.

### Cómo se llegó a esto (por si hay que tocarlo de nuevo)

Se evaluaron dos caminos y **los dos primeros que se probaron fallaron por límites reales de este plan de hosting compartido**, no por error de configuración:

1. **GitHub Actions + SSH** (correr `git pull && pnpm install && pnpm build` por SSH desde un workflow) — **descartado**: confirmado por SSH real que este plan de Hostinger no expone `node`/`npm`/`pnpm` en el shell (ni siquiera `node` está en el PATH). El build y el runtime de Node solo los maneja el pipeline interno del panel, inalcanzable por SSH.
2. **Conectar Git nativo a la Node.js App ya existente** (la que se había desplegado por zip) — **no es posible**: la pantalla de "Ajustes y reimplementación" de una app ya desplegada por zip solo ofrece "Usa archivos anteriores" / "Subir archivos nuevos", nunca una opción de GitHub. Hostinger solo deja elegir Git como fuente **al crear la app por primera vez**.
3. **Lo que sí funcionó**: recrear la Node.js App desde cero (hPanel → Websites → remover el sitio actual → Add Website → Deploy Web App → fuente **Git/GitHub**, mismo dominio, mismo repo). Esto sí deja Git nativo con auto-deploy real.

### Configuración de la Node.js App actual

- Framework preset: Next.js · Node.js version: 22.x · Root directory: `./` · Package manager: pnpm · Output directory: `.next`
- **Build command: `pnpm run build`**, sin tocar — el campo de hPanel es un dropdown cerrado que solo deja elegir entre los scripts que ya existen en `package.json` (no admite comandos encadenados a mano tipo `a && b`). Por eso el propio script `build` en `package.json` hace todo el trabajo:
  ```json
  "build": "drizzle-kit migrate && next build"
  ```
  Así las migraciones quedan automatizadas en cada deploy sin depender de un paso aparte (es idempotente, no rompe nada si no hay cambios de esquema). **Importante**: adentro de ese script hay que invocar `drizzle-kit` directo, no `pnpm run db:migrate` — un sub-shell del build no tiene el binario `pnpm` en su PATH (solo los binarios locales de `node_modules/.bin`), así que una invocación anidada de `pnpm` falla con "command not found".
- Variables de entorno: las mismas 9 de siempre (ver `.env.example`), cargadas a mano en la Node.js App.
- `public/uploads/` sobrevive a los deploys sin problema — el pipeline de Hostinger clona/reconstruye en un directorio de build (`.builds/source/repository/`) y esa carpeta nunca formó parte del repo (está en `.gitignore`), así que no hay riesgo de que un deploy la pise.

### Gotchas reales de esta migración a Git nativo (todos ya resueltos, dejar documentado por si vuelven a aparecer)

- **`pnpm/action-setup@v4` sin versión de pnpm especificada** → se fijó `"packageManager": "pnpm@11.15.1"` en `package.json` (necesario también para que `pnpm/action-setup` en `.github/workflows/ci.yml` no falle).
- **Node 20 vs pnpm 11**: pnpm 11.x exige Node ≥ 22.13 — el workflow de CI tenía Node 20 hardcodeado, se cambió a 22.
- **"Access denied" de MySQL de nuevo**, mismo patrón que en el despliegue original (ver más abajo), esta vez durante el paso de migración en build. Mismo tipo de causa/solución: contraseña de MySQL sin caracteres especiales.
- **Procesos duplicados / assets con 404**: tras varios intentos de deploy fallidos seguidos, quedaron procesos Node viejos corriendo en paralelo (se veía en los logs de runtime como el mismo "Ready" repetido en pares). Un **"Redesplegar" manual** desde el dashboard de la app los limpia.
- **El más importante — `next start` ignora `process.env.PORT` por defecto.** Esta modalidad de Node.js App de Hostinger le asigna un puerto dinámico a la app vía `$PORT` y espera que escuche ahí; `next start` a secas siempre usa el 3000 fijo. Si no coinciden, el proxy de Hostinger nunca ve la app "lista" y la mata/reinicia en loop indefinidamente — **sin ningún error en los logs de la app** (el síntoma es confuso: parece que arranca bien una y otra vez, pero el sitio da 503 todo el tiempo). Solución en `package.json`:
  ```json
  "start": "next start -p ${PORT:-3000}"
  ```
- **CDN cacheando páginas protegidas por auth**: la Node.js App tiene CDN activado por defecto, y cachea el HTML completo de rutas como `/` y `/auth/login` en el edge **sin tener en cuenta la cookie de sesión** — un visitante sin sesión podía recibir una copia cacheada del contenido protegido en vez de que `proxy.ts` lo redirija a login (porque el CDN nunca reenvía el pedido al origen, así que el middleware ni se entera). Se resolvió agregando `Cache-Control: private, no-store` a toda respuesta que pasa por `proxy.ts`. Después de cambiar esto (o el build command, o cualquier cosa que afecte cache) conviene purgar el caché del CDN desde hPanel para no seguir viendo versiones viejas.
- **Ojo con `proxy.ts` — es el nombre correcto, no lo renombres a `middleware.ts`.** Next.js 16 renombró la convención de `middleware.ts`/`export function middleware` a `proxy.ts`/`export function proxy` (`middleware.ts` quedó deprecado, solo para Edge runtime). El build de Next confirma que se está usando bien si en el log de build aparece la línea `ƒ Proxy (Middleware)` en la tabla de rutas.

### `.github/workflows/ci.yml`

Un workflow de GitHub Actions separado (`build-check`) corre en cada push como red de seguridad — solo hace `pnpm install` + `pnpm exec next build` en el runner de GitHub, sin tocar el servidor ni la base de datos de producción (por eso usa `next build` directo y no el script `build` del proyecto, que incluye `drizzle-kit migrate` y necesitaría credenciales de DB que a propósito no viven en GitHub Secrets). Si este check falla, no impide el auto-deploy de hPanel — son dos cosas independientes, este es solo una alerta temprana de que algo no compila.

### Gotcha real que se dio en el despliegue original (por zip): "Access denied" al hacer login

Con todo desplegado y las env vars puestas, el login tiraba 500 con:
```
Error: Access denied for user 'u762014524_gaiacapoeira'@'2a02:4780:2b:1234::29' (using password: YES)
```
La IP en el error es la IP interna desde la que el contenedor de la Node.js App se conecta a MySQL (no es la IP pública ni "localhost"). Se investigaron dos hipótesis:

1. **Acceso remoto no habilitado** — se probó agregando `%` en hPanel → MySQL Databases → **MySQL remoto**. No resolvió nada (el error seguía idéntico), así que esto ya estaba bien o no era la causa real.
2. **Contraseña** — se **reseteó la contraseña del usuario MySQL a una sin caracteres especiales** (solo alfanumérico) y se actualizó `DB_PASSWORD` en las env vars. **Esto sí lo resolvió.**

Conclusión: probablemente algún carácter especial de la contraseña original no viajaba bien al guardarse en el campo de variables de entorno del panel de Hostinger. **Recomendación para el futuro**: usar siempre contraseñas de base de datos alfanuméricas (sin `@ $ % " ' \` ni similares) para las credenciales que van a vivir en variables de entorno de este panel — este mismo problema volvió a aparecer una vez más durante la migración a Git nativo.

## Otras notas sueltas

- `next.config.mjs` tiene `typescript: { ignoreBuildErrors: true }` (preexistente, no es cosa de esta migración) — `next build` no va a fallar por errores de tipos. Usa `npx tsc --noEmit` para chequear tipos de verdad.
- El gestor de paquetes es pnpm — no uses `npm install` ni generes un `package-lock.json`.

## Decisión: se descartó el cron automático

`/api/rodas/sync-cron` (endpoint pensado para Vercel Cron, protegido con `CRON_SECRET`) y `vercel.json` **se eliminaron a propósito** — el creador del proyecto decidió no migrar esa automatización al nuevo hosting. La sincronización con YouTube sigue existiendo, pero **solo de forma manual**: los botones de "Sincronizar" en `/galera`, que pegan a `/api/rodas/sync` y `/api/cantorias/sync` (ambos POST, requieren sesión de admin). Si en el futuro se pide reactivar la sincronización automática, hay que recrear ese endpoint (es básicamente `rodas/sync` pero con auth por `CRON_SECRET` en vez de sesión) y configurar un cron job en hPanel — no es algo que quedó a medias, fue una decisión de producto.
