"use client"

import { MapPin, Truck, ChevronRight, Store } from "lucide-react"
import { useEuromart } from "@/lib/euromart-context"
import { formatPrice, type Region } from "@/lib/storesData"

function StorePickCard({ store }: { store: Region }) {
  const { openStore } = useEuromart()

  return (
    <button
      type="button"
      onClick={() => openStore(store.id)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <img
          src={store.hero.image || "/placeholder.svg"}
          alt=""
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex size-11 items-center justify-center rounded-xl border-2 border-background bg-background text-xs font-black text-primary shadow-sm">
          {store.countryCode}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-bold leading-tight text-foreground">{store.store.ko}</h3>
            <p className="truncate text-xs text-muted-foreground">
              {store.store.en} · {store.city}
            </p>
          </div>
          <ChevronRight
            className="mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
            <MapPin className="size-3" aria-hidden="true" />
            {store.city}, {store.country}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
            <Truck className="size-3" aria-hidden="true" />
            {formatPrice(store.deliveryFee, store.currency)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
            {store.products.length}개 상품
          </span>
        </div>
      </div>
    </button>
  )
}

export function StoreGrid() {
  const { storesInCountry, countries, countryCode, searchQuery } = useEuromart()
  const countryName = countries.find((c) => c.code === countryCode)?.name ?? ""

  const q = searchQuery.trim().toLowerCase()
  const filtered = !q
    ? storesInCountry
    : storesInCountry.filter(
        (s) =>
          s.store.ko.toLowerCase().includes(q) ||
          s.store.en.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q),
      )

  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
          <Store className="size-5 text-primary" aria-hidden="true" />
          {countryName} 지역 매장
        </h2>
        <span className="text-sm text-muted-foreground">{filtered.length}개 매장</span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <Store className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">이 지역에 등록된 매장이 없습니다</p>
          <p className="text-xs text-muted-foreground">다른 국가를 선택해 보세요.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((store) => (
            <StorePickCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </section>
  )
}
