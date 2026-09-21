import { redirect } from "next/navigation"

export default function LegacyVendorPage() {
  redirect("/owner/dashboard")
}
