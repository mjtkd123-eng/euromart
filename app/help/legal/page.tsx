import type { Metadata } from "next"
import { HelpShell } from "@/components/help/help-shell"
import { LegalView } from "@/components/help/legal-view"

export const metadata: Metadata = {
  title: "약관 · 개인정보 처리방침 (GDPR) | K-EuroMart",
  description:
    "K-EuroMart 이용약관과 개인정보 처리방침. EU GDPR에 따른 개인정보 수집·이용 항목, 법적 근거, 정보주체의 권리를 안내합니다.",
}

export default function LegalPage() {
  return (
    <HelpShell
      active="legal"
      title="약관 · 개인정보"
      titleEn="Legal & Compliance"
      description="이용약관과 개인정보 처리방침을 확인하세요. 개인정보 처리는 EU GDPR을 준수합니다."
    >
      <LegalView />
    </HelpShell>
  )
}
