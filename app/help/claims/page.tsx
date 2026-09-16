import { redirect } from "next/navigation"

/** Former public Help Center URL — claims routing is staff-only. */
export default function HelpClaimsRedirect() {
  redirect("/ops/claims")
}
