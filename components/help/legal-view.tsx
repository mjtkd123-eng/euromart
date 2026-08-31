"use client"

import { useState } from "react"
import { FileText, ShieldCheck } from "lucide-react"
import { LEGAL_DOCS, type LegalDoc } from "@/lib/help-center"

const TAB_ICONS = { terms: FileText, privacy: ShieldCheck } as const

export function LegalView() {
  const [activeId, setActiveId] = useState<LegalDoc["id"]>("terms")
  const active = LEGAL_DOCS.find((d) => d.id === activeId) ?? LEGAL_DOCS[0]

  return (
    <div className="flex flex-col gap-6">
      {/* 탭 */}
      <div role="tablist" aria-label="법적 고지 문서" className="flex gap-2">
        {LEGAL_DOCS.map((doc) => {
          const Icon = TAB_ICONS[doc.id]
          const isActive = doc.id === activeId
          return (
            <button
              key={doc.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(doc.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>
                {doc.title}
                <span className="ml-1.5 hidden text-xs font-normal opacity-80 sm:inline">{doc.titleEn}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* 문서 본문 */}
      <article className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <header className="border-b border-border pb-5">
          <h2 className="text-xl font-black">
            {active.title}
            <span className="ml-2 text-sm font-semibold text-muted-foreground">{active.titleEn}</span>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{active.updated}</p>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">{active.intro}</p>
        </header>

        <div className="mt-6 flex flex-col gap-6">
          {active.sections.map((s, i) => (
            <section key={i}>
              <h3 className="text-sm font-bold text-foreground sm:text-base">{s.heading}</h3>
              <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              {s.points && (
                <ul className="mt-2.5 flex flex-col gap-1.5">
                  {s.points.map((p, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>

      <p className="text-xs leading-relaxed text-muted-foreground">
        본 문서는 초안이며, 실제 서비스 운영 정책과 관련 법령에 따라 확정·개정됩니다. 법적 효력이 필요한 최종본은
        운영 정책 확정 후 게시됩니다.
      </p>
    </div>
  )
}
