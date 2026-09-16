"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// Analíticas propias (reemplaza a @vercel/analytics, eliminado en la
// migración de Supabase/Vercel — ver CLAUDE.md). Un beacon liviano en vez
// de un servicio externo: no hay Docker/VPS disponible en este hosting
// compartido para self-hostear algo como Umami o Plausible.
export function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {
      // Best-effort: si falla, no interrumpe la navegación del usuario.
    })
  }, [pathname])

  return null
}
