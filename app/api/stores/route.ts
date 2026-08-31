import { createClient } from "@/lib/supabase/server"
import { jsonError, jsonOk } from "@/lib/api"

export const dynamic = "force-dynamic"

/**
 * GET /api/stores?cityId=...&citySlug=budapest
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cityId = searchParams.get("cityId")
  const citySlug = searchParams.get("citySlug")

  try {
    const supabase = await createClient()

    let resolvedCityId = cityId
    if (!resolvedCityId && citySlug) {
      const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .eq("active", true)
        .maybeSingle()
      resolvedCityId = city?.id ?? null
      if (!resolvedCityId) return jsonError("City not found", 404)
    }

    let query = supabase
      .from("stores")
      .select(
        "id, slug, name, name_en, description, currency_code, address, phone, lat, lng, hours, cover_image, logo, delivery_fee, min_order, city_id, cities(slug, name_en, name_ko)",
      )
      .eq("status", "active")
      .order("name")

    if (resolvedCityId) {
      query = query.eq("city_id", resolvedCityId)
    }

    const { data, error } = await query
    if (error) return jsonError(error.message, 500)
    return jsonOk({ stores: data ?? [] })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load stores"
    return jsonError(message, 503)
  }
}
