import { getIronSession, IronSession } from "iron-session"
import { cookies } from "next/headers"
import type { AppUser } from "./users"

export interface SessionData {
  user?: AppUser
}

export const SESSION_OPTIONS = {
  password: process.env.AUTH_SECRET ?? "capoeira-secret-super-seguro-cambia-esto-en-produccion",
  cookieName: "gaia-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 días
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS)
}
