"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { SectionLayout } from "@/components/section-layout"
import {
  ScrollText,
  Plus,
  Loader2,
  Download,
  FileText,
  Pencil,
  Trash2,
  Upload,
  X,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface PoliticaDoc {
  id: string
  title: string
  content: string | null
  category: string | null
  file_url: string | null
  file_name: string | null
  created_at: string
}

const CATEGORIES = [
  "Manual de Convivencia",
  "Cordas y Graduación",
  "Reglamento",
  "Comunicados",
  "Otro",
]

const categoryColors: Record<string, string> = {
  "Manual de Convivencia": "bg-primary/20 text-primary",
  "Cordas y Graduación":   "bg-chart-5/20 text-chart-5",
  "Reglamento":            "bg-chart-4/20 text-chart-4",
  "Comunicados":           "bg-accent/20 text-accent",
  "Otro":                  "bg-secondary text-secondary-foreground",
}

const EMPTY_FORM = {
  title: "",
  content: "",
  category: "Manual de Convivencia",
}

export default function PoliticaPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const [docs, setDocs] = useState<PoliticaDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<PoliticaDoc | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null)
  const [uploading, setUploading] = useState(false)

  // ── Fetch ─────────────────────────────────────────────────────────
  const fetchDocs = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/politica")
      if (!res.ok) throw new Error("Error al cargar documentos")
      const data = await res.json()
      setDocs(data)
    } catch {
      setError("No se pudieron cargar los documentos. Revisa la conexión a Supabase.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  // ── Dialog helpers ─────────────────────────────────────────────────
  const openAdd = () => {
    setEditingDoc(null)
    setForm(EMPTY_FORM)
    setPendingFile(null)
    setUploadedFile(null)
    setFormError("")
    setDialogOpen(true)
  }

  const openEdit = (doc: PoliticaDoc) => {
    setEditingDoc(doc)
    setForm({
      title: doc.title,
      content: doc.content ?? "",
      category: doc.category ?? "Manual de Convivencia",
    })
    setPendingFile(null)
    setUploadedFile(
      doc.file_url ? { url: doc.file_url, name: doc.file_name ?? "Archivo adjunto" } : null
    )
    setFormError("")
    setDialogOpen(true)
  }

  // ── File handling ──────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      setFormError("El archivo no puede superar 20 MB")
      return
    }
    setFormError("")
    setPendingFile(file)
  }

  const uploadFile = async (): Promise<{ url: string; name: string } | null> => {
    if (!pendingFile) return uploadedFile
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", pendingFile)
      const res = await fetch("/api/politica/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al subir el archivo")
      return { url: data.url, name: data.name }
    } catch (err: unknown) {
      throw err instanceof Error ? err : new Error("Error al subir el archivo")
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setPendingFile(null)
    setUploadedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ── Save (create / update) ─────────────────────────────────────────
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError("")
    setSaving(true)

    try {
      // Subir archivo si hay uno nuevo pendiente
      const fileData = await uploadFile()

      const url  = editingDoc ? `/api/politica/${editingDoc.id}` : "/api/politica"
      const method = editingDoc ? "PUT" : "POST"

      const payload = {
        ...form,
        file_url:  fileData?.url  ?? null,
        file_name: fileData?.name ?? null,
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al guardar")

      await fetchDocs()
      setDialogOpen(false)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este documento?")) return
    try {
      const res = await fetch(`/api/politica/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      setDocs((prev) => prev.filter((d) => d.id !== id))
    } catch {
      alert("No se pudo eliminar el documento.")
    }
  }

  // ── Filter ────────────────────────────────────────────────────────
  const filteredDocs =
    selectedCategory === "all"
      ? docs
      : docs.filter((d) => d.category === selectedCategory)

  const allCategories = ["all", ...CATEGORIES]

  // ── Render ────────────────────────────────────────────────────────
  return (
    <SectionLayout
      title="Política del Grupo"
      description="Manual de convivencia, cordas de graduación y documentos oficiales"
    >
      {/* Filter + Add button */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <Filter className="w-5 h-5 text-muted-foreground shrink-0" />
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {cat === "all" ? "Todos" : cat}
            </button>
          ))}
        </div>
        {isAdmin && (
          <Button onClick={openAdd} className="shrink-0 gap-2">
            <Plus className="w-4 h-4" />
            Nuevo documento
          </Button>
        )}
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchDocs}>
            Reintentar
          </Button>
        </div>
      )}

      {!loading && !error && filteredDocs.length === 0 && (
        <div className="text-center py-12">
          <ScrollText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            {docs.length === 0
              ? "Aún no hay documentos. ¡Agrega el primero!"
              : "No hay documentos en esta categoría."}
          </p>
        </div>
      )}

      {/* Documents List */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredDocs.map((doc) => (
            <article key={doc.id} className="bg-card rounded-xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Icon */}
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-chart-4/20 flex items-center justify-center mt-0.5">
                    <FileText className="w-5 h-5 text-chart-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Category badge */}
                    {doc.category && (
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded text-xs font-medium mb-2",
                          categoryColors[doc.category] ?? "bg-secondary text-secondary-foreground"
                        )}
                      >
                        {doc.category}
                      </span>
                    )}

                    <h3 className="font-serif text-lg font-bold text-card-foreground">
                      {doc.title}
                    </h3>

                    {doc.content && (
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {doc.content}
                      </p>
                    )}

                    {/* Download button */}
                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={doc.file_name ?? true}
                        className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        {doc.file_name ?? "Descargar archivo"}
                      </a>
                    )}

                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Actions — solo admin */}
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => openEdit(doc)}
                      onKeyDown={(e) => e.key === "Enter" && openEdit(doc)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                      aria-label="Editar documento"
                    >
                      <Pencil className="w-4 h-4" />
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => handleDelete(doc.id)}
                      onKeyDown={(e) => e.key === "Enter" && handleDelete(doc.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      aria-label="Eliminar documento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </span>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingDoc ? "Editar documento" : "Nuevo documento"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-5 mt-2">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
                disabled={saving}
                placeholder="Ej: Manual de Convivencia 2024"
              />
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                disabled={saving}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="content">Descripción (opcional)</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                disabled={saving}
                rows={4}
                placeholder="Breve descripción del documento..."
              />
            </div>

            {/* Archivo adjunto */}
            <div className="space-y-2">
              <Label>Archivo adjunto (opcional)</Label>

              {/* Mostrar archivo actual o nuevo */}
              {(uploadedFile || pendingFile) ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-foreground flex-1 truncate">
                    {pendingFile ? pendingFile.name : uploadedFile?.name}
                    {pendingFile && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({(pendingFile.size / 1024).toFixed(0)} KB)
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={removeFile}
                    disabled={saving}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Quitar archivo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center">
                    Haz clic para seleccionar un archivo<br />
                    <span className="text-xs">PDF, DOC, DOCX, JPG, PNG — máx 20 MB</span>
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                disabled={saving}
              />

              {!pendingFile && !uploadedFile && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="text-xs text-primary hover:underline"
                >
                  Seleccionar archivo
                </button>
              )}
            </div>

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
              <Button type="submit" disabled={saving || uploading}>
                {saving || uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {uploading ? "Subiendo archivo..." : "Guardando..."}
                  </>
                ) : editingDoc ? "Guardar cambios" : "Agregar documento"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </SectionLayout>
  )
}
