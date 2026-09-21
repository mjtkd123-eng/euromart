import { requireStoreOwner } from "@/lib/auth"
import { fetchVendorClaims, sweepOverdueClaims } from "@/lib/claims-server"
import { VendorClaimsView } from "@/components/vendor/vendor-claims-view"

export const dynamic = "force-dynamic"

export default async function OwnerClaimsPage() {
  const profile = await requireStoreOwner("/owner/claims")

  await sweepOverdueClaims()
  const { claims, ledger, penaltyPoints, suspended } = await fetchVendorClaims()

  return (
    <VendorClaimsView
      claims={claims}
      ledger={ledger}
      penaltyPoints={penaltyPoints}
      suspended={suspended}
    />
  )
}
