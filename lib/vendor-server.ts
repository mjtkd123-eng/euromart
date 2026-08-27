import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { Currency } from "@/lib/storesData"

/* ------------------------------ 타입 ------------------------------ */

export interface VendorStore {
  id: string
  city: string
  country: string
  countryCode: string
  storeKo: string
  storeEn: string
  announcementKo: string
  announcementEn: string
  heroTitleKo: string
  heroTitleEn: string
  heroSubtitleKo: string
  heroSubtitleEn: string
  deliveryFee: number
  freeDeliveryOver: number
  active: boolean
  currency: Currency
}

export interface VendorListing {
  id: string
  productId: string
  nameKo: string
  nameEn: string
  category: string
  image: string
  unit: string
  brand: string
  price: number
  stock: number
  featured: boolean
  active: boolean
}

export interface CatalogOption {
  id: string
  nameKo: string
  nameEn: string
  category: string
}

export interface VendorPromotion {
  id: string
  code: string
  descriptionKo: string
  descriptionEn: string
  discountType: "percent" | "fixed"
  discountValue: number
  minOrder: number
  active: boolean
}

export interface VendorOrderItem {
  nameKo: string
  quantity: number
  price: number
}

export interface VendorOrder {
  id: string
  customerName: string
  address: string
  phone: string
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  promoCode: string | null
  status: string
  createdAt: string
  items: VendorOrderItem[]
}

export interface VendorStats {
  orderCount: number
  revenue: number
  lowStock: number
  activeListings: number
}

export interface VendorDashboardData {
  store: VendorStore
  listings: VendorListing[]
  catalog: CatalogOption[]
  promotions: VendorPromotion[]
  orders: VendorOrder[]
  stats: VendorStats
}

/* --------------------------- 데이터 조회 --------------------------- */

/**
 * 로그인한 판매자에게 배정된 매장(지역) 전체 데이터를 조회합니다.
 * RLS 정책이 vendor_id 기준으로 접근을 제한하므로, 다른 매장 데이터는 보이지 않습니다.
 */
export async function getVendorDashboard(vendorId: string): Promise<VendorDashboardData | null> {
  const supabase = await createClient()

  const { data: region } = await supabase
    .from("regions")
    .select(
      "id, city, country, country_code, store_ko, store_en, announcement_ko, announcement_en, hero_title_ko, hero_title_en, hero_subtitle_ko, hero_subtitle_en, delivery_fee, free_delivery_over, active, currency_code, locale, currencies(code, locale, decimals)",
    )
    .eq("vendor_id", vendorId)
    .maybeSingle()

  if (!region) return null

  const currencyRow = Array.isArray(region.currencies) ? region.currencies[0] : region.currencies
  const currency: Currency = {
    code: currencyRow?.code ?? region.currency_code,
    locale: region.locale ?? currencyRow?.locale ?? "en-US",
    decimals: currencyRow?.decimals ?? 2,
  }

  const [listingsRes, catalogRes, promosRes, ordersRes] = await Promise.all([
    supabase
      .from("region_products")
      .select("id, product_id, price, stock, featured, active, products(name_ko, name_en, category_id, image, unit, brand)")
      .eq("region_id", region.id),
    supabase.from("products").select("id, name_ko, name_en, category_id").order("name_ko"),
    supabase
      .from("promotions")
      .select("id, code, description_ko, description_en, discount_type, discount_value, min_order, active")
      .eq("region_id", region.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select(
        "id, customer_name, address, phone, subtotal, delivery_fee, discount, total, promo_code, status, created_at, order_items(name_ko, quantity, price)",
      )
      .eq("region_id", region.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  const listings: VendorListing[] = (listingsRes.data ?? []).map((row) => {
    const p = Array.isArray(row.products) ? row.products[0] : row.products
    return {
      id: row.id,
      productId: row.product_id,
      nameKo: p?.name_ko ?? row.product_id,
      nameEn: p?.name_en ?? "",
      category: p?.category_id ?? "",
      image: p?.image ?? "",
      unit: p?.unit ?? "",
      brand: p?.brand ?? "",
      price: Number(row.price),
      stock: row.stock,
      featured: row.featured,
      active: row.active,
    }
  })
  listings.sort((a, b) => a.nameKo.localeCompare(b.nameKo, "ko"))

  const listedIds = new Set(listings.map((l) => l.productId))
  const catalog: CatalogOption[] = (catalogRes.data ?? [])
    .filter((p) => !listedIds.has(p.id))
    .map((p) => ({ id: p.id, nameKo: p.name_ko, nameEn: p.name_en ?? "", category: p.category_id ?? "" }))

  const promotions: VendorPromotion[] = (promosRes.data ?? []).map((r) => ({
    id: r.id,
    code: r.code,
    descriptionKo: r.description_ko ?? "",
    descriptionEn: r.description_en ?? "",
    discountType: r.discount_type as "percent" | "fixed",
    discountValue: Number(r.discount_value),
    minOrder: Number(r.min_order),
    active: r.active,
  }))

  const orders: VendorOrder[] = (ordersRes.data ?? []).map((o) => ({
    id: o.id,
    customerName: o.customer_name,
    address: o.address,
    phone: o.phone,
    subtotal: Number(o.subtotal),
    deliveryFee: Number(o.delivery_fee),
    discount: Number(o.discount),
    total: Number(o.total),
    promoCode: o.promo_code,
    status: o.status,
    createdAt: o.created_at,
    items: (o.order_items ?? []).map((i: { name_ko: string; quantity: number; price: number }) => ({
      nameKo: i.name_ko,
      quantity: i.quantity,
      price: Number(i.price),
    })),
  }))

  return {
    store: {
      id: region.id,
      city: region.city,
      country: region.country,
      countryCode: region.country_code,
      storeKo: region.store_ko,
      storeEn: region.store_en,
      announcementKo: region.announcement_ko ?? "",
      announcementEn: region.announcement_en ?? "",
      heroTitleKo: region.hero_title_ko ?? "",
      heroTitleEn: region.hero_title_en ?? "",
      heroSubtitleKo: region.hero_subtitle_ko ?? "",
      heroSubtitleEn: region.hero_subtitle_en ?? "",
      deliveryFee: Number(region.delivery_fee),
      freeDeliveryOver: Number(region.free_delivery_over),
      active: region.active,
      currency,
    },
    listings,
    catalog,
    promotions,
    orders,
    stats: {
      orderCount: orders.length,
      revenue: orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0),
      lowStock: listings.filter((l) => l.stock <= 10).length,
      activeListings: listings.filter((l) => l.active).length,
    },
  }
}
