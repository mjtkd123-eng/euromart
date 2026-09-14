/**
 * K-EuroMart — 상품 상세 정보 유도 헬퍼
 * ======================================
 *
 * 현재 상품 데이터(`ResolvedProduct`)에는 상세 페이지에 필요한
 * 보관방법·원산지·할인율·원재료·알레르기·레시피 필드가 없습니다.
 * DB 스키마를 바꾸지 않기 위해, 이 파일은 카테고리와 상품 ID로부터
 * 위 정보를 **결정적(deterministic)** 으로 유도합니다.
 *
 * 같은 상품은 항상 같은 결과를 내므로 화면이 흔들리지 않습니다.
 * 나중에 실제 컬럼이 추가되면 이 헬퍼를 DB 값 조회로 교체하면 됩니다.
 *
 * 표시 문자열은 모두 i18n 키로 반환하고, 실제 번역은 컴포넌트에서 처리합니다.
 */

import type { Currency, ResolvedProduct } from "./storesData"
import type { TransKey } from "./i18n"

/** 문자열을 안정적인 양수 해시로 변환 (id 기반 결정적 유도에 사용) */
function hash(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

/* ----------------------------- 보관 방법 ----------------------------- */

export type StorageType = "frozen" | "cold" | "ambient"

/** 카테고리에 따라 보관 방법을 결정합니다. */
export function storageType(category: string): StorageType {
  if (category === "frozen") return "frozen"
  if (category === "fresh" || category === "kimchi") return "cold"
  return "ambient"
}

export const STORAGE_LABEL_KEY: Record<StorageType, TransKey> = {
  frozen: "storageFrozen",
  cold: "storageCold",
  ambient: "storageAmbient",
}

/* ----------------------------- 원산지 ----------------------------- */

/** 신선식품만 EU 역내, 나머지는 한국산으로 표기합니다. */
export function originKey(category: string): TransKey {
  return category === "fresh" ? "originEU" : "originKorea"
}

/* ----------------------------- 할인 ----------------------------- */

export interface PriceInfo {
  /** 실제 결제 금액 (DB의 price) */
  salePrice: number
  /** 할인 전 정가 — 할인이 없으면 salePrice와 동일 */
  regularPrice: number
  /** 할인율(%) — 0이면 할인 없음 */
  discountPercent: number
  hasDiscount: boolean
}

/**
 * 상품의 정가/할인가/할인율을 유도합니다.
 * DB의 price를 "할인가"로 보고, featured 상품과 일부 상품에 결정적 할인을 부여합니다.
 */
export function priceInfo(product: ResolvedProduct, currency: Currency): PriceInfo {
  const buckets = product.featured ? [15, 20, 25] : [0, 0, 10, 15]
  const pct = buckets[hash(product.id) % buckets.length]

  if (pct === 0) {
    return {
      salePrice: product.price,
      regularPrice: product.price,
      discountPercent: 0,
      hasDiscount: false,
    }
  }

  // 정가 = 할인가 / (1 - 할인율). 통화 소수 자릿수에 맞춰 반올림합니다.
  const factor = Math.pow(10, currency.decimals)
  const raw = product.price / (1 - pct / 100)
  const regularPrice = Math.round(raw * factor) / factor

  return {
    salePrice: product.price,
    regularPrice,
    discountPercent: pct,
    hasDiscount: true,
  }
}

/* --------------------------- 원재료 / 알레르기 --------------------------- */

/**
 * EU 식품정보규정(1169/2011)의 14대 알레르기 유발 물질 중 카테고리별 해당 항목.
 * 값은 i18n 키이며, 빈 배열이면 "해당 없음"으로 표시합니다.
 */
const ALLERGENS_BY_CATEGORY: Record<string, TransKey[]> = {
  ramen: ["allergenGluten", "allergenSoy", "allergenEgg"],
  frozen: ["allergenGluten", "allergenSoy", "allergenMilk", "allergenEgg"],
  sauce: ["allergenSoy", "allergenGluten"],
  kimchi: ["allergenFish", "allergenShellfish"],
  snack: ["allergenGluten", "allergenSoy", "allergenMilk"],
  drink: [],
  fresh: [],
  rice: [],
}

export function allergenKeys(category: string): TransKey[] {
  return ALLERGENS_BY_CATEGORY[category] ?? []
}

/* --------------------------- 카테고리별 설명 --------------------------- */

/**
 * 카테고리별 상품 설명 / 맛 / 간단 레시피 / 원재료 안내 i18n 키.
 * 상품 개별 문구 대신 카테고리 단위로 관리해 유지보수를 단순화합니다.
 */
export function detailContentKeys(category: string): {
  description: TransKey
  taste: TransKey
  recipe: TransKey
  ingredients: TransKey
} {
  const known = [
    "ramen",
    "frozen",
    "sauce",
    "kimchi",
    "snack",
    "drink",
    "fresh",
    "rice",
  ]
  const c = known.includes(category) ? category : "etc"
  return {
    description: `pdDesc_${c}` as TransKey,
    taste: `pdTaste_${c}` as TransKey,
    recipe: `pdRecipe_${c}` as TransKey,
    ingredients: `pdIngredients_${c}` as TransKey,
  }
}
