import type { Metadata } from "next"
import { HelpShell } from "@/components/help/help-shell"
import { PaymentHelpCenter } from "@/components/help/payment-help-center"

export const metadata: Metadata = {
  title: "Payment Help | K-EuroMart",
  description:
    "K-EuroMart payment help: declined cards, double charges, 3D Secure, currency, and refunds.",
}

export default function PaymentHelpPage() {
  return (
    <HelpShell active="payment">
      <PaymentHelpCenter />
    </HelpShell>
  )
}
