import { SiteHeader } from "@/components/site-header"
import { CartView } from "@/components/cart-view"

export default function CartPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <CartView />
    </main>
  )
}
