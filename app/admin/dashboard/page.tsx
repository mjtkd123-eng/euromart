import type { Metadata } from "next"
import { requireSuperAdmin } from "@/lib/auth"
import { getAdminDashboard } from "@/lib/admin-server"
import { fetchAdminClaims, sweepOverdueClaims } from "@/lib/claims-server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { DashboardShell, StatStrip } from "@/components/dashboard/dashboard-shell"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RegionsManager } from "@/components/admin/regions-manager"
import { UsersManager } from "@/components/admin/users-manager"
import { ProductsManager } from "@/components/admin/products-manager"
import { FxManager } from "@/components/admin/fx-manager"
import { AdminOrders } from "@/components/admin/admin-orders"
import { AdminClaimsView } from "@/components/admin/admin-claims-view"
import { StoreOnboardingPanel } from "@/components/admin/store-onboarding-panel"

export const metadata: Metadata = {
  title: "플랫폼 관리자 · K-EuroMart",
  description: "입점 심사, 업주 계정 발급, 지역·상품·환율·분쟁을 관리합니다.",
}

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const profile = await requireSuperAdmin("/admin/dashboard")
  const live = isSupabaseConfigured()

  if (!live) {
    return (
      <DashboardShell
        eyebrow="플랫폼 관리자"
        title="K-EuroMart 본부"
        subtitle="온라인 입점 신청을 승인하거나, 오프라인 서류 검토 후 업주 계정을 수동 발급합니다. 일반 회원은 이 경로로 가입할 수 없습니다."
        email={profile.email}
      >
        <Tabs defaultValue="onboarding" className="mt-5">
          <TabsList>
            <TabsTrigger value="onboarding">입점 심사 · 계정 발급</TabsTrigger>
          </TabsList>
          <TabsContent value="onboarding" className="pt-4">
            <StoreOnboardingPanel />
          </TabsContent>
        </Tabs>
      </DashboardShell>
    )
  }

  await sweepOverdueClaims()
  const [{ regions, users, products, categories, fxRates, orders, stats }, claims] = await Promise.all([
    getAdminDashboard(),
    fetchAdminClaims(),
  ])

  const openClaims = claims.filter((c) => c.status === "pending_vendor" || c.status === "mediation").length

  return (
    <DashboardShell
      eyebrow="플랫폼 관리자"
      title="K-EuroMart 본부"
      subtitle="유럽 전 지역의 매장과 업주, 입점 심사, 공통 상품 카탈로그, 환율, 주문, 환불·분쟁을 한곳에서 관리합니다."
      email={profile.email}
    >
      <StatStrip
        items={[
          {
            label: "매장",
            value: `${stats.activeRegions} / ${stats.regionCount}`,
            hint: "공개 / 전체",
          },
          { label: "업주", value: String(stats.vendorCount) },
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

      <Tabs defaultValue="onboarding" className="mt-5">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="onboarding">입점 심사 · 계정 발급</TabsTrigger>
          <TabsTrigger value="regions">지역 · 매장</TabsTrigger>
          <TabsTrigger value="users">사용자</TabsTrigger>
          <TabsTrigger value="products">마스터 상품</TabsTrigger>
          <TabsTrigger value="fx">환율</TabsTrigger>
          <TabsTrigger value="orders">전체 주문</TabsTrigger>
          <TabsTrigger value="claims">환불 · 분쟁</TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding" className="pt-4">
          <StoreOnboardingPanel />
        </TabsContent>
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
