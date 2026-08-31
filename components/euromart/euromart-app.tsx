"use client"

import { EuromartProvider, useEuromart, type CurrentUser } from "@/lib/euromart-context"
import type { Region } from "@/lib/storesData"
import type { FxRateMap } from "@/lib/fx-shared"
import { EuromartHeader } from "./euromart-header"
import { EuromartHero } from "./euromart-hero"
import { CategoryFilter } from "./category-filter"
import { ProductGrid } from "./product-grid"
import { StoreGrid } from "./store-grid"
import { CartDrawer } from "./cart-drawer"
import { FloatingCart } from "./floating-cart"
import { EuromartFooter } from "./euromart-footer"
import { AuthPromptDialog } from "./auth-prompt-dialog"
import { SignUpModal } from "./sign-up-modal"
import { ProductDetailDialog } from "./product-detail-dialog"

function EuromartMain() {
  const { browseMode } = useEuromart()

  return (
    <main className="flex-1 pb-24">
      <EuromartHero />
      {browseMode === "stores" ? (
        <StoreGrid />
      ) : (
        <>
          <CategoryFilter />
          <ProductGrid />
        </>
      )}
    </main>
  )
}

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
        <EuromartMain />
        <EuromartFooter />
        <CartDrawer />
        <FloatingCart />
        <AuthPromptDialog />
        <SignUpModal />
        <ProductDetailDialog />
      </div>
    </EuromartProvider>
  )
}
