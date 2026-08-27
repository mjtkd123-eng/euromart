"use client"

import { EuromartProvider, type CurrentUser } from "@/lib/euromart-context"
import type { Region } from "@/lib/storesData"
import type { FxRateMap } from "@/lib/fx-shared"
import { EuromartHeader } from "./euromart-header"
import { EuromartHero } from "./euromart-hero"
import { CategoryFilter } from "./category-filter"
import { ProductGrid } from "./product-grid"
import { CartDrawer } from "./cart-drawer"
import { FloatingCart } from "./floating-cart"
import { EuromartFooter } from "./euromart-footer"
import { AuthPromptDialog } from "./auth-prompt-dialog"

export function EuromartApp({
  regions,
  user,
  fxRates,
}: {
  regions: Region[]
  user: CurrentUser | null
  fxRates: FxRateMap
}) {
  return (
    <EuromartProvider initialRegions={regions} user={user} fxRates={fxRates}>
      <div className="flex min-h-screen flex-col bg-background">
        <EuromartHeader />
        <main className="flex-1 pb-24">
          <EuromartHero />
          <CategoryFilter />
          <ProductGrid />
        </main>
        <EuromartFooter />
        <CartDrawer />
        <FloatingCart />
        <AuthPromptDialog />
      </div>
    </EuromartProvider>
  )
}
