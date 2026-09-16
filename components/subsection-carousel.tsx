"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

// Carrusel horizontal con scroll-snap nativo (sin animation-timeline: el
// soporte de scroll-driven animations en Firefox sigue detrás de flag a
// mediados de 2026, así que no es confiable como mecanismo de navegación).
// print:contents "desenvuelve" el contenedor para que las tarjetas impriman
// en flujo normal vertical en vez de quedar recortadas por el overflow-x.
export function SubsectionCarousel({ children }: { children: React.ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollByCard = (direction: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>("[data-subsection-card]")
    const amount = (card?.offsetWidth ?? 320) + 16
    el.scrollBy({ left: direction * amount, behavior: "smooth" })
  }

  return (
    <div className="relative my-6 print:contents">
      <div
        ref={scrollerRef}
        role="region"
        aria-label="Subsecciones, desplazamiento horizontal"
        tabIndex={0}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 print:contents focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
      >
        {children}
      </div>
      <div className="hidden sm:flex justify-end gap-2 mt-2 print:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => scrollByCard(-1)}
          aria-label="Subsección anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => scrollByCard(1)}
          aria-label="Subsección siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
