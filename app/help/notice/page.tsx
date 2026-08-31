import type { Metadata } from "next"
import { HelpShell } from "@/components/help/help-shell"
import { NoticeView } from "@/components/help/notice-view"

export const metadata: Metadata = {
  title: "공지사항 | K-EuroMart 고객 센터",
  description: "K-EuroMart 이벤트, 배송 지연, 휴무일 등 최신 소식을 확인하세요.",
}

export default function NoticePage() {
  return (
    <HelpShell
      active="notice"
      title="공지사항"
      titleEn="Notice"
      description="이벤트, 배송 지연, 휴무일 등 K-EuroMart의 최신 소식을 안내합니다."
    >
      <NoticeView />
    </HelpShell>
  )
}
