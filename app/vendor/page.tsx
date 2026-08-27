import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getSessionProfile } from "@/lib/auth"
import { getVendorDashboard } from "@/lib/vendor-server"
import { formatPrice } from "@/lib/storesData"
import { DashboardShell, StatStrip } from "@/components/dashboard/dashboard-shell"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { StoreSettingsForm } from "@/components/vendor/store-settings-form"
import { ListingsManager } from "@/components/vendor/listings-manager"
import { PromotionsManager } from "@/components/vendor/promotions-manager"
import { OrdersTable } from "@/components/vendor/orders-table"

export const metadata: Metadata = {
  title: "판매자 대시보드 · K-EuroMart",
  description: "매장 정보, 상품 가격과 재고, 프로모션, 주문을 관리합니다.",
}

export default async function VendorPage() {
  const profile = await getSessionProfile()
  if (!profile) redirect("/auth/login?next=/vendor")
  if (profile.role !== "vendor" && profile.role !== "admin") redirect("/")

  const data = await getVendorDashboard(profile.id)

  if (!data) {
    return (
      <DashboardShell
        eyebrow="판매자"
        title="배정된 매장 없음"
        subtitle="아직 담당 매장이 배정되지 않았습니다. 관리자가 매장을 배정하면 이곳에서 관리할 수 있습니다."
        email={profile.email}
      >
        <p className="rounded-xl border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          관리자에게 매장 배정을 요청해주세요.
        </p>
      </DashboardShell>
    )
  }

  const { store, listings, catalog, promotions, orders, stats } = data

  return (
    <DashboardShell
      eyebrow={`${store.city} · ${store.countryCode}`}
      title={store.storeKo}
      subtitle={`${store.storeEn} — 상품 가격과 재고, 프로모션, 주문 상태를 이곳에서 관리합니다.`}
      email={profile.email}
    >
      <StatStrip
        items={[
          { label: "주문", value: String(stats.orderCount), hint: "최근 50건 기준" },
          { label: "매출", value: formatPrice(stats.revenue, store.currency), hint: "취소 제외" },
          { label: "판매중 상품", value: `${stats.activeListings} / ${listings.length}` },
          {
            label: "재고 부족",
            value: String(stats.lowStock),
            hint: "10개 이하",
            alert: stats.lowStock > 0,
          },
        ]}
      />

      <Tabs defaultValue="listings" className="mt-5">
        <TabsList>
          <TabsTrigger value="listings">상품 · 재고</TabsTrigger>
          <TabsTrigger value="orders">주문</TabsTrigger>
          <TabsTrigger value="promotions">프로모션</TabsTrigger>
          <TabsTrigger value="store">매장 설정</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="pt-4">
          <ListingsManager store={store} listings={listings} catalog={catalog} />
        </TabsContent>
        <TabsContent value="orders" className="pt-4">
          <OrdersTable store={store} orders={orders} />
        </TabsContent>
        <TabsContent value="promotions" className="pt-4">
          <PromotionsManager store={store} promotions={promotions} />
        </TabsContent>
        <TabsContent value="store" className="pt-4">
          <StoreSettingsForm store={store} />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
