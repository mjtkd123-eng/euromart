import { createClient } from "@/lib/supabase/server"
import { jsonError, jsonOk } from "@/lib/api"

export const dynamic = "force-dynamic"

type VercelGeo = {
  city?: string
  country?: string
  latitude?: string
  longitude?: string
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

/**
 * GET /api/geo/detect
 * Uses Vercel geo headers when present; otherwise nearest city to optional ?lat=&lng=,
 * fallback Budapest.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const latQ = searchParams.get("lat")
  const lngQ = searchParams.get("lng")

  const geo: VercelGeo = {
    city: request.headers.get("x-vercel-ip-city") ?? undefined,
    country: request.headers.get("x-vercel-ip-country") ?? undefined,
    latitude: request.headers.get("x-vercel-ip-latitude") ?? undefined,
    longitude: request.headers.get("x-vercel-ip-longitude") ?? undefined,
  }

  const lat = latQ ? Number(latQ) : geo.latitude ? Number(geo.latitude) : null
  const lng = lngQ ? Number(lngQ) : geo.longitude ? Number(geo.longitude) : null

  try {
    const supabase = await createClient()
    const { data: cities, error } = await supabase
      .from("cities")
      .select("id, slug, name_en, name_ko, country_code, lat, lng, timezone")
      .eq("active", true)

    if (error) return jsonError(error.message, 500)
    const list = cities ?? []

    let matched = list.find(
      (c) =>
        geo.city &&
        c.name_en.toLowerCase() === decodeURIComponent(geo.city).toLowerCase(),
    )

    if (!matched && lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
      matched = list
        .filter((c) => c.lat != null && c.lng != null)
        .map((c) => ({
          city: c,
          dist: haversineKm({ lat, lng }, { lat: Number(c.lat), lng: Number(c.lng) }),
        }))
        .sort((a, b) => a.dist - b.dist)[0]?.city
    }

    if (!matched) {
      matched = list.find((c) => c.slug === "budapest") ?? list[0] ?? null
    }

    return jsonOk({
      source: latQ || lngQ ? "gps" : geo.city || geo.country ? "ip" : "fallback",
      geo: {
        city: geo.city ? decodeURIComponent(geo.city) : null,
        country: geo.country ?? null,
        lat,
        lng,
      },
      city: matched,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Geo detect failed"
    return jsonError(message, 503)
  }
}
