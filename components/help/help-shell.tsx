"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ShoppingBag,
  ArrowLeft,
  HelpCircle,
  Truck,
  CreditCard,
  RotateCcw,
  Megaphone,
  Scale,
  MessageCircle,
  type LucideIcon,
} from "lucide-react"
import { HELP_SECTIONS, sectionLabel, type HelpSectionId } from "@/lib/help-center"
import { useEuromart } from "@/lib/euromart-context"
import { LanguageSelector } from "@/components/euromart/language-selector"

const ICONS: Record<string, LucideIcon> = {
  "help-circle": HelpCircle,
  truck: Truck,
  "credit-card": CreditCard,
  "rotate-ccw": RotateCcw,
  megaphone: Megaphone,
  scale: Scale,
  "message-circle": MessageCircle,
}

interface HelpShellProps {
  /** 현재 섹션 (내비게이션 강조용). 허브에서는 생략 */
  active?: HelpSectionId
  children: ReactNode
}

export function HelpShell({ active, children }: HelpShellProps) {
  const pathname = usePathname()
  const { lang, t } = useEuromart()
  const section = active ? HELP_SECTIONS.find((s) => s.id === active) : undefined
  const title = section ? sectionLabel(section, lang) : t("helpHubTitle")
  const description = section ? t(section.pageDescKey) : t("helpHubDesc")

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2" aria-label={t("homeAria")}>
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShoppingBag className="size-4" aria-hidden="true" />
            </span>
            <span className="text-base font-black tracking-tight">
              K<span className="text-primary">EuroMart</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              {t("continueShopping")}
            </Link>
          </div>
        </div>

        <nav aria-label={t("helpMenu")} className="border-t border-border">
          <div className="mx-auto max-w-5xl overflow-x-auto px-2">
            <ul className="flex min-w-max gap-1 py-2">
              {HELP_SECTIONS.map((item) => {
                const Icon = ICONS[item.icon] ?? HelpCircle
                const isActive = active === item.id || pathname === item.href
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {sectionLabel(item, lang)}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>
      </header>

      <div className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <h1 className="text-balance text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">{children}</main>
    </div>
  )
}
