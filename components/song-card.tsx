"use client"

import { useState } from "react"
import { Play, ChevronDown, ChevronUp, BookOpen, History, X, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toEmbedUrl } from "@/lib/utils/video-url"

export interface SongCardProps {
  id: string
  title: string
  type: string
  lyrics: string
  translation: string
  history: string
  videoUrl: string
  mestre?: string
  ritmos?: string[]
  onEdit?: () => void
  onDelete?: () => void
}

const typeLabels: Record<string, string> = {
  ladainha: "Ladainha",
  corrido: "Corrido",
  quadra: "Quadra",
  chula: "Chula",
  samba: "Samba",
}

const typeColors: Record<string, string> = {
  ladainha: "bg-primary/20 text-primary",
  corrido: "bg-accent/20 text-accent",
  quadra: "bg-chart-4/20 text-chart-4",
  chula: "bg-chart-5/20 text-chart-5",
  samba: "bg-chart-3/20 text-chart-3",
}

export function SongCard({
  title,
  type,
  lyrics,
  translation,
  history,
  videoUrl,
  mestre,
  ritmos,
  onEdit,
  onDelete,
}: SongCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [activeTab, setActiveTab] = useState<"lyrics" | "translation" | "history">("lyrics")

  const embedUrl = videoUrl ? toEmbedUrl(videoUrl) : ""

  return (
    <>
      <article className="bg-card rounded-xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-4 min-w-0">
            {/* Play button — solo si hay video */}
            {embedUrl && (
              <div
                className="w-12 h-12 shrink-0 rounded-full bg-primary/20 flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowVideo(true)
                }}
              >
                <Play className="w-5 h-5 text-primary ml-0.5" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-serif text-xl font-bold text-card-foreground truncate">
                {title}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className={cn(
                    "inline-block px-2 py-0.5 rounded text-xs font-medium",
                    typeColors[type] ?? "bg-secondary text-secondary-foreground"
                  )}
                >
                  {typeLabels[type] ?? type}
                </span>
                {ritmos && ritmos.length > 0 && ritmos.map((r) => (
                  <span
                    key={r}
                    className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground"
                  >
                    {r}
                  </span>
                ))}
                {mestre && (
                  <span className="text-xs text-muted-foreground">{mestre}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            {/* Edit / Delete — sin propagar al toggle */}
            {onEdit && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onEdit() }}
                onKeyDown={(e) => e.key === "Enter" && (e.stopPropagation(), onEdit())}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Editar canción"
              >
                <Pencil className="w-4 h-4" />
              </span>
            )}
            {onDelete && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                onKeyDown={(e) => e.key === "Enter" && (e.stopPropagation(), onDelete())}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Eliminar canción"
              >
                <Trash2 className="w-4 h-4" />
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-border">
            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab("lyrics")}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                  activeTab === "lyrics"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BookOpen className="w-4 h-4" />
                Letra
              </button>
              {translation && (
                <button
                  onClick={() => setActiveTab("translation")}
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                    activeTab === "translation"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <BookOpen className="w-4 h-4" />
                  Traducción
                </button>
              )}
              {history && (
                <button
                  onClick={() => setActiveTab("history")}
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                    activeTab === "history"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <History className="w-4 h-4" />
                  Historia
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "lyrics" && (
                <div className="bg-secondary/30 rounded-lg p-4">
                  <pre className="font-sans text-foreground whitespace-pre-wrap leading-relaxed">
                    {lyrics}
                  </pre>
                </div>
              )}
              {activeTab === "translation" && translation && (
                <div className="bg-secondary/30 rounded-lg p-4">
                  <pre className="font-sans text-foreground whitespace-pre-wrap leading-relaxed">
                    {translation}
                  </pre>
                </div>
              )}
              {activeTab === "history" && history && (
                <div className="bg-secondary/30 rounded-lg p-4">
                  <p className="text-foreground leading-relaxed">{history}</p>
                </div>
              )}

              {embedUrl && (
                <button
                  onClick={() => setShowVideo(true)}
                  className="mt-4 w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Ver Video
                </button>
              )}
            </div>
          </div>
        )}
      </article>

      {/* Video Modal */}
      {showVideo && embedUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95"
          onClick={() => setShowVideo(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-card rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowVideo(false)}
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 text-foreground hover:text-primary transition-colors"
              aria-label="Cerrar video"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          </div>
        </div>
      )}
    </>
  )
}
