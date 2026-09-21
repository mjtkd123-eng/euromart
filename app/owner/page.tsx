import type { Metadata } from "next"
import { getSessionProfile } from "@/lib/auth"
import { isOwnerRole } from "@/lib/roles"
import { OwnerLanding } from "@/components/owner/owner-landing"

export const metadata: Metadata = {
  title: "업주 입점 안내 · K-EuroMart",
  description: "유럽 K-푸드 판로, 실시간 매장 대시보드, 정산 리포트를 제공하는 K-EuroMart 파트너 입점 안내.",
}

export const dynamic = "force-dynamic"

export default async function OwnerHomePage() {
  const profile = await getSessionProfile()
  const dashboardHref =
    profile && isOwnerRole(profile.role) && profile.accountStatus === "active"
      ? "/owner/dashboard"
      : null

  return <OwnerLanding dashboardHref={dashboardHref} />
}
