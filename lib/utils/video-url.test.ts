import { describe, expect, it } from "vitest"
import { getYouTubeId, getYouTubeThumbnail, toEmbedUrl } from "./video-url"

describe("toEmbedUrl", () => {
  it("convierte youtu.be", () => {
    expect(toEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    )
  })

  it("convierte youtube.com/shorts", () => {
    expect(toEmbedUrl("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    )
  })

  it("convierte youtube.com/watch?v=", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    )
  })

  it("convierte watch?v= con parámetros extra antes del v=", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?list=PL123&v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    )
  })

  it("deja pasar una url que ya es embed de YouTube", () => {
    const url = "https://www.youtube.com/embed/dQw4w9WgXcQ"
    expect(toEmbedUrl(url)).toBe(url)
  })

  it("convierte vimeo.com/ID", () => {
    expect(toEmbedUrl("https://vimeo.com/123456789")).toBe(
      "https://player.vimeo.com/video/123456789"
    )
  })

  it("deja pasar una url que ya es embed de Vimeo", () => {
    const url = "https://player.vimeo.com/video/123456789"
    expect(toEmbedUrl(url)).toBe(url)
  })

  it("devuelve la url original si el formato no se reconoce", () => {
    const url = "https://example.com/video.mp4"
    expect(toEmbedUrl(url)).toBe(url)
  })

  it("devuelve el string vacío tal cual", () => {
    expect(toEmbedUrl("")).toBe("")
  })
})

describe("getYouTubeId", () => {
  it("extrae el id de youtu.be, watch?v= y embed/", () => {
    expect(getYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
    expect(getYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
    expect(getYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })

  it("devuelve null para una url que no es de YouTube", () => {
    expect(getYouTubeId("https://vimeo.com/123456789")).toBeNull()
  })
})

describe("getYouTubeThumbnail", () => {
  it("arma la url de la miniatura para un id válido", () => {
    expect(getYouTubeThumbnail("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    )
  })

  it("devuelve null si no es una url de YouTube", () => {
    expect(getYouTubeThumbnail("https://vimeo.com/123456789")).toBeNull()
  })
})
