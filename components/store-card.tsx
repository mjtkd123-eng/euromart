"use client"

import Link from "next/link"
import Image from "next/image"
import { Star, Clock, Bike } from "lucide-react"
import type { Store } from "@/lib/types"
import { formatFt } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { localizeStoreName, localizeTag } from "@/lib/i18n"

export function StoreCard({ store }: { store: Store }) {
  const { lang, t } = useLanguage()
  const storeName = localizeStoreName(store, lang)
  return (
    <Link
      href={`/store/${store.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <Image
          src={store.coverImage || "/placeholder.svg"}
          alt={t.store.coverAlt(storeName)}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {!store.isOpen && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <span className="rounded-full bg-foreground px-3 py-1 text-sm font-semibold text-background">
              {t.common.closed}
            </span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex size-11 items-center justify-center overflow-hidden rounded-xl border-2 border-background bg-background shadow-sm">
          <Image
            src={store.logo || "/placeholder.svg"}
            alt={t.store.logoAlt(storeName)}
            width={44}
            height={44}
            className="size-full object-cover"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold leading-tight text-balance">{storeName}</h3>
            <p className="text-xs text-muted-foreground">{store.district}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 text-xs font-semibold text-accent-foreground">
            <Star className="size-3 fill-current" aria-hidden="true" />
            {store.rating.toFixed(1)}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5">
          {store.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-full font-normal">
              {localizeTag(tag, lang)}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {t.common.minutes(store.deliveryTimeMin)}
          </span>
          <span className="flex items-center gap-1">
            <Bike className="size-3.5" aria-hidden="true" />
            {t.common.deliveryFee} {formatFt(store.deliveryFee)}
          </span>
          <span className="ml-auto">
            {t.common.minShort} {formatFt(store.minOrder)}
          </span>
        </div>
      </div>
    </Link>
  )
}
