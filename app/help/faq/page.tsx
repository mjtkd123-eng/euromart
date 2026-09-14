import type { Metadata } from "next"
import { Suspense } from "react"
import { HelpShell } from "@/components/help/help-shell"
import { FaqView } from "@/components/help/faq-view"

export const metadata: Metadata = {
  title: "FAQ | K-EuroMart Help Center",
  description:
    "Search K-EuroMart FAQs on delivery times, fresh food, payment methods, and cancellations.",
}

export default function FaqPage() {
  return (
    <HelpShell active="faq">
      <Suspense fallback={<FaqLoading />}>
        <FaqView />
      </Suspense>
    </HelpShell>
  )
}

function FaqLoading() {
  return <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
}
