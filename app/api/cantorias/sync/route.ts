import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db/client"
import { cantorias } from "@/lib/db/schema"
import { getYouTubeId } from "@/lib/utils/video-url"

interface YTThumbnail { url: string; width: number; height: number }
interface YTSnippet {
  title: string
  description: string
  publishedAt: string
  thumbnails: { default?: YTThumbnail; medium?: YTThumbnail; high?: YTThumbnail }
  resourceId: { kind: string; videoId: string }
}
interface YTPlaylistItem { snippet: YTSnippet }
interface YTPlaylistResponse {
  nextPageToken?: string
  items: YTPlaylistItem[]
  error?: { message: string }
}

async function fetchPlaylistItems(
  playlistId: string,
  apiKey: string
): Promise<YTPlaylistItem[]> {
  const items: YTPlaylistItem[] = []
  let pageToken: string | undefined = undefined

  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems")
    url.searchParams.set("part", "snippet")
    url.searchParams.set("playlistId", playlistId)
    url.searchParams.set("maxResults", "50")
    url.searchParams.set("key", apiKey)
    if (pageToken) url.searchParams.set("pageToken", pageToken)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`YouTube API error: ${res.status} ${res.statusText}`)

    const json: YTPlaylistResponse = await res.json()
    if (json.error) throw new Error(`YouTube API: ${json.error.message}`)

    items.push(...(json.items ?? []))
    pageToken = json.nextPageToken
  } while (pageToken)

  return items
}

// POST /api/cantorias/sync — solo admin
export async function POST() {
  const session = await getSession()
  if (!session.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const apiKey     = process.env.YOUTUBE_API_KEY
  const playlistId = process.env.YOUTUBE_CANTORIAS_PLAYLIST_ID

  if (!apiKey || !playlistId) {
    return NextResponse.json(
      { error: "Faltan variables de entorno: YOUTUBE_API_KEY y/o YOUTUBE_CANTORIAS_PLAYLIST_ID" },
      { status: 500 }
    )
  }

  try {
    const existingRows = await db.select({ video_url: cantorias.video_url }).from(cantorias)

    const knownIds = new Set<string>()
    for (const row of existingRows) {
      if (row.video_url) {
        const id = getYouTubeId(row.video_url)
        if (id) knownIds.add(id)
      }
    }

    const items = await fetchPlaylistItems(playlistId, apiKey)

    const newRows = items
      .filter((item) => {
        const videoId = item.snippet.resourceId.videoId
        if (!videoId) return false
        if (knownIds.has(videoId)) return false
        if (!item.snippet.thumbnails || Object.keys(item.snippet.thumbnails).length === 0) return false
        return true
      })
      .map((item) => {
        const { snippet } = item
        const videoId = snippet.resourceId.videoId
        return {
          id:          randomUUID(),
          title:       snippet.title,
          description: snippet.description?.slice(0, 500) || null,
          video_url:   `https://www.youtube.com/watch?v=${videoId}`,
          event_date:  snippet.publishedAt.slice(0, 10),
        }
      })

    if (newRows.length > 0) {
      await db.insert(cantorias).values(newRows)
    }

    return NextResponse.json({
      inserted: newRows.length,
      skipped:  items.length - newRows.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al sincronizar"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
