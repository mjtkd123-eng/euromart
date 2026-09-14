import type { Metadata } from "next"
import { HelpShell } from "@/components/help/help-shell"
import { ShippingGuide } from "@/components/help/shipping-guide"

export const metadata: Metadata = {
  title: "Shipping | K-EuroMart Help Center",
  description:
    "Delivery times and carriers for Hungary, Germany, France, Austria, and Czechia, plus free-shipping thresholds.",
}

export default function ShippingPage() {
  return (
    <HelpShell active="shipping">
      <ShippingGuide />
    </HelpShell>
  )
}
