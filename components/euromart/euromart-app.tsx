"use client"

import { EuromartProvider } from "@/lib/euromart-context"
import { EuromartHeader } from "./euromart-header"
import { EuromartHero } from "./euromart-hero"
import { CategoryFilter } from "./category-filter"
import { ProductGrid } from "./product-grid"
import { CartDrawer } from "./cart-drawer"
import { FloatingCart } from "./floating-cart"
import { EuromartFooter } from "./euromart-footer"

export function EuromartApp() {
  return (
    <EuromartProvider>
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
      </div>
    </EuromartProvider>
  )
}
