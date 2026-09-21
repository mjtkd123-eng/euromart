import { redirect } from "next/navigation"

export default function LegacyVendorLoginPage() {
  redirect("/owner/login")
}
