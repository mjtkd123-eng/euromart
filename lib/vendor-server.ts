import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { Currency } from "./storesData"

export interface VendorRegion {
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
  currency: Currency
}

export interface VendorProductRow {
  /** region_products 행 id */
  id: string
  productId: string
  nameKo: string
  nameEn: string
  category: string
  image: string
  unit: string
  price: number
  stock: number
  featured: boolean
  active: boolean
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

export interface VendorDashboardData {
  region: VendorRegion
  products: VendorProductRow[]
  promotions: VendorPromotion[]
  orders: VendorOrder[]
  stats: {
    revenue: number
    orderCount: number
    lowStock: number
    outOfStock: number
  }
}

/**
 * 로그인한 업주가 소유한 매장(region)의 대시보드 데이터를 조회합니다.
 * RLS 가 vendor_id = auth.uid() 인 행만 허용하므로 추가 필터 없이도 안전하지만,
 * 명시적으로 vendor_id 를 걸어 의도를 분명히 합니다.
 */
export async function fetchVendorDashboard(vendorId: string): Promise<VendorDashboardData | null> {
  const supabase = await createClient()

  const { data: regionRow } = await supabase
    .from("regions")
    .select("*")
    .eq("vendor_id", vendorId)
    .maybeSingle()

  if (!regionRow) return null

  const [{ data: currencyRow }, { data: productRows }, { data: promoRows }, { data: orderRows }] =
    await Promise.all([
      supabase.from("currencies").select("code, locale, decimals").eq("code", regionRow.currency_code).maybeSingle(),
      supabase
        .from("region_products")
        .select(
          "id, product_id, price, stock, featured, active, product:products(name_ko, name_en, category_id, image, unit)",
        )
        .eq("region_id", regionRow.id),
      supabase.from("promotions").select("*").eq("region_id", regionRow.id).order("code"),
      supabase
        .from("orders")
        .select("*, order_items(name_ko, quantity, price)")
        .eq("region_id", regionRow.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ])

  const currency: Currency = {
    code: regionRow.currency_code,
    locale: regionRow.locale ?? currencyRow?.locale ?? "en-US",
    decimals: currencyRow?.decimals ?? 2,
  }

  const products: VendorProductRow[] = (productRows ?? [])
    .map((r: any) => ({
      id: r.id,
      productId: r.product_id,
      nameKo: r.product?.name_ko ?? r.product_id,
      nameEn: r.product?.name_en ?? "",
      category: r.product?.category_id ?? "",
      image: r.product?.image ?? "/placeholder.svg",
      unit: r.product?.unit ?? "",
      price: Number(r.price),
      stock: Number(r.stock),
      featured: Boolean(r.featured),
      active: Boolean(r.active),
    }))
    .sort((a, b) => a.nameKo.localeCompare(b.nameKo))

  const promotions: VendorPromotion[] = (promoRows ?? []).map((p: any) => ({
    id: p.id,
    code: p.code,
    descriptionKo: p.description_ko ?? "",
    descriptionEn: p.description_en ?? "",
    discountType: p.discount_type,
    discountValue: Number(p.discount_value),
    minOrder: Number(p.min_order),
    active: Boolean(p.active),
  }))

  const orders: VendorOrder[] = (orderRows ?? []).map((o: any) => ({
    id: o.id,
    customerName: o.customer_name ?? "",
    address: o.address ?? "",
    phone: o.phone ?? "",
    subtotal: Number(o.subtotal),
    deliveryFee: Number(o.delivery_fee),
    discount: Number(o.discount),
    total: Number(o.total),
    promoCode: o.promo_code,
    status: o.status,
    createdAt: o.created_at,
    items: (o.order_items ?? []).map((i: any) => ({
      nameKo: i.name_ko ?? "",
      quantity: Number(i.quantity),
      price: Number(i.price),
    })),
  }))

  return {
    region: {
      id: regionRow.id,
      city: regionRow.city,
      country: regionRow.country,
      countryCode: regionRow.country_code,
      storeKo: regionRow.store_ko ?? "",
      storeEn: regionRow.store_en ?? "",
      announcementKo: regionRow.announcement_ko ?? "",
      announcementEn: regionRow.announcement_en ?? "",
      heroTitleKo: regionRow.hero_title_ko ?? "",
      heroTitleEn: regionRow.hero_title_en ?? "",
      heroSubtitleKo: regionRow.hero_subtitle_ko ?? "",
      heroSubtitleEn: regionRow.hero_subtitle_en ?? "",
      deliveryFee: Number(regionRow.delivery_fee),
      freeDeliveryOver: Number(regionRow.free_delivery_over),
      currency,
    },
    products,
    promotions,
    orders,
    stats: {
      revenue: orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0),
      orderCount: orders.length,
      lowStock: products.filter((p) => p.stock > 0 && p.stock <= 10).length,
      outOfStock: products.filter((p) => p.stock <= 0).length,
    },
  }
}
