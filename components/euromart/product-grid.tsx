"use client"

import { PackageSearch } from "lucide-react"
import { useEuromart } from "@/lib/euromart-context"
import { categories } from "@/lib/storesData"
import { ProductCard } from "./product-card"

export function ProductGrid() {
  const { region, filteredProducts, activeCategory, searchQuery } = useEuromart()

  const heading =
    searchQuery.trim().length > 0
      ? `"${searchQuery}" 검색 결과`
      : activeCategory
        ? (categories.find((c) => c.id === activeCategory)?.nameKo ?? "상품")
        : `${region.city} 매장 상품`

  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-black text-foreground">{heading}</h2>
        <span className="text-sm text-muted-foreground">{filteredProducts.length}개 상품</span>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <PackageSearch className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">해당하는 상품이 없습니다</p>
          <p className="text-xs text-muted-foreground">다른 검색어나 카테고리를 선택해 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
