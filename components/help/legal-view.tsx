"use client"

import { useState } from "react"
import { FileText, ShieldCheck } from "lucide-react"
import { LEGAL_DOCS, type LegalDoc, helpText } from "@/lib/help-center"
import { useEuromart } from "@/lib/euromart-context"

const TAB_ICONS = { terms: FileText, privacy: ShieldCheck } as const

export function LegalView() {
  const { lang, t } = useEuromart()
  const [activeId, setActiveId] = useState<LegalDoc["id"]>("terms")
  const active = LEGAL_DOCS.find((d) => d.id === activeId) ?? LEGAL_DOCS[0]

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label={t("legalTablist")} className="flex gap-2">
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
              <span>{helpText(doc.title, lang)}</span>
            </button>
          )
        })}
      </div>

      <article className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <header className="border-b border-border pb-5">
          <h2 className="text-xl font-black">{helpText(active.title, lang)}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{helpText(active.updated, lang)}</p>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
            {helpText(active.intro, lang)}
          </p>
        </header>

        <div className="mt-6 flex flex-col gap-6">
          {active.sections.map((s, i) => (
            <section key={i}>
              <h3 className="text-sm font-bold text-foreground sm:text-base">{helpText(s.heading, lang)}</h3>
              <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                {helpText(s.body, lang)}
              </p>
              {s.points && (
                <ul className="mt-2.5 flex flex-col gap-1.5">
                  {s.points.map((p, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      {helpText(p, lang)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>

      <p className="text-xs leading-relaxed text-muted-foreground">{t("legalDraftNote")}</p>
    </div>
  )
}
