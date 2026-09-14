import { createClient } from "@/lib/supabase/server"
import { jsonError, jsonOk } from "@/lib/api"

export const dynamic = "force-dynamic"

/**
 * GET /api/cities — active cities for the city switcher.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("cities")
      .select(
        "id, slug, name_en, name_ko, country_code, lat, lng, timezone, countries(name_en, name_ko, default_currency)",
      )
      .eq("active", true)
      .order("name_en")

    if (error) return jsonError(error.message, 500)
    return jsonOk({ cities: data ?? [] })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load cities"
    return jsonError(message, 503)
  }
}
