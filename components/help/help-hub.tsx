"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  HelpCircle,
  Truck,
  CreditCard,
  RotateCcw,
  Megaphone,
  Scale,
  MessageCircle,
  ChevronRight,
  Mail,
  Clock,
  type LucideIcon,
} from "lucide-react"
import { HELP_SECTIONS, CONTACT, sectionLabel, sectionDescription } from "@/lib/help-center"
import { helpText } from "@/lib/help-i18n"
import { useEuromart } from "@/lib/euromart-context"

const ICONS: Record<string, LucideIcon> = {
  "help-circle": HelpCircle,
  truck: Truck,
  "credit-card": CreditCard,
  "rotate-ccw": RotateCcw,
  megaphone: Megaphone,
  scale: Scale,
  "message-circle": MessageCircle,
}

export function HelpHub() {
  const router = useRouter()
  const { lang, t } = useEuromart()
  const [query, setQuery] = useState("")

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/help/faq?q=${encodeURIComponent(q)}` : "/help/faq")
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={submitSearch} className="w-full">
        <label htmlFor="help-search" className="sr-only">
          {t("helpSearchLabel")}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="help-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("helpSearchPlaceholder")}
            className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-28 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("helpSearchButton")}
          </button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {HELP_SECTIONS.map((section) => {
          const Icon = ICONS[section.icon] ?? HelpCircle
          return (
            <Link
              key={section.id}
              href={section.href}
              className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <ChevronRight
                  className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h2 className="text-base font-bold">{sectionLabel(section, lang)}</h2>
                <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {sectionDescription(section, lang)}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/40 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold">{t("helpNoAnswerTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("helpNoAnswerDesc")}</p>
          <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="size-4 text-primary" aria-hidden="true" />
              {CONTACT.email}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-primary" aria-hidden="true" />
              {helpText(CONTACT.hours, lang)}
            </span>
          </div>
        </div>
        <Link
          href="/help/contact"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {t("contactUs")}
        </Link>
      </div>
    </div>
  )
}
