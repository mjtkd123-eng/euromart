"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search, ChevronDown, MessageCircle } from "lucide-react"
import { FAQ_CATEGORIES, type FaqCategoryId, type FaqItem } from "@/lib/chatbot"
import { CONTACT } from "@/lib/help-center"
import { useEuromart } from "@/lib/euromart-context"

type Filter = "all" | FaqCategoryId

interface FlatFaq extends FaqItem {
  categoryId: FaqCategoryId
}

const ALL_ITEMS: FlatFaq[] = FAQ_CATEGORIES.flatMap((c) =>
  c.items.map((i) => ({ ...i, categoryId: c.id })),
)

export function FaqView() {
  const searchParams = useSearchParams()
  const { lang, t } = useEuromart()
  const initialQuery = searchParams.get("q") ?? ""

  const [query, setQuery] = useState(initialQuery)
  const [filter, setFilter] = useState<Filter>("all")
  const [openId, setOpenId] = useState<string | null>(null)

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("filterAll") },
    ...FAQ_CATEGORIES.map((c) => ({
      id: c.id as Filter,
      label: lang === "ko" ? c.label.split(" · ")[0] : c.labelEn,
    })),
  ]

  const categoryLabel: Record<string, string> = Object.fromEntries(
    FAQ_CATEGORIES.map((c) => [c.id, lang === "ko" ? c.label.split(" · ")[0] : c.labelEn]),
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ALL_ITEMS.filter((item) => {
      if (filter !== "all" && item.categoryId !== filter) return false
      if (!q) return true
      const haystack = [item.question, item.questionEn, ...item.intents].join(" ").toLowerCase()
      return haystack.includes(q)
    })
  }, [query, filter])

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <label htmlFor="faq-search" className="sr-only">
          {t("faqSearchLabel")}
        </label>
        <input
          id="faq-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("faqSearchPlaceholder")}
          className="h-12 w-full rounded-2xl border border-border bg-card pl-12 pr-4 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
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

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">{t("faqNoResults", { query })}</p>
          <Link
            href="/help/contact"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            {t("contactUs")}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {results.map((item) => {
            const isOpen = openId === item.id
            const question = lang === "ko" ? item.question : item.questionEn
            const answer = lang === "ko" ? item.answerDraft : item.answerDraftEn
            const hasAnswer = item.status === "ready" && answer.trim() !== ""
            return (
              <li key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <button
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {categoryLabel[item.categoryId]}
                    </span>
                    <span className="text-sm font-semibold sm:text-base">{question}</span>
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
                      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{answer}</p>
                    ) : (
                      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                        {t("faqDraftAnswer", { email: CONTACT.email })}
                      </p>
                    )}
                    {item.link && (
                      <Link
                        href={item.link}
                        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-2 hover:underline"
                      >
                        {t("learnMore")}
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
