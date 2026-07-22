"use client"

import { useAuth } from "@/hooks/use-auth"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Award, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CORDAS, getCordaSrc } from "@/lib/constants/cordas"

const ROLE_LABELS: Record<string, string> = {
  admin:  "Administrador",
  member: "Miembro",
}

export default function PerfilPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // ── Apodo ──────────────────────────────────────────────────────────
  const [apodo, setApodo] = useState("")
  const [savingApodo, setSavingApodo] = useState(false)
  const [savedApodo, setSavedApodo] = useState(false)
  const [apodoError, setApodoError] = useState("")

  // ── Avatar (cuerda) ────────────────────────────────────────────────
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [avatarSaved, setAvatarSaved] = useState(false)
  const [avatarError, setAvatarError] = useState("")

  // ── Contraseña ─────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPass, setSavingPass] = useState(false)
  const [savedPass, setSavedPass] = useState(false)
  const [passError, setPassError] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login")
    if (user) {
      setApodo(user.apodo ?? "")
      setSelectedAvatar(user.avatar ?? null)
    }
  }, [user, loading, router])

  // ── Seleccionar avatar ─────────────────────────────────────────────
  const handleSelectAvatar = async (id: string) => {
    if (!user) return
    setSelectedAvatar(id)
    setAvatarSaved(false)
    setAvatarError("")
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar: id }),
    })
    if (res.ok) {
      setAvatarSaved(true)
      setTimeout(() => setAvatarSaved(false), 3000)
    } else {
      setAvatarError("Error al guardar")
      setTimeout(() => setAvatarError(""), 3000)
    }
  }

  // ── Guardar apodo ──────────────────────────────────────────────────
  const handleSaveApodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingApodo(true)
    setSavedApodo(false)
    setApodoError("")

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apodo: apodo.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al guardar")
      setSavedApodo(true)
      setTimeout(() => setSavedApodo(false), 3000)
    } catch (err: unknown) {
      setApodoError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSavingApodo(false)
    }
  }

  // ── Cambiar contraseña ─────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setPassError("")
    setSavedPass(false)

    if (newPassword.length < 6) {
      setPassError("La nueva contraseña debe tener al menos 6 caracteres")
      return
    }
    if (newPassword !== confirmPassword) {
      setPassError("Las contraseñas no coinciden")
      return
    }

    setSavingPass(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al cambiar contraseña")

      setSavedPass(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setSavedPass(false), 4000)
    } catch (err: unknown) {
      setPassError(err instanceof Error ? err.message : "Error al cambiar contraseña")
    } finally {
      setSavingPass(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* ── Info card ── */}
          <Card className="border-border bg-card">
            <CardHeader className="text-center border-b border-border pb-6">
              <div className="flex justify-center mb-4">
                {selectedAvatar
                  ? <img src={getCordaSrc(selectedAvatar)!} alt="Tu cuerda" className="w-28 h-28 object-contain drop-shadow-lg" />
                  : <div className="w-28 h-28 flex items-center justify-center">
                      <User className="w-16 h-16 text-muted-foreground" />
                    </div>
                }
              </div>
              <CardTitle className="font-serif text-2xl text-foreground">
                {user.name}
                {user.apodo && (
                  <span className="block text-lg text-muted-foreground font-normal italic mt-1">
                    «{user.apodo}»
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-primary font-medium">
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground font-medium uppercase text-xs tracking-wide">Usuario</p>
                  <p className="text-foreground">@{user.username}</p>
                </div>
                {user.email && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-medium uppercase text-xs tracking-wide">Email</p>
                    <p className="text-foreground">{user.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Elegir cuerda ── */}
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-serif text-lg text-foreground">Tu cuerda</CardTitle>
              <p className="text-sm text-muted-foreground">Elige la cuerda que te identifica.</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {CORDAS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectAvatar(c.id)}
                    title={c.label}
                    className={`rounded-full overflow-hidden border-2 transition-all focus:outline-none ${
                      selectedAvatar === c.id
                        ? "border-primary ring-2 ring-primary ring-offset-2 scale-110"
                        : "border-transparent hover:border-primary/40"
                    }`}
                  >
                    <img
                      src={`/Cuerda x cuerda/${c.id}.png`}
                      alt={c.label}
                      className="w-full aspect-square object-cover"
                    />
                  </button>
                ))}
              </div>
              {avatarSaved && (
                <p className="text-sm text-primary mt-4 text-center flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4" /> ¡Cuerda guardada!
                </p>
              )}
              {avatarError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md py-2 px-3 mt-4 text-center">
                  {avatarError}
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── Editar apodo ── */}
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-serif text-lg text-foreground">Apodo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tu nombre de capoeira aparecerá en tu perfil.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveApodo} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apodo">Apodo (opcional)</Label>
                  <Input
                    id="apodo"
                    value={apodo}
                    onChange={(e) => setApodo(e.target.value)}
                    disabled={savingApodo}
                    placeholder="Ej: Mariposa do Mar"
                    maxLength={60}
                  />
                </div>
                {apodoError && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md py-2 px-3">
                    {apodoError}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={savingApodo}>
                    {savingApodo ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : "Guardar apodo"}
                  </Button>
                  {savedApodo && (
                    <span className="flex items-center gap-1 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />¡Guardado!
                    </span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* ── Cambiar contraseña ── */}
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-serif text-lg text-foreground">Cambiar contraseña</CardTitle>
              <p className="text-sm text-muted-foreground">
                Necesitas tu contraseña actual para establecer una nueva.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Contraseña actual */}
                <div className="space-y-2">
                  <Label htmlFor="current-pass">Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      id="current-pass"
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={savingPass}
                      placeholder="Tu contraseña actual"
                      required
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Nueva contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="new-pass">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="new-pass"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={savingPass}
                      placeholder="Mínimo 6 caracteres"
                      required
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-pass">Confirmar nueva contraseña</Label>
                  <Input
                    id="confirm-pass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={savingPass}
                    placeholder="Repite la nueva contraseña"
                    required
                    autoComplete="new-password"
                  />
                </div>

                {passError && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md py-2 px-3">
                    {passError}
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={savingPass}>
                    {savingPass
                      ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</>
                      : "Cambiar contraseña"}
                  </Button>
                  {savedPass && (
                    <span className="flex items-center gap-1 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />¡Contraseña actualizada!
                    </span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

        </div>
      </main>

      <Footer />
    </div>
  )
}
