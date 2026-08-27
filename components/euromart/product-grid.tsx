"use client"

import { PackageSearch } from "lucide-react"
import { useEuromart } from "@/lib/euromart-context"
import { categories } from "@/lib/storesData"
import type { TransKey } from "@/lib/i18n"
import { ProductCard } from "./product-card"

export function ProductGrid() {
  const { region, filteredProducts, activeCategory, searchQuery, t } = useEuromart()

  const activeCategoryExists =
    activeCategory !== null && categories.some((c) => c.id === activeCategory)

  const heading =
    searchQuery.trim().length > 0
      ? t("searchResultsFor", { query: searchQuery })
      : activeCategoryExists
        ? t(`cat.${activeCategory}` as TransKey)
        : activeCategory
          ? t("products")
          : t("storeProducts", { city: region.city })

  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-black text-foreground">{heading}</h2>
        <span className="text-sm text-muted-foreground">
          {t("productCount", { count: filteredProducts.length })}
        </span>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <PackageSearch className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">{t("noProducts")}</p>
          <p className="text-xs text-muted-foreground">{t("noProductsHint")}</p>
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
