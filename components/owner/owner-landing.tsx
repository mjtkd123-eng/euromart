"use client"

import { useState } from "react"
import Link from "next/link"
import {
  BarChart3,
  Globe2,
  LayoutDashboard,
  Megaphone,
  ShoppingBag,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { OwnerApplyForm } from "@/components/owner/owner-apply-form"
import { OwnerLoginFields } from "@/components/owner/owner-login-fields"

const BENEFITS = [
  {
    icon: Globe2,
    title: "유럽 전역 판로",
    body: "K-푸드와 한국 제품을 비엔나·베를린·파리 등 유럽 주요 도시 고객에게 바로 올립니다.",
  },
  {
    icon: LayoutDashboard,
    title: "실시간 매장 운영",
    body: "주문·재고·세일 이벤트를 업주 전용 대시보드에서 자기 매장만 독립적으로 관리합니다.",
  },
  {
    icon: Wallet,
    title: "정기 정산 · 판매 리포트",
    body: "매출과 정산 내역을 투명하게 확인하고, 본부 보고 없이 매장 실적을 추적합니다.",
  },
  {
    icon: Megaphone,
    title: "매장 프로모션 직접 운영",
    body: "주말 세일, 할인 코드, 공지 배너를 점주가 직접 켜고 끌 수 있습니다.",
  },
]

export function OwnerLanding({
  dashboardHref,
}: {
  dashboardHref?: string | null
}) {
  const [loginOpen, setLoginOpen] = useState(false)
  const [applyOpen, setApplyOpen] = useState(false)

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5" aria-label="K-EuroMart">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShoppingBag className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-black tracking-tight">
              K<span className="text-primary">EuroMart</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            쇼핑몰 홈
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-8 sm:pt-12">
          <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-card to-brand-orange/10 px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              Partner
            </p>
            <h1 className="mt-4 max-w-2xl break-keep text-balance text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
              K-EuroMart 입점 안내 및 혜택 소개
            </h1>
            <p className="mt-4 max-w-xl break-keep text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              유럽 한인·현지 고객에게 한국 식료품을 전하는 파트너 마트입니다. 승인이 끝난 점주는 자기 매장
              대시보드만 열고, 신규 입점은 사업자 정보를 제출한 뒤 본부 심사를 기다립니다.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {dashboardHref ? (
                <Button asChild className="h-12 rounded-full px-6 text-base">
                  <Link href={dashboardHref}>내 매장 대시보드</Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-full px-6 text-base"
                  onClick={() => setLoginOpen(true)}
                >
                  업주 로그인
                </Button>
              )}
              <Button
                type="button"
                className="h-12 rounded-full px-6 text-base"
                onClick={() => setApplyOpen(true)}
              >
                입점 신청서 제출하기
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <h2 className="text-lg font-black text-foreground sm:text-xl">입점 파트너에게 드리는 것</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {BENEFITS.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <p className="mt-4 font-bold text-foreground">{item.title}</p>
                <p className="mt-1.5 break-keep text-pretty text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
          <p className="text-xs text-muted-foreground">K-EuroMart 파트너 · k-euromart.com</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <Link href="/owner" className="underline-offset-2 hover:text-primary hover:underline">
              업주 로그인/신청
            </Link>
            <Link href="/admin/login" className="underline-offset-2 hover:text-primary hover:underline">
              플랫폼 관리자
            </Link>
          </p>
        </div>
      </footer>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <span className="mb-1 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BarChart3 className="size-5" aria-hidden="true" />
            </span>
            <DialogTitle className="text-xl font-black">업주 로그인</DialogTitle>
            <DialogDescription className="break-keep text-pretty">
              본부 승인이 끝난 계정만 매장 대시보드에 들어갈 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <OwnerLoginFields />
        </DialogContent>
      </Dialog>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">입점 신청서</DialogTitle>
            <DialogDescription className="break-keep text-pretty">
              사업자명, 대표자 연락처, 매장 정보를 제출하면 승인 전까지 pending 상태입니다.
            </DialogDescription>
          </DialogHeader>
          <OwnerApplyForm submitLabel="입점 신청서 제출하기" />
        </DialogContent>
      </Dialog>
    </div>
  )
}
