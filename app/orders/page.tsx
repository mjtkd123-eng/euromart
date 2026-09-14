import { redirect } from "next/navigation"
import { getSessionProfile } from "@/lib/auth"
import { fetchCustomerOrders, sweepOverdueClaims } from "@/lib/claims-server"
import { OrdersView } from "@/components/orders/orders-view"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  const profile = await getSessionProfile()
  if (!profile) redirect("/auth/login")

  // 마감 지난 판매자 미응답 건 자동 환불 반영 후 조회
  await sweepOverdueClaims()
  const { orders, claims } = await fetchCustomerOrders()

  return <OrdersView orders={orders} claims={claims} userId={profile.id} />
}
