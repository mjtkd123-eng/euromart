import type { Metadata } from "next"
import { HelpShell } from "@/components/help/help-shell"
import { ShippingGuide } from "@/components/help/shipping-guide"

export const metadata: Metadata = {
  title: "배송 안내 | K-EuroMart 고객 센터",
  description:
    "헝가리·독일·프랑스·오스트리아·체코 국가별 배송 기간과 택배사, 무료배송 기준(예: 15,000 Ft 이상)을 안내합니다.",
}

export default function ShippingPage() {
  return (
    <HelpShell
      active="shipping"
      title="배송 안내"
      titleEn="Shipping Guide"
      description="국가별 배송 기간과 배송 파트너, 무료배송 기준을 확인하세요. 신선식품은 콜드체인으로 당일 배달을 우선합니다."
    >
      <ShippingGuide />
    </HelpShell>
  )
}
