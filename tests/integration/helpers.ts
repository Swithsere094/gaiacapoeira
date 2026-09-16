import { randomUUID } from "crypto"
import { getSession } from "@/lib/auth/session"
import type { AppUser } from "@/lib/auth/users"

// Sella una sesión real (vía getSession()/iron-session) en el cookie jar
// mockeado de tests/integration/setup.ts, para que el route handler bajo
// test la lea como si viniera de un browser autenticado. El usuario no
// necesita existir en la tabla `usuarios`: los route handlers solo miran
// session.user, nunca vuelven a consultar la DB para re-verificar el rol.
export async function loginAs(overrides: Partial<AppUser> & { role: AppUser["role"] }) {
  const user: AppUser = {
    id: randomUUID(),
    username: "test-user",
    name: "Test User",
    email: null,
    apodo: null,
    avatar: null,
    ...overrides,
  }
  const session = await getSession()
  session.user = user
  await session.save()
  return user
}
