"use client"

import { LayoutGrid } from "lucide-react"
import { categories } from "@/lib/storesData"
import { useEuromart } from "@/lib/euromart-context"
import { EuroCategoryIcon } from "./euro-category-icon"

export function CategoryFilter() {
  const { products, activeCategory, setActiveCategory } = useEuromart()

  // 이 지역이 실제로 취급하는 카테고리만 노출
  const availableIds = new Set(products.map((p) => p.category))
  const available = categories.filter((c) => availableIds.has(c.id))

  const baseChip =
    "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"

  return (
    <nav aria-label="카테고리 필터" className="mx-auto max-w-6xl px-4 pt-6">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveCategory(null)}
          className={`${baseChip} ${
            activeCategory === null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          <LayoutGrid className="size-4" aria-hidden="true" />
          전체
        </button>
        {available.map((cat) => {
          const active = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`${baseChip} ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              <EuroCategoryIcon icon={cat.icon} className="size-4" />
              <span>{cat.nameKo}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
