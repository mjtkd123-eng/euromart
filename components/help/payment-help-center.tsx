"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ShoppingBag,
  ArrowLeft,
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
} from "lucide-react"

/** 결제 오류 카테고리 */
type CategoryId = "all" | "declined" | "charge" | "pending" | "promo" | "currency" | "refund"

interface Category {
  id: CategoryId
  label: string
}

const CATEGORIES: Category[] = [
  { id: "all", label: "전체" },
  { id: "declined", label: "결제 거절" },
  { id: "charge", label: "청구 오류" },
  { id: "pending", label: "결제 확인" },
  { id: "promo", label: "프로모션" },
  { id: "currency", label: "통화·환율" },
  { id: "refund", label: "환불" },
]

interface FaqItem {
  id: string
  category: Exclude<CategoryId, "all">
  icon: typeof CreditCard
  question: string
  summary: string
  cause: string
  steps: string[]
  tip?: string
}

/** 유럽 다통화 한인마트 특성을 반영한 결제 오류 도움말 */
const FAQS: FaqItem[] = [
  {
    id: "declined",
    category: "declined",
    icon: CreditCard,
    question: "카드 결제가 거절되었어요 (Payment declined)",
    summary: "카드사에서 승인을 거절해 결제가 완료되지 않았습니다.",
    cause:
      "잔액 부족, 해외/온라인 결제 차단, 카드 한도 초과, 3D Secure 인증 실패, 또는 카드 정보 오입력이 가장 흔한 원인입니다.",
    steps: [
      "카드번호·유효기간·CVC·청구지 우편번호를 다시 확인하세요.",
      "카드사 앱이나 고객센터에서 '해외 결제' 또는 '온라인 결제'가 차단되어 있지 않은지 확인하세요.",
      "결제 중 뜨는 3D Secure(인증 문자/앱 승인) 화면을 끝까지 완료하세요.",
      "다른 카드나 결제 수단으로 다시 시도해 보세요.",
    ],
    tip: "장바구니 내용은 유지되므로, 원인을 해결한 뒤 다시 결제하시면 됩니다.",
  },
  {
    id: "3ds",
    category: "declined",
    icon: ShieldCheck,
    question: "결제 중 인증(3D Secure) 화면에서 멈춰요",
    summary: "유럽 결제 규정(PSD2/SCA)에 따라 추가 본인 인증이 필요합니다.",
    cause:
      "EU 강화된 고객 인증(SCA) 규정상 대부분의 카드 결제에 은행 앱 승인 또는 SMS 인증이 요구됩니다. 팝업 차단이나 앱 미설치 시 인증이 중단됩니다.",
    steps: [
      "브라우저의 팝업 차단을 해제하고 인증 창이 뜨도록 허용하세요.",
      "은행 앱의 푸시 알림 승인 또는 SMS 인증번호 입력을 완료하세요.",
      "인증이 계속 실패하면 은행 앱을 최신 버전으로 업데이트하세요.",
    ],
  },
  {
    id: "double-charge",
    category: "charge",
    icon: Copy,
    question: "결제 금액이 이중으로 청구된 것 같아요",
    summary: "대부분은 실제 청구가 아닌 '임시 승인(가승인)'입니다.",
    cause:
      "결제 재시도 시 카드사에 임시 승인 내역이 여러 건 남을 수 있습니다. 이 가승인은 실제 출금이 아니며 보통 3~7영업일 내 자동 취소됩니다.",
    steps: [
      "주문 내역에서 실제 '결제 완료'된 주문이 1건인지 확인하세요.",
      "카드 명세서의 '가승인/보류(pending)' 항목은 자동 소멸되니 기다려 주세요.",
      "7영업일이 지나도 중복 출금이 유지되면 주문번호와 함께 고객센터로 문의하세요.",
    ],
    tip: "문의 시 카드 명세서 캡처와 주문번호를 함께 보내주시면 확인이 빠릅니다.",
  },
  {
    id: "pending",
    category: "pending",
    icon: RefreshCw,
    question: "주문은 됐는데 결제 확인이 안 돼요",
    summary: "결제 승인과 주문 반영 사이에 짧은 지연이 있을 수 있습니다.",
    cause:
      "은행 승인 응답이 지연되면 주문이 잠시 '결제 확인 중' 상태로 표시됩니다. 보통 몇 분 내 '결제 완료'로 바뀝니다.",
    steps: [
      "페이지를 새로고침하거나 '내 주문'에서 상태를 다시 확인하세요.",
      "결제 완료 이메일이 왔는지 확인하세요 (스팸함 포함).",
      "10분이 지나도 '확인 중'이면 중복 결제 방지를 위해 재결제하지 말고 고객센터로 문의하세요.",
    ],
  },
  {
    id: "out-of-stock",
    category: "pending",
    icon: PackageX,
    question: "재고 부족으로 결제가 취소되었다고 나와요",
    summary: "결제 직전 해당 매장의 상품 재고가 소진되면 주문이 자동 취소됩니다.",
    cause:
      "각 도시 매장은 실시간 재고로 운영됩니다. 결제 처리 순간 재고가 0이 되면 과청구를 막기 위해 주문이 진행되지 않습니다.",
    steps: [
      "장바구니에서 품절된 상품을 빼거나 수량을 줄이세요.",
      "같은 상품이 다른 도시 매장에 있는지 확인하세요.",
      "재입고 알림이 필요하면 상품 페이지에서 문의해 주세요.",
    ],
    tip: "결제가 취소된 경우 실제 청구는 발생하지 않습니다.",
  },
  {
    id: "promo",
    category: "promo",
    icon: TicketPercent,
    question: "프로모션 코드가 적용되지 않아요",
    summary: "코드가 만료됐거나 현재 매장·조건에 맞지 않을 수 있습니다.",
    cause:
      "프로모션은 매장(도시)별·기간별로 다르게 운영됩니다. 최소 주문 금액 미달, 기간 만료, 대소문자 오입력, 또는 해당 매장 미적용이 원인입니다.",
    steps: [
      "코드를 공백 없이 정확히 입력했는지 확인하세요 (예: WELCOME10).",
      "현재 선택한 도시 매장에서 사용 가능한 코드인지 확인하세요.",
      "최소 주문 금액 조건을 충족했는지 장바구니 합계를 확인하세요.",
    ],
  },
  {
    id: "currency",
    category: "currency",
    icon: Coins,
    question: "결제 통화나 환산 금액이 예상과 달라요",
    summary: "결제는 매장의 현지 통화로 청구됩니다.",
    cause:
      "상품 옆 다른 통화 표시는 참고용 환산가입니다. 실제 청구는 매장의 현지 통화(예: 부다페스트=HUF, 파리=EUR)로 이루어지며, 카드사 환전 수수료가 더해질 수 있습니다.",
    steps: [
      "체크아웃 화면에 표시된 '결제 통화'와 최종 금액을 확인하세요.",
      "카드사 환율·해외 이용 수수료로 청구액이 소폭 달라질 수 있습니다.",
      "원하는 통화의 매장을 상단 도시 선택에서 바꿀 수 있습니다.",
    ],
    tip: "무료배송 기준(예: 49유로 이상)도 매장 통화 기준으로 적용됩니다.",
  },
  {
    id: "method",
    category: "declined",
    icon: Wallet,
    question: "사용하려는 결제 수단이 보이지 않아요",
    summary: "지원 결제 수단은 매장 국가에 따라 다를 수 있습니다.",
    cause:
      "국가별로 지원되는 카드/간편결제가 다릅니다. 일부 선불카드나 특정 지역 전용 카드는 온라인 결제가 제한될 수 있습니다.",
    steps: [
      "Visa·Mastercard 등 주요 신용/체크카드로 시도해 보세요.",
      "선불·기프트 카드는 온라인 결제가 막혀 있는 경우가 많습니다.",
      "필요한 결제 수단이 있다면 고객센터로 알려주세요.",
    ],
  },
  {
    id: "refund",
    category: "refund",
    icon: RotateCcw,
    question: "환불은 언제, 어떻게 처리되나요?",
    summary: "승인 취소는 즉시, 실제 환불은 카드사에 따라 며칠 소요됩니다.",
    cause:
      "결제가 완료되기 전 취소된 건은 청구 자체가 발생하지 않습니다. 이미 청구된 주문의 환불은 카드사 정산 주기를 따릅니다.",
    steps: [
      "'내 주문'에서 환불 가능 여부와 상태를 확인하세요.",
      "신선·냉장·냉동 식품은 특성상 개봉 시 환불이 제한될 수 있습니다.",
      "환불 승인 후 카드 계좌 반영까지 보통 3~10영업일이 걸립니다.",
    ],
    tip: "수령일로부터 14일 이내 청약철회가 원칙이며, 신선식품 예외 규정이 적용됩니다.",
  },
]

