/**
 * Tipos del sistema de usuarios.
 * Los usuarios se almacenan en la tabla `usuarios` de Supabase.
 * La autenticación usa iron-session con bcrypt para las contraseñas.
 */

export interface AppUser {
  id: string
  username: string
  name: string
  email: string | null
  role: "admin" | "member"
  apodo: string | null
  avatar: string | null
}
