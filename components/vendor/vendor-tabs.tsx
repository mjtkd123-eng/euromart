"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type {
  CatalogOption,
  VendorListing,
  VendorOrder,
  VendorPromotion,
  VendorStats,
  VendorStore,
} from "@/lib/vendor-server"
import { DashboardSummary } from "./dashboard-summary"
import { ListingsManager } from "./listings-manager"
import { OrdersTable } from "./orders-table"
import { SettlementPanel } from "./settlement-panel"
import { PromotionsManager } from "./promotions-manager"
import { StoreSettingsForm } from "./store-settings-form"

interface Props {
  store: VendorStore
  listings: VendorListing[]
  catalog: CatalogOption[]
  promotions: VendorPromotion[]
  orders: VendorOrder[]
  stats: VendorStats
}

export function VendorTabs({ store, listings, catalog, promotions, orders, stats }: Props) {
  const [tab, setTab] = useState("summary")

  return (
    <Tabs value={tab} onValueChange={setTab} className="mt-5">
      <TabsList className="flex flex-wrap">
        <TabsTrigger value="summary">대시보드 요약</TabsTrigger>
        <TabsTrigger value="listings">내 상품 · 재고 관리</TabsTrigger>
        <TabsTrigger value="orders">실시간 주문 접수</TabsTrigger>
        <TabsTrigger value="settlement">정산 관리</TabsTrigger>
        <TabsTrigger value="promotions">프로모션</TabsTrigger>
        <TabsTrigger value="store">매장 설정</TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="pt-4">
        <DashboardSummary
          store={store}
          listings={listings}
          orders={orders}
          stats={stats}
          onNavigate={setTab}
        />
      </TabsContent>
      <TabsContent value="listings" className="pt-4">
        <ListingsManager store={store} listings={listings} catalog={catalog} />
      </TabsContent>
      <TabsContent value="orders" className="pt-4">
        <OrdersTable store={store} orders={orders} />
      </TabsContent>
      <TabsContent value="settlement" className="pt-4">
        <SettlementPanel store={store} orders={orders} />
      </TabsContent>
      <TabsContent value="promotions" className="pt-4">
        <PromotionsManager store={store} promotions={promotions} />
      </TabsContent>
      <TabsContent value="store" className="pt-4">
        <StoreSettingsForm store={store} />
      </TabsContent>
    </Tabs>
  )
}
