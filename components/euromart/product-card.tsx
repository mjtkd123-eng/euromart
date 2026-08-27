"use client"

import { Plus, Minus } from "lucide-react"
import { useEuromart } from "@/lib/euromart-context"
import { formatPrice, type ResolvedProduct } from "@/lib/storesData"
import { FX_BASE, formatConverted } from "@/lib/fx-shared"
import { Button } from "@/components/ui/button"

export function ProductCard({ product }: { product: ResolvedProduct }) {
  const { region, addItem, setQuantity, getQuantity, fxRates, lang, t, productName } = useEuromart()
  const qty = getQuantity(product.id)
  const primaryName = productName(product)
  // 보조 표기 — 한국어 화면에서는 영문명을, 그 외에는 한글 원명을 함께 보여줍니다.
  const secondaryName = lang === "ko" ? product.nameEn : product.nameKo
  // 현지 통화가 기준 통화와 다를 때만 참고용 환산가를 함께 보여줍니다.
  const approx = formatConverted(product.price, region.currency.code, FX_BASE, fxRates)

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.nameEn}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.featured && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            {t("featured")}
          </span>
        )}
        {product.outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <span className="rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background">
              {t("soldOut")}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-[11px] font-medium text-muted-foreground">{product.brand}</span>
        <h3 className="text-pretty text-sm font-bold leading-snug text-foreground">{primaryName}</h3>
        <p className="text-xs text-muted-foreground">{secondaryName}</p>
        <p className="text-[11px] text-muted-foreground">{product.unit}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="flex flex-col leading-tight">
            <span className="text-base font-black text-foreground">
              {formatPrice(product.price, region.currency)}
            </span>
            {approx && <span className="text-[11px] font-medium text-muted-foreground">{approx}</span>}
          </span>

          {qty === 0 ? (
            <Button
              size="sm"
              className="h-9 rounded-full px-3"
              disabled={product.outOfStock}
              onClick={() => addItem(product.id)}
              aria-label={t("addNamedToCart", { name: primaryName })}
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("addToCart")}
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-background p-0.5">
              <Button
                size="icon"
                variant="ghost"
                className="size-7 rounded-full"
                onClick={() => setQuantity(product.id, qty - 1)}
                aria-label={t("decreaseQty")}
              >
                <Minus className="size-3.5" aria-hidden="true" />
              </Button>
              <span className="min-w-5 text-center text-sm font-bold tabular-nums">{qty}</span>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 rounded-full"
                onClick={() => setQuantity(product.id, qty + 1)}
                aria-label={t("increaseQty")}
              >
                <Plus className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
