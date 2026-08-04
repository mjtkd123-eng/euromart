/**
 * 데이터 모델 정의
 *
 * 이 스키마는 실제 데이터베이스(예: Neon Postgres)로 그대로 옮길 수 있도록 설계되었습니다.
 * 핵심 아이디어: "마스터 상품(CatalogProduct, 가격 없음)"과
 * "마트별 판매 상품(StoreProduct, 가격 있음)"을 분리합니다.
 * 덕분에 같은 신라면이라도 A마트 950 Ft, B마트 1100 Ft 로 각각 저장됩니다.
 */

/** 부다페스트 구역 (예: "V. kerület") */
export type District = string

/** 마트(입점업체 매장) */
export interface Store {
  id: string
  slug: string
  name: string
  nameHu: string
  /** 영어 매장명 */
  nameEn: string
  /** 매장 로고 이미지 경로 */
  logo: string
  /** 매장 상세 상단 커버 이미지 */
  coverImage: string
  /** 설명 (한국어) */
  description: string
  /** 설명 (헝가리어) */
  descriptionHu: string
  /** 설명 (영어) */
  descriptionEn: string
  district: District
  address: string
  /** 배달비 (Ft) */
  deliveryFee: number
  /** 최소 주문 금액 (Ft) */
  minOrder: number
  /** 예상 배달 시간 (분) */
  deliveryTimeMin: number
  rating: number
  ratingCount: number
  isOpen: boolean
  tags: string[]
}

/** 상품 분류 (라면, 냉동식품 등) */
export interface Category {
  id: string
  name: string
  nameHu: string
  /** 영어 카테고리명 */
  nameEn: string
  /** lucide-react 아이콘 이름 매핑용 키 */
  icon: string
}

/**
 * 마스터 상품 (카탈로그)
 * 가격이 없습니다. 여러 마트가 이 상품을 공유하며, 각자 다른 가격으로 판매합니다.
 */
export interface CatalogProduct {
  id: string
  nameKo: string
  nameHu: string
  /** 영어 상품명 */
  nameEn: string
  /** 설명 (한국어) */
  description: string
  /** 설명 (헝가리어) */
  descriptionHu: string
  /** 설명 (영어) */
  descriptionEn: string
  imageUrl: string
  categoryId: string
  /** 용량/단위 표기 (예: "120g", "1L", "5개입") */
  unit: string
  brand: string
}

/**
 * 마트별 판매 상품 (리스팅)
 * 특정 마트가 특정 마스터 상품을 얼마에 파는지 나타냅니다.
 * >>> 마트별 가격 차이는 바로 이 레코드에 저장됩니다. <<<
 */
export interface StoreProduct {
  id: string
  storeId: string
  catalogProductId: string
  /** 판매 가격 (Ft) — 마트마다 다름 */
  price: number
  inStock: boolean
  isFeatured: boolean
}

/**
 * 입점업체(사장님) 계정 — 향후 벤더 인증/대시보드 확장을 위한 구조.
 * 한 벤더는 하나의 store를 소유하며, 자기 store의 StoreProduct(가격/재고)만 수정 가능합니다.
 */
export interface Vendor {
  id: string
  name: string
  /** 영어 이름 */
  nameEn: string
  email: string
  storeId: string
}

/** 장바구니 항목 — 가격 스냅샷을 포함해 담은 시점의 가격을 보존 */
export interface CartItem {
  storeProductId: string
  catalogProductId: string
  storeId: string
  nameKo: string
  nameHu: string
  /** 영어 상품명 (담은 시점 스냅샷) */
  nameEn: string
  imageUrl: string
  unit: string
  /** 담은 시점의 단가 (Ft) */
  price: number
  quantity: number
}

/** 마트 상품 조회 결과 — 마스터 정보 + 그 마트의 가격을 합친 뷰 */
export interface StoreProductView extends CatalogProduct {
  storeProductId: string
  storeId: string
  price: number
  inStock: boolean
  isFeatured: boolean
}
