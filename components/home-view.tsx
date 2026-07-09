"use client"

import { useMemo, useState } from "react"
import { Search, MapPin } from "lucide-react"
import type { Store, Category } from "@/lib/types"
import { CategoryIcon } from "@/components/category-icon"
import { StoreCard } from "@/components/store-card"
import { Input } from "@/components/ui/input"
import { storeProducts, catalogProducts } from "@/lib/data"

/** 특정 카테고리 상품을 파는 마트 id 집합 */
function storeIdsForCategory(categoryId: string): Set<string> {
  const productIds = new Set(catalogProducts.filter((p) => p.categoryId === categoryId).map((p) => p.id))
  return new Set(storeProducts.filter((sp) => productIds.has(sp.catalogProductId)).map((sp) => sp.storeId))
}

export function HomeView({ stores, categories }: { stores: Store[]; categories: Category[] }) {
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
          s.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }
    // 영업중인 마트 우선 정렬
    return [...list].sort((a, b) => Number(b.isOpen) - Number(a.isOpen))
  }, [stores, query, activeCategory])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* 히어로 */}
      <section className="mb-6 overflow-hidden rounded-3xl bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-12">
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium">
          <MapPin className="size-3.5" aria-hidden="true" />
          부다페스트 전역 배달
        </p>
        <h1 className="text-pretty text-2xl font-black leading-tight sm:text-4xl">
          한국의 맛, 집 앞까지
          <br />
          부다페스트 한인·아시안 마트 배달
        </h1>
        <p className="mt-3 max-w-lg text-sm text-primary-foreground/80 sm:text-base">
          원하는 마트를 골라 신라면부터 김치, 신선 채소까지. 마트마다 상품과 가격이 다르니 비교하며 담아보세요.
        </p>
      </section>

      {/* 검색 */}
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="마트 이름이나 상품을 검색하세요 (예: 라면, 김치)"
          className="h-12 rounded-full pl-12 text-base"
          aria-label="마트 검색"
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
          전체
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
              {cat.name}
            </button>
          )
        })}
      </div>

      {/* 마트 목록 */}
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">
          배달 가능한 마트 <span className="text-primary">{filtered.length}</span>
        </h2>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          조건에 맞는 마트가 없습니다. 다른 검색어나 카테고리를 시도해 보세요.
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
