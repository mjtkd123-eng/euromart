import type { Metadata } from "next"
import { HelpShell } from "@/components/help/help-shell"
import { ContactView } from "@/components/help/contact-view"

export const metadata: Metadata = {
  title: "1:1 문의 · 상담 | K-EuroMart 고객 센터",
  description:
    "K-EuroMart 1:1 문의 접수와 실시간 챗봇·상담원 연결 안내. 주문·배송·환불·계정 문의를 남겨 주세요.",
}

export default function ContactPage() {
  return (
    <HelpShell
      active="contact"
      title="1:1 문의 · 상담"
      titleEn="Contact & Support"
      description="1:1 문의를 남기거나 실시간 챗봇 상담을 이용하세요. 주문번호를 함께 남기면 더 빠르게 도와드립니다."
    >
      <ContactView />
    </HelpShell>
  )
}
