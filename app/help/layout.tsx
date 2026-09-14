import { EuromartProvider } from "@/lib/euromart-context"
import { fetchRegions } from "@/lib/euromart-server"
import { getSessionProfile } from "@/lib/auth"
import { getFxRateMap } from "@/lib/fx"

export default async function HelpLayout({ children }: { children: React.ReactNode }) {
  const [regions, profile, fxRates] = await Promise.all([
    fetchRegions(),
    getSessionProfile(),
    getFxRateMap(),
  ])

  const user = profile
    ? { id: profile.id, email: profile.email, fullName: profile.fullName, role: profile.role }
    : null

  return (
    <EuromartProvider initialRegions={regions} user={user} fxRates={fxRates}>
      {children}
    </EuromartProvider>
  )
}
