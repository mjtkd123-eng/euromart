"use client"

import { useMemo, useState } from "react"
import { Pin, CalendarDays } from "lucide-react"
import { NOTICES, NOTICE_TAG_LABELS, type NoticeTag } from "@/lib/help-center"

type Filter = "all" | NoticeTag

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "event", label: NOTICE_TAG_LABELS.event },
  { id: "delay", label: NOTICE_TAG_LABELS.delay },
  { id: "holiday", label: NOTICE_TAG_LABELS.holiday },
  { id: "service", label: NOTICE_TAG_LABELS.service },
]

/** 태그별 배지 색상 */
const TAG_STYLE: Record<NoticeTag, string> = {
  event: "bg-primary/10 text-primary",
  delay: "bg-destructive/10 text-destructive",
  holiday: "bg-muted text-muted-foreground",
  service: "bg-foreground/10 text-foreground",
}

export function NoticeView() {
  const [filter, setFilter] = useState<Filter>("all")

  const list = useMemo(() => {
    const filtered = filter === "all" ? NOTICES : NOTICES.filter((n) => n.tag === filter)
    // 고정 공지를 먼저, 그다음 최신순
    return [...filtered].sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
      return a.date < b.date ? 1 : -1
    })
  }, [filter])

  return (
    <div className="flex flex-col gap-6">
      {/* 필터 */}
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

      {/* 공지 목록 */}
      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
          해당 분류의 공지가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((n) => (
            <li
              key={n.id}
              className={`rounded-2xl border bg-card p-5 ${
                n.pinned ? "border-primary/40" : "border-border"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${TAG_STYLE[n.tag]}`}
                >
                  {NOTICE_TAG_LABELS[n.tag]}
                </span>
                {n.pinned && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <Pin className="size-3" aria-hidden="true" />
                    고정
                  </span>
                )}
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  {n.date}
                </span>
              </div>
              <h2 className="mt-2.5 text-sm font-bold sm:text-base">{n.title}</h2>
              <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
