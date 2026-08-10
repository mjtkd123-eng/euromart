/**
 * K-EuroMart — 다중 지역(도시) 설정 데이터
 * =========================================
 *
 * 이 파일 하나만 편집하면 새로운 유럽 도시를 무제한으로 추가할 수 있습니다.
 *
 * 새 도시를 추가하려면:
 *   1) 아래 `currencies` 에 없는 통화라면 새 통화를 추가합니다.
 *   2) `catalog` 에 없는 상품이라면 마스터 상품을 추가합니다. (이미지/이름/카테고리)
 *   3) `regions` 배열에 새 Region 객체를 추가하고, products 에 판매할 상품 id 와
 *      해당 도시의 현지 통화 가격을 적어줍니다.
 *
 * 가격은 항상 "그 도시의 현지 통화" 기준입니다. (예: 베를린 EUR, 부다페스트 HUF)
 */

/* ----------------------------- 통화 ----------------------------- */

export interface Currency {
  /** ISO 4217 코드 (예: "EUR", "HUF", "CZK") */
  code: string
  /** Intl 포맷용 로케일 (예: "de-DE", "hu-HU") */
  locale: string
  /** 소수 자릿수 (EUR=2, HUF/CZK=0) */
  decimals: number
}

export const currencies = {
  EUR: { code: "EUR", locale: "de-DE", decimals: 2 },
  EUR_FR: { code: "EUR", locale: "fr-FR", decimals: 2 },
  EUR_AT: { code: "EUR", locale: "de-AT", decimals: 2 },
  HUF: { code: "HUF", locale: "hu-HU", decimals: 0 },
  CZK: { code: "CZK", locale: "cs-CZ", decimals: 0 },
  PLN: { code: "PLN", locale: "pl-PL", decimals: 2 },
} satisfies Record<string, Currency>

/** 현지 통화로 가격 포맷 — 예: 3990 → "3 990 Ft", 6.99 → "6,99 €" */
export function formatPrice(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(amount)
}

/* ---------------------------- 카테고리 ---------------------------- */

export interface Category {
  id: string
  nameKo: string
  nameEn: string
  /** lucide-react 아이콘 이름 */
  icon: string
}

export const categories: Category[] = [
  { id: "ramen", nameKo: "라면/면류", nameEn: "Ramen & Noodles", icon: "soup" },
  { id: "frozen", nameKo: "냉동식품", nameEn: "Frozen", icon: "snowflake" },
  { id: "sauce", nameKo: "소스/장류", nameEn: "Sauces & Pastes", icon: "milk" },
  { id: "kimchi", nameKo: "김치/반찬", nameEn: "Kimchi & Banchan", icon: "salad" },
  { id: "snack", nameKo: "과자", nameEn: "Snacks", icon: "cookie" },
  { id: "drink", nameKo: "음료", nameEn: "Drinks", icon: "cup-soda" },
  { id: "fresh", nameKo: "신선식품", nameEn: "Fresh Produce", icon: "carrot" },
  { id: "rice", nameKo: "쌀/즉석밥", nameEn: "Rice", icon: "wheat" },
]

/* -------------------------- 마스터 상품 -------------------------- */
/**
 * 가격이 없는 공통 상품 정보. 여러 도시가 이 카탈로그를 공유하고,
 * 각 도시(Region)는 자기 현지 통화로 가격만 따로 지정합니다.
 */

export interface CatalogProduct {
  nameKo: string
  /** 영어/현지 표기 */
  nameEn: string
  category: string
  image: string
  unit: string
  brand: string
}

