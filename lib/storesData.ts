/**
 * K-EuroMart — 공유 타입 & 포매팅 헬퍼
 * =====================================
 *
 * 실제 지역/상품/가격 데이터는 이제 Supabase 데이터베이스에 저장됩니다.
 * 서버에서 데이터를 조회하는 로직은 `lib/euromart-server.ts` 를 참고하세요.
 *
 * 이 파일은 클라이언트/서버가 공유하는 "모양(shape)"과 순수 헬퍼만 정의합니다.
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

/**
 * 카테고리 라벨/아이콘 매핑 (UI 표시용). DB의 categories 테이블과 동일하게 유지됩니다.
 * 상품이 실제로 취급하는 카테고리만 필터에 노출됩니다.
 */
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

/* ----------------------------- 상품 ----------------------------- */

export interface CatalogProduct {
  nameKo: string
  /** 영어/현지 표기 */
  nameEn: string
  category: string
  image: string
  unit: string
  brand: string
}

/** 특정 지역에서 해석된 상품 — 마스터 정보 + 그 지역의 현지 통화 가격 */
export interface ResolvedProduct extends CatalogProduct {
  id: string
  price: number
  featured: boolean
  outOfStock: boolean
}

/* ------------------------- 지역(도시) 설정 ------------------------- */

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
  /** 이미 해석된 판매 상품 목록 (현지 통화 가격 포함) */
  products: ResolvedProduct[]
}

/* ----------------------------- 헬퍼 ----------------------------- */

export function getRegion(regions: Region[], id: string): Region {
  return regions.find((r) => r.id === id) ?? regions[0]
}

/** 특정 지역의 판매 상품 목록 */
export function getRegionProducts(region: Region): ResolvedProduct[] {
  return region.products
}
