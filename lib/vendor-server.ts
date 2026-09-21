import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { Currency } from "@/lib/storesData"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { findStoreById, findUserById, listDirectoryPromotions, listListingOverrides, type DirectoryStore } from "@/lib/tenant-directory"
import { DEMO_REGIONS } from "@/lib/demo-regions"
import { assertStoreAccess } from "@/lib/tenant-guard"

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
  /** 오늘(매장 로컬 자정 기준) 접수된 주문 건수 */
  todayOrderCount: number
  /** 오늘 매출 (취소 제외) */
  todayRevenue: number
  /** 아직 처리 대기 중인 주문(접수/포장/호출대기) 건수 */
  openOrderCount: number
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
  if (!isSupabaseConfigured()) {
    const user = await findUserById(vendorId)
    if (user?.role === "vendor" && !user.storeId) return null
    if (user?.role === "vendor" && user.storeId) {
      const storeRow = await findStoreById(user.storeId)
      if (!storeRow) return null
      assertStoreAccess({ role: "vendor", storeId: user.storeId }, storeRow.id)
      return await dashboardFromDirectoryStore(storeRow)
    }
    return null
  }

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
    stats: buildStats(orders, listings),
  }
}

/** 처리 대기로 간주하는 주문 상태 (판매자 액션이 필요한 상태) */
const OPEN_ORDER_STATUSES = new Set(["pending", "packed", "awaiting_courier", "confirmed"])

async function dashboardFromDirectoryStore(storeRow: DirectoryStore): Promise<VendorDashboardData> {
  const region = DEMO_REGIONS.find((r) => r.id === storeRow.citySlug) ?? null
  const currency: Currency = region?.currency ?? {
    code: storeRow.currencyCode || "EUR",
    locale: "de-AT",
    decimals: 2,
  }
  const store: VendorStore = {
    id: storeRow.id,
    city: region?.city ?? storeRow.citySlug,
    country: region?.country ?? "EU",
    countryCode: region?.countryCode ?? "EU",
    storeKo: storeRow.name,
    storeEn: storeRow.storeEn ?? region?.store.en ?? storeRow.name,
    announcementKo: storeRow.announcementKo ?? region?.announcement.ko ?? "",
    announcementEn: storeRow.announcementEn ?? region?.announcement.en ?? "",
    heroTitleKo: region?.hero.title.ko ?? storeRow.name,
    heroTitleEn: region?.hero.title.en ?? storeRow.name,
    heroSubtitleKo: region?.hero.subtitle.ko ?? storeRow.legalName,
    heroSubtitleEn: region?.hero.subtitle.en ?? storeRow.legalName,
    deliveryFee: storeRow.deliveryFee ?? region?.deliveryFee ?? 0,
    freeDeliveryOver: storeRow.freeDeliveryOver ?? region?.freeDeliveryOver ?? 0,
    active: storeRow.status === "active",
    currency,
  }

  const overrides = await listListingOverrides(storeRow.id)
  const overrideMap = new Map(overrides.map((o) => [o.productId, o]))
  const stocks = [4, 9, 22, 41, 7, 16, 3, 28]
  const listings: VendorListing[] = (region?.products ?? [])
    .map((p, i) => {
      const over = overrideMap.get(p.id)
      if (over?.active === false) return null
      return {
        id: `${storeRow.id}:${p.id}`,
        productId: p.id,
        nameKo: p.nameKo,
        nameEn: p.nameEn,
        category: p.category,
        image: p.image,
        unit: p.unit,
        brand: p.brand,
        price: over?.price ?? p.price,
        stock: over?.stock ?? (p.outOfStock ? 0 : stocks[i % stocks.length]),
        featured: over?.featured ?? p.featured,
        active: over?.active ?? true,
      }
    })
    .filter((row): row is VendorListing => row !== null)

  const listedIds = new Set(listings.map((l) => l.productId))
  const catalog: CatalogOption[] = DEMO_REGIONS.flatMap((r) => r.products)
    .filter((p, idx, all) => all.findIndex((x) => x.id === p.id) === idx && !listedIds.has(p.id))
    .map((p) => ({ id: p.id, nameKo: p.nameKo, nameEn: p.nameEn, category: p.category }))

  const promotions: VendorPromotion[] = (await listDirectoryPromotions(storeRow.id)).map((p) => ({
    id: p.id,
    code: p.code,
    descriptionKo: p.descriptionKo,
    descriptionEn: p.descriptionEn,
    discountType: p.discountType,
    discountValue: p.discountValue,
    minOrder: p.minOrder,
    active: p.active,
  }))

  const orders = demoOrdersForStore(storeRow, listings, store)
  return {
    store,
    listings,
    catalog,
    promotions,
    orders,
    stats: buildStats(orders, listings),
  }
}

