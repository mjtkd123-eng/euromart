import type { Metadata } from "next"
import { HelpShell } from "@/components/help/help-shell"
import { ContactView } from "@/components/help/contact-view"

export const metadata: Metadata = {
  title: "Contact | K-EuroMart Help Center",
  description:
    "Send a K-EuroMart 1:1 inquiry or use chatbot support for orders, delivery, refunds, and account questions.",
}

export default function ContactPage() {
  return (
    <HelpShell active="contact">
      <ContactView />
    </HelpShell>
  )
}
