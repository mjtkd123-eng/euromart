"use client"

import { ShoppingBag } from "lucide-react"
import { useEuromart } from "@/lib/euromart-context"
import { formatPrice } from "@/lib/storesData"

export function FloatingCart() {
  const { region, itemCount, subtotal, setCartOpen, cartOpen } = useEuromart()

  if (itemCount === 0 || cartOpen) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <button
        onClick={() => setCartOpen(true)}
        className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-xl transition-transform hover:scale-[1.02] active:scale-100"
        aria-label={`장바구니 열기, ${itemCount}개 상품, 합계 ${formatPrice(subtotal, region.currency)}`}
      >
        <span className="relative flex size-9 items-center justify-center rounded-full bg-primary-foreground/20">
          <ShoppingBag className="size-5" aria-hidden="true" />
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-background text-[11px] font-black text-primary">
            {itemCount}
          </span>
        </span>
        <span className="text-sm font-bold">장바구니 보기</span>
        <span className="ml-auto text-base font-black">{formatPrice(subtotal, region.currency)}</span>
      </button>
    </div>
  )
}
