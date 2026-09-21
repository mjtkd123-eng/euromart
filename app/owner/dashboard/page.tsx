import type { Metadata } from "next"
import { requireStoreOwner } from "@/lib/auth"
import { getVendorDashboard } from "@/lib/vendor-server"
import { formatPrice } from "@/lib/storesData"
import { DashboardShell, StatStrip } from "@/components/dashboard/dashboard-shell"
import { VendorTabs } from "@/components/vendor/vendor-tabs"

export const metadata: Metadata = {
  title: "업주 대시보드 · K-EuroMart",
  description: "자기 매장의 상품, 세일 이벤트, 주문, 정산을 관리합니다.",
}

export const dynamic = "force-dynamic"

export default async function OwnerDashboardPage() {
  const profile = await requireStoreOwner("/owner/dashboard")
  const data = await getVendorDashboard(profile.id)

  if (!data) {
    return (
      <DashboardShell
        eyebrow="업주 파트너"
        title="배정된 매장 없음"
        subtitle="승인 후 매장이 연결되면 이곳에서 재고·세일·주문을 관리할 수 있습니다."
        email={profile.email}
      >
        <p className="rounded-xl border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          아직 담당 매장이 없습니다. 본부 승인 또는 매장 배정을 기다려 주세요.
        </p>
      </DashboardShell>
    )
  }

  const { store, listings, catalog, promotions, orders, stats } = data

  return (
    <DashboardShell
      eyebrow={`${store.city} · ${store.countryCode}`}
      title={`K-EuroMart [${store.storeKo}] 점주님 환영합니다`}
      subtitle={`${store.storeEn} — 오늘의 주문과 매출, 재고, 정산을 매장 카운터에서 빠르게 확인하세요.`}
      email={profile.email}
    >
      <StatStrip
        items={[
          { label: "오늘 주문", value: String(stats.todayOrderCount), hint: "자정 이후 접수" },
          { label: "오늘 매출", value: formatPrice(stats.todayRevenue, store.currency), hint: "취소 제외" },
          {
            label: "처리 대기",
            value: String(stats.openOrderCount),
            hint: "포장·호출 대기",
            alert: stats.openOrderCount > 0,
          },
          {
            label: "재고 부족",
            value: String(stats.lowStock),
            hint: "10개 이하",
            alert: stats.lowStock > 0,
          },
        ]}
      />

      <VendorTabs
        store={store}
        listings={listings}
        catalog={catalog}
        promotions={promotions}
        orders={orders}
        stats={stats}
      />
    </DashboardShell>
  )
}
