"use client"

import Image from "next/image"
import { Plus, Minus } from "lucide-react"
import type { StoreProductView } from "@/lib/types"
import { formatFt } from "@/lib/format"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"

export function ProductRow({ product }: { product: StoreProductView }) {
  const { addItem, setQuantity, getQuantity, setPending } = useCart()
  const quantity = getQuantity(product.storeProductId)

  function handleAdd() {
    const { needsSwitch } = addItem(product)
    if (needsSwitch) setPending({ product })
  }

  return (
    <div className="flex gap-3 py-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
        <Image
          src={product.imageUrl || "/placeholder.svg"}
          alt={product.nameKo}
          fill
          sizes="80px"
          className={`object-cover ${!product.inStock ? "opacity-40 grayscale" : ""}`}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-tight">{product.nameKo}</h3>
            <p className="truncate text-xs text-muted-foreground">
              {product.nameHu} · {product.brand}
            </p>
          </div>
          {product.isFeatured && product.inStock && (
            <span className="shrink-0 rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
              인기
            </span>
          )}
        </div>

        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {product.unit} · {product.description}
        </p>

        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="text-base font-black text-foreground">{formatFt(product.price)}</span>

          {!product.inStock ? (
            <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">품절</span>
          ) : quantity === 0 ? (
            <Button size="sm" variant="outline" className="h-9 gap-1 rounded-full" onClick={handleAdd}>
              <Plus className="size-4" aria-hidden="true" />
              담기
            </Button>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-border bg-card p-0.5">
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-full"
                onClick={() => setQuantity(product.storeProductId, quantity - 1)}
                aria-label={`${product.nameKo} 수량 줄이기`}
              >
                <Minus className="size-4" aria-hidden="true" />
              </Button>
              <span className="w-5 text-center text-sm font-bold tabular-nums">{quantity}</span>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-full"
                onClick={() => setQuantity(product.storeProductId, quantity + 1)}
                aria-label={`${product.nameKo} 수량 늘리기`}
              >
                <Plus className="size-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
