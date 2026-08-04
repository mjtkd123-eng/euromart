"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Star, Clock, Bike, ChevronLeft, ShoppingBasket } from "lucide-react"
import type { Store, Category, StoreProductView } from "@/lib/types"
import { formatFt } from "@/lib/format"
import { useCart } from "@/lib/cart-context"
import { CategoryIcon } from "@/components/category-icon"
import { ProductRow } from "@/components/product-row"
import { CartBar } from "@/components/cart-bar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { localizeCategory, localizeStoreName, localizeStoreDesc } from "@/lib/i18n"

interface Props {
  store: Store
  categories: Category[]
  products: StoreProductView[]
}

export function StoreView({ store, categories, products }: Props) {
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const { pending, setPending, confirmSwitch } = useCart()
  const { lang, t } = useLanguage()
  const storeName = localizeStoreName(store, lang)

  const visible = useMemo(
    () => (activeCat ? products.filter((p) => p.categoryId === activeCat) : products),
    [products, activeCat],
  )

  // 카테고리별 그룹화 (전체 보기일 때 섹션 헤더 표시)
  const grouped = useMemo(() => {
    const map = new Map<string, StoreProductView[]>()
    for (const p of visible) {
      const arr = map.get(p.categoryId) ?? []
      arr.push(p)
      map.set(p.categoryId, arr)
    }
    return map
  }, [visible])

  return (
    <div className="relative min-h-screen bg-background pb-28">
      {/* 커버 */}
      <div className="relative h-48 w-full overflow-hidden sm:h-64">
        <Image
          src={store.coverImage || "/placeholder.svg"}
          alt={t.store.coverAlt(storeName)}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
        <div className="absolute inset-x-0 top-0 p-4">
          <Button asChild size="icon" variant="secondary" className="rounded-full shadow-sm">
            <Link href="/" aria-label={t.store.homeAria}>
              <ChevronLeft className="size-5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 마트 정보 */}
      <div className="mx-auto max-w-3xl px-4">
        <div className="-mt-10 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="relative -mt-12 size-20 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-muted shadow-sm">
              <Image src={store.logo || "/placeholder.svg"} alt={t.store.logoAlt(storeName)} fill sizes="80px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black">{storeName}</h1>
                {store.isOpen ? (
                  <Badge className="rounded-full bg-chart-3 text-white">{t.common.open}</Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-full">{t.common.closed}</Badge>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground text-pretty">{localizeStoreDesc(store, lang)}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="flex items-center gap-1 font-semibold">
              <Star className="size-4 fill-primary text-primary" aria-hidden="true" />
              {store.rating.toFixed(1)}
              <span className="font-normal text-muted-foreground">({store.ratingCount})</span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="size-4" aria-hidden="true" />
              {t.common.minutes(store.deliveryTimeMin)}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Bike className="size-4" aria-hidden="true" />
              {t.common.deliveryFee} {formatFt(store.deliveryFee)}
            </span>
            <span className="text-muted-foreground">· {t.common.minOrder} {formatFt(store.minOrder)}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{store.address}</p>
        </div>

        {/* 카테고리 탭 (스티키) */}
        <div className="sticky top-16 z-30 -mx-4 mt-4 bg-background/95 px-4 py-2 backdrop-blur">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setActiveCat(null)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCat === null ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
              }`}
            >
              {t.common.all}
            </button>
            {categories.map((cat) => {
              const active = activeCat === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(active ? null : cat.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <CategoryIcon icon={cat.icon} className="size-4" />
                  {localizeCategory(cat, lang)}
                </button>
              )
            })}
          </div>
        </div>

        {/* 상품 목록 */}
        <div className="mt-2 pb-8">
          {[...grouped.entries()].map(([catId, items]) => {
            const cat = categories.find((c) => c.id === catId)
            return (
              <section key={catId} className="border-t border-border first:border-t-0">
                {cat && (
                  <h2 className="flex items-center gap-2 pb-1 pt-5 text-sm font-bold text-muted-foreground">
                    <CategoryIcon icon={cat.icon} className="size-4" />
                    {localizeCategory(cat, lang)}
                  </h2>
                )}
                <div className="divide-y divide-border">
                  {items.map((p) => (
                    <ProductRow key={p.storeProductId} product={p} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      <CartBar />

      {/* 다른 마트 담기 확인 다이얼로그 */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <ShoppingBasket className="size-5" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold">{t.store.switchTitle}</h3>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              {t.store.switchBody}
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPending(null)}>
                {t.store.cancel}
              </Button>
              <Button className="flex-1" onClick={() => confirmSwitch(pending.product)}>
                {t.store.clearAndAdd}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
