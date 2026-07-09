import { notFound } from "next/navigation"
import { getStoreBySlug, getStoreCategories, getStoreProducts, getStores } from "@/lib/queries"
import { StoreView } from "@/components/store-view"

export function generateStaticParams() {
  return getStores().map((s) => ({ slug: s.slug }))
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const store = getStoreBySlug(slug)
  if (!store) notFound()

  const categories = getStoreCategories(store.id)
  const products = getStoreProducts(store.id)

  return <StoreView store={store} categories={categories} products={products} />
}
