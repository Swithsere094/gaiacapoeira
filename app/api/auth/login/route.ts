import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { verifyCredentials } from "@/lib/auth/db"

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: "Usuario y contraseña requeridos" }, { status: 400 })
  }

  const user = await verifyCredentials(username, password)

  if (!user) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 })
  }

  const session = await getSession()
  session.user = user
  await session.save()

  return NextResponse.json({ user })
}
