import { redirect } from "next/navigation"
import { getSessionProfile } from "@/lib/auth"
import { fetchAdminClaims, sweepOverdueClaims } from "@/lib/claims-server"
import { AdminClaimsView } from "@/components/admin/admin-claims-view"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const profile = await getSessionProfile()
  if (!profile) redirect("/auth/login")
  if (profile.role !== "admin") redirect("/")

  await sweepOverdueClaims()
  const claims = await fetchAdminClaims()

  return <AdminClaimsView claims={claims} />
}
