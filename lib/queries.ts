import { stores, categories, catalogProducts, storeProducts, vendors } from "./data"
import type { Store, Category, StoreProductView, Vendor } from "./types"

/**
 * 데이터 접근 계층 (DB 쿼리 대체)
 *
 * 지금은 인메모리 샘플 데이터를 사용하지만, 실제 DB(Neon 등) 연동 시
 * 각 함수의 내부 구현만 SQL 쿼리로 교체하면 나머지 앱 코드는 그대로 동작합니다.
 * 예) getStoreProducts -> SELECT ... FROM store_products JOIN catalog_products ...
 */

/** 전체 마트 목록 */
export function getStores(): Store[] {
  return stores
}

/** slug로 마트 단건 조회 */
export function getStoreBySlug(slug: string): Store | undefined {
  return stores.find((s) => s.slug === slug)
}

/** id로 마트 단건 조회 */
export function getStoreById(id: string): Store | undefined {
  return stores.find((s) => s.id === id)
}

/** 전체 카테고리 */
export function getCategories(): Category[] {
  return categories
}

/**
 * 특정 마트의 판매 상품 목록 (마스터 정보 + 그 마트의 가격을 합친 뷰).
 * >>> 반환되는 price는 오직 이 마트의 가격입니다. <<<
 */
export function getStoreProducts(storeId: string, categoryId?: string): StoreProductView[] {
  const views = storeProducts
    .filter((sp) => sp.storeId === storeId)
    .map((sp) => {
      const product = catalogProducts.find((p) => p.id === sp.catalogProductId)
      if (!product) return null
      const view: StoreProductView = {
        ...product,
        storeProductId: sp.id,
        storeId: sp.storeId,
        price: sp.price,
        inStock: sp.inStock,
        isFeatured: sp.isFeatured,
      }
      return view
    })
    .filter((v): v is StoreProductView => v !== null)

  if (categoryId) {
    return views.filter((v) => v.categoryId === categoryId)
  }
  return views
}

/** 특정 마트가 실제로 취급하는 카테고리만 반환 (탭 구성용) */
export function getStoreCategories(storeId: string): Category[] {
  const products = getStoreProducts(storeId)
  const usedCategoryIds = new Set(products.map((p) => p.categoryId))
  return categories.filter((c) => usedCategoryIds.has(c.id))
}

/** 마트 검색 (이름/태그/설명 기준) */
export function searchStores(query: string): Store[] {
  const q = query.trim().toLowerCase()
  if (!q) return stores
  return stores.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.nameHu.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q)),
  )
}

/** 카테고리로 마트 필터링 (해당 카테고리 상품을 파는 마트) */
export function getStoresByCategory(categoryId: string): Store[] {
  const storeIds = new Set(
    storeProducts
      .map((sp) => {
        const product = catalogProducts.find((p) => p.id === sp.catalogProductId)
        return product?.categoryId === categoryId ? sp.storeId : null
      })
      .filter((id): id is string => id !== null),
  )
  return stores.filter((s) => storeIds.has(s.id))
}

/* ------------------------ 벤더(입점업체) ------------------------ */

/** 벤더 단건 조회 */
export function getVendorById(id: string): Vendor | undefined {
  return vendors.find((v) => v.id === id)
}

/** 전체 벤더 목록 (데모용 계정 전환) */
export function getVendors(): Vendor[] {
  return vendors
}
