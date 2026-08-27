import { redirect } from "next/navigation"
import { Store } from "lucide-react"
import { getSessionProfile } from "@/lib/auth"
import { fetchVendorDashboard } from "@/lib/vendor-server"
import { createClient } from "@/lib/supabase/server"
import { formatPrice } from "@/lib/storesData"
import { DashboardShell, StatCard } from "@/components/dashboard/dashboard-shell"
import { StoreSettingsForm } from "@/components/dashboard/vendor/store-settings-form"
import { InventoryTable, type CatalogOption } from "@/components/dashboard/vendor/inventory-table"
import { PromotionsManager } from "@/components/dashboard/vendor/promotions-manager"
import { OrdersList } from "@/components/dashboard/orders-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata = {
  title: "업주 대시보드 · K-EuroMart",
}

export default async function VendorPage() {
  const profile = await getSessionProfile()
  if (!profile) redirect("/auth/login?next=/vendor")
  if (profile.role !== "vendor" && profile.role !== "admin") redirect("/")

  const data = await fetchVendorDashboard(profile.id)

  if (!data) {
    return (
      <DashboardShell
        kicker="업주 대시보드"
        title="배정된 매장이 없습니다"
        subtitle="관리자가 매장을 배정하면 이곳에서 상품과 주문을 관리할 수 있습니다."
        email={profile.email}
      >
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-background px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Store className="size-6 text-muted-foreground" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-foreground">매장 배정 대기 중</p>
          <p className="max-w-sm text-sm text-muted-foreground text-pretty">
            관리자에게 계정({profile.email})으로 매장 배정을 요청하세요.
          </p>
        </div>
      </DashboardShell>
    )
  }

  const supabase = await createClient()
  const { data: catalogRows } = await supabase.from("products").select("id, name_ko, unit").order("name_ko")
  const catalog: CatalogOption[] = (catalogRows ?? []).map((p) => ({
    id: p.id,
    nameKo: p.name_ko,
    unit: p.unit ?? "",
  }))

  const { region, products, promotions, orders, stats } = data

  return (
    <DashboardShell
      kicker="업주 대시보드"
      title={region.storeKo}
      subtitle={`${region.city}, ${region.country} · 통화 ${region.currency.code}`}
      email={profile.email}
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="누적 매출"
          value={formatPrice(stats.revenue, region.currency)}
          hint={`최근 ${stats.orderCount}건 기준`}
        />
        <StatCard label="주문 수" value={String(stats.orderCount)} hint="최근 50건" />
        <StatCard
          label="재고 부족"
          value={String(stats.lowStock)}
          hint="10개 이하"
          tone={stats.lowStock > 0 ? "warning" : "default"}
        />
        <StatCard
          label="품절"
          value={String(stats.outOfStock)}
          tone={stats.outOfStock > 0 ? "danger" : "default"}
        />
      </div>

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">상품 · 재고</TabsTrigger>
          <TabsTrigger value="orders">주문</TabsTrigger>
          <TabsTrigger value="promotions">프로모션</TabsTrigger>
          <TabsTrigger value="settings">매장 설정</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-5">
          <InventoryTable
            regionId={region.id}
            currency={region.currency}
            products={products}
            catalog={catalog}
          />
        </TabsContent>

        <TabsContent value="orders" className="mt-5">
          <OrdersList orders={orders} currency={region.currency} />
        </TabsContent>

        <TabsContent value="promotions" className="mt-5">
          <PromotionsManager regionId={region.id} currency={region.currency} promotions={promotions} />
        </TabsContent>

        <TabsContent value="settings" className="mt-5">
          <StoreSettingsForm region={region} />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
