"use client"

import { Truck, Store, ArrowLeft } from "lucide-react"
import { useEuromart } from "@/lib/euromart-context"
import { formatPrice } from "@/lib/storesData"

export function EuromartHero() {
  const { region, browseMode, countries, countryCode, storesInCountry, backToStores, t, storeName, cityName } =
    useEuromart()
  const countryName = countries.find((c) => c.code === countryCode)?.name ?? region.country

  if (browseMode === "stores") {
    const cover = storesInCountry[0]?.hero.image || region.hero.image || "/placeholder.svg"
    return (
      <section className="mx-auto max-w-6xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-3xl border border-border">
          <img src={cover} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/55 to-transparent" />

          <div className="relative flex flex-col gap-4 p-6 sm:p-10 lg:p-14">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-bold text-primary">
              <Store className="size-3.5" aria-hidden="true" />
              {countryName} · {storesInCountry.length} stores
            </span>

            <h1 className="max-w-xl text-balance text-3xl font-black leading-tight text-background sm:text-4xl lg:text-5xl">
              {countryName}의 한인 마트를 선택하세요
            </h1>
            <p className="max-w-lg text-pretty text-sm text-background/85 sm:text-base">
              Choose a Korean grocery store in {countryName} — 매장을 고르면 상품 목록이 열립니다.
            </p>
          </div>
        </div>
      </section>
    )
  }

  // 상품 화면 배너 문구는 선택 언어와 현재 매장 도시에 따라 조립됩니다.
  const title = t("heroTitle", { city: cityName(region) })
  const subtitle = t("heroSubtitle", { store: storeName(region) })

  return (
    <section className="mx-auto max-w-6xl px-4 pt-6">
      <div className="relative overflow-hidden rounded-3xl border border-border">
        <img
          src={region.hero.image || "/placeholder.svg"}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/55 to-transparent" />

        <div className="relative flex flex-col gap-4 p-6 sm:p-10 lg:p-14">
          <button
            type="button"
            onClick={backToStores}
            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-bold text-primary transition-colors hover:bg-background"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {countryName} 매장 목록
          </button>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-bold text-foreground">
            <Store className="size-3.5 text-primary" aria-hidden="true" />
            {storeName(region)}
          </span>

          <h1 className="max-w-xl break-keep text-balance text-3xl font-black leading-tight text-background sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="max-w-lg break-keep text-pretty text-sm text-background/85 sm:text-base">{subtitle}</p>

          <div className="mt-2 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-background/90 px-3.5 py-2 text-sm font-semibold text-foreground">
              <Truck className="size-4 text-primary" aria-hidden="true" />
              {t("freeDeliveryOver", {
                amount: formatPrice(region.freeDeliveryOver, region.currency),
              })}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-background/90 px-3.5 py-2 text-sm font-semibold text-foreground">
              {t("baseDeliveryFee", { amount: formatPrice(region.deliveryFee, region.currency) })}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
