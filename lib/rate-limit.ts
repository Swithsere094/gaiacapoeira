import type { NextRequest } from "next/server"

/**
 * Rate limiting en memoria (Map del proceso), sin dependencias externas.
 * Suficiente para este hosting: la Node.js App de Hostinger corre una
 * sola instancia (no hay múltiples réplicas que necesiten compartir
 * estado vía Redis u otro store externo). Se resetea en cada redeploy o
 * reinicio de la instancia — es una limitación conocida, pero sigue
 * siendo una protección real contra fuerza bruta entre reinicios.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

// Barrido perezoso para no crecer sin límite con IPs que ya expiraron.
let lastSweep = Date.now()
function sweepExpired(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key)
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  sweepExpired(now)

  const bucket = buckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count++
  return { allowed: true, retryAfterSeconds: 0 }
}

// Hostinger sirve la app detrás de su propio proxy/CDN — la IP real del
// visitante viaja en x-forwarded-for, no en la conexión TCP directa.
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "unknown"
}
