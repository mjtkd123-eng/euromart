import { createClient } from "@/lib/supabase/server"
import { jsonError, jsonOk } from "@/lib/api"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

/**
 * GET /api/stores/:id — store detail + products (effective sale_price shown as-is).
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  if (!id) return jsonError("Missing store id")

  try {
    const supabase = await createClient()

    const { data: store, error: storeErr } = await supabase
      .from("stores")
      .select(
        "id, slug, name, name_en, description, currency_code, address, phone, lat, lng, hours, cover_image, logo, delivery_fee, min_order, status, cities(slug, name_en, name_ko, country_code)",
      )
      .eq("id", id)
      .maybeSingle()

    if (storeErr) return jsonError(storeErr.message, 500)
    if (!store || store.status !== "active") {
      return jsonError("Store not found", 404)
    }

    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select(
        "id, name, name_en, description, category_id, unit, brand, price, sale_price, stock, image_url, featured",
      )
      .eq("store_id", id)
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("name")

    if (prodErr) return jsonError(prodErr.message, 500)

    const { data: promotions } = await supabase
      .from("promotions")
      .select(
        "id, title, banner_url, discount_type, discount_value, starts_at, ends_at, placement, product_id",
      )
      .eq("store_id", id)
      .eq("active", true)
      .lte("starts_at", new Date().toISOString())
      .gte("ends_at", new Date().toISOString())

    return jsonOk({
      store,
      products: products ?? [],
      promotions: promotions ?? [],
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load store"
    return jsonError(message, 503)
  }
}
