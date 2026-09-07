import type { Metadata } from "next"
import { HelpShell } from "@/components/help/help-shell"
import { ReturnsPolicyView } from "@/components/help/returns-policy-view"

export const metadata: Metadata = {
  title: "Returns & Refunds | K-EuroMart Help Center",
  description:
    "EU 14-day withdrawal rights, fresh-food exceptions, and how we handle damaged or spoiled items.",
}

export default function ReturnsPage() {
  return (
    <HelpShell active="returns">
      <ReturnsPolicyView />
    </HelpShell>
  )
}
