"use client"

import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatFt } from "@/lib/format"

/** 마트 상세 하단에 뜨는 스티키 장바구니 요약 바 */
export function CartBar() {
  const { itemCount, subtotal } = useCart()

  if (itemCount === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/cart"
          className="pointer-events-auto flex items-center justify-between gap-4 rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-lg transition-transform hover:scale-[1.01]"
        >
          <span className="flex items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary-foreground/20 text-sm font-bold">
              {itemCount}
            </span>
            장바구니 보기
          </span>
          <span className="flex items-center gap-2 font-black">
            {formatFt(subtotal)}
            <ShoppingBag className="size-5" aria-hidden="true" />
          </span>
        </Link>
      </div>
    </div>
  )
}