export const catalog: Record<string, CatalogProduct> = {
  shin: { nameKo: "신라면 (5개입)", nameEn: "Shin Ramyun (5-pack)", category: "ramen", image: "/products/shin-ramyun.png", unit: "120g × 5", brand: "농심 Nongshim" },
  jin: { nameKo: "진라면 매운맛 (5개입)", nameEn: "Jin Ramen Spicy (5-pack)", category: "ramen", image: "/products/jin-ramen.png", unit: "120g × 5", brand: "오뚜기 Ottogi" },
  buldak: { nameKo: "불닭볶음면", nameEn: "Buldak Hot Chicken Noodles", category: "ramen", image: "/products/buldak.png", unit: "140g", brand: "삼양 Samyang" },
  noodle: { nameKo: "소면", nameEn: "Somyeon Thin Noodles", category: "ramen", image: "/products/somyeon.png", unit: "900g", brand: "풀무원 Pulmuone" },
  mandu: { nameKo: "비비고 왕교자 만두", nameEn: "Bibigo Dumplings", category: "frozen", image: "/products/mandu.png", unit: "525g", brand: "CJ" },
  tteok: { nameKo: "떡볶이 떡", nameEn: "Tteokbokki Rice Cakes", category: "frozen", image: "/products/tteok.png", unit: "1kg", brand: "대상 Daesang" },
  gochujang: { nameKo: "고추장", nameEn: "Gochujang Chili Paste", category: "sauce", image: "/products/gochujang.png", unit: "500g", brand: "해찬들 Haechandle" },
  doenjang: { nameKo: "된장", nameEn: "Doenjang Soybean Paste", category: "sauce", image: "/products/doenjang.png", unit: "500g", brand: "해찬들 Haechandle" },
  soysauce: { nameKo: "양조간장", nameEn: "Brewed Soy Sauce", category: "sauce", image: "/products/soy-sauce.png", unit: "1L", brand: "샘표 Sempio" },
  kimchi: { nameKo: "포기김치", nameEn: "Whole Cabbage Kimchi", category: "kimchi", image: "/products/kimchi.png", unit: "1kg", brand: "종가집 Jongga" },
  myeolchi: { nameKo: "멸치볶음", nameEn: "Stir-fried Anchovies", category: "kimchi", image: "/products/myeolchi.png", unit: "200g", brand: "수제반찬 Homemade" },
  choco: { nameKo: "초코파이 (12개입)", nameEn: "Choco Pie (12-pack)", category: "snack", image: "/products/choco-pie.png", unit: "39g × 12", brand: "오리온 Orion" },
  shrimp: { nameKo: "새우깡", nameEn: "Shrimp Crackers", category: "snack", image: "/products/saewookkang.png", unit: "90g", brand: "농심 Nongshim" },
  banana: { nameKo: "바나나맛 우유", nameEn: "Banana Milk", category: "drink", image: "/products/banana-milk.png", unit: "240ml", brand: "빙그레 Binggrae" },
  sikhye: { nameKo: "식혜", nameEn: "Sikhye Rice Drink", category: "drink", image: "/products/sikhye.png", unit: "500ml", brand: "비락 Birak" },
  napa: { nameKo: "배추 (1포기)", nameEn: "Napa Cabbage (1 head)", category: "fresh", image: "/products/napa-cabbage.png", unit: "≈ 2kg", brand: "산지직송 Farm-fresh" },
  radish: { nameKo: "무 (1개)", nameEn: "Korean Radish (1 pc)", category: "fresh", image: "/products/radish.png", unit: "≈ 1kg", brand: "산지직송 Farm-fresh" },
  rice: { nameKo: "햇반 (12개입)", nameEn: "Instant Rice (12-pack)", category: "rice", image: "/products/hetban.png", unit: "210g × 12", brand: "CJ" },
}

/* ------------------------- 지역(도시) 설정 ------------------------- */

/** 한 상품의 지역별 판매 정보 — 가격은 그 지역 현지 통화 기준 */
export interface RegionListing {
  /** catalog 의 키 */
  id: string
  /** 현지 통화 가격 */
  price: number
  featured?: boolean
  outOfStock?: boolean
}

export interface LocalizedText {
  ko: string
  en: string
}

