import type { Metadata } from "next"
import { HelpShell } from "@/components/help/help-shell"
import { NoticeView } from "@/components/help/notice-view"

export const metadata: Metadata = {
  title: "Notices | K-EuroMart Help Center",
  description: "K-EuroMart events, delivery delays, holidays, and other updates.",
}

export default function NoticePage() {
  return (
    <HelpShell active="notice">
      <NoticeView />
    </HelpShell>
  )
}
