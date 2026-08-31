import type { Metadata } from "next"
import { HelpShell } from "@/components/help/help-shell"
import { ReturnsPolicyView } from "@/components/help/returns-policy-view"

export const metadata: Metadata = {
  title: "취소 · 환불 · 교환 정책 | K-EuroMart 고객 센터",
  description:
    "EU 법정 청약철회권(14일)과 신선·냉동식품 예외 조항, 파손·변질 상품 교환·환불 기준을 안내합니다.",
}

export default function ReturnsPage() {
  return (
    <HelpShell
      active="returns"
      title="취소 · 환불 · 교환"
      titleEn="Returns & Refunds"
      description="EU 소비자 권리에 기반한 청약철회권과 신선식품 예외, 파손·변질 상품 보상 기준을 확인하세요."
    >
      <ReturnsPolicyView />
    </HelpShell>
  )
}
