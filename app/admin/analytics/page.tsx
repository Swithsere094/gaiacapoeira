"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useAuth } from "@/hooks/use-auth"
import { BarChart3, Eye, Loader2, Users } from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface Summary {
  totalViews: number
  uniqueUsers: number
  topPages: { path: string; count: number }[]
  viewsByDay: { day: string; count: number }[]
}

const chartConfig = {
  count: { label: "Visitas", color: "var(--primary)" },
} satisfies ChartConfig

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user || user.role !== "admin") return
    fetch("/api/analytics/summary")
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(setSummary)
      .catch(() => setError("No se pudieron cargar las analíticas."))
      .finally(() => setLoading(false))
  }, [user])

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
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              Analíticas
            </h1>
            <p className="text-muted-foreground mt-1">
              Visitas propias del sitio — sin servicios externos.
            </p>
          </div>

          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && error && (
            <p className="text-destructive text-center py-8">{error}</p>
          )}

          {!loading && !error && summary && (
            <div className="space-y-6">
              {/* Totales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-card rounded-xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Eye className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{summary.totalViews}</p>
                    <p className="text-sm text-muted-foreground">Visitas totales</p>
                  </div>
                </div>
                <div className="bg-card rounded-xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{summary.uniqueUsers}</p>
                    <p className="text-sm text-muted-foreground">Usuarios distintos</p>
                  </div>
                </div>
              </div>

              {/* Visitas por día */}
              <div className="bg-card rounded-xl p-6">
                <h2 className="font-serif text-lg font-bold text-foreground mb-4">
                  Últimos 30 días
                </h2>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <BarChart data={summary.viewsByDay}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value: string) =>
                        new Date(value).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })
                      }
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </div>

              {/* Páginas más visitadas */}
              <div className="bg-card rounded-xl p-6">
                <h2 className="font-serif text-lg font-bold text-foreground mb-4">
                  Páginas más visitadas
                </h2>
                {summary.topPages.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Todavía no hay visitas registradas.</p>
                ) : (
                  <div className="space-y-2">
                    {summary.topPages.map((p) => (
                      <div
                        key={p.path}
                        className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0"
                      >
                        <span className="text-sm text-foreground font-mono truncate">{p.path}</span>
                        <span className="text-sm text-muted-foreground shrink-0">{p.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
