import "server-only"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { DEMO_REGIONS } from "./demo-regions"
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
  if (!isSupabaseConfigured()) {
    return ensureTwoStoresPerCountry(DEMO_REGIONS.map(cloneRegion))
  }

  try {
    return await fetchRegionsFromSupabase()
  } catch {
    return ensureTwoStoresPerCountry(DEMO_REGIONS.map(cloneRegion))
  }
}

function cloneRegion(region: Region): Region {
  return {
    ...region,
    store: { ...region.store },
    announcement: { ...region.announcement },
    hero: {
      ...region.hero,
      title: { ...region.hero.title },
      subtitle: { ...region.hero.subtitle },
    },
    currency: { ...region.currency },
    products: region.products.map((p) => ({ ...p })),
  }
}

async function fetchRegionsFromSupabase(): Promise<Region[]> {
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

  const mapped = regions.map((r): Region => {
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

  if (mapped.length === 0) {
    return ensureTwoStoresPerCountry(DEMO_REGIONS.map(cloneRegion))
  }

  // 데모: 국가당 매장이 1개면 두 번째 도시 매장을 복제해 보여 줌
  return ensureTwoStoresPerCountry(mapped)
}

/** 국가별 두 번째 매장(도시) 메타 — DB에 없을 때 표시용 */
const SECOND_STORE_BY_COUNTRY: Record<
  string,
  {
    id: string
    city: string
    store: { ko: string; en: string }
    heroTitle: { ko: string; en: string }
    heroSubtitle: { ko: string; en: string }
  }
> = {
  HU: {
    id: "debrecen",
    city: "Debrecen",
    store: { ko: "데브레첸 K마트", en: "K-EuroMart Debrecen" },
    heroTitle: { ko: "데브레첸의 한국 식료품점", en: "Korean Grocery in Debrecen" },
    heroSubtitle: { ko: "헝가리 동부에서도 신선한 한식을 받아보세요.", en: "Fresh Korean groceries in eastern Hungary." },
  },
  DE: {
    id: "munich",
    city: "Munich",
    store: { ko: "뮌헨 K마트", en: "K-EuroMart München" },
    heroTitle: { ko: "뮌헨의 한국 식료품점", en: "Korean Grocery in Munich" },
    heroSubtitle: { ko: "바이에른에서도 한국의 맛을 즐기세요.", en: "Enjoy Korean flavors across Bavaria." },
  },
  FR: {
    id: "lyon",
    city: "Lyon",
    store: { ko: "리옹 한인마트", en: "K-EuroMart Lyon" },
    heroTitle: { ko: "리옹에서 만나는 한국의 맛", en: "Korean Flavors in Lyon" },
    heroSubtitle: { ko: "프랑스 남동부까지 한식 배달.", en: "Korean groceries delivered across southeast France." },
  },
  AT: {
    id: "graz",
    city: "Graz",
    store: { ko: "그라츠 K마트", en: "K-EuroMart Graz" },
    heroTitle: { ko: "그라츠의 한국 식료품점", en: "Korean Grocery in Graz" },
    heroSubtitle: { ko: "슈타이어마르크에서도 정통 한식 재료를.", en: "Authentic Korean staples in Styria." },
  },
  CZ: {
    id: "brno",
    city: "Brno",
    store: { ko: "브르노 K마트", en: "K-EuroMart Brno" },
    heroTitle: { ko: "브르노의 한국 식료품점", en: "Korean Grocery in Brno" },
    heroSubtitle: { ko: "모라비아에서도 진짜 한국의 맛.", en: "Genuine Korean taste in Moravia." },
  },
}

function ensureTwoStoresPerCountry(regions: Region[]): Region[] {
  const byCountry = new Map<string, Region[]>()
  const countryOrder: string[] = []
  for (const r of regions) {
    if (!byCountry.has(r.countryCode)) countryOrder.push(r.countryCode)
    const list = byCountry.get(r.countryCode) ?? []
    list.push(r)
    byCountry.set(r.countryCode, list)
  }

  const result: Region[] = []
  for (const code of countryOrder) {
    const list = byCountry.get(code) ?? []
    result.push(...list)
    if (list.length >= 2) continue

    const base = list[0]
    const extra = SECOND_STORE_BY_COUNTRY[code]
    if (!base || !extra) continue
    if (regions.some((r) => r.id === extra.id)) continue

    result.push({
      ...base,
      id: extra.id,
      city: extra.city,
      store: { ...extra.store },
      hero: {
        ...base.hero,
        title: { ...extra.heroTitle },
        subtitle: { ...extra.heroSubtitle },
      },
      products: base.products.map((p) => ({ ...p })),
    })
  }

  return result
}
