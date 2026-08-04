import { SiteHeader } from "@/components/site-header"
import { CategoryNav } from "@/components/category-nav"
import { HomeView } from "@/components/home-view"
import { CookieConsent } from "@/components/cookie-consent"
import { getStores, getCategories } from "@/lib/queries"

export default function Page() {
  const stores = getStores()
  const categories = getCategories()

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <CategoryNav />
      <HomeView stores={stores} categories={categories} />
      <CookieConsent />
    </main>
  )
}
