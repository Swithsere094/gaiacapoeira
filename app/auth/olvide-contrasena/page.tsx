"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound, User, Mail, Copy, CheckCircle, ArrowLeft } from "lucide-react"

export default function OlvideContrasenaPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [tempPassword, setTempPassword] = useState("")
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/olvide-contrasena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Error al procesar la solicitud")
      } else {
        setTempPassword(data.tempPassword)
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-serif text-2xl text-foreground">
            Recuperar contraseña
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Ingresa tu usuario y el email registrado en tu cuenta
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* ── Success state ── */}
          {tempPassword ? (
            <div className="space-y-5">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-primary mx-auto" />
                <p className="font-semibold text-foreground">¡Contraseña generada!</p>
                <p className="text-sm text-muted-foreground">
                  Esta es tu contraseña temporal. Úsala para iniciar sesión y cámbiala desde tu perfil.
                </p>

                {/* Password display */}
                <div className="flex items-center gap-2 bg-background rounded-lg px-4 py-3 border border-border">
                  <code className="flex-1 text-lg font-mono font-bold tracking-widest text-foreground text-center">
                    {tempPassword}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Copiar contraseña"
                  >
                    {copied
                      ? <CheckCircle className="w-5 h-5 text-primary" />
                      : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Guarda esta contraseña antes de cerrar esta página.
                </p>
              </div>

              <Link href="/auth/login">
                <Button className="w-full">
                  Ir al inicio de sesión
                </Button>
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="tu-usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email registrado</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Debe coincidir con el email que el administrador registró en tu cuenta.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md py-2 px-3">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verificando..." : "Generar contraseña temporal"}
              </Button>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
