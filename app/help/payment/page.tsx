import type { Metadata } from "next"
import { PaymentHelpCenter } from "@/components/help/payment-help-center"

export const metadata: Metadata = {
  title: "결제 도움말 센터 | K-EuroMart",
  description:
    "K-EuroMart 결제 오류 도움말. 카드 결제 거절, 이중 청구, 3D Secure 인증, 통화·환율, 환불 등 자주 발생하는 결제 문제의 원인과 해결 방법을 안내합니다.",
}

export default function PaymentHelpPage() {
  return <PaymentHelpCenter />
}
