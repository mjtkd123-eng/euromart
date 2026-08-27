"use client"

import { useEffect, useState } from "react"
import {
  Globe,
  Minus,
  Package,
  Plus,
  Scale,
  ShoppingCart,
  Snowflake,
  Thermometer,
  Truck,
  Zap,
} from "lucide-react"
import { useEuromart } from "@/lib/euromart-context"
import { formatPrice } from "@/lib/storesData"
import { FX_BASE, formatConverted } from "@/lib/fx-shared"
import {
  allergenKeys,
  detailContentKeys,
  originKey,
  priceInfo,
  STORAGE_LABEL_KEY,
  storageType,
} from "@/lib/product-detail"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

/** 보관 타입별 아이콘 */
const STORAGE_ICON = {
  frozen: Snowflake,
  cold: Thermometer,
  ambient: Package,
} as const

/**
 * 상품 상세 오버레이.
 * PC에서는 좌(이미지)/우(정보) 2분할, 모바일에서는 위아래로 쌓입니다.
 * 상세 필드는 lib/product-detail.ts에서 카테고리·ID 기반으로 유도합니다.
 */
export function ProductDetailDialog() {
  const {
    detailProduct: product,
    closeProductDetail,
    region,
    fxRates,
    lang,
    t,
    productName,
    addItem,
    setQuantity,
    getQuantity,
    setCartOpen,
  } = useEuromart()

  const [qty, setQty] = useState(1)

  // 다른 상품을 열 때마다 수량을 1로 초기화합니다.
  useEffect(() => {
    setQty(1)
  }, [product?.id])

  if (!product) return null

  const primaryName = productName(product)
  const secondaryName = lang === "ko" ? product.nameEn : product.nameKo
  const price = priceInfo(product, region.currency)
  const approx = formatConverted(price.salePrice, region.currency.code, FX_BASE, fxRates)

  const storage = storageType(product.category)
  const StorageIcon = STORAGE_ICON[storage]
  const allergens = allergenKeys(product.category)
  const content = detailContentKeys(product.category)

  function addToCart() {
    if (!product) return
    setQuantity(product.id, getQuantity(product.id) + qty)
  }

  function handleAddToCart() {
    addToCart()
    closeProductDetail()
    setCartOpen(true)
  }

  function handleBuyNow() {
    addToCart()
    closeProductDetail()
    setCartOpen(true)
  }

  const summaryRows = [
    {
      icon: StorageIcon,
      label: t("storageMethod"),
      value: t(STORAGE_LABEL_KEY[storage]),
      /** 보관 방법은 EU 콜드체인 준수를 위한 핵심 정보이므로 빨간색으로 강조합니다. */
      accent: true,
    },
    { icon: Scale, label: t("capacityWeight"), value: product.unit, accent: false },
    { icon: Globe, label: t("originLabel"), value: t(originKey(product.category)), accent: false },
  ]

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && closeProductDetail()}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto rounded-3xl p-0">
        <div className="grid gap-0 md:grid-cols-2">
          {/* --- 좌측: 상품 이미지 --- */}
          <div className="relative aspect-square bg-muted md:aspect-auto md:min-h-[420px]">
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.nameEn}
              className="size-full object-cover md:rounded-l-3xl"
            />
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              {price.hasDiscount && (
                <span className="rounded-full bg-destructive px-2.5 py-1 text-xs font-black text-white">
                  -{price.discountPercent}%
                </span>
              )}
              {product.featured && (
                <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
                  {t("featured")}
                </span>
              )}
            </div>
            {product.outOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <span className="rounded-full bg-foreground px-4 py-1.5 text-sm font-bold text-background">
                  {t("soldOut")}
                </span>
              </div>
            )}
          </div>

          {/* --- 우측: 상품 정보 --- */}
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex flex-col gap-1 pr-8">
              <span className="text-xs font-semibold text-muted-foreground">{product.brand}</span>
              <DialogTitle className="break-keep text-balance text-xl font-black leading-snug sm:text-2xl">
                {primaryName}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {secondaryName}
              </DialogDescription>
            </div>

            {/* 가격 / 할인 */}
            <div className="flex flex-col gap-1.5 border-y border-border py-4">
              {price.hasDiscount && (
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-destructive">
                    {price.discountPercent}%
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(price.regularPrice, region.currency)}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-3xl font-black text-foreground">
                  {formatPrice(price.salePrice, region.currency)}
                </span>
                {approx && (
                  <span className="text-sm font-medium text-muted-foreground">≈ {approx}</span>
                )}
              </div>
              <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Truck className="size-3.5" aria-hidden="true" />
                {t("freeShipBadge", {
                  amount: formatPrice(region.freeDeliveryOver, region.currency),
                })}
              </span>
            </div>

            {/* 핵심 요약 박스 */}
            <dl className="flex flex-col gap-2.5 rounded-2xl bg-muted/50 p-4">
              {summaryRows.map(({ icon: Icon, label, value, accent }) => (
                <div key={label} className="flex items-center gap-3">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                      accent ? "bg-destructive/10 text-destructive" : "bg-background text-foreground"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-2">
                    <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                    <dd
                      className={`break-keep text-sm font-bold ${
                        accent ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>

            {/* 수량 + 액션 */}
            <div className="mt-auto flex flex-col gap-3 pt-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-foreground">{t("quantityLabel")}</span>
                <div className="flex items-center gap-1.5 rounded-full border border-border bg-background p-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-full"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    aria-label={t("decreaseQty")}
                  >
                    <Minus className="size-4" aria-hidden="true" />
                  </Button>
                  <span className="min-w-8 text-center text-base font-black tabular-nums">
                    {qty}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-full"
                    onClick={() => setQty((q) => q + 1)}
                    aria-label={t("increaseQty")}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 flex-1 rounded-full border-primary text-base font-bold text-primary hover:bg-primary/5"
                  disabled={product.outOfStock}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="size-4" aria-hidden="true" />
                  {t("addToCart")}
                </Button>
                <Button
                  size="lg"
                  className="h-12 flex-1 rounded-full text-base font-bold"
                  disabled={product.outOfStock}
                  onClick={handleBuyNow}
                >
                  <Zap className="size-4" aria-hidden="true" />
                  {t("buyNow")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* --- 하단: 상세 설명 & 정보 --- */}
        <div className="flex flex-col gap-6 border-t border-border p-5 sm:p-6">
          <section className="flex flex-col gap-2">
            <h3 className="text-base font-black text-foreground">{t("productFeatures")}</h3>
            <p className="break-keep text-pretty text-sm leading-relaxed text-muted-foreground">
              {t(content.description)}
            </p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="flex flex-col gap-1.5 rounded-2xl border border-border p-4">
              <h4 className="text-sm font-black text-foreground">{t("tasteFlavor")}</h4>
              <p className="break-keep text-pretty text-sm leading-relaxed text-muted-foreground">
                {t(content.taste)}
              </p>
            </section>
            <section className="flex flex-col gap-1.5 rounded-2xl border border-border p-4">
              <h4 className="text-sm font-black text-foreground">{t("simpleRecipe")}</h4>
              <p className="break-keep text-pretty text-sm leading-relaxed text-muted-foreground">
                {t(content.recipe)}
              </p>
            </section>
          </div>

          {/* 원재료 및 알레르기 (EU 규정) */}
          <section className="flex flex-col gap-2.5 rounded-2xl bg-muted/50 p-4">
            <h3 className="text-base font-black text-foreground">{t("ingredientsAllergens")}</h3>
            <p className="break-keep text-pretty text-sm leading-relaxed text-foreground">
              {t(content.ingredients)}
            </p>
            <div className="flex flex-col gap-2 border-t border-border/70 pt-2.5">
              <p className="text-xs text-muted-foreground">{t("allergenIntro")}</p>
              {allergens.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground">{t("allergenContains")}:</span>
                  {allergens.map((key) => (
                    <span
                      key={key}
                      className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive"
                    >
                      {t(key)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-medium text-muted-foreground">{t("allergenNone")}</p>
              )}
            </div>
          </section>

          {/* 배송 및 반품 */}
          <section className="flex flex-col gap-2">
            <h3 className="text-base font-black text-foreground">{t("shippingReturns")}</h3>
            <p className="flex items-start gap-2 break-keep text-pretty text-sm leading-relaxed text-muted-foreground">
              <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {t("shippingInfo")}
            </p>
            <p className="break-keep text-pretty rounded-xl border border-border p-3 text-sm leading-relaxed text-muted-foreground">
              {t("returnPolicyDetail")}
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
