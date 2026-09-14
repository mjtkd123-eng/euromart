import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getSessionProfile } from "@/lib/auth"
import { getAdminDashboard } from "@/lib/admin-server"
import { fetchAdminClaims, sweepOverdueClaims } from "@/lib/claims-server"
import { DashboardShell, StatStrip } from "@/components/dashboard/dashboard-shell"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RegionsManager } from "@/components/admin/regions-manager"
import { UsersManager } from "@/components/admin/users-manager"
import { ProductsManager } from "@/components/admin/products-manager"
import { FxManager } from "@/components/admin/fx-manager"
import { AdminOrders } from "@/components/admin/admin-orders"
import { AdminClaimsView } from "@/components/admin/admin-claims-view"

export const metadata: Metadata = {
  title: "관리자 대시보드 · K-EuroMart",
  description: "지역과 판매자, 마스터 상품, 환율, 전체 주문, 환불·분쟁을 관리합니다.",
}

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const profile = await getSessionProfile()
  if (!profile) redirect("/auth/login?next=/admin")
  if (profile.role !== "admin") redirect("/")

  // 기한이 지난 환불·분쟁 건을 먼저 정리한 뒤 목록을 불러옵니다.
  await sweepOverdueClaims()
  const [{ regions, users, products, categories, fxRates, orders, stats }, claims] = await Promise.all([
    getAdminDashboard(),
    fetchAdminClaims(),
  ])

  const openClaims = claims.filter((c) => c.status === "pending_vendor" || c.status === "mediation").length

  return (
    <DashboardShell
      eyebrow="관리자"
      title="K-EuroMart 본부"
      subtitle="유럽 전 지역의 매장과 판매자, 공통 상품 카탈로그, 환율, 주문, 환불·분쟁을 한곳에서 관리합니다."
      email={profile.email}
    >
      <StatStrip
        items={[
          {
            label: "매장",
            value: `${stats.activeRegions} / ${stats.regionCount}`,
            hint: "공개 / 전체",
          },
          { label: "판매자", value: String(stats.vendorCount) },
          {
            label: "담당자 미지정",
            value: String(stats.unassignedRegions),
            alert: stats.unassignedRegions > 0,
          },
          {
            label: "처리 대기 분쟁",
            value: String(openClaims),
            hint: "환불·분쟁",
            alert: openClaims > 0,
          },
        ]}
      />

      <Tabs defaultValue="regions" className="mt-5">
        <TabsList>
          <TabsTrigger value="regions">지역 · 매장</TabsTrigger>
          <TabsTrigger value="users">사용자</TabsTrigger>
          <TabsTrigger value="products">마스터 상품</TabsTrigger>
          <TabsTrigger value="fx">환율</TabsTrigger>
          <TabsTrigger value="orders">전체 주문</TabsTrigger>
          <TabsTrigger value="claims">환불 · 분쟁</TabsTrigger>
        </TabsList>

        <TabsContent value="regions" className="pt-4">
          <RegionsManager regions={regions} users={users} />
        </TabsContent>
        <TabsContent value="users" className="pt-4">
          <UsersManager users={users} selfId={profile.id} />
        </TabsContent>
        <TabsContent value="products" className="pt-4">
          <ProductsManager products={products} categories={categories} />
        </TabsContent>
        <TabsContent value="fx" className="pt-4">
          <FxManager rates={fxRates} />
        </TabsContent>
        <TabsContent value="orders" className="pt-4">
          <AdminOrders orders={orders} />
        </TabsContent>
        <TabsContent value="claims" className="pt-4">
          <AdminClaimsView claims={claims} />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
