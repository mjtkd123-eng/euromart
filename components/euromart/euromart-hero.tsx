"use client"

import { Truck, Store } from "lucide-react"
import { useEuromart } from "@/lib/euromart-context"
import { formatPrice } from "@/lib/storesData"

export function EuromartHero() {
  const { region } = useEuromart()

  return (
    <section className="mx-auto max-w-6xl px-4 pt-6">
      <div className="relative overflow-hidden rounded-3xl border border-border">
        {/* 배경 이미지 */}
        <img
          src={region.hero.image || "/placeholder.svg"}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/55 to-transparent" />

        <div className="relative flex flex-col gap-4 p-6 sm:p-10 lg:p-14">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-bold text-primary">
            <Store className="size-3.5" aria-hidden="true" />
            {region.store.ko} · {region.store.en}
          </span>

          <h1 className="max-w-xl break-keep text-balance text-3xl font-black leading-tight text-background sm:text-4xl lg:text-5xl">
            {region.hero.title.ko}
          </h1>
          <p className="max-w-lg break-keep text-pretty text-sm text-background/85 sm:text-base">
            {region.hero.title.en} — {region.hero.subtitle.ko}
          </p>

          <div className="mt-2 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-background/90 px-3.5 py-2 text-sm font-semibold text-foreground">
              <Truck className="size-4 text-primary" aria-hidden="true" />
              {formatPrice(region.freeDeliveryOver, region.currency)} 이상 무료배송
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-background/90 px-3.5 py-2 text-sm font-semibold text-foreground">
              기본 배송비 {formatPrice(region.deliveryFee, region.currency)}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
