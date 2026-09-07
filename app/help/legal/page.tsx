import type { Metadata } from "next"
import { HelpShell } from "@/components/help/help-shell"
import { LegalView } from "@/components/help/legal-view"

export const metadata: Metadata = {
  title: "Legal & Privacy (GDPR) | K-EuroMart",
  description:
    "K-EuroMart terms of service and privacy policy, including GDPR collection, legal bases, and your rights.",
}

export default function LegalPage() {
  return (
    <HelpShell active="legal">
      <LegalView />
    </HelpShell>
  )
}
