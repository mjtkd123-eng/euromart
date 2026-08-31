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
import { HELP_SECTIONS, type HelpSectionId } from "@/lib/help-center"

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
  /** 페이지 대표 제목 */
  title: string
  /** 영문 병기 */
  titleEn?: string
  /** 제목 아래 한 줄 설명 */
  description?: string
  children: ReactNode
}

export function HelpShell({ active, title, titleEn, description, children }: HelpShellProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      {/* 상단 바 */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2" aria-label="K-EuroMart 홈으로">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShoppingBag className="size-4" aria-hidden="true" />
            </span>
            <span className="text-base font-black tracking-tight">
              K<span className="text-primary">EuroMart</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            쇼핑 계속하기
          </Link>
        </div>

        {/* 섹션 내비게이션 — 모바일에서 가로 스크롤 */}
        <nav aria-label="고객 센터 메뉴" className="border-t border-border">
          <div className="mx-auto max-w-5xl overflow-x-auto px-2">
            <ul className="flex min-w-max gap-1 py-2">
              {HELP_SECTIONS.map((section) => {
                const Icon = ICONS[section.icon] ?? HelpCircle
                const isActive = active === section.id || pathname === section.href
                return (
                  <li key={section.id}>
                    <Link
                      href={section.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {section.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>
      </header>

      {/* 페이지 헤더 */}
      <div className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <h1 className="text-balance text-2xl font-black tracking-tight sm:text-3xl">
            {title}
            {titleEn && <span className="ml-2 text-lg font-semibold text-muted-foreground">{titleEn}</span>}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* 본문 */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">{children}</main>
    </div>
  )
}