export function PaymentHelpCenter() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<CategoryId>("all")
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return FAQS.filter((f) => {
      const matchesCategory = category === "all" || f.category === category
      const matchesQuery =
        q === "" ||
        f.question.toLowerCase().includes(q) ||
        f.summary.toLowerCase().includes(q) ||
        f.cause.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [query, category])

  return (
    <div className="min-h-dvh bg-background">
      {/* 상단 바 */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            스토어로 돌아가기
          </Link>
          <span className="flex items-center gap-1.5 text-sm font-black tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShoppingBag className="size-4" aria-hidden="true" />
            </span>
            K<span className="text-primary">EuroMart</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-20">
        {/* 히어로 */}
        <section className="pt-10 pb-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <LifeBuoy className="size-3.5" aria-hidden="true" />
            고객센터 · 결제 도움말
          </span>
          <h1 className="mt-4 text-pretty text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            결제 오류, 여기서 해결하세요
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
            결제 거절, 이중 청구, 통화·환불 등 자주 발생하는 결제 문제의 원인과 해결 방법을 정리했습니다.
          </p>

          {/* 검색 */}
          <div className="mx-auto mt-6 flex max-w-md items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="무엇을 도와드릴까요? (예: 결제 거절, 환불)"
              aria-label="결제 도움말 검색"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </section>

        {/* 카테고리 필터 */}
        <nav aria-label="카테고리" className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => {
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
                {c.label}
              </button>
            )
          })}
        </nav>

        {/* FAQ 아코디언 */}
        <section className="mt-6 flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <Search className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-foreground">검색 결과가 없습니다</p>
              <p className="mt-1 text-xs text-muted-foreground">
                다른 검색어를 입력하거나 아래 고객센터로 문의해 주세요.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const open = openId === item.id
              const Icon = item.icon
              const panelId = `faq-panel-${item.id}`
              const btnId = `faq-btn-${item.id}`
              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
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
                          {item.question}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {item.summary}
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
                          원인
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-foreground">{item.cause}</p>

                        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          해결 방법
                        </p>
                        <ol className="mt-2 flex flex-col gap-2">
                          {item.steps.map((step, i) => (
                            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground">
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                                {i + 1}
                              </span>
                              <span className="min-w-0 flex-1 text-pretty">{step}</span>
                            </li>
                          ))}
                        </ol>

                        {item.tip && (
                          <p className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs leading-relaxed text-foreground">
                            <span className="font-bold text-primary">도움말 </span>
                            {item.tip}
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

        {/* 고객센터 문의 */}
        <section className="mt-10 rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LifeBuoy className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-black text-foreground">문제가 계속되나요?</h2>
          <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            위 방법으로 해결되지 않으면 주문번호와 함께 고객센터로 문의해 주세요. 결제 관련 문의는 우선 처리됩니다.
          </p>

          <div className="mx-auto mt-6 grid max-w-lg gap-3 sm:grid-cols-2">
            <a
              href="mailto:support@k-euromart.com?subject=결제 문의"
              className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 text-left transition-colors hover:border-primary"
            >
              <Mail className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-foreground">이메일 문의</span>
                <span className="block truncate text-xs text-muted-foreground">support@k-euromart.com</span>
              </span>
            </a>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 text-left">
              <Clock className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-foreground">응대 시간</span>
                <span className="block text-xs text-muted-foreground">평일 09:00–18:00 (CET) · 24시간 내 회신</span>
              </span>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          K-EuroMart는 EU 소비자 보호 규정을 준수합니다 · k-euromart.com
        </p>
      </main>
    </div>
  )
}