export interface Region {
  /** URL/상태 식별자 */
  id: string
  city: string
  country: string
  /** ISO 국가 코드 (국기 대신 표시용 뱃지) */
  countryCode: string
  /** 매장 브랜드명 */
  store: LocalizedText
  /** 상단 공지/배너 문구 */
  announcement: LocalizedText
  hero: {
    title: LocalizedText
    subtitle: LocalizedText
    image: string
  }
  currency: Currency
  /** 배송비 (현지 통화) */
  deliveryFee: number
  /** 무료배송 기준 금액 (현지 통화) */
  freeDeliveryOver: number
  /** 판매 상품 목록 */
  products: RegionListing[]
}

export const regions: Region[] = [
  {
    id: "budapest",
    city: "Budapest",
    country: "Hungary",
    countryCode: "HU",
    store: { ko: "부다페스트 K마트", en: "K-EuroMart Budapest" },
    announcement: {
      ko: "15,000 Ft 이상 주문 시 무료 배송 · 신선 반찬 매일 입고",
      en: "Free delivery over 15,000 Ft · Fresh banchan daily",
    },
    hero: {
      title: { ko: "유럽 속 한국의 맛, 부다페스트", en: "A Taste of Korea in Budapest" },
      subtitle: {
        ko: "다뉴브강 도시로 신선한 한국 식료품을 배달합니다.",
        en: "Fresh Korean groceries delivered across the Danube city.",
      },
      image: "/hero-banchan.png",
    },
    currency: currencies.HUF,
    deliveryFee: 990,
    freeDeliveryOver: 15000,
    products: [
      { id: "shin", price: 3990, featured: true },
      { id: "jin", price: 3790 },
      { id: "buldak", price: 990, featured: true },
      { id: "mandu", price: 2490 },
      { id: "tteok", price: 1890 },
      { id: "gochujang", price: 2290 },
      { id: "kimchi", price: 3490, featured: true },
      { id: "myeolchi", price: 2790 },
      { id: "choco", price: 2990 },
      { id: "banana", price: 690 },
      { id: "napa", price: 1490 },
      { id: "rice", price: 4990 },
    ],
  },
  {
    id: "berlin",
    city: "Berlin",
    country: "Germany",
    countryCode: "DE",
    store: { ko: "독일 베를린 K마트", en: "K-EuroMart Berlin" },
    announcement: {
      ko: "49€ 이상 주문 시 무료 배송 · 독일 전역 발송",
      en: "Free delivery over 49€ · Ships across Germany",
    },
    hero: {
      title: { ko: "베를린의 한국 식료품점", en: "Your Korean Grocer in Berlin" },
      subtitle: {
        ko: "라면부터 김치까지, 독일 어디서나 받아보세요.",
        en: "From ramyun to kimchi, delivered anywhere in Germany.",
      },
      image: "/hero-ramen.png",
    },
    currency: currencies.EUR,
    deliveryFee: 4.9,
    freeDeliveryOver: 49,
    products: [
      { id: "shin", price: 6.99, featured: true },
      { id: "buldak", price: 2.49, featured: true },
      { id: "mandu", price: 5.49 },
      { id: "gochujang", price: 4.99 },
      { id: "soysauce", price: 3.99 },
      { id: "kimchi", price: 7.99, featured: true },
      { id: "choco", price: 4.49 },
      { id: "banana", price: 1.29 },
      { id: "sikhye", price: 1.99 },
      { id: "rice", price: 8.99 },
    ],
  },
  {
    id: "paris",
    city: "Paris",
    country: "France",
    countryCode: "FR",
    store: { ko: "파리 한인마트", en: "K-EuroMart Paris" },
    announcement: {
      ko: "59€ 이상 주문 시 무료 배송 · 파리 당일 배송",
      en: "Free delivery over 59€ · Same-day in Paris",
    },
    hero: {
      title: { ko: "파리에서 만나는 한국의 맛", en: "Korean Flavors in Paris" },
      subtitle: {
        ko: "한식의 모든 것을 파리 집앞까지.",
        en: "Everything Korean, delivered to your Paris door.",
      },
      image: "/hero-kimchi.png",
    },
    currency: currencies.EUR_FR,
    deliveryFee: 5.9,
    freeDeliveryOver: 59,
    products: [
      { id: "shin", price: 7.49, featured: true },
      { id: "jin", price: 6.99 },
      { id: "buldak", price: 2.79, featured: true },
      { id: "mandu", price: 5.99 },
      { id: "tteok", price: 3.99 },
      { id: "gochujang", price: 5.49 },
      { id: "kimchi", price: 8.49, featured: true },
      { id: "noodle", price: 3.49 },
      { id: "choco", price: 4.99 },
      { id: "banana", price: 1.49 },
    ],
  },
  {
    id: "vienna",
    city: "Vienna",
    country: "Austria",
    countryCode: "AT",
    store: { ko: "비엔나 K마트", en: "K-EuroMart Wien" },
    announcement: {
      ko: "49€ 이상 주문 시 무료 배송 · 오스트리아 전역",
      en: "Free delivery over 49€ · Across Austria",
    },
    hero: {
      title: { ko: "비엔나의 한국 식료품점", en: "Korean Grocery in Vienna" },
      subtitle: {
        ko: "정통 한국 식자재를 비엔나에서 편리하게.",
        en: "Authentic Korean staples, conveniently in Vienna.",
      },
      image: "/hero-ramen.png",
    },
    currency: currencies.EUR_AT,
    deliveryFee: 4.9,
    freeDeliveryOver: 49,
    products: [
      { id: "shin", price: 6.89 },
      { id: "buldak", price: 2.39, featured: true },
      { id: "mandu", price: 5.29 },
      { id: "doenjang", price: 4.79 },
      { id: "kimchi", price: 7.79, featured: true },
      { id: "shrimp", price: 2.29 },
      { id: "choco", price: 4.29 },
      { id: "banana", price: 1.19 },
      { id: "sikhye", price: 1.89 },
      { id: "rice", price: 8.49, featured: true },
    ],
  },
  {
    id: "prague",
    city: "Prague",
    country: "Czechia",
    countryCode: "CZ",
    store: { ko: "프라하 K마트", en: "K-EuroMart Praha" },
    announcement: {
      ko: "990 Kč 이상 주문 시 무료 배송 · 프라하 & 근교",
      en: "Free delivery over 990 Kč · Prague & suburbs",
    },
    hero: {
      title: { ko: "프라하의 한국 식료품점", en: "Korean Grocery in Prague" },
      subtitle: {
        ko: "체코에서 즐기는 진짜 한국의 맛.",
        en: "Genuine Korean taste, now in Czechia.",
      },
      image: "/hero-kimchi.png",
    },
    currency: currencies.CZK,
    deliveryFee: 89,
    freeDeliveryOver: 990,
    products: [
      { id: "shin", price: 169, featured: true },
      { id: "jin", price: 159 },
      { id: "buldak", price: 59, featured: true },
      { id: "mandu", price: 129 },
      { id: "gochujang", price: 119 },
      { id: "kimchi", price: 199, featured: true },
      { id: "noodle", price: 79 },
      { id: "shrimp", price: 55 },
      { id: "choco", price: 109 },
      { id: "banana", price: 35 },
      { id: "rice", price: 219 },
    ],
  },
]

/* ----------------------------- 헬퍼 ----------------------------- */

/** 해석된 상품 뷰 — 마스터 정보 + 그 지역의 가격을 합침 */
export interface ResolvedProduct extends CatalogProduct {
  id: string
  price: number
  featured: boolean
  outOfStock: boolean
}

export function getRegion(id: string): Region {
  return regions.find((r) => r.id === id) ?? regions[0]
}

/** 특정 지역의 판매 상품을 카탈로그 정보와 합쳐서 반환 */
export function getRegionProducts(region: Region): ResolvedProduct[] {
  return region.products
    .map((listing) => {
      const base = catalog[listing.id]
      if (!base) return null
      return {
        ...base,
        id: listing.id,
        price: listing.price,
        featured: listing.featured ?? false,
        outOfStock: listing.outOfStock ?? false,
      }
    })
    .filter((p): p is ResolvedProduct => p !== null)
}
