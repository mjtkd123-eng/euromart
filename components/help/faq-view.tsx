"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search, ChevronDown, MessageCircle } from "lucide-react"
import { FAQ_CATEGORIES, type FaqCategoryId, type FaqItem } from "@/lib/chatbot"
import { CONTACT } from "@/lib/help-center"

type Filter = "all" | FaqCategoryId

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "전체" },
  ...FAQ_CATEGORIES.map((c) => ({ id: c.id as Filter, label: c.label.split(" · ")[0] })),
]

/** 카테고리 id → 라벨 매핑 (검색 결과에 카테고리 표시용) */
const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  FAQ_CATEGORIES.map((c) => [c.id, c.label.split(" · ")[0]]),
)

interface FlatFaq extends FaqItem {
  categoryId: FaqCategoryId
}

const ALL_ITEMS: FlatFaq[] = FAQ_CATEGORIES.flatMap((c) =>
  c.items.map((i) => ({ ...i, categoryId: c.id })),
)

export function FaqView() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") ?? ""

  const [query, setQuery] = useState(initialQuery)
  const [filter, setFilter] = useState<Filter>("all")
  const [openId, setOpenId] = useState<string | null>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ALL_ITEMS.filter((item) => {
      if (filter !== "all" && item.categoryId !== filter) return false
      if (!q) return true
      const haystack = [item.question, ...item.intents].join(" ").toLowerCase()
      return haystack.includes(q)
    })
  }, [query, filter])

  return (
    <div className="flex flex-col gap-6">
      {/* 검색 */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <label htmlFor="faq-search" className="sr-only">
          질문 검색
        </label>
        <input
          id="faq-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="궁금한 내용을 검색하세요 — 예: 무료배송, 3D Secure, 신선식품 환불"
          className="h-12 w-full rounded-2xl border border-border bg-card pl-12 pr-4 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 결과 */}
      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {"'"}
            {query}
            {"'"}에 대한 결과를 찾지 못했습니다. 다른 키워드로 검색하거나 1:1 문의를 이용해 주세요.
          </p>
          <Link
            href="/help/contact"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            1:1 문의하기
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {results.map((item) => {
            const isOpen = openId === item.id
            const hasAnswer = item.status === "ready" && item.answerDraft.trim() !== ""
            return (
              <li key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <button
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {CATEGORY_LABEL[item.categoryId]}
                    </span>
                    <span className="text-sm font-semibold sm:text-base">{item.question}</span>
                  </span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-muted-foreground transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-border px-5 py-4">
                    {hasAnswer ? (
                      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                        {item.answerDraft}
                      </p>
                    ) : (
                      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                        해당 문의는 매장·정책에 따라 다를 수 있어 확인 후 정확히 안내드립니다. 급하시면 주문번호와
                        함께 고객센터({CONTACT.email})로 문의해 주세요.
                      </p>
                    )}
                    {item.link && (
                      <Link
                        href={item.link}
                        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-2 hover:underline"
                      >
                        자세히 보기 →
                      </Link>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
