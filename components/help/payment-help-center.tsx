"use client"

import { useMemo, useState } from "react"
import {
  Search,
  CreditCard,
  RefreshCw,
  Copy,
  PackageX,
  TicketPercent,
  Coins,
  Wallet,
  RotateCcw,
  ChevronDown,
  Mail,
  Clock,
  ShieldCheck,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react"
import { PAYMENT_FAQS, type PaymentFaqCategoryId } from "@/lib/help-center"
import { helpText } from "@/lib/help-i18n"
import { useEuromart } from "@/lib/euromart-context"
import type { TransKey } from "@/lib/i18n"

type CategoryId = "all" | PaymentFaqCategoryId

const ICONS: Record<string, LucideIcon> = {
  declined: CreditCard,
  "3ds": ShieldCheck,
  "double-charge": Copy,
  pending: RefreshCw,
  "out-of-stock": PackageX,
  promo: TicketPercent,
  currency: Coins,
  method: Wallet,
  refund: RotateCcw,
}

const CATEGORY_KEYS: { id: CategoryId; key: TransKey }[] = [
  { id: "all", key: "filterAll" },
  { id: "declined", key: "paymentCatDeclined" },
  { id: "charge", key: "paymentCatCharge" },
  { id: "pending", key: "paymentCatPending" },
  { id: "promo", key: "paymentCatPromo" },
  { id: "currency", key: "paymentCatCurrency" },
  { id: "refund", key: "paymentCatRefund" },
]

export function PaymentHelpCenter() {
  const { lang, t } = useEuromart()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<CategoryId>("all")
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PAYMENT_FAQS.filter((f) => {
      const matchesCategory = category === "all" || f.category === category
      const question = helpText(f.question, lang)
      const summary = helpText(f.summary, lang)
      const cause = helpText(f.cause, lang)
      const matchesQuery =
        q === "" ||
        question.toLowerCase().includes(q) ||
        summary.toLowerCase().includes(q) ||
        cause.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [query, category, lang])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-ring">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("paymentHelpSearch")}
          aria-label={t("paymentHelpSearchLabel")}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <nav aria-label={t("helpMenu")} className="flex flex-wrap gap-2">
        {CATEGORY_KEYS.map((c) => {
          const active = c.id === category
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              aria-pressed={active}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {t(c.key)}
            </button>
          )
        })}
      </nav>

      <section className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <Search className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-foreground">{t("paymentNoResults")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("paymentNoResultsHint")}</p>
          </div>
        ) : (
          filtered.map((item) => {
            const open = openId === item.id
            const Icon = ICONS[item.id] ?? CreditCard
            const panelId = `faq-panel-${item.id}`
            const btnId = `faq-btn-${item.id}`
            return (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <h2>
                  <button
                    id={btnId}
                    onClick={() => setOpenId(open ? null : item.id)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-pretty text-sm font-bold text-foreground">
                        {helpText(item.question, lang)}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {helpText(item.summary, lang)}
                      </span>
                    </span>
                    <ChevronDown
                      className={`size-5 shrink-0 text-muted-foreground transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h2>

                {open && (
                  <div id={panelId} role="region" aria-labelledby={btnId} className="px-4 pb-5">
                    <div className="rounded-xl bg-muted/50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {t("paymentCause")}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-foreground">{helpText(item.cause, lang)}</p>

                      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {t("paymentSteps")}
                      </p>
                      <ol className="mt-2 flex flex-col gap-2">
                        {item.steps.map((step, i) => (
                          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                              {i + 1}
                            </span>
                            <span className="min-w-0 flex-1 text-pretty">{helpText(step, lang)}</span>
                          </li>
                        ))}
                      </ol>

                      {item.tip && (
                        <p className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs leading-relaxed text-foreground">
                          <span className="font-bold text-primary">{t("paymentTip")} </span>
                          {helpText(item.tip, lang)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LifeBuoy className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-black text-foreground">{t("paymentStillStuck")}</h2>
        <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          {t("paymentStillStuckDesc")}
        </p>

        <div className="mx-auto mt-6 grid max-w-lg gap-3 sm:grid-cols-2">
          <a
            href={`mailto:support@k-euromart.com?subject=${encodeURIComponent(t("paymentMailSubject"))}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 text-left transition-colors hover:border-primary"
          >
            <Mail className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-foreground">{t("emailInquiry")}</span>
              <span className="block truncate text-xs text-muted-foreground">support@k-euromart.com</span>
            </span>
          </a>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 text-left">
            <Clock className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-foreground">{t("supportHoursLabel")}</span>
              <span className="block text-xs text-muted-foreground">{t("paymentHoursValue")}</span>
            </span>
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">{t("paymentEuNote")}</p>
    </div>
  )
}
