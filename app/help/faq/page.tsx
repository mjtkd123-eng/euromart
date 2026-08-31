import type { Metadata } from "next"
import { Suspense } from "react"
import { HelpShell } from "@/components/help/help-shell"
import { FaqView } from "@/components/help/faq-view"

export const metadata: Metadata = {
  title: "자주 묻는 질문 (FAQ) | K-EuroMart 고객 센터",
  description:
    "배송 기간, 신선식품 보상, 결제 수단, 주문 취소·변경 등 K-EuroMart 이용 중 자주 묻는 질문을 키워드로 검색하고 답변을 확인하세요.",
}

export default function FaqPage() {
  return (
    <HelpShell
      active="faq"
      title="자주 묻는 질문"
      titleEn="FAQ"
      description="키워드로 검색하거나 카테고리를 골라 가장 많이 찾는 질문의 답을 확인하세요."
    >
      <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">불러오는 중…</div>}>
        <FaqView />
      </Suspense>
    </HelpShell>
  )
}
