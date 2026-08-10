import { EuromartApp } from "@/components/euromart/euromart-app"
import { fetchRegions } from "@/lib/euromart-server"
import { getSessionProfile } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function Page() {
  const [regions, profile] = await Promise.all([fetchRegions(), getSessionProfile()])

  const user = profile
    ? { id: profile.id, email: profile.email, fullName: profile.fullName, role: profile.role }
    : null

  return <EuromartApp regions={regions} user={user} />
}
