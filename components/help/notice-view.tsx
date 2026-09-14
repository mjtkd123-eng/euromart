"use client"

import { useMemo, useState } from "react"
import { Pin, CalendarDays } from "lucide-react"
import { NOTICES, NOTICE_TAG_LABELS, type NoticeTag, helpText } from "@/lib/help-center"
import { useEuromart } from "@/lib/euromart-context"

type Filter = "all" | NoticeTag

const TAG_STYLE: Record<NoticeTag, string> = {
  event: "bg-primary/10 text-primary",
  delay: "bg-destructive/10 text-destructive",
  holiday: "bg-muted text-muted-foreground",
  service: "bg-foreground/10 text-foreground",
}

export function NoticeView() {
  const { lang, t } = useEuromart()
  const [filter, setFilter] = useState<Filter>("all")

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("filterAll") },
    { id: "event", label: helpText(NOTICE_TAG_LABELS.event, lang) },
    { id: "delay", label: helpText(NOTICE_TAG_LABELS.delay, lang) },
    { id: "holiday", label: helpText(NOTICE_TAG_LABELS.holiday, lang) },
    { id: "service", label: helpText(NOTICE_TAG_LABELS.service, lang) },
  ]

  const list = useMemo(() => {
    const filtered = filter === "all" ? NOTICES : NOTICES.filter((n) => n.tag === filter)
    return [...filtered].sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
      return a.date < b.date ? 1 : -1
    })
  }, [filter])

  return (
    <div className="flex flex-col gap-6">
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

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
          {t("noticeEmpty")}
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
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${TAG_STYLE[n.tag]}`}>
                  {helpText(NOTICE_TAG_LABELS[n.tag], lang)}
                </span>
                {n.pinned && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <Pin className="size-3" aria-hidden="true" />
                    {t("noticePinned")}
                  </span>
                )}
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  {n.date}
                </span>
              </div>
              <h2 className="mt-2.5 text-sm font-bold sm:text-base">{helpText(n.title, lang)}</h2>
              <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                {helpText(n.body, lang)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
