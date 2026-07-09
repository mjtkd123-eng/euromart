import { SiteHeader } from "@/components/site-header"
import { HomeView } from "@/components/home-view"
import { getStores, getCategories } from "@/lib/queries"

export default function Page() {
  const stores = getStores()
  const categories = getCategories()

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <HomeView stores={stores} categories={categories} />
    </main>
  )
}
