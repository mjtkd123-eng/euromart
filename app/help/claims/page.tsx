import type { Metadata } from "next"
import { HelpShell } from "@/components/help/help-shell"
import { ClaimsPolicyView } from "@/components/help/claims-policy-view"

export const metadata: Metadata = {
  title: "Claims & CS routing | K-EuroMart Help Center",
  description:
    "How K-EuroMart routes micro, medium, and high claims — 2-hour merchant SLA, platform Legal, insurance, and GDPR retention.",
}

export default function ClaimsPolicyPage() {
  return (
    <HelpShell active="claims">
      <ClaimsPolicyView />
    </HelpShell>
  )
}
