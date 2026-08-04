"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import type { Store, Category } from "@/lib/types"
import { CategoryIcon } from "@/components/category-icon"
import { StoreCard } from "@/components/store-card"
import { HeroCarousel } from "@/components/hero-carousel"
import { Input } from "@/components/ui/input"
import { storeProducts, catalogProducts } from "@/lib/data"
import { useLanguage } from "@/lib/language-context"
import { localizeCategory } from "@/lib/i18n"

/** 특정 카테고리 상품을 파는 마트 id 집합 */
function storeIdsForCategory(categoryId: string): Set<string> {
  const productIds = new Set(catalogProducts.filter((p) => p.categoryId === categoryId).map((p) => p.id))
  return new Set(storeProducts.filter((sp) => productIds.has(sp.catalogProductId)).map((sp) => sp.storeId))
}

export function HomeView({ stores, categories }: { stores: Store[]; categories: Category[] }) {
  const { lang, t } = useLanguage()
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = stores
    if (activeCategory) {
      const ids = storeIdsForCategory(activeCategory)
      list = list.filter((s) => ids.has(s.id))
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nameHu.toLowerCase().includes(q) ||
          s.nameEn.toLowerCase().includes(q) ||
          s.tags.some((tag) => tag.toLowerCase().includes(q)),
      )
    }
    // 영업중인 마트 우선 정렬
    return [...list].sort((a, b) => Number(b.isOpen) - Number(a.isOpen))
  }, [stores, query, activeCategory])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* 히어로 캐러셀 */}
      <div className="mb-6">
        <HeroCarousel />
      </div>

      {/* 검색 */}
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.home.searchPlaceholder}
          className="h-12 rounded-full pl-12 text-base"
          aria-label={t.home.searchAria}
        />
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveCategory(null)}
          className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            activeCategory === null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          {t.common.all}
        </button>
        {categories.map((cat) => {
          const active = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(active ? null : cat.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              <CategoryIcon icon={cat.icon} className="size-4" />
              {localizeCategory(cat, lang)}
            </button>
          )
        })}
      </div>

      {/* 마트 목록 */}
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">
          {t.home.availableMarts} <span className="text-primary">{filtered.length}</span>
        </h2>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          {t.home.empty}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </div>
  )
}
