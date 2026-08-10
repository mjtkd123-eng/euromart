import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { Region, ResolvedProduct } from "./storesData"

interface CurrencyRow {
  code: string
  locale: string
  decimals: number
}

interface RegionRow {
  id: string
  city: string
  country: string
  country_code: string
  store_ko: string
  store_en: string
  announcement_ko: string | null
  announcement_en: string | null
  hero_title_ko: string | null
  hero_title_en: string | null
  hero_subtitle_ko: string | null
  hero_subtitle_en: string | null
  hero_image: string | null
  currency_code: string
  locale: string | null
  delivery_fee: number
  free_delivery_over: number
  sort: number
}

interface RegionProductRow {
  region_id: string
  price: number
  stock: number
  featured: boolean
  product: {
    id: string
    name_ko: string
    name_en: string
    category_id: string | null
    image: string | null
    unit: string | null
    brand: string | null
  } | null
}

/**
 * 활성 지역 전체와 각 지역의 상품을 DB에서 조회해 클라이언트가 사용하는
 * `Region[]` 형태로 조립합니다. (지역 수가 적어 한 번에 모두 로드)
 */
export async function fetchRegions(): Promise<Region[]> {
  const supabase = await createClient()

  const [{ data: regionRows }, { data: productRows }, { data: currencyRows }] = await Promise.all([
    supabase.from("regions").select("*").eq("active", true).order("sort"),
    supabase
      .from("region_products")
      .select("region_id, price, stock, featured, product:products(id, name_ko, name_en, category_id, image, unit, brand)")
      .eq("active", true),
    supabase.from("currencies").select("code, locale, decimals"),
  ])

  const currencies = (currencyRows ?? []) as CurrencyRow[]
  const regions = (regionRows ?? []) as RegionRow[]
  const products = (productRows ?? []) as unknown as RegionProductRow[]

  const currencyByCode = new Map(currencies.map((c) => [c.code, c]))

  // 지역별 상품 그룹화 (featured 우선, 이름순)
  const productsByRegion = new Map<string, ResolvedProduct[]>()
  for (const row of products) {
    if (!row.product) continue
    const list = productsByRegion.get(row.region_id) ?? []
    list.push({
      id: row.product.id,
      nameKo: row.product.name_ko,
      nameEn: row.product.name_en,
      category: row.product.category_id ?? "",
      image: row.product.image ?? "/placeholder.svg",
      unit: row.product.unit ?? "",
      brand: row.product.brand ?? "",
      price: Number(row.price),
      featured: row.featured,
      outOfStock: row.stock <= 0,
    })
    productsByRegion.set(row.region_id, list)
  }
  for (const list of productsByRegion.values()) {
    list.sort((a, b) => (a.featured === b.featured ? a.nameKo.localeCompare(b.nameKo) : a.featured ? -1 : 1))
  }

  return regions.map((r): Region => {
    const baseCurrency = currencyByCode.get(r.currency_code)
    return {
      id: r.id,
      city: r.city,
      country: r.country,
      countryCode: r.country_code,
      store: { ko: r.store_ko, en: r.store_en },
      announcement: { ko: r.announcement_ko ?? "", en: r.announcement_en ?? "" },
      hero: {
        title: { ko: r.hero_title_ko ?? "", en: r.hero_title_en ?? "" },
        subtitle: { ko: r.hero_subtitle_ko ?? "", en: r.hero_subtitle_en ?? "" },
        image: r.hero_image ?? "/placeholder.svg",
      },
      currency: {
        code: r.currency_code,
        // 지역별 로케일(예: 파리 fr-FR)이 있으면 우선 사용
        locale: r.locale ?? baseCurrency?.locale ?? "en-US",
        decimals: baseCurrency?.decimals ?? 2,
      },
      deliveryFee: Number(r.delivery_fee),
      freeDeliveryOver: Number(r.free_delivery_over),
      products: productsByRegion.get(r.id) ?? [],
    }
  })
}