function demoOrdersForStore(
  storeRow: DirectoryStore,
  listings: VendorListing[],
  store: VendorStore,
): VendorOrder[] {
  if (listings.length === 0) return []
  const a = listings[0]
  const b = listings[1] ?? listings[0]
  const c = listings[2] ?? listings[0]
  const now = Date.now()
  const hour = 60 * 60 * 1000
  return [
    {
      id: `KEM-${storeRow.citySlug.toUpperCase()}-1042`,
      customerName: "김민호",
      address: storeRow.address,
      phone: "+43 660 555 1042",
      subtotal: a.price * 2 + b.price,
      deliveryFee: store.deliveryFee,
      discount: 0,
      total: a.price * 2 + b.price + store.deliveryFee,
      promoCode: null,
      status: "pending",
      createdAt: new Date(now - 0.4 * hour).toISOString(),
      items: [
        { nameKo: a.nameKo, quantity: 2, price: a.price },
        { nameKo: b.nameKo, quantity: 1, price: b.price },
      ],
    },
    {
      id: `KEM-${storeRow.citySlug.toUpperCase()}-1038`,
      customerName: "Laura H.",
      address: storeRow.address,
      phone: "+43 699 441 1038",
      subtotal: c.price * 3,
      deliveryFee: 0,
      discount: 0,
      total: c.price * 3,
      promoCode: "KIMCHI10",
      status: "awaiting_courier",
      createdAt: new Date(now - 1.2 * hour).toISOString(),
      items: [{ nameKo: c.nameKo, quantity: 3, price: c.price }],
    },
    {
      id: `KEM-${storeRow.citySlug.toUpperCase()}-1021`,
      customerName: "한지우",
      address: storeRow.address,
      phone: "+43 676 220 1021",
      subtotal: a.price + c.price,
      deliveryFee: store.deliveryFee,
      discount: 0,
      total: a.price + c.price + store.deliveryFee,
      promoCode: null,
      status: "delivered",
      createdAt: new Date(now - 26 * hour).toISOString(),
      items: [
        { nameKo: a.nameKo, quantity: 1, price: a.price },
        { nameKo: c.nameKo, quantity: 1, price: c.price },
      ],
    },
  ]
}

function buildStats(orders: VendorOrder[], listings: VendorListing[]): VendorStats {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const todayMs = startOfToday.getTime()

  const notCancelled = orders.filter((o) => o.status !== "cancelled")
  const todayOrders = notCancelled.filter((o) => new Date(o.createdAt).getTime() >= todayMs)

  return {
    orderCount: orders.length,
    revenue: notCancelled.reduce((s, o) => s + o.total, 0),
    lowStock: listings.filter((l) => l.stock <= 10).length,
    activeListings: listings.filter((l) => l.active).length,
    todayOrderCount: todayOrders.length,
    todayRevenue: todayOrders.reduce((s, o) => s + o.total, 0),
    openOrderCount: orders.filter((o) => OPEN_ORDER_STATUSES.has(o.status)).length,
  }
}
