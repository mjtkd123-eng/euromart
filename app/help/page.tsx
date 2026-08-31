import type { Metadata } from "next"
import { HelpShell } from "@/components/help/help-shell"
import { HelpHub } from "@/components/help/help-hub"

export const metadata: Metadata = {
  title: "고객 센터 | K-EuroMart",
  description:
    "K-EuroMart 통합 고객 센터. 자주 묻는 질문, 배송 안내, 결제, 취소·환불·교환(EU 소비자 권리), 약관·개인정보(GDPR), 공지사항, 1:1 문의를 한곳에서 확인하세요.",
}

export default function HelpCenterPage() {
  return (
    <HelpShell
      title="무엇을 도와드릴까요?"
      description="배송, 결제, 환불, 개인정보까지 — K-EuroMart 이용에 필요한 모든 안내를 한곳에 모았습니다."
    >
      <HelpHub />
    </HelpShell>
  )
}
