"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useAuth } from "@/hooks/use-auth"
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ShieldCheck,
  User,
  Shuffle,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
} from "lucide-react"

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join("")
}
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface AppUser {
  id: string
  username: string
  name: string
  email: string | null
  role: "admin" | "member"
  apodo: string | null
}

const EMPTY_FORM = {
  username: "",
  name: "",
  email: "",
  role: "member" as "admin" | "member",
  apodo: "",
  password: "",
  passwordConfirm: "",
}

const roleLabels = { admin: "Administrador", member: "Miembro" }
const roleColors = {
  admin:  "bg-primary/20 text-primary",
  member: "bg-secondary text-secondary-foreground",
}

export default function AdminUsuariosPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  // Password UX
  const [showPassword, setShowPassword] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)

  // ── Redirigir si no es admin ────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/")
    }
  }, [user, authLoading, router])

  // ── Fetch usuarios ──────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Error al cargar usuarios")
      const data = await res.json()
      setUsers(data)
    } catch {
      setError("No se pudieron cargar los usuarios.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === "admin") fetchUsers()
  }, [user, fetchUsers])

  // ── Dialog helpers ──────────────────────────────────────────────────
  const openAdd = () => {
    setEditingUser(null)
    setForm(EMPTY_FORM)
    setFormError("")
    setShowPassword(false)
    setCopiedPassword(false)
    setDialogOpen(true)
  }

  const openEdit = (u: AppUser) => {
    setEditingUser(u)
    setForm({
      username: u.username,
      name: u.name,
      email: u.email ?? "",
      role: u.role,
      apodo: u.apodo ?? "",
      password: "",
      passwordConfirm: "",
    })
    setFormError("")
    setShowPassword(false)
    setCopiedPassword(false)
    setDialogOpen(true)
  }

  // ── Save ─────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError("")

    if (!editingUser && !form.password) {
      setFormError("La contraseña es obligatoria para nuevos usuarios")
      return
    }
    if (form.password && form.password !== form.passwordConfirm) {
      setFormError("Las contraseñas no coinciden")
      return
    }
    if (form.password && form.password.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setSaving(true)

    const url    = editingUser ? `/api/users/${editingUser.id}` : "/api/users"
    const method = editingUser ? "PUT" : "POST"

    const payload: Record<string, unknown> = {
      name:  form.name,
      email: form.email || null,
      role:  form.role,
      apodo: form.apodo || null,
    }
    if (!editingUser) payload.username = form.username
    if (form.password) payload.password = form.password

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al guardar")

      await fetchUsers()
      setDialogOpen(false)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = async (u: AppUser) => {
    if (u.id === user?.id) {
      alert("No puedes eliminarte a ti mismo.")
      return
    }
    if (!confirm(`¿Eliminar al usuario "${u.name}"?`)) return
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      setUsers((prev) => prev.filter((x) => x.id !== u.id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar el usuario.")
    }
  }

  // ── Guard loading ─────────────────────────────────────────────────
  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                Gestión de Usuarios
              </h1>
              <p className="text-muted-foreground mt-1">
                Crea, edita y elimina los usuarios del grupo
              </p>
            </div>
            <Button onClick={openAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo usuario
            </Button>
          </div>

          {/* Error / Loading */}
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {!loading && error && (
            <p className="text-destructive text-center py-8">{error}</p>
          )}

          {/* Users list */}
          {!loading && !error && (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="bg-card rounded-xl p-5 flex items-center gap-4"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    {u.role === "admin"
                      ? <ShieldCheck className="w-6 h-6 text-primary" />
                      : <User className="w-6 h-6 text-primary" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-bold text-foreground">
                        {u.name}
                      </span>
                      {u.apodo && (
                        <span className="text-sm text-muted-foreground italic">
                          «{u.apodo}»
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded font-medium",
                          roleColors[u.role]
                        )}
                      >
                        {roleLabels[u.role]}
                      </span>
                      {u.id === user.id && (
                        <span className="text-xs text-muted-foreground">(tú)</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      @{u.username}
                      {u.email && <span> · {u.email}</span>}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => openEdit(u)}
                      onKeyDown={(e) => e.key === "Enter" && openEdit(u)}
                      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                      aria-label="Editar usuario"
                    >
                      <Pencil className="w-4 h-4" />
                    </span>
                    {u.id !== user.id && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => handleDelete(u)}
                        onKeyDown={(e) => e.key === "Enter" && handleDelete(u)}
                        className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        aria-label="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingUser ? "Editar usuario" : "Nuevo usuario"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-2">
            {/* Username — solo al crear */}
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="username">Usuario *</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      username: e.target.value.toLowerCase().replace(/\s/g, ""),
                    }))
                  }
                  required
                  disabled={saving}
                  placeholder="sin espacios, ej: mariabatizado"
                />
              </div>
            )}

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                disabled={saving}
                placeholder="Ej: María García"
              />
            </div>

            {/* Apodo */}
            <div className="space-y-2">
              <Label htmlFor="apodo">Apodo (opcional)</Label>
              <Input
                id="apodo"
                value={form.apodo}
                onChange={(e) => setForm((f) => ({ ...f, apodo: e.target.value }))}
                disabled={saving}
                placeholder="Ej: Mariposa do Mar"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                disabled={saving}
                placeholder="maria@ejemplo.com"
              />
            </div>

            {/* Rol */}
            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={form.role}
                onValueChange={(v: "admin" | "member") =>
                  setForm((f) => ({ ...f, role: v }))
                }
                disabled={saving}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Miembro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">
                  Contraseña {editingUser ? "(dejar en blanco para no cambiar)" : "*"}
                </Label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    const p = generatePassword()
                    setForm((f) => ({ ...f, password: p, passwordConfirm: p }))
                    setShowPassword(true)
                    setCopiedPassword(false)
                  }}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Generar aleatoria
                </button>
              </div>

              {/* Input + show/hide + copy */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    disabled={saving}
                    placeholder="Mínimo 6 caracteres"
                    required={!editingUser}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Copiar — solo si hay contraseña */}
                {form.password && (
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(form.password)
                      setCopiedPassword(true)
                      setTimeout(() => setCopiedPassword(false), 2000)
                    }}
                    className="px-3 rounded-md border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                    title="Copiar contraseña"
                  >
                    {copiedPassword
                      ? <CheckCircle className="w-4 h-4 text-primary" />
                      : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Contraseña generada — destacar para que admin la vea */}
              {form.password && showPassword && (
                <p className="text-xs text-muted-foreground">
                  Copia y comparte esta contraseña con el usuario antes de cerrar.
                </p>
              )}
            </div>

            {form.password && (
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Confirmar contraseña *</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={form.passwordConfirm}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, passwordConfirm: e.target.value }))
                  }
                  disabled={saving}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                />
              </div>
            )}

            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md py-2 px-3">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : editingUser ? "Guardar cambios" : "Crear usuario"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
