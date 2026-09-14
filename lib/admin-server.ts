import "server-only"
import { createClient } from "@/lib/supabase/server"

/* ------------------------------ 타입 ------------------------------ */

export interface AdminRegion {
  id: string
  city: string
  country: string
  countryCode: string
  storeKo: string
  currencyCode: string
  deliveryFee: number
  freeDeliveryOver: number
  active: boolean
  sort: number
  vendorId: string | null
  vendorEmail: string | null
  listingCount: number
  orderCount: number
}

export interface AdminUser {
  id: string
  email: string
  fullName: string
  role: "customer" | "vendor" | "admin"
  assignedRegion: string | null
}

export interface AdminProduct {
  id: string
  nameKo: string
  nameEn: string
  categoryId: string
  image: string
  unit: string
  brand: string
  regionCount: number
}

export interface AdminCategory {
  id: string
  nameKo: string
  nameEn: string
}

export interface AdminFxRate {
  base: string
  quote: string
  rate: number
  updatedAt: string | null
}

export interface AdminOrder {
  id: string
  regionId: string
  city: string
  customerName: string
  currencyCode: string
  total: number
  status: string
  promoCode: string | null
  createdAt: string
}

export interface AdminStats {
  regionCount: number
  activeRegions: number
  vendorCount: number
  unassignedRegions: number
  productCount: number
  orderCount: number
}

export interface AdminDashboardData {
  regions: AdminRegion[]
  users: AdminUser[]
  products: AdminProduct[]
  categories: AdminCategory[]
  fxRates: AdminFxRate[]
  orders: AdminOrder[]
  stats: AdminStats
}

/* --------------------------- 데이터 조회 --------------------------- */

/**
 * 관리자 대시보드 전체 데이터를 조회합니다.
 * 호출 전에 반드시 호출자가 admin 역할인지 확인해야 합니다.
 */
export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const supabase = await createClient()

  const [regionsRes, usersRes, productsRes, categoriesRes, fxRes, ordersRes, listingCountRes] =
    await Promise.all([
      supabase
        .from("regions")
        .select(
          "id, city, country, country_code, store_ko, currency_code, delivery_fee, free_delivery_over, active, sort, vendor_id",
        )
        .order("sort"),
      supabase.from("profiles").select("id, email, role, full_name").order("email"),
      supabase.from("products").select("id, name_ko, name_en, category_id, image, unit, brand").order("name_ko"),
      supabase.from("categories").select("id, name_ko, name_en").order("sort"),
      supabase.from("fx_rates").select("base, quote, rate, updated_at").order("quote"),
      supabase
        .from("orders")
        .select("id, region_id, customer_name, currency_code, total, status, promo_code, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("region_products").select("region_id, product_id"),
    ])

  const regionRows = regionsRes.data ?? []
  const userRows = usersRes.data ?? []
  const orderRows = ordersRes.data ?? []
  const listingRows = listingCountRes.data ?? []

  const emailById = new Map(userRows.map((u) => [u.id, u.email]))
  const cityById = new Map(regionRows.map((r) => [r.id, r.city]))

  // 지역별 판매 상품 수 / 주문 수 집계
  const listingsByRegion = new Map<string, number>()
  const productRegionCount = new Map<string, number>()
  for (const row of listingRows) {
    listingsByRegion.set(row.region_id, (listingsByRegion.get(row.region_id) ?? 0) + 1)
    productRegionCount.set(row.product_id, (productRegionCount.get(row.product_id) ?? 0) + 1)
  }

  const ordersByRegion = new Map<string, number>()
  for (const o of orderRows) {
    ordersByRegion.set(o.region_id, (ordersByRegion.get(o.region_id) ?? 0) + 1)
  }

  // 판매자 → 배정된 지역
  const regionByVendor = new Map<string, string>()
  for (const r of regionRows) {
    if (r.vendor_id) regionByVendor.set(r.vendor_id, r.city)
  }

  const regions: AdminRegion[] = regionRows.map((r) => ({
    id: r.id,
    city: r.city,
    country: r.country,
    countryCode: r.country_code,
    storeKo: r.store_ko,
    currencyCode: r.currency_code,
    deliveryFee: Number(r.delivery_fee),
    freeDeliveryOver: Number(r.free_delivery_over),
    active: r.active,
    sort: r.sort ?? 0,
    vendorId: r.vendor_id,
    vendorEmail: r.vendor_id ? (emailById.get(r.vendor_id) ?? null) : null,
    listingCount: listingsByRegion.get(r.id) ?? 0,
    orderCount: ordersByRegion.get(r.id) ?? 0,
  }))

  const users: AdminUser[] = userRows.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.full_name ?? "",
    role: (u.role ?? "customer") as AdminUser["role"],
    assignedRegion: regionByVendor.get(u.id) ?? null,
  }))

  const products: AdminProduct[] = (productsRes.data ?? []).map((p) => ({
    id: p.id,
    nameKo: p.name_ko,
    nameEn: p.name_en ?? "",
    categoryId: p.category_id ?? "",
    image: p.image ?? "",
    unit: p.unit ?? "",
    brand: p.brand ?? "",
    regionCount: productRegionCount.get(p.id) ?? 0,
  }))

  const categories: AdminCategory[] = (categoriesRes.data ?? []).map((c) => ({
    id: c.id,
    nameKo: c.name_ko,
    nameEn: c.name_en ?? "",
  }))

  const fxRates: AdminFxRate[] = (fxRes.data ?? []).map((f) => ({
    base: f.base,
    quote: f.quote,
    rate: Number(f.rate),
    updatedAt: f.updated_at,
  }))

  const orders: AdminOrder[] = orderRows.map((o) => ({
    id: o.id,
    regionId: o.region_id,
    city: cityById.get(o.region_id) ?? o.region_id,
    customerName: o.customer_name,
    currencyCode: o.currency_code,
    total: Number(o.total),
    status: o.status,
    promoCode: o.promo_code,
    createdAt: o.created_at,
  }))

  return {
    regions,
    users,
    products,
    categories,
    fxRates,
    orders,
    stats: {
      regionCount: regions.length,
      activeRegions: regions.filter((r) => r.active).length,
      vendorCount: users.filter((u) => u.role === "vendor").length,
      unassignedRegions: regions.filter((r) => !r.vendorId).length,
      productCount: products.length,
      orderCount: orders.length,
    },
  }
}
