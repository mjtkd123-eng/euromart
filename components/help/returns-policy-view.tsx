"use client"

import Link from "next/link"
import { ShieldCheck, AlertTriangle, MessageCircle } from "lucide-react"
import { RETURNS_POLICY, CONTACT, helpText } from "@/lib/help-center"
import { useEuromart } from "@/lib/euromart-context"

export function ReturnsPolicyView() {
  const { lang, t } = useEuromart()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-muted-foreground">{t("returnsBanner")}</p>
      </div>

      <div className="flex flex-col gap-4">
        {RETURNS_POLICY.map((block, i) => (
          <section
            key={i}
            className={`rounded-2xl border p-5 ${
              block.emphasis ? "border-primary/40 bg-primary/5" : "border-border bg-card"
            }`}
          >
            <h2 className="flex items-center gap-2 text-base font-bold">
              {block.emphasis && (
                <AlertTriangle className="size-4 shrink-0 text-primary" aria-hidden="true" />
              )}
              {helpText(block.heading, lang)}
            </h2>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              {helpText(block.body, lang)}
            </p>
            {block.points && (
              <ul className="mt-3 flex flex-col gap-2">
                {block.points.map((p, j) => (
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

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/40 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold">{t("returnsCtaTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("returnsCtaDesc")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("customerCenter")} {CONTACT.email} · {helpText(CONTACT.hours, lang)}
          </p>
        </div>
        <Link
          href="/help/contact"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {t("returnsCtaButton")}
        </Link>
      </div>
    </div>
  )
}
