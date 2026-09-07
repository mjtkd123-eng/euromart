import type { Metadata } from "next"
import { HelpShell } from "@/components/help/help-shell"
import { HelpHub } from "@/components/help/help-hub"

export const metadata: Metadata = {
  title: "Help Center | K-EuroMart",
  description:
    "K-EuroMart Help Center. FAQ, shipping, payments, returns (EU consumer rights), legal & privacy (GDPR), notices, and 1:1 support.",
}

export default function HelpCenterPage() {
  return (
    <HelpShell>
      <HelpHub />
    </HelpShell>
  )
}
